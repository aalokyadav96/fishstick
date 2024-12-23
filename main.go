package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/joho/godotenv"
	"github.com/julienschmidt/httprouter"
	"github.com/rs/cors"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file")
	}

	// Get the MongoDB URI from the environment variable
	mongoURI := os.Getenv("MONGODB_URI")
	if mongoURI == "" {
		log.Fatalf("MONGODB_URI environment variable is not set")
	}

	// Use the SetServerAPIOptions() method to set the version of the Stable API on the client
	serverAPI := options.ServerAPI(options.ServerAPIVersion1)
	opts := options.Client().ApplyURI(mongoURI).SetServerAPIOptions(serverAPI)

	// Create a new client and connect to the server
	client, err := mongo.Connect(context.TODO(), opts)
	if err != nil {
		panic(err)
	}

	defer func() {
		if err = client.Disconnect(context.TODO()); err != nil {
			panic(err)
		}
	}()

	// Send a ping to confirm a successful connection
	if err := client.Database("admin").RunCommand(context.TODO(), bson.D{{Key: "ping", Value: 1}}).Err(); err != nil {
		panic(err)
	}
	fmt.Println("Pinged your deployment. You successfully connected to MongoDB!")
	userCollection = client.Database("eventdb").Collection("users")

	router := httprouter.New()
	router.GET("/", Index)
	router.GET("/about", Index)
	router.GET("/profile", Index)
	router.GET("/register", Index)
	router.GET("/login", Index)
	router.GET("/create", Index)
	router.GET("/settings", Index)
	router.GET("/search", Index)
	router.GET("/place", Index)
	router.GET("/places", Index)
	router.GET("/events", Index)
	router.GET("/feed", Index)
	router.GET("/user/:username", Index)
	router.GET("/event/:eventid", Index)
	router.GET("/place/:placeid", Index)

	router.GET("/api/settings", GetSettings)
	router.GET("/api/settings/:type", GetSetting)
	router.PUT("/api/settings/:type", UpdateSettings)
	router.DELETE("/api/settings/:type", DeleteSettings)

	router.GET("/favicon.ico", Favicon)

	router.POST("/api/register", rateLimit(register))
	router.POST("/api/login", rateLimit(login))
	router.POST("/api/logout", authenticate(logoutUser))
	router.GET("/api/profile", authenticate(getProfile))
	router.PUT("/api/profile", authenticate(editProfile))
	router.PUT("/api/profile/dp", authenticate(editProfilePic))
	router.PUT("/api/profile/banner", authenticate(editProfileBanner))
	router.DELETE("/api/profile", authenticate(deleteProfile))
	router.POST("/api/follows/:id", authenticate(toggleFollow))
	router.GET("/api/follows/:id", authenticate(doesFollow))
	router.GET("/api/followers", authenticate(getFollowers))
	router.GET("/api/following", authenticate(getFollowing))
	router.GET("/api/follow/suggestions", authenticate(suggestFollowers))
	router.POST("/api/activity", authenticate(logActivity))
	router.GET("/api/activity", authenticate(getActivityFeed))
	router.GET("/api/user/:username", getUserProfile)
	router.POST("/api/token/refresh", rateLimit(authenticate(refreshToken)))

	router.GET("/api/events", getEvents)
	router.GET("/api/search", searchEvents)
	router.POST("/api/event", authenticate(createEvent))
	router.GET("/api/event/:eventid", getEvent)
	router.PUT("/api/event/:eventid", authenticate(editEvent))
	router.DELETE("/api/event/:eventid", authenticate(deleteEvent))

	// router.POST("/api/event/:eventid/review", authenticate(addReview))

	router.POST("/api/event/:eventid/media", authenticate(addMedia))
	router.GET("/api/event/:eventid/media/:id", getMedia)
	router.PUT("/api/event/:eventid/media/:id", editMedia)
	router.GET("/api/event/:eventid/media", getMedias)
	router.DELETE("/api/event/:eventid/media/:id", authenticate(deleteMedia))

	router.POST("/api/event/:eventid/merch", authenticate(createMerch))
	router.POST("/api/event/:eventid/merch/:merchid/buy", authenticate(buyMerch))
	router.GET("/api/event/:eventid/merch", getMerchs)
	router.GET("/api/event/:eventid/merch/:merchid", getMerch)
	router.PUT("/api/event/:eventid/merch/:merchid", authenticate(editMerch))
	router.DELETE("/api/event/:eventid/merch/:merchid", authenticate(deleteMerch))

	router.POST("/api/event/:eventid/ticket", authenticate(createTicket))
	router.GET("/api/event/:eventid/ticket", getTickets)
	router.GET("/api/event/:eventid/ticket/:ticketid", getTicket)
	router.POST("/api/event/:eventid/tickets/:ticketid/buy", authenticate(buyTicket))
	router.PUT("/api/event/:eventid/ticket/:ticketid", authenticate(editTicket))
	router.DELETE("/api/event/:eventid/ticket/:ticketid", authenticate(deleteTicket))
	router.POST("/api/book-seats", bookSeats)

	router.GET("/api/feed", authenticate(getPosts))
	router.POST("/api/post", authenticate(createTweetPost))
	router.PUT("/api/post/:id", authenticate(editPost))
	router.DELETE("/api/post/:id", authenticate(deletePost))

	router.GET("/api/suggestions/places", suggestionsHandler)
	router.GET("/api/places", getPlaces)
	router.POST("/api/place", authenticate(createPlace))
	router.GET("/api/place/:placeid", getPlace)
	router.PUT("/api/place/:placeid", authenticate(editPlace))
	router.DELETE("/api/place/:placeid", authenticate(deletePlace))
	// router.DELETE("/api/place/:placeid/review", authenticate(addReview))
	router.DELETE("/api/place/:placeid/media", authenticate(addMedia))
	router.POST("/api/place/:placeid/merch", authenticate(createMerch))
	router.GET("/api/place/:placeid/merch/:merchid", getMerch)
	router.PUT("/api/place/:placeid/merch/:merchid", authenticate(editMerch))
	router.DELETE("/api/place/:placeid/merch/:merchid", authenticate(deleteMerch))

	// CORS setup
	allowedOrigin := os.Getenv("ALLOWED_ORIGIN")
	if allowedOrigin == "" {
    		log.Fatal("ALLOWED_ORIGIN environment variable is not set")
	}
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{allowedOrigin},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
		Debug:            true,
	})

	// Serve static files (HTML, CSS, JS)
	router.ServeFiles("/css/*filepath", http.Dir("css"))
	router.ServeFiles("/js/*filepath", http.Dir("js"))
	router.ServeFiles("/uploads/*filepath", http.Dir("uploads"))
	router.ServeFiles("/userpic/*filepath", http.Dir("userpic"))
	router.ServeFiles("/merchpic/*filepath", http.Dir("merchpic"))
	router.ServeFiles("/eventpic/*filepath", http.Dir("eventpic"))
	router.ServeFiles("/placepic/*filepath", http.Dir("placepic"))
	router.ServeFiles("/postpic/*filepath", http.Dir("postpic"))
	// http.ListenAndServe("localhost:4000", router)

	handler := securityHeaders(c.Handler(router))

	server := &http.Server{
		Addr:    ":4000",
		Handler: handler, // Use the middleware-wrapped handler
	}

	// Start server in a goroutine to handle graceful shutdown
	go func() {
		log.Println("Server started on port 4000")
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Could not listen on port 4000: %v", err)
		}
	}()

	// Graceful shutdown listener
	shutdownChan := make(chan os.Signal, 1)
	signal.Notify(shutdownChan, os.Interrupt, syscall.SIGTERM)

	// Wait for termination signal
	<-shutdownChan
	log.Println("Shutting down gracefully...")

	// Attempt to gracefully shut down the server
	if err := server.Shutdown(context.Background()); err != nil {
		log.Fatalf("Server shutdown failed: %v", err)
	}
	log.Println("Server stopped")
}

// Security headers middleware
func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Set HTTP headers for enhanced security
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		next.ServeHTTP(w, r) // Call the next handler
	})
}

var (
	client         *mongo.Client
	userCollection *mongo.Collection
)


func Index(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	tmpl.ExecuteTemplate(w, "index.html", nil)
}

func Favicon(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	// Serve the favicon if needed
}
