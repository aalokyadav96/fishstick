import { apiFetch } from "../../api/api.js";
import ToggleSwitch from '../../components/ui/ToggleSwitch.mjs';
import Dropdown from '../../components/ui/Dropdown.mjs';

// Function to display settings
async function displaySettings(settingsSec) {
    // const settingsSec = document.getElementById("settings");
    const settingsContainer = createContainer();
    settingsSec.appendChild(settingsContainer);

    // Loading indicator and error section
    const loadingIndicator = createLoadingIndicator();
    const errorContainer = createErrorContainer();

    settingsContainer.appendChild(loadingIndicator);
    settingsContainer.appendChild(errorContainer);

    const hd = document.createElement('h3');
    hd.textContent = "Theme";
    settingsContainer.appendChild(hd);

    const dropdownOptions = ['Option 1', 'Option 2', 'Option 3'];
    const onOptionChange = (selectedOption) => {
      console.log('Selected option:', selectedOption);
    };
  
    const dropdown = Dropdown(dropdownOptions, onOptionChange);
  
    settingsContainer.appendChild(dropdown);
  
    // Create the form elements
    const heading = document.createElement('h3');
    heading.textContent = "Notifs";
    settingsContainer.appendChild(heading);

  
    const togglelabel = document.createElement('label');
    togglelabel.textContent = 'Enable Notifications: ';

    const toggle = ToggleSwitch((state) => {
        alert(`Notifications are now ${state ? 'enabled' : 'disabled'}`);
    });

    togglelabel.appendChild(toggle);
    settingsContainer.appendChild(togglelabel);

    try {
        // Load and display the settings
        const settings = await loadSettings();

        if (settings && settings.length > 0) {
            settings.forEach(setting => {
                const settingForm = createSettingForm(setting);
                settingsContainer.appendChild(settingForm);
            });
        } else {
            errorContainer.textContent = "No settings found.";
        }
    } catch (error) {
        console.error("Error loading settings:", error);
        errorContainer.textContent = `Failed to load settings: ${error.message}`;
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

// Function to create a container for settings
function createContainer() {
    const container = document.createElement("div");
    container.id = "settings-container";
    return container;
}

// Function to create a loading indicator
function createLoadingIndicator() {
    const loadingIndicator = document.createElement("div");
    loadingIndicator.id = "loading";
    loadingIndicator.textContent = "Loading...";
    return loadingIndicator;
}

// Function to create an error container
function createErrorContainer() {
    const errorContainer = document.createElement("div");
    errorContainer.id = "error";
    return errorContainer;
}

// Function to fetch the settings from the API
async function loadSettings() {
    const settings = await apiFetch('/settings');
    return settings && Array.isArray(settings) ? settings : [];
}

// Function to create the setting form
function createSettingForm(setting) {
    const form = document.createElement('form');
    form.dataset.type = setting.type;

    // Create the form elements
    const heading = document.createElement('h3');
    heading.textContent = setting.type;

    const label = document.createElement('label');
    label.setAttribute('for', `${setting.type}-value`);
    label.textContent = setting.description;

    const input = document.createElement('input');
    input.id = `${setting.type}-value`;
    input.type = getInputType(setting.value);
    input.value = setting.value;
    input.required = true;

    const button = document.createElement('button');
    button.type = 'submit';
    button.textContent = 'Save';


    // Append elements to the form
    form.appendChild(heading);
    form.appendChild(label);
    form.appendChild(input);
    form.appendChild(button);

    // Handle form submission
    form.addEventListener('submit', (event) => handleFormSubmit(event, setting.type, input));

    return form;
}

// Function to determine the input type based on the value type
function getInputType(value) {
    if (typeof value === 'boolean') return 'checkbox';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'string' && value.includes('@')) return 'email';
    return 'text';
}

// Function to handle form submission
async function handleFormSubmit(event, settingType, input) {
    event.preventDefault();

    const value = input.type === 'checkbox' ? input.checked : input.value;

    const loadingIndicator = document.getElementById("loading");
    const errorContainer = document.getElementById("error");

    try {
        loadingIndicator.style.display = 'block';

        // Update the setting via the API
        await apiFetch(`/settings/${settingType}`, 'PUT', JSON.stringify({ value }), {
            headers: { 'Content-Type': 'application/json' }
        });

        alert(`Setting "${settingType}" updated successfully!`);
    } catch (error) {
        console.error(`Error updating setting "${settingType}":`, error);
        errorContainer.textContent = `Failed to update setting "${settingType}": ${error.message}`;
    } finally {
        loadingIndicator.style.display = 'none';
    }
}

export { displaySettings };