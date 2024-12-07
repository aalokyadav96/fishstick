package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/julienschmidt/httprouter"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

func createPlace(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	// Parse the multipart form with a 10 MB limit
	err := r.ParseMultipartForm(10 << 20) // 10 MB limit
	if err != nil {
		http.Error(w, "Unable to parse form", http.StatusBadRequest)
		return
	}

	// Retrieve the place data from the form
	name := r.FormValue("name")
	address := r.FormValue("address")
	description := r.FormValue("description")
	capacity := r.FormValue("capacity")
	category := r.FormValue("category")

	// Validate that required fields are not empty
	if name == "" || address == "" || description == "" || capacity == "" || category == "" {
		http.Error(w, "All fields are required", http.StatusBadRequest)
		return
	}
	cap, _ := strconv.Atoi(capacity)
	// Create a new Place instance
	place := Place{
		Name:        name,
		Address:     address,
		Description: description,
		Category:    category,
		Capacity:    cap,
		PlaceID:     generateID(14), // Assuming you have a function to generate a unique ID
	}

	// Get the ID of the requesting user from the context
	requestingUserID, ok := r.Context().Value(userIDKey).(string)
	if !ok {
		http.Error(w, "Invalid user", http.StatusBadRequest)
		return
	}
	place.CreatedBy = requestingUserID

	// Handle banner file upload
	bannerFile, _, err := r.FormFile("banner")
	if err != nil && err != http.ErrMissingFile {
		http.Error(w, "Error retrieving banner file", http.StatusBadRequest)
		return
	}

	// Check if the file exists and is valid
	if bannerFile != nil {
		// Ensure the directory exists
		if err := os.MkdirAll("./placepic", os.ModePerm); err != nil {
			http.Error(w, "Error creating directory for banner", http.StatusInternalServerError)
			return
		}

		// Save the banner image
		out, err := os.Create("./placepic/" + place.PlaceID + ".jpg")
		if err != nil {
			http.Error(w, "Error saving banner", http.StatusInternalServerError)
			return
		}
		defer out.Close()

		// Copy the content of the uploaded file to the output file
		if _, err := io.Copy(out, bannerFile); err != nil {
			http.Error(w, "Error saving banner", http.StatusInternalServerError)
			return
		}

		// Set the banner field with the saved image path
		place.Banner = place.PlaceID + ".jpg"
	}

	// Insert the new place into MongoDB
	collection := client.Database("eventdb").Collection("places")
	_, err = collection.InsertOne(context.TODO(), place)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Respond with the created place and a 201 status code
	w.WriteHeader(http.StatusCreated) // 201 Created
	if err := json.NewEncoder(w).Encode(place); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}

func getPlaces(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	w.Header().Set("Content-Type", "application/json")

	// // Check if places are cached
	// cachedPlaces, err := RdxGet("places")
	// if err == nil && cachedPlaces != "" {
	// 	// Return cached places if available
	// 	w.Write([]byte(cachedPlaces))
	// 	return
	// }

	collection := client.Database("eventdb").Collection("places")
	cursor, err := collection.Find(context.TODO(), bson.M{})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.TODO())

	var places []Place
	if err = cursor.All(context.TODO(), &places); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Cache the result
	placesJSON, _ := json.Marshal(places)
	RdxSet("places", string(placesJSON))

	// Encode and return places data
	json.NewEncoder(w).Encode(places)
}

func getPlace(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	placeID := ps.ByName("placeid")
	cacheKey := "place:" + placeID

	// Check if the place data is cached
	cachedPlace, err := RdxGet(cacheKey)
	if err == nil && cachedPlace != "" {
		// If cached, return the cached data
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(cachedPlace))
		return
	}

	collection := client.Database("eventdb").Collection("places")
	var place Place
	if place.Merch == nil {
		place.Merch = []Merch{}
	}
	err = collection.FindOne(context.TODO(), bson.M{"placeid": placeID}).Decode(&place)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	// Cache the place data
	placeJSON, _ := json.Marshal(place)
	RdxSet(cacheKey, string(placeJSON))

	// Return the place data
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(place)
}

