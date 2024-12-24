import { state } from "../../state/state.js";
import { apiFetch } from "../../api/api.js";
import { navigate } from "../../routes/index.js";
import SnackBar from '../../components/ui/Snackbar.mjs';

async function createEventForm(content) {
    const createSection = document.createElement('div');
    createSection.className = "create-section";

    if (state.token) {
        // Create and append the header
        const header = document.createElement("h2");
        header.textContent = "Create Event";
        createSection.appendChild(header);

        // Define form fields
        const formFields = [
            { type: "text", id: "event-title", placeholder: "Event Title", required: true },
            { type: "textarea", id: "event-description", placeholder: "Event Description", required: true },
            { type: "text", id: "event-place", placeholder: "Event Place", required: true },
            { type: "text", id: "event-location", placeholder: "Event Location", required: true },
            { type: "date", id: "event-date", required: true },
            { type: "time", id: "event-time", required: true },
            { type: "text", id: "organizer-name", placeholder: "Organizer Name", required: true },
            { type: "text", id: "organizer-contact", placeholder: "Organizer Contact", required: true },
            { type: "number", id: "total-capacity", placeholder: "Total Capacity", required: true },
            { type: "url", id: "website-url", placeholder: "Website URL" },
            { type: "text", id: "category", placeholder: "Category", required: true },
            { type: "file", id: "event-banner", accept: "image/*" },
        ];

        // Create form fields
        formFields.forEach(field => {
            const formGroup = document.createElement("div");
            formGroup.className = "form-group";

            let inputElement;
            if (field.type === "textarea") {
                inputElement = document.createElement("textarea");
            } else {
                inputElement = document.createElement("input");
                inputElement.type = field.type;
            }

            inputElement.id = field.id;
            inputElement.placeholder = field.placeholder || "";
            if (field.required) inputElement.required = true;
            if (field.accept) inputElement.accept = field.accept;

            formGroup.appendChild(inputElement);
            createSection.appendChild(formGroup);
        });

        // Create and append the create button
        const createButton = document.createElement("button");
        createButton.id = "create-event-btn";
        createButton.textContent = "Create Event";
        createSection.appendChild(createButton);

        // Add place suggestions box
        const eventPlaceInput = createSection.querySelector("#event-place");
        const placeSuggestionsBox = document.createElement("div");
        placeSuggestionsBox.id = "place-suggestions";
        placeSuggestionsBox.className = "suggestions-dropdown";
        createSection.appendChild(placeSuggestionsBox);

        content.appendChild(createSection);

        // Add event listeners
        addEventEventListeners(eventPlaceInput, placeSuggestionsBox, createButton);
    } else {
        SnackBar("Please log in to create an event.", 3000);
        navigate('/login');
    }
}

