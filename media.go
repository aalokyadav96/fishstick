package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/julienschmidt/httprouter"
	"go.mongodb.org/mongo-driver/bson"
)

func addMedia(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	eventID := ps.ByName("eventid")

	// Parse the multipart form
	err := r.ParseMultipartForm(50 << 20) // Limit the size to 50 MB for videos too
	if err != nil {
		http.Error(w, "Unable to parse form", http.StatusBadRequest)
		return
	}

	// Retrieve the ID of the requesting user from the context
	requestingUserID, ok := r.Context().Value(userIDKey).(string)
	if !ok {
		http.Error(w, "Invalid user", http.StatusBadRequest)
		return
	}

	// Create a new Media instance
	media := Media{
		ID:        generateID(16),
		EventID:   eventID,
		Caption:   "Needs better forms",
		CreatorID: requestingUserID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Handle file upload
	file, fileHeader, err := r.FormFile("media")
	if err != nil && err != http.ErrMissingFile {
		http.Error(w, "Error retrieving media file", http.StatusBadRequest)
		return
	}
	defer file.Close()

	if file != nil {
		// Determine file type based on MIME type
		mimeType := fileHeader.Header.Get("Content-Type")
		fileExtension := ""
		switch {
		case strings.HasPrefix(mimeType, "image"):
			fileExtension = ".jpg" // default for images (could add further detection)
			media.Type = "image"
		case strings.HasPrefix(mimeType, "video"):
			fileExtension = ".mp4" // default for videos (could add further detection)
			media.Type = "video"
		default:
			http.Error(w, "Unsupported file type", http.StatusBadRequest)
			return
		}

		// Save the file
		out, err := os.Create("./uploads/" + media.ID + fileExtension)
		if err != nil {
			http.Error(w, "Error saving media file", http.StatusInternalServerError)
			return
		}
		defer out.Close()
		if _, err := io.Copy(out, file); err != nil {
			http.Error(w, "Error saving media file", http.StatusInternalServerError)
			return
		}

		// Set the media URL based on the saved file
		media.URL = media.ID + fileExtension

		// If it's a video, set additional properties like duration and file size
		if media.Type == "video" {
			// Add logic to extract duration and file size for video
			media.Duration = 0 // Set actual duration here using a video library if needed
			media.FileSize = fileHeader.Size
			media.MimeType = mimeType
		}
	}

	// Insert media into MongoDB
	collection := client.Database("eventdb").Collection("media")
	_, err = collection.InsertOne(context.TODO(), media)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Respond with the created media
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(media)
}

func getMedia(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	eventID := ps.ByName("eventid")
	mediaID := ps.ByName("id")
	cacheKey := fmt.Sprintf("media:%s:%s", eventID, mediaID)

	// Check the cache first
	cachedMedia, err := RdxGet(cacheKey) // Assuming RdxGet is a function to get cached data
	if err == nil && cachedMedia != "" {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(cachedMedia))
		return
	}

	// Database query if not in cache
	collection := client.Database("eventdb").Collection("media")
	var media Media
	err = collection.FindOne(context.TODO(), bson.M{"eventid": eventID, "id": mediaID}).Decode(&media)
	if err != nil {
		http.Error(w, "Media not found", http.StatusNotFound)
		return
	}

	// Cache the result
	mediaJSON, _ := json.Marshal(media)
	RdxSet(cacheKey, string(mediaJSON)) // Assuming RdxSet is a function to cache data

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(media)
}

func editMedia(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	eventID := ps.ByName("eventid")
	mediaID := ps.ByName("id")
	cacheKey := fmt.Sprintf("media:%s:%s", eventID, mediaID)
	_ = r
	// Check the cache first
	cachedMedia, err := RdxGet(cacheKey) // Assuming RdxGet is a function to get cached data
	if err == nil && cachedMedia != "" {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(cachedMedia))
		return
	}

	// Database query if not in cache
	collection := client.Database("eventdb").Collection("media")
	var media Media
	err = collection.FindOne(context.TODO(), bson.M{"eventid": eventID, "id": mediaID}).Decode(&media)
	if err != nil {
		http.Error(w, "Media not found", http.StatusNotFound)
		return
	}

	// Cache the result
	mediaJSON, _ := json.Marshal(media)
	RdxSet(cacheKey, string(mediaJSON)) // Assuming RdxSet is a function to cache data

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(media)
}

func getMedias(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	eventID := ps.ByName("eventid")
	cacheKey := fmt.Sprintf("medialist:%s", eventID)

	// Check the cache first
	cachedMedias, err := RdxGet(cacheKey)
	if err == nil && cachedMedias != "" {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(cachedMedias))
		return
	}

	// Database query if not in cache
	collection := client.Database("eventdb").Collection("media")
	cursor, err := collection.Find(context.TODO(), bson.M{"eventid": eventID})
	if err != nil {
		http.Error(w, "Failed to retrieve media", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.TODO())

	var medias []Media
	for cursor.Next(context.TODO()) {
		var media Media
		if err := cursor.Decode(&media); err != nil {
			http.Error(w, "Failed to decode media", http.StatusInternalServerError)
			return
		}
		medias = append(medias, media)
	}

	if err := cursor.Err(); err != nil {
		http.Error(w, "Cursor error", http.StatusInternalServerError)
		return
	}

	// Cache the result
	mediasJSON, _ := json.Marshal(medias)
	RdxSet(cacheKey, string(mediasJSON)) // Assuming RdxSet is a function to cache data

	// Respond with media list
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(medias)
}

func deleteMedia(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	eventID := ps.ByName("eventid")
	mediaID := ps.ByName("id")

	collection := client.Database("eventdb").Collection("media")
	var media Media
	err := collection.FindOne(context.TODO(), bson.M{"eventid": eventID, "id": mediaID}).Decode(&media)
	if err != nil {
		http.Error(w, "Media not found", http.StatusNotFound)
		return
	}

	// Remove the media entry from the database
	_, err = collection.DeleteOne(context.TODO(), bson.M{"eventid": eventID, "id": mediaID})
	if err != nil {
		http.Error(w, "Failed to delete media from database", http.StatusInternalServerError)
		return
	}

	// Optionally, remove the file from the filesystem
	// err = os.Remove(media.URL)
	// if err != nil {
	// 	http.Error(w, "Failed to remove media file", http.StatusInternalServerError)
	// 	return
	// }

	// Invalidate the cache
	RdxDel(fmt.Sprintf("media:%s:%s", eventID, mediaID)) // Invalidate the media cache
	RdxDel(fmt.Sprintf("medialist:%s", eventID))         // Invalidate the list cache

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"ok":      true,
		"message": "Media deleted successfully",
	})
}
