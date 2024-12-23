package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

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

// func editProfile(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
// 	tokenString := r.Header.Get("Authorization")
// 	claims := &Claims{}

// 	// Validate JWT token
// 	_, err := jwt.ParseWithClaims(tokenString[7:], claims, func(token *jwt.Token) (interface{}, error) {
// 		return jwtSecret, nil
// 	})
// 	if err != nil {
// 		http.Error(w, "Unauthorized", http.StatusUnauthorized)
// 		return
// 	}

// 	// Parse the multipart form (max size 10MB)
// 	if err := r.ParseMultipartForm(10 << 20); err != nil {
// 		http.Error(w, "Unable to parse form", http.StatusBadRequest)
// 		return
// 	}

// 	RdxDel("profile:" + claims.Username) // Delete cached profile
// 	// Prepare an update document
// 	update := bson.M{}

// 	// Retrieve and update fields from the form
// 	if username := r.FormValue("username"); username != "" {
// 		update["username"] = username
// 		_ = RdxHset("users", claims.UserID, username)
// 	}
// 	if email := r.FormValue("email"); email != "" {
// 		update["email"] = email
// 	}
// 	if bio := r.FormValue("bio"); bio != "" {
// 		update["bio"] = bio
// 	}
// 	if phoneNumber := r.FormValue("phone_number"); phoneNumber != "" {
// 		update["phone_number"] = phoneNumber
// 	}

// 	// Optional: handle password update
// 	if password := r.FormValue("password"); password != "" {
// 		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
// 		if err != nil {
// 			http.Error(w, "Failed to hash password", http.StatusInternalServerError)
// 			return
// 		}
// 		update["password"] = string(hashedPassword)
// 	}

// 	// Initialize an update map to hold profile updates
// 	// update := make(map[string]interface{})

// 	// Handle profile picture upload
// 	if file, _, err := r.FormFile("profile_picture"); err == nil {
// 		defer file.Close()

// 		// Ensure the userpic directory exists
// 		if err := os.MkdirAll("./userpic", os.ModePerm); err != nil {
// 			log.Printf("Error creating userpic directory: %v", err)
// 			http.Error(w, "Failed to create userpic directory", http.StatusInternalServerError)
// 			return
// 		}

// 		// Save the file to a predefined location (adjust path and filename handling)
// 		out, err := os.Create("./userpic/" + claims.Username + ".jpg")
// 		if err != nil {
// 			log.Printf("Error creating file: %v", err)
// 			http.Error(w, "Failed to save profile picture", http.StatusInternalServerError)
// 			return
// 		}
// 		defer out.Close()

// 		// Copy the uploaded file to the destination
// 		if _, err := io.Copy(out, file); err != nil {
// 			http.Error(w, "Failed to save profile picture", http.StatusInternalServerError)
// 			return
// 		}

// 		// Update the profile picture field in the update map
// 		update["profile_picture"] = claims.Username + ".jpg"

// 		// Ensure the thumb directory exists
// 		if err := os.MkdirAll("./userpic/thumb", os.ModePerm); err != nil {
// 			log.Printf("Error creating thumbnail directory: %v", err)
// 			http.Error(w, "Failed to create thumbnail directory", http.StatusInternalServerError)
// 			return
// 		}

// 		// Create a thumbnail from the original image
// 		if err := createThumbnail("./userpic/"+claims.Username+".jpg", "./userpic/thumb/"+claims.UserID+".jpg"); err != nil {
// 			http.Error(w, "Failed to create thumbnail", http.StatusInternalServerError)
// 			return
// 		}
// 	}

// 	go createThumbnail("./userpic/"+claims.Username+".jpg", "./userpic/thumb/"+claims.UserID+".jpg")

// 	// // Ensure the thumb directory exists
// 	// if err := os.MkdirAll("./userpic/thumb", os.ModePerm); err != nil {
// 	// 	log.Printf("Error creating thumbnail directory: %v", err)
// 	// 	http.Error(w, "Failed to create thumbnail directory", http.StatusInternalServerError)
// 	// 	return
// 	// }