func editPlace(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	placeID := ps.ByName("placeid")
	var place Place

	// Retrieve the ID of the requesting user from the context
	requestingUserID, ok := r.Context().Value(userIDKey).(string)
	if !ok {
		http.Error(w, "Invalid user", http.StatusUnauthorized)
		return
	}
	log.Println("Requesting User ID:", requestingUserID)

	// Get the existing place from the database to check ownership
	collection := client.Database("eventdb").Collection("places")
	err := collection.FindOne(context.TODO(), bson.M{"placeid": placeID}).Decode(&place)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			http.Error(w, "Place not found", http.StatusNotFound)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	// Ensure the place was created by the requesting user
	if place.CreatedBy != requestingUserID {
		http.Error(w, "You are not authorized to edit this place", http.StatusForbidden)
		return
	}

	// Parse the multipart form
	err = r.ParseMultipartForm(10 << 20) // 10 MB limit
	if err != nil {
		http.Error(w, "Unable to parse form", http.StatusBadRequest)
		return
	}

	// Update place details from the form
	place.Name = r.FormValue("name")
	place.Address = r.FormValue("address")
	place.Description = r.FormValue("description")
	place.PlaceID = placeID // Ensure we keep the same ID

	// Check if required fields are not empty
	if place.Name == "" || place.Address == "" || place.Description == "" {
		http.Error(w, "All fields are required", http.StatusBadRequest)
		return
	}

	// Handle the banner file upload
	bannerFile, _, err := r.FormFile("banner")
	if err != nil && err != http.ErrMissingFile {
		http.Error(w, "Error retrieving banner file", http.StatusBadRequest)
		return
	}
	defer func() {
		if bannerFile != nil {
			bannerFile.Close()
		}
	}()

	if bannerFile != nil {
		// Ensure the directory exists
		err := os.MkdirAll("./placepic", os.ModePerm)
		if err != nil {
			http.Error(w, "Error creating directory for banner", http.StatusInternalServerError)
			return
		}

		// Save the banner file
		out, err := os.Create("./placepic/" + place.PlaceID + ".jpg")
		if err != nil {
			http.Error(w, "Error saving banner", http.StatusInternalServerError)
			return
		}
		defer out.Close()

		if _, err := io.Copy(out, bannerFile); err != nil {
			http.Error(w, "Error saving banner", http.StatusInternalServerError)
			return
		}
		place.Banner = place.PlaceID + ".jpg" // Set the path to the banner
	}

	// Update the place in MongoDB
	_, err = collection.UpdateOne(context.TODO(), bson.M{"placeid": placeID}, bson.M{"$set": place})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	RdxDel("place:" + placeID) // Invalidate the cache for the deleted place
	// Respond with the updated place
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(place); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}

func deletePlace(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	placeID := ps.ByName("placeid")
	var place Place

	// Get the ID of the requesting user from the context
	requestingUserID, ok := r.Context().Value(userIDKey).(string)
	if !ok {
		http.Error(w, "Invalid user", http.StatusBadRequest)
		return
	}
	// log.Println("Requesting User ID:", requestingUserID)

	// Get the place from the database using placeID
	collection := client.Database("eventdb").Collection("places")
	err := collection.FindOne(context.TODO(), bson.M{"placeid": placeID}).Decode(&place)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			http.Error(w, "Place not found", http.StatusNotFound)
		} else {
			http.Error(w, err.Error(), http.StatusInternalServerError)
		}
		return
	}

	// Check if the place was created by the requesting user
	if place.CreatedBy != requestingUserID {
		http.Error(w, "You are not authorized to delete this place", http.StatusForbidden)
		return
	}

	// Delete the place from MongoDB
	_, err = collection.DeleteOne(context.TODO(), bson.M{"placeid": placeID})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	RdxDel("place:" + placeID) // Invalidate the cache for the deleted place

	// Respond with success
	w.WriteHeader(http.StatusOK)
	response := map[string]interface{}{
		"status":  http.StatusNoContent,
		"message": "Place deleted successfully",
	}
	json.NewEncoder(w).Encode(response)
}

/***************************************************/
type Suggestion struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

func getPlaceSuggestions(ctx context.Context, query string) ([]Suggestion, error) {
	var suggestions []Suggestion

	// Use Redis KEYS command to find matching place suggestions by name
	// (this is a simple approach, you may want a more efficient search strategy)
	keys, err := conn.Keys(ctx, fmt.Sprintf("suggestions:place:%s*", query)).Result()
	if err != nil {
		return nil, err
	}

	// Retrieve the corresponding place data
	for _, key := range keys {
		var suggestion Suggestion
		err := conn.Get(ctx, key).Scan(&suggestion)
		if err != nil {
			return nil, err
		}
		suggestions = append(suggestions, suggestion)
	}

	return suggestions, nil
}

func suggestionsHandler(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	query := r.URL.Query().Get("query")
	if query == "" {
		http.Error(w, "Query is required", http.StatusBadRequest)
		return
	}

	ctx := context.Background()
	suggestions, err := getPlaceSuggestions(ctx, query)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error fetching suggestions: %v", err), http.StatusInternalServerError)
		return
	}
	log.Println("handler sugg : ", suggestions)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(suggestions)
}
