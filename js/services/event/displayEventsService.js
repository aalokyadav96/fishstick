import Pagination from '../../components/ui/Pagination.mjs';
import { apiFetch } from "../../api/api.js";
import Breadcrumb from '../../components/ui/Breadcrumb.mjs';
import { navigate } from "../../routes/index.js";

let abortController = null;

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
        SnackBar("An unexpected error occurred while fetching events.", 3000);
        return null; // Return null for other errors
    }
}

async function fetchTotalEventCount() {
    return 5;
}


// Event listener for navigation
document.addEventListener('click', function (e) {
    const link = e.target.closest('a');
    if (link && link.id.startsWith('a-')) {
        e.preventDefault(); // Prevent page reload
        const eventId = link.id.split('-')[1]; // Extract event ID
        navigate(`/event/${eventId}`); // Handle navigation
    }
});

async function displayEvents(content, contentcon, page = 1) {
    const eventsPerPage = 4;

    try {
        // Fetch new data and save it locally
        const events = await fetchEvents(page, eventsPerPage);

        // Handle breadcrumb creation
        const breadcrumb = Breadcrumb([
            { label: 'Home', href: '/' },
            { label: 'Events', href: '/events' },
        ]);

        // Clear content and append breadcrumb
        content.appendChild(breadcrumb);
        
        const efventdiv = document.createElement("div");
        efventdiv.id = "events";
        efventdiv.innerHTML = '';
        contentcon.appendChild(efventdiv);


        if (events && events.length > 0) {
            efventdiv.innerHTML += events.map(generateEventHTML).join('');
            console.log("Displayed refreshed events.");
        } else {
            efventdiv.innerHTML += "<h2>No events available.</h2>";
        }

        // Handle pagination using the Pagination component
        const totalEvents = await fetchTotalEventCount(); // Assuming you have a backend call to get total events
        const totalPages = Math.ceil(totalEvents / eventsPerPage);

        const paginationContainer = document.createElement('div');
        paginationContainer.id = "pagination";
        paginationContainer.classList = "pagination";

        // Clear existing pagination and append to the container
        paginationContainer.innerHTML = '';
        const pagination = Pagination(page, totalPages, (newPage) => displayEvents(efventdiv, contentcon, newPage));
        paginationContainer.appendChild(pagination);

        contentcon.appendChild(paginationContainer);

    } catch (error) {
        efventdiv.innerHTML = "<h2>Error loading events. Please try again later.</h2>";
        console.error("Error fetching events:", error);
    }
}

// Generate HTML for each event
function generateEventHTML(event) {
    return `
        <div class="event" id="event-${event.eventid}">
            <a href="/event/${event.eventid}" title="View event details" id="a-${event.eventid}">
                <h1>${event.title}</h1>
                <img src="/eventpic/${event.banner_image}" alt="${event.title} Banner" style="width: 100%; max-height: 300px; object-fit: cover;" />
                <p><strong>Place:</strong> ${event.place}</p>
                <p><strong>Address:</strong> ${event.location}</p>
                <p><strong>Description:</strong> ${event.description}</p>
            </a>
        </div>
    `;
}


export { displayEvents, generateEventHTML };