import { state } from "../state/state.js";
import { navigate } from "../routes/render.js";

function createNav() {
    const isLoggedIn = Boolean(state.token);

    const navItems = [
        { href: '/', label: 'Home' },
        { href: '/feed', label: 'Feed' },
        { href: '/search', label: 'Search' },
        { href: '/events', label: 'Events' },
        { href: '/places', label: 'Places' },
    ];

    const renderNavItems = items => items.map(item =>
        `<li><a href="${item.href}" class="nav-link">${item.label}</a></li>`
    ).join('');

    // Add "Create" dropdown with "Eva" and "Loca" sub-items
    const createDropdown = `
        <li class="dropdown">
            <button class="dropdown-toggle" id="evaloca">Create</button>
            <div class="dropdown-menu">
                <a href="/create" class="dropdown-item">Eva</a>
                <a href="/place" class="dropdown-item">Loca</a>
            </div>
        </li>
    `;

    const authButton = isLoggedIn
        ? `
            <li class="dropdown">
                <div class="profile-dropdown-toggle"><img src="/userpic/thumb/${state.user + ".jpg" || 'default.png'}" alt="Profile Picture" class="profile-image"/></div>
                <div class="profile-dropdown-menu">
                    <a href="/profile" class="dropdown-item">Profile</a>
                    <a href="/settings" class="dropdown-item">Settings</a>
                    <button class="dropdown-item logout-btn">Logout</button>
                </div>
            </li>`
        : `<li><button class="btn auth-btn">Login</button></li>`;

    return `
        <header class="navbar">
            <div class="navbar-container">
                <div class="logo">
                    <a href="/" class="logo-link">Show Saw</a>
                </div>
                <nav class="nav-menu">
                    <ul class="nav-list">
                        ${createDropdown}
                        ${renderNavItems(navItems)}
                        ${authButton}
                    </ul>
                </nav>
                <div class="mobile-menu-icon">
                    <span class="bar"></span>
                    <span class="bar"></span>
                    <span class="bar"></span>
                </div>
            </div>
        </header>
        <div id="loading" class="loading-overlay" style="display:none;">Loading...</div>
        <div id="snackbar" class="snackbar"></div>
    `;
}


function attachNavEventListeners() {
    // Handle Login button
    const loginButton = document.querySelector('.auth-btn');
    if (loginButton) {
        loginButton.addEventListener('click', () => {
            console.log("Login button clicked");
            navigate('/login');
        });
    }

    // Handle navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigate(link.getAttribute('href'));
        });
    });

    // Mobile menu toggle
    const mobileMenuIcon = document.querySelector('.mobile-menu-icon');
    if (mobileMenuIcon) {
        mobileMenuIcon.addEventListener('click', toggleMobileMenu);
    }

    // Create dropdown toggle
    const createToggle = document.getElementById('evaloca');
    if (createToggle) {
        createToggle.addEventListener('click', (event) => {
            event.preventDefault();
            const dropdownMenu = document.querySelector('.dropdown-menu');
            if (dropdownMenu) {
                dropdownMenu.classList.toggle('show');
            }
        });
    }

    // Profile dropdown toggle
    const profileToggle = document.querySelector('.profile-dropdown-toggle');
    if (profileToggle) {
        profileToggle.addEventListener('click', (event) => {
            event.preventDefault();
            const profileDropdown = document.querySelector('.profile-dropdown-menu');
            if (profileDropdown) {
                profileDropdown.classList.toggle('show');
            }
        });
    }

    // Dropdown item navigation
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navigate(item.getAttribute('href'));
        });
    });

    // Handle Logout button
    const logoutButton = document.querySelector('.logout-btn');
    if (logoutButton) {
        logoutButton.addEventListener('click', async () => {
            await logout();
        });
    }
}

function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    navMenu.classList.toggle('active');
}

function toggleDropdown(event) {
    event.preventDefault();
    const dropdownMenu = document.querySelector('.dropdown-menu');
    dropdownMenu.classList.toggle('show');
}

function toggleProfileDropdown() {
    const dropdownMenu = document.querySelector('.profile-dropdown-menu');
    dropdownMenu.classList.toggle('show');
    console.log("Clicked");
}

export { createNav, attachNavEventListeners, toggleMobileMenu, toggleDropdown, toggleProfileDropdown };