function addEventEventListeners(eventPlaceInput, placeSuggestionsBox, createButton) {
    // Event listener for place input
    eventPlaceInput.addEventListener("input", async function () {
        const query = eventPlaceInput.value.trim();
        if (!query) {
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
                suggestionElement.className = "suggestion-item";
                suggestionElement.textContent = suggestion.name;
                suggestionElement.dataset.id = suggestion.id;

                suggestionElement.addEventListener("click", () => {
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

    // Close suggestions when clicking outside
    document.addEventListener("click", (event) => {
        if (!event.target.closest("#event-place") && !event.target.closest("#place-suggestions")) {
            placeSuggestionsBox.style.display = "none";
        }
    });

    // Add event listener to the create button
    createButton.addEventListener("click", createEvent);
}

async function createEvent() {
    if (state.token && state.user) {
        const title = document.getElementById("event-title").value.trim();
        const date = document.getElementById("event-date").value;
        const time = document.getElementById("event-time").value;
        const place = document.getElementById("event-place").value.trim();
        const location = document.getElementById("event-location").value.trim();
        const description = document.getElementById("event-description").value.trim();
        const bannerFile = document.getElementById("event-banner").files[0];

        // Validate input values
        if (!title || !date || !time || !place || !location || !description) {
            SnackBar("Please fill in all required fields.", 3000);
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
            SnackBar(`Event created successfully: ${result.title}`, 3000);
            navigate('/event/' + result.eventid);
        } catch (error) {
            SnackBar(`Error creating event: ${error.message}`, 3000);
        }
    } else {
        navigate('/login');
    }
}

export { createEventForm };

// import { state } from "../../state/state.js";
// import { apiFetch } from "../../api/api.js";


// async function createEventForm(content) {
//     // const createSection = document.getElementById("create-section");
//     const createSection = document.createElement('div');
//     createSection.classList = "create-section";

//     if (state.token) {
//         // Clear existing content
//         // while (createSection.firstChild) {
//         //     createSection.removeChild(createSection.firstChild);
//         // }

//         // Create and append the header
//         const header = document.createElement("h2");
//         header.textContent = "Create Event";
//         createSection.appendChild(header);

//         // Define form fields
//         const formFields = [
//             { type: "text", id: "event-title", placeholder: "Event Title", required: true },
//             { type: "textarea", id: "event-description", placeholder: "Event Description", required: true },
//             { type: "text", id: "event-place", placeholder: "Event Place", required: true },
//             { type: "text", id: "event-location", placeholder: "Event Location", required: true },
//             { type: "date", id: "event-date", required: true },
//             { type: "time", id: "event-time", required: true },
//             { type: "text", id: "organizer-name", placeholder: "Organizer Name", required: true },
//             { type: "text", id: "organizer-contact", placeholder: "Organizer Contact", required: true },
//             { type: "number", id: "total-capacity", placeholder: "Total Capacity", required: true },
//             { type: "url", id: "website-url", placeholder: "Website URL" },
//             { type: "text", id: "category", placeholder: "Category", required: true },
//             { type: "file", id: "event-banner", accept: "image/*" }
//         ];

//         // Create form fields
//         formFields.forEach(field => {
//             const formGroup = document.createElement("div");
//             formGroup.className = "form-group";

//             let inputElement;
//             if (field.type === "textarea") {
//                 inputElement = document.createElement("textarea");
//             } else {
//                 inputElement = document.createElement("input");
//                 inputElement.type = field.type;
//             }

//             inputElement.id = field.id;
//             inputElement.placeholder = field.placeholder || "";
//             if (field.required) inputElement.required = true;
//             if (field.accept) inputElement.accept = field.accept;

//             formGroup.appendChild(inputElement);
//             createSection.appendChild(formGroup);
//         });

//         // Create and append the button
//         const createButton = document.createElement("button");
//         createButton.id = "create-event-btn";
//         createButton.textContent = "Create Event";
//         createSection.appendChild(createButton);

//         // Add place suggestions box
//         const eventPlaceInput = document.getElementById("event-place");
//         const placeSuggestionsBox = document.createElement("div");
//         placeSuggestionsBox.id = "place-suggestions";
//         placeSuggestionsBox.className = "suggestions-dropdown";
//         createSection.appendChild(placeSuggestionsBox);
//         content.appendChild(createSection);
//         addEventEventListeners(eventPlaceInput);
//     } else {
//         SnackBar("Please log in to create an event.", 3000);
//         navigate('/login');
//     }
// }

// function addEventEventListeners(eventPlaceInput, placeSuggestionsBox) {

//     // Event listener for place input
//     eventPlaceInput.addEventListener("input", async function () {
//         const query = eventPlaceInput.value.trim();
//         if (!query) {
//             placeSuggestionsBox.style.display = "none";
//             return;
//         }

//         try {
//             const response = await fetch(`/api/suggestions/places?query=${query}`);
//             const suggestions = await response.json();

//             placeSuggestionsBox.innerHTML = "";
//             placeSuggestionsBox.style.display = suggestions.length > 0 ? "block" : "none";

//             suggestions.forEach(suggestion => {
//                 const suggestionElement = document.createElement("div");
//                 suggestionElement.className = "suggestion-item";
//                 suggestionElement.textContent = suggestion.name;
//                 suggestionElement.dataset.id = suggestion.id;

//                 suggestionElement.addEventListener("click", () => {
//                     eventPlaceInput.value = suggestion.name;
//                     placeSuggestionsBox.style.display = "none";
//                 });

//                 placeSuggestionsBox.appendChild(suggestionElement);
//             });
//         } catch (error) {
//             console.error("Error fetching place suggestions:", error);
//             placeSuggestionsBox.style.display = "none";
//         }
//     });

//     // Close suggestions when clicking outside
//     document.addEventListener("click", (event) => {
//         if (!event.target.closest("#event-place") && !event.target.closest("#place-suggestions")) {
//             placeSuggestionsBox.style.display = "none";
//         }
//     });

//     // Add event listener to the create button
//     createButton.addEventListener("click", createEvent);
// }

// async function createEvent() {
//     if (state.token && state.user) {
//         const title = document.getElementById("event-title").value.trim();
//         const date = document.getElementById("event-date").value;
//         const time = document.getElementById("event-time").value;
//         const place = document.getElementById("event-place").value;
//         const location = document.getElementById("event-location").value.trim();
//         const description = document.getElementById("event-description").value.trim();
//         const bannerFile = document.getElementById("event-banner").files[0];
//         console.log(title, date, time, place, location, description);
//         // Validate input values
//         if (!title || !date || !time || !place || !location || !description) {
//             SnackBar("Please fill in all required fields.", 3000);
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
//             SnackBar(`Event created successfully: ${result.title}`, 3000);
//             navigate('/event/' + result.eventid);
//         } catch (error) {
//             SnackBar(`Error creating event: ${error.message}`, 3000);
//         }
//     } else {
//         navigate('/login');
//     }
// }



// export { createEventForm };