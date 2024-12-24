import { displayFeed } from "../services/profile/feedService.js";

function Feed(contentContainer) {
    contentContainer.innerHTML = '';
    displayFeed(contentContainer);
}

export { Feed };
