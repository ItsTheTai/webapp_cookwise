// 1. Storage for our selected filters and search term
const activeFilters = {
    kategorie: '',
    kueche: '',
    schwierigkeitsgrad: '',
    oekobilanz: '',
    max_zeit: '',
    min_portionen: '',
    max_portionen: '',
    zutat: ''
};

const baseUrl = "https://recipes.digitalhumanities.io/api/rezepte/";

const defaultButtonTexts = {
    kategorie: 'Gerichttyp',
    kueche: 'Länderküche',
    schwierigkeitsgrad: 'Schwierigkeit',
    oekobilanz: 'Ökobilanz',
    max_zeit: 'Zubereitungszeit'
};

// Toggles a filter on/off when a user clicks a dropdown option. Click handler stages the options in memory and switches button text
function filterBy(key, value) {
    const buttonElement = document.getElementById(`btn-${key}`);

    if (activeFilters[key] === value) {
        activeFilters[key] = '';
        if (buttonElement) {
            buttonElement.textContent = defaultButtonTexts[key];
            // Remove the active style when filter is cleared
            buttonElement.classList.remove('active');
        }
    } else {
        activeFilters[key] = value;
        if (buttonElement) {
            if (key === 'max_zeit') {
                buttonElement.textContent = `<${value} Min`;
            } else {
                buttonElement.textContent = value;
            }
            // Add the active style when a filter is applied
            buttonElement.classList.add('active');
        }
    }
    console.log("Staged filters:", activeFilters);
}


// Main search function triggered when clicking the magnifying glass
async function sendSearchRequest() {
    const searchInput = document.querySelector('input[type="search"]')?.value || '';
    activeFilters.search = searchInput.trim();

    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(activeFilters)) {
        if (value) params.append(key, value);
    }

    let nextUrl = `${baseUrl}?${params.toString()}`;
    let allRecipes = [];

    // 1. Wrap the API call in a try/catch block to handle network/server errors
    try {
        while (nextUrl) {
            const response = await fetch(nextUrl);

            // Check if the server responded with an error status (e.g., 404, 500)
            if (!response.ok) {
                throw new Error(`Server Response mit Status: ${response.status}`);
            }

            const data = await response.json();
            const pageResults = data.results || data;
            allRecipes = allRecipes.concat(pageResults);

            nextUrl = data.next || null;
        }

        // 2. Check if any recipes were found
        if (allRecipes.length === 0) {
            displayNoResultsMessage();
            return; // Stop execution here
        }

        // If we have recipes, render them normally
        if (typeof renderRecipes === 'function') {
            renderRecipes(allRecipes);
        } else {
            console.error("renderRecipes() function is missing.");
        }

    } catch (error) {
        // 3. This block runs if the API is offline, or a network error occurs
        console.error("API Call fehlgeschlagen:", error);
        displayErrorMessage();
    }
}

// Doing search using enter key
const searchInputField = document.querySelector('input[type="search"]');

if (searchInputField) {
    searchInputField.addEventListener('keydown', function (event) {
        if (event.key === 'Enter') {
            sendSearchRequest();
        }
    });
}

// Call this when the API returns an empty array
function displayNoResultsMessage() {
    const container = document.getElementById('recipe-container'); // Change to your actual container ID
    if (container) {
        container.innerHTML = `
            <div class="main-logo-font">
                <h3>Keine Rezepte gefunden</h3>
                <p>Gib einen anderen Suchbegriff ein oder passe deine Filter an.</p>
            </div>
        `;
    }
}

// Call this when fetch fails entirely (API offline, network disconnected)
function displayErrorMessage() {
    const container = document.getElementById('recipe-container'); // Change to your actual container ID
    if (container) {
        container.innerHTML = `
            <div class="main-logo-font">
                <h3>Verbindung fehlgeschlagen</h3>
                <p>Das Kochbuch ist zurzeit nicht erreichbar. Bitte versuche es später noch einmal.</p>
            </div>
        `;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Find the search input element on the page
    const searchInput = document.querySelector('input[type="search"]');

    // Make sure the input actually exists before adding the listener
    if (searchInput) {
        searchInput.addEventListener("keydown", (event) => {
            // Check if the key pressed was 'Enter'
            if (event.key === "Enter") {
                // Prevent the default browser behavior (like reloading the page)
                event.preventDefault();

                // Run your existing search function!
                sendSearchRequest();
            }
        });
    }
});