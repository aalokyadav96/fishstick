import { state } from "../../state/state.js";
import { apiFetch } from "../../api/api.js";
import { displayTickets } from "../tickets/ticketService.js";
import { displayEventMedia } from "../media/mediaService.js";
import { displayMerchandise } from "../merch/merchService.js";
import { navigate } from "../../routes/index.js";
import SnackBar from '../../components/ui/Snackbar.mjs';
import EventTimeline from '../../components/ui/EventTimeline.mjs';
import Accordion from '../../components/ui/Accordion.mjs';
import ReviewItem from '../../components/ui/ReviewItem.mjs';
import Breadcrumb from '../../components/ui/Breadcrumb.mjs';
// import Countdown from '../../components/ui/Countdown.mjs';
import { Button } from "../../components/base/Button.js";

// // Function to handle navigation
// function navigateToEvent(eventId) {
//     // Update the URL without reloading
//     history.pushState({ eventId }, '', `/event/${eventId}`);

//     // Fetch and display the event details dynamically
//     fetch(`/api/event/${eventId}`)
//         .then(response => response.json())
//         .then(event => {
//             const contentDiv = document.getElementById('content'); // Your content container
//             contentDiv.innerHTML = `
//                 <h1>${event.title}</h1>
//                 <img src="/eventpic/${event.banner_image}" alt="${event.title} Banner" style="width: 100%; max-height: 300px; object-fit: cover;" />
//                 <p><strong>Place:</strong> ${event.place}</p>
//                 <p><strong>Address:</strong> ${event.location}</p>
//                 <p><strong>Description:</strong> ${event.description}</p>
//             `;
//         })
//         .catch(error => console.error('Error fetching event details:', error));
// }

// // Handle back/forward navigation
// window.addEventListener('popstate', function (e) {
//     if (e.state && e.state.eventId) {
//         navigateToEvent(e.state.eventId); // Handle back/forward navigation
//     }
// });

// async function displayEvents(content, contentcon, page = 1) {
//     // const content = document.getElementById("events");
//     // const paginationContainer = document.getElementById("pagination");
//     const eventsPerPage = 4;

//     try {
//         // Fetch new data and save it locally
//         const events = await fetchEvents(page, eventsPerPage);
//         if (events && events.length > 0) {
//             content.innerHTML = events.map(generateEventHTML).join('');
//             console.log("Displayed refreshed events.");
//         } else {
//             content.innerHTML = "<h2>No events available.</h2>";
//         }
//         console.log("eeevee");
//         // Handle pagination using the Pagination component
//         const totalEvents = await fetchTotalEventCount(); // Assuming you have a backend call to get total events
//         const totalPages = Math.ceil(totalEvents / eventsPerPage);

//         const paginationContainer = document.createElement('div');
//         paginationContainer.id = "pagination";
//         paginationContainer.classList = "pagination";
//         contentcon.appendChild(paginationContainer);

//         paginationContainer.innerHTML = ''; // Clear existing pagination
//         const pagination = Pagination(page, totalPages, (newPage) => displayEvents(content, newPage));
//         paginationContainer.appendChild(pagination);

//         // Optionally, reapply the masonry layout after the new events are loaded
//         // await MasonryLayout('events', 'event');
//     } catch (error) {
//         content.innerHTML = "<h2>Error loading events. Please try again later.</h2>";
//         console.error("Error fetching events:", error);
//     }
// }



async function updateEvent(eventId) {
    if (!state.token) {
        SnackBar("Please log in to update event.", 3000);
        return;
    }

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
    formData.append('title', title);
    formData.append('date', date);
    formData.append('time', time);
    formData.append('place', place);
    formData.append('location', location);
    formData.append('description', description);
    if (bannerFile) {
        formData.append('event-banner', bannerFile);
    }

    try {
        const result = await apiFetch(`/event/${eventId}`, 'PUT', formData);
        SnackBar(`Event updated successfully: ${result.title}`, 3000);
        navigate('/event/' + result.eventid);
    } catch (error) {
        SnackBar(`Error updating event: ${error.message}`, 3000);
    }
}



