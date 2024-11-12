package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/julienschmidt/httprouter"
	"go.mongodb.org/mongo-driver/bson"
)

// Create Ticket
func createTick(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	eventID := ps.ByName("eventid")

	// Retrieve form values
	name := r.FormValue("name")
	priceStr := r.FormValue("price")
	log.Println("\n\n\n\npriceStr : \n\n ", priceStr)
	// Convert the string to float64
	price, err := strconv.ParseFloat(priceStr, 64)
	if err != nil {
		// Handle error (e.g., invalid input)
		http.Error(w, "Invalid price value", http.StatusBadRequest)
		return
	}
	quantity, err := strconv.Atoi(r.FormValue("quantity"))
	if err != nil {
		http.Error(w, "Invalid quantity value", http.StatusBadRequest)
		return
	}

	// Create a new Ticket instance
	tick := Ticket{
		EventID:  eventID,
		Name:     name,
		Price:    price,
		Quantity: quantity,
	}

	tick.TicketID = generateID(12)

	// Insert ticket into MongoDB
	collection := client.Database("eventdb").Collection("ticks")
	_, err = collection.InsertOne(context.TODO(), tick)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Respond with the created ticket
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tick)
}

// // Get all Tickets for an Event
// func getTicks(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
// 	eventID := ps.ByName("eventid")

// 	collection := client.Database("eventdb").Collection("ticks")

// 	var tickList []Ticket
// 	filter := bson.M{"eventid": eventID}

// 	// Query the database
// 	cursor, err := collection.Find(context.Background(), filter)
// 	if err != nil {
// 		http.Error(w, "Failed to fetch tickets", http.StatusInternalServerError)
// 		return
// 	}
// 	defer cursor.Close(context.Background())

// 	// Iterate through the cursor and decode each document into the ticketList
// 	for cursor.Next(context.Background()) {
// 		var tick Ticket
// 		if err := cursor.Decode(&tick); err != nil {
// 			http.Error(w, "Failed to decode ticket", http.StatusInternalServerError)
// 			return
// 		}
// 		tickList = append(tickList, tick)
// 	}

// 	// Check for cursor errors
// 	if err := cursor.Err(); err != nil {
// 		http.Error(w, "Cursor error", http.StatusInternalServerError)
// 		return
// 	}
// 	if len(tickList) == 0 {
// 		tickList = []Ticket{}
// 	}

// 	// Respond with the ticket data
// 	w.Header().Set("Content-Type", "application/json")
// 	if err := json.NewEncoder(w).Encode(tickList); err != nil {
// 		http.Error(w, "Failed to encode ticket data", http.StatusInternalServerError)
// 	}
// }

func getTicks(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	eventID := ps.ByName("eventid")
	cacheKey := "event:" + eventID + ":tickets"

	// Check if the tickets are cached
	cachedTickets, err := RdxGet(cacheKey)
	if err == nil && cachedTickets != "" {
		// If cached, return the data from Redis
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(cachedTickets))
		return
	}

	// Retrieve tickets from MongoDB if not cached
	collection := client.Database("eventdb").Collection("ticks")
	var tickList []Ticket
	filter := bson.M{"eventid": eventID}
	cursor, err := collection.Find(context.Background(), filter)
	if err != nil {
		http.Error(w, "Failed to fetch tickets", http.StatusInternalServerError)
		return
	}
	defer cursor.Close(context.Background())
	for cursor.Next(context.Background()) {
		var tick Ticket
		if err := cursor.Decode(&tick); err != nil {
			http.Error(w, "Failed to decode ticket", http.StatusInternalServerError)
			return
		}
		tickList = append(tickList, tick)
	}

	if err := cursor.Err(); err != nil {
		http.Error(w, "Cursor error", http.StatusInternalServerError)
		return
	}

	// Cache the tickets in Redis
	ticketsJSON, _ := json.Marshal(tickList)
	RdxSet(cacheKey, string(ticketsJSON))

	// Respond with the ticket data
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tickList)
}

// Fetch a single ticketandise item
func getTick(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	eventID := ps.ByName("eventid")
	ticketID := ps.ByName("ticketid")
	cacheKey := fmt.Sprintf("tick:%s:%s", eventID, ticketID)

	// Check if the ticket is cached
	cachedTicket, err := RdxGet(cacheKey)
	if err == nil && cachedTicket != "" {
		// Return cached data
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(cachedTicket))
		return
	}

	collection := client.Database("eventdb").Collection("ticks")
	var ticket Ticket
	err = collection.FindOne(context.TODO(), bson.M{"eventid": eventID, "ticketid": ticketID}).Decode(&ticket)
	if err != nil {
		http.Error(w, fmt.Sprintf("Ticket not found: %v", err), http.StatusNotFound)
		return
	}

	// Cache the result
	ticketJSON, _ := json.Marshal(ticket)
	RdxSet(cacheKey, string(ticketJSON))

	// Respond with ticket data
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(ticket)
}

