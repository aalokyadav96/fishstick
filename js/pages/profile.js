import { API_URL, state } from "../state/state.js";
import { apiFetch } from "../api/api.js";
import { validateInputs, isValidUsername, isValidEmail, showSnackbar, handleError } from "../utils/utils.js";
import { renderPage } from "../routes/render.js";

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
        profileSection.innerHTML = generateProfileHTML(profile);
        attachProfileEventListeners(); // Attach event listeners for buttons
        displayFollowSuggestions();
    } else {
        profileSection.innerHTML = "<p>Please log in to see your profile.</p>";
    }
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

// Render a user's profile
function renderUserProfile(profile) {
    const followButtonLabel = profile.isFollowing ? 'Unfollow' : 'Follow';

    return `
        <div class="profile-container">
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
                <div class="stat"><strong>Followers:</strong> ${profile.followers?.length || 0}</div>
                <div class="stat"><strong>Following:</strong> ${profile.follows?.length || 0}</div>
                <div class="stat"><strong>Profile Views:</strong> ${profile.profile_views || 0}</div>
            </div>
            <div class="profile-actions">
                <button class="btn follow-button" data-action="toggle-follow" data-userid="${profile.userid}">${followButtonLabel}</button>
            </div>
            <div class="profile-info">
                <div class="info-item"><strong>Phone Number:</strong> ${profile.phone_number || 'Not provided'}</div>
                <div class="info-item"><strong>Address:</strong> ${profile.address || 'Not provided'}</div>
                <div class="info-item"><strong>Date of Birth:</strong> ${formatDate(profile.date_of_birth) || 'Not provided'}</div>
                <div class="info-item"><strong>Last Login:</strong> ${formatDate(profile.last_login) || 'Never logged in'}</div>
                <div class="info-item"><strong>Account Status:</strong> ${profile.is_active ? 'Active' : 'Inactive'}</div>
                <div class="info-item"><strong>Verification Status:</strong> ${profile.is_verified ? 'Verified' : 'Not Verified'}</div>
            </div>
        </div>
    `;
}

// Display user profile
async function displayUserProfile(username) {
    const content = document.getElementById("content");
    try {
        const userProfile = await fetchUserProfile(username);

        if (userProfile) {
            content.innerHTML = renderUserProfile(userProfile);
            attachUserProfileListeners(userProfile); // Attach relevant event listeners
        } else {
            content.innerHTML = "<p>User not found.</p>";
        }
    } catch (error) {
        content.innerHTML = "<p>Failed to load user profile. Please try again later.</p>";
        showSnackbar("Error fetching user profile.");
    }
}

// Attach event listeners for the profile page
function attachProfileEventListeners() {
    const editButton = document.querySelector('[data-action="edit-profile"]');
    const deleteButton = document.querySelector('[data-action="delete-profile"]');

    if (editButton) {
        editButton.addEventListener("click", () => {
            window.editProfile();
        });
    }

    if (deleteButton) {
        deleteButton.addEventListener("click", () => {
            window.deleteProfile();
        });
    }
}

