import { displaySettings } from "../../services/profile/settingsService.js";

function Settings(contentContainer) {
    contentContainer.innerHTML = '';
    displaySettings(contentContainer);
}

export { Settings };