// 	// // Create a thumbnail from the original image
// 	// if err := createThumbnail("./userpic/"+claims.Username+".jpg", "./userpic/thumb/"+claims.UserID+".jpg"); err != nil {
// 	// 	http.Error(w, "Failed to create thumbnail", http.StatusInternalServerError)
// 	// 	return
// 	// }

// 	// Update the user in the database
// 	_, err = userCollection.UpdateOne(context.TODO(), bson.M{"username": claims.Username}, bson.M{"$set": update})
// 	if err != nil {
// 		http.Error(w, "Failed to update profile", http.StatusInternalServerError)
// 		return
// 	}
// 	var userProfile User
// 	// Retrieve the user by username
// 	err = userCollection.FindOne(context.TODO(), bson.M{"username": claims.Username}).Decode(&userProfile)
// 	if err != nil {
// 		if err == mongo.ErrNoDocuments {
// 			http.Error(w, "User not found", http.StatusNotFound)
// 			log.Printf("User not found: %s", claims.Username)
// 			return
// 		}
// 		http.Error(w, "Internal server error", http.StatusInternalServerError)
// 		log.Printf("Error retrieving user: %v", err)
// 		return
// 	}

// 	RdxDel("profile:" + claims.Username) // Delete cached profile
// 	w.WriteHeader(http.StatusOK)         // Send 204 No Content
// 	w.Header().Set("Content-Type", "application/json")
// 	json.NewEncoder(w).Encode(userProfile)
// }

// func updateProfileFields(w http.ResponseWriter, r *http.Request, claims *Claims) (bson.M, error) {
// 	update := bson.M{}

// 	// Retrieve and update fields from the form
// 	if username := r.FormValue("username"); username != "" {
// 		update["username"] = username
// 		_ = RdxHset("users", claims.UserID, username)
// 	}
// 	if email := r.FormValue("email"); email != "" {
// 		update["email"] = email
// 	}
// 	if bio := r.FormValue("bio"); bio != "" {
// 		update["bio"] = bio
// 	}
// 	if phoneNumber := r.FormValue("phone_number"); phoneNumber != "" {
// 		update["phone_number"] = phoneNumber
// 	}

// 	// Optional: handle password update
// 	if password := r.FormValue("password"); password != "" {
// 		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
// 		if err != nil {
// 			http.Error(w, "Failed to hash password", http.StatusInternalServerError)
// 			return nil, err
// 		}
// 		update["password"] = string(hashedPassword)
// 	}

// 	return update, nil
// }

// func updateProfilePictures(w http.ResponseWriter, r *http.Request, claims *Claims) (bson.M, error) {
// 	_ = w
// 	update := bson.M{}

// 	// Handle profile picture upload
// 	if file, _, err := r.FormFile("profile_picture"); err == nil {
// 		defer file.Close()

// 		// Ensure the userpic directory exists
// 		if err := os.MkdirAll("./userpic", os.ModePerm); err != nil {
// 			return nil, fmt.Errorf("error creating userpic directory: %w", err)
// 		}

// 		// Save the file to a predefined location
// 		filePath := "./userpic/" + claims.Username + ".jpg"
// 		out, err := os.Create(filePath)
// 		if err != nil {
// 			return nil, fmt.Errorf("error creating profile picture file: %w", err)
// 		}
// 		defer out.Close()

// 		if _, err := io.Copy(out, file); err != nil {
// 			return nil, fmt.Errorf("error saving profile picture: %w", err)
// 		}

// 		update["profile_picture"] = claims.Username + ".jpg"

// 		// Ensure the thumb directory exists
// 		thumbDir := "./userpic/thumb"
// 		if err := os.MkdirAll(thumbDir, os.ModePerm); err != nil {
// 			return nil, fmt.Errorf("error creating thumbnail directory: %w", err)
// 		}

// 		// Create a thumbnail
// 		thumbPath := thumbDir + "/" + claims.UserID + ".jpg"
// 		if err := createThumbnail(filePath, thumbPath); err != nil {
// 			return nil, fmt.Errorf("error creating thumbnail: %w", err)
// 		}
// 	}

// 	return update, nil
// }

// func editProfile(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
// 	tokenString := r.Header.Get("Authorization")
// 	claims := &Claims{}

