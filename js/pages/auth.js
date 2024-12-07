import { state } from "../state/state.js";
import { login, signup } from "../services/auth.js"; // Import login/signup functions

function displayAuthSection() {
    const authSection = document.getElementById("auth-section");

    if (state.token) {
        authSection.innerHTML = `<h2>Welcome back!</h2>`;
    } else {
        authSection.innerHTML = `
            <h2>Login</h2>
            <form id="login-form">
                <input type="text" id="login-username" placeholder="Username" />
                <input type="password" id="login-password" placeholder="Password" />
                <button type="submit">Login</button>
            </form>

            <h2>Signup</h2>
            <form id="signup-form">
                <input type="text" id="signup-username" placeholder="Username" />
                <input type="email" id="signup-email" placeholder="Email" />
                <input type="password" id="signup-password" placeholder="Password" />
                <button type="submit">Signup</button>
            </form>
        `;

        // Attach event listeners for the forms
        document.getElementById("login-form").addEventListener("submit", login);
        document.getElementById("signup-form").addEventListener("submit", signup);
    }
}

export { displayAuthSection };
