package main

import (
	"encoding/json"
	"net/http"

	"github.com/julienschmidt/httprouter"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/bson/primitive"
	"go.mongodb.org/mongo-driver/mongo"
)

// Setting represents a single user setting
type Setting struct {
	ID          primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Type        string             `bson:"type" json:"type"`
	Value       interface{}        `bson:"value" json:"value"` // Can be string, number, boolean
	Description string             `bson:"description" json:"description"`
}

func GetCollection(name string) *mongo.Collection {
	return client.Database("eventdb").Collection(name)
}

// Get all settings
func GetSettings(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	collection := GetCollection("settings")

	// Query all settings from the database
	cursor, err := collection.Find(r.Context(), bson.D{})
	if err != nil {
		http.Error(w, "Failed to fetch settings", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(r.Context())

	var settings []Setting
	if err := cursor.All(r.Context(), &settings); err != nil {
		http.Error(w, "Failed to decode settings", http.StatusInternalServerError)
		return
	}

	// If no settings exist, return default settings
	if len(settings) == 0 {
		settings = GetDefaultSettings()
	}

	// Respond with the settings array as JSON
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(settings)
}

// Get a single setting by type
func GetSetting(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	settingType := ps.ByName("type")
	collection := GetCollection("settings")

	var setting Setting
	err := collection.FindOne(r.Context(), bson.D{{Key: "type", Value: settingType}}).Decode(&setting)
	if err == mongo.ErrNoDocuments {
		http.Error(w, "Setting not found", http.StatusNotFound)
		return
	} else if err != nil {
		http.Error(w, "Failed to fetch setting", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(setting)
}

// Update a setting
func UpdateSettings(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	settingType := ps.ByName("type")
	collection := GetCollection("settings")

	var update struct {
		Value interface{} `json:"value"`
	}
	if err := json.NewDecoder(r.Body).Decode(&update); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	filter := bson.D{{Key: "type", Value: settingType}}
	updateDoc := bson.D{{Key: "$set", Value: bson.D{{Key: "value", Value: update.Value}}}}

	result := collection.FindOneAndUpdate(r.Context(), filter, updateDoc)
	if result.Err() == mongo.ErrNoDocuments {
		http.Error(w, "Setting not found", http.StatusNotFound)
		return
	} else if result.Err() != nil {
		http.Error(w, "Failed to update setting", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Create a new setting
func CreateSetting(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	var setting Setting
	if err := json.NewDecoder(r.Body).Decode(&setting); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	collection := GetCollection("settings")
	setting.ID = primitive.NewObjectID()

	_, err := collection.InsertOne(r.Context(), setting)
	if err != nil {
		http.Error(w, "Failed to create setting", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(setting)
}

// Delete a setting
func DeleteSettings(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	settingType := ps.ByName("type")
	collection := GetCollection("settings")

	_, err := collection.DeleteOne(r.Context(), bson.D{{Key: "type", Value: settingType}})
	if err != nil {
		http.Error(w, "Failed to delete setting", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// GetDefaultSettings returns the default settings
func GetDefaultSettings() []Setting {
	return []Setting{
		{Type: "theme", Value: "light", Description: "Default site theme"},
		{Type: "notifications", Value: true, Description: "Enable or disable notifications"},
		{Type: "email", Value: "user@example.com", Description: "Default email address"},
	}
}