// 	// Validate JWT token
// 	_, err := jwt.ParseWithClaims(tokenString[7:], claims, func(token *jwt.Token) (interface{}, error) {
// 		return jwtSecret, nil
// 	})
// 	if err != nil {
// 		http.Error(w, "Unauthorized", http.StatusUnauthorized)
// 		return
// 	}

// 	// Parse the multipart form (max size 10MB)
// 	if err := r.ParseMultipartForm(10 << 20); err != nil {
// 		http.Error(w, "Unable to parse form", http.StatusBadRequest)
// 		return
// 	}

// 	RdxDel("profile:" + claims.Username) // Delete cached profile

// 	// Update profile fields
// 	fieldUpdates, err := updateProfileFields(w, r, claims)
// 	if err != nil {
// 		http.Error(w, "Failed to update profile fields", http.StatusInternalServerError)
// 		return
// 	}

// 	// Update profile picture
// 	pictureUpdates, err := updateProfilePictures(w, r, claims)
// 	if err != nil {
// 		http.Error(w, "Failed to update profile pictures", http.StatusInternalServerError)
// 		return
// 	}

// 	// Update banner pictures
// 	bannerUpdates, err := uploadThumbnailHandler(w, r, claims)
// 	if err != nil {
// 		http.Error(w, "Failed to update profile banner", http.StatusInternalServerError)
// 		return
// 	}

// 	// Combine updates
// 	finalUpdate := bson.M{}
// 	for key, value := range fieldUpdates {
// 		finalUpdate[key] = value
// 	}
// 	for key, value := range pictureUpdates {
// 		finalUpdate[key] = value
// 	}
// 	for key, value := range bannerUpdates {
// 		finalUpdate[key] = value
// 	}

// 	// Update the user in the database
// 	_, err = userCollection.UpdateOne(context.TODO(), bson.M{"username": claims.Username}, bson.M{"$set": finalUpdate})
// 	if err != nil {
// 		http.Error(w, "Failed to update profile", http.StatusInternalServerError)
// 		return
// 	}

// 	var userProfile User
// 	err = userCollection.FindOne(context.TODO(), bson.M{"username": claims.Username}).Decode(&userProfile)
// 	if err != nil {
// 		if err == mongo.ErrNoDocuments {
// 			http.Error(w, "User not found", http.StatusNotFound)
// 			return
// 		}
// 		http.Error(w, "Internal server error", http.StatusInternalServerError)
// 		return
// 	}

// 	w.Header().Set("Content-Type", "application/json")
// 	json.NewEncoder(w).Encode(userProfile)
// }

// func updateProfilePictures(w http.ResponseWriter, r *http.Request, claims *Claims) (bson.M, error) {
// 	_ = w
// 	update := bson.M{}

// 	// Handle profile picture upload
// 	if file, _, err := r.FormFile("profile_picture"); err == nil {
// 		defer file.Close()

// 		// Ensure the userpic directory exists
// 		if err := os.MkdirAll("./userpic", os.ModePerm); err != nil {
// 			return nil, fmt.Errorf("error creating userpic directory: %w", err)
// 		}

// 		// Save the file to a predefined location
// 		filePath := "./userpic/" + claims.Username + ".jpg"
// 		out, err := os.Create(filePath)
// 		if err != nil {
// 			return nil, fmt.Errorf("error creating profile picture file: %w", err)
// 		}
// 		defer out.Close()

// 		if _, err := io.Copy(out, file); err != nil {
// 			return nil, fmt.Errorf("error saving profile picture: %w", err)
// 		}

// 		update["profile_picture"] = claims.Username + ".jpg"

// 		// Ensure the thumb directory exists
// 		thumbDir := "./userpic/thumb"
// 		if err := os.MkdirAll(thumbDir, os.ModePerm); err != nil {
// 			return nil, fmt.Errorf("error creating thumbnail directory: %w", err)
// 		}

// 		// Create a thumbnail
// 		thumbPath := thumbDir + "/" + claims.UserID + ".jpg"
// 		if err := createThumbnail(filePath, thumbPath); err != nil {
// 			return nil, fmt.Errorf("error creating thumbnail: %w", err)
// 		}
// 	}
// 	fmt.Println("fhreys gfryu ", update)
// 	return update, nil
// }

