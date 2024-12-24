import { state } from "../../state/state.js";
import { apiFetch } from "../../api/api.js";
import { navigate } from "../../routes/index.js";
import Snackbar from '../../components/ui/Snackbar.mjs';
import VideoPlayer from '../../components/ui/VideoPlayer.mjs';
import AudioPlayer from '../../components/ui/AudioPlayer.mjs';
// import Sightbox from "../../components/ui/Sightbox.mjs";
// import { Vidplayer } from "../../utils/vidplayer.js";


async function displayFeed(feedsec) {
    if (!state.token) {
        navigate('/login');
        return;
    }

    // let feedsec = document.getElementById("feed-section");
    feedsec.appendChild(generateFeedHTML());
    // feedsec.innerHTML = generateFeedHTML();

    // Set up event listeners for post creation and media upload
    setupPostCreation();
    fetchFeed();

    // var sightbox = Sightbox("http://localhost:5173/uploads/K%EC%97%AC%EA%B3%A0%EC%83%9D%20%EB%BB%98%EC%A7%93.mp4",'video');
    // feedsec.appendChild(sightbox);
    
    // feedsec.appendChild(generateVideoPlayer());
    // Vidplayer();
}

// Function to set up event listeners for post creation and media upload
function setupPostCreation() {
    const postButton = document.getElementById("postButton");
    const imageUpload = document.getElementById("imageUpload");
    const videoUpload = document.getElementById("videoUpload");
    const mediaPreview = document.getElementById("mediaPreview");
    const postTypeSelector = document.getElementById("postType");

    let uploadedImages = []; // Track uploaded image URLs to prevent duplicates

    // Change media input based on post type
    postTypeSelector.addEventListener('change', (e) => handlePostTypeChange(e, imageUpload, videoUpload, mediaPreview));

    postButton.addEventListener('click', () => handlePostButtonClick(postTypeSelector, mediaPreview, imageUpload, videoUpload, uploadedImages));

    // Handle media file previews
    imageUpload.addEventListener('change', (event) => handleMediaFileChange(event, imageUpload, mediaPreview, uploadedImages, 'image'));
    videoUpload.addEventListener('change', (event) => handleMediaFileChange(event, videoUpload, mediaPreview, uploadedImages, 'video'));

    // Allow image paste into the media preview area
    mediaPreview.addEventListener('paste', (event) => handleImagePaste(event, imageUpload, uploadedImages));
}

// Function to handle post type change
function handlePostTypeChange(event, imageUpload, videoUpload, mediaPreview) {
    const type = event.target.value;
    imageUpload.style.display = type === 'image' ? 'block' : 'none';
    videoUpload.style.display = type === 'video' ? 'block' : 'none';
    mediaPreview.innerHTML = ''; // Clear preview when changing type
}

// Function to handle the post button click
function handlePostButtonClick(postTypeSelector, mediaPreview, imageUpload, videoUpload, uploadedImages) {
    const content = "";
    const selectedType = postTypeSelector.value;

    // Only proceed if there's content or media
    if (content || mediaPreview.querySelector('img') || mediaPreview.querySelector('video')) {
        let files = [];
        if (selectedType === 'image') {
            files = Array.from(imageUpload.files);
        } else if (selectedType === 'video') {
            files = Array.from(videoUpload.files);
        }
        addPost(selectedType, content, files);
    }
}

// Function to handle media file change (image/video)
function handleMediaFileChange(event, uploadElement, mediaPreview, uploadedImages, mediaType) {
    Array.from(event.target.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const mediaSrc = e.target.result;

            // Check for duplicates
            if (uploadedImages.includes(mediaSrc)) {
                alert(`This ${mediaType} has already been uploaded.`);
                return;
            }

            const mediaElement = createMediaElement(mediaSrc, mediaType);
            const mediaWrapper = createMediaWrapper(mediaElement, mediaType);

            mediaPreview.appendChild(mediaWrapper);
            uploadedImages.push(mediaSrc);
        };
        reader.readAsDataURL(file);
    });
}

// Function to create media element (image/video)
function createMediaElement(src, type) {
    let mediaElement;
    if (type === 'image') {
        mediaElement = new Image();
        mediaElement.src = src;
    } else if (type === 'video') {
        mediaElement = document.createElement('video');
        mediaElement.src = src;
        mediaElement.controls = true;
    }
    return mediaElement;
}

