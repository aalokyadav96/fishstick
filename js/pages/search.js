import { apiFetch } from "../api/api.js";


// Function to display media for the event
async function displaySearch() {
    let searchsec = document.getElementById("search-section");
    searchsec.innerHTML = `<div id='srch'></div>`;
    let srchsec = document.getElementById("srch");
    displaySearchForm(srchsec);
}

async function displaySearchForm(seatmap) {
    seatmap.innerHTML = `
<div class="search-container">
<h1>Find Events and Places</h1>

<!-- Search Bar -->
<input type="text" id="search-query" placeholder="Search for events, places, or users..." />

<!-- Filter Options -->
<div id="filters">
  <select id="category-filter">
    <option value="">Select Category</option>
    <option value="concert">Concert</option>
    <option value="conference">Conference</option>
    <option value="workshop">Workshop</option>
    <!-- More categories -->
  </select>

  <select id="location-filter">
    <option value="">Select Location</option>
    <option value="New York">New York</option>
    <option value="Los Angeles">Los Angeles</option>
    <option value="Chicago">Chicago</option>
    <!-- More locations -->
  </select>

  <input type="range" id="price-range" min="0" max="1000" step="10" />
  <span id="price-value">$0 - $1000</span>

  <button id="apply-filters">Apply Filters</button>
</div>

<!-- Search Results -->
<div id="search-results">
  <!-- Dynamically populated search results will appear here -->
</div>
</div>`;
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
        searchResultsContainer.innerHTML = ''; // Clear previous results

        if (data && data.length > 0) {
            data.forEach(event => {
                const eventCard = document.createElement("div");
                eventCard.classList.add("event-card");

                eventCard.innerHTML = `
        <h3>${event.name}</h3>
        <p><strong>Category:</strong> ${event.category}</p>
        <p><strong>Location:</strong> ${event.location}</p>
        <p><strong>Price:</strong> $${event.price}</p>
      `;

                searchResultsContainer.appendChild(eventCard);
            });
        } else {
            searchResultsContainer.innerHTML = `<p>No results found.</p>`;
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