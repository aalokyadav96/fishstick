package main

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// type User struct {
// 	ID           primitive.ObjectID   `json:"id" bson:"_id,omitempty"`
// 	Username     string               `json:"username" bson:"username"`
// 	Email        string               `json:"email" bson:"email"`
// 	PasswordHash string               `json:"password_hash" bson:"password_hash"`
// 	ProfilePic   string               `json:"profile_pic,omitempty" bson:"profile_pic,omitempty"`
// 	Followers    []primitive.ObjectID `json:"followers" bson:"followers"`
// 	Following    []primitive.ObjectID `json:"following" bson:"following"`
// 	CreatedAt    time.Time            `json:"created_at" bson:"created_at"`
// 	UpdatedAt    time.Time            `json:"updated_at" bson:"updated_at"`
// }

type Entity struct {
	ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	Type        string             `json:"type" bson:"type"` // "event" or "place"
	Title       string             `json:"title" bson:"title"`
	Description string             `json:"description" bson:"description"`
	Creator     primitive.ObjectID `json:"creator" bson:"creator"`
	Location    GeoJSON            `json:"location,omitempty" bson:"location,omitempty"`
	DateTime    *time.Time         `json:"date_time,omitempty" bson:"date_time,omitempty"`
	CreatedAt   time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt   time.Time          `json:"updated_at" bson:"updated_at"`
}

type EventDetails struct {
	EntityID primitive.ObjectID `json:"entity_id" bson:"entity_id"`
	DateTime time.Time          `json:"date_time" bson:"date_time"`
}

type PlaceDetails struct {
	EntityID  primitive.ObjectID `json:"entity_id" bson:"entity_id"`
	Amenities []string           `json:"amenities,omitempty" bson:"amenities,omitempty"`
}

type GeoJSON struct {
	Type        string    `json:"type" bson:"type"` // Always "Point"
	Coordinates []float64 `json:"coordinates" bson:"coordinates"`
}

type Review struct {
	ID         primitive.ObjectID `json:"id" bson:"_id,omitempty"`
	EntityID   primitive.ObjectID `json:"entity_id" bson:"entity_id"`
	EntityType string             `json:"entity_type" bson:"entity_type"` // "event" or "place"
	Reviewer   primitive.ObjectID `json:"reviewer" bson:"reviewer"`
	Rating     int                `json:"rating" bson:"rating"`
	Comment    string             `json:"comment,omitempty" bson:"comment,omitempty"`
	CreatedAt  time.Time          `json:"created_at" bson:"created_at"`
	UpdatedAt  time.Time          `json:"updated_at" bson:"updated_at"`
	UserID     primitive.ObjectID `bson:"user_id" json:"userId"`
	Content    string             `bson:"content" json:"content"`
}

// type Media struct {
// 	ID         primitive.ObjectID `json:"id" bson:"_id,omitempty"`
// 	EntityID   primitive.ObjectID `json:"entity_id" bson:"entity_id"`
// 	EntityType string             `json:"entity_type" bson:"entity_type"` // "event" or "place"
// 	Uploader   primitive.ObjectID `json:"uploader" bson:"uploader"`
// 	MediaType  string             `json:"media_type" bson:"media_type"` // "image" or "video"
// 	URL        string             `json:"url" bson:"url"`
// 	CreatedAt  time.Time          `json:"created_at" bson:"created_at"`
// 	UserID     primitive.ObjectID `bson:"user_id" json:"userId"`
// 	Type       string             `bson:"type" json:"type"` // "image" or "video"
// 	UpdatedAt  time.Time          `bson:"updated_at" json:"updatedAt"`
// }

// type Merch struct {
// 	ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
// 	EntityID    primitive.ObjectID `json:"entity_id" bson:"entity_id"`
// 	EntityType  string             `json:"entity_type" bson:"entity_type"` // "event" or "place"
// 	Name        string             `json:"name" bson:"name"`
// 	Description string             `json:"description,omitempty" bson:"description,omitempty"`
// 	Price       float64            `json:"price" bson:"price"`
// 	Stock       int                `json:"stock" bson:"stock"`
// 	CreatedAt   time.Time          `json:"created_at" bson:"created_at"`
// 	UserID      primitive.ObjectID `bson:"user_id" json:"userId"`
// 	UpdatedAt   time.Time          `bson:"updated_at" json:"updatedAt"`
// }

