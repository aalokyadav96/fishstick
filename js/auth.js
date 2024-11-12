import { state, API_URL } from "./state.js";
import { escapeHTML, validateInputs, isValidUsername, isValidEmail, isValidPassword, showSnackbar } from "./utils.js";

async function login() {
    const username = escapeHTML(document.getElementById("login-username").value.trim());
    const password = escapeHTML(document.getElementById("login-password").value);

    const errors = validateInputs([
        { value: username, validator: isValidUsername, message: "Username must be between 3 and 20 characters." },
        { value: password, validator: val => !!val, message: "Please enter a password." },
    ]);

    if (errors) {
        showSnackbar(errors);
        return;
    }

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        const res = await response.json();
        if (response.ok) {
            console.log(res);
            state.token = res.data.token;
            console.log(state.token);
            state.user = res.data.userid;
            console.log(state.user);
            localStorage.setItem("token", state.token);
            localStorage.setItem("user", state.user);
            navigate('/');
            renderPage();
        } else {
            showSnackbar(res.message || "Error logging in.");
        }
    } catch (error) {
        showSnackbar("Error logging in. Please try again.");
        console.log(error);
    }
}

async function signup() {
    const username = escapeHTML(document.getElementById("signup-username").value.trim());
    const email = escapeHTML(document.getElementById("signup-email").value.trim());
    const password = escapeHTML(document.getElementById("signup-password").value);

    const errors = validateInputs([
        { value: username, validator: isValidUsername, message: "Username must be between 3 and 20 characters." },
        { value: email, validator: isValidEmail, message: "Please enter a valid email." },
        { value: password, validator: isValidPassword, message: "Password must be at least 6 characters long." },
    ]);

    if (errors) {
        showSnackbar(errors);
        return;
    }

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, email, password }),
        });

        const data = await response.json();
        if (response.ok) {
            showSnackbar("Signup successful! You can now log in.");
            navigate('/login');
            renderPage();
        } else {
            showSnackbar(data.message || "Error signing up.");
        }
    } catch (error) {
        showSnackbar("Error signing up. Please try again.");
    }
}

async function logout() {
    const confirmLogout = confirm("Are you sure you want to log out?");
    if (!confirmLogout) return;

    state.token = null;
    state.user = null;
    state.userProfile = null; // Clear userProfile from state
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userProfile"); // Remove cached profile from localStorage
    renderPage(); // Re-render the page
}

export { login, signup, logout};