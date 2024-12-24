import { state } from "../../state/state.js";
import { apiFetch } from "../../api/api.js";
import Lightbox from '../../components/ui/Lightbox.mjs';
import MediaCard from '../../components/ui/MediaCard.mjs';
import { Button } from "../../components/base/Button.js";


// File validation function
function isValidFile(file) {
    const validTypes = ['image/jpeg', 'image/png', 'video/mp4'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
        showErrorMessage('Unsupported file type. Please upload a JPEG, PNG, or MP4 file.');
        return false;
    }

    if (file.size > maxSize) {
        showErrorMessage('File size exceeds 5MB. Please upload a smaller file.');
        return false;
    }

    return true;
}

// Function to show error messages
function showErrorMessage(message) {
    alert(message);  // You can replace this with your custom error handling UI
}

// Media upload preview function
function handleMediaPreview(file) {
    const reader = new FileReader();
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.createElement('progress');
    progressBar.max = 100;
    progressContainer.appendChild(progressBar);

    reader.onload = function (e) {
        const mediaType = file.type.startsWith('image/') ? 'image' : (file.type.startsWith('video/') ? 'video' : null);
        if (!mediaType) {
            alert("Unsupported file type");
            return;
        }

        const mediaItem = renderMediaItem({
            type: mediaType,
            url: e.target.result,
            description: 'Uploaded Media',
            name: file.name,
            size: (file.size / 1024).toFixed(2) // File size in KB
        });

        const mediaPreview = document.getElementById('mediaPreview');
        mediaPreview.innerHTML += mediaItem;

        // Add event listener for remove button
        const removeButton = mediaPreview.querySelector('.remove-button:last-of-type');
        removeButton.addEventListener('click', () => removeMediaPreview(removeButton));
    };

    reader.onprogress = function (event) {
        if (event.lengthComputable) {
            const percentComplete = (event.loaded / event.total) * 100;
            progressBar.value = percentComplete;
        }
    };

    reader.readAsDataURL(file);  // Read the file as a data URL (base64)
}

// Remove media preview
function removeMediaPreview(button) {
    const mediaPreview = document.getElementById('mediaPreview');
    mediaPreview.removeChild(button.parentElement);
}


// Main media upload function (uploads media and shows preview)
async function handleMediaUpload() {
    const input = document.getElementById('mediaInput');
    const files = input.files;
    const progressContainer = document.getElementById('progressContainer');

    progressContainer.innerHTML = ''; // Clear previous progress bars

    for (const file of files) {
        if (!isValidFile(file)) {
            continue; // Skip invalid files
        }

        handleMediaPreview(file);
    }

    input.value = ''; // Clear the input after upload
}


// Upload media to the server
async function uploadMedia(eventId) {
    const fileInput = document.getElementById("mediaFile");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a file to upload.");
        return;
    }

    const formData = new FormData();
    formData.append("media", file);

    try {
        // Upload media through the API
        const uploadResponse = await apiFetch(`/event/${eventId}/media`, "POST", formData);

        if (uploadResponse && uploadResponse.id) {  // Check if the response contains an 'id'
            alert("Media uploaded successfully!");
            displayNewMedia(uploadResponse);
        } else {
            alert(`Failed to upload media: ${uploadResponse?.message || 'Unknown error'}`);
        }

    } catch (error) {
        alert(`Error uploading media: ${error.message}`);
    }
}