// type Ticket struct {
// 	ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
// 	EntityID    primitive.ObjectID `json:"entity_id" bson:"entity_id"`
// 	EntityType  string             `json:"entity_type" bson:"entity_type"` // "event" or "place"
// 	TicketType  string             `json:"ticket_type" bson:"ticket_type"` // e.g., "VIP", "Regular"
// 	Price       float64            `json:"price" bson:"price"`
// 	Available   int                `json:"available" bson:"available"`
// 	Total       int                `json:"total" bson:"total"`
// 	CreatedAt   time.Time          `json:"created_at" bson:"created_at"`
// 	Name        string             `bson:"name" json:"name"`
// 	Description string             `bson:"description,omitempty" json:"description"`
// 	Sold        int                `bson:"sold" json:"sold"`
// 	UpdatedAt   time.Time          `bson:"updated_at" json:"updatedAt"`
// }

// type Activity struct {
// 	ID           primitive.ObjectID  `json:"id" bson:"_id,omitempty"`
// 	UserID       primitive.ObjectID  `json:"user_id" bson:"user_id"`
// 	ActivityType string              `json:"activity_type" bson:"activity_type"` // e.g., "follow", "review", "buy"
// 	EntityID     *primitive.ObjectID `json:"entity_id,omitempty" bson:"entity_id,omitempty"`
// 	EntityType   *string             `json:"entity_type,omitempty" bson:"entity_type,omitempty"` // "event", "place", or null
// 	Timestamp    time.Time           `json:"timestamp" bson:"timestamp"`
// }

type Follower struct {
	FollowerID primitive.ObjectID `json:"follower_id" bson:"follower_id"`
	FolloweeID primitive.ObjectID `json:"followee_id" bson:"followee_id"`
	CreatedAt  time.Time          `json:"created_at" bson:"created_at"`
}

type Follow struct {
	ID         primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	FollowerID primitive.ObjectID `bson:"follower_id" json:"follower_id"` // ID of the user following
	FollowedID primitive.ObjectID `bson:"followed_id" json:"followed_id"` // ID of the user being followed
	CreatedAt  time.Time          `bson:"created_at" json:"created_at"`
}

// type Suggestion struct {
// 	ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
// 	Type        string             `json:"type" bson:"type"` // e.g., "place" or "event"
// 	Title       string             `json:"title" bson:"title"`
// 	Description string             `json:"description,omitempty" bson:"description,omitempty"`
// }

// type Seat struct {
// 	ID         primitive.ObjectID `json:"id" bson:"_id,omitempty"`
// 	EntityID   primitive.ObjectID `json:"entity_id" bson:"entity_id"`
// 	EntityType string             `json:"entity_type" bson:"entity_type"` // e.g., "event" or "place"
// 	SeatNumber string             `json:"seat_number" bson:"seat_number"`
// 	UserID     primitive.ObjectID `json:"user_id" bson:"user_id,omitempty"`
// 	Status     string             `json:"status" bson:"status"` // e.g., "booked", "available"
// }

// type Post struct {
// 	ID        primitive.ObjectID   `json:"id" bson:"_id,omitempty"`
// 	UserID    primitive.ObjectID   `json:"user_id" bson:"user_id"`
// 	Content   string               `json:"content" bson:"content"`
// 	MediaURL  string               `json:"media_url,omitempty" bson:"media_url,omitempty"`
// 	Likes     []primitive.ObjectID `json:"likes" bson:"likes"`
// 	CreatedAt time.Time            `json:"created_at" bson:"created_at"`
// }

type UserProfile struct {
	ID        primitive.ObjectID `bson:"_id,omitempty" json:"id"`
	Username  string             `bson:"username" json:"username"`
	Email     string             `bson:"email" json:"email"`
	FullName  string             `bson:"full_name" json:"fullName"`
	Bio       string             `bson:"bio,omitempty" json:"bio"`
	AvatarURL string             `bson:"avatar_url,omitempty" json:"avatarUrl"`
	CreatedAt time.Time          `bson:"created_at" json:"createdAt"`
	UpdatedAt time.Time          `bson:"updated_at" json:"updatedAt"`
}

// type Entity struct {
// 	ID          primitive.ObjectID `json:"id" bson:"_id,omitempty"`
// 	Type        string             `json:"type" bson:"type"` // "event" or "place"
// 	Title       string             `json:"title" bson:"title"`
// 	Description string             `json:"description" bson:"description"`
// 	Creator     primitive.ObjectID `json:"creator" bson:"creator"`
// 	Location    GeoJSON            `json:"location,omitempty" bson:"location,omitempty"`
// 	CreatedAt   time.Time          `json:"created_at" bson:"created_at"`
// 	UpdatedAt   time.Time          `json:"updated_at" bson:"updated_at"`
// }
