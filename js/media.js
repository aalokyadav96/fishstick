import { state } from "./state.js";
import { apiFetch } from "./api.js";

let mediaItems = []; // Ensure this is globally scoped

// // Function to display media for the event
// async function displayEventMedia(mediaData, eventId) {
//     const mediaList = document.getElementById("media-list");
//     mediaList.innerHTML = "<p>Loading media...</p>";  // Show loading state
//     try {
//         if (!Array.isArray(mediaData)) throw new Error("Invalid media data received.");

//         mediaItems = mediaData; // Store the media items for lightbox navigation
//         mediaList.innerHTML = ""; // Clear loading state

//         if (mediaData.length > 0) {
//             mediaData.forEach((media, index) => {
//                 const isCreator = state.token && state.user === media.creatorid;
//                 const mediaItem = document.createElement("div");
//                 mediaItem.className = 'imgcon';
//                 mediaItem.innerHTML = `
//                     <h3>${media.caption || "No caption provided"}</h3>
//                     <img src="/uploads/${media.url}" alt="${media.caption || "Media"}" class="media-img" onclick="openLightbox(${index})"/>
//                     ${isCreator ? `
//                         <button class="delete-media-btn" onclick="deleteMedia('${media.id}', '${eventId}')">Delete</button>
//                     ` : ``}
//                 `;
//                 mediaList.appendChild(mediaItem);
//             });
//         } else {
//             mediaList.innerHTML = `<p>No media available for this event.</p>`;
//         }
//     } catch (error) {
//         mediaList.innerHTML = `<p>Error loading media: ${error.message}</p>`;
//     }
// }

// Function to display media for the event
async function displayEventMedia(mediaData, eventId) {
    const mediaList = document.getElementById("media-list");
    mediaList.innerHTML = "<p>Loading media...</p>";  // Show loading state

    try {
        if (!Array.isArray(mediaData)) throw new Error("Invalid media data received.");

        mediaItems = mediaData; // Store the media items for lightbox navigation
        mediaList.innerHTML = ""; // Clear loading state

        if (mediaData.length > 0) {
            mediaData.forEach((media, index) => {
                const isCreator = state.token && state.user === media.creatorid;

                const mediaItem = document.createElement("div");
                mediaItem.className = 'media-item'; // Changed class name for clarity

                // Use more semantic HTML (e.g., <figure> and <figcaption> for image with caption)
                mediaItem.innerHTML = `
                    <div class="media-content">
                        <figure>
                            <img src="/uploads/${media.url}" alt="${media.caption || 'Media Image'}" class="media-img" onclick="openLightbox(${index})" />
                            <figcaption>
                                <h3>${media.caption || "No caption provided"}</h3>
                            </figcaption>
                        </figure>
                    </div>
                    ${isCreator ? `
                        <div class="media-actions">
                            <button class="delete-media-btn" onclick="deleteMedia('${media.id}', '${eventId}')">Delete</button>
                        </div>
                    ` : ""}
                `;
                mediaList.appendChild(mediaItem);
            });
        } else {
            mediaList.innerHTML = `<p>No media available for this event.</p>`;
        }
    } catch (error) {
        mediaList.innerHTML = `<p>Error loading media: ${error.message}</p>`;
    }
}


let currentIndex = 0;


function openLightbox(index) {
    if (index < 0 || index >= mediaItems.length) return; // Prevent out-of-bounds access

    currentIndex = index;
    const lightbox = document.getElementById("lightbox");
    const lightboxImage = document.getElementById("lightbox-image");
    const lightboxCaption = document.getElementById("lightbox-caption");

    lightboxImage.src = `/uploads/${mediaItems[currentIndex].url}`;
    lightboxCaption.innerText = mediaItems[currentIndex].caption;
    lightbox.style.display = "flex";
}

function changeImage(direction) {
    currentIndex += direction;
    if (currentIndex < 0) {
        currentIndex = mediaItems.length - 1; // wrap around to last image
    } else if (currentIndex >= mediaItems.length) {
        currentIndex = 0; // wrap around to first image
    }

    const lightboxImage = document.getElementById("lightbox-image");
    const lightboxCaption = document.getElementById("lightbox-caption");

    lightboxImage.src = `/uploads/${mediaItems[currentIndex].url}`;
    lightboxCaption.innerText = mediaItems[currentIndex].caption;
}


// Close lightbox
function closeLightbox() {
    const lightbox = document.getElementById("lightbox");
    lightbox.style.display = "none";
}



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
        const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
        const mediaItem = renderMediaItem({
            type: mediaType,
            url: e.target.result,
            description: 'Uploaded Media',
            name: file.name,
            size: (file.size / 1024).toFixed(2)
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

    reader.readAsDataURL(file);
}

// Remove media preview
function removeMediaPreview(button) {
    const mediaPreview = document.getElementById('mediaPreview');
    mediaPreview.removeChild(button.parentElement);
}

// Render media preview item
function renderMediaItem(mediaData) {
    return `
        <div class="media-item">
            <h3>${mediaData.description}</h3>
            <${mediaData.type} src="${mediaData.url}" alt="${mediaData.name}" 
                style="max-width: 160px; max-height: 240px; height: auto; width: auto;" />
            <button class="remove-button">Remove</button>
        </div>
    `;
}

// Show media upload form
function showMediaUploadForm(eventId) {
    const mediaList = document.getElementById("editevent");
    mediaList.innerHTML = "";
    const div = document.createElement("div");
    div.setAttribute('id', 'mediaform');
    div.innerHTML = `
    <h3>Upload Event Media</h3>
    <input type="file" id="mediaFile" accept="image/*,video/*" />
    <button onclick="uploadMedia('${eventId}')">Upload</button>
    `;
    mediaList.prepend(div);
}

// Main media upload function (uploads media and shows preview)
async function handleMediaUpload() {
    const input = document.getElementById('mediaInput');
    const files = input.files;
    const mediaPreview = document.getElementById('mediaPreview');
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

// Display newly uploaded media in the list
function displayNewMedia(mediaData) {
    const mediaList = document.getElementById("media-list");
    const isCreator = state.user && state.user === mediaData.creatorid;

    const mediaItem = document.createElement("div");
    mediaItem.className = 'imgcon';
    mediaItem.innerHTML = `
        <h3>${mediaData.caption || "No caption provided"}</h3>
        <img src="/uploads/${mediaData.url}" alt="${mediaData.caption || "Media"}" 
             style="max-width: 160px; max-height: 240px; height: auto; width: auto;" 
             onclick="openLightbox(${mediaItems.length})"/>
        ${isCreator ? `
            <button class="delete-media-btn" onclick="deleteMedia('${mediaData.id}', '${mediaData.eventid}')">Delete</button>
        ` : ``}
    `;

    mediaList.appendChild(mediaItem);  // Append the new media item to the list
    mediaItems.push(mediaData);  // Add the new media to the global mediaItems array
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



export {displayEventMedia, openLightbox, changeImage, closeLightbox, isValidFile, showErrorMessage, handleMediaPreview, removeMediaPreview, renderMediaItem, showMediaUploadForm, handleMediaUpload, uploadMedia, displayNewMedia, deleteMedia};