async function deleteMedia(mediaId, eventId) {
    if (confirm('Are you sure you want to delete this media?')) {
        try {
            const response = await apiFetch(`/event/${eventId}/media/${mediaId}`, 'DELETE');

            if (response.ok) {  // Handle the 204 No Content status
                alert('Media deleted successfully!');
                // Optionally, refresh the media list or update the UI
                // displayEvent(eventId); // Uncomment if you have access to eventId
            } else {
                const errorData = await response.json();
                alert(`Failed to delete media: ${errorData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error deleting media:', error);
            alert('An error occurred while deleting the media.');
        }
    }
}

let mediaItems = []; // Ensure this is globally scoped

function renderMediaItem(media, index) {
    const mediaItem = document.createElement("div");
    mediaItem.className = "media-item";

    let mediaContent = "";
    if (media.type === "image") {
        mediaContent = `
            <figure>
                <img src="/uploads/${media.url}" 
                     alt="${media.caption || 'Media Image'}" 
                     class="media-img" 
                     data-index="${index}" />
                <figcaption>${media.caption || "No caption provided"}</figcaption>
            </figure>
        `;
    } else if (media.type === "video") {
        mediaContent = `
            <figure>
                <video class="media-video" controls>
                    <source src="/uploads/${media.url}" type="video/mp4" />
                </video>
                <figcaption>${media.caption || "No caption provided"}</figcaption>
            </figure>
        `;
    }

    mediaItem.innerHTML = mediaContent;
    return mediaItem;
}


async function displayEventMedia(mediaData, eventId, isLoggedIn) {
    const mediaList = document.getElementById("media-list");
    mediaList.innerHTML = "<p>Loading media...</p>"; // Show loading state

    if (!Array.isArray(mediaData)) throw new Error("Invalid media data received.");

    mediaList.innerHTML = ""; // Clear loading state

    if (isLoggedIn) {
        const button = Button("Add Media", "add-media-btn", {
            click: () => showMediaUploadForm(eventId),
            mouseenter: () => console.log("Button hovered"),
        });

        mediaList.appendChild(button);
    }

    if (mediaData.length > 0) {
        const mediaCards = []; // Array to store media card elements for Lightbox

        mediaData.forEach((media, index) => {
            const isCreator = state.token && state.user === media.creatorid;

            // Use MediaCard component to create the media card element
            const mediaCard = MediaCard({
                mediaType: media.type,
                src: `/uploads/${media.url}`,
                title: media.caption || "No caption provided",
                index: index,
            });


            if (isCreator) {
                const deleteButton = document.createElement("button");
                deleteButton.className = "delete-media-btn";
                deleteButton.textContent = "Delete";
                deleteButton.dataset.mediaId = media.id;
                deleteButton.dataset.eventId = eventId;

                deleteButton.addEventListener("click", async () => {
                    await deleteMedia(media.id, eventId);
                });

                mediaCard.appendChild(deleteButton);
            }

            // Append the card to the media list
            mediaList.appendChild(mediaCard);

            // Store the card's image source for Lightbox
            if (media.type === 'image') {
                mediaCards.push(`/uploads/${media.url}`);
            }
        });

        // Add event listeners for images for Lightbox functionality
        const mediaImages = mediaList.querySelectorAll('.media-image');
        mediaImages.forEach((img, index) => {
            img.addEventListener('click', () => {
                Lightbox(mediaCards, index);
            });
        });
    } else {
        const noMediaMessage = document.createElement("p");
        noMediaMessage.textContent = "No media available for this event.";
        mediaList.appendChild(noMediaMessage);
    }
}



function addMediaEventListeners() {

    // Event delegation for upload button
    document.addEventListener("click", (event) => {
        const target = event.target;

        if (target.id === "uploadMediaBtn") {
            const eventId = target.getAttribute("data-event-id");
            uploadMedia(eventId);
        }
    });

}


// Show media upload form
function showMediaUploadForm(eventId) {
    const mediaList = document.getElementById("editevent");
    mediaList.textContent = "";

    const div = document.createElement("div");
    div.setAttribute("id", "mediaform");

    const title = document.createElement("h3");
    title.textContent = "Upload Event Media";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.id = "mediaFile";
    fileInput.accept = "image/*,video/*";

    const previewDiv = document.createElement("div");
    previewDiv.id = "mediaPreview";

    const button = Button("Upload", "uploadMediaBtn", {
        click: () => uploadMedia(eventId),
    });

    div.appendChild(title);
    div.appendChild(fileInput);
    div.appendChild(previewDiv);
    div.appendChild(button);


    mediaList.prepend(div);
}

// Display newly uploaded media in the list
function displayNewMedia(mediaData) {
    const mediaList = document.getElementById("media-list");
    const isCreator = state.user && state.user === mediaData.creatorid;

    const mediaItem = document.createElement("div");
    mediaItem.className = "imgcon";

    let mediaContent = "";

    // Render image or video depending on media type
    if (mediaData.type === "image") {
        mediaContent = `
            <img src="/uploads/${mediaData.url}" alt="${mediaData.caption || "Media"}" 
                class="media-img" data-index="${mediaItems.length}" 
                style="max-width: 160px; max-height: 240px; height: auto; width: auto;" />
        `;
    } else if (mediaData.type === "video") {
        mediaContent = `
            <video controls style="max-width: 160px; max-height: 240px;">
                <source src="/uploads/${mediaData.url}" type="video/mp4" />
                Your browser does not support the video tag.
            </video>
        `;
    }

    mediaItem.innerHTML = `
        <h3>${mediaData.caption || "No caption provided"}</h3>
        ${mediaContent}
        ${isCreator ? `
            <button class="delete-media-btn" data-media-id="${mediaData.id}" data-event-id="${mediaData.eventid}">Delete</button>
        ` : ""}
    `;

    mediaList.appendChild(mediaItem); // Append the new media item to the list
    mediaItems.push(mediaData); // Add the new media to the global mediaItems array
}

export { displayEventMedia, isValidFile, showErrorMessage, handleMediaPreview, removeMediaPreview, renderMediaItem, showMediaUploadForm, handleMediaUpload, uploadMedia, displayNewMedia, deleteMedia, addMediaEventListeners };