// Function to create a media wrapper (with remove button)
function createMediaWrapper(mediaElement, mediaType) {
    const wrapper = document.createElement('div');
    wrapper.classList.add('media-preview-item');

    const removeButton = document.createElement('button');
    removeButton.textContent = 'R';
    removeButton.classList.add('remove-btn');
    removeButton.addEventListener('click', () => handleRemoveMedia(wrapper, mediaElement, mediaType));

    wrapper.appendChild(mediaElement);
    wrapper.appendChild(removeButton);
    return wrapper;
}

// Function to handle removing a media item
function handleRemoveMedia(wrapper, mediaElement, mediaType) {
    wrapper.remove();
    uploadedImages = uploadedImages.filter(image => image !== mediaElement.src);

    // Handle file removal from input
    removeFileFromInput(mediaType === 'image' ? imageUpload : videoUpload, mediaElement);
}

// Function to handle pasting images into the media preview area
function handleImagePaste(event, imageUpload, uploadedImages) {
    const clipboardData = event.clipboardData;
    const items = clipboardData.items;

    for (let i = 0; i < items.length; i++) {
        const item = items[i];

        if (item.type.indexOf('image') === 0) {
            const blob = item.getAsFile();
            const reader = new FileReader();

            reader.onload = (e) => {
                const imgSrc = e.target.result;

                // Prevent duplicate image paste
                if (uploadedImages.includes(imgSrc)) {
                    alert("This image has already been uploaded.");
                    return;
                }

                const img = new Image();
                img.src = imgSrc;

                // Create a wrapper for the image and a remove button
                const imgWrapper = createMediaWrapper(img, 'image');

                // Add image to the uploaded images tracker
                uploadedImages.push(imgSrc);

                // Convert base64 image to File object and add to FormData (for saving)
                const byteCharacters = atob(imgSrc.split(',')[1]);
                const byteArray = new Uint8Array(byteCharacters.length);

                for (let i = 0; i < byteCharacters.length; i++) {
                    byteArray[i] = byteCharacters.charCodeAt(i);
                }

                const file = new File([byteArray], "pasted-image.png", { type: 'image/png' });

                // Append the file to the image input for upload
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                imageUpload.files = dataTransfer.files;
            };

            reader.readAsDataURL(blob);
            event.preventDefault(); // Prevent default paste handling
        }
    }
}

// Helper function to remove the file from the file input list
function removeFileFromInput(inputElement, fileToRemove) {
    const fileList = Array.from(inputElement.files);
    const index = fileList.indexOf(fileToRemove);

    if (index !== -1) {
        fileList.splice(index, 1);  // Remove the file from the list
        // Recreate the FileList and update the input element
        const dataTransfer = new DataTransfer();
        fileList.forEach(file => dataTransfer.items.add(file));
        inputElement.files = dataTransfer.files;
    }
}

// Function to add a new post via API and update the feed
async function addPost(type, content, files) {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('text', content);

    files.forEach(file => formData.append(type === 'image' ? 'images' : 'videos', file));

    try {
        const data = await apiFetch('/post', 'POST', formData);
        if (data.ok) {
            renderNewPost(data.data, 0);  // Render the newly posted content
            clearPostForm();             // Clear the post form
        } else {
            alert('Failed to post');
        }
    } catch (error) {
        console.error('Error posting:', error);
        alert('There was an error posting your content.');
    }
}

// Function to clear the post creation form
function clearPostForm() {
    document.getElementById("mediaPreview").innerHTML = '';
    document.getElementById("imageUpload").value = '';
    document.getElementById("videoUpload").value = '';
}


// Function to delete a post
async function deletePost(postId) {
    if (!state.token) {
        Snackbar("Please log in to delete your post.", 3000);
        return;
    }

    if (confirm("Are you sure you want to delete this post?")) {
        try {
            await apiFetch(`/post/${postId}`, 'DELETE');
            Snackbar("Post deleted successfully.", 3000);
            fetchFeed(); // Refresh the feed after deleting
        } catch (error) {
            Snackbar(`Error deleting post: ${error.message}`, 3000);
        }
    }
}

