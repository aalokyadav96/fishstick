import { API_URL, state } from "../../state/state.js";
import { apiFetch } from "../../api/api.js";
import { handleError } from "../../utils/utils.js";
import Snackbar from '../../components/ui/Snackbar.mjs';
import { renderPage, navigate } from "../../routes/index.js";
import { logout } from "../../services/auth/authService.js";
import Sightbox from '../../components/ui/Sightbox.mjs';
import Modal from '../../components/ui/Modal.mjs';


// Fetch the profile either from localStorage or via an API request
async function fetchProfile() {
    // Try to get the profile from localStorage first
    const cachedProfile = localStorage.getItem("userProfile");

    // If cached profile is found, use it
    if (cachedProfile) {
        state.userProfile = JSON.parse(cachedProfile);
        return state.userProfile; // Return cached profile
    }

    // If there is no cached profile, fetch from the API
    if (state.token) {
        try {
            const response = await fetch(`${API_URL}/profile`, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${state.token}`,
                },
            });

            // Check if the response is OK
            if (response.ok) {
                const profile = await response.json();
                state.userProfile = profile;
                localStorage.setItem("userProfile", JSON.stringify(profile)); // Cache the profile in localStorage
                return profile; // Return the fetched profile
            } else {
                const errorData = await response.json();
                console.error(`Error fetching profile: ${response.status} - ${response.statusText}`, errorData);

                Snackbar(`Error fetching profile: ${errorData.error || 'Unknown error'}`, 3000);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);

            Snackbar("An unexpected error occurred while fetching the profile.", 3000);
        }
    } else {
        // If no token exists, assume user is not logged in and clear the profile
        state.userProfile = null;
    }

    return null; // Return null if no profile found
}

// Display the profile content in the profile section
async function displayProfile(content) {
    content.textContent = ""; // Clear existing content

    try {
        const profile = await fetchProfile();
        if (profile) {
            const profileElement = generateProfileElement(profile);
            console.log(profile);
            content.appendChild(profileElement);
            attachProfileEventListeners(content); // Attach event listeners for buttons
            // displayFollowSuggestions();
        } else {
            const loginMessage = document.createElement("p");
            loginMessage.textContent = "Please log in to see your profile.";
            profileSection.appendChild(loginMessage);
        }
    } catch (error) {
        const errorMessage = document.createElement("p");
        errorMessage.textContent = "Failed to load profile. Please try again later.";
        content.appendChild(errorMessage);
    }
}



function createImageField(label, id, currentSrc, previewId) {
    const imageGroup = document.createElement("div");
    imageGroup.classList.add("image-group");

    const labelElement = document.createElement("p");
    labelElement.textContent = `Current ${label}:`;

    const currentImg = document.createElement("img");
    currentImg.id = `current-${id}`;
    currentImg.src = currentSrc;
    currentImg.style.maxWidth = "200px";
    if (!currentSrc) currentImg.style.display = "none";

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.id = id;
    fileInput.accept = "image/*";
    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                const preview = document.getElementById(previewId);
                preview.src = reader.result;
                preview.style.display = "block";
            };
            reader.readAsDataURL(file);
        }
    });

    const previewImg = document.createElement("img");
    previewImg.id = previewId;
    previewImg.style.display = "none";
    previewImg.style.maxWidth = "200px";

    imageGroup.appendChild(labelElement);
    imageGroup.appendChild(currentImg);
    imageGroup.appendChild(fileInput);
    imageGroup.appendChild(previewImg);

    return imageGroup;
}

function createForm(content, fields, formId, buttonId, buttonText, onSubmit) {
    const form = document.createElement("form");
    form.id = formId;

    fields.forEach(field => {
        const imageField = createImageField(field.label, field.id, field.currentSrc, field.previewId);
        form.appendChild(imageField);
    });

    const submitButton = document.createElement("button");
    submitButton.type = "button";
    submitButton.id = buttonId;
    submitButton.textContent = buttonText;
    submitButton.addEventListener("click", onSubmit);

    form.appendChild(submitButton);
    content.appendChild(form);
    return content;
}

function generateBannerForm(content, username) {
    const bannerPictureSrc = `/userpic/banner/${username + '.jpg'}`;
    const fields = [
        {
            label: "Banner Picture",
            id: "edit-banner-picture",
            currentSrc: bannerPictureSrc,
            previewId: "banner-picture-preview",
        },
    ];
    return createForm(content, fields, "edit-banner-form", "update-banner-pics-btn", "Update Banner Pics", () => {
        const formData = new FormData(document.getElementById("edit-banner-form"));
        updateProfilePics('banner', formData);
    });
}

function generateDPForm(content, username) {
    const profilePictureSrc = `/userpic/${username + '.jpg'}`;
    const fields = [
        {
            label: "Profile Picture",
            id: "edit-dp-picture",
            currentSrc: profilePictureSrc,
            previewId: "profile-picture-preview",
        },
    ];
    return createForm(content, fields, "edit-dp-form", "update-dp-pics-btn", "Update Profile Pics", () => {
        const formData = new FormData(document.getElementById("edit-dp-form"));
        updateProfilePics('dp', formData);
    });
}

function generateProfileElement(profile) {
    const profileContainer = document.createElement("div");
    profileContainer.className = "profile-container hflex";

    const section = document.createElement("section");
    section.className = "channel";

    // Profile Picture and Background
    const bgImg = document.createElement("span");
    bgImg.className = "bg_img";
    bgImg.style.backgroundImage = `url(/userpic/banner/${profile.username + '.jpg'})`;
    bgImg.addEventListener('click', () => {
        // Open the Sightbox with an image when the button is clicked
        Sightbox(`/userpic/banner/${profile.username + '.jpg'}`, 'image');
    });

    const showEditButton = document.createElement('button');
    showEditButton.textContent = '';
    showEditButton.className = 'edit-banner-pic';
    showEditButton.addEventListener('click', () => {
        const content = document.createElement('div');
        const contentx = document.createElement('div');
        content.appendChild(generateBannerForm(contentx, profile.username));

        const modal = Modal({
            title: 'Example Modal',
            content,
            onClose: () => modal.remove(),
        });
    });

    section.appendChild(showEditButton);

    const profileArea = document.createElement("div");
    profileArea.className = "profile_area";

    const thumb = document.createElement("span");
    thumb.className = "thumb";

    const img = document.createElement("img");
    img.src = `/userpic/${profile.username + '.jpg'}`;
    img.alt = "Profile Picture";
    img.className = "imgful";
    thumb.appendChild(img);

    const showModalButton = document.createElement('button');
    showModalButton.textContent = '';
    showModalButton.className = 'edit-profile-pic';
    showModalButton.addEventListener('click', () => {
        const content = document.createElement('div');
        const contentx = document.createElement('div');
        content.appendChild(generateDPForm(contentx, profile.username));

        const modal = Modal({
            title: 'Example Modal',
            content,
            onClose: () => modal.remove(),
        });
    });

    profileArea.appendChild(showModalButton);
    profileArea.appendChild(thumb);

    thumb.addEventListener('click', () => {
        Sightbox(`/userpic/${profile.username + '.jpg'}`, 'image');
    });

    const profileDetails = document.createElement("div");
    profileDetails.className = "profile-details";

    const username = document.createElement("h2");
    username.className = "username";
    username.textContent = profile.username || "Not provided";

    const name = document.createElement("p");
    name.className = "name";
    name.textContent = profile.name || "";

    const email = document.createElement("p");
    email.className = "email";
    email.textContent = profile.email || "";

    const bio = document.createElement("p");
    bio.className = "bio";
    bio.textContent = profile.bio || "";

    const profileActions = document.createElement("div");
    profileActions.className = "profile-actions";

    const editButton = document.createElement("button");
    editButton.className = "btn edit-btn";
    editButton.dataset.action = "edit-profile";
    editButton.textContent = "Edit Profile";

    profileActions.appendChild(editButton);

    const profileInfo = document.createElement("div");
    profileInfo.className = "profile-info";

    const infoItems = [
        { label: "Last Login", value: formatDate(profile.last_login) || "Never logged in" },
        { label: "Account Status", value: profile.is_active ? "Active" : "Inactive" },
        { label: "Verification Status", value: profile.is_verified ? "Verified" : "Not Verified" },
    ];

    infoItems.forEach(item => {
        const infoItem = document.createElement("div");
        infoItem.className = "info-item";
        infoItem.innerHTML = `<strong>${item.label}:</strong> ${item.value}`;
        profileInfo.appendChild(infoItem);
    });

    profileDetails.append(username, name, email, bio, profileActions, profileInfo);

    const statistics = document.createElement("div");
    statistics.className = "statistics";

    const stats = [
        { label: "Posts", value: profile.profile_views || 0 },
        { label: "Followers", value: profile.followers?.length || 0 },
        { label: "Following", value: profile.follows?.length || 0 },
    ];

    stats.forEach(stat => {
        const statItem = document.createElement("p");
        statItem.className = "hflex";
        statItem.innerHTML = `<strong>${stat.value}</strong> ${stat.label}`;
        statistics.appendChild(statItem);
    });

    const followSuggestions = document.createElement("div");
    followSuggestions.id = "follow-suggestions";
    followSuggestions.className = "follow-suggestions";

    const deleteProfileButton = document.createElement("button");
    deleteProfileButton.className = "btn delete-btn";
    deleteProfileButton.dataset.action = "delete-profile";
    deleteProfileButton.textContent = "Delete Profile";

    const deleteActions = document.createElement("div");
    deleteActions.className = "profile-actions";
    deleteActions.appendChild(deleteProfileButton);

    section.append(bgImg, profileArea, profileDetails, statistics, followSuggestions, deleteActions);
    profileContainer.appendChild(section);

    return profileContainer;
}


// Generate the HTML content for the profile
function generateProfileHTML(profile) {
    return `
        <div class="profile-container hflex">    
            <section class="channel">
                <span class="bg_img" style="background-image:url(/userpic/${profile.profile_picture || 'default.png'});"></span>
                <div class="profile_area">
                    <span class="thumb">
                        <img src="/userpic/${profile.profile_picture || 'default.png'}" class="imgful" alt="Profile Picture"/>
                    </span>     
                </div> 
                <div class="profile-details">
                    <h2 class="username">${profile.username || 'Not provided'}</h2>
                    <p class="name">${profile.name || ''}</p>
                    <p class="email">${profile.email || ''}</p>
                    <p class="bio">${profile.bio || ''}</p>
                    <div class="profile-actions">
                        <button class="btn edit-btn" data-action="edit-profile">Edit Profile</button>
                    </div>
                    <div class="profile-info">
                        <div class="info-item"><strong>Last Login:</strong> ${formatDate(profile.last_login) || 'Never logged in'}</div>
                        <div class="info-item"><strong>Account Status:</strong> ${profile.is_active ? 'Active' : 'Inactive'}</div>
                        <div class="info-item"><strong>Verification Status:</strong> ${profile.is_verified ? 'Verified' : 'Not Verified'}</div>
                    </div>
                </div>
                <div class="statistics">
                    <p class="hflex"><strong>${profile.profile_views || 0}</strong> Posts</p>
                    <p class="hflex"><strong>${profile.followers?.length || 0}</strong> Followers</p>
                    <p class="hflex"><strong>${profile.follows?.length || 0}</strong> Following</p>
                </div>
                <div id="follow-suggestions" class="follow-suggestions"></div>
                <br>
                <div class="profile-actions">
                    <button class="btn delete-btn" data-action="delete-profile">Delete Profile</button>
                </div>
            </section>
        </div>
    `;
}

// Fetch the user profile
async function fetchUserProfile(username) {
    try {
        const data = await apiFetch(`/user/${username}`);
        return data?.is_following !== undefined ? data : null;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
}


function renderUserProfile(profile) {
    const profileContainer = document.createElement("div");
    profileContainer.className = "profile-container";

    // Profile Header
    const profileHeader = document.createElement("div");
    profileHeader.className = "profile-header";

    const profilePicture = document.createElement("img");
    profilePicture.className = "profile-picture";
    profilePicture.src = `/userpic/${profile.profile_picture || "default.png"}`;
    profilePicture.alt = "Profile Picture";

    const profileDetails = document.createElement("div");
    profileDetails.className = "profile-details";

    const username = document.createElement("h2");
    username.className = "username";
    username.textContent = profile.username || "Not provided";

    const name = document.createElement("p");
    name.className = "name";
    name.textContent = profile.name || "Not provided";

    const email = document.createElement("p");
    email.className = "email";
    email.textContent = profile.email || "Not provided";

    const bio = document.createElement("p");
    bio.className = "bio";
    bio.textContent = profile.bio || "No bio available.";

    profileDetails.append(username, name, email, bio);
    profileHeader.append(profilePicture, profileDetails);

    // Profile Stats
    const profileStats = document.createElement("div");
    profileStats.className = "profile-stats";

    const stats = [
        { label: "Followers", value: profile.followers?.length || 0 },
        { label: "Following", value: profile.follows?.length || 0 },
        { label: "Profile Views", value: profile.profile_views || 0 },
    ];

    stats.forEach(stat => {
        const statDiv = document.createElement("div");
        statDiv.className = "stat";
        statDiv.innerHTML = `<strong>${stat.label}:</strong> ${stat.value}`;
        profileStats.appendChild(statDiv);
    });

    // Profile Actions
    const profileActions = document.createElement("div");
    profileActions.className = "profile-actions";

    if (state.token && profile.userid !== state.user) {
        const followButton = document.createElement("button");
        followButton.className = "btn follow-button";
        followButton.dataset.action = "toggle-follow";
        followButton.dataset.userid = profile.userid;
        followButton.textContent = profile.isFollowing ? "Unfollow" : "Follow";

        profileActions.appendChild(followButton);
    }

    // Profile Info
    const profileInfo = document.createElement("div");
    profileInfo.className = "profile-info";

    const infoItems = [
        { label: "Phone Number", value: profile.phone_number || "Not provided" },
        { label: "Address", value: profile.address || "Not provided" },
        { label: "Date of Birth", value: formatDate(profile.date_of_birth) || "Not provided" },
        { label: "Last Login", value: formatDate(profile.last_login) || "Never logged in" },
        { label: "Account Status", value: profile.is_active ? "Active" : "Inactive" },
        { label: "Verification Status", value: profile.is_verified ? "Verified" : "Not Verified" },
    ];

    infoItems.forEach(item => {
        const infoItem = document.createElement("div");
        infoItem.className = "info-item";
        infoItem.innerHTML = `<strong>${item.label}:</strong> ${item.value}`;
        profileInfo.appendChild(infoItem);
    });

    profileContainer.append(profileHeader, profileStats, profileActions, profileInfo);
    return profileContainer;
}

async function displayUserProfile(username) {
    const content = document.getElementById("content");
    content.textContent = ""; // Clear existing content

    try {
        const userProfile = await fetchUserProfile(username);

        if (userProfile) {
            const profileElement = renderUserProfile(userProfile);
            content.appendChild(profileElement);
            attachUserProfileListeners(userProfile); // Attach relevant event listeners
        } else {
            const notFoundMessage = document.createElement("p");
            notFoundMessage.textContent = "User not found.";
            content.appendChild(notFoundMessage);
        }
    } catch (error) {
        const errorMessage = document.createElement("p");
        errorMessage.textContent = "Failed to load user profile. Please try again later.";
        content.appendChild(errorMessage);


        Snackbar("Error fetching user profile.", 3000);
    }
}

// Attach event listeners for the profile page
function attachProfileEventListeners() {
    const editButton = document.querySelector('[data-action="edit-profile"]');
    const deleteButton = document.querySelector('[data-action="delete-profile"]');

    if (editButton) {
        editButton.addEventListener("click", () => {
            editProfile(content);
        });
    }

    if (deleteButton) {
        deleteButton.addEventListener("click", () => {
            deleteProfile();
        });
    }
}

// Attach event listeners for user-specific profile actions
function attachUserProfileListeners(profile) {
    const followButton = document.querySelector(`[data-userid="${profile.userid}"]`);
    if (followButton) {
        followButton.addEventListener("click", () => {
            toggleFollow(profile.userid);
        });
    }
}

// Utility function to format dates
function formatDate(dateString) {
    return dateString ? new Date(dateString).toLocaleString() : null;
}



// Toggle follow/unfollow status for a user
async function toggleFollow(userId) {
    if (!state.token) {

        Snackbar("Please log in to follow users.", 3000);
        return;
    }

    try {
        const data = await apiFetch(`/follows/${userId}`, 'POST');
        const followButton = document.getElementById(`user-${userId}`);

        if (followButton) {
            followButton.textContent = data.isFollowing ? 'Unfollow' : 'Follow';
            followButton.onclick = () => toggleFollow(userId); // Update onclick handler
        }


        Snackbar(`You have ${data.isFollowing ? 'followed' : 'unfollowed'} the user.`, 3000);
    } catch (error) {
        console.error("Error toggling follow status:", error);

        Snackbar(`Failed to update follow status: ${error.message}`, 3000);
    }
}

async function displayFollowSuggestions() {
    const suggestionsSection = document.getElementById("follow-suggestions");
    suggestionsSection.textContent = ""; // Clear existing content

    try {
        const suggestions = await apiFetch('/follow/suggestions');

        if (suggestions && suggestions.length > 0) {
            const heading = document.createElement("h3");
            heading.textContent = "Suggested Users to Follow:";
            suggestionsSection.appendChild(heading);

            const suggestionsList = document.createElement("ul");
            suggestionsList.id = "suggestions-list";

            suggestions.forEach(user => {
                const listItem = document.createElement("li");
                listItem.textContent = user.username;

                const viewProfileButton = document.createElement("button");
                viewProfileButton.className = "view-profile-btn";
                viewProfileButton.textContent = "View Profile";
                viewProfileButton.dataset.username = user.username;
                viewProfileButton.addEventListener("click", () => navigate(`/user/${user.username}`));

                listItem.appendChild(viewProfileButton);
                suggestionsList.appendChild(listItem);
            });

            suggestionsSection.appendChild(suggestionsList);
        } else {
            const noSuggestionsMessage = document.createElement("p");
            noSuggestionsMessage.textContent = "No follow suggestions available.";
            suggestionsSection.appendChild(noSuggestionsMessage);
        }
    } catch (error) {
        console.error("Error loading follow suggestions:", error);

        const errorMessage = document.createElement("p");
        errorMessage.textContent = "Failed to load suggestions.";
        suggestionsSection.appendChild(errorMessage);


        Snackbar("Error loading follow suggestions.", 3000);
    }
}

// async function editProfile(content) {
//     content.textContent = ""; // Clear existing content

//     if (!state.userProfile) {
//         Snackbar("Please log in to edit your profile.", 3000);
//         return;
//     }

//     const { username, email, bio, phone_number } = state.userProfile;

//     const heading = document.createElement("h2");
//     heading.textContent = "Edit Profile";
//     content.appendChild(heading);

//     const form = document.createElement("form");
//     form.id = "edit-profile-form";

//     const fields = [
//         { label: "Username", id: "edit-username", type: "text", value: username },
//         { label: "Email", id: "edit-email", type: "email", value: email },
//         { label: "Bio", id: "edit-bio", type: "textarea", value: bio || '' },
//         { label: "Phone Number", id: "edit-phone", type: "text", value: phone_number || '' },
//     ];

//     fields.forEach(field => {
//         const fieldGroup = document.createElement("div");
//         fieldGroup.classList.add("form-group");

//         const label = document.createElement("label");
//         label.setAttribute("for", field.id);
//         label.textContent = field.label;

//         let input;
//         if (field.type === "textarea") {
//             input = document.createElement("textarea");
//             input.id = field.id;
//             input.textContent = field.value || '';
//         } else {
//             input = document.createElement("input");
//             input.type = field.type;
//             input.id = field.id;
//             input.value = field.value || '';
//         }

//         fieldGroup.appendChild(label);
//         fieldGroup.appendChild(input);
//         form.appendChild(fieldGroup);
//     });


//     const updateButton = document.createElement("button");
//     updateButton.type = "button";
//     updateButton.id = "update-profile-btn";
//     updateButton.textContent = "Update Profile";
//     updateButton.addEventListener("click", () => {
//         const formData = new FormData(form);
//         updateProfile(formData);
//     });

//     const cancelButton = document.createElement("button");
//     cancelButton.type = "button";
//     cancelButton.id = "cancel-profile-btn";
//     cancelButton.textContent = "Cancel";
//     cancelButton.addEventListener("click", () => {
//         Snackbar("Profile editing canceled.", 2000);
//         navigate('/profile'); // Assuming a function to reload profile view
//     });

//     // form.appendChild(updatePicButton);
//     form.appendChild(updateButton);
//     form.appendChild(cancelButton);
//     content.appendChild(form);
// }

async function editProfile(content) {
    content.textContent = ""; // Clear existing content

    if (!state.userProfile) {
        Snackbar("Please log in to edit your profile.", 3000);
        return;
    }

    const { username, email, bio, phone_number } = state.userProfile;

    content.innerHTML = `
        <h2>Edit Profile</h2>
        <form id="edit-profile-form" class="edit-profile-form">
            ${generateFormField("Username", "edit-username", "text", username)}
            ${generateFormField("Email", "edit-email", "email", email)}
            ${generateFormField("Bio", "edit-bio", "textarea", bio || "")}
            ${generateFormField("Phone Number", "edit-phone", "text", phone_number || "")}
            <button type="button" id="update-profile-btn">Update Profile</button>
            <button type="button" id="cancel-profile-btn">Cancel</button>
        </form>
    `;

    document.getElementById("update-profile-btn").addEventListener("click", () => {
        const form = document.getElementById("edit-profile-form");
        updateProfile(new FormData(form));
    });

    document.getElementById("cancel-profile-btn").addEventListener("click", () => {
        Snackbar("Profile editing canceled.", 2000);
        navigate("/profile"); // Assuming a function to navigate back to the profile view
    });
}

function generateFormField(labelText, id, type, value) {
    if (type === "textarea") {
        return `
            <div class="form-group">
                <label for="${id}">${labelText}</label>
                <textarea id="${id}">${value}</textarea>
            </div>
        `;
    }
    return `
        <div class="form-group">
            <label for="${id}">${labelText}</label>
            <input type="${type}" id="${id}" value="${value}">
        </div>
    `;
}


// // Update profile (only send changed fields)
// async function updateProfile() {
//     if (!state.token) {
//         Snackbar("Please log in to update your profile.", 3000);
//         return;
//     }

//     const form = document.getElementById("edit-profile-form");
//     if (!form) {
//         Snackbar("Profile edit form is not available.", 3000);
//         return;
//     }

//     const currentProfile = state.userProfile || {};
//     const formData = new FormData(form);

//     const updatedFields = Object.fromEntries(
//         ["edit-username", "edit-email", "edit-bio", "edit-phone"].map(fieldId => {
//             const value = formData.get(fieldId)?.trim() || "";
//             const key = fieldId.replace("edit-", "");
//             return value && value !== currentProfile[key] ? [key, value] : null;
//         }).filter(Boolean)
//     );

//     if (Object.keys(updatedFields).length === 0) {
//         Snackbar("No changes were made to the profile.", 3000);
//         return;
//     }

//     showLoadingMessage("Updating...");

//     try {
//         const updateFormData = new FormData();
//         Object.entries(updatedFields).forEach(([key, value]) => updateFormData.append(key, value));

//         const updatedProfile = await apiFetch('/profile', 'PUT', updateFormData);
//         if (!updatedProfile) throw new Error("No response received for the profile update.");

//         state.userProfile = { ...currentProfile, ...updatedProfile };
//         localStorage.setItem("userProfile", JSON.stringify(state.userProfile));

//         Snackbar("Profile updated successfully.", 3000);
//         renderPage();
//     } catch (error) {
//         console.error("Error updating profile:", error);
//         handleError("Error updating profile. Please try again.");
//     } finally {
//         removeLoadingMessage();
//     }
// }

// async function updateProfile(formData) {
//     if (!state.token) {
//         Snackbar("Please log in to update your profile.", 3000);
//         return;
//     }

//     const currentProfile = state.userProfile || {};
//     const updatedFields = {};

//     for (const [key, value] of formData.entries()) {
//         const fieldName = key.replace("edit-", "");
//         if (value.trim() && value.trim() !== currentProfile[fieldName]) {
//             updatedFields[fieldName] = value.trim();
//         }
//     }

//     if (Object.keys(updatedFields).length === 0) {
//         Snackbar("No changes were made to the profile.", 3000);
//         return;
//     }

//     showLoadingMessage("Updating...");

//     try {
//         const updateFormData = new FormData();
//         Object.entries(updatedFields).forEach(([key, value]) => updateFormData.append(key, value));

//         const updatedProfile = await apiFetch("/profile", "PUT", updateFormData);
//         if (!updatedProfile) throw new Error("No response received for the profile update.");

//         state.userProfile = { ...currentProfile, ...updatedProfile };
//         localStorage.setItem("userProfile", JSON.stringify(state.userProfile));

//         Snackbar("Profile updated successfully.", 3000);
//         renderPage();
//     } catch (error) {
//         console.error("Error updating profile:", error);
//         handleError("Error updating profile. Please try again.");
//     } finally {
//         removeLoadingMessage();
//     }
// }

async function updateProfile(formData) {
    if (!state.token) {
        Snackbar("Please log in to update your profile.", 3000);
        return;
    }

    const currentProfile = state.userProfile || {};
    const updatedFields = {};

    for (const [key, value] of formData.entries()) {
        const fieldName = key.replace("edit-", "");
        const trimmedValue = value.trim();

        // Compare trimmed values to detect changes
        if (trimmedValue !== (currentProfile[fieldName] || "").trim()) {
            updatedFields[fieldName] = trimmedValue;
        }
    }

    if (Object.keys(updatedFields).length === 0) {
        Snackbar("No changes were made to the profile.", 3000);
        return;
    }

    showLoadingMessage("Updating...");

    try {
        const updateFormData = new FormData();
        Object.entries(updatedFields).forEach(([key, value]) => updateFormData.append(key, value));

        const updatedProfile = await apiFetch("/profile", "PUT", updateFormData);
        if (!updatedProfile) throw new Error("No response received for the profile update.");

        state.userProfile = { ...currentProfile, ...updatedProfile };
        localStorage.setItem("userProfile", JSON.stringify(state.userProfile));

        Snackbar("Profile updated successfully.", 3000);
        renderPage();
    } catch (error) {
        console.error("Error updating profile:", error);
        handleError("Error updating profile. Please try again.");
    } finally {
        removeLoadingMessage();
    }
}


async function updatePicture(type) {
    if (!state.token) {
        Snackbar(`Please log in to update your ${type} picture.`, 3000);
        return;
    }

    const fileInput = document.getElementById(`edit-${type}-picture`);
    if (!fileInput || !fileInput.files[0]) {
        Snackbar(`No ${type} picture selected.`, 3000);
        return;
    }

    showLoadingMessage(`Updating ${type} picture...`);

    try {
        const formData = new FormData();
        formData.append(`${type}_picture`, fileInput.files[0]);

        const updatedProfile = await apiFetch(`/profile/${type}`, 'PUT', formData);
        if (!updatedProfile) throw new Error(`No response received for ${type} picture update.`);

        state.userProfile = { ...state.userProfile, ...updatedProfile };
        localStorage.setItem("userProfile", JSON.stringify(state.userProfile));

        Snackbar(`${capitalize(type)} picture updated successfully.`, 3000);
        renderPage();
    } catch (error) {
        console.error(`Error updating ${type} picture:`, error);
        handleError(`Error updating ${type} picture. Please try again.`);
    } finally {
        removeLoadingMessage();
    }
}

async function updateProfilePics(type) {
    await updatePicture(type);
}

function showLoadingMessage(message) {
    const loadingMsg = document.createElement("p");
    loadingMsg.id = "loading-msg";
    loadingMsg.textContent = message;
    document.getElementById("content").appendChild(loadingMsg);
}

function removeLoadingMessage() {
    const loadingMsg = document.getElementById("loading-msg");
    if (loadingMsg) loadingMsg.remove();
}

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


// Preview profile picture
function previewProfilePicture(event) {
    const file = event.target.files[0];
    const preview = document.getElementById("profile-picture-preview");

    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            preview.src = reader.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}


async function displaySuggested() {
    const content = document.getElementById("suggested");

    // Check if userProfile is available
    if (state.userProfile) {
        // If userProfile exists, display relevant details from the profile
        content.innerHTML = `
            <h1>Suggested for ${state.userProfile.username || state.user}</h1>
            <p>Email: ${state.userProfile.email || 'N/A'}</p>
            <p>Location: ${state.userProfile.location || 'N/A'}</p>
        `;
    } else {
        // If no userProfile is available, fall back to displaying the username
        content.innerHTML = `<h1>Welcome, ${state.user || 'Guest'}</h1>`;
    }
}

async function deleteProfile() {
    if (!state.token) {

        Snackbar("Please log in to delete your profile.", 3000);
        return;
    }

    const confirmDelete = confirm("Are you sure you want to delete your profile? This action cannot be undone.");
    if (!confirmDelete) {
        return;
    }

    try {
        await apiFetch('/profile', 'DELETE');

        Snackbar("Profile deleted successfully.", 3000);
        logout();
    } catch (error) {

        Snackbar(`Failed to delete profile: ${error.message}`, 3000);
    }
};


export { fetchProfile, displayProfile, generateProfileHTML, fetchUserProfile, renderUserProfile, displayUserProfile, deleteProfile, displayFollowSuggestions, editProfile, previewProfilePicture, updateProfile, displaySuggested, toggleFollow };