import { apiFetch } from "../../api/api.js";
import Tooltip from '../../components/ui/Tooltip.mjs';
import Toast from '../../components/ui/Toast.mjs';

// Function to display media for the event
async function displaySearch(searchsec) {
    // let searchsec = document.getElementById("search-section");
    const srchsec = document.createElement("div");
    srchsec.id = "srch";
    searchsec.appendChild(srchsec);
    displaySearchForm(srchsec);
}

async function displaySearchForm(seatmap) {
    // Create search container
    const searchContainer = document.createElement("div");
    searchContainer.classList.add("search-container");

    // Create and append the heading
    const heading = document.createElement("h1");
    heading.textContent = "Find Events and Places";
    searchContainer.appendChild(heading);

    // Create and append the search bar
    const searchInput = document.createElement("input");
    searchInput.id = "search-query";
    searchInput.placeholder = "Search for events, places, or users...";
    searchContainer.appendChild(searchInput);

    // Create and append the filter options container
    const filters = document.createElement("div");
    filters.id = "filters";

    // Category filter
    const categoryFilter = document.createElement("select");
    categoryFilter.id = "category-filter";
    categoryFilter.innerHTML = `
        <option value="">Select Category</option>
        <option value="concert">Concert</option>
        <option value="conference">Conference</option>
        <option value="workshop">Workshop</option>
        <!-- More categories -->
    `;
    filters.appendChild(categoryFilter);

    // Location filter
    const locationFilter = document.createElement("select");
    locationFilter.id = "location-filter";
    locationFilter.innerHTML = `
        <option value="">Select Location</option>
        <option value="New York">New York</option>
        <option value="Los Angeles">Los Angeles</option>
        <option value="Chicago">Chicago</option>
        <!-- More locations -->
    `;
    filters.appendChild(locationFilter);

    // Price range
    const priceRange = document.createElement("input");
    priceRange.type = "range";
    priceRange.id = "price-range";
    priceRange.min = 0;
    priceRange.max = 1000;
    priceRange.step = 10;
    filters.appendChild(priceRange);

    // Price value display
    const priceValue = document.createElement("span");
    priceValue.id = "price-value";
    priceValue.textContent = "$0 - $1000";
    filters.appendChild(priceValue);

    const tooltip = Tooltip('This is a helpful tooltip!');
    filters.appendChild(tooltip);

    // Apply filters button
    const applyFiltersButton = document.createElement("button");
    applyFiltersButton.id = "apply-filters";
    applyFiltersButton.textContent = "Apply Filters";
    applyFiltersButton.onclick = () => Toast('Filters applied successfully!', 'success');
    filters.appendChild(applyFiltersButton);

    searchContainer.appendChild(filters);

    // Create and append the search results container
    const searchResultsContainer = document.createElement("div");
    searchResultsContainer.id = "search-results";
    searchContainer.appendChild(searchResultsContainer);

    // Append search container to the seatmap
    seatmap.appendChild(searchContainer);

    afgjfhgj();
}

function afgjfhgj() {
    // Select DOM elements
    const searchInput = document.getElementById("search-query");
    const categoryFilter = document.getElementById("category-filter");
    const locationFilter = document.getElementById("location-filter");
    const priceRange = document.getElementById("price-range");
    const priceValue = document.getElementById("price-value");
    const applyFiltersButton = document.getElementById("apply-filters");
    const searchResultsContainer = document.getElementById("search-results");

    // Display the selected price range
    priceRange.addEventListener('input', function () {
        priceValue.textContent = `$0 - $${priceRange.value}`;
    });

    // Function to construct the search/filter query
    function buildQuery() {
        return {
            query: searchInput.value,
            category: categoryFilter.value,
            location: locationFilter.value,
            maxPrice: priceRange.value
        };
    }

    // Function to fetch search results from the backend
    async function fetchSearchResults() {
        const queryParams = buildQuery();
        const searchParams = new URLSearchParams(queryParams);
        const data = await apiFetch(`/search?${searchParams.toString()}`);

        displaySearchResults(data);
    }

    // Function to display search results
    function displaySearchResults(data) {
        // Clear previous results
        searchResultsContainer.innerHTML = ''; 

        if (data && data.length > 0) {
            data.forEach(event => {
                const eventCard = document.createElement("div");
                eventCard.classList.add("event-card");

                const eventName = document.createElement("h3");
                eventName.textContent = event.name;
                eventCard.appendChild(eventName);

                const eventCategory = document.createElement("p");
                eventCategory.innerHTML = `<strong>Category:</strong> ${event.category}`;
                eventCard.appendChild(eventCategory);

                const eventLocation = document.createElement("p");
                eventLocation.innerHTML = `<strong>Location:</strong> ${event.location}`;
                eventCard.appendChild(eventLocation);

                const eventPrice = document.createElement("p");
                eventPrice.innerHTML = `<strong>Price:</strong> $${event.price}`;
                eventCard.appendChild(eventPrice);

                searchResultsContainer.appendChild(eventCard);
            });
        } else {
            const noResultsMessage = document.createElement("p");
            noResultsMessage.textContent = "No results found.";
            searchResultsContainer.appendChild(noResultsMessage);
        }
    }

    // Event listener for Apply Filters button
    applyFiltersButton.addEventListener('click', fetchSearchResults);

    // Event listener for the search input (optional)
    searchInput.addEventListener('input', fetchSearchResults);

    // Initial fetch when page loads (optional, you can skip this if you want only search/filter)
    // fetchSearchResults();
}

export { displaySearch, displaySearchForm };
