import { displaySearch } from "../services/search/searchService.js";

function Search(contentContainer) {
    contentContainer.innerHTML = '';
    displaySearch(contentContainer);
}

export { Search };
