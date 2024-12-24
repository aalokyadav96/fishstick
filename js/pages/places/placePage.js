import { displayPlace } from '../../services/place/placeService.js';

function Place(placeid, contentContainer) {
    console.log("dfgrhg");
    contentContainer.innerHTML = '';
    displayPlace(placeid, contentContainer)
}

export { Place };
