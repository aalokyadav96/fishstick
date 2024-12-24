import { state } from "../../state/state.js";
import { apiFetch } from "../../api/api.js";
import MerchCard from '../../components/ui/MerchCard.mjs';
import { Button } from "../../components/base/Button.js";


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

        if (response && response.data.merchid) {
            alert("Merchandise added successfully!");
            displayNewMerchandise(response.data);  // Display the newly added merchandise
            clearMerchForm();  // Optionally clear the form after success
        } else {
            alert(`Failed to add merchandise: ${response?.message || 'Unknown error'}`);
        }
    } catch (error) {
        alert(`Error adding merchandise: ${error.message}`);
    }
}


// Clear the merchandise form
function clearMerchForm() {
    document.getElementById('editevent').innerHTML = '';
}


async function buyMerch(merchId, eventId, qty) {
    // const quantityInput = document.getElementById(`quantity-${merchId}`);
    // const quantity = parseInt(quantityInput.value);
    const quantity = parseInt(qty);

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
    try {
        const response = await apiFetch(`/event/${eventId}/merch/${merchId}`, 'GET');

        const editDiv = document.getElementById('editevent');
        editDiv.textContent = ""; // Clear existing content

        const heading = document.createElement("h3");
        heading.textContent = "Edit Merchandise";

        const form = document.createElement("form");
        form.id = "edit-merch-form";

        const merchIdInput = document.createElement("input");
        merchIdInput.type = "hidden";
        merchIdInput.name = "merchid";
        merchIdInput.value = merchId;

        const nameLabel = document.createElement("label");
        nameLabel.setAttribute("for", "merchName");
        nameLabel.textContent = "Name:";

        const nameInput = document.createElement("input");
        nameInput.type = "text";
        nameInput.id = "merchName";
        nameInput.name = "merchName";
        nameInput.value = response.name;
        nameInput.required = true;

        const priceLabel = document.createElement("label");
        priceLabel.setAttribute("for", "merchPrice");
        priceLabel.textContent = "Price:";

        const priceInput = document.createElement("input");
        priceInput.type = "number";
        priceInput.id = "merchPrice";
        priceInput.name = "merchPrice";
        priceInput.value = response.price;
        priceInput.required = true;
        priceInput.step = "0.01";

        const stockLabel = document.createElement("label");
        stockLabel.setAttribute("for", "merchStock");
        stockLabel.textContent = "Stock:";

        const stockInput = document.createElement("input");
        stockInput.type = "number";
        stockInput.id = "merchStock";
        stockInput.name = "merchStock";
        stockInput.value = response.stock;
        stockInput.required = true;

        const submitButton = document.createElement("button");
        submitButton.type = "submit";
        submitButton.textContent = "Update Merchandise";

        // Append all elements to the form
        form.append(
            merchIdInput,
            nameLabel, nameInput,
            priceLabel, priceInput,
            stockLabel, stockInput,
            submitButton
        );

        // Append form and heading to the editDiv
        editDiv.append(heading, form);

        // Attach the submit event listener
        form.addEventListener("submit", async (event) => {
            event.preventDefault();

            // Prepare data to send to the backend
            const merchData = {
                name: nameInput.value,
                price: parseFloat(priceInput.value),
                stock: parseInt(stockInput.value)
            };

            try {
                // Send a PUT request with JSON data
                const updateResponse = await apiFetch(
                    `/event/${eventId}/merch/${merchId}`,
                    'PUT',
                    JSON.stringify(merchData),
                    { 'Content-Type': 'application/json' }
                );

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
    } catch (error) {
        console.error('Error fetching merchandise details:', error);
        alert('An error occurred while fetching the merchandise details.');
    }
}

function addMerchForm(eventId) {
    const editEventDiv = document.getElementById('editevent');
    editEventDiv.textContent = ""; // Clear existing content

    const heading = document.createElement("h3");
    heading.textContent = "Add Merchandise";

    const merchNameInput = document.createElement("input");
    merchNameInput.type = "text";
    merchNameInput.id = "merch-name";
    merchNameInput.placeholder = "Merchandise Name";
    merchNameInput.required = true;

    const merchPriceInput = document.createElement("input");
    merchPriceInput.type = "number";
    merchPriceInput.id = "merch-price";
    merchPriceInput.placeholder = "Price";
    merchPriceInput.required = true;

    const merchStockInput = document.createElement("input");
    merchStockInput.type = "number";
    merchStockInput.id = "merch-stock";
    merchStockInput.placeholder = "Stock Available";
    merchStockInput.required = true;

    const merchImageInput = document.createElement("input");
    merchImageInput.type = "file";
    merchImageInput.id = "merch-image";
    merchImageInput.accept = "image/*";

    const addButton = document.createElement("button");
    addButton.id = "add-merch-btn";
    addButton.textContent = "Add Merchandise";
    addButton.addEventListener("click", () => addMerchandise(eventId));

    const cancelButton = document.createElement("button");
    cancelButton.id = "cancel-merch-btn";
    cancelButton.textContent = "Cancel";
    cancelButton.addEventListener("click", clearMerchForm);

    editEventDiv.append(heading, merchNameInput, merchPriceInput, merchStockInput, merchImageInput, addButton, cancelButton);
}

function displayNewMerchandise(merchData) {
    const merchList = document.getElementById("merch-list");

    const merchItem = document.createElement("div");
    merchItem.className = "merch-item";

    const merchName = document.createElement("h3");
    merchName.textContent = merchData.name;

    const merchPrice = document.createElement("p");
    merchPrice.textContent = `Price: $${(merchData.price / 100).toFixed(2)}`;

    const merchStock = document.createElement("p");
    merchStock.textContent = `Available: ${merchData.stock}`;

    merchItem.append(merchName, merchPrice, merchStock);

    if (merchData.merch_pic) {
        const merchImage = document.createElement("img");
        merchImage.src = `/merchpic/${merchData.merch_pic}`;
        merchImage.alt = merchData.name;
        merchImage.style.maxWidth = "160px";
        merchItem.appendChild(merchImage);
    }

    merchList.prepend(merchItem);
}


// Updated displayMerchandise function
async function displayMerchandise(merchData, eventId, isCreator, isLoggedIn) {
    const merchList = document.getElementById("merch-list");
    merchList.textContent = ""; // Clear previous content

    if (isCreator) {
        const button = Button("Add Merchandise", "add-merch-btn", {
            click: () => addMerchForm(eventId),
            mouseenter: () => console.log("Button hovered"),
        });

        merchList.appendChild(button);
    }

    if (!Array.isArray(merchData)) {
        const errorMessage = document.createElement("li");
        errorMessage.textContent = "Invalid merchandise data received.";
        merchList.appendChild(errorMessage);
        return;
    }

    if (merchData.length === 0) {
        const noMerchMessage = document.createElement("li");
        noMerchMessage.textContent = "No merchandise available for this event.";
        merchList.appendChild(noMerchMessage);
        return;
    }

    merchData.forEach(merch => {
        const card = MerchCard({
            name: merch.name,
            price: merch.price,
            image: `/merchpic/${merch.merch_pic}`,
            stock: merch.stock,
            isCreator: isCreator,
            isLoggedIn: isLoggedIn,
            onBuy: (quantity) => buyMerch(merch.merchid, eventId, quantity),
            onEdit: () => editMerchForm(merch.merchid, eventId),
            onDelete: () => deleteMerch(merch.merchid, eventId),
        });

        merchList.appendChild(card);
    });
}

// async function displayMerchandise(merchData, eventId, creatorid) {
//     const merchList = document.getElementById("merch-list");
//     merchList.textContent = ""; // Clear previous content

//     if (!Array.isArray(merchData)) {
//         const errorMessage = document.createElement("li");
//         errorMessage.textContent = "Invalid merchandise data received.";
//         merchList.appendChild(errorMessage);
//         return;
//     }

//     if (merchData.length === 0) {
//         const noMerchMessage = document.createElement("li");
//         noMerchMessage.textContent = "No merchandise available for this event.";
//         merchList.appendChild(noMerchMessage);
//         return;
//     }

//     merchData.forEach(merch => {
//         const merchItem = document.createElement("li");
//         merchItem.className = "merch-item";

//         const merchImage = document.createElement("img");
//         merchImage.src = `/merchpic/${merch.merch_pic}`;
//         merchImage.alt = merch.name;
//         merchImage.className = "merch-img";

//         const merchDetails = document.createElement("span");
//         merchDetails.className = "merch-details";
//         merchDetails.innerHTML = `Name: ${merch.name} <br>Price: $${(merch.price / 100).toFixed(2)}
//                                   <br>(Available: ${merch.stock})`;

//         const merchActions = document.createElement("div");
//         merchActions.className = "merch-actions";

//         if (state.token) {
//             if (state.user === creatorid) {
//                 const editButton = document.createElement("button");
//                 editButton.className = "edit-merch-btn";
//                 editButton.dataset.merchid = merch.merchid;
//                 editButton.textContent = "Edit";
//                 editButton.addEventListener("click", () => editMerchForm(merch.merchid, eventId));

//                 const deleteButton = document.createElement("button");
//                 deleteButton.className = "delete-merch-btn";
//                 deleteButton.dataset.merchid = merch.merchid;
//                 deleteButton.textContent = "Delete";
//                 deleteButton.addEventListener("click", () => deleteMerch(merch.merchid, eventId));

//                 merchActions.append(editButton, deleteButton);
//             } else {
//                 const quantityLabel = document.createElement("label");
//                 quantityLabel.setAttribute("for", `quantity-${merch.merchid}`);
//                 quantityLabel.textContent = "Quantity:";

//                 const quantityInput = document.createElement("input");
//                 quantityInput.type = "number";
//                 quantityInput.id = `quantity-${merch.merchid}`;
//                 quantityInput.className = "merch-quantity-input";
//                 quantityInput.min = 1;
//                 quantityInput.max = 6;
//                 quantityInput.value = 1;

//                 const buyButton = document.createElement("button");
//                 buyButton.className = "buy-merch-btn";
//                 buyButton.dataset.merchid = merch.merchid;
//                 buyButton.textContent = "Buy";
//                 buyButton.addEventListener("click", () => buyMerch(merch.merchid, eventId));

//                 merchActions.append(quantityLabel, quantityInput, buyButton);
//             }
//         }

//         merchItem.append(merchImage, merchDetails, merchActions);
//         merchList.appendChild(merchItem);
//     });
// }


export { addMerchForm, addMerchandise, displayNewMerchandise, clearMerchForm, displayMerchandise, buyMerch, deleteMerch, editMerchForm };