async function displayEvent(eventId, contentContainer) {
    try {
        // Fetch event data from API (assuming you have a function for this)
        const eventData = await fetchEventData(eventId);
        const isLoggedIn = !!state.token;
        const isCreator = isLoggedIn && state.user === eventData.creatorid;
        // fetchEventData(eventId);
        // const eventData = {};
        // Clear previous content
        // Display event details, tickets, merchandise, and media
        displayEventDetails(contentContainer, eventData, isCreator, isLoggedIn);
        await displayTickets(eventData.tickets, eventId, isCreator, isLoggedIn);
        await displayMerchandise(eventData.merch, eventId, isCreator, isLoggedIn);
        await displayEventMedia(eventData.media, eventId, isLoggedIn);  // Display event media
        await displayEventVenue(eventData.place, isLoggedIn);  // Display event venue
        if (eventData.reviews != null) {
            await displayEventReviews(isCreator, isLoggedIn);  // Display event venue
        }
        if (eventData.timeline != null) {
            await displayEventTimeline(isCreator, isLoggedIn);  // Display event venue
        }
        if (eventData.faq != null) {
            await displayEventFAQ(isCreator, isLoggedIn);  // Display event venue
        }
        // addMediaEventListeners();
    } catch (error) {
        // Clear previous content and show error message
        const errorMessage = document.createElement("h1");
        errorMessage.textContent = `Error loading eventdetails: ${error.message}`;
        contentContainer.appendChild(errorMessage);
        SnackBar("Failed to load event details. Please try again later.", 3000);
    }
}

async function fetchEventData(eventId) {
    const eventData = await apiFetch(`/event/${eventId}`);
    if (!eventData || !Array.isArray(eventData.tickets)) {
        throw new Error("Invalid event data received.");
    }
    return eventData;
}


// Components
function createButton({ text, classes = [], id = '', events = {} }) {
    const button = document.createElement('button');
    button.textContent = text;
    button.classList.add(...classes);
    if (id) button.id = id;

    for (const event in events) {
        button.addEventListener(event, events[event]);
    }

    return button;
}

function createHeading(tag, text, classes = []) {
    const heading = document.createElement(tag);
    heading.textContent = text;
    heading.classList.add(...classes);
    return heading;
}

function createList(id, classes = []) {
    const list = document.createElement('ul');
    list.id = id;
    list.classList.add(...classes);
    return list;
}

function createContainer(classes = [], id = '') {
    const container = document.createElement('div');
    container.classList.add(...classes);
    if (id) container.id = id;
    return container;
}

function createImage({ src, alt, classes = [] }) {
    const image = document.createElement('img');
    image.src = src;
    image.alt = alt;
    image.classList.add(...classes);
    return image;
}

