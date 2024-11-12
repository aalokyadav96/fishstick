import { state } from "./state.js";
import { apiFetch } from "./api.js";
import { displayTickets } from "./ticket.js";
import { displayEventMedia } from "./media.js";
import { displayMerchandise } from "./merch.js";
import { showSnackbar } from "./utils.js";


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

// let abortController; // Keep this scoped to the function if it’s needed only for `fetchEvents`
// async function fetchEvents() {
//     // Abort the previous fetch if it's still ongoing
//     if (abortController) {
//         abortController.abort();
//     }

//     abortController = new AbortController(); // Create a new instance
//     const signal = abortController.signal; // Get the signal to pass to apiFetch

//     try {
//         // Use apiFetch to fetch events and pass the signal for aborting
//         const events = await apiFetch('/events', 'GET', null, { signal });
//         return events;
//     } catch (error) {
//         // If error is due to abort, return null
//         if (error.name === 'AbortError') {
//             console.log('Fetch aborted');
//             return null; // Return null for aborted fetch
//         }
//         console.error('Error fetching events:', error);
//         showSnackbar("An unexpected error occurred while fetching events.");
//         return null; // Return null for other errors
//     }
// }

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
            <button onclick="window.createEvent()">Create Event</button>
        `;
    } else {
        showSnackbar("Please log in to create an event.");
        navigate('/login');
    }
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



// async function createEventForm() {
//     const createSection = document.getElementById("create-section");
//     if (state.token) {
//         createSection.innerHTML = `
//             <h2>Create Event</h2>
//             <input type="text" id="event-title" placeholder="Event Title" required />
//             <textarea id="event-description" placeholder="Event Description" required></textarea>
//             <input type="text" id="event-place" placeholder="Event Place" required />
//             <input type="text" id="event-location" placeholder="Event Location" required />
//             <input type="date" id="event-date" required />
//             <input type="time" id="event-time" required />
//             <input type="text" id="organizer-name" placeholder="Organizer Name" required />
//             <input type="text" id="organizer-contact" placeholder="Organizer Contact" required />
//             <input type="number" id="total-capacity" placeholder="Total Capacity" required />
//             <input type="url" id="website-url" placeholder="Website URL" />
//             <input type="text" id="category" placeholder="Category" required />
//             <input type="file" id="event-banner" accept="image/*" />
//             <button onclick="window.createEvent()">Create Event</button>
//         `;
//     } else {
//         showSnackbar("Please log in to create an event.");
//         navigate('/login');
//     }
// }

// async function createEvent() {
//     if (state.token) {
//         const title = document.getElementById("event-title").value.trim();
//         const date = document.getElementById("event-date").value;
//         const time = document.getElementById("event-time").value;
//         const place = document.getElementById("event-place").value;
//         const location = document.getElementById("event-location").value.trim();
//         const description = document.getElementById("event-description").value.trim();
//         const bannerFile = document.getElementById("event-banner").files[0];

//         // Validate input values
//         if (!title || !date || !time || !place || !location || !description) {
//             showSnackbar("Please fill in all required fields.");
//             return;
//         }

//         const formData = new FormData();
//         formData.append('event', JSON.stringify({
//             title,
//             date: `${date}T${time}`,
//             location,
//             place,
//             description,
//         }));
//         if (bannerFile) {
//             formData.append('banner', bannerFile);
//         }

//         try {
//             const result = await apiFetch('/event', 'POST', formData);
//             showSnackbar(`Event created successfully: ${result.title}`);
//             navigate('/event/' + result.eventid);
//         } catch (error) {
//             showSnackbar(`Error creating event: ${error.message}`);
//         }
//     } else {
//         navigate('/login');
//     }
// }

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
        // navigate('/event/' + result.eventid);
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
        await displayTickets(eventData.tickets, eventData.creatorid, eventId);  // Display available tickets
        await displayMerchandise(eventData.merch, eventId, eventData.creatorid);  // Display available merchandise
        await displayEventMedia(eventData.media, eventId);  // Display event media

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

