import { API_URL, state } from "../state/state.js";
import { refreshToken } from "../services/auth.js";

async function apiFetch(endpoint, method = "GET", body = null, options = {}) {
    // document.getElementById('loading').style.display = 'block';

    const fetchOptions = {
        method,
        headers: {
            "Authorization": `Bearer ${state.token}`,
            // Do not set Content-Type for FormData
        },
        body: body || undefined,
        signal: options.signal, // Include the signal for aborting
    };

    // If the body is FormData, remove Content-Type header
    if (body instanceof FormData) {
        delete fetchOptions.headers['Content-Type'];
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, fetchOptions);
        if (response.ok) {
            const text = await response.text(); // Get response as text
            return text ? JSON.parse(text) : null; // Parse JSON if there's content
        } else if (response.status === 401) {
            const refreshed = await refreshToken();
            if (refreshed) {
                options.headers["Authorization"] = `Bearer ${state.token}`;
                response = await fetch(`${API_URL}${endpoint}`, fetchOptions);
            }
        } else {
            const errorData = await response.text(); // Get error message as text
            throw new Error(errorData || 'Unknown error');
        }
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        throw error; // Rethrow for further handling
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

export { apiFetch };