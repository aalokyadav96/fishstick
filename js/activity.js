import { showSnackbar } from "./utils.js";

let activityAbortController;

async function logActivity(activityDescription) {
    if (!state.token) {
        showSnackbar("Please log in to log activities.");
        return;
    }

    const activity = {
        action: activityDescription,
        timestamp: new Date().toISOString()
    };

    // Abort the previous logActivity fetch if it's still ongoing
    if (activityAbortController) {
        activityAbortController.abort();
    }

    activityAbortController = new AbortController(); // Create a new instance
    const signal = activityAbortController.signal; // Get the signal to pass to fetch

    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${state.token}`
    };

    try {
        const response = await fetch('/api/activity', {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(activity),
            signal: signal
        });

        // Check if the response has content before parsing it
        if (response.ok) {
            const responseData = await response.text(); // Read the response as plain text
            if (responseData) {
                const jsonData = JSON.parse(responseData); // Only parse if there is content
                showSnackbar("Activity logged successfully.");
                console.log(jsonData); // Log the JSON response for debugging
            } else {
                showSnackbar("Activity logged successfully, but no response body.");
            }
        } else {
            const errorData = await response.json();
            console.error(`Failed to log activity: ${errorData.message || 'Unknown error'}`);
            showSnackbar(`Failed to log activity: ${errorData.message || 'Unknown error'}`);
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Activity log aborted');
            return; // Do nothing for aborted fetch
        }

        console.error(`Failed to log activity: ${error.message || 'Unknown error'}`);
        showSnackbar(`Failed to log activity: ${error.message || 'Unknown error'}`);
    }
}


export { logActivity };