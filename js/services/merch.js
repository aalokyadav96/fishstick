import { state } from "../state/state.js";
import { apiFetch } from "../api/api.js";


function addMerchForm(eventId) {
    const editEventDiv = document.getElementById('editevent');
    editEventDiv.innerHTML = `
        <h3>Add Merchandise</h3>
        <input type="text" id="merch-name" placeholder="Merchandise Name" required />
        <input type="number" id="merch-price" placeholder="Price" required />
        <input type="number" id="merch-stock" placeholder="Stock Available" required />
        <input type="file" id="merch-image" accept="image/*" />
        <button id="add-merch-btn">Add Merchandise</button>
        <button id="cancel-merch-btn">Cancel</button>
    `;

    // Attach event listeners
    document.getElementById('add-merch-btn').addEventListener('click', () => addMerchandise(eventId));
    document.getElementById('cancel-merch-btn').addEventListener('click', clearMerchForm);
}


// Add merchandise to the event
async function addMerchandise(eventId) {
    const merchName = document.getElementById('merch-name').value.trim();
    const merchPrice = parseFloat(document.getElementById('merch-price').value);
    const merchStock = parseInt(document.getElementById('merch-stock').value);
    const merchImageFile = document.getElementById('merch-image').files[0];

    if (!merchName || isNaN(merchPrice) || isNaN(merchStock)) {
        alert("Please fill in all fields correctly.");
        return;
    }

    // Check if image file is valid (optional)
    if (merchImageFile && !merchImageFile.type.startsWith('image/')) {
        alert("Please upload a valid image file.");
        return;
    }

    if (!merchName || isNaN(merchPrice) || isNaN(merchStock)) {
        alert("Please fill in all fields correctly.");
        return;
    }

    const formData = new FormData();
    formData.append('name', merchName);
    formData.append('price', merchPrice);
    formData.append('stock', merchStock);

    if (merchImageFile) {
        formData.append('image', merchImageFile);
    }

    try {
        const response = await apiFetch(`/event/${eventId}/merch`, 'POST', formData);

        if (response && response.merchid) {
            alert("Merchandise added successfully!");
            displayNewMerchandise(response);  // Display the newly added merchandise
            clearMerchForm();  // Optionally clear the form after success
        } else {
            alert(`Failed to add merchandise: ${response?.message || 'Unknown error'}`);
        }
    } catch (error) {
        alert(`Error adding merchandise: ${error.message}`);
    }
}

// Display the newly added merchandise
function displayNewMerchandise(merchData) {
    const merchList = document.getElementById("merch-list");

    const merchItem = document.createElement("div");
    merchItem.className = 'merch-item';
    merchItem.innerHTML = `
        <h3>${merchData.name}</h3>
        <p>Price: $${(merchData.price / 100).toFixed(2)}</p>
        <p>Available: ${merchData.stock}</p>
        ${merchData.merch_pic ? `<img src="/merchpic/${merchData.merch_pic}" alt="${merchData.name}" style="max-width: 160px;" />` : ''}
    `;
    merchList.prepend(merchItem);  // Add the merchandise to the list
}


// Clear the merchandise form
function clearMerchForm() {
    document.getElementById('editevent').innerHTML = '';
}

async function displayMerchandise(merchData, eventId, creatorid) {
    const merchList = document.getElementById("merch-list");
    merchList.innerHTML = "<li>Loading merchandise...</li>"; // Show loading state

    try {
        if (!Array.isArray(merchData)) throw new Error("Invalid merchandise data received.");

        merchList.innerHTML = ""; // Clear loading state
        if (merchData.length > 0) {
            merchData.forEach(merch => {
                const merchItem = document.createElement("li");
                merchItem.className = 'merch-item';
                merchItem.innerHTML = `
                    <img src="/merchpic/${merch.merch_pic}" alt="${merch.name}" class="merch-img"/>
                    <span class="merch-details">
                        Name: ${merch.name} <br>Price: $${(merch.price / 100).toFixed(2)}
                        <br>(Available: ${merch.stock})
                    </span>
                    <div class="merch-actions">
                        ${state.token ? (state.user === creatorid ? `
                            <button class="edit-merch-btn" data-merchid="${merch.merchid}">Edit</button>
                            <button class="delete-merch-btn" data-merchid="${merch.merchid}">Delete</button>
                        ` : `
                            <label for="quantity-${merch.merchid}">Quantity:</label>
                            <input type="number" id="quantity-${merch.merchid}" class="merch-quantity-input" 
                                   min="1" max="${merch.stock}" value="1">
                            <button class="buy-merch-btn" data-merchid="${merch.merchid}">Buy</button>
                        `) : ""}
                    </div>
                `;

                merchList.appendChild(merchItem);
            });

            // Attach event listeners for edit, delete, and buy actions
            merchList.querySelectorAll(".edit-merch-btn").forEach(button => {
                button.addEventListener("click", (event) => {
                    const merchId = event.target.dataset.merchid;
                    editMerchForm(merchId, eventId);
                });
            });

            merchList.querySelectorAll(".delete-merch-btn").forEach(button => {
                button.addEventListener("click", (event) => {
                    const merchId = event.target.dataset.merchid;
                    deleteMerch(merchId, eventId);
                });
            });

            merchList.querySelectorAll(".buy-merch-btn").forEach(button => {
                button.addEventListener("click", (event) => {
                    const merchId = event.target.dataset.merchid;
                    buyMerch(merchId, eventId);
                });
            });
        } else {
            merchList.innerHTML = `<li>No merchandise available for this event.</li>`;
        }
    } catch (error) {
        merchList.innerHTML = `<li>Error loading merchandise: ${error.message}</li>`;
    }
}


