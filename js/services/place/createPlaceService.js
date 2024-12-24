import { state } from "../../state/state.js";
import Snackbar from '../../components/ui/Snackbar.mjs';
import { navigate } from "../../routes/index.js";
import { createPlace } from "./placeService.js";

function createForm(fields, onSubmit) {
    const form = createElement('form', { onsubmit: handleFormSubmit });
    function handleFormSubmit(event) {
        event.preventDefault();
        onSubmit(new FormData(form)); // Support file inputs
    }

    fields.forEach(field => {
        const formGroup = createElement('div', { class: 'form-group' }, [
            createElement('label', { for: field.id }, [field.label]),
            createElement(field.type === 'textarea' ? 'textarea' : 'input', {
                id: field.id,
                type: field.type || 'text',
                placeholder: field.placeholder,
                value: field.value || '',
                ...(field.required ? { required: true } : {}),
                ...(field.type === 'file' && field.accept ? { accept: field.accept } : {}),
            })
        ]);
        form.appendChild(formGroup);
    });

    form.appendChild(createElement('button', { type: 'submit' }, ["Submit"]));
    return form;
}

async function createPlaceForm(createSection) {
    // const createSection = document.getElementById("create-place-section");
    // createSection.innerHTML = "";

    if (state.token) {
        const formFields = [
            { id: "place-name", label: "Place Name", placeholder: "Enter the place name", required: true },
            { id: "place-address", label: "Address", placeholder: "Enter the address", required: true },
            { id: "place-city", label: "City", placeholder: "Enter the city", required: true },
            { id: "place-country", label: "Country", placeholder: "Enter the country", required: true },
            { id: "place-zipcode", label: "Zip Code", placeholder: "Enter the zip code", required: true },
            { id: "place-description", label: "Description", type: "textarea", placeholder: "Provide a description", required: true },
            { id: "capacity", label: "Capacity", type: "number", placeholder: "Enter the capacity", required: true, min: 1 },
            { id: "phone", label: "Phone Number", placeholder: "Enter the phone number" },
            // { id: "website", label: "Website URL", type: "url", placeholder: "Enter website URL" },
            { id: "category", label: "Category", placeholder: "Enter the category" },
            { id: "place-banner", label: "Place Banner", type: "file", accept: "image/*" }
        ];

        const form = createForm(formFields, createPlace);
        createSection.appendChild(createElement('h2', {}, ["Create Place"]));
        createSection.appendChild(form);
    } else {

        Snackbar("You must be logged in to create a place.", 3000);
        navigate('/login');
    }
}



// Function to dynamically create HTML content
function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
        if (key.startsWith('on') && typeof value === 'function') {
            element.addEventListener(key.slice(2).toLowerCase(), value);
        } else {
            element.setAttribute(key, value);
        }
    });
    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else {
            element.appendChild(child);
        }
    });
    return element;
}

export {createPlaceForm, createElement};