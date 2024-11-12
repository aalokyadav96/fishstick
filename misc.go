package main

// Your code looks quite good in terms of structure and functionality, but there are always areas for improvement, especially regarding performance, security, readability, and maintainability. Here are a few suggestions:

// ### 1. **Error Handling Improvements**
//    - **Use Custom Error Types**: Instead of always sending generic error messages (like "Error retrieving event" or "Failed to encode response"), consider using custom error types. This can help with debugging and provide more specific error responses to clients. For example, you can define custom error types that include an error code or category.

//    Example:

//    ```go
//    type CustomError struct {
//        Code    int
//        Message string
//    }

//    func (e *CustomError) Error() string {
//        return e.Message
//    }

//    func sendError(w http.ResponseWriter, err *CustomError) {
//        w.WriteHeader(err.Code)
//        json.NewEncoder(w).Encode(map[string]string{"error": err.Message})
//    }
//    ```

//    Then, use it in your functions like:

//    ```go
//    if err != nil {
//        sendError(w, &CustomError{Code: http.StatusInternalServerError, Message: "Error retrieving event"})
//        return
//    }
//    ```

//    This ensures consistency in how errors are handled across your application.

// ### 2. **Database Query Optimization**
//    - **Indexes**: If you're doing a lot of queries on fields like `eventid`, `creatorid`, or other frequently queried fields, ensure that MongoDB has appropriate indexes on those fields. This can drastically improve query performance, especially as your dataset grows.

//    Example MongoDB index creation:

//    ```go
//    collection := client.Database("eventdb").Collection("events")
//    indexModel := mongo.IndexModel{
//        Keys: bson.M{"eventid": 1}, // 1 for ascending, -1 for descending
//        Options: nil,
//    }
//    _, err := collection.Indexes().CreateOne(context.TODO(), indexModel)
//    if err != nil {
//        log.Fatal(err)
//    }
//    ```

//    Similarly, add indexes to other collections based on the fields you're querying most frequently.

// ### 3. **Avoid Redundant Code in Functions**
//    - **Duplication in Fetching Related Data**: In the `getEvent` function, you're querying related data from the `tickets`, `media`, and `merch` collections in very similar ways. You can abstract this code into a single function that can be reused for all these cases. This helps in making your code DRY (Don't Repeat Yourself).

//    For example:

//    ```go
//    func fetchRelatedData(collectionName, eventID string) ([]interface{}, error) {
//        collection := client.Database("eventdb").Collection(collectionName)
//        cursor, err := collection.Find(context.TODO(), bson.M{"eventid": eventID})
//        if err != nil {
//            return nil, err
//        }
//        defer cursor.Close(context.TODO())

//        var result []interface{}
//        for cursor.Next(context.TODO()) {
//            var item interface{}
//            if err := cursor.Decode(&item); err == nil {
//                result = append(result, item)
//            }
//        }
//        return result, nil
//    }
//    ```

//    This way, you could replace the redundant blocks in `getEvent` with something like:

//    ```go
//    tickets, err := fetchRelatedData("ticks", id)
//    if err == nil {
//        event.Tickets = tickets
//    }
//    ```

//    This reduces duplication and makes your code more maintainable.

// ### 4. **Use More Descriptive Names for Variables**
//    - **Avoid Overuse of Generic Names**: Some variable names, like `eventID`, `event`, and `result` are clear enough, but try to avoid ambiguous or overly generic names like `eventCollection` or `ticketsCursor`. For example, `ticketsCursor` could be renamed to `ticketDataCursor` to make it clearer that you're iterating over ticket-related data.

// ### 5. **Security Enhancements**
//    - **Token Expiry**: When using token-based authentication (e.g., JWT), make sure you set expiration times for tokens. JWT tokens, for instance, should have an expiry (`exp` claim) to prevent misuse in case they are intercepted.

//    - **CORS**: In your CORS settings, consider tightening the allowed origins for security. Allowing all origins (`[]string{"*"}`) might be convenient during development, but it's a security risk in production. Only allow trusted origins.

