import { createEventForm } from "../../services/event/createEventService.js";

function Create(contentContainer) {
    contentContainer.innerHTML = '';
    createEventForm(contentContainer);
}

export { Create };