// Edit Ticket
func editTick(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	eventID := ps.ByName("eventid")
	tickID := ps.ByName("ticketid")

	var tick Ticket
	// Parse the incoming ticket data
	if err := json.NewDecoder(r.Body).Decode(&tick); err != nil {
		http.Error(w, "Invalid input data", http.StatusBadRequest)
		return
	}

	// Fetch the current ticket from the database to compare with the new data
	collection := client.Database("eventdb").Collection("ticks")
	var existingTicket Ticket
	err := collection.FindOne(context.TODO(), bson.M{"eventid": eventID, "ticketid": tickID}).Decode(&existingTicket)
	if err != nil {
		http.Error(w, "Ticket not found", http.StatusNotFound)
		return
	}

	// Create a map to store fields that need to be updated
	updateFields := bson.M{}

	// Only add fields to update if they have changed
	if tick.Name != "" && tick.Name != existingTicket.Name {
		updateFields["name"] = tick.Name
	}
	if tick.Price > 0 && tick.Price != existingTicket.Price {
		updateFields["price"] = tick.Price
	}
	if tick.Quantity >= 0 && tick.Quantity != existingTicket.Quantity {
		updateFields["quantity"] = tick.Quantity
	}

	// If no fields have changed, return a response without doing an update
	if len(updateFields) == 0 {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": false,
			"message": "No changes detected for ticket",
		})
		return
	}

	// Update the ticket in MongoDB with only the changed fields
	_, err = collection.UpdateOne(context.TODO(), bson.M{"eventid": eventID, "ticketid": tickID}, bson.M{"$set": updateFields})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Invalidate the cache for this event's tickets
	RdxDel("event:" + eventID + ":tickets")

	// Send a success response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Ticket updated successfully",
		"data":    updateFields,
	})
}

// // Edit Ticket
// func editTick(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
// 	eventID := ps.ByName("eventid")
// 	tickID := ps.ByName("ticketid")
// 	var tick Ticket
// 	json.NewDecoder(r.Body).Decode(&tick)

// 	// Update the ticket in MongoDB
// 	collection := client.Database("eventdb").Collection("ticks")
// 	_, err := collection.UpdateOne(context.TODO(), bson.M{"eventid": eventID, "ticketid": tickID}, bson.M{"$set": tick})
// 	if err != nil {
// 		http.Error(w, err.Error(), http.StatusInternalServerError)
// 		return
// 	}

// 	// // Invalidate the cache for this event's tickets
// 	// RdxDel("event:" + eventID + ":tickets")

// 	// // Send the updated ticket back as a response
// 	// w.Header().Set("Content-Type", "application/json")
// 	// w.WriteHeader(http.StatusOK)
// 	// json.NewEncoder(w).Encode(tick)
// 	w.Header().Set("Content-Type", "application/json")
// 	w.WriteHeader(http.StatusOK)
// 	json.NewEncoder(w).Encode(map[string]interface{}{
// 		"success": true,
// 		"message": "Ticket updated successfully",
// 		"data":    tick,
// 	})
// 	RdxDel("event:" + eventID + ":tickets")
// }

// // Edit Ticket
// func editTick(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
// 	eventID := ps.ByName("eventid")
// 	tickID := ps.ByName("ticketid")
// 	var tick Ticket
// 	json.NewDecoder(r.Body).Decode(&tick)

// 	// Update the ticket in MongoDB
// 	collection := client.Database("eventdb").Collection("ticks")
// 	_, err := collection.UpdateOne(context.TODO(), bson.M{"eventid": eventID, "ticketid": tickID}, bson.M{"$set": tick})
// 	if err != nil {
// 		http.Error(w, err.Error(), http.StatusInternalServerError)
// 		return
// 	}

// 	RdxDel("event:" + eventID + ":tickets") // Invalidate the cache for this event's tickets

// 	json.NewEncoder(w).Encode(tick)
// }

// Delete Ticket
func deleteTick(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	eventID := ps.ByName("eventid")
	tickID := ps.ByName("ticketid")

	// Delete the ticket from MongoDB
	collection := client.Database("eventdb").Collection("ticks")
	_, err := collection.DeleteOne(context.TODO(), bson.M{"eventid": eventID, "ticketid": tickID})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	// w.WriteHeader(http.StatusNoContent)
	// Respond with success
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Ticket deleted successfully",
	})
	RdxDel("event:" + eventID + ":tickets") // Invalidate cache after deletion
}

// Buy Ticket
func buyTicket(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	eventID := ps.ByName("eventid")
	ticketID := ps.ByName("ticketid")

	// Find the ticket in the database
	collection := client.Database("eventdb").Collection("ticks")
	var ticket Ticket // Define the Ticket struct based on your schema
	err := collection.FindOne(context.TODO(), bson.M{"eventid": eventID, "ticketid": ticketID}).Decode(&ticket)
	if err != nil {
		http.Error(w, "Ticket not found or other error", http.StatusNotFound)
		return
	}

	// Check if there are tickets available
	if ticket.Quantity <= 0 {
		http.Error(w, "No tickets available for purchase", http.StatusBadRequest)
		return
	}

	// Decrease the ticket quantity
	update := bson.M{"$inc": bson.M{"quantity": -1}}
	_, err = collection.UpdateOne(context.TODO(), bson.M{"eventid": eventID, "ticketid": ticketID}, update)
	if err != nil {
		http.Error(w, "Failed to update ticket quantity", http.StatusInternalServerError)
		return
	}

	// Respond with success
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Ticket purchased successfully",
	})
}