async function buyMerch(merchId, eventId) {
    const quantityInput = document.getElementById(`quantity-${merchId}`);
    const quantity = parseInt(quantityInput.value);

    // Validate quantity
    if (isNaN(quantity) || quantity < 1) {
        alert('Please select a valid quantity.');
        return;
    }

    // Prepare the request body
    const requestBody = JSON.stringify({
        quantity: quantity
    });

    try {
        const response = await apiFetch(`/event/${eventId}/merch/${merchId}/buy`, 'POST', requestBody);

        if (response.success) {
            const data = response;
            alert(data.message);
        } else {
            const errorData = response;
            alert(`Error: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Error purchasing merchandise:', error);
        alert('An error occurred while purchasing the merchandise.');
    }
}

async function deleteMerch(merchId, eventId) {
    if (confirm('Are you sure you want to delete this merchandise?')) {
        try {
            const response = await apiFetch(`/event/${eventId}/merch/${merchId}`, 'DELETE');

            if (response.success) {
                alert('Merchandise deleted successfully!');
                // Remove the deleted item from the DOM
                const merchItem = document.getElementById(`merch-${merchId}`);
                if (merchItem) merchItem.remove();
            } else {
                const errorData = await response.json();
                alert(`Failed to delete merchandise: ${errorData.message}`);
            }
        } catch (error) {
            console.error('Error deleting merchandise:', error);
            alert('An error occurred while deleting the merchandise.');
        }
    }
}


async function editMerchForm(merchId, eventId) {
    const response = await apiFetch(`/event/${eventId}/merch/${merchId}`, 'GET');

    const formHtml = `
        <h3>Edit Merchandise</h3>
        <form id="edit-merch-form">
            <input type="hidden" name="merchid" value="${merchId}" />
            <label for="merchName">Name:</label>
            <input type="text" id="merchName" name="merchName" value="${response.name}" required />
            <label for="merchPrice">Price:</label>
            <input type="number" id="merchPrice" name="merchPrice" value="${response.price}" required step="0.01" />
            <label for="merchStock">Stock:</label>
            <input type="number" id="merchStock" name="merchStock" value="${response.stock}" required />
            <button type="submit">Update Merchandise</button>
        </form>
    `;

    const editDiv = document.getElementById('editevent');
    editDiv.innerHTML = formHtml;

    document.getElementById('edit-merch-form').addEventListener('submit', async (event) => {
        event.preventDefault();

        // Prepare data to send to the backend
        const merchData = {
            name: document.getElementById('merchName').value,
            price: parseFloat(document.getElementById('merchPrice').value),
            stock: parseInt(document.getElementById('merchStock').value)
        };

        try {
            // Send a PUT request with JSON data
            const updateResponse = await apiFetch(`/event/${eventId}/merch/${merchId}`, 'PUT', JSON.stringify(merchData), {
                'Content-Type': 'application/json'
            });

            if (updateResponse.success) {
                alert('Merchandise updated successfully!');
            } else {
                alert(`Failed to update merchandise: ${updateResponse.message}`);
            }
        } catch (error) {
            console.error('Error updating merchandise:', error);
            alert('An error occurred while updating the merchandise.');
        }
    });
}


export { addMerchForm, addMerchandise, displayNewMerchandise, clearMerchForm, displayMerchandise, buyMerch, deleteMerch, editMerchForm };