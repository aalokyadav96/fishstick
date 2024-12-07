import { apiFetch } from "../api/api.js";
import { state } from "../state/state.js";

// // Clear the ticket form
// function clearTicketForm() {
//     document.getElementById('editevent').innerHTML = '';
// }


// Add ticket to the event
async function addTicket(eventId) {
    const tickName = document.getElementById('ticket-name').value.trim();
    const tickPrice = parseFloat(document.getElementById('ticket-price').value);
    const tickQuantity = parseInt(document.getElementById('ticket-quantity').value);

    if (!tickName || isNaN(tickPrice) || isNaN(tickQuantity)) {
        alert("Please fill in all fields correctly.");
        return;
    }

    const formData = new FormData();
    formData.append('name', tickName);
    formData.append('price', tickPrice);
    formData.append('quantity', tickQuantity);

    try {
        const response = await apiFetch(`/event/${eventId}/ticket`, 'POST', formData);

        if (response && response.ticketid) {
            alert("Ticket added successfully!");
            displayNewTicket(response);  // Display the newly added ticket
            clearTicketForm();  // Optionally clear the form after success
        } else {
            alert(`Failed to add ticket: ${response?.message || 'Unknown error'}`);
        }
    } catch (error) {
        alert(`Error adding ticket: ${error.message}`);
    }
}

function displayNewTicket(ticketData) {
    const ticketList = document.getElementById("ticket-list");

    const ticketItem = document.createElement("li");
    ticketItem.className = 'ticket-item';

    ticketItem.innerHTML = `
        <div class="hflex">
            <h3>Name: ${sanitize(ticketData.name)}</h3>
            <p>Price: $${(ticketData.price / 100).toFixed(2)}</p>
            <p>Available: ${ticketData.quantity}</p>
        </div>
        <div class="ticket-actions">
            <button class="edit-ticket-btn">Edit Ticket</button>
            <button class="delete-ticket-btn">Delete Ticket</button>
        </div>
    `;

    ticketItem.querySelector('.edit-ticket-btn').addEventListener('click', () => editTicket(ticketData.ticketid, ticketData.eventid));
    ticketItem.querySelector('.delete-ticket-btn').addEventListener('click', () => deleteTicket(ticketData.ticketid, ticketData.eventid));

    ticketList.appendChild(ticketItem);
}

// Show the add ticket form
function addTicketForm(eventId) {
    const editEventDiv = document.getElementById('editevent');
    editEventDiv.innerHTML = `
        <h3>Add Ticket</h3>
        <form id="add-ticket-form">
            <input type="text" id="ticket-name" placeholder="Ticket Name" required />
            <input type="number" id="ticket-price" placeholder="Ticket Price" required />
            <input type="number" id="ticket-quantity" placeholder="Quantity Available" required />
            <button type="submit">Add Ticket</button>
        </form>
        <button id="cancel-ticket-form">Cancel</button>
    `;

    // Attach event listeners
    document.getElementById('add-ticket-form').addEventListener('submit', (event) => {
        event.preventDefault();
        addTicket(eventId);
    });
    document.getElementById('cancel-ticket-form').addEventListener('click', clearTicketForm);
}

// Display tickets
async function displayTickets(ticketData, creatorId, eventId) {
    const ticketList = document.getElementById("ticket-list");
    ticketList.innerHTML = "<li>Loading tickets...</li>"; // Show loading state

    try {
        if (!Array.isArray(ticketData)) throw new Error("Invalid ticket data received.");

        ticketList.innerHTML = ""; // Clear loading state

        if (ticketData.length > 0) {
            ticketData.forEach(ticket => {
                const isLoggedIn = state.token;
                const isCreator = state.user && state.user === creatorId;

                // Create ticket list item
                const ticketItem = document.createElement("li");
                ticketItem.innerHTML = `
                    <div class="hflex">
                        <strong>${ticket.name}</strong><br>
                        <span>Price: $${(ticket.price / 100).toFixed(2)}<br>Available: ${ticket.quantity}</span>
                        <div class="ticket-actions"></div>
                    </div>
                `;

                const actionsDiv = ticketItem.querySelector('.ticket-actions');

                // Add 'Buy Ticket' button and quantity input if logged in and not the creator
                if (isLoggedIn && !isCreator && ticket.quantity > 0) {
                    const quantityInput = document.createElement("input");
                    quantityInput.type = "number";
                    quantityInput.className = "ticket-quantity-input";
                    quantityInput.min = "1";
                    quantityInput.max = "5";
                    quantityInput.value = "1";

                    const buyButton = document.createElement("button");
                    buyButton.className = "buy-ticket-btn";
                    buyButton.textContent = "Buy Ticket";
                    buyButton.addEventListener('click', (e) => buyTicket(e, ticket.ticketid, eventId));

                    actionsDiv.appendChild(quantityInput);
                    actionsDiv.appendChild(buyButton);
                }

                // Add 'Edit Ticket' and 'Delete Ticket' buttons for creators
                if (isCreator) {
                    const editButton = document.createElement("button");
                    editButton.className = "edit-ticket-btn";
                    editButton.textContent = "Edit";
                    editButton.addEventListener('click', () => editTicket(ticket.ticketid, eventId));

                    const deleteButton = document.createElement("button");
                    deleteButton.className = "delete-ticket-btn";
                    deleteButton.textContent = "Delete";
                    deleteButton.addEventListener('click', () => deleteTicket(ticket.ticketid, eventId));

                    actionsDiv.appendChild(editButton);
                    actionsDiv.appendChild(deleteButton);
                }

                ticketList.appendChild(ticketItem);
            });
        } else {
            ticketList.innerHTML = `<li>No tickets available for this event.</li>`;
        }
    } catch (error) {
        console.error("Error loading tickets:", error);
        ticketList.innerHTML = `<li>Error loading tickets: ${error.message}</li>`;
    }
}

