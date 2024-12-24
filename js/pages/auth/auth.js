import { state } from "../../state/state.js";
import { login, signup } from "../../services/auth/authService.js"; // Import login/signup functions


function Auth(contentContainer) {
    displayAuthSection(contentContainer)
}

function displayAuthSection(contentContainer) {
    const authSection = contentContainer;

    // Clear previous content
    authSection.innerHTML = '';

    if (state.token) {
        // Create a welcome message
        const welcomeMessage = document.createElement("h2");
        welcomeMessage.textContent = "Welcome back!";
        authSection.appendChild(welcomeMessage);
    } else {
        // Create the login section
        const loginTitle = document.createElement("h2");
        loginTitle.textContent = "Login";
        authSection.appendChild(loginTitle);

        const loginForm = document.createElement("form");
        loginForm.id = "login-form";
        loginForm.classList = "auth-form";

        const loginUsername = document.createElement("input");
        loginUsername.type = "text";
        loginUsername.id = "login-username";
        loginUsername.placeholder = "Username";
        loginForm.appendChild(loginUsername);

        const loginPassword = document.createElement("input");
        loginPassword.type = "password";
        loginPassword.id = "login-password";
        loginPassword.placeholder = "Password";
        loginForm.appendChild(loginPassword);

        const loginButton = document.createElement("button");
        loginButton.type = "submit";
        loginButton.textContent = "Login";
        loginForm.appendChild(loginButton);

        authSection.appendChild(loginForm);

        // Create the signup section
        const signupTitle = document.createElement("h2");
        signupTitle.textContent = "Signup";
        authSection.appendChild(signupTitle);

        const signupForm = document.createElement("form");
        signupForm.id = "signup-form";
        signupForm.classList = "auth-form";

        const signupUsername = document.createElement("input");
        signupUsername.type = "text";
        signupUsername.id = "signup-username";
        signupUsername.placeholder = "Username";
        signupForm.appendChild(signupUsername);

        const signupEmail = document.createElement("input");
        signupEmail.type = "email";
        signupEmail.id = "signup-email";
        signupEmail.placeholder = "Email";
        signupForm.appendChild(signupEmail);

        const signupPassword = document.createElement("input");
        signupPassword.type = "password";
        signupPassword.id = "signup-password";
        signupPassword.placeholder = "Password";
        signupForm.appendChild(signupPassword);

        const signupButton = document.createElement("button");
        signupButton.type = "submit";
        signupButton.textContent = "Signup";
        signupForm.appendChild(signupButton);

        authSection.appendChild(signupForm);

        // Attach event listeners for the forms
        loginForm.addEventListener("submit", login);
        signupForm.addEventListener("submit", signup);
    }
}


export { Auth };
