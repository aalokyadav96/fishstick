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
	entityType := ps.ByName("entitytype")
	entityID := ps.ByName("entityid")
	if entityID == "" {
		http.Error(w, "Entity ID is required", http.StatusBadRequest)
		return
	}

	// Parse the multipart form
	err := r.ParseMultipartForm(50 << 20) // Limit to 50 MB
	if err != nil {
		http.Error(w, "Unable to parse form: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Retrieve the user ID from the context
	requestingUserID, ok := r.Context().Value(userIDKey).(string)
	if !ok || requestingUserID == "" {
		http.Error(w, "Invalid or missing user ID", http.StatusUnauthorized)
		return
	}

	// Create a new Media instance
	media := Media{
		EntityID:   entityID,
		EntityType: entityType,
		Caption:    r.FormValue("caption"), // Accept caption from form
		CreatorID:  requestingUserID,
		CreatedAt:  time.Now(),
		UpdatedAt:  time.Now(),
	}

	if entityType == "event" {
		media.ID = "e" + generateID(16)
	} else {
		media.ID = "p" + generateID(16)
	}

	// Handle file upload
	file, fileHeader, err := r.FormFile("media")
	if err != nil {
		if err == http.ErrMissingFile {
			http.Error(w, "Media file is required", http.StatusBadRequest)
		} else {
			http.Error(w, "Error retrieving media file: "+err.Error(), http.StatusBadRequest)
		}
		return
	}
	if file != nil {
		defer file.Close()
	}

	// Validate and process the file
	var fileExtension, mimeType string
	if file != nil {
		mimeType = fileHeader.Header.Get("Content-Type")
		switch {
		case strings.HasPrefix(mimeType, "image/"):
			fileExtension = ".jpg" // Default extension for images
			media.Type = "image"
		case strings.HasPrefix(mimeType, "video/"):
			fileExtension = ".mp4" // Default extension for videos
			media.Type = "video"
		default:
			http.Error(w, "Unsupported media type", http.StatusUnsupportedMediaType)
			return
		}

		// Save the file securely
		savePath := "./uploads/" + media.ID + fileExtension
		out, err := os.Create(savePath)
		if err != nil {
			http.Error(w, "Error saving media file: "+err.Error(), http.StatusInternalServerError)
			return
		}
		defer out.Close()

		if _, err := io.Copy(out, file); err != nil {
			http.Error(w, "Error saving media file: "+err.Error(), http.StatusInternalServerError)
			return
		}

		// Set the media URL and metadata
		media.URL = media.ID + fileExtension
		// media.URL = savePath
		media.MimeType = mimeType
		if media.Type == "video" {
			media.FileSize = fileHeader.Size
			// Placeholder for video duration extraction
			media.Duration = extractVideoDuration(savePath) // Implement this function
		}
	}

	// Insert the media document into MongoDB
	collection := client.Database("eventdb").Collection("media")
	_, err = collection.InsertOne(context.TODO(), media)
	if err != nil {
		http.Error(w, "Error saving media to database: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Respond with the created media object
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(media)
}

func extractVideoDuration(savePath string) int {
	_ = savePath
	return 5
}

func getMedia(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	entityType := ps.ByName("entitytype")
	entityID := ps.ByName("entityid")
	mediaID := ps.ByName("id")
	// cacheKey := fmt.Sprintf("media:%s:%s", entityID, mediaID)

	// // Check the cache first
	// cachedMedia, err := RdxGet(cacheKey) // Assuming RdxGet is a function to get cached data
	// if err == nil && cachedMedia != "" {
	// 	w.Header().Set("Content-Type", "application/json")
	// 	w.Write([]byte(cachedMedia))
	// 	return
	// }

	// Database query if not in cache
	collection := client.Database("eventdb").Collection("media")
	var media Media
	err := collection.FindOne(context.TODO(), bson.M{"entityid": entityID, "entitytype": entityType, "id": mediaID}).Decode(&media)
	if err != nil {
		http.Error(w, "Media not found", http.StatusNotFound)
		return
	}

	// Cache the result
	// mediaJSON, _ := json.Marshal(media)
	// RdxSet(cacheKey, string(mediaJSON)) // Assuming RdxSet is a function to cache data

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(media)
}

func editMedia(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	entityType := ps.ByName("entitytype")
	entityID := ps.ByName("entityid")
	mediaID := ps.ByName("id")
	cacheKey := fmt.Sprintf("media:%s:%s", entityID, mediaID)
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
	err = collection.FindOne(context.TODO(), bson.M{"entityid": entityID, "entitytype": entityType, "id": mediaID}).Decode(&media)
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
	entityType := ps.ByName("entitytype")
	entityID := ps.ByName("entityid")
	cacheKey := fmt.Sprintf("medialist:%s", entityID)

	// Check the cache first
	cachedMedias, err := RdxGet(cacheKey)
	if err == nil && cachedMedias != "" {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(cachedMedias))
		return
	}

	// Database query if not in cache
	collection := client.Database("eventdb").Collection("media")
	cursor, err := collection.Find(context.TODO(), bson.M{"entityid": entityID, "entitytype": entityType})
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
	entityType := ps.ByName("entitytype")
	entityID := ps.ByName("entityid")
	mediaID := ps.ByName("id")

	collection := client.Database("eventdb").Collection("media")
	var media Media
	err := collection.FindOne(context.TODO(), bson.M{"entityid": entityID, "entitytype": entityType, "id": mediaID}).Decode(&media)
	if err != nil {
		http.Error(w, "Media not found", http.StatusNotFound)
		return
	}

	// Remove the media entry from the database
	_, err = collection.DeleteOne(context.TODO(), bson.M{"entityid": entityID, "entitytype": entityType, "id": mediaID})
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
	RdxDel(fmt.Sprintf("media:%s:%s", entityID, mediaID)) // Invalidate the media cache
	RdxDel(fmt.Sprintf("medialist:%s", entityID))         // Invalidate the list cache

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"ok":      true,
		"message": "Media deleted successfully",
	})
}