// Function to fetch posts from the backend and render them
async function fetchFeed() {
    const postsContainer = document.getElementById("postsContainer");
    postsContainer.innerHTML = '<p>Loading posts...</p>';

    try {
        const data = await apiFetch('/feed');
        if (!data.ok || !Array.isArray(data.data)) {
            throw new Error("Invalid data received from the server");
        }

        // Sort posts by timestamp (latest first)
        const sortedPosts = data.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Clear the container before rendering
        postsContainer.innerHTML = '';

        // Render each post in sorted order
        sortedPosts.forEach(renderNewPost);
    } catch (error) {
        postsContainer.innerHTML = `<p>Error loading posts: ${error.message}</p>`;
    }
}

function renderNewPost(post, i) {
    const postsContainer = document.getElementById("postsContainer");
    const media = Array.isArray(post.media) ? post.media : [];
    const isLoggedIn = state.token;
    const isCreator = isLoggedIn && state.user === post.userid;

    // Append the Lightbox HTML only once
    if (!document.getElementById("lightbox")) {
        postsContainer.insertAdjacentHTML('beforebegin', `
            <div id="lightbox" class="lightbox" style="display: none;">
                <span id="lightbox-close" class="close">&times;</span>
                <div class="lightbox-content">
                    <img id="lightbox-image" src="" alt="Lightbox Image" />
                    <div id="lightbox-caption" class="lightbox-caption"></div>
                </div>
                <button id="lightbox-prev" class="prev">❮</button>
                <button id="lightbox-next" class="next">❯</button>
            </div>
        `);

        // Attach lightbox navigation and close events
        document.getElementById("lightbox-close").addEventListener("click", closesLightbox);
        document.getElementById("lightbox-prev").addEventListener("click", () => changesImage(-1));
        document.getElementById("lightbox-next").addEventListener("click", () => changesImage(1));
    }

    // Create the post element
    const postElement = document.createElement('article');
    postElement.classList.add('timeline-item');
    postElement.setAttribute('date-is', new Date(post.timestamp).toLocaleString());

    // Post header
    postElement.innerHTML = `
        <div class="post-header hflex">
            <a class="uzthcon" href="/user/${post.username}">
                <img src="/userpic/thumb/${post.userid + ".jpg" || 'default.png'}" alt="Profile Picture" class="profile-thumb" />
            </a>
            <div class="usertim">
            <div class="username">${post.username}</div>
            </div>
        </div>
    `;

    // Handle text posts
    if (post.type === "text") {
        postElement.innerHTML += `<div class="post-text">${post.text}</div>`;
    }

    // Handle audio posts
    if (post.type === "audio") {
        postElement.innerHTML += `<div class="post-text">${post.text}</div>`;

        const audio = AudioPlayer({
            src: '#',
        });

        postElement.appendChild(audio);
    }

    // Handle image posts
    if (post.type === "image" && media.length > 0) {
        const mediaClasses = [
            'PostPreviewImageView_-one__-6MMx',
            'PostPreviewImageView_-two__WP8GL',
            'PostPreviewImageView_-three__HLsVN',
            'PostPreviewImageView_-four__fYIRN',
            'PostPreviewImageView_-five__RZvWx',
            'PostPreviewImageView_-six__EG45r',
            'PostPreviewImageView_-seven__65gnj',
            'PostPreviewImageView_-eight__SoycA'
        ];

        const classIndex = Math.min(media.length - 1, mediaClasses.length - 1);
        const assignedClass = mediaClasses[classIndex];

        const imageList = document.createElement('ul');
        imageList.className = `preview_image_wrap__Q29V8 PostPreviewImageView_-artist__WkyUA PostPreviewImageView_-bottom_radius__Mmn-- ${assignedClass}`;
        media.forEach((img, index) => {
            const listItem = document.createElement('li');
            listItem.className = 'PostPreviewImageView_image_item__dzD2P';

            const image = document.createElement('img');
            image.src = `${img}`;
            // image.src = `./postpic/${img}.jpg`;
            image.alt = "Post Image";
            image.className = 'post-image PostPreviewImageView_post_image__zLzXH';
            image.addEventListener("click", () => opensLightbox(img, media.length, index, media));

            listItem.appendChild(image);
            imageList.appendChild(listItem);
        });

        const mediaContainer = document.createElement('div');
        mediaContainer.className = 'post-media';
        mediaContainer.appendChild(imageList);

        postElement.appendChild(mediaContainer);
    }

    // Handle video posts
    if (post.type === "video" && media.length > 0) {
        const mediaContainer = document.createElement('div');
        mediaContainer.className = 'post-media';

        // media.forEach(videoSrc => {
        //     const video = document.createElement('video');
        //     video.src = videoSrc;
        //     video.className = 'post-video';
        //     video.addEventListener("click", () => {
        //         video.paused ? video.play() : video.pause();
        //     });

        //     mediaContainer.appendChild(video);
        // });

        media.forEach(videoSrc => {
            const videox = VideoPlayer({
                src: videoSrc,
                className: 'post-video',
                muted: true,
                poster: '',
                controls: false,
            });

            mediaContainer.appendChild(videox);
        });
        postElement.appendChild(mediaContainer);
    }

    // Actions
    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'post-actions';

    if (isLoggedIn) {
        const likeButton = document.createElement('span');
        likeButton.className = 'like';
        likeButton.textContent = `Like (${post.likes})`;

        const commentButton = document.createElement('span');
        commentButton.className = 'comment';
        commentButton.textContent = "Comment";

        actionsContainer.appendChild(likeButton);
        actionsContainer.appendChild(commentButton);

        if (isCreator) {
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-btn';
            deleteButton.textContent = "Delete";
            deleteButton.addEventListener("click", () => deletePost(post.id));

            actionsContainer.appendChild(deleteButton);
        }
    }

    postElement.appendChild(actionsContainer);

    // Append the post
    i ? postsContainer.appendChild(postElement) : postsContainer.prepend(postElement);

    after();
}