async function displayEventDetails(content, eventData) {
    const isCreator = state.token && state.user === eventData.creatorid;
    const isLoggedIn = state.token;

    content.innerHTML = `
        <div class="event-details">
            <!-- Event Header with Image and Title -->
            <div class="event-header">
                <div class="event-banner">
                    <img src="/eventpic/${eventData.banner_image}" alt="${eventData.title}" class="event-banner-image"/>
                </div>
                <div class="event-info">
                    <h1 class="event-title">${eventData.title}</h1>
                    <p class="event-date">Date: ${new Date(eventData.date).toLocaleString()}</p>
                    <p class="event-place">Place: <a href="/place/${eventData.place}" class="event-place-link">${eventData.place}</a></p>
                    <p class="event-location">Location: ${eventData.location}</p>
                    <p class="event-description">${eventData.description}</p>
                </div>
            </div>

            <!-- Event Actions (for logged in users) -->
            <div class="event-actions">
                ${isLoggedIn ? `
                    <button class="action-btn" onclick="showMediaUploadForm('${eventData.eventid}')">Add Media</button>
                    ${isCreator ? `
                        <button class="action-btn" onclick="editEventForm('${eventData.eventid}')">Edit Event</button>
                        <button class="action-btn" onclick="window.deleteEvent('${eventData.eventid}')">Delete Event</button>
                        <button class="action-btn" onclick="addTicketForm('${eventData.eventid}')">Add Ticket</button>
                        <button class="action-btn" onclick="addMerchForm('${eventData.eventid}')">Add Merchandise</button>
                    ` : ``}
                ` : ``}
            </div>

                <div id='editevent'></div>
            <!-- Event Details Grid (Tickets, Merchandise, Media) -->
            <div class="event-grid">
                <div class="event-grid-item">
                    <h2>Available Tickets</h2>
                    <ul id="ticket-list" class="event-list"></ul>
                </div>

                <div class="event-grid-item">
                    <h2>Available Merchandise</h2>
                    <ul id="merch-list" class="event-list"></ul>
                </div>

                <div class="event-grid-item">
                    <h2>Event Media</h2>
                    <div id="media-list" class="event-list"></div>
                </div>
            </div>

            <!-- Lightbox for Viewing Media -->
            <div id="lightbox" class="lightbox" style="display: none;">
                <span class="close" onclick="closeLightbox()">&times;</span>
                <div class="imgcon">
                    <img class="lightbox-content" id="lightbox-image" alt=""/>
                    <div class="lightbox-caption" id="lightbox-caption"></div>
                </div>
                <button class="prev" onclick="changeImage(-1)">&#10094;</button>
                <button class="next" onclick="changeImage(1)">&#10095;</button>
            </div>
        </div>
    `;
}

