import { fetchPlaces } from "./fetchPlaces";
import Snackbar from '../../components/ui/Snackbar.mjs';
import { createElement } from "./createPlaceService.js";

// Function to display the list of places
async function displayPlaces(content) {
    // const content = document.getElementById("places");
    // content.innerHTML = ""; // Clear existing content

    try {
        const places = await fetchPlaces();

        if (!places || places.length === 0) {
            content.appendChild(createElement('h2', {}, ["No places available."]));
            return;
        }

        places.forEach(place => {
            const placeCard = createPlaceCard(place);
            content.appendChild(placeCard);
        });
    } catch (error) {

        Snackbar("Error fetching places. Please try again later.", 3000);
    }
}


// Function to create a card for each place
function createPlaceCard(place) {
    return createElement('div', { class: 'place' }, [
        createElement('a', { href: `/place/${place.placeid}` }, [
            createElement('h1', {}, [place.name]),
            createElement('img', {
                src: `/placepic/${place.banner}`,
                alt: `${place.name} Banner`,
                style: "width: 100%; max-height: 300px; object-fit: cover;"
            }),
            createElement('p', {}, [createElement('strong', {}, ["Address: "]), place.address]),
            createElement('p', {}, [createElement('strong', {}, ["Description: "]), place.description])]),
    ]);
}

export {displayPlaces, createPlaceCard};