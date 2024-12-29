package main

import (
	"context"
	"io"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/julienschmidt/httprouter"
	"github.com/rs/cors"
)

func main() {
	router := httprouter.New()

	// Proxy routes for any method
	router.Handle("GET", "/api/*path", wrapHandler(proxyHandler("http://localhost:5000")))
	router.Handle("POST", "/api/*path", wrapHandler(proxyHandler("http://localhost:5000")))
	router.Handle("PUT", "/api/*path", wrapHandler(proxyHandler("http://localhost:5000")))
	router.Handle("DELETE", "/api/*path", wrapHandler(proxyHandler("http://localhost:5000")))
	router.Handle("OPTIONS", "/api/*path", wrapHandler(proxyHandler("http://localhost:5000")))

	// Catch-all for unmatched routes
	router.NotFound = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("Handling unmatched route: %s %s", r.Method, r.URL.Path)
		proxy("http://localhost:5000")(w, r, nil)
	})

	// CORS setup
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:5173"}, // Set specific allowed origins
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

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

// Wrap http.HandlerFunc into httprouter.Handle
func wrapHandler(handler http.HandlerFunc) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		handler(w, r) // Call the wrapped handler
	}
}

func proxyHandler(serviceURL string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Printf("Proxying request: %s %s", r.Method, r.URL.Path)
		proxy(serviceURL)(w, r, nil)
	}
}

// Proxy function
func proxy(serviceURL string) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		client := &http.Client{Timeout: 10 * time.Second}
		req, err := http.NewRequest(r.Method, serviceURL+r.URL.Path, r.Body)
		if err != nil {
			http.Error(w, "Invalid Request", http.StatusBadRequest)
			log.Printf("Error creating request: %v", err)
			return
		}
		req.Header = r.Header

		resp, err := client.Do(req)
		if err != nil {
			http.Error(w, "Service Unavailable", http.StatusServiceUnavailable)
			log.Printf("Error making proxy request: %v", err)
			return
		}
		defer resp.Body.Close()

		// Copy headers, excluding Access-Control-Allow-Origin
		for k, vv := range resp.Header {
			if k == "Access-Control-Allow-Origin" {
				continue
			}
			for _, v := range vv {
				w.Header().Add(k, v)
			}
		}
		w.WriteHeader(resp.StatusCode)
		if _, err := io.Copy(w, resp.Body); err != nil {
			log.Printf("Error copying response body: %v", err)
		}
	}
}

// Security headers middleware
func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("X-XSS-Protection", "1; mode=block")
		w.Header().Set("X-Content-Type-Options", "nosniff")
		w.Header().Set("X-Frame-Options", "DENY")
		next.ServeHTTP(w, r)
	})
}
