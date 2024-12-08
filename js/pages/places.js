import { state } from "../state/state.js";
import { apiFetch } from "../api/api.js";
import { showSnackbar } from "../utils/utils.js";
import { navigate } from "../routes/render.js";

async function createPlace() {
    if (!state.token) {
        showSnackbar("Please log in to create a place.");
        return;
    }

    const name = document.getElementById("place-name").value.trim();
    const address = document.getElementById("place-address").value.trim();
    const description = document.getElementById("place-description").value.trim();
    const capacity = document.getElementById("capacity").value.trim();
    const category = document.getElementById("category").value.trim();
    const bannerFile = document.getElementById("place-banner").files[0];

    if (!name || !address || !description || !category || !capacity) {
        showSnackbar("Please fill in all fields.");
        return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('address', address);
    formData.append('description', description);
    formData.append('category', category);
    formData.append('capacity', capacity);
    if (bannerFile) {
        formData.append('banner', bannerFile);
    }

    try {
        const result = await apiFetch('/place', 'POST', formData);
        showSnackbar(`Place created successfully: ${result.name}`);
        navigate('/place/' + result.placeid);
    } catch (error) {
        showSnackbar(`Error creating place: ${error.message || error}`);
    }
}

async function updatePlace(placeId) {
    if (!state.token) {
        showSnackbar("Please log in to update place.");
        return;
    }

    const name = document.getElementById("place-name").value.trim();
    const address = document.getElementById("place-address").value.trim();
    const description = document.getElementById("place-description").value.trim();
    const bannerFile = document.getElementById("place-banner").files[0];

    if (!name || !address || !description) {
        showSnackbar("Please fill in all fields.");
        return;
    }

    const formData = new FormData();
    formData.append('name', name);
    formData.append('address', address);
    formData.append('description', description);
    if (bannerFile) {
        formData.append('banner', bannerFile);
    }

    try {
        const result = await apiFetch(`/place/${placeId}`, 'PUT', formData);
        showSnackbar(`Place updated successfully: ${result.name}`);
        navigate('/place/' + result.placeid);
    } catch (error) {
        showSnackbar(`Error updating place: ${error.message || error}`);
    }
}


async function deletePlace(placeId) {
    if (!state.token) {
        showSnackbar("Please log in to delete your place.");
        return;
    }
    if (confirm("Are you sure you want to delete this place?")) {
        try {
            await apiFetch(`/place/${placeId}`, 'DELETE');
            showSnackbar("Place deleted successfully.");
            navigate('/'); // Redirect to home or another page
        } catch (error) {
            showSnackbar(`Error deleting place: ${error.message || 'Unknown error'}`);
        }
    }
}


async function editPlaceForm(placeId) {
    const createSection = document.getElementById("editplace");
    if (state.token) {
        try {
            const place = await apiFetch(`/place/${placeId}`);
            createSection.innerHTML = `
                <h2>Edit Place</h2>
                <form id="edit-place-form">
                    <input type="text" id="place-name" value="${place.name}" placeholder="Place Name" required />
                    <input type="text" id="place-address" value="${place.address}" placeholder="Address" required />
                    <input type="number" id="capacity" value="${place.capacity}" placeholder="Capacity" required />
                    <input type="text" id="category" value="${place.category}" placeholder="Category" required />
                    <textarea id="place-description" placeholder="Description" required>${place.description}</textarea>
                    <input type="file" id="place-banner" accept="image/*" />
                    <button type="submit">Update Place</button>
                </form>
            `;
            
            const form = document.getElementById("edit-place-form");
            form.addEventListener("submit", async (event) => {
                event.preventDefault();
                await updatePlace(placeId);
            });
        } catch (error) {
            showSnackbar(`Error fetching place details: ${error.message}`);
        }
    } else {
        navigate('/login');
    }
}

async function displayPlace(placeId) {
    const content = document.getElementById("content");

    try {
        const place = await apiFetch(`/place/${placeId}`);
        content.innerHTML = `
            <h1>${place.name}</h1>
            <img src="/placepic/${place.banner}" alt="${place.name} Banner" style="width: 100%; max-height: 300px; object-fit: cover;" />
            <p><strong>Place ID:</strong> ${place.placeid || ""}</p>
            <p><strong>Description:</strong> ${place.description || ""}</p>
            <p><strong>Address:</strong> ${place.address || ""}</p>
            <p><strong>Capacity:</strong> ${place.capacity || ""}</p>
            <p><strong>Phone:</strong> ${place.phone || ""}</p>
            <p><strong>Website:</strong> ${place.website || ""}</p>
            <p><strong>Category:</strong> ${place.category || ""}</p>
            <button id="edit-place-btn">Edit Place</button>
            <button id="delete-place-btn">Delete Place</button>
            <div id="editplace"></div>
        `;

        document.getElementById("edit-place-btn").addEventListener("click", () => editPlaceForm(place.placeid));
        document.getElementById("delete-place-btn").addEventListener("click", () => deletePlace(place.placeid));
    } catch (error) {
        content.innerHTML = `<h2>Error fetching place details: ${error.message || 'Unknown error'}</h2>`;
        showSnackbar("Failed to load place details.");
    }
}

async function createPlaceForm() {
    const createSection = document.getElementById("create-place-section");
    if (state.token) {
        createSection.innerHTML = `
            <h2>Create Place</h2>
            <form id="create-place-form">
                <div class="form-group">
                    <label for="place-name">Place Name</label>
                    <input type="text" id="place-name" placeholder="Enter the place name" required>
                </div>
                <div class="form-group">
                    <label for="place-address">Address</label>
                    <input type="text" id="place-address" placeholder="Enter the address" required>
                </div>
                <div class="form-group">
                    <label for="place-city">City</label>
                    <input type="text" id="place-city" placeholder="Enter the city" required>
                </div>
                <div class="form-group">
                    <label for="place-country">Country</label>
                    <input type="text" id="place-country" placeholder="Enter the country" required>
                </div>
                <div class="form-group">
                    <label for="place-zipcode">Zip Code</label>
                    <input type="text" id="place-zipcode" placeholder="Enter the zip code" required>
                </div>
                <div class="form-group">
                    <label for="place-description">Description</label>
                    <textarea id="place-description" placeholder="Provide a description" required></textarea>
                </div>
                <div class="form-group">
                    <label for="capacity">Capacity</label>
                    <input type="number" id="capacity" placeholder="Enter the capacity" required>
                </div>
                <div class="form-group">
                    <label for="phone">Phone Number</label>
                    <input type="text" id="phone" placeholder="Enter the phone number">
                </div>
                <div class="form-group">
                    <label for="website">Website URL</label>
                    <input type="url" id="website" placeholder="Enter website URL">
                </div>
                <div class="form-group">
                    <label for="category">Category</label>
                    <input type="text" id="category" placeholder="Enter the category">
                </div>
                <div class="form-group">
                    <label for="place-banner">Place Banner</label>
                    <input type="file" id="place-banner" accept="image/*">
                </div>
                <button type="submit">Create Place</button>
            </form>
        `;

        const form = document.getElementById("create-place-form");
        form.addEventListener("submit", async (event) => {
            event.preventDefault();
            await createPlace();
        });
    } else {
        showSnackbar("You must be logged in to create a place.");
        navigate('/login');
    }
}


let abortController; // Keep this scoped to the function if it’s needed only for `fetchEvents`

async function fetchPlaces() {
    // Abort the previous fetch if it's still ongoing
    if (abortController) {
        abortController.abort();
    }

    abortController = new AbortController(); // Create a new instance
    const signal = abortController.signal; // Get the signal to pass to apiFetch

    try {
        // Use apiFetch with the 'GET' method and pass the signal for aborting
        const places = await apiFetch('/places', 'GET', null, { signal });
        return places;
    } catch (error) {
        // If error is due to abort, return null
        if (error.name === 'AbortError') {
            console.log('Fetch aborted');
            return null;
        }
        console.error(error);
        showSnackbar(`Error fetching places: ${error.message || 'Unknown error'}`);
        return null; // Return null for other errors
    }
}

function generatePlaceHTML(place) {
    return `
        <div class="place">
            <h1><a href="/place/${place.placeid}">${place.name}</a></h1>
            <img src="/placepic/${place.banner}" alt="${place.name} Banner" style="width: 100%; max-height: 300px; object-fit: cover;" />
            <p><strong>Address:</strong> ${place.address}</p>
            <p><strong>Description:</strong> ${place.description}</p>
        </div>
    `;
}

async function displayPlaces() {
    const content = document.getElementById("places");

    try {
        const places = await fetchPlaces();
        content.innerHTML = places && places.length
            ? places.map(generatePlaceHTML).join('')
            : "<h2>No places available.</h2>";
    } catch (error) {
        showSnackbar("Error fetching places. Please try again later.");
    }
}

export { createPlace, editPlaceForm, updatePlace, displayPlace, deletePlace, createPlaceForm, fetchPlaces, generatePlaceHTML, displayPlaces };