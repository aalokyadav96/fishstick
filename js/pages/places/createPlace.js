import { createPlaceForm } from '../../services/place/createPlaceService.js';

function CreatePlace(contentContainer) {
    console.log("dfgrhg");
    contentContainer.innerHTML = '';
    const content = document.createElement("div");
    content.classList = "create-place-section";
    contentContainer.appendChild(content);

    createPlaceForm(content)    
}

export { CreatePlace };
