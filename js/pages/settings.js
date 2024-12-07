import { apiFetch } from "../api/api.js";


// Function to display media for the event
async function displaySettings() {
    let feedsec = document.getElementById("settings");
    feedsec.innerHTML = `<div id='settingscon'></div>`;
    let settingssec = document.getElementById("settingscon");
    settingssec.innerHTML = `<div id="loading">Loading...</div>
    <div id="error"></div>
    <div id="settings-container"></div>`


    // document.addEventListener('DOMContentLoaded', async () => {
        const settingsContainer = document.getElementById('settings-container');
        const loadingIndicator = document.getElementById('loading');
        const errorContainer = document.getElementById('error');

        // // Fetch and display all settings
        // async function loadSettings() {
        //     try {
        //         // Clear previous content
        //         settingsContainer.innerHTML = '';
        //         errorContainer.textContent = '';

        //         // Show loading indicator
        //         loadingIndicator.style.display = 'block';

        //         // Fetch settings from the API
        //         const settings = await apiFetch('/settings');

        //         // Generate forms for each setting
        //         settings.forEach(setting => {
        //             const form = createSettingForm(setting);
        //             settingsContainer.appendChild(form);
        //         });
        //     } catch (error) {
        //         console.error("Error loading settings:", error);
        //         errorContainer.textContent = `Failed to load settings: ${error.message}`;
        //     } finally {
        //         // Hide loading indicator
        //         loadingIndicator.style.display = 'none';
        //     }
        // }

        async function loadSettings() {
            try {
                settingsContainer.innerHTML = '';
                errorContainer.textContent = '';
                loadingIndicator.style.display = 'block';
        
                const settings = await apiFetch('/settings');
        
                // Check if settings is null or not an array
                if (!settings || !Array.isArray(settings) || settings.length === 0) {
                    errorContainer.textContent = "No settings found.";
                    return;
                }
        
                settings.forEach(setting => {
                    const form = createSettingForm(setting);
                    settingsContainer.appendChild(form);
                });
            } catch (error) {
                console.error("Error loading settings:", error);
                errorContainer.textContent = `Failed to load settings: ${error.message}`;
            } finally {
                loadingIndicator.style.display = 'none';
            }
        }
        
        // Create a form for a specific setting
        function createSettingForm(setting) {
            const form = document.createElement('form');
            form.dataset.type = setting.type;

            form.innerHTML = `
            <h3>${setting.type}</h3>
            <label for="${setting.type}-value">${setting.description}</label>
            <input id="${setting.type}-value" type="${getInputType(setting.value)}" value="${setting.value}" required>
            <button type="submit">Save</button>
        `;

            // Handle form submission
            form.addEventListener('submit', async (event) => {
                event.preventDefault();
                const input = form.querySelector(`#${setting.type}-value`);
                const value = input.value;

                try {
                    // Show loading indicator
                    loadingIndicator.style.display = 'block';

                    // Update the setting via the API
                    await apiFetch(`/settings/${setting.type}`, 'PUT', JSON.stringify({ value }), {
                        headers: { 'Content-Type': 'application/json' }
                    });

                    alert(`Setting "${setting.type}" updated successfully!`);
                } catch (error) {
                    console.error(`Error updating setting "${setting.type}":`, error);
                    errorContainer.textContent = `Failed to update setting "${setting.type}": ${error.message}`;
                } finally {
                    // Hide loading indicator
                    loadingIndicator.style.display = 'none';
                }
            });

            return form;
        }

        // Determine input type based on value type
        function getInputType(value) {
            if (typeof value === 'boolean') return 'checkbox';
            if (typeof value === 'number') return 'number';
            if (typeof value === 'string' && value.includes('@')) return 'email';
            return 'text';
        }

        // Load settings on page load
        loadSettings();
    // });

}

export { displaySettings };