function after() {
    document.querySelectorAll('.timeline-item').forEach(item => {
        // Find the src of the profile image inside the item
        const profileImg = item.querySelector('.profile-thumb').src;
        // Add a custom CSS variable to the element
        item.style.setProperty('--after-bg', `url(${profileImg})`);
    });

    // Update the CSS to use the custom property
    const style = document.createElement('style');
    style.textContent = `
        .timeline-item::after {
          background-image: var(--after-bg);
        }
      `;
    document.head.appendChild(style);
}



// Open Lightbox with the clicked image
function opensLightbox(image, totalImages, postIndex, media) {
    const lightbox = document.getElementById("lightbox");
    const lightboxImage = document.getElementById("lightbox-image");
    const lightboxCaption = document.getElementById("lightbox-caption");

    // Show the lightbox
    lightbox.style.display = "flex";

    // Set the lightbox image and caption
    lightboxImage.src = `./postpic/${image}.jpg`;
    lightboxCaption.innerHTML = `Image ${postIndex + 1} of ${totalImages}`;
    currentImageIndex = postIndex;
    totalImagesInLightbox = totalImages;

    // Attach the media array for navigation
    lightbox.dataset.media = JSON.stringify(media);
}

// Close the Lightbox
function closesLightbox() {
    const lightbox = document.getElementById("lightbox");
    lightbox.style.display = "none"; // Hide the lightbox
}

// Navigate through images in the lightbox
let currentImageIndex = 0;
let totalImagesInLightbox = 0;

function changesImage(direction) {
    const lightbox = document.getElementById("lightbox");
    const lightboxImage = document.getElementById("lightbox-image");
    const lightboxCaption = document.getElementById("lightbox-caption");

    // Parse the media array stored in the dataset
    const media = JSON.parse(lightbox.dataset.media || "[]");

    // Update the current image index
    currentImageIndex = (currentImageIndex + direction + totalImagesInLightbox) % totalImagesInLightbox;

    // Update the lightbox image and caption
    lightboxImage.src = `./postpic/${media[currentImageIndex]}.jpg`;
    lightboxCaption.innerHTML = `Image ${currentImageIndex + 1} of ${totalImagesInLightbox}`;
}


