import { createNav } from "./navigation.js";
import { displaySuggested, displayAuthSection, displayProfile, displayUserProfile } from "./app28.js";
import { displayPlace, createPlaceForm, displayPlaces } from "./places.js";
import { createEventForm, displayEvent, displayEvents } from "./events.js";
import { displayFeed } from "./feed.js";

async function loadContent(url) {
    const app = document.getElementById("app");
    const path = window.location.pathname;

    app.innerHTML = createNav() + `<div id="content"></div>`;
    const content = document.getElementById("content");

    // You can dynamically load content based on the URL (SPA-style)
    switch (url) {
        case '/':
            content.innerHTML = `<h1>Welcome to the App<div id="suggested"></div></h1>`;
            displayFeed();
            break;
        case '/feed':
            content.innerHTML = `<h1>User Feed</h1><div id="feed-section"></div>`;
            displayFeed();
            break;
        case '/profile':
            content.innerHTML = `<h1>User Profile</h1><div id="profile-section"></div>`;
            displayProfile();
            break;
        case '/create':
            content.innerHTML = `<h1>Event Creation</h1><div id="create-section"></div>`;
            createEventForm();
            break;
        case '/place':
            content.innerHTML = `<h1>Place Creation</h1><div id="create-place-section"></div>`;
            createPlaceForm();
            break;
        case '/places':
            content.innerHTML = `<h1>Show Places</h1><div id="places"></div>`;
            displayPlaces();
            break;
        case '/events':
            content.innerHTML = `<h1>Show Events</h1><div id="events"></div><div id="pagination"></div>`;
            displayEvents(1);
            break;
        case '/login':
            content.innerHTML = `<div id="auth-section"></div>`;
            displayAuthSection();
            break;
        default:
            if (path.startsWith('/user/') && path.length > 6) {
                const username = path.split('/')[2];
                await displayUserProfile(username);
            } else if (path.startsWith('/event/') && path.length > 6) {
                const eventId = path.split('/')[2];
                await displayEvent(eventId);
            } else if (path.startsWith('/place/') && path.length > 6) {
                const placeId = path.split('/')[2];
                await displayPlace(placeId);
            } else {
                content.innerHTML = `<h1>404 Not Found</h1>`;
            }
    }
}

function navigate(url) {
    // Update the URL without reloading the page
    history.pushState(null, '', url);

    // Load the content for the new URL
    loadContent(url);
}

async function renderPage() {
    const app = document.getElementById("app");
    const path = window.location.pathname;

    app.innerHTML = createNav() + `<div id="content"></div>`;
    const content = document.getElementById("content");

    switch (path) {
        case '/':
            content.innerHTML = `<h1>Welcome to the App<div id="suggested"></div></h1>`;
            displaySuggested();
            break;
        case '/feed':
            content.innerHTML = `<h1>User Feed</h1><div id="feed-section"></div>`;
            break;
        case '/profile':
            content.innerHTML = `<h1>User Profile</h1><div id="profile-section"></div>`;
            displayProfile();
            break;
        case '/create':
            content.innerHTML = `<h1>Event Creation</h1><div id="create-section"></div>`;
            createEventForm();
            break;
        case '/place':
            content.innerHTML = `<h1>Place Creation</h1><div id="create-place-section"></div>`;
            createPlaceForm();
            break;
        case '/places':
            content.innerHTML = `<h1>Show Places</h1><div id="places"></div>`;
            displayPlaces();
            break;
        case '/events':
            content.innerHTML = `<h1>Show Events</h1><div id="events"></div><div id="pagination">`;
            displayEvents();
            break;
        case '/login':
            content.innerHTML = `<div id="auth-section"></div>`;
            displayAuthSection();
            break;
        default:
            if (path.startsWith('/user/') && path.length > 6) {
                const username = path.split('/')[2];
                await displayUserProfile(username);
            } else if (path.startsWith('/event/') && path.length > 6) {
                const eventId = path.split('/')[2];
                await displayEvent(eventId);
            } else if (path.startsWith('/place/') && path.length > 6) {
                const placeId = path.split('/')[2];
                await displayPlace(placeId);
            } else {
                content.innerHTML = `<h1>404 Not Found</h1>`;
            }
    }
}

// async function navigate(loc) {
//     window.history.pushState({}, "", loc);
//     renderPage();
// }


export { renderPage, navigate, loadContent };