//================================================================

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
            <input type="text" id="event-title" value="34rtf34" placeholder="Event Title" required="">
        </div>
        <div class="form-group">
            <label for="event-date">Event Date</label>
            <input type="date" id="event-date" value="2024-11-28" required="">
        </div>
        <div class="form-group">
            <label for="event-time">Event Time</label>
            <input type="time" id="event-time" value="00:00" required="">
        </div>
        <div class="form-group">
            <label for="event-location">Event Location</label>
            <input type="text" id="event-location" value="wterwtr" placeholder="Location" required="">
        </div>
        <div class="form-group">
            <label for="event-place">Event Place</label>
            <input type="text" id="event-place" value="wter" placeholder="Place" required="">
        </div>
        <div class="form-group">
            <label for="event-description">Event Description</label>
            <textarea id="event-description" placeholder="Description" required="">terter</textarea>
        </div>
        <div class="form-group">
            <label for="event-banner">Event Banner</label>
            <input type="file" id="event-banner" accept="image/*">
        </div>
        <button type="button" class="update-btn" onclick="window.updateEvent('SNCDQsI8cIixee')">Update Event</button>
    </form>`;
        } catch (error) {
            showSnackbar(`Error loading event: ${error.message}`);
        }
    } else {
        navigate('/login');
    }
};


// async function editEventForm(eventId) {
//     const createSection = document.getElementById("editevent");
//     if (state.token) {
//         try {
//             const event = await apiFetch(`/event/${eventId}`);
//             createSection.innerHTML = `
//     <h2>Edit Event</h2>
//     <input type="text" id="event-title" value="${event.title}" placeholder="Event Title" required />
//     <input type="date" id="event-date" value="${new Date(event.date).toISOString().split('T')[0]}" required />
//     <input type="time" id="event-time" value="${new Date(event.date).toISOString().split('T')[1].slice(0, 5)}" required />
//     <input type="text" id="event-location" value="${event.location}" placeholder="Location" required />
//     <input type="text" id="event-place" value="${event.place}" placeholder="Place" required />
//     <textarea id="event-description" placeholder="Description" required>${event.description}</textarea>
//     <input type="file" id="event-banner" accept="image/*" />
//     <button onclick="window.updateEvent('${eventId}')">Update Event</button>
//     `;
//         } catch (error) {
//             showSnackbar(`Error loading event: ${error.message}`);
//         }
//     } else {
//         navigate('/login');
//     }
// };

async function deleteEvent(eventId) {
    if (!state.token) {
        showSnackbar("Please log in to delete your event.");
        return;
    }
    if (confirm("Are you sure you want to delete this event?")) {
        try {
            await apiFetch(`/event/${eventId}`, 'DELETE');
            showSnackbar("Event deleted successfully.");
            navigate('/'); // Redirect to home or another page
        } catch (error) {
            showSnackbar(`Error deleting event: ${error.message}`);
        }
    }
};


async function displayEvents(page = 1) {
    const content = document.getElementById("events");
    let eventsPerPage = 10
    try {
        const events = await fetchEvents(page, eventsPerPage);
        console.log("fyguyg \n\n\n", events);
        if (events === null || events.length === 0) {
            content.innerHTML = "<h2>No events available.</h2>";
            return; // Exit if no events are available
        }

        // Populate the content based on the fetched events
        content.innerHTML = events.map(generateEventHTML).join('');
        console.log("evln : ", events.length);
        // Optionally handle pagination (e.g., show next/prev buttons)
        showPaginationControls(page, events.length);

    } catch (error) {
        content.innerHTML = "<h2>Error fetching events. Please try again later.</h2>";
        showSnackbar("Error fetching events.");
    }
}

// async function displayEvents() {
//     const content = document.getElementById("events");

//     try {
//         const events = await fetchEvents(); // Fetch the events

//         if (events === null || events.length === 0) {
//             content.innerHTML = "<h2>No events available.</h2>";
//             return; // Exit if no events are available
//         }

//         // Populate the content based on the fetched events
//         content.innerHTML = events.map(generateEventHTML).join('');
//     } catch (error) {
//         content.innerHTML = "<h2>Error fetching events. Please try again later.</h2>";
//         showSnackbar("Error fetching events.");
//     }
// }



function generateEventHTML(event) {
    return `
        <div class="event">
            <h1><a href="/event/${event.eventid}" title="View event details">${event.title}</a></h1>
            <img src="/eventpic/${event.banner_image}" alt="${event.title} Banner" style="width: 100%; max-height: 300px; object-fit: cover;" />
            <p><strong>Place:</strong>${event.place}</a></p>
            <p><strong>Address:</strong> ${event.location}</p>
            <p><strong>Description:</strong> ${event.description}</p>
        </div>
    `;
}


export { createEventForm, createEvent, updateEvent, displayEvent, fetchEventData, displayEventDetails, editEventForm, deleteEvent, displayEvents, fetchEvents, generateEventHTML };