import { state } from "./state.js";
import { renderPage, navigate, loadContent } from "./render.js";
import { toggleMobileMenu, toggleDropdown, toggleProfileDropdown } from "./navigation.js";
import { login, signup, logout } from "./auth.js";
import { logActivity } from "./activity.js";
import { clearTicketForm, addTicketForm, addTicket, deleteTicket, buyTicket, editTicket } from "./ticket.js";
import { openLightbox, changeImage, closeLightbox, uploadMedia, showMediaUploadForm, deleteMedia } from "./media.js";
import { addMerchForm, addMerchandise, clearMerchForm, buyMerch, deleteMerch, editMerchForm } from "./merch.js";
import { createEventForm, createEvent, updateEvent, displayEvent, editEventForm, deleteEvent, displayEvents } from "./events.js";
import { createPlace, editPlaceForm, updatePlace, deletePlace } from "./places.js";

import { displayProfile, displayUserProfile, deleteProfile, editProfile, previewProfilePicture, updateProfile, displaySuggested, toggleFollow } from "./profile.js";
// let abortController; // Keep this scoped to the function if it’s needed only for `fetchEvents`


// async function displaySuggested() {
//     const content = document.getElementById("suggested");
//     content.innerHTML = `<h1>${state.user}</h1>`;
// }

//==========================================================================


function displayAuthSection() {
    const authSection = document.getElementById("auth-section");

    if (state.token) {
        authSection.innerHTML = `<h2>Welcome back!</h2>`;
    } else {
        authSection.innerHTML = `
            <h2>Login</h2>
            <input type="text" id="login-username" placeholder="Username" />
            <input type="password" id="login-password" placeholder="Password" />
            <button onclick="login()">Login</button>

            <h2>Signup</h2>
            <input type="text" id="signup-username" placeholder="Username" />
            <input type="email" id="signup-email" placeholder="Email" />
            <input type="password" id="signup-password" placeholder="Password" />
            <button onclick="signup()">Signup</button>
        `;
    }
}

//===================================================================

// Function to initialize the app
// function init() {
//     renderPage();
//     window.onpopstate = renderPage; // Handle back/forward navigation
// }

// Initialize the page load based on the current URL
function init() {
    // Load the content based on the current URL when the page is first loaded
    loadContent(window.location.pathname);

    // Optionally, you can listen to `popstate` event to handle browser back/forward navigation
    window.addEventListener('popstate', (event) => {
        loadContent(window.location.pathname);
    });
}

// Assign functions directly to the window object

window.state = state;
window.renderPage = renderPage;
window.navigate = navigate;
window.addTicketForm = addTicketForm;
window.addTicket = addTicket;
window.clearTicketForm = clearTicketForm;
window.addMerchForm = addMerchForm;
window.editMerchForm = editMerchForm;
window.deleteMerch = deleteMerch;
window.addMerchandise = addMerchandise;
window.clearMerchForm = clearMerchForm;
window.editPlaceForm = editPlaceForm;
window.deletePlace = deletePlace;
window.createPlace = createPlace;
window.updatePlace = updatePlace;
window.toggleFollow = toggleFollow;
window.deleteProfile = deleteProfile;
window.editProfile = editProfile;
window.updateProfile = updateProfile;
window.previewProfilePicture = previewProfilePicture;
window.logActivity = logActivity;
window.login = login;
window.signup = signup;
window.logout = logout;
window.renderPage = renderPage;
window.deleteEvent = deleteEvent;
window.editEventForm = editEventForm;
window.updateEvent = updateEvent;
window.createEvent = createEvent;
window.buyTicket = buyTicket
window.buyMerch = buyMerch
window.deleteTicket = deleteTicket
window.showMediaUploadForm = showMediaUploadForm
window.uploadMedia = uploadMedia
window.deleteMedia = deleteMedia;
window.openLightbox = openLightbox;
window.changeImage = changeImage;
window.closeLightbox = closeLightbox;
window.editTicket = editTicket;
window.toggleMobileMenu = toggleMobileMenu;
window.toggleDropdown = toggleDropdown;
window.toggleProfileDropdown = toggleProfileDropdown;

export { displaySuggested, displayAuthSection, displayProfile, createEventForm, displayEvents, displayUserProfile, displayEvent };

// Start the app
init();