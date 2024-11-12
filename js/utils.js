
// Utility function to escape HTML to prevent XSS
function escapeHTML(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

function validateInputs(inputs) {
    const errors = [];

    inputs.forEach(({ value, validator, message }) => {
        if (!validator(value)) {
            errors.push(message);
        }
    });

    return errors.length ? errors.join('\n') : null;
}

// Example validators
const isValidUsername = username => username.length >= 3 && username.length <= 20;
const isValidEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPassword = password => password.length >= 6;


function showSnackbar(message) {
    const snackbar = document.getElementById("snackbar");
    snackbar.textContent = message;
    snackbar.className = "snackbar show";

    // After 3 seconds, remove the show class from the snackbar
    setTimeout(() => {
        snackbar.className = snackbar.className.replace("show", "");
    }, 3000);
}


function handleError(errorMessage) {
    console.error(errorMessage);
}

export { escapeHTML, validateInputs, isValidUsername, isValidEmail, isValidPassword, showSnackbar, handleError };