func updateProfileFields(w http.ResponseWriter, r *http.Request, claims *Claims) (bson.M, error) {
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

	// Optional: handle password update
	if password := r.FormValue("password"); password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		if err != nil {
			http.Error(w, "Failed to hash password", http.StatusInternalServerError)
			return nil, err
		}
		update["password"] = string(hashedPassword)
	}

	return update, nil
}

// func editProfile(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
// 	tokenString := r.Header.Get("Authorization")
// 	claims := &Claims{}

// 	// Validate JWT token
// 	_, err := jwt.ParseWithClaims(tokenString[7:], claims, func(token *jwt.Token) (interface{}, error) {
// 		return jwtSecret, nil
// 	})
// 	if err != nil {
// 		http.Error(w, "Unauthorized", http.StatusUnauthorized)
// 		return
// 	}

// 	// Parse the multipart form (max size 10MB)
// 	if err := r.ParseMultipartForm(10 << 20); err != nil {
// 		http.Error(w, "Unable to parse form", http.StatusBadRequest)
// 		return
// 	}

// 	RdxDel("profile:" + claims.Username) // Delete cached profile

// 	// Update profile fields
// 	fieldUpdates, err := updateProfileFields(w, r, claims)
// 	if err != nil {
// 		http.Error(w, "Failed to update profile fields", http.StatusInternalServerError)
// 		return
// 	}

// 	var pictureUpdates bson.M
// 	if r.FormValue("profile_picture") != "" {
// 		// Update profile pictures
// 		pictureUpdates, err = updateProfilePictures(w, r, claims)
// 		if err != nil {
// 			http.Error(w, "Failed to update profile pictures", http.StatusInternalServerError)
// 			return
// 		}
// 	}
// 	fmt.Println(pictureUpdates)

// 	var bannerUpdates bson.M
// 	if r.FormValue("banner_picture") != "" {
// 		// Update profile pictures
// 		bannerUpdates, err = uploadThumbnailHandler(w, r, claims)
// 		if err != nil {
// 			http.Error(w, "Failed to update banner pictures", http.StatusInternalServerError)
// 			return
// 		}
// 	}
// 	fmt.Println(bannerUpdates)

// 	// Combine updates
// 	finalUpdate := bson.M{}
// 	for key, value := range fieldUpdates {
// 		finalUpdate[key] = value
// 	}
// 	for key, value := range pictureUpdates {
// 		finalUpdate[key] = value
// 	}
// 	for key, value := range bannerUpdates {
// 		finalUpdate[key] = value
// 	}

// 	// Update the user in the database
// 	_, err = userCollection.UpdateOne(context.TODO(), bson.M{"username": claims.Username}, bson.M{"$set": finalUpdate})
// 	if err != nil {
// 		http.Error(w, "Failed to update profile", http.StatusInternalServerError)
// 		return
// 	}

// 	var userProfile User
// 	err = userCollection.FindOne(context.TODO(), bson.M{"username": claims.Username}).Decode(&userProfile)
// 	if err != nil {
// 		if err == mongo.ErrNoDocuments {
// 			http.Error(w, "User not found", http.StatusNotFound)
// 			return
// 		}
// 		http.Error(w, "Internal server error", http.StatusInternalServerError)
// 		return
// 	}

// 	w.Header().Set("Content-Type", "application/json")
// 	json.NewEncoder(w).Encode(userProfile)
// }

// func editProfile(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
// 	// Validate JWT token
// 	tokenString := r.Header.Get("Authorization")
// 	if tokenString == "" || len(tokenString) < 8 {
// 		http.Error(w, "Unauthorized", http.StatusUnauthorized)
// 		return
// 	}

// 	claims := &Claims{}
// 	_, err := jwt.ParseWithClaims(tokenString[7:], claims, func(token *jwt.Token) (interface{}, error) {
// 		return jwtSecret, nil
// 	})
// 	if err != nil {
// 		http.Error(w, "Unauthorized", http.StatusUnauthorized)
// 		return
// 	}

// 	// Parse the multipart form (max size 10MB)
// 	if err := r.ParseMultipartForm(10 << 20); err != nil {
// 		http.Error(w, "Unable to parse form", http.StatusBadRequest)
// 		return
// 	}

// 	// Delete cached profile
// 	RdxDel("profile:" + claims.Username)

