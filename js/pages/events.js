import { state } from "../state/state.js";
import { apiFetch } from "../api/api.js";
import { displayTickets, addTicketForm } from "../services/ticket.js";
import { displayEventMedia, addMediaEventListeners, showMediaUploadForm } from "../services/media.js";
import { displayMerchandise, addMerchForm } from "../services/merch.js";
import { showSnackbar } from "../utils/utils.js";
import { navigate } from "../routes/render.js";


let abortController = null;
let currentPage = 1; // To keep track of the current page
const eventsPerPage = 10; // Define how many events you want per page

async function fetchEvents(page = 1, limit = 10) {
    // Abort the previous fetch if it's still ongoing
    if (abortController) {
        abortController.abort();
    }

    abortController = new AbortController(); // Create a new instance
    const signal = abortController.signal; // Get the signal to pass to apiFetch

    try {
        // Use apiFetch to fetch events and pass the signal for aborting
        const queryParams = new URLSearchParams({ page: page, limit: limit }).toString();
        const events = await apiFetch(`/events?${queryParams}`, 'GET', null, { signal });
        console.log(events);
        return events;
    } catch (error) {
        // If error is due to abort, return null
        if (error.name === 'AbortError') {
            console.log('Fetch aborted');
            return null; // Return null for aborted fetch
        }
        console.error('Error fetching events:', error);
        showSnackbar("An unexpected error occurred while fetching events.");
        return null; // Return null for other errors
    }
}

// Function to show pagination controls based on the current page and total number of pages
function showPaginationControls(currentPage, totalEvents) {
    const paginationContainer = document.getElementById("pagination");

    // For simplicity, let's assume the backend is also returning total number of events or pages
    const totalPages = Math.ceil(totalEvents / eventsPerPage); // assuming `totalEvents` is returned from the backend
    // const totalPages = 2;

    let paginationHTML = '';

    // Show "Previous" button if not on the first page
    if (currentPage > 1) {
        paginationHTML += `<button onclick="displayEvents(${currentPage - 1})">Previous</button>`;
    }

    // Show "Next" button if not on the last page
    if (currentPage < totalPages) {
        paginationHTML += `<button onclick="displayEvents(${currentPage + 1})">Next</button>`;
    }

    paginationContainer.innerHTML = paginationHTML;
}

async function createEvent() {
    if (state.token && state.user) {
        const title = document.getElementById("event-title").value.trim();
        const date = document.getElementById("event-date").value;
        const time = document.getElementById("event-time").value;
        const place = document.getElementById("event-place").value;
        const location = document.getElementById("event-location").value.trim();
        const description = document.getElementById("event-description").value.trim();
        const bannerFile = document.getElementById("event-banner").files[0];
        console.log(title, date, time, place, location, description);
        // Validate input values
        if (!title || !date || !time || !place || !location || !description) {
            showSnackbar("Please fill in all required fields.");
            return;
        }

        const formData = new FormData();
        formData.append('event', JSON.stringify({
            title,
            date: `${date}T${time}`,
            location,
            place,
            description,
        }));
        if (bannerFile) {
            formData.append('banner', bannerFile);
        }

        try {
            const result = await apiFetch('/event', 'POST', formData);
            showSnackbar(`Event created successfully: ${result.title}`);
            navigate('/event/' + result.eventid);
        } catch (error) {
            showSnackbar(`Error creating event: ${error.message}`);
        }
    } else {
        navigate('/login');
    }
}



