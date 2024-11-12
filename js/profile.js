import { API_URL, state } from "./state.js";
import { apiFetch } from "./api.js";
import { validateInputs, isValidUsername, isValidEmail, showSnackbar, handleError } from "./utils.js";

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
                showSnackbar(`Error fetching profile: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
            showSnackbar("An unexpected error occurred while fetching the profile.");
        }
    } else {
        // If no token exists, assume user is not logged in and clear the profile
        state.userProfile = null;
    }

    return null; // Return null if no profile found
}

// Display the profile content in the profile section
async function displayProfile() {
    const profileSection = document.getElementById("profile-section");
    const profile = await fetchProfile();

    if (profile) {
        // If profile is available, generate and display the HTML
        profileSection.innerHTML = generateProfileHTML(profile);
        // displayActivityFeed();
        displayFollowSuggestions();
    } else {
        // If profile is not found (e.g., user is not logged in), show login message
        profileSection.innerHTML = "<p>Please log in to see your profile.</p>";
    }
}


// Generate the HTML content for the profile
function generateProfileHTML(profile) {
    return `<div class="profile-container">
    <div class="profile-header">
        <img src="/userpic/${profile.profile_picture || 'default.png'}" alt="Profile Picture" class="profile-picture"/>
        <div class="profile-details">
            <h2 class="username">${profile.username || 'Not provided'}</h2>
            <p class="name">${profile.name || 'Not provided'}</p>
            <p class="email">${profile.email || 'Not provided'}</p>
            <p class="bio">${profile.bio || 'No bio available.'}</p>
        </div>
    </div>
    
    <div class="profile-stats">
        <div class="stat">
            <strong>Followers:</strong> ${Array.isArray(profile.followers) ? profile.followers.length : 0}
        </div>
        <div class="stat">
            <strong>Following:</strong> ${Array.isArray(profile.follows) ? profile.follows.length : 0}
        </div>
        <div class="stat">
            <strong>Profile Views:</strong> ${profile.profile_views || 0}
        </div>
    </div>

    <div class="profile-actions">
        <button class="btn edit-btn" onclick="window.editProfile()">Edit Profile</button>
    </div>

    <div id="follow-suggestions" class="follow-suggestions"></div>
    <br>
    <div class="profile-info">
        <div class="info-item">
            <strong>Phone Number:</strong> ${profile.phone_number || 'Not provided'}
        </div>
        <div class="info-item">
            <strong>Address:</strong> ${profile.address || 'Not provided'}
        </div>
        <div class="info-item">
            <strong>Date of Birth:</strong> ${profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'Not provided'}
        </div>
        <div class="info-item">
            <strong>Last Login:</strong> ${profile.last_login ? new Date(profile.last_login).toLocaleString() : 'Never logged in'}
        </div>
        <div class="info-item">
            <strong>Account Status:</strong> ${profile.is_active ? 'Active' : 'Inactive'}
        </div>
        <div class="info-item">
            <strong>Verification Status:</strong> ${profile.is_verified ? 'Verified' : 'Not Verified'}
        </div>
    </div>
    
    <div class="profile-actions">
        <button class="btn delete-btn" onclick="window.deleteProfile()">Delete Profile</button>
    </div>
</div>`;
}


async function fetchUserProfile(username) {
    try {
        const data = await apiFetch(`/user/${username}`);
        return data.is_following !== undefined ? data : null;
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return null;
    }
}


function renderUserProfile(userProfile) {
    const followButtonLabel = userProfile.isFollowing ? 'Unfollow' : 'Follow';

    // Format the Date fields more consistently
    const formatDate = (date) => date ? new Date(date).toLocaleDateString() : 'Not provided';

    let ppage = `
        <p>Username: ${userProfile.username || 'Not provided.'}</p>
        <p>Email: ${userProfile.email || 'Not provided.'}</p>
        <p>Name: ${userProfile.name || 'Not provided.'}</p>
        <p>Bio: ${userProfile.bio || 'No bio available.'}</p>
        <p>Phone Number: ${userProfile.phone_number || 'Not provided.'}</p>
        <p>Profile Views: ${userProfile.profile_views || 0}</p>
        <p>Followers: ${Array.isArray(userProfile.followers) ? userProfile.followers.length : 0}</p>
        <p>Following: ${Array.isArray(userProfile.follows) ? userProfile.follows.length : 0}</p>
        <p>Address: ${userProfile.address || 'Not provided.'}</p>
        <p>Date of Birth: ${formatDate(userProfile.date_of_birth)}</p>
        <p>Last Login: ${formatDate(userProfile.last_login)}</p>
        <p>Account Status: ${userProfile.is_active ? 'Active' : 'Inactive'}</p>
        <p>Verification Status: ${userProfile.is_verified ? 'Verified' : 'Not Verified'}</p>
        <img src="/userpic/${userProfile.profile_picture || 'default.png'}" alt="Profile Picture" />
    `;

    if (state.token && typeof window.toggleFollow === 'function') {
        ppage += `
            <button class="follow-button" id="user-${userProfile.userid}" onclick="window.toggleFollow('${userProfile.userid}')">
                ${followButtonLabel}
            </button>
        `;
    }

    return ppage;
}

//========================================================================


// function showLightbox() {
//     const lightbox = document.getElementById('lightbox');
//     lightbox.classList.add('show');
// }



async function toggleFollow(userId) {
    if (!state.token) {
        showSnackbar("Please log in to follow users.");
        return;
    }

    try {
        const data = await apiFetch(`/follows/${userId}`, 'POST');
        const followButton = document.getElementById(`user-${userId}`);
        if (followButton) {
            const newLabel = data.isFollowing ? 'Unfollow' : 'Follow';
            followButton.textContent = newLabel;
            followButton.onclick = () => window.toggleFollow(userId); // Update onclick
        }
        showSnackbar(`You have ${data.isFollowing ? 'followed' : 'unfollowed'} the user.`);
    } catch (error) {
        showSnackbar(`Failed to toggle follow status: ${error.message}`);
    }
};

async function displayUserProfile(username) {
    const content = document.getElementById("content");
    try {
        const userProfile = await fetchUserProfile(username);

        if (userProfile) {
            content.innerHTML = renderUserProfile(userProfile);
        } else {
            content.innerHTML = "<p>User not found.</p>";
        }
    } catch (error) {
        content.innerHTML = "<p>Failed to load user profile. Please try again later.</p>";
        showSnackbar("Error fetching user profile.");
    }
}

async function deleteProfile() {
    if (!state.token) {
        showSnackbar("Please log in to delete your profile.");
        return;
    }

    const confirmDelete = confirm("Are you sure you want to delete your profile? This action cannot be undone.");
    if (!confirmDelete) {
        return;
    }

    try {
        await apiFetch('/profile', 'DELETE');
        showSnackbar("Profile deleted successfully.");
        window.logout();
    } catch (error) {
        showSnackbar(`Failed to delete profile: ${error.message}`);
    }
};

async function displayFollowSuggestions() {
    const suggestionsSection = document.getElementById("follow-suggestions");
    try {
        const suggestions = await apiFetch('/follow/suggestions');
        if (suggestions.length != 0) {
            suggestionsSection.innerHTML = "<h3>Suggested Users to Follow:</h3><ul>" +
                suggestions.map(user => `<li>${user.username} <button onclick="navigate('/user/${user.username}')">View Profile</button></li>`).join('') +
                "</ul>";
        } else {
            suggestionsSection.innerHTML = "<p>No follow suggestions available.</p>";
        }
    } catch (error) {
        suggestionsSection.innerHTML = "<p>Failed to load suggestions.</p>";
        showSnackbar("Error loading follow suggestions.");
    }
}

async function editProfile() {
    const profileSection = document.getElementById("profile-section");

    if (state.userProfile) {
        const profilePictureSrc = state.userProfile.profile_picture ? `/userpic/${state.userProfile.profile_picture}` : '';

        // Render the profile edit form
        profileSection.innerHTML = `
            <h2>Edit Profile</h2>
            <input type="text" id="edit-username" placeholder="Username" value="${state.userProfile.username}" />
            <input type="email" id="edit-email" placeholder="Email" value="${state.userProfile.email}" />
            <input type="text" id="edit-bio" placeholder="Bio" value="${state.userProfile.bio || ''}" />
            <input type="text" id="edit-phone" placeholder="Phone Number" value="${state.userProfile.phone_number || ''}" />
            <input type="text" id="edit-social" placeholder="Social Links (comma-separated)" value="${state.userProfile.socialLinks ? Object.values(state.userProfile.socialLinks).join(', ') : ''}" />
            <input type="file" id="edit-profile-picture" accept="image/*" onchange="previewProfilePicture(event)" />
            ${profilePictureSrc ? `
                <div>
                    <p>Current Profile Picture:</p>
                    <img id="current-profile-picture" src="${profilePictureSrc}" style="max-width: 200px;" alt="Current Profile Picture" />
                </div>
                <img id="profile-picture-preview" style="display:none; max-width: 200px;" alt="Profile Picture Preview" />
            ` : '<img id="profile-picture-preview" style="display:none;" />'}
            <button onclick="updateProfile()">Update Profile</button>
            <button onclick="renderPage()">Cancel</button>
        `;
    } else {
        showSnackbar("Please log in to edit your profile.");
    }
}

// Helper function to preview the profile picture before upload
function previewProfilePicture(event) {
    const file = event.target.files[0];
    const preview = document.getElementById("profile-picture-preview");
    const reader = new FileReader();

    reader.onload = function (e) {
        preview.src = e.target.result;
        preview.style.display = "block"; // Show the preview image
    };

    if (file) {
        reader.readAsDataURL(file);
    }
}

async function updateProfile() {
    if (!state.token) {
        showSnackbar("Please log in to update your profile.");
        return;
    }

    const profileSection = document.getElementById("profile-section");
    const newUsername = document.getElementById("edit-username").value.trim();
    const newEmail = document.getElementById("edit-email").value.trim();
    const newBio = document.getElementById("edit-bio").value.trim();
    const newPhone = document.getElementById("edit-phone").value.trim();
    const newSocialLinks = document.getElementById("edit-social").value.split(',').map(link => link.trim());
    const profilePictureFile = document.getElementById("edit-profile-picture").files[0];

    // Validate inputs
    const errors = validateInputs([
        { value: newUsername, validator: isValidUsername, message: "Username must be between 3 and 20 characters." },
        { value: newEmail, validator: isValidEmail, message: "Please enter a valid email." }
    ]);

    if (errors) {
        handleError(errors);
        return;
    }

    profileSection.innerHTML += `<p>Updating...</p>`; // Show a loading message

    try {
        const formData = new FormData();
        formData.append("username", newUsername);
        formData.append("email", newEmail);
        formData.append("bio", newBio);
        formData.append("phone_number", newPhone);
        formData.append("social_links", JSON.stringify(newSocialLinks));

        if (profilePictureFile) {
            formData.append("profile_picture", profilePictureFile);
        }

        // API call to update profile
        const updatedProfile = await apiFetch('/profile', 'PUT', formData);
        console.log(updatedProfile);
        // Update the cached profile in localStorage
        state.userProfile = updatedProfile;
        localStorage.setItem("userProfile", JSON.stringify(updatedProfile));

        showSnackbar("Profile updated successfully.");
        renderPage(); // Reload the page after the update

    } catch (error) {
        handleError("Error updating profile.");
    } finally {
        // Remove the "Updating..." message after completion
        const loadingMsg = profileSection.querySelector("p");
        if (loadingMsg) loadingMsg.remove();
    }

    // logActivity("updated profile");
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

export { fetchProfile, displayProfile, generateProfileHTML, fetchUserProfile, renderUserProfile, displayUserProfile, deleteProfile, displayFollowSuggestions, editProfile, previewProfilePicture, updateProfile, displaySuggested, toggleFollow };