// 	// Update profile fields
// 	fieldUpdates, err := updateProfileFields(w, r, claims)
// 	if err != nil {
// 		http.Error(w, "Failed to update profile fields", http.StatusInternalServerError)
// 		return
// 	}

// 	// Initialize updates for profile picture and banner
// 	var pictureUpdates, bannerUpdates bson.M

// 	// Handle profile picture upload if provided
// 	// if r.FormValue("profile_picture") != "" {
// 	pictureUpdates, err = updateProfilePictures(w, r, claims)
// 	if err != nil {
// 		http.Error(w, "Failed to update profile picture", http.StatusInternalServerError)
// 		return
// 	}
// 	// }

// 	// Handle banner picture upload if provided
// 	// if r.FormValue("banner_picture") != "" {
// 	bannerUpdates, err = uploadThumbnailHandler(w, r, claims)
// 	if err != nil {
// 		http.Error(w, "Failed to update banner picture", http.StatusInternalServerError)
// 		return
// 	}
// 	// }

// 	// Combine all updates
// 	finalUpdate := bson.M{}
// 	mergeBsonMaps(finalUpdate, fieldUpdates, pictureUpdates, bannerUpdates)

// 	// Update user in the database
// 	_, err = userCollection.UpdateOne(
// 		context.TODO(),
// 		bson.M{"username": claims.Username},
// 		bson.M{"$set": finalUpdate},
// 	)
// 	if err != nil {
// 		http.Error(w, "Failed to update profile", http.StatusInternalServerError)
// 		return
// 	}

// 	// Retrieve the updated user profile
// 	var userProfile User
// 	err = userCollection.FindOne(context.TODO(), bson.M{"username": claims.Username}).Decode(&userProfile)
// 	if err != nil {
// 		if err == mongo.ErrNoDocuments {
// 			http.Error(w, "User not found", http.StatusNotFound)
// 			return
// 		}
// 		http.Error(w, "Internal server error", http.StatusInternalServerError)
// 		return
// 	}

// 	// Return the updated profile
// 	w.Header().Set("Content-Type", "application/json")
// 	json.NewEncoder(w).Encode(userProfile)
// }

// func mergeBsonMaps(final bson.M, maps ...bson.M) {
// 	for _, m := range maps {
// 		for key, value := range m {
// 			final[key] = value
// 		}
// 	}
// }

// // Main handler function
// func editProfile(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
// 	// Validate JWT token
// 	claims, err := validateJWT(r.Header.Get("Authorization"))
// 	if err != nil {
// 		http.Error(w, "Unauthorized", http.StatusUnauthorized)
// 		return
// 	}

// 	// Parse the multipart form
// 	if err := r.ParseMultipartForm(10 << 20); err != nil {
// 		http.Error(w, "Unable to parse form", http.StatusBadRequest)
// 		return
// 	}

// 	// Delete cached profile
// 	RdxDel("profile:" + claims.Username)

// 	// Update profile fields
// 	fieldUpdates, err := updateProfileFields(w, r, claims)
// 	if err != nil {
// 		http.Error(w, "Failed to update profile fields", http.StatusInternalServerError)
// 		return
// 	}

// 	// Update profile picture
// 	pictureUpdates, err := handleProfilePictureUpload(w, r, claims)
// 	if err != nil {
// 		http.Error(w, "Failed to update profile picture", http.StatusInternalServerError)
// 		return
// 	}

// 	// Update banner picture
// 	bannerUpdates, err := handleBannerPictureUpload(w, r, claims)
// 	if err != nil {
// 		http.Error(w, "Failed to update banner picture", http.StatusInternalServerError)
// 		return
// 	}

// 	// Combine all updates and save to the database
// 	if err := applyProfileUpdates(claims.Username, fieldUpdates, pictureUpdates, bannerUpdates); err != nil {
// 		http.Error(w, "Failed to update profile", http.StatusInternalServerError)
// 		return
// 	}

// 	// Respond with the updated profile
// 	if err := respondWithUserProfile(w, claims.Username); err != nil {
// 		http.Error(w, "Internal server error", http.StatusInternalServerError)
// 	}
// }