async function updateEvent(eventId) {
    if (!state.token) {
        showSnackbar("Please log in to update event.");
        return;
    }

    const title = document.getElementById("event-title").value.trim();
    const date = document.getElementById("event-date").value;
    const time = document.getElementById("event-time").value;
    const place = document.getElementById("event-place").value.trim();
    const location = document.getElementById("event-location").value.trim();
    const description = document.getElementById("event-description").value.trim();
    const bannerFile = document.getElementById("event-banner").files[0];

    // Validate input values
    if (!title || !date || !time || !place || !location || !description) {
        showSnackbar("Please fill in all required fields.");
        return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('date', date);
    formData.append('time', time);
    formData.append('place', place);
    formData.append('location', location);
    formData.append('description', description);
    if (bannerFile) {
        formData.append('event-banner', bannerFile);
    }

    try {
        const result = await apiFetch(`/event/${eventId}`, 'PUT', formData);
        showSnackbar(`Event updated successfully: ${result.title}`);
        navigate('/event/' + result.eventid);
    } catch (error) {
        showSnackbar(`Error updating event: ${error.message}`);
    }
}

async function displayEvent(eventId) {
    const content = document.getElementById("content");
    try {
        // Fetch event data from API (assuming you have a function for this)
        const eventData = await fetchEventData(eventId);

        // Display event details, tickets, merchandise, and media
        displayEventDetails(content, eventData);  // Display event details in content
        await displayTickets(eventData.tickets, eventData.creatorid, eventId);
        await displayMerchandise(eventData.merch, eventId, eventData.creatorid);
        await displayEventMedia(eventData.media, eventId);  // Display event media
        await displayEventVenue(eventData.place);  // Display event media
        addMediaEventListeners();
    } catch (error) {
        content.innerHTML = `<h1>Error loading event: ${error.message}</h1>`;
        showSnackbar("Failed to load event details. Please try again later.");
    }
}


async function fetchEventData(eventId) {
    const eventData = await apiFetch(`/event/${eventId}`);
    if (!eventData || !Array.isArray(eventData.tickets)) {
        throw new Error("Invalid event data received.");
    }
    return eventData;
}

async function createEventForm() {
    const createSection = document.getElementById("create-section");
    if (state.token) {
        createSection.innerHTML = `
            <h2>Create Event</h2>
            <div class="form-group">
                <input type="text" id="event-title" placeholder="Event Title" required />
            </div>
            <div class="form-group">
                <textarea id="event-description" placeholder="Event Description" required></textarea>
            </div>
            <div class="form-group">
                <input type="text" id="event-place" placeholder="Event Place" required />
                <div id="place-suggestions" class="suggestions-dropdown"></div>
            </div>
            <div class="form-group">
                <input type="text" id="event-location" placeholder="Event Location" required />
            </div>
            <div class="form-group">
                <input type="date" id="event-date" required />
            </div>
            <div class="form-group">
                <input type="time" id="event-time" required />
            </div>
            <div class="form-group">
                <input type="text" id="organizer-name" placeholder="Organizer Name" required />
            </div>
            <div class="form-group">
                <input type="text" id="organizer-contact" placeholder="Organizer Contact" required />
            </div>
            <div class="form-group">
                <input type="number" id="total-capacity" placeholder="Total Capacity" required />
            </div>
            <div class="form-group">
                <input type="url" id="website-url" placeholder="Website URL" />
            </div>
            <div class="form-group">
                <input type="text" id="category" placeholder="Category" required />
            </div>
            <div class="form-group">
                <input type="file" id="event-banner" accept="image/*" />
            </div>
            <button id="create-event-btn">Create Event</button>
        `;

        const eventPlaceInput = document.getElementById("event-place");
        const placeSuggestionsBox = document.getElementById("place-suggestions");

        eventPlaceInput.addEventListener("input", async function () {
            const query = eventPlaceInput.value.trim();
            if (query === "") {
                placeSuggestionsBox.style.display = "none";
                return;
            }

            try {
                const response = await fetch(`/api/suggestions/places?query=${query}`);
                const suggestions = await response.json();
                placeSuggestionsBox.innerHTML = "";
                placeSuggestionsBox.style.display = suggestions.length > 0 ? "block" : "none";

                suggestions.forEach(suggestion => {
                    const suggestionElement = document.createElement("div");
                    suggestionElement.classList.add("suggestion-item");
                    suggestionElement.textContent = suggestion.name;
                    suggestionElement.dataset.id = suggestion.id;

                    suggestionElement.addEventListener("click", function () {
                        eventPlaceInput.value = suggestion.name;
                        placeSuggestionsBox.style.display = "none";
                    });

                    placeSuggestionsBox.appendChild(suggestionElement);
                });
            } catch (error) {
                console.error("Error fetching place suggestions:", error);
                placeSuggestionsBox.style.display = "none";
            }
        });

        document.addEventListener("click", function (event) {
            if (!event.target.closest("#event-place") && !event.target.closest("#place-suggestions")) {
                placeSuggestionsBox.style.display = "none";
            }
        });

        document.getElementById("create-event-btn").addEventListener("click", createEvent); // Add event listener to button
    } else {
        showSnackbar("Please log in to create an event.");
        navigate('/login');
    }
}

async function displayEventDetails(content, eventData) {
    const isCreator = state.token && state.user === eventData.creatorid;
    const isLoggedIn = state.token;

    content.innerHTML = `
    <div class="event-details">
        <section class="event-header">
            <div class="event-banner">
                <img src="/eventpic/${eventData.banner_image}" alt="Banner for ${eventData.title}" class="event-banner-image" />
            </div>
            <div class="event-info">
                <div class="event-actions" id="event-actions"></div>
                <h1 class="event-title">${eventData.title}</h1>
                <p class="event-date">Date: ${new Date(eventData.date).toLocaleString()}</p>
                <p class="event-place">Place: <a href="/place/${eventData.place}" class="event-place-link">${eventData.place}</a></p>
                <p class="event-location">Location: ${eventData.location}</p>
                <p class="event-description">${eventData.description}</p>
            </div>
        </section>
        <section class="event-actions-wrapper" id="event-actions-wrapper"></section>
        <hr>
        <br><div id='editevent'></div><br>
        <section class="event-grid">
            <div class="event-grid-item">
                <h2>Available Tickets</h2>
                <ul id="ticket-list" class="event-list"></ul>
            </div>
            <div class="event-grid-item">
                <h2>Venue Details</h2>
                <ul id="venue-details" class="event-list"></ul>
            </div>
            <div class="event-grid-item">
                <h2>Available Merchandise</h2>
                <ul id="merch-list" class="event-list"></ul>
            </div>
            <div class="event-grid-item">
                <h2>Event Media</h2>
                <div id="media-list" class="event-list"></div>
            </div>
        </section>
    </div>
    
        <!-- Lightbox for Viewing Media -->
        <div id="lightbox" class="lightbox hflex" style="display: none;" aria-hidden="true">
            <span class="close" onclick="closeLightbox()" aria-label="Close">&times;</span>
            <div class="imgcon">
                <img class="lightbox-content" id="lightbox-image" alt="Full view of media"/>
                <div class="lightbox-caption" id="lightbox-caption"></div>
            </div>
            <button class="prev" onclick="changeImage(-1)" aria-label="Previous image">&#10094;</button>
            <button class="next" onclick="changeImage(1)" aria-label="Next image">&#10095;</button>
        </div>
    </div>
    `;

    if (isLoggedIn) {
        const eventActionsWrapper = document.getElementById("event-actions-wrapper");

        const addMediaButton = document.createElement("button");
        addMediaButton.classList.add("action-btn");
        addMediaButton.textContent = "Add Media";
        addMediaButton.addEventListener("click", () => showMediaUploadForm(eventData.eventid));

        eventActionsWrapper.appendChild(addMediaButton);
    }
    if (isLoggedIn && isCreator) {
        const eventActions = document.getElementById("event-actions");
        const eventActionsWrapper = document.getElementById("event-actions-wrapper");

        const editButton = document.createElement("button");
        editButton.classList.add("action-btn");
        editButton.textContent = "Edit Event";
        editButton.addEventListener("click", () => editEventForm(eventData.eventid));

        const deleteButton = document.createElement("button");
        deleteButton.classList.add("action-btn", "delete-btn");
        deleteButton.textContent = "Delete Event";
        deleteButton.addEventListener("click", () => deleteEvent(eventData.eventid));

        eventActions.appendChild(editButton);
        eventActions.appendChild(deleteButton);

        const addTicketButton = document.createElement("button");
        addTicketButton.classList.add("action-btn");
        addTicketButton.textContent = "Add Ticket";
        addTicketButton.addEventListener("click", () => addTicketForm(eventData.eventid));

        const addMerchButton = document.createElement("button");
        addMerchButton.classList.add("action-btn");
        addMerchButton.textContent = "Add Merchandise";
        addMerchButton.addEventListener("click", () => addMerchForm(eventData.eventid));

        eventActionsWrapper.appendChild(addTicketButton);
        eventActionsWrapper.appendChild(addMerchButton);
    }
}

async function editEventForm(eventId) {
    const createSection = document.getElementById("editevent");
    if (state.token) {
        try {
            // const event = await apiFetch(`/event/${eventId}`);
            createSection.innerHTML = `
                <h2>Edit Event</h2>
                <form id="edit-event-form" class="edit-event-form">
                    <div class="form-group">
                        <label for="event-title">Event Title</label>
                        <input type="text" id="event-title" value="34rtf34" placeholder="Event Title" required>
                    </div>
                    <div class="form-group">
                        <label for="event-date">Event Date</label>
                        <input type="date" id="event-date" value="2024-11-28" required>
                    </div>
                    <div class="form-group">
                        <label for="event-time">Event Time</label>
                        <input type="time" id="event-time" value="00:00" required>
                    </div>
                    <div class="form-group">
                        <label for="event-location">Event Location</label>
                        <input type="text" id="event-location" value="wterwtr" placeholder="Location" required>
                    </div>
                    <div class="form-group">
                        <label for="event-place">Event Place</label>
                        <input type="text" id="event-place" value="wter" placeholder="Place" required>
                    </div>
                    <div class="form-group">
                        <label for="event-description">Event Description</label>
                        <textarea id="event-description" placeholder="Description" required>terter</textarea>
                    </div>
                    <div class="form-group">
                        <label for="event-banner">Event Banner</label>
                        <input type="file" id="event-banner" accept="image/*">
                    </div>
                    <button type="submit" class="update-btn">Update Event</button>
                </form>
            `;

            // Attach event listener to the form for submitting the update
            const editEventFormElement = document.getElementById("edit-event-form");
            editEventFormElement.addEventListener("submit", async (event) => {
                event.preventDefault();
                await updateEvent(eventId);
            });
        } catch (error) {
            showSnackbar(`Error loading event: ${error.message}`);
        }
    } else {
        navigate('/login');
    }
}


function showTab(tabId) {
    // Hide all tab contents
    const allTabs = document.querySelectorAll('.tab-content');
    allTabs.forEach(tab => {
        tab.classList.remove('active');
    });

    // Show the selected tab content
    const selectedTab = document.getElementById(tabId);
    selectedTab.classList.add('active');

    // Highlight the selected tab
    const allTabItems = document.querySelectorAll('.tab-item');
    allTabItems.forEach(item => {
        item.classList.remove('active');
    });

    // const selectedTabItem = Array.from(allTabItems).find(item => item.textContent.toLowerCase() === tabId);
    // selectedTabItem.classList.add('active');
}



// Function to display media for the event
async function displayEventVenue(place) {
    const venueList = document.getElementById("venue-details");
    venueList.innerHTML = `<li>Place: ${place}</li>`;  // Show loading state
}


//================================================================


async function deleteEvent(eventId) {
    if (!state.token) {
        showSnackbar("Please log in to delete your event.");
        return;
    }
    if (confirm("Are you sure you want to delete this event?")) {
        try {
            await apiFetch(`/event/${eventId}`, 'DELETE');
            showSnackbar("Event deleted successfully.");
            navigate('/events'); // Redirect to home or another page
        } catch (error) {
            showSnackbar(`Error deleting event: ${error.message}`);
        }
    }
};



// Function to display events with optional refresh
async function displayEvents(page = 1) {
    const content = document.getElementById("events");
    const eventsPerPage = 10;

    // Fetch new data and save it locally
    const events = await fetchEvents(page, eventsPerPage);
    if (events && events.length > 0) {
        content.innerHTML = events.map(generateEventHTML).join('');
        console.log("Displayed refreshed events.");
    } else {
        content.innerHTML = "<h2>No events available.</h2>";
    }
    // Handle pagination if necessary
    showPaginationControls(page, eventsPerPage);

    // // Reapply the masonry layout after the new events are loaded
    // await MasonryLayout('events','event');
}

// Generate HTML for each event
function generateEventHTML(event) {
    return `
        <div class="event"><a href="/event/${event.eventid}" title="View event details">
            <h1>${event.title}</h1>
            <img src="/eventpic/${event.banner_image}" alt="${event.title} Banner" style="width: 100%; max-height: 300px; object-fit: cover;" />
            <p><strong>Place:</strong> ${event.place}</p>
            <p><strong>Address:</strong> ${event.location}</p>
            <p><strong>Description:</strong> ${event.description}</p>
        </a></div>
    `;
}




export { createEventForm, createEvent, updateEvent, displayEvent, fetchEventData, displayEventDetails, editEventForm, deleteEvent, displayEvents, fetchEvents, generateEventHTML, showTab, displayEventVenue };