package main

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/golang-jwt/jwt/v5"
	"github.com/julienschmidt/httprouter"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

func getUserProfile(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	username := ps.ByName("username")
	var user User

	// Retrieve from database if not cached
	err := userCollection.FindOne(context.TODO(), bson.M{"username": username}).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			http.Error(w, "User not found", http.StatusNotFound)
			log.Printf("User not found: %s", username)
			return
		}
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("Error retrieving user: %v", err)
		return
	}

	// Prepare the user profile response
	var userProfile UserProfileResponse
	userProfile.UserID = user.UserID
	userProfile.Username = user.Username
	userProfile.Email = user.Email
	userProfile.Bio = user.Bio
	userProfile.ProfilePicture = user.ProfilePicture
	userProfile.SocialLinks = user.SocialLinks
	userProfile.Followers = len(user.Followers)
	userProfile.Follows = len(user.Follows)

	// Get the ID of the requesting user from the context
	requestingUserID, ok := r.Context().Value(userIDKey).(string)
	if ok {
		log.Printf("Requesting User ID: %s", requestingUserID)
		log.Printf("Target User Followers List: %v", user.Followers)

		// Check if the requesting user is following the target user
		userProfile.IsFollowing = contains(user.Followers, requestingUserID)
		log.Printf("Is Requesting User Following: %v", userProfile.IsFollowing)
	} else {
		log.Println("Requesting User ID not found in context")
	}

	log.Printf("User Profile Response: %+v", userProfile)

	// Send the response
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(userProfile)
}

func editProfile(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	tokenString := r.Header.Get("Authorization")
	claims := &Claims{}

	// Validate JWT token
	_, err := jwt.ParseWithClaims(tokenString[7:], claims, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse the multipart form (max size 10MB)
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, "Unable to parse form", http.StatusBadRequest)
		return
	}

	RdxDel("profile:" + claims.Username) // Delete cached profile
	// Prepare an update document
	update := bson.M{}

	// Retrieve and update fields from the form
	if username := r.FormValue("username"); username != "" {
		update["username"] = username
		_ = RdxHset("users", claims.UserID, username)
	}
	if email := r.FormValue("email"); email != "" {
		update["email"] = email
	}
	if bio := r.FormValue("bio"); bio != "" {
		update["bio"] = bio
	}
	if phoneNumber := r.FormValue("phone_number"); phoneNumber != "" {
		update["phone_number"] = phoneNumber
	}

	// Handle social links
	if socialLinks := r.FormValue("social_links"); socialLinks != "" {
		var links map[string]string
		if err := json.Unmarshal([]byte(socialLinks), &links); err == nil {
			update["social_links"] = links
		}
	}

	// Optional: handle password update
	if password := r.FormValue("password"); password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			http.Error(w, "Failed to hash password", http.StatusInternalServerError)
			return
		}
		update["password"] = string(hashedPassword)
	}

	// Initialize an update map to hold profile updates
	// update := make(map[string]interface{})

	// Handle profile picture upload
	if file, _, err := r.FormFile("profile_picture"); err == nil {
		defer file.Close()

		// Ensure the userpic directory exists
		if err := os.MkdirAll("./userpic", os.ModePerm); err != nil {
			log.Printf("Error creating userpic directory: %v", err)
			http.Error(w, "Failed to create userpic directory", http.StatusInternalServerError)
			return
		}

		// Save the file to a predefined location (adjust path and filename handling)
		out, err := os.Create("./userpic/" + claims.Username + ".jpg")
		if err != nil {
			log.Printf("Error creating file: %v", err)
			http.Error(w, "Failed to save profile picture", http.StatusInternalServerError)
			return
		}
		defer out.Close()

		// Copy the uploaded file to the destination
		if _, err := io.Copy(out, file); err != nil {
			http.Error(w, "Failed to save profile picture", http.StatusInternalServerError)
			return
		}

		// Update the profile picture field in the update map
		update["profile_picture"] = claims.Username + ".jpg"

		// Ensure the thumb directory exists
		if err := os.MkdirAll("./userpic/thumb", os.ModePerm); err != nil {
			log.Printf("Error creating thumbnail directory: %v", err)
			http.Error(w, "Failed to create thumbnail directory", http.StatusInternalServerError)
			return
		}

		// Create a thumbnail from the original image
		if err := createThumbnail("./userpic/"+claims.Username+".jpg", "./userpic/thumb/"+claims.UserID+".jpg"); err != nil {
			http.Error(w, "Failed to create thumbnail", http.StatusInternalServerError)
			return
		}
	}

	go createThumbnail("./userpic/"+claims.Username+".jpg", "./userpic/thumb/"+claims.UserID+".jpg")

	// // Ensure the thumb directory exists
	// if err := os.MkdirAll("./userpic/thumb", os.ModePerm); err != nil {
	// 	log.Printf("Error creating thumbnail directory: %v", err)
	// 	http.Error(w, "Failed to create thumbnail directory", http.StatusInternalServerError)
	// 	return
	// }

	// // Create a thumbnail from the original image
	// if err := createThumbnail("./userpic/"+claims.Username+".jpg", "./userpic/thumb/"+claims.UserID+".jpg"); err != nil {
	// 	http.Error(w, "Failed to create thumbnail", http.StatusInternalServerError)
	// 	return
	// }

	// Update the user in the database
	_, err = userCollection.UpdateOne(context.TODO(), bson.M{"username": claims.Username}, bson.M{"$set": update})
	if err != nil {
		http.Error(w, "Failed to update profile", http.StatusInternalServerError)
		return
	}
	var userProfile User
	// Retrieve the user by username
	err = userCollection.FindOne(context.TODO(), bson.M{"username": claims.Username}).Decode(&userProfile)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			http.Error(w, "User not found", http.StatusNotFound)
			log.Printf("User not found: %s", claims.Username)
			return
		}
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		log.Printf("Error retrieving user: %v", err)
		return
	}

	RdxDel("profile:" + claims.Username) // Delete cached profile
	w.WriteHeader(http.StatusOK)         // Send 204 No Content
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(userProfile)
}

func getProfile(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	tokenString := r.Header.Get("Authorization")
	claims := &Claims{}
	jwt.ParseWithClaims(tokenString[7:], claims, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})

	// Check Redis cache for profile
	cachedProfile, err := RdxGet("profile:" + claims.Username)
	if err == nil && cachedProfile != "" {
		// If cached, return it
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(cachedProfile))
		return
	}

	var user User
	err = userCollection.FindOne(context.TODO(), bson.M{"username": claims.Username}).Decode(&user)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		log.Printf("User not found: %s", claims.Username)
		return
	}

	user.Password = "" // Do not return the password
	userJSON, _ := json.Marshal(user)

	// Cache the profile in Redis
	RdxSet("profile:"+claims.Username, string(userJSON))

	json.NewEncoder(w).Encode(user)
}

func deleteProfile(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	userID := r.Context().Value(userIDKey).(string) // Get the user ID from context
	log.Println("beep: ", userID)

	// Invalidate the cached profile in Redis
	RdxDel("profile:" + userID)

	_, err := userCollection.DeleteOne(context.TODO(), bson.M{"userid": userID})
	if err != nil {
		http.Error(w, "Error deleting profile", http.StatusInternalServerError)
		log.Printf("Error deleting user profile: %v", err)
		return
	}

	log.Printf("User profile deleted: %s", userID)

	sendResponse(w, http.StatusOK, map[string]string{"": ""}, "Deletion successful", nil)
}
