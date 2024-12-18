package main

import (
	"context"
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/julienschmidt/httprouter"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func createEvent(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	// Parse the multipart form with a 10MB limit
	if err := r.ParseMultipartForm(10 << 20); err != nil { // Limit upload size to 10MB
		http.Error(w, "Unable to parse form", http.StatusBadRequest)
		return
	}

	var event Event
	// Get the event data from the form (assuming it's passed as JSON string)
	err := json.Unmarshal([]byte(r.FormValue("event")), &event)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Retrieve the ID of the requesting user from the context
	requestingUserID, ok := r.Context().Value(userIDKey).(string)
	if !ok {
		http.Error(w, "Invalid user", http.StatusBadRequest)
		return
	}
	event.CreatorID = requestingUserID
	event.CreatedAt = time.Now()

	// Generate a unique EventID
	event.EventID = generateID(14)

	// Handle the banner image upload (if present)
	bannerFile, _, err := r.FormFile("banner")
	if err != nil && err != http.ErrMissingFile {
		http.Error(w, "error retrieving banner file", http.StatusBadRequest)
		return
	}

	// If a banner file is provided, process it
	if bannerFile != nil {
		// Ensure the directory exists
		if err := os.MkdirAll("./eventpic", os.ModePerm); err != nil {
			http.Error(w, "error creating directory for banner", http.StatusInternalServerError)
			return
		}

		// Save the banner image
		out, err := os.Create("./eventpic/" + event.EventID + ".jpg")
		if err != nil {
			http.Error(w, "error saving banner", http.StatusInternalServerError)
			return
		}
		defer out.Close()

		// Copy the content from the uploaded file to the destination file
		if _, err := io.Copy(out, bannerFile); err != nil {
			http.Error(w, "error saving banner", http.StatusInternalServerError)
			return
		}

		// Set the event's banner image field with the saved image path
		event.BannerImage = event.EventID + ".jpg"
	}

	// Insert the event into MongoDB
	collection := client.Database("eventdb").Collection("events")
	_, err = collection.InsertOne(context.TODO(), event)
	if err != nil {
		http.Error(w, "error saving event", http.StatusInternalServerError)
		return
	}

	// Respond with the created event
	w.WriteHeader(http.StatusCreated) // 201 Created
	if err := json.NewEncoder(w).Encode(event); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}

func getEvents(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	// Set the response header to indicate JSON content type
	w.Header().Set("Content-Type", "application/json")

	// Parse pagination query parameters (page and limit)
	pageStr := r.URL.Query().Get("page")
	limitStr := r.URL.Query().Get("limit")

	// Default values for pagination
	page := 1
	limit := 10

	// Parse page and limit, using defaults if invalid
	if pageStr != "" {
		if parsedPage, err := strconv.Atoi(pageStr); err == nil {
			page = parsedPage
		}
	}

	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil {
			limit = parsedLimit
		}
	}

	// Calculate skip value based on page and limit
	skip := (page - 1) * limit

	// Convert limit and skip to int64
	int64Limit := int64(limit)
	int64Skip := int64(skip)

	// Get the collection
	collection := client.Database("eventdb").Collection("events")

	// Create the sort order (descending by createdAt)
	sortOrder := bson.D{{Key: "created_at", Value: -1}}

	// Find events with pagination and sorting
	cursor, err := collection.Find(context.TODO(), bson.M{}, &options.FindOptions{
		Skip:  &int64Skip,
		Limit: &int64Limit,
		Sort:  sortOrder,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.TODO())

	var events []Event
	if err = cursor.All(context.TODO(), &events); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Encode the list of events as JSON and write to the response
	if err := json.NewEncoder(w).Encode(events); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func getEvent(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	id := ps.ByName("eventid")

	// Aggregation pipeline to fetch event along with related tickets, media, and merch
	pipeline := mongo.Pipeline{
		bson.D{{Key: "$match", Value: bson.D{{Key: "eventid", Value: id}}}},
		bson.D{{Key: "$lookup", Value: bson.D{
			{Key: "from", Value: "ticks"},
			{Key: "localField", Value: "eventid"},
			{Key: "foreignField", Value: "eventid"},
			{Key: "as", Value: "tickets"},
		}}},
		bson.D{{Key: "$lookup", Value: bson.D{
			{Key: "from", Value: "media"},
			{Key: "localField", Value: "eventid"},
			{Key: "foreignField", Value: "eventid"},
			{Key: "as", Value: "media"},
		}}},
		bson.D{{Key: "$lookup", Value: bson.D{
			{Key: "from", Value: "merch"},
			{Key: "localField", Value: "eventid"},
			{Key: "foreignField", Value: "eventid"},
			{Key: "as", Value: "merch"},
		}}},
	}

	// Execute the aggregation query
	eventsCollection := client.Database("eventdb").Collection("events")
	cursor, err := eventsCollection.Aggregate(context.TODO(), pipeline)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.TODO())

	var event Event
	if cursor.Next(context.TODO()) {
		if err := cursor.Decode(&event); err != nil {
			http.Error(w, "Failed to decode event data", http.StatusInternalServerError)
			return
		}
	} else {
		http.Error(w, "Event not found", http.StatusNotFound)
		return
	}

	// Encode the event as JSON and write to response
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(event); err != nil {
		http.Error(w, "Failed to encode event data", http.StatusInternalServerError)
	}
}

// Handle editing event
func editEvent(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	eventID := ps.ByName("eventid")

	// Extract and update event fields
	updateFields, err := updateEventFields(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Validate required fields
	if err := validateUpdateFields(updateFields); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Handle file upload
	bannerImage, err := handleFileUpload(r, eventID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Update banner image if available
	if bannerImage != "" {
		updateFields["banner_image"] = bannerImage
	}

	// Update the event in MongoDB (only the fields that have changed)
	collection := client.Database("eventdb").Collection("events")
	updateFields["updated_at"] = time.Now() // Update the timestamp for the update

	_, err = collection.UpdateOne(
		context.TODO(),
		bson.M{"eventid": eventID},
		bson.M{"$set": updateFields},
	)
	if err != nil {
		http.Error(w, "error updating event", http.StatusInternalServerError)
		return
	}

	updateFields["eventid"] = eventID
	// Respond with the updated event
	sendJSONResponse(w, http.StatusOK, updateFields)
}

// Handle deleting event
func deleteEvent(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	eventID := ps.ByName("eventid")

	// Get the ID of the requesting user from the context
	requestingUserID, ok := r.Context().Value(userIDKey).(string)
	if !ok {
		http.Error(w, "Invalid user", http.StatusBadRequest)
		return
	}

	// Get the event details to verify the creator
	collection := client.Database("eventdb").Collection("events")
	var event Event
	err := collection.FindOne(context.TODO(), bson.M{"eventid": eventID}).Decode(&event)
	if err != nil {
		http.Error(w, "Event not found", http.StatusNotFound)
		return
	}

	// Check if the requesting user is the creator of the event
	if event.CreatorID != requestingUserID {
		log.Printf("User %s attempted to delete an event they did not create. EventID: %s", requestingUserID, eventID)
		http.Error(w, "Unauthorized to delete this event", http.StatusForbidden)
		return
	}

	// Delete the event from MongoDB
	_, err = collection.DeleteOne(context.TODO(), bson.M{"eventid": eventID})
	if err != nil {
		http.Error(w, "error deleting event", http.StatusInternalServerError)
		return
	}

	// Delete related data (tickets, media, merch)
	if err := deleteRelatedData(eventID); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Send success response
	sendJSONResponse(w, http.StatusOK, map[string]string{"message": "Event deleted successfully"})
}