async function displayEventDetails(content, eventData, isCreator) {
    // const isCreator = state.token && state.user === eventData.creatorid;
    const isLoggedIn = state.token;

    content.innerHTML = '';

    // Event Details Container
    const eventDetails = createContainer(['event-details']);

    // Header Section
    const eventHeader = createContainer(['event-header']);

    const eventBanner = createContainer(['event-banner']);
    const bannerImage = createImage({
        src: `/eventpic/${eventData.banner_image}`,
        alt: `Banner for ${eventData.title}`,
        classes: ['event-banner-image'],
    });
    eventBanner.appendChild(bannerImage);

    // const eventEndDate = new Date(Date.now() + 3600000); // 1 hour from now
    // const countdown = Countdown(eventEndDate, () => {
    //     alert('Event has ended!');
    // });

    const eventInfo = createContainer(['event-info']);
    const eventActions = createContainer(['event-actions'], 'event-actions');
    const eventAdditions = createContainer(['event-actions'], 'event-actions');
    const eventEdit = createContainer(['event-edit'], 'editevent');

    const placeLink = document.createElement('a');
    placeLink.href = `/place/${eventData.place}`;
    placeLink.classList.add('event-place-link');
    placeLink.textContent = eventData.place;

    const placeParagraph = document.createElement('p');
    placeParagraph.classList.add('event-place');
    placeParagraph.textContent = 'Place: ';
    placeParagraph.appendChild(placeLink);

    eventBanner.prepend(eventActions);
    eventInfo.appendChild(createHeading('h1', eventData.title, ['event-title']));
    eventInfo.appendChild(createHeading('p', `Date: ${new Date(eventData.date).toLocaleString()}`, ['event-date']));
    eventInfo.appendChild(placeParagraph);
    eventInfo.appendChild(createHeading('p', `Location: ${eventData.location}`, ['event-location']));
    eventInfo.appendChild(createHeading('p', eventData.description, ['event-description']));

    // eventBanner.appendChild(countdown);
    eventHeader.appendChild(eventBanner);
    eventHeader.appendChild(eventInfo);
    eventInfo.appendChild(eventAdditions);

    // Event Tabs Section
    const tabContainer = createContainer(['event-tabs']);
    const tabButtons = createContainer(['tab-buttons']);
    const tabContents = createContainer(['tab-contents']);

    // const tabs = [
    //     { title: 'Tickets', id: 'ticket-list', content: '' },
    //     { title: 'Venue Details', id: 'venue-details', content: '' },
    //     { title: 'Event Timeline', id: 'time-line', content: '' },
    //     { title: 'Merchandise', id: 'merch-list', content: '' },
    //     { title: 'FAQ', id: 'event-faq', content: '' },
    //     { title: 'Reviews', id: 'event-reviews', content: '' },
    //     { title: 'Media', id: 'media-list', content: '' },
    // ];

    const tabs = getTabs(eventData);

    tabs.forEach(({ title, id, content }) => {
        // Tab Button
        const tabButton = createButton({
            text: title,
            classes: ['tab-button'],
            events: { click: () => activateTab(id) },
        });
        tabButtons.appendChild(tabButton);

        // Tab Content
        const tabContent = createContainer(['tab-content'], id);
        tabContent.textContent = content;
        tabContents.appendChild(tabContent);
    });

    tabContainer.appendChild(tabButtons);
    tabContainer.appendChild(tabContents);

    const breadcrumb = Breadcrumb([
        { label: 'Home', href: '/' },
        { label: 'Events', href: '/events' },
        { label: 'Event Details', href: `/event/${eventData.eventid}` },
    ]);

    eventDetails.appendChild(breadcrumb);
    eventDetails.appendChild(eventHeader);
    eventDetails.appendChild(eventEdit);
    eventDetails.appendChild(tabContainer);

    content.appendChild(eventDetails);

    // Add actions if logged in
    if (isLoggedIn) {
        const eventActionsWrapper = createContainer(['event-actions-wrapper']);
        const eventAdditionsWrapper = createContainer(['event-actions-wrapper']);

        if (isCreator) {
            const actions = [
                { text: 'Edit Event', onClick: () => editEventForm(eventData.eventid) },
                { text: 'Delete Event', onClick: () => deleteEvent(eventData.eventid), classes: ['delete-btn'] },
            ];

            actions.forEach(({ text, onClick, classes = [] }) => {
                eventActionsWrapper.appendChild(createButton({
                    text,
                    classes: ['action-btn', ...(classes || [])].filter(Boolean),
                    events: { click: onClick },
                }));
            });

            // const additions = [
            //     { text: 'Add Ticket', onClick: () => addTicketForm(eventData.eventid) },
            //     { text: 'Add Merchandise', onClick: () => addMerchForm(eventData.eventid) },
            // ];

            // additions.forEach(({ text, onClick, classes = [] }) => {
            //     eventAdditionsWrapper.appendChild(createButton({
            //         text,
            //         classes: ['action-btn', ...(classes || [])].filter(Boolean),
            //         events: { click: onClick },
            //     }));
            // });
        }

        // eventAdditionsWrapper.appendChild(createButton({
        //     text: "Add Media",
        //     classes: ['action-btn'],
        //     events: { click: () => showMediaUploadForm(eventData.eventid) },
        // }));

        eventActions.appendChild(eventActionsWrapper);
        eventAdditions.appendChild(eventAdditionsWrapper);
    }

    // Activate the first tab by default
    activateTab(tabs[0].id);

    function activateTab(tabId) {
        document.querySelectorAll('.tab-button').forEach((btn, index) => {
            btn.classList.toggle('active', tabs[index].id === tabId);
        });

        document.querySelectorAll('.tab-content').forEach((content) => {
            content.classList.toggle('active', content.id === tabId);
        });
        var eventId = eventData.eventid
        history.pushState({ eventId, tabId }, '', `/event/${eventId}#${tabId}`);
    }
}

