import { state } from "../../state/state.js";
import { apiFetch } from "../../api/api.js";
import Snackbar from '../../components/ui/Snackbar.mjs';
import { navigate } from "../../routes/index.js";
import BookingForm from '../../components/ui/BookingForm.mjs';
import Gallery from '../../components/ui/Gallery.mjs';
import { createElement } from "./createPlaceService.js";

    // async function createPlace() {
    //     if (!state.token) {

    //         Snackbar("Please log in to create a place.", 3000);
    //         navigate('/login');
    //         return;
    //     }

    //     // Get form values
    //     const name = document.getElementById("place-name").value.trim();
    //     const address = document.getElementById("place-address").value.trim();
    //     const description = document.getElementById("place-description").value.trim();
    //     const capacity = document.getElementById("capacity").value.trim();
    //     const category = document.getElementById("category").value.trim();
    //     const bannerFile = document.getElementById("place-banner").files[0];

    //     // Validate input fields
    //     if (!name || !address || !description || !category || !capacity) {

    //         Snackbar("Please fill in all required fields.", 3000);
    //         return;
    //     }
    //     if (isNaN(capacity) || capacity <= 0) {

    //         Snackbar("Please enter a valid capacity.", 3000);
    //         return;
    //     }

    //     // Prepare FormData
    //     const formData = new FormData();
    //     formData.append('name', name);
    //     formData.append('address', address);
    //     formData.append('description', description);
    //     formData.append('category', category);
    //     formData.append('capacity', capacity);
    //     if (bannerFile) {
    //         formData.append('banner', bannerFile);
    //     }

    //     try {
    //         // Send API request
    //         const result = await apiFetch('/place', 'POST', formData);

    //         // Show success message and navigate

    //         Snackbar(`Place created successfully: ${result.name}`, 3000);
    //         navigate('/place/' + result.placeid);
    //     } catch (error) {
    //         // Handle errors
    //         // 
    //         Snackbar(`Error creating place: ${error.message || error}`, 3000);
    //     }
    // }

    // async function editPlaceForm(placeId, createSection) {
    //     // const createSection = document.getElementById("editplace");
    //     // createSection.innerHTML = ""; // Clear existing content

    //     if (state.token) {
    //         try {
    //             const place = await apiFetch(`/place/${placeId}`);
    //             console.log(place);
    //             const form = document.createElement("form");
    //             form.id = "edit-place-form";

    //             const formFields = [
    //                 { label: "Place Name", id: "place-name", type: "text", value: place.name, required: true },
    //                 { label: "Address", id: "place-address", type: "text", value: place.address, required: true },
    //                 { label: "Capacity", id: "capacity", type: "number", value: place.capacity, required: true },
    //                 { label: "Category", id: "category", type: "text", value: place.category, required: true },
    //                 { label: "Description", id: "place-description", type: "textarea", value: place.description, required: true },
    //                 { label: "Place Banner", id: "place-banner", type: "file", accept: "image/*" }
    //             ];

    //             // Add fields to the form
    //             formFields.forEach(field => {
    //                 const fieldGroup = document.createElement("div");
    //                 fieldGroup.classList.add("form-group");

    //                 const label = document.createElement("label");
    //                 label.setAttribute("for", field.id);
    //                 label.textContent = field.label;

    //                 let input;
    //                 if (field.type === "textarea") {
    //                     input = document.createElement("textarea");
    //                     input.textContent = field.value || "";
    //                 } else {
    //                     input = document.createElement("input");
    //                     input.type = field.type;
    //                     if (field.value) input.value = field.value;
    //                     if (field.accept) input.accept = field.accept;
    //                 }

    //                 input.id = field.id;
    //                 if (field.required) input.required = true;

    //                 fieldGroup.appendChild(label);
    //                 fieldGroup.appendChild(input);
    //                 form.appendChild(fieldGroup);
    //             });

    //             // Add submit button
    //             const submitButton = document.createElement("button");
    //             submitButton.type = "submit";
    //             submitButton.textContent = "Update Place";
    //             form.appendChild(submitButton);

    //             // Add form submit event listener
    //             form.addEventListener("submit", async (event) => {
    //                 event.preventDefault();
    //                 await updatePlace(placeId);
    //             });

    //             // Add the form to the section
    //             createSection.appendChild(document.createElement("h2").appendChild(document.createTextNode("Edit Place")));
    //             createSection.appendChild(form);
    //         } catch (error) {

    //             Snackbar(`Error fetching place details: ${error.message}`, 3000);
    //         }
    //     } else {
    //         navigate('/login');
    //     }
    // }

    // async function updatePlace(placeId) {
    //     if (!state.token) {

    //         Snackbar("Please log in to update place.", 3000);
    //         return;
    //     }

    //     const name = document.getElementById("place-name").value.trim();
    //     const address = document.getElementById("place-address").value.trim();
    //     const description = document.getElementById("place-description").value.trim();
    //     const bannerFile = document.getElementById("place-banner").files[0];

    //     if (!name || !address || !description) {

    //         Snackbar("Please fill in all fields.", 3000);
    //         return;
    //     }

    //     const formData = new FormData();
    //     formData.append('name', name);
    //     formData.append('address', address);
    //     formData.append('description', description);
    //     if (bannerFile) {
    //         formData.append('banner', bannerFile);
    //     }

    //     try {
    //         const result = await apiFetch(`/place/${placeId}`, 'PUT', formData);

    //         Snackbar(`Place updated successfully: ${result.name}`, 3000);
    //         navigate('/place/' + placeId);
    //     } catch (error) {

    //         Snackbar(`Error updating place: ${error.message || error}`, 3000);
    //     }
    // }

    // async function displayPlace(placeId, content) {

    //     try {
    //         const place = await apiFetch(`/place/${placeId}`);
    //         const isLoggedIn = !!state.token;
    //         const isCreator = isLoggedIn && state.user === place.createdBy;
    //         // Format created and updated timestamps
    //         const createdDate = new Date(place.created).toLocaleString();
    //         const updatedDate = new Date(place.updated).toLocaleString();

    //         // Extract coordinates if available
    //         const latitude = place.coordinates?.lat || "N/A";
    //         const longitude = place.coordinates?.lng || "N/A";

    //         const placeDetails = [
    //             createElement('h1', {}, [place.name]),
    //             createElement('img', {
    //                 src: `/placepic/${place.banner}`,
    //                 alt: `${place.name} Banner`,
    //                 style: "width: 100%; max-height: 300px; object-fit: cover;"
    //             }),
    //             createElement('p', {}, [createElement('strong', {}, ["Place ID: "]), place.placeid]),
    //             createElement('p', {}, [createElement('strong', {}, ["Description: "]), place.description || "N/A"]),
    //             createElement('p', {}, [createElement('strong', {}, ["Address: "]), place.address || "N/A"]),
    //             createElement('p', {}, [createElement('strong', {}, ["Created On: "]), createdDate || "N/A"]),
    //             createElement('p', {}, [createElement('strong', {}, ["Last Updated: "]), updatedDate || "N/A"]),
    //             ...(isLoggedIn && isCreator
    //                 ? [
    //                     createElement('button', { id: 'edit-place-btn', onclick: () => editPlaceForm(place.placeid, content) }, ["Edit Place"]),
    //                     createElement('button', { id: 'delete-place-btn', onclick: () => deletePlace(place.placeid) }, ["Delete Place"])
    //                 ]
    //                 : []),
    //             createElement('p', {}, [createElement('strong', {}, ["Coordinates: "]), `Lat: ${latitude}, Lng: ${longitude}`]),
    //             createElement('p', {}, [createElement('strong', {}, ["Capacity: "]), String(place.capacity || "N/A")]),
    //             createElement('p', {}, [createElement('strong', {}, ["Category: "]), place.category || "N/A"]),
    //             createElement('p', {}, [createElement('strong', {}, ["Created By: "]), place.createdBy || "Unknown"]),
    //         ];

    //         console.log(placeDetails);
    //         placeDetails.forEach(detail => content.appendChild(detail));

    //         if (isLoggedIn && !isCreator) {
    //             const bookingform = BookingForm((details) => {
    //                 alert(`Booking Confirmed!\nName: ${details.name}\nDate: ${details.date}\nSeats: ${details.seats}`);
    //             });

    //             content.appendChild(bookingform);
    //         }
    //         const imagis = [
    //             { src: '#', alt: 'Image 1' },
    //             { src: '#', alt: 'Image 2' },
    //             { src: '#', alt: 'Image 3' },
    //             { src: '#', alt: 'Image 4' },
    //         ];

    //         const gallery = Gallery(imagis);
    //         content.appendChild(gallery);

    //     } catch (error) {
    //         content.appendChild(createElement('h2', {}, [`Error fetching place details: ${error.message || 'Unknown error'}`]));

    //         Snackbar("Failed to load place details.", 3000);
    //     }
    // }

    async function displayPlace(placeId, content) {
        try {
            const place = await apiFetch(`/place/${placeId}`);
            const isLoggedIn = !!state.token;
            const isCreator = isLoggedIn && state.user === place.createdBy;
    
            content.innerHTML = ""; // Clear existing content
    
            // Render Place Details
            renderPlaceDetails(content, place, isCreator);
    
            // Render Booking Form (if not the creator)
            if (isLoggedIn && !isCreator) {
                const bookingForm = BookingForm((details) => {
                    alert(`Booking Confirmed!\nName: ${details.name}\nDate: ${details.date}\nSeats: ${details.seats}`);
                });
                content.appendChild(bookingForm);
            }
    
            // Render Gallery
            const galleryImages = [
                { src: '#', alt: 'Image 1' },
                { src: '#', alt: 'Image 2' },
                { src: '#', alt: 'Image 3' },
                { src: '#', alt: 'Image 4' },
            ];
            const gallery = Gallery(galleryImages);
            content.appendChild(gallery);
        } catch (error) {
            content.innerHTML = ""; // Clear content on error
            content.appendChild(createElement('h2', {}, [`Error fetching place details: ${error.message || 'Unknown error'}`]));
            Snackbar("Failed to load place details.", 3000);
        }
    }
    
    function renderPlaceDetails(content, place, isCreator) {
        const createdDate = new Date(place.created).toLocaleString();
        const updatedDate = new Date(place.updated).toLocaleString();
        const latitude = place.coordinates?.lat || "N/A";
        const longitude = place.coordinates?.lng || "N/A";
    
        const details = [
            createElement('h1', {}, [place.name]),
            createElement('img', {
                src: `/placepic/${place.banner}`,
                alt: `${place.name} Banner`,
                style: "width: 100%; max-height: 300px; object-fit: cover;"
            }),
            createElement('p', {}, [createElement('strong', {}, ["Place ID: "]), place.placeid]),
            createElement('p', {}, [createElement('strong', {}, ["Description: "]), place.description || "N/A"]),
            createElement('p', {}, [createElement('strong', {}, ["Address: "]), place.address || "N/A"]),
            createElement('p', {}, [createElement('strong', {}, ["Created On: "]), createdDate || "N/A"]),
            createElement('p', {}, [createElement('strong', {}, ["Last Updated: "]), updatedDate || "N/A"]),
            createElement('p', {}, [createElement('strong', {}, ["Coordinates: "]), `Lat: ${latitude}, Lng: ${longitude}`]),
            createElement('p', {}, [createElement('strong', {}, ["Capacity: "]), String(place.capacity || "N/A")]),
            createElement('p', {}, [createElement('strong', {}, ["Category: "]), place.category || "N/A"]),
            createElement('p', {}, [createElement('strong', {}, ["Created By: "]), place.createdBy || "Unknown"]),
        ];
    
        if (isCreator) {
            details.push(
                createElement('button', { id: 'edit-place-btn', onclick: () => editPlaceForm(place.placeid, content) }, ["Edit Place"]),
                createElement('button', { id: 'delete-place-btn', onclick: () => deletePlace(place.placeid) }, ["Delete Place"])
            );
        }
    
        details.forEach(detail => content.appendChild(detail));
    }

    async function updatePlace(placeId) {
        if (!state.token) {
            Snackbar("Please log in to update place.", 3000);
            return;
        }
    
        const name = document.getElementById("place-name").value.trim();
        const address = document.getElementById("place-address").value.trim();
        const description = document.getElementById("place-description").value.trim();
        const bannerFile = document.getElementById("place-banner").files[0];
    
        // Validate input fields
        if (!name || !address || !description) {
            Snackbar("Please fill in all fields.", 3000);
            return;
        }
    
        // Validate banner file size and type (optional)
        if (bannerFile && (bannerFile.size > 5 * 1024 * 1024 || !bannerFile.type.startsWith("image/"))) {
            Snackbar("Please upload a valid image file (max 5MB).", 3000);
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
            Snackbar("Updating place...", 3000); // Show progress feedback
            const result = await apiFetch(`/place/${placeId}`, 'PUT', formData);
    
            Snackbar(`Place updated successfully: ${result.name}`, 3000);
            navigate('/place/' + placeId); // Redirect to the updated place page
        } catch (error) {
            Snackbar(`Error updating place: ${error.message || error}`, 3000);
        }
    }

    async function createPlace() {
        if (!state.token) {
            Snackbar("Please log in to create a place.", 3000);
            navigate('/login');
            return;
        }
    
        // Get form values
        const name = document.getElementById("place-name").value.trim();
        const address = document.getElementById("place-address").value.trim();
        const description = document.getElementById("place-description").value.trim();
        const capacity = document.getElementById("capacity").value.trim();
        const category = document.getElementById("category").value.trim();
        const bannerFile = document.getElementById("place-banner").files[0];
    
        // Validate input fields
        if (!name || !address || !description || !category || !capacity) {
            Snackbar("Please fill in all required fields.", 3000);
            return;
        }
        if (isNaN(capacity) || capacity <= 0) {
            Snackbar("Please enter a valid capacity.", 3000);
            return;
        }
    
        // Validate banner file size and type (optional)
        if (bannerFile && (bannerFile.size > 5 * 1024 * 1024 || !bannerFile.type.startsWith("image/"))) {
            Snackbar("Please upload a valid image file (max 5MB).", 3000);
            return;
        }
    
        // Prepare FormData
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
            Snackbar("Creating place...", 3000); // Show progress feedback
            const result = await apiFetch('/place', 'POST', formData);
    
            Snackbar(`Place created successfully: ${result.name}`, 3000);
            navigate('/place/' + result.placeid); // Navigate to the new place's page
        } catch (error) {
            Snackbar(`Error creating place: ${error.message || error}`, 3000);
        }
    }
    
    async function editPlaceForm(placeId, content) {
        content.innerHTML = ""; // Clear existing content
    
        if (!state.token) {
            Snackbar("Please log in to edit the place.", 3000);
            navigate('/login');
            return;
        }
    
        try {
            // Fetch place details
            const place = await apiFetch(`/place/${placeId}`);
            console.log(place);
    
            // Create a form element
            const form = document.createElement("form");
            form.id = "edit-place-form";
    
            const formFields = [
                { label: "Place Name", id: "place-name", type: "text", value: place.name, required: true },
                { label: "Address", id: "place-address", type: "text", value: place.address, required: true },
                { label: "Capacity", id: "capacity", type: "number", value: place.capacity, required: true },
                { label: "Category", id: "category", type: "text", value: place.category, required: true },
                { label: "Description", id: "place-description", type: "textarea", value: place.description, required: true },
                { label: "Place Banner", id: "place-banner", type: "file", accept: "image/*" }
            ];
    
            // Add fields to the form
            formFields.forEach(field => {
                const fieldGroup = document.createElement("div");
                fieldGroup.classList.add("form-group");
    
                const label = document.createElement("label");
                label.setAttribute("for", field.id);
                label.textContent = field.label;
    
                let input;
                if (field.type === "textarea") {
                    input = document.createElement("textarea");
                    input.textContent = field.value || "";
                } else {
                    input = document.createElement("input");
                    input.type = field.type;
                    if (field.value) input.value = field.value;
                    if (field.accept) input.accept = field.accept;
                }
    
                input.id = field.id;
                if (field.required) input.required = true;
    
                fieldGroup.appendChild(label);
                fieldGroup.appendChild(input);
                form.appendChild(fieldGroup);
            });
    
            // Add submit button
            const submitButton = document.createElement("button");
            submitButton.type = "submit";
            submitButton.textContent = "Update Place";
            form.appendChild(submitButton);
    
            // Add form submit event listener
            form.addEventListener("submit", async (event) => {
                event.preventDefault();
                await updatePlace(placeId);
            });
    
            // Add form to the content section
            content.appendChild(createElement("h2", {}, ["Edit Place"]));
            content.appendChild(form);
        } catch (error) {
            content.innerHTML = ""; // Clear content on error
            Snackbar(`Error fetching place details: ${error.message}`, 3000);
        }
    }
    

async function deletePlace(placeId) {
    if (!state.token) {

        Snackbar("Please log in to delete your place.", 3000);
        return;
    }
    if (confirm("Are you sure you want to delete this place?")) {
        try {
            await apiFetch(`/place/${placeId}`, 'DELETE');

            Snackbar("Place deleted successfully.", 3000);
            navigate('/'); // Redirect to home or another page
        } catch (error) {

            Snackbar(`Error deleting place: ${error.message || 'Unknown error'}`, 3000);
        }
    }
}


export { createPlace, editPlaceForm, updatePlace, displayPlace, deletePlace };