async function renderPageContent(path, contentContainer) {
    // Route Handlers (Static Routes)
    const routeHandlers = {
        "/": async () => {
            const { Home } = await import("../pages/home.js");
            contentContainer.innerHTML = ""; // Clear previous page content
            Home(contentContainer);
        },
        "/login": async () => {
            const { Auth } = await import("../pages/auth/auth.js");
            contentContainer.innerHTML = "";
            Auth(contentContainer);
        },
        "/create-event": async () => {
            const { Create } = await import("../pages/events/createEvent.js");
            contentContainer.innerHTML = "";
            Create(contentContainer);
        },
        "/create-place": async () => {
            const { CreatePlace } = await import("../pages/places/createPlace.js");
            contentContainer.innerHTML = "";
            CreatePlace(contentContainer);
        },
        "/profile": async () => {
            const { UserProfile } = await import("../pages/profile/userProfile.js");
            contentContainer.innerHTML = "";
            UserProfile(contentContainer);
        },
        "/events": async () => {
            const { Events } = await import("../pages/events/events.js");
            contentContainer.innerHTML = "";
            Events(contentContainer);
        },
        "/places": async () => {
            const { Places } = await import("../pages/places/places.js");
            contentContainer.innerHTML = "";
            Places(contentContainer);
        },
        "/search": async () => {
            const { Search } = await import("../pages/search.js");
            contentContainer.innerHTML = "";
            Search(contentContainer);
        },
        "/settings": async () => {
            const { Settings } = await import("../pages/profile/settings.js");
            contentContainer.innerHTML = "";
            Settings(contentContainer);
        },
        "/feed": async () => {
            const { Feed } = await import("../pages/feed.js");
            contentContainer.innerHTML = "";
            Feed(contentContainer);
        },
    };

    // Dynamic Routes (Pattern Matching)
    const dynamicRoutes = [
        {
            pattern: /^\/user\/([\w-]+)$/,
            handler: async (matches) => {
                const { displayUserProfile } = await import("../pages/profile/userProfile.js");
                await displayUserProfile(contentContainer, matches[1]);
            },
        },
        {
            pattern: /^\/event\/([\w-]+)$/,
            handler: async (matches) => {
                const { Event } = await import("../pages/events/eventPage.js");
                try {
                    contentContainer.innerHTML = "";
                    Event(matches[1], contentContainer);
                } catch {
                    content.innerHTML = `<h1>Event Not Found</h1>`;
                }
            },
        },
        {
            pattern: /^\/place\/([\w-]+)$/,
            handler: async (matches) => {
                const { Place } = await import("../pages/places/placePage.js");
                try {
                    // await Place(matches[1]);
                    Place(matches[1],content);
                } catch {
                    content.innerHTML = `<h1>Place Not Found</h1>`;
                }
            },
        },
    ];

    // Match static routes
    const handler = routeHandlers[path];
    if (handler) {
        await handler();
    } else {
        // Match dynamic routes
        for (const route of dynamicRoutes) {
            const matches = path.match(route.pattern);
            if (matches) {
                await route.handler(matches);
                return;
            }
        }
        // If no route matches, show 404
        content.innerHTML = `<h1>404 Not Found</h1>`;
    }
}

export { renderPageContent };