function getTabs(eventData) {
    const tabs = [
        { title: 'Tickets', id: 'ticket-list', content: '' },
        { title: 'Venue Details', id: 'venue-details', content: '' },
        { title: 'Merchandise', id: 'merch-list', content: '' },
        { title: 'Media', id: 'media-list', content: '' },
    ];
    if (eventData.reviews != null) {
        tabs.push({ title: 'Reviews', id: 'event-reviews', content: '' },)
    }
    if (eventData.timeline != null) {
        tabs.push({ title: 'Event Timeline', id: 'time-line', content: '' },)
    }
    if (eventData.faq != null) {
        tabs.push({ title: 'FAQ', id: 'event-faq', content: '' },)
    }

    return tabs
}

// // Main Function to Display Event Details
// async function displayEventDetails(content, eventData) {
//     const isCreator = state.token && state.user === eventData.creatorid;
//     const isLoggedIn = state.token;

//     content.innerHTML = '';

//     // Event Details Container
//     const eventDetails = createContainer(['event-details']);

//     // Header Section
//     const eventHeader = createContainer(['event-header']);

//     const eventBanner = createContainer(['event-banner']);
//     const bannerImage = createImage({
//         src: `/eventpic/${eventData.banner_image}`,
//         alt: `Banner for ${eventData.title}`,
//         classes: ['event-banner-image'],
//     });
//     eventBanner.appendChild(bannerImage);

//     const eventInfo = createContainer(['event-info']);
//     const eventActions = createContainer(['event-actions'], 'event-actions');
//     const eventAdditions = createContainer(['event-actions'], 'event-actions');
//     const eventEdit = createContainer(['event-edit'], 'editevent');

//     const placeLink = document.createElement('a');
//     placeLink.href = `/place/${eventData.place}`;
//     placeLink.classList.add('event-place-link');
//     placeLink.textContent = eventData.place;

//     const placeParagraph = document.createElement('p');
//     placeParagraph.classList.add('event-place');
//     placeParagraph.textContent = 'Place: ';
//     placeParagraph.appendChild(placeLink);

//     eventBanner.prepend(eventActions);
//     eventInfo.appendChild(createHeading('h1', eventData.title, ['event-title']));
//     eventInfo.appendChild(createHeading('p', `Date: ${new Date(eventData.date).toLocaleString()}`, ['event-date']));
//     eventInfo.appendChild(placeParagraph);
//     eventInfo.appendChild(createHeading('p', `Location: ${eventData.location}`, ['event-location']));
//     eventInfo.appendChild(createHeading('p', eventData.description, ['event-description']));

//     eventHeader.appendChild(eventBanner);
//     eventHeader.appendChild(eventInfo);
//     eventInfo.appendChild(eventAdditions);

//     // Event Grid Section
//     const eventGrid = createContainer(['event-grid']);

//     const sections = [
//         { heading: 'Venue Details', listId: 'venue-details' },
//         { heading: 'Event Timeline', listId: 'time-line' },
//         { heading: 'Available Tickets', listId: 'ticket-list' },
//         { heading: 'Available Merchandise', listId: 'merch-list' },
//         { heading: 'Event FAQ', listId: 'event-faq' },
//         { heading: 'Event Reviews', listId: 'event-reviews' },
//         { heading: 'Event Media', listId: 'media-list' },
//     ];

//     sections.forEach(({ heading, listId }) => {
//         const gridItem = createContainer(['event-grid-item']);
//         gridItem.appendChild(createHeading('h2', heading));
//         gridItem.appendChild(createList(listId, ['event-list']));
//         eventGrid.appendChild(gridItem);
//     });

//     // Append header and grid to event details
//     eventDetails.appendChild(eventHeader);
//     eventDetails.appendChild(eventEdit);
//     eventDetails.appendChild(eventGrid);
//     content.appendChild(eventDetails);

//     // Add actions if logged in
//     if (isLoggedIn) {
//         const eventActionsWrapper = createContainer(['event-actions-wrapper']);
//         const eventAdditionsWrapper = createContainer(['event-actions-wrapper']);

