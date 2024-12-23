package main

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/julienschmidt/httprouter"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

const (
	refreshTokenTTL = 7 * 24 * time.Hour // 7 days
	accessTokenTTL  = 15 * time.Minute   // 15 minutes
)

var (
	// tokenSigningAlgo = jwt.SigningMethodHS256
	jwtSecret = []byte("your_secret_key") // Replace with a secure secret key
)

// JWT claims
type Claims struct {
	Username string `json:"username"`
	UserID   string `json:"userId"`
	jwt.RegisteredClaims
}

func login(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	var user User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}
	fmt.Println("Login : JSON decode")
	// Look for the user in MongoDB by username
	var storedUser User
	err := userCollection.FindOne(context.TODO(), bson.M{"username": user.Username}).Decode(&storedUser)
	if err != nil {
		http.Error(w, "Invalid username or password", http.StatusUnauthorized)
		return
	}
	fmt.Println("Login : FindOneDecodeUser")

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(storedUser.Password), []byte(user.Password)); err != nil {
		http.Error(w, "Invalid username or password", http.StatusUnauthorized)
		return
	}
	fmt.Println("Login : Bcrypt")

	// Create JWT claims
	claims := &Claims{
		Username: storedUser.Username,
		UserID:   storedUser.UserID,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(accessTokenTTL)),
		},
	}
	tokenString, err := createToken(claims)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}
	fmt.Println("Login : tokenString")

	refreshToken, err := generateRefreshToken()
	if err != nil {
		http.Error(w, "Error generating refresh token", http.StatusInternalServerError)
		return
	}
	fmt.Println("Login : refreshToken")

	hashedRefreshToken := hashToken(refreshToken)
	_, err = userCollection.UpdateOne(
		context.TODO(),
		bson.M{"userid": storedUser.UserID},
		bson.M{"$set": bson.M{"refresh_token": hashedRefreshToken, "refresh_expiry": time.Now().Add(refreshTokenTTL)}},
	)
	if err != nil {
		http.Error(w, "Error storing refresh token", http.StatusInternalServerError)
		return
	}
	fmt.Println("Login : beforeSendResponse")

	sendResponse(w, http.StatusOK, map[string]string{"token": tokenString, "refreshToken": refreshToken, "userid": storedUser.UserID}, "Login successful", nil)
}

func register(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	var user User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}
	log.Printf("Registering user: %s", user.Username)

	// Check if user exists in database
	var existingUser User
	err := userCollection.FindOne(context.TODO(), bson.M{"username": user.Username}).Decode(&existingUser)
	if err == nil {
		http.Error(w, "User already exists", http.StatusConflict)
		return
	} else if err != mongo.ErrNoDocuments {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Failed to hash password", http.StatusInternalServerError)
		return
	}

	user.Password = string(hashedPassword)
	user.UserID = "u" + GenerateName(10)

	_, err = userCollection.InsertOne(context.TODO(), user)
	if err != nil {
		http.Error(w, "Failed to register user", http.StatusInternalServerError)
		return
	}

	sendResponse(w, http.StatusCreated, map[string]string{"username": user.Username}, "User registered successfully", nil)
}

type contextKey string

const userIDKey contextKey = "userId"

// // Authenticate middleware
// func authenticate(next httprouter.Handle) httprouter.Handle {
// 	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
// 		tokenString := r.Header.Get("Authorization")
// 		if tokenString == "" {
// 			http.Error(w, "Missing token", http.StatusUnauthorized)
// 			return
// 		}

// 		if len(tokenString) < 7 || tokenString[:7] != "Bearer " {
// 			http.Error(w, "Invalid token format", http.StatusUnauthorized)
// 			return
// 		}

// 		claims := &Claims{}
// 		token, err := jwt.ParseWithClaims(tokenString[7:], claims, func(token *jwt.Token) (interface{}, error) {
// 			return jwtSecret, nil
// 		})

// 		if err != nil || !token.Valid {
// 			http.Error(w, "Invalid token", http.StatusUnauthorized)
// 			return
// 		}

// 		// Store UserID in context
// 		ctx := context.WithValue(r.Context(), userIDKey, claims.UserID)
// 		next(w, r.WithContext(ctx), ps) // Call the next handler with new context
// 	}
// }

func logoutUser(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	tokenString := r.Header.Get("Authorization")
	if tokenString == "" {
		http.Error(w, "Missing token", http.StatusUnauthorized)
		return
	}

	if len(tokenString) < 7 || tokenString[:7] != "Bearer " {
		http.Error(w, "Invalid token format", http.StatusUnauthorized)
		return
	}

	// Extract the token and invalidate it in Redis
	tokenString = tokenString[7:]
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	// Remove token from Redis cache
	_, err = RdxHdel("tokki", claims.UserID)
	if err != nil {
		log.Printf("Error removing token from Redis: %v", err)
		http.Error(w, "Failed to log out", http.StatusInternalServerError)
		return
	}

	sendResponse(w, http.StatusOK, nil, "User logged out successfully", nil)
}

func refreshToken(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	tokenString := r.Header.Get("Authorization")
	if tokenString == "" {
		http.Error(w, "Missing token", http.StatusUnauthorized)
		return
	}

	if len(tokenString) < 7 || tokenString[:7] != "Bearer " {
		http.Error(w, "Invalid token format", http.StatusUnauthorized)
		return
	}

	tokenString = tokenString[7:]
	claims := &Claims{}
	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	if err != nil || !token.Valid {
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	// Ensure the token is not expired and refresh it
	if time.Until(claims.ExpiresAt.Time) < 30*time.Minute {
		claims.ExpiresAt = jwt.NewNumericDate(time.Now().Add(72 * time.Hour)) // Extend the expiration
		newToken := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
		newTokenString, err := newToken.SignedString(jwtSecret)
		if err != nil {
			http.Error(w, "Failed to refresh token", http.StatusInternalServerError)
			return
		}

		// Update the token in Redis
		err = RdxHset("tokki", claims.UserID, newTokenString)
		if err != nil {
			log.Printf("Error updating token in Redis: %v", err)
		}

		sendResponse(w, http.StatusOK, map[string]string{"token": newTokenString}, "Token refreshed successfully", nil)
	} else {
		http.Error(w, "Token refresh not allowed yet", http.StatusForbidden)
	}
}

// Generates a random refresh token
func generateRefreshToken() (string, error) {
	tokenBytes := make([]byte, 32)
	_, err := rand.Read(tokenBytes)
	if err != nil {
		return "", err
	}
	return hex.EncodeToString(tokenBytes), nil
}

// Hashes a given token
func hashToken(token string) string {
	hash := sha256.New()
	hash.Write([]byte(token))
	return hex.EncodeToString(hash.Sum(nil))
}

func authenticate(next httprouter.Handle) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		tokenString, err := extractToken(r)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}

		claims := &Claims{}
		token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), userIDKey, claims.UserID)
		next(w, r.WithContext(ctx), ps)
	}
}

func extractToken(r *http.Request) (string, error) {
	tokenString := r.Header.Get("Authorization")
	if tokenString == "" {
		return "", http.ErrNoCookie
	}

	if len(tokenString) < 7 || tokenString[:7] != "Bearer " {
		return "", http.ErrHandlerTimeout
	}

	return tokenString[7:], nil
}

func createToken(claims *Claims) (string, error) {
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(jwtSecret)
}