// function generateFeedHTML() {
//     return `
//         <div class="container">
//             <main class="feed">
//                 <div class="post-compose">
//                     <div class="post-header">
//                         <select id="postType" class="post-type-selector">
//                             <option value="text">Select Post Type</option>
//                             <option value="image">Image Post</option>
//                             <option value="video">Video Post</option>
//                         </select>
//                     </div>
//                     <div id="mediaUpload" class="media-upload">
//                         <input type="file" id="imageUpload" accept="image/*" multiple style="display: none;">
//                         <input type="file" id="videoUpload" accept="video/*" style="display: none;">
//                     </div>
//                     <div id="mediaPreview" class="media-preview hflex" contenteditable="true"></div>
//                     <button id="postButton" class="post-button">Post</button>
//                 </div>
//                 <div id="video-player">
//                 <video id="main-video" autoplay loop muted poster="#" preload="metadata">
//                   <source src="https://i.imgur.com/gackYaQ.mp4#t=0.01" type="video/mp4" />
//                   <source src="https://i.imgur.com/gackYaQ.gifv" type="video/webm" />
//                   Your browser does not support the video tag.
//                 </video>
//                 <div class="controls">
//                   <div class="progress-bar" id="progress-bar">
//                     <div class="progress" id="progress"></div>
//                   </div>
//                   <div class="buttons">
//                     <button id="slower">➖</button>
//                     <button id="reset-speed">⚌</button>
//                     <button id="faster">➕</button>
//                     <button id="mute">🔇</button>
//                     <button id="share">Share</button>
//                   </div>
//                 </div>
//               </div>

//                 <section id="postsContainer" class="container"></section>
//             </main>
//         </div>
//     `;
// }

function generateFeedHTML() {
    // Create the container div
    const container = document.createElement('div');
    container.className = 'container';

    // Create the main feed section
    const main = document.createElement('main');
    main.className = 'feed';

    // Create the post-compose div
    const postCompose = document.createElement('div');
    postCompose.className = 'post-compose';

    // Create the post header div with the select element
    const postHeader = document.createElement('div');
    postHeader.className = 'post-header';

    const postTypeSelector = document.createElement('select');
    postTypeSelector.id = 'postType';
    postTypeSelector.className = 'post-type-selector';

    const defaultOption = new Option('Select Post Type', 'text');
    const imageOption = new Option('Image Post', 'image');
    const videoOption = new Option('Video Post', 'video');

    postTypeSelector.add(defaultOption);
    postTypeSelector.add(imageOption);
    postTypeSelector.add(videoOption);

    postHeader.appendChild(postTypeSelector);

    // Create the media upload section
    const mediaUpload = document.createElement('div');
    mediaUpload.id = 'mediaUpload';
    mediaUpload.className = 'media-upload';

    const imageUpload = document.createElement('input');
    imageUpload.type = 'file';
    imageUpload.id = 'imageUpload';
    imageUpload.accept = 'image/*';
    imageUpload.multiple = true;
    imageUpload.style.display = 'none';

    const videoUpload = document.createElement('input');
    videoUpload.type = 'file';
    videoUpload.id = 'videoUpload';
    videoUpload.accept = 'video/*';
    videoUpload.style.display = 'none';

    mediaUpload.appendChild(imageUpload);
    mediaUpload.appendChild(videoUpload);

    // Create the media preview div
    const mediaPreview = document.createElement('div');
    mediaPreview.id = 'mediaPreview';
    mediaPreview.className = 'media-preview hflex';
    mediaPreview.contentEditable = 'true';

    // Create the post button
    const postButton = document.createElement('button');
    postButton.id = 'postButton';
    postButton.className = 'post-button';
    postButton.textContent = 'Post';

    // Assemble the post-compose section
    postCompose.appendChild(postHeader);
    postCompose.appendChild(mediaUpload);
    postCompose.appendChild(mediaPreview);
    postCompose.appendChild(postButton);

    // Create the posts container section
    const postsContainer = document.createElement('section');
    postsContainer.id = 'postsContainer';
    postsContainer.className = 'container';

    // Assemble the main section
    main.appendChild(postCompose);
    main.appendChild(postsContainer);

    // Add the main section to the container
    container.appendChild(main);

    // Append the container to the body or desired parent
    return container;
}



export { displayFeed, deletePost, opensLightbox, closesLightbox, changesImage, generateFeedHTML };