import { createNav, attachNavEventListeners } from "../components/navigation.js";
import { displayAuthSection } from "../pages/auth.js";
import { displayProfile, displayUserProfile } from "../pages/profile.js";
import { displayPlace, createPlaceForm, displayPlaces } from "../pages/places.js";
import { createEventForm, displayEvent, displayEvents } from "../pages/events.js";
import { Home } from "../pages/home.js";
import { displayFeed } from "../pages/feed.js";
import { displaySearch } from "../pages/search.js";
import { displaySettings } from "../pages/settings.js";


async function loadContent(url) {
    const app = document.getElementById("app");
    const content = document.createElement("div");
    content.id = "content";
    app.innerHTML = createNav();
    app.appendChild(content);
    attachNavEventListeners();

    const path = url || window.location.pathname;

    const routeHandlers = {
        "/": () => { 
            content.innerHTML = `<h1>Welcome to the App</h1>`;
            Home(); 
        },
        "/profile": () => { 
            content.innerHTML = `<div id="profile-section"></div>`;
            displayProfile(); 
        },
        "/feed": () => { 
            content.innerHTML = `<div id="feed-section"></div>`;
            displayFeed(); 
        },
        "/search": () => { 
            content.innerHTML = `<h1>Search</h1><div id="search-section"></div>`;
            displaySearch(); 
        },
        "/create": () => { 
            content.innerHTML = `<h1>Create Event</h1><div id="create-section"></div>`;
            createEventForm(); 
        },
        "/place": () => { 
            content.innerHTML = `<h1>Create Place</h1><div id="create-place-section"></div>`;
            createPlaceForm(); 
        },
        "/settings": () => { 
            content.innerHTML = `<h1>Settings</h1><div id="settings"></div>`;
            displaySettings(); 
        },
        "/places": () => { 
            content.innerHTML = `<h1>Places</h1><div id="places"></div>`;
            displayPlaces(); 
        },
        "/events": () => { 
            content.innerHTML = `<h1>Events</h1><div id="events"></div><div id="pagination"></div>`;
            displayEvents(1); 
        },
        "/login": () => { 
            content.innerHTML = `<div id="auth-section"></div>`;
            displayAuthSection(); 
        },
    };

    // Dynamic routes
    if (path.startsWith("/user/")) {
        const username = path.split("/")[2];
        await displayUserProfile(username);
    } else if (path.startsWith("/event/")) {
        const eventId = path.split("/")[2];
        await displayEvent(eventId);
    } else if (path.startsWith("/place/")) {
        const placeId = path.split("/")[2];
        await displayPlace(placeId);
    } else {
        const handler = routeHandlers[path];
        if (handler) {
            handler();
        } else {
            content.innerHTML = `<h1>404 Not Found</h1>`;
        }
    }
}


function navigate(url) {
    history.pushState(null, "", url);
    loadContent(url);
}

async function renderPage() {
    await loadContent(window.location.pathname);
}

// Attach event listener for navigation to dynamically handle back/forward actions
window.addEventListener("popstate", renderPage);

// Example of attaching global event listeners dynamically
document.addEventListener("DOMContentLoaded", () => {
    document.body.addEventListener("click", (event) => {
        if (event.target.tagName === "A" && event.target.getAttribute("href")) {
            event.preventDefault();
            const url = event.target.getAttribute("href");
            navigate(url);
        }
    });
});

export { navigate, loadContent, renderPage };
