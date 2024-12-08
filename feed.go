package main

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/julienschmidt/httprouter"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo/options"
)

// Function to handle fetching the feed
func getPosts(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	collection := client.Database("twitterClone").Collection("posts")

	// Create an empty slice to store posts
	var posts []Post

	// Filter to fetch all posts (can be adjusted if you need specific filtering)
	filter := bson.M{} // Empty filter for fetching all posts

	// Create the sort order (descending by timestamp)
	sortOrder := bson.D{{Key: "timestamp", Value: -1}}

	// Use the context with timeout to handle long queries and ensure sorting by timestamp
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Fetch posts with sorting options
	cursor, err := collection.Find(ctx, filter, &options.FindOptions{
		Sort: sortOrder, // Apply sorting by timestamp descending
	})
	if err != nil {
		http.Error(w, "Failed to fetch posts", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(ctx)

	// Loop through the cursor and decode each post into the `posts` slice
	for cursor.Next(ctx) {
		var post Post
		if err := cursor.Decode(&post); err != nil {
			http.Error(w, "Failed to decode post", http.StatusInternalServerError)
			return
		}
		posts = append(posts, post)
	}

	// Handle cursor error
	if err := cursor.Err(); err != nil {
		http.Error(w, "Cursor error", http.StatusInternalServerError)
		return
	}

	// If no posts found, return an empty array
	if len(posts) == 0 {
		posts = []Post{}
	}

	// Return the list of posts as JSON
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"ok":   true,
		"data": posts,
	})
}

// Directory to store uploaded images
const uploadDir = "./uploads/"

func createTweetPost(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {

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

	// Parse multipart form data (includes both text and image/video files)
	err = r.ParseMultipartForm(20 << 20) // 20 MB limit
	if err != nil {
		http.Error(w, "Failed to parse form data", http.StatusBadRequest)
		return
	}

	userid, ok := r.Context().Value(userIDKey).(string)
	if !ok {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	username, _ := RdxHget("users", userid)

	// Extract post content and type from form data
	postType := r.FormValue("type") // "text", "image", "video", etc.
	postText := r.FormValue("text")

	// Initialize a struct for the post
	newPost := Post{
		Username:   username,
		UserID:     userid,
		Text:       postText,
		Timestamp:  time.Now().Format(time.RFC3339),
		LikesCount: 0,
		Type:       postType,
	}

	var mediaPaths []string

	// Handle different post types
	switch postType {
	case "image":
		files := r.MultipartForm.File["images"]
		for _, file := range files {
			// Open the uploaded image file
			bannerFile, err := file.Open()
			if err != nil {
				http.Error(w, "Failed to open image file", http.StatusInternalServerError)
				return
			}
			defer bannerFile.Close()
			/***************************************/
			photoID := generateID(16)

			// If a banner file is provided, save it
			if bannerFile != nil {
				out, err := os.Create("./postpic/" + photoID + ".jpg")
				if err != nil {
					http.Error(w, "Error saving banner", http.StatusInternalServerError)
					return
				}
				defer out.Close()
				if _, err := io.Copy(out, bannerFile); err != nil {
					http.Error(w, "Error saving banner", http.StatusInternalServerError)
					return
				}
			}
			/**************************************/

			// Add the image path (relative URL) to the media paths array
			mediaPaths = append(mediaPaths, photoID)
		}
	case "video":
		files := r.MultipartForm.File["videos"]
		for _, file := range files {
			// Open the uploaded video file
			src, err := file.Open()
			if err != nil {
				http.Error(w, "Failed to open video file", http.StatusInternalServerError)
				return
			}
			defer src.Close()

			// Create destination file path for video
			dstFilePath := filepath.Join(uploadDir, file.Filename)
			dst, err := os.Create(dstFilePath)
			if err != nil {
				http.Error(w, "Failed to save video file", http.StatusInternalServerError)
				return
			}
			defer dst.Close()

			// Copy the file to the destination
			_, err = io.Copy(dst, src)
			if err != nil {
				http.Error(w, "Failed to write video file", http.StatusInternalServerError)
				return
			}

			// Add the video path (relative URL) to the media paths array
			mediaPaths = append(mediaPaths, "/uploads/"+file.Filename)
		}
	case "blog":
		// Blog posts may not require any media files, but we can have them as optional
		// Additional logic for blog-type posts can be added here (e.g., handling text or blog-specific fields)
	case "merchandise":
		// Merchandise posts may require specific fields, such as links to the product image or description
		// Add logic to handle these posts if needed
	}

	// Add media paths to the post struct
	newPost.Media = mediaPaths

	// Save the post in the database
	postsCollection := client.Database("twitterClone").Collection("posts")
	insertResult, err := postsCollection.InsertOne(context.TODO(), newPost)
	if err != nil {
		http.Error(w, "Failed to insert post into DB", http.StatusInternalServerError)
		return
	}

	// Return the newly created post as JSON
	newPost.ID = insertResult.InsertedID
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"ok":      true,
		"message": "Post created successfully",
		"data":    newPost,
	})
}

func editPost(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	postID := ps.ByName("id")
	var updatedPost Post

	// Decode the incoming JSON for the updated post data
	err := json.NewDecoder(r.Body).Decode(&updatedPost)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Ensure the post ID is provided
	if postID == "" {
		http.Error(w, "Post ID is required", http.StatusBadRequest)
		return
	}

	// Find and update the post in the database
	postsCollection := client.Database("twitterClone").Collection("posts")
	update := bson.M{
		"$set": bson.M{
			"text":      updatedPost.Text,
			"type":      updatedPost.Type,                // Update the type if it's changed
			"media":     updatedPost.Media,               // Update media paths
			"timestamp": time.Now().Format(time.RFC3339), // Update timestamp to the current time
		},
	}

	// Convert postID to an ObjectID
	id, err := objectIDFromString(postID)
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}

	// Perform the update
	result, err := postsCollection.UpdateOne(context.TODO(), bson.M{"_id": id}, update)
	if err != nil {
		http.Error(w, "Failed to update post", http.StatusInternalServerError)
		return
	}

	if result.MatchedCount == 0 {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	// Respond with the updated post
	updatedPost.ID = id
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"ok":      true,
		"message": "Post updated successfully",
		"data":    updatedPost,
	})
}

// deletePost handles deleting a post by ID
func deletePost(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	postID := ps.ByName("id")

	if postID == "" {
		http.Error(w, "Post ID is required", http.StatusBadRequest)
		return
	}

	// Convert postID to ObjectID
	id, err := objectIDFromString(postID)
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}

	// Delete the post from MongoDB
	postsCollection := client.Database("twitterClone").Collection("posts")
	result, err := postsCollection.DeleteOne(context.TODO(), bson.M{"_id": id})
	if err != nil {
		http.Error(w, "Failed to delete post", http.StatusInternalServerError)
		return
	}

	if result.DeletedCount == 0 {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	// Respond with a success message
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"ok":      true,
		"message": "Post deleted successfully",
	})
}

// Helper function to convert a string to ObjectID
func objectIDFromString(id string) (interface{}, error) {
	return primitive.ObjectIDFromHex(id)
}
