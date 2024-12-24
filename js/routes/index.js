import { createNav, attachNavEventListeners } from "../components/navigation.js";
import { renderPageContent } from "./render.js";

async function loadContent(url) {
    const app = document.getElementById("app");
    app.innerHTML = ""; // Clear previous content

    // Create Main Content Section
    const main = document.createElement("main");
    main.id = "content"; // Page content will load here

    // Create Footer
    const footer = document.createElement("footer");
    const footerText = document.createElement("p");
    footerText.textContent = "© 2024 My SPA Platform";
    footer.appendChild(footerText);

    // Append all sections to the app container
    app.appendChild(createNav());
    app.appendChild(main);
    app.appendChild(footer);

    attachNavEventListeners();

    // Load initial page content (e.g., homepage)
    const path = url || window.location.pathname;
    await renderPageContent(path, main);
}

function navigate(url) {
    history.pushState(null, "", url);
    loadContent(url);
}

// // Listen for browser navigation (back/forward)
// window.addEventListener("popstate", async () => {
//     await loadContent(window.location.pathname);
// });

// Initial Render
async function renderPage() {
    await loadContent(window.location.pathname);
}

export { navigate, renderPage, loadContent };