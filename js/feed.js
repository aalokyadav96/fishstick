import { state } from "./state.js";
import { apiFetch } from "./api.js";

// Function to display media for the event
async function displayFeed() {
    let feedsec = document.getElementById("feed-section");
    feedsec.innerHTML = `I got bored while implementing this`;
}



export { displayFeed };