// Function to edit the ticket (for creators)
async function editTicket(ticketId, eventId) {
    try {
        // Fetch current ticket details from the backend
        const ticketData = await apiFetch(`/event/${eventId}/ticket/${ticketId}`, 'GET');

        if (!ticketData || !ticketData.ticketid) {
            alert("Failed to load ticket data.");
            return;
        }

        // Show the edit form with the ticket data populated
        const editEventDiv = document.getElementById('editevent');
        editEventDiv.innerHTML = `
            <h3>Edit Ticket</h3>
            <form id="edit-ticket-form">
                <input type="hidden" id="ticket-id" value="${ticketData.ticketid}" />
                <label for="ticket-name">Name:</label>
                <input type="text" id="ticket-name" value="${ticketData.name}" required />
                <label for="ticket-price">Price:</label>
                <input type="number" id="ticket-price" value="${ticketData.price}" required />
                <label for="ticket-quantity">Quantity Available:</label>
                <input type="number" id="ticket-quantity" value="${ticketData.quantity}" required />
                <button type="submit">Update Ticket</button>
            </form>
            <button id="cancel-edit-form">Cancel</button>
        `;

        // Attach event listeners
        document.getElementById('edit-ticket-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            updateTicket(ticketId, eventId);
        });
        document.getElementById('cancel-edit-form').addEventListener('click', clearTicketForm);
    } catch (error) {
        console.error("Error loading ticket data:", error);
        alert("An error occurred while loading the ticket data.");
    }
}

// Update the ticket
async function updateTicket(ticketId, eventId) {
    const name = document.getElementById('ticket-name').value.trim();
    const price = parseFloat(document.getElementById('ticket-price').value);
    const quantity = parseInt(document.getElementById('ticket-quantity').value);

    const updatedTicket = { name, price, quantity };

    try {
        const response = await apiFetch(`/event/${eventId}/ticket/${ticketId}`, 'PUT', JSON.stringify(updatedTicket), {
            'Content-Type': 'application/json'
        });

        if (response.success) {
            alert('Ticket updated successfully!');
            clearTicketForm();
            displayTickets(await apiFetch(`/event/${eventId}/tickets`, 'GET'), state.user, eventId); // Refresh tickets
        } else {
            alert(`Failed to update ticket: ${response.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error("Error updating ticket:", error);
        alert("An error occurred while updating the ticket.");
    }
}

// Clear ticket form
function clearTicketForm() {
    const editEventDiv = document.getElementById('editevent');
    editEventDiv.innerHTML = ""; // Clear the form content
}


async function deleteTicket(ticketId, eventId) {
    if (confirm('Are you sure you want to delete this ticket?')) {
        try {
            const response = await apiFetch(`/event/${eventId}/ticket/${ticketId}`, 'DELETE');

            // Check if the response was successful (status 200-299 range)
            if (response.success) {
                // Check if the response contains a message
                // const responseData = await response.json();
                // if (responseData.success) {
                alert('Ticket deleted successfully!');
                // Optionally, refresh the ticket list or update the UI
                // displayEvent(eventId); // Uncomment if you have access to eventId
                // }
            } else {
                // Handle cases where response is not OK (i.e., status 400 or 500 range)
                const errorData = await response.json();
                alert(`Failed to delete ticket: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting ticket:', error);
            alert('An error occurred while deleting the ticket.');
        }
    }
}

// Updated function to handle ticket buying with quantity input
async function buyTicket(event, ticketId, eventId) {
    // Get the button that triggered the event
    const button = event.target;
    const quantityInput = button.closest("li").querySelector("input.ticket-quantity-input");
    const quantity = parseInt(quantityInput.value);

    // Validate the quantity
    if (isNaN(quantity) || quantity < 1 || quantity > 5) {
        alert("Please select a valid quantity between 1 and 5.");
        return;
    }

    // Get the button and disable it while processing
    button.textContent = "Processing...";
    button.disabled = true;

    try {
        // Prepare the request body with the selected quantity
        const body = JSON.stringify({
            quantity: quantity
        });

        // Call the apiFetch function to make the request
        const result = await apiFetch(`/event/${eventId}/tickets/${ticketId}/buy`, "POST", body);

        if (result && result.success) {
            alert(`Successfully purchased ${quantity} ticket(s)!`);

            // Reset the button state and the quantity input
            button.textContent = "Buy Ticket";
            quantityInput.value = "1"; // Reset quantity input

            // Update the available ticket quantity in the UI
            const ticketItem = button.closest("li");
            const quantityElement = ticketItem.querySelector("span.ticket-quantity");
            if (quantityElement) {
                const availableTickets = parseInt(quantityElement.textContent);
                quantityElement.textContent = (availableTickets - quantity).toString();
            }

            // Disable the button if no tickets are left
            if (quantityElement && parseInt(quantityElement.textContent) <= 0) {
                button.disabled = true;
                button.textContent = "Sold Out";
            }
        } else {
            throw new Error(result?.message || "Unexpected error during purchase.");
        }
    } catch (error) {
        alert(`Error: ${error.message}`);
    } finally {
        // Reset the button state if not already disabled
        if (!button.disabled) {
            button.textContent = "Buy Ticket";
            button.disabled = false;
        }
    }
}

export { clearTicketForm, addTicketForm, addTicket, displayNewTicket, deleteTicket, buyTicket, displayTickets, editTicket };