//         if (isCreator) {
//             const actions = [
//                 { text: 'Edit Event', onClick: () => editEventForm(eventData.eventid) },
//                 { text: 'Delete Event', onClick: () => deleteEvent(eventData.eventid), classes: ['delete-btn'] },
//             ];

//             actions.forEach(({ text, onClick, classes = [] }) => {
//                 eventActionsWrapper.appendChild(createButton({
//                     text,
//                     classes: ['action-btn', ...classes],
//                     events: { click: onClick },
//                 }));
//             });

//             const additions = [
//                 { text: 'Add Ticket', onClick: () => addTicketForm(eventData.eventid) },
//                 { text: 'Add Merchandise', onClick: () => addMerchForm(eventData.eventid) },
//             ];

//             additions.forEach(({ text, onClick, classes = [] }) => {
//                 eventAdditionsWrapper.appendChild(createButton({
//                     text,
//                     classes: ['action-btn', ...classes],
//                     events: { click: onClick },
//                 }));
//             });
//         }

//         eventAdditionsWrapper.appendChild(createButton({
//             text: "Add Media",
//             classes: ['action-btn'],
//             events: { click: () => showMediaUploadForm(eventData.eventid) },
//         }));

//         eventActions.appendChild(eventActionsWrapper);
//         eventAdditions.appendChild(eventAdditionsWrapper);
//     }
// }


// Reusable Components
function createFormGroup({ label, inputType, inputId, inputValue = '', placeholder = '', isRequired = false, additionalProps = {} }) {
    const group = document.createElement('div');
    group.classList.add('form-group');

    const labelElement = document.createElement('label');
    labelElement.setAttribute('for', inputId);
    labelElement.textContent = label;

    let inputElement;
    if (inputType === 'textarea') {
        inputElement = document.createElement('textarea');
        inputElement.textContent = inputValue;
    } else {
        inputElement = document.createElement('input');
        inputElement.type = inputType;
        inputElement.value = inputValue;
    }

    inputElement.id = inputId;
    if (placeholder) inputElement.placeholder = placeholder;
    if (isRequired) inputElement.required = true;

    // Apply additional properties
    Object.entries(additionalProps).forEach(([key, value]) => {
        inputElement[key] = value;
    });

    group.appendChild(labelElement);
    group.appendChild(inputElement);
    return group;
}

async function editEventForm(eventId) {
    const createSection = document.getElementById("editevent");
    if (state.token) {
        try {
            // Fetch event data from the server (uncomment when the API is available)
            const event = await apiFetch(`/event/${eventId}`);

            // Clear the content of createSection
            createSection.innerHTML = '';

            // Create the form container
            const formContainer = document.createElement('div');
            formContainer.classList.add('form-container');

            const formHeading = document.createElement('h2');
            formHeading.textContent = 'Edit Event';

            // Create the form
            const form = document.createElement('form');
            form.id = 'edit-event-form';
            form.classList.add('edit-event-form');

            // Add form groups
            const formGroups = [
                { label: 'Event Title', inputType: 'text', inputId: 'event-title', inputValue: '34rtf34', placeholder: 'Event Title', isRequired: true },
                { label: 'Event Date', inputType: 'date', inputId: 'event-date', inputValue: '2024-11-28', isRequired: true },
                { label: 'Event Time', inputType: 'time', inputId: 'event-time', inputValue: '00:00', isRequired: true },
                { label: 'Event Location', inputType: 'text', inputId: 'event-location', inputValue: 'wterwtr', placeholder: 'Location', isRequired: true },
                { label: 'Event Place', inputType: 'text', inputId: 'event-place', inputValue: 'wter', placeholder: 'Place', isRequired: true },
                { label: 'Event Description', inputType: 'textarea', inputId: 'event-description', inputValue: 'terter', placeholder: 'Description', isRequired: true },
                { label: 'Event Banner', inputType: 'file', inputId: 'event-banner', additionalProps: { accept: 'image/*' } },
            ];

            formGroups.forEach(group => {
                form.appendChild(createFormGroup(group));
            });

            // Update Button
            const updateButton = document.createElement('button');
            updateButton.type = 'submit';
            updateButton.classList.add('update-btn');
            updateButton.textContent = 'Update Event';
            form.appendChild(updateButton);

            // Append form to formContainer
            formContainer.appendChild(formHeading);
            formContainer.appendChild(form);

            // Append formContainer to createSection
            createSection.appendChild(formContainer);

            // Attach event listener to the form for submitting the update
            form.addEventListener('submit', async (event) => {
                event.preventDefault();
                await updateEvent(eventId);
            });

        } catch (error) {
            SnackBar(`Error loading event: ${error.message}`, 3000);
        }
    } else {
        navigate('/login');
    }
}