// Attach event listeners for user-specific profile actions
function attachUserProfileListeners(profile) {
    const followButton = document.querySelector(`[data-userid="${profile.userid}"]`);
    if (followButton) {
        followButton.addEventListener("click", () => {
            window.toggleFollow(profile.userid);
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
        showSnackbar("Please log in to follow users.");
        return;
    }

    try {
        const data = await apiFetch(`/follows/${userId}`, 'POST');
        const followButton = document.getElementById(`user-${userId}`);

        if (followButton) {
            followButton.textContent = data.isFollowing ? 'Unfollow' : 'Follow';
            followButton.onclick = () => toggleFollow(userId); // Update onclick handler
        }

        showSnackbar(`You have ${data.isFollowing ? 'followed' : 'unfollowed'} the user.`);
    } catch (error) {
        console.error("Error toggling follow status:", error);
        showSnackbar(`Failed to update follow status: ${error.message}`);
    }
}

// Display follow suggestions
async function displayFollowSuggestions() {
    const suggestionsSection = document.getElementById("follow-suggestions");

    try {
        const suggestions = await apiFetch('/follow/suggestions');
        if (suggestions && suggestions.length > 0) {
            suggestionsSection.innerHTML = `
                <h3>Suggested Users to Follow:</h3>
                <ul>
                    ${suggestions.map(user => `
                        <li>
                            ${user.username}
                            <button onclick="navigate('/user/${user.username}')">View Profile</button>
                        </li>`).join('')}
                </ul>`;
        } else {
            suggestionsSection.innerHTML = "<p>No follow suggestions available.</p>";
        }
    } catch (error) {
        console.error("Error loading follow suggestions:", error);
        suggestionsSection.innerHTML = "<p>Failed to load suggestions.</p>";
        showSnackbar("Error loading follow suggestions.");
    }
}

// Display the profile edit form
async function editProfile() {
    const profileSection = document.getElementById("profile-section");

    if (!state.userProfile) {
        showSnackbar("Please log in to edit your profile.");
        return;
    }

    const { username, email, bio, phone_number, socialLinks, profile_picture } = state.userProfile;
    const profilePictureSrc = profile_picture ? `/userpic/${profile_picture}` : '';

    profileSection.innerHTML = `
        <h2>Edit Profile</h2>
        <form id="edit-profile-form">
            <input type="text" id="edit-username" placeholder="Username" value="${username}" />
            <input type="email" id="edit-email" placeholder="Email" value="${email}" />
            <textarea id="edit-bio" placeholder="Bio">${bio || ''}</textarea>
            <input type="text" id="edit-phone" placeholder="Phone Number" value="${phone_number || ''}" />
            <input type="text" id="edit-social" placeholder="Social Links (comma-separated)" value="${socialLinks ? Object.values(socialLinks).join(', ') : ''}" />
            <input type="file" id="edit-profile-picture" accept="image/*" onchange="previewProfilePicture(event)" />
            ${profilePictureSrc ? `
                <div>
                    <p>Current Profile Picture:</p>
                    <img id="current-profile-picture" src="${profilePictureSrc}" style="max-width: 200px;" alt="Current Profile Picture" />
                </div>
                <img id="profile-picture-preview" style="display:none; max-width: 200px;" alt="Profile Picture Preview" />
            ` : '<img id="profile-picture-preview" style="display:none;" />'}
            <button type="button" onclick="updateProfile()">Update Profile</button>
            <button type="button" onclick="renderPage()">Cancel</button>
        </form>
    `;
}

// Update profile
async function updateProfile() {
    if (!state.token) {
        showSnackbar("Please log in to update your profile.");
        return;
    }

    const formData = new FormData(document.getElementById("edit-profile-form"));
    const newSocialLinks = formData.get("edit-social").split(',').map(link => link.trim());
    formData.set("social_links", JSON.stringify(newSocialLinks));

    const profileSection = document.getElementById("profile-section");
    profileSection.insertAdjacentHTML('beforeend', `<p id="loading-msg">Updating...</p>`);

    try {
        const updatedProfile = await apiFetch('/profile', 'PUT', formData);

        state.userProfile = updatedProfile; // Update cached profile
        localStorage.setItem("userProfile", JSON.stringify(updatedProfile));

        showSnackbar("Profile updated successfully.");
        renderPage(); // Reload the page after update
    } catch (error) {
        console.error("Error updating profile:", error);
        showSnackbar("Error updating profile.");
    } finally {
        document.getElementById("loading-msg")?.remove();
    }
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


export { fetchProfile, displayProfile, generateProfileHTML, fetchUserProfile, renderUserProfile, displayUserProfile, deleteProfile, displayFollowSuggestions, editProfile, previewProfilePicture, updateProfile, displaySuggested, toggleFollow };