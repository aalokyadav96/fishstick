import { apiFetch } from "./api.js";
import { state } from "./state.js";
// Clear the ticket form
function clearTicketForm() {
    document.getElementById('editevent').innerHTML = '';
}

// Show the add ticket form
function addTicketForm(eventId) {
    const editEventDiv = document.getElementById('editevent');
    editEventDiv.innerHTML = `
    <h3>Add Ticket</h3>
    <input type="text" id="ticket-name" placeholder="Ticket Name" required />
    <input type="number" id="ticket-price" placeholder="Ticket Price" required />
    <input type="number" id="ticket-quantity" placeholder="Quantity Available" required />
    <button onclick="addTicket('${eventId}')">Add Ticket</button>
    <button onclick="clearTicketForm()">Cancel</button>
    `;
}

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

// Display the newly added ticket
function displayNewTicket(ticketData) {
    const ticketList = document.getElementById("ticket-list");

    const ticketItem = document.createElement("div");
    ticketItem.className = 'ticket-item';
    ticketItem.innerHTML = `
        <h3>${ticketData.name}</h3>
        <p>Price: $${(ticketData.price / 100).toFixed(2)}</p>
        <p>Available: ${ticketData.quantity}</p>
        <button class="edit-ticket-btn" onclick="editTicket('${ticketData.ticketid}')">Edit Ticket</button><button class="delete-ticket-btn" onclick="deleteTicket('${ticketData.ticketid}', '${ticketData.eventid}')">Delete Ticket</button>
    `;
    ticketList.appendChild(ticketItem);  // Add the ticket to the list
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


async function buyTicket(event, ticketId, eventId) {
    // Get the button that triggered the event
    const button = event.target;
    button.textContent = "Processing...";
    button.disabled = true;

    try {
        // Prepare the request body
        const body = JSON.stringify({
            ticketid: ticketId,
            eventid: eventId
        });

        // Call the apiFetch function to make the request
        const result = await apiFetch(`/event/${eventId}/tickets/${ticketId}/buy`, "POST", body);

        if (result && result.success) {
            alert("Ticket purchased successfully!");

            button.textContent = "Buy Ticket";
            // Update ticket quantity in the UI
            const ticketItem = button.closest("li");
            const quantityElement = ticketItem.querySelector("span.ticket-quantity");
            if (quantityElement) {
                const availableTickets = parseInt(quantityElement.textContent);
                if (availableTickets > 0) {
                    quantityElement.textContent = (availableTickets - 1).toString();
                }
            }

            // Optionally, disable the buy button if no tickets are left
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
        // Reset the button state
        if (!button.disabled) { // Only reset if it isn't already disabled
            button.textContent = "Buy Ticket";
            button.disabled = false;
        }
    }
}

async function displayTickets(ticketData, creatorid, eventId) {
    const ticketList = document.getElementById("ticket-list");
    ticketList.innerHTML = "<li>Loading tickets...</li>";  // Show loading state

    try {
        if (!Array.isArray(ticketData)) throw new Error("Invalid ticket data received.");

        ticketList.innerHTML = ""; // Clear loading state
        if (ticketData.length > 0) {
            ticketData.forEach(ticket => {
                const isLoggedIn = state.token;
                const isCreator = state.user && state.user === creatorid;

                // Ticket details HTML
                let ticketItemHTML = `
                    <li><div class="hflex">
                        <strong>Name : ${ticket.name}</strong><br><span>Price : $${(ticket.price / 100).toFixed(2)} <br>Available: ${ticket.quantity}</span></div><div class="ticket-actions">
                `;

                // Add 'Buy Ticket' button if logged in and not the creator
                if (isLoggedIn && !isCreator && ticket.quantity > 0) {
                    ticketItemHTML += `
                        <button class="buy-ticket-btn" onclick="buyTicket(event, '${ticket.ticketid}', '${eventId}')">Buy Ticket</button>`;
                }
                // Add 'Edit Ticket' button if user is the creator
                else if (isCreator) {
                    ticketItemHTML += `<button class="edit-ticket-btn" onclick="editTicket('${ticket.ticketid}', '${eventId}')">Edit Ticket</button><button class="delete-ticket-btn" onclick="deleteTicket('${ticket.ticketid}', '${eventId}')">Delete Ticket</button>`;
                }
                // Close the list item tag
                ticketItemHTML += ` </div></li>`;
                // Append the ticket HTML to the list
                ticketList.innerHTML += ticketItemHTML;
            });
        } else {
            ticketList.innerHTML = `<li>No tickets available for this event.</li>`;
        }
    } catch (error) {
        ticketList.innerHTML = `<li>Error loading tickets: ${error.message}</li>`;
    }
}


// // Function to edit the ticket (for creators)
// function editTicket(ticketId) {
//     // Example of how you might handle the edit functionality
//     alert(`Edit ticket with ID: ${ticketId}`);
// }

// // Function to edit the ticket (for creators)
// async function editTicket(ticketId, eventId) {
//     // Fetch current ticket details from the backend
//     const response = await apiFetch(`/event/${eventId}/ticket/${ticketId}`, 'GET');

//     if (!response || !response.ticketid) {
//         alert("Failed to load ticket data.");
//         return;
//     }

//     // Show the edit form with the ticket data populated
//     const editEventDiv = document.getElementById('editevent');
//     editEventDiv.innerHTML = `
//         <h3>Edit Ticket</h3>
//         <form id="edit-ticket-form">
//             <input type="hidden" name="ticketid" value="${response.ticketid}" />
//             <label for="ticket-name">Name:</label>
//             <input type="text" id="ticket-name" name="ticket-name" value="${response.name}" required />
//             <label for="ticket-price">Price:</label>
//             <input type="number" id="ticket-price" name="ticket-price" value="${response.price}" required />
//             <label for="ticket-quantity">Quantity Available:</label>
//             <input type="number" id="ticket-quantity" name="ticket-quantity" value="${response.quantity}" required />
//             <button type="submit">Update Ticket</button>
//         </form>
//         <button onclick="clearTicketForm()">Cancel</button>
//     `;

//     // Handle form submission
//     document.getElementById('edit-ticket-form').addEventListener('submit', async (event) => {
//         event.preventDefault();

//         // Prepare updated ticket data
//         const updatedTicket = {
//             name: document.getElementById('ticket-name').value.trim(),
//             price: parseFloat(document.getElementById('ticket-price').value),
//             quantity: parseInt(document.getElementById('ticket-quantity').value)
//         };

//         // Validation (basic)
//         if (!updatedTicket.name || isNaN(updatedTicket.price) || isNaN(updatedTicket.quantity)) {
//             alert("Please fill in all fields correctly.");
//             return;
//         }

//         // Send the updated ticket data to the backend
//         try {
//             const updateResponse = await apiFetch(`/event/${eventId}/ticket/${ticketId}`, 'PUT', JSON.stringify(updatedTicket), {
//                 'Content-Type': 'application/json'
//             });

//             if (updateResponse.success) {
//                 alert('Ticket updated successfully!');
//                 // Optionally, refresh the ticket list or navigate away
//                 // displayUpdatedTicket(updateResponse); // Uncomment if needed
//                 clearTicketForm();  // Clear form after success
//             } else {
//                 alert(`Failed to update ticket: ${updateResponse.message || 'Unknown error'}`);
//             }
//         } catch (error) {
//             console.error('Error updating ticket:', error);
//             alert('An error occurred while updating the ticket.');
//         }
//     });
// }


// Function to edit the ticket (for creators)
async function editTicket(ticketId, eventId) {
    // Fetch current ticket details from the backend
    const response = await apiFetch(`/event/${eventId}/ticket/${ticketId}`, 'GET');

    if (!response || !response.ticketid) {
        alert("Failed to load ticket data.");
        return;
    }

    // Show the edit form with the ticket data populated
    const editEventDiv = document.getElementById('editevent');
    editEventDiv.innerHTML = `
        <h3>Edit Ticket</h3>
        <form id="edit-ticket-form">
            <input type="hidden" name="ticketid" value="${response.ticketid}" />
            <label for="ticket-name">Name:</label>
            <input type="text" id="ticket-name" name="ticket-name" value="${response.name}" required />
            <label for="ticket-price">Price:</label>
            <input type="number" id="ticket-price" name="ticket-price" value="${response.price}" required />
            <label for="ticket-quantity">Quantity Available:</label>
            <input type="number" id="ticket-quantity" name="ticket-quantity" value="${response.quantity}" required />
            <button type="submit">Update Ticket</button>
        </form>
        <button onclick="clearTicketForm()">Cancel</button>
    `;

    // Handle form submission
    document.getElementById('edit-ticket-form').addEventListener('submit', async (event) => {
        event.preventDefault();

        // Prepare updated ticket data, but only send the fields that have changed
        const updatedTicket = {};

        // Only include fields that the user has modified
        const name = document.getElementById('ticket-name').value.trim();
        const price = parseFloat(document.getElementById('ticket-price').value);
        const quantity = parseInt(document.getElementById('ticket-quantity').value);

        if (name !== response.name) updatedTicket.name = name;
        if (!isNaN(price) && price !== response.price) updatedTicket.price = price;
        if (!isNaN(quantity) && quantity !== response.quantity) updatedTicket.quantity = quantity;

        // If no changes are detected, show an alert and return
        if (Object.keys(updatedTicket).length === 0) {
            alert("No changes detected.");
            return;
        }

        // Send the updated ticket data to the backend
        try {
            const updateResponse = await apiFetch(`/event/${eventId}/ticket/${ticketId}`, 'PUT', JSON.stringify(updatedTicket), {
                'Content-Type': 'application/json'
            });

            if (updateResponse.success) {
                alert('Ticket updated successfully!');
                clearTicketForm();  // Clear form after success
            } else {
                alert(`Failed to update ticket: ${updateResponse.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error updating ticket:', error);
            alert('An error occurred while updating the ticket.');
        }
    });
}


export { clearTicketForm, addTicketForm, addTicket, displayNewTicket, deleteTicket, buyTicket, displayTickets, editTicket };