// Function to display media for the event
async function displayEventVenue(place) {
    const venueList = document.getElementById("venue-details");
    venueList.innerHTML = `<li>Place: ${place}</li>`;  // Show loading state
}

async function displayEventTimeline(isCreator) {
    const timeline = document.getElementById("time-line");

    if (isCreator) {
        const button = Button("Add Timeline", "add-timeline-btn", {
            click: () => alert("Button clicked!"),
            mouseenter: () => console.log("Button hovered"),
        });

        timeline.appendChild(button);
    }
    var events;
    // const events = [
    //     { time: '10:00 AM', description: 'Opening Ceremony' },
    //     { time: '12:00 PM', description: 'Keynote Speech' },
    //     { time: '2:00 PM', description: 'Workshops' },
    // ];

    const tml = EventTimeline(events);
    timeline.appendChild(tml);
}

async function displayEventFAQ(isCreator) {
    const timeline = document.getElementById("event-faq");

    if (isCreator) {
        const button = Button("Add FAQs", "add-faq-btn", {
            click: () => alert("Button clicked!"),
            mouseenter: () => console.log("Button hovered"),
        });
        timeline.appendChild(button);
    }

    const sections = [
        { title: 'What is this event?', content: document.createTextNode('This is an example event.') },
        { title: 'How to register?', content: document.createTextNode('You can register through the registration form.') },
        { title: 'What is the refund policy?', content: document.createTextNode('Refunds are not available.') },
    ];

    const accordion = Accordion(sections);
    timeline.appendChild(accordion);
}

async function displayEventReviews(isCreator) {
    const timeline = document.getElementById("event-reviews");

    // if (isCreator) {
    const button = Button("Add Review", "add-review-btn", {
        click: () => alert("Button clicked!"),
        mouseenter: () => console.log("Button hovered"),
    });

    timeline.appendChild(button);
    // }

    const reviews = [
        { reviewerName: 'Alice', rating: 5, comment: 'Excellent place!' },
        { reviewerName: 'Bob', rating: 4, comment: 'Great experience.' },
        { reviewerName: 'Charlie', rating: 3, comment: 'It was okay.' },
    ];

    reviews.forEach((review) => {
        timeline.appendChild(ReviewItem(review));
    });
}


//================================================================


async function deleteEvent(eventId) {
    if (!state.token) {
        SnackBar("Please log in to delete your event.", 3000);
        return;
    }
    if (confirm("Are you sure you want to delete this event?")) {
        try {
            await apiFetch(`/event/${eventId}`, 'DELETE');
            SnackBar("Event deleted successfully.", 3000);
            navigate('/events'); // Redirect to home or another page
        } catch (error) {
            SnackBar(`Error deleting event: ${error.message}`, 3000);
        }
    }
};

// // Generate HTML for each event
// function generateEventHTML(event) {
//     return `
//         <div class="event" id="event-${event.eventid}">
//             <a href="/event/${event.eventid}" title="View event details" id="a-${event.eventid}">
//                 <h1>${event.title}</h1>
//                 <img src="/eventpic/${event.banner_image}" alt="${event.title} Banner" style="width: 100%; max-height: 300px; object-fit: cover;" />
//                 <p><strong>Place:</strong> ${event.place}</p>
//                 <p><strong>Address:</strong> ${event.location}</p>
//                 <p><strong>Description:</strong> ${event.description}</p>
//             </a>
//         </div>
//     `;
// }




export { updateEvent, fetchEventData, displayEventDetails, editEventForm, deleteEvent, displayEvent, displayEventVenue, displayEventTimeline, displayEventFAQ, displayEventReviews };

// export { createEventForm, createEvent, updateEvent, displayEvent, fetchEventData, displayEventDetails, editEventForm, deleteEvent, displayEvents, fetchEvents, generateEventHTML, displayEventVenue };