func validateJWT(tokenString string) (*Claims, error) {
	if tokenString == "" || len(tokenString) < 8 {
		return nil, fmt.Errorf("invalid token")
	}

	claims := &Claims{}
	_, err := jwt.ParseWithClaims(tokenString[7:], claims, func(token *jwt.Token) (interface{}, error) {
		return jwtSecret, nil
	})
	if err != nil {
		return nil, fmt.Errorf("unauthorized: %w", err)
	}
	return claims, nil
}

// func handleProfilePictureUpload(w http.ResponseWriter, r *http.Request, claims *Claims) (bson.M, error) {
// 	if r.FormValue("profile_picture") == "" {
// 		return bson.M{}, nil
// 	}
// 	return updateProfilePictures(w, r, claims)
// }

// func handleBannerPictureUpload(w http.ResponseWriter, r *http.Request, claims *Claims) (bson.M, error) {
// 	if r.FormValue("banner_picture") == "" {
// 		return bson.M{}, nil
// 	}
// 	return uploadThumbnailHandler(w, r, claims)
// }

func applyProfileUpdates(username string, updates ...bson.M) error {
	finalUpdate := bson.M{}
	for _, update := range updates {
		for key, value := range update {
			finalUpdate[key] = value
		}
	}

	_, err := userCollection.UpdateOne(
		context.TODO(),
		bson.M{"username": username},
		bson.M{"$set": finalUpdate},
	)
	return err
}

func respondWithUserProfile(w http.ResponseWriter, username string) error {
	var userProfile User
	err := userCollection.FindOne(context.TODO(), bson.M{"username": username}).Decode(&userProfile)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			http.Error(w, "User not found", http.StatusNotFound)
			return nil
		}
		return err
	}

	w.Header().Set("Content-Type", "application/json")
	return json.NewEncoder(w).Encode(userProfile)
}

// Update general profile information
func editProfile(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	// Validate JWT token
	claims, err := validateJWT(r.Header.Get("Authorization"))
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse the multipart form
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, "Unable to parse form", http.StatusBadRequest)
		return
	}

	// Delete cached profile
	RdxDel("profile:" + claims.Username)

	// Update profile fields
	fieldUpdates, err := updateProfileFields(w, r, claims)
	if err != nil {
		http.Error(w, "Failed to update profile fields", http.StatusInternalServerError)
		return
	}

	// Save updated fields to the database
	if err := applyProfileUpdates(claims.Username, fieldUpdates); err != nil {
		http.Error(w, "Failed to update profile", http.StatusInternalServerError)
		return
	}

	// Respond with the updated profile
	if err := respondWithUserProfile(w, claims.Username); err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}

// Update profile picture
func editProfilePic(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	// Validate JWT token
	claims, err := validateJWT(r.Header.Get("Authorization"))
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse the multipart form
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, "Unable to parse form", http.StatusBadRequest)
		return
	}

	// Update profile picture
	pictureUpdates, err := updateProfilePictures(w, r, claims)
	if err != nil {
		http.Error(w, "Failed to update profile picture", http.StatusInternalServerError)
		return
	}

	// Save updated profile picture to the database
	if err := applyProfileUpdates(claims.Username, pictureUpdates); err != nil {
		http.Error(w, "Failed to update profile picture", http.StatusInternalServerError)
		return
	}

	// Respond with the updated profile
	if err := respondWithUserProfile(w, claims.Username); err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}

// Update banner picture
func editProfileBanner(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	// Validate JWT token
	claims, err := validateJWT(r.Header.Get("Authorization"))
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Parse the multipart form
	if err := r.ParseMultipartForm(10 << 20); err != nil {
		http.Error(w, "Unable to parse form", http.StatusBadRequest)
		return
	}

	// Update banner picture
	bannerUpdates, err := uploadBannerHandler(w, r, claims)
	if err != nil {
		http.Error(w, "Failed to update banner picture", http.StatusInternalServerError)
		return
	}

	// Save updated banner picture to the database
	if err := applyProfileUpdates(claims.Username, bannerUpdates); err != nil {
		http.Error(w, "Failed to update banner picture", http.StatusInternalServerError)
		return
	}

	// Respond with the updated profile
	if err := respondWithUserProfile(w, claims.Username); err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
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
