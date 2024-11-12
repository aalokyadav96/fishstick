import { state } from "./state.js";


function createNav() {
    const isLoggedIn = Boolean(state.token);

    const navItems = [
        { href: '/', label: 'Home' },
        { href: '/feed', label: 'Feed' },
        { href: '/events', label: 'Events' },
        { href: '/places', label: 'Places' },
    ];

    const renderNavItems = items => items.map(item =>
        `<li><a href="${item.href}" class="nav-link" onclick="navigate('${item.href}'); return false;">${item.label}</a></li>`
    ).join('');

    // Add "Create" dropdown with "Eva" and "Loca" sub-items
    const createDropdown = `
        <li class="dropdown">
            <button class="nav-link dropdown-toggle" onclick="toggleDropdown(); return false;">Create</button>
            <div class="dropdown-menu">
                <a href="/create" class="dropdown-item" onclick="navigate('/create'); return false;">Eva</a>
                <a href="/place" class="dropdown-item" onclick="navigate('/place'); return false;">Loca</a>
            </div>
        </li>
    `;

    const authButton = isLoggedIn
        ? `
            <li class="dropdown">
                <button class="nav-link dropdown-toggle" onclick="toggleProfileDropdown(); return false;">Profile</button>
                <div class="profile-dropdown-menu">
                    <a href="/profile" class="dropdown-item" onclick="navigate('/profile'); return false;">Profile</a>
                    <a href="/settings" class="dropdown-item" onclick="navigate('/settings'); return false;">Settings</a>
                    <button class="dropdown-item" onclick="window.logout()">Logout</button>
                </div>
            </li>`
        : `<li><button class="btn auth-btn" onclick="navigate('/login'); return false;">Login</button></li>`;

    return `
        <header class="navbar">
            <div class="navbar-container">
                <div class="logo">
                    <a href="/" class="logo-link">Show Saw</a>
                </div>
                <nav class="nav-menu">
                    <ul class="nav-list">
                        ${renderNavItems(navItems)}
                        ${createDropdown} <!-- Add Create Dropdown here -->
                        ${authButton}
                    </ul>
                </nav>
                <div class="mobile-menu-icon" onclick="toggleMobileMenu(); return false;">
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

// Add mobile menu toggle functionality
function toggleMobileMenu() {
    const navMenu = document.querySelector('.nav-menu');
    navMenu.classList.toggle('active');
}

// Dropdown toggle function
function toggleDropdown() {
    const dropdownMenu = document.querySelector('.dropdown-menu');
    dropdownMenu.classList.toggle('show');
}

// Dropdown toggle function
function toggleProfileDropdown() {
    const dropdownMenu = document.querySelector('.profile-dropdown-menu');
    dropdownMenu.classList.toggle('show');
}

export { createNav, toggleMobileMenu, toggleDropdown, toggleProfileDropdown };


// // Your existing `createNav` function will look like this:
// async function createNav() {
//     const isLoggedIn = Boolean(state.token);

//     const navItems = [
//         { href: '/', label: 'Home' },
//         { href: '/events', label: 'Events' },
//         { href: '/places', label: 'Places' },
//     ];

//     const renderNavItems = items => items.map(item =>
//         `<li><a href="${item.href}" class="nav-link" onclick="navigate('${item.href}'); return false;">${item.label}</a></li>`
//     ).join('');

//     const createDropdown = `
//         <li class="dropdown">
//             <button class="nav-link dropdown-toggle" onclick="toggleDropdown()">Create</button>
//             <div class="dropdown-menu">
//                 <a href="/create" class="dropdown-item" onclick="navigate('/create'); return false;">Eva</a>
//                 <a href="/place" class="dropdown-item" onclick="navigate('/place'); return false;">Loca</a>
//             </div>
//         </li>
//     `;

//     const authButton = isLoggedIn
//         ? `
//             <li class="dropdown">
//                 <button class="nav-link dropdown-toggle" onclick="toggleProfileDropdown()">Profile</button>
//                 <div class="profile-dropdown-menu">
//                     <a href="/profile" class="dropdown-item" onclick="navigate('/profile'); return false;">Profile</a>
//                     <a href="/settings" class="dropdown-item" onclick="navigate('/settings'); return false;">Settings</a>
//                     <button class="dropdown-item" onclick="window.logout()">Logout</button>
//                 </div>
//             </li>`
//         : `<li><button class="btn auth-btn" onclick="navigate('/login'); return false;">Login</button></li>`;

//     return `
//         <header class="navbar">
//             <div class="navbar-container">
//                 <div class="logo">
//                     <a href="/" class="logo-link">Show Saw</a>
//                 </div>
//                 <nav class="nav-menu">
//                     <ul class="nav-list">
//                         ${renderNavItems(navItems)}
//                         ${createDropdown}
//                         ${authButton}
//                     </ul>
//                 </nav>
//                 <div class="mobile-menu-icon" onclick="toggleMobileMenu()">
//                     <span class="bar"></span>
//                     <span class="bar"></span>
//                     <span class="bar"></span>
//                 </div>
//             </div>
//         </header>
//         <div id="loading" class="loading-overlay" style="display:none;">Loading...</div>
//         <div id="snackbar" class="snackbar"></div>
//     `;
// }

// // Your existing `createNav` function will look like this:
// function createNav() {
//     const isLoggedIn = Boolean(state.token);

//     const navItems = [
//         { href: '/', label: 'Home' },
//         { href: '/events', label: 'Events' },
//         { href: '/places', label: 'Places' },
//     ];

//     const renderNavItems = items => items.map(item =>
//         `<li><a href="${item.href}" class="nav-link" onclick="navigate('${item.href}'); return false;">${item.label}</a></li>`
//     ).join('');

//     const createDropdown = `
//         <li class="dropdown">
//             <button class="nav-link dropdown-toggle" onclick="toggleDropdown()">Create</button>
//             <div class="dropdown-menu">
//                 <a href="/create" class="dropdown-item" onclick="navigate('/create'); return false;">Eva</a>
//                 <a href="/place" class="dropdown-item" onclick="navigate('/place'); return false;">Loca</a>
//             </div>
//         </li>
//     `;

//     const authButton = isLoggedIn
//         ? `
//             <li class="dropdown">
//                 <button class="nav-link dropdown-toggle" onclick="toggleProfileDropdown()">Profile</button>
//                 <div class="profile-dropdown-menu">
//                     <a href="/profile" class="dropdown-item" onclick="navigate('/profile'); return false;">Profile</a>
//                     <a href="/settings" class="dropdown-item" onclick="navigate('/settings'); return false;">Settings</a>
//                     <button class="dropdown-item" onclick="window.logout()">Logout</button>
//                 </div>
//             </li>`
//         : `<li><button class="btn auth-btn" onclick="navigate('/login'); return false;">Login</button></li>`;

//     return `
//         <header class="navbar">
//             <div class="navbar-container">
//                 <div class="logo">
//                     <a href="/" class="logo-link">Show Saw</a>
//                 </div>
//                 <nav class="nav-menu">
//                     <ul class="nav-list">
//                         ${renderNavItems(navItems)}
//                         ${createDropdown}
//                         ${authButton}
//                     </ul>
//                 </nav>
//                 <div class="mobile-menu-icon" onclick="toggleMobileMenu()">
//                     <span class="bar"></span>
//                     <span class="bar"></span>
//                     <span class="bar"></span>
//                 </div>
//             </div>
//         </header>
//         <div id="loading" class="loading-overlay" style="display:none;">Loading...</div>
//         <div id="snackbar" class="snackbar"></div>
//     `;
// }


// import { state } from "./state.js";

// function createNav() {
//     const isLoggedIn = Boolean(state.token);

//     const navItems = [
//         { href: '/', label: 'Home' },
//         { href: '/events', label: 'Events' },
//         { href: '/places', label: 'Places' },
//     ];

//     const renderNavItems = items => items.map(item =>
//         `<li><a href="${item.href}" class="nav-link" onclick="navigate('${item.href}')">${item.label}</a></li>`
//     ).join('');

//     // Add "Create" dropdown with "Eva" and "Loca" sub-items
//     const createDropdown = `
//         <li class="dropdown">
//             <button class="nav-link dropdown-toggle" onclick="toggleDropdown()">Create</button>
//             <div class="dropdown-menu">
//                 <a href="/create" class="dropdown-item" onclick="navigate('/create')">Eva</a>
//                 <a href="/place" class="dropdown-item" onclick="navigate('/place')">Loca</a>
//             </div>
//         </li>
//     `;

//     const authButton = isLoggedIn
//         ? `
//             <li class="dropdown">
//                 <button class="nav-link dropdown-toggle" onclick="toggleProfileDropdown()">Profile</button>
//                 <div class="profile-dropdown-menu">
//                     <a href="/profile" class="dropdown-item" onclick="navigate('/profile')">Profile</a>
//                     <a href="/settings" class="dropdown-item" onclick="navigate('/settings')">Settings</a>
//                     <button class="dropdown-item" onclick="window.logout()">Logout</button>
//                 </div>
//             </li>`
//         : `<li><button class="btn auth-btn" onclick="navigate('/login')">Login</button></li>`;

//     return `
//         <header class="navbar">
//             <div class="navbar-container">
//                 <div class="logo">
//                     <a href="/" class="logo-link">Show Saw</a>
//                 </div>
//                 <nav class="nav-menu">
//                     <ul class="nav-list">
//                         ${renderNavItems(navItems)}
//                         ${createDropdown} <!-- Add Create Dropdown here -->
//                         ${authButton}
//                     </ul>
//                 </nav>
//                 <div class="mobile-menu-icon" onclick="toggleMobileMenu()">
//                     <span class="bar"></span>
//                     <span class="bar"></span>
//                     <span class="bar"></span>
//                 </div>
//             </div>
//         </header>
//         <div id="loading" class="loading-overlay" style="display:none;">Loading...</div>
//         <div id="snackbar" class="snackbar"></div>
//     `;
// }

// // Add mobile menu toggle functionality
// function toggleMobileMenu() {
//     const navMenu = document.querySelector('.nav-menu');
//     navMenu.classList.toggle('active');
// }

// // Dropdown toggle function
// function toggleDropdown() {
//     const dropdownMenu = document.querySelector('.dropdown-menu');
//     dropdownMenu.classList.toggle('show');
// }

// // Dropdown toggle function
// function toggleProfileDropdown() {
//     const dropdownMenu = document.querySelector('.profile-dropdown-menu');
//     dropdownMenu.classList.toggle('show');
// }

// export { createNav, toggleMobileMenu, toggleDropdown, toggleProfileDropdown };


// import { state} from "./state.js";

// function createNav() {
//     const isLoggedIn = Boolean(state.token);

//     const navItems = [
//         { href: '/', label: 'Home' },
//         { href: '/events', label: 'Events' },
//         { href: '/places', label: 'Places' },
//         { href: '/create', label: 'Eva' },
//         { href: '/place', label: 'Loca' },
//     ];

//     const renderNavItems = items => items.map(item =>
//         `<li><a href="${item.href}" class="nav-link" onclick="navigate('${item.href}')">${item.label}</a></li>`
//     ).join('');

//     const authButton = isLoggedIn
//         ? `
//             <li class="dropdown">
//                 <button class="nav-link dropdown-toggle" onclick="toggleDropdown()">Profile</button>
//                 <div class="dropdown-menu">
//                     <a href="/profile" class="dropdown-item" onclick="navigate('/profile')">Profile</a>
//                     <a href="/settings" class="dropdown-item" onclick="navigate('/settings')">Settings</a>
//                     <button class="dropdown-item" onclick="window.logout()">Logout</button>
//                 </div>
//             </li>`
//         : `<li><button class="btn auth-btn" onclick="navigate('/login')">Login</button></li>`;

//     return `
//         <header class="navbar">
//             <div class="navbar-container">
//                 <div class="logo">
//                     <a href="/" class="logo-link">Show Saw</a>
//                 </div>
//                 <nav class="nav-menu">
//                     <ul class="nav-list">
//                         ${renderNavItems(navItems)}
//                         ${authButton}
//                     </ul>
//                 </nav>
//                 <div class="mobile-menu-icon" onclick="toggleMobileMenu()">
//                     <span class="bar"></span>
//                     <span class="bar"></span>
//                     <span class="bar"></span>
//                 </div>
//             </div>
//         </header>
//         <div id="loading" class="loading-overlay" style="display:none;">Loading...</div>
//         <div id="snackbar" class="snackbar"></div>
//     `;
// }

// // Add mobile menu toggle functionality
// function toggleMobileMenu() {
//     const navMenu = document.querySelector('.nav-menu');
//     navMenu.classList.toggle('active');
// }

// // Dropdown toggle function
// function toggleDropdown() {
//     const dropdownMenu = document.querySelector('.dropdown-menu');
//     dropdownMenu.classList.toggle('show');
// }


// export {createNav, toggleMobileMenu, toggleDropdown}