//      Example:
//      ```go
//      c := cors.New(cors.Options{
//          AllowedOrigins: []string{"https://your-trusted-domain.com"},
//          AllowedMethods: []string{"GET", "POST", "PUT", "DELETE"},
//          AllowCredentials: true,
//      })
//      ```

// ### 6. **Graceful Shutdown**
//    - **Context for Shutdown**: You already have a graceful shutdown mechanism, but it could be improved by using a `context.Context` when calling `server.Shutdown()`. This would allow you to have control over the shutdown timeout and handle any long-running tasks or requests gracefully before the application shuts down.

//    Example:

//    ```go
//    shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
//    defer cancel()

//    if err := server.Shutdown(shutdownCtx); err != nil {
//        log.Fatalf("Server shutdown failed: %v", err)
//    }
//    ```

// ### 7. **Unit Testing**
//    - **Test Your Handlers**: It’s crucial to write unit tests for your handler functions, especially for more complex routes like `getEvent`, `editEvent`, and `deleteEvent`. Consider using the `httptest` package to simulate requests and ensure your endpoints are working as expected.

//    Example of a basic unit test for `getEvent`:

//    ```go
//    func TestGetEvent(t *testing.T) {
//        req, err := http.NewRequest("GET", "/api/event/123", nil)
//        if err != nil {
//            t.Fatal(err)
//        }

//        rr := httptest.NewRecorder()
//        handler := http.HandlerFunc(getEvent)

//        handler.ServeHTTP(rr, req)

//        if rr.Code != http.StatusOK {
//            t.Errorf("Expected status 200, got %v", rr.Code)
//        }

//        // Check that the body contains expected data (e.g., event title)
//        expected := `{"eventid":"123","title":"Event Title"}`
//        if rr.Body.String() != expected {
//            t.Errorf("Expected body %v, got %v", expected, rr.Body.String())
//        }
//    }
//    ```

// ### 8. **Environment Variables for Configuration**
//    - **Sensitive Information**: Don't hardcode sensitive information like database URLs, secret keys, or API keys directly in your code. Instead, use environment variables or a configuration file. This is especially important when deploying to production.

//    Example using `os.Getenv`:

//    ```go
//    dbURI := os.Getenv("MONGODB_URI")
//    if dbURI == "" {
//        log.Fatal("MONGODB_URI is not set")
//    }
//    ```

// ### 9. **Better Logging**
//    - Consider using a structured logging library like [logrus](https://github.com/sirupsen/logrus) or [zap](https://github.com/uber-go/zap). These libraries allow for more advanced logging features, such as log levels (info, debug, error), structured logs, and easier log formatting.

// ### 10. **Rate Limiting**
//    - **Global Rate Limiting**: You already have rate limiting in place for certain routes. Consider adding global rate limiting for API requests to ensure you don't accidentally overload the server with too many requests from any client.

//    For example, you can use [go-rate-limiter](https://github.com/juju/ratelimit) or other similar libraries to control the number of requests a client can make per time unit.

// ---

// ### Final Thoughts:
// - **Optimization**: Always keep performance in mind, especially as your application scales. This includes things like optimizing database queries, caching frequently accessed data, and avoiding redundant computations.

// - **Documentation**: Documenting your API endpoints (either inline or using a tool like Swagger) will improve collaboration and make future development easier.

// - **Security**: Continue to prioritize security (especially with user data). Use HTTPS in production, sanitize user inputs, and keep your dependencies up to date.

// By improving these areas, your code will be more robust, secure, and easier to maintain. Great work so far!

// GET /api/user/
// /activities: A list of activities (reviews, purchases, etc.) by the user.
// GET /api/user/
// /reviews: All reviews posted by the user (for both events and places).
// GET /api/user/
// /followers: Get the followers of a specific user (this is already present).
// GET /api/user/
// /following: Get the users the user is following (also already present).

// Pagination: GET /api/events?page=2&limit=10
// Filtering: GET /api/events?category=music&date=2024-11-01
// Sorting: GET /api/events?sort=date&order=asc
