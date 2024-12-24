import { apiFetch } from "../../api/api";

let abortController; // Keep this scoped to the function if it’s needed only for `fetchEvents`

async function fetchPlaces() {
    // Abort the previous fetch if it's still ongoing
    if (abortController) {
        abortController.abort();
    }

    abortController = new AbortController(); // Create a new instance
    const signal = abortController.signal; // Get the signal to pass to apiFetch

    try {
        // Use apiFetch with the 'GET' method and pass the signal for aborting
        const places = await apiFetch('/places', 'GET', null, { signal });
        return places;
    } catch (error) {
        // If error is due to abort, return null
        if (error.name === 'AbortError') {
            console.log('Fetch aborted');
            return null;
        }
        console.error(error);

        Snackbar(`Error fetching places: ${error.message || 'Unknown error'}`, 3000);
        return null; // Return null for other errors
    }
}

export {fetchPlaces};