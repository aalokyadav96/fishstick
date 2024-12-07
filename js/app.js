import { navigate, loadContent } from "./routes/render.js";
// let abortController; // Keep this scoped to the function if it’s needed only for `fetchEvents`
import { state } from "./state/state.js";
// import { navigate, loadContent } from "./render.js";
import { toggleMobileMenu, toggleDropdown, toggleProfileDropdown } from "./components/navigation.js";
import { login, signup, logout } from "./services/auth.js";
import { logActivity } from "./services/activity.js";
import { clearTicketForm, addTicketForm, addTicket, deleteTicket, buyTicket, editTicket } from "./services/ticket.js";
import { openLightbox, changeImage, closeLightbox, uploadMedia, showMediaUploadForm, deleteMedia } from "./services/media.js";
import { addMerchForm, addMerchandise, clearMerchForm, buyMerch, deleteMerch, editMerchForm } from "./services/merch.js";
import {  createEvent, updateEvent,  editEventForm, deleteEvent,  showTab, displayEventVenue } from "./pages/events.js";
import { createPlace, editPlaceForm, updatePlace, deletePlace } from "./pages/places.js";
import { deletePost, opensLightbox, closesLightbox, changesImage } from "./pages/feed.js";
import { deleteProfile, editProfile, previewProfilePicture, updateProfile,  toggleFollow } from "./pages/profile.js";

// async function displaySuggested() {
//     const content = document.getElementById("suggested");
//     content.innerHTML = `<h1>${state.user}</h1>`;
// }

//==========================================================================

// Function to initialize the app
// function init() {
//     loadContent();
//     window.onpopstate = loadContent; // Handle back/forward navigation
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


window.state = state;
window.loadContent = loadContent;
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
window.loadContent = loadContent;
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
window.showTab = showTab;
window.displayEventVenue = displayEventVenue;
window.deletePost = deletePost;
window.opensLightbox = opensLightbox;
window.closesLightbox = closesLightbox;
window.changesImage = changesImage;

// Start the app
init();