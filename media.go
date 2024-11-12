package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	"github.com/julienschmidt/httprouter"
	"go.mongodb.org/mongo-driver/bson"
)

func addMedia(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	eventID := ps.ByName("eventid")

	// Parse the multipart form
	err := r.ParseMultipartForm(10 << 20) // Limit the size to 10 MB
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
	// var media Media
	// Create a new Media instance
	media := Media{
		ID:        generateID(16),
		EventID:   eventID,
		Type:      "image", // Use type from form or set default
		Caption:   "Needs better forms",
		CreatorID: requestingUserID,
		// Description: description,
	}

	// Handle banner file upload
	bannerFile, _, err := r.FormFile("media")
	if err != nil && err != http.ErrMissingFile {
		http.Error(w, "Error retrieving banner file", http.StatusBadRequest)
		return
	}
	defer bannerFile.Close()

	if bannerFile != nil {
		// Save the banner image logic here
		out, err := os.Create("./uploads/" + media.ID + ".jpg")
		if err != nil {
			http.Error(w, "Error saving banner", http.StatusInternalServerError)
			return
		}
		defer out.Close()
		if _, err := io.Copy(out, bannerFile); err != nil {
			http.Error(w, "Error saving banner", http.StatusInternalServerError)
			return
		}
		media.URL = media.ID + ".jpg"
	}

	media.URL = media.ID + ".jpg"

	// Insert merch into MongoDB
	collection := client.Database("eventdb").Collection("media")
	_, err = collection.InsertOne(context.TODO(), media)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Respond with the created merchandise
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(media)
}

// // getMedia retrieves a specific media file for a given event and media ID
// func getMedia(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
// 	eventID := ps.ByName("eventid") // Extract the event ID from the URL parameters
// 	mediaID := ps.ByName("id")      // Extract the media ID from the URL parameters

// 	// Query the database for the media document using both eventID and mediaID
// 	collection := client.Database("eventdb").Collection("media")
// 	var media Media
// 	err := collection.FindOne(context.TODO(), bson.M{"eventid": eventID, "id": mediaID}).Decode(&media)
// 	if err != nil {
// 		// If there's an error (e.g., no matching media found), send a 404 response
// 		http.Error(w, "Media not found", http.StatusNotFound)
// 		return
// 	}

// 	w.Header().Set("Content-Type", "application/json")
// 	json.NewEncoder(w).Encode(media)
// }

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

// // getMedias retrieves all media for a specific event
// func getMedias(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
// 	eventID := ps.ByName("eventid")

// 	collection := client.Database("eventdb").Collection("media")
// 	cursor, err := collection.Find(context.TODO(), bson.M{"eventid": eventID})
// 	if err != nil {
// 		http.Error(w, "Failed to retrieve media", http.StatusInternalServerError)
// 		return
// 	}
// 	defer cursor.Close(context.TODO())

// 	var medias []Media
// 	for cursor.Next(context.TODO()) {
// 		var media Media
// 		if err := cursor.Decode(&media); err != nil {
// 			http.Error(w, "Failed to decode media", http.StatusInternalServerError)
// 			return
// 		}
// 		medias = append(medias, media)
// 	}
// 	if len(medias) == 0 {
// 		medias = []Media{}
// 	}
// 	w.Header().Set("Content-Type", "application/json")
// 	json.NewEncoder(w).Encode(medias)
// }

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

// // deleteMedia deletes a specific media file
// func deleteMedia(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
// 	eventID := ps.ByName("eventid")
// 	mediaID := ps.ByName("id")

// 	collection := client.Database("eventdb").Collection("media")
// 	var media Media
// 	err := collection.FindOne(context.TODO(), bson.M{"eventid": eventID, "id": mediaID}).Decode(&media)
// 	if err != nil {
// 		http.Error(w, "Media not found", http.StatusNotFound)
// 		return
// 	}

// 	// Remove the media entry from the database
// 	_, err = collection.DeleteOne(context.TODO(), bson.M{"eventid": eventID, "id": mediaID})
// 	if err != nil {
// 		http.Error(w, "Failed to delete media from database", http.StatusInternalServerError)
// 		return
// 	}

// 	// Optionally, remove the file from the filesystem
// 	os.Remove(media.URL)

// 	// w.WriteHeader(http.StatusNoContent)
// 	w.Header().Set("Content-Type", "application/json")
// 	w.WriteHeader(http.StatusOK)
// 	json.NewEncoder(w).Encode(map[string]interface{}{
// 		"ok":      true,
// 		"message": "Media deleted successfully",
// 	})
// }

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
