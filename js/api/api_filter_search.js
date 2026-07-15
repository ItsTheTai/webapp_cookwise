// 1. Storage for our selected filters and search term
const activeFilters = {
    kategorie: '',
    kueche: '',
    schwierigkeitsgrad: '',
    oekobilanz: '',
    max_zeit: '',
    min_portionen: '',
    max_portionen: ''
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

async function fetchSearchPages(url) {

    // Store all recipes from all pages here
    let results = [];
    let nextUrl = url;

    // Continue as long as the API gives us another page
    while (nextUrl) {
        const response = await fetch(nextUrl);

        if (!response.ok) {
            throw new Error(`Server Response mit Status: ${response.status}`);
        }

        // Convert the JSON response into a JavaScript object
        const data = await response.json();

        results = results.concat(data.results || data);

        nextUrl = data.next || null;
    }

    return results;
}

// Main search function triggered when clicking the magnifying glass
async function sendSearchRequest() {

    // Define search input from the input field
    const searchInput = document.querySelector('input[type="search"]')
        ?.value.trim() || '';

    try {
        const params = new URLSearchParams();

        // Add all active filters
        for (const [key, value] of Object.entries(activeFilters)) {
            if (value) {
                params.append(key, value);
            }
        }

        const searchUrl = `${baseUrl}?${params.toString()}&search=${encodeURIComponent(searchInput)}`;
        const zutatUrl = `${baseUrl}?${params.toString()}&zutat=${encodeURIComponent(searchInput)}`;

        // Run requests for zutat and search at the same time
        const [searchResults, zutatResults] = await Promise.all([
            fetchSearchPages(searchUrl),
            fetchSearchPages(zutatUrl)
        ]);

        // Merge results and remove duplicates
        const allResults = Array.from(
            new Map(
                [...searchResults, ...zutatResults]
                    .map(recipe => [recipe.id, recipe])
            ).values()
        );

        if (allResults.length === 0) {
            displayNoResultsMessage();
            return;
        }

        renderRecipes(allResults);

    } catch (error) {
        console.error("API Call fehlgeschlagen:", error);
        displayErrorMessage();
    }
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

// Doing search using enter key
document.addEventListener('keydown', function (event) {

    // Check if the key pressed was 'Enter'
    if (event.key === 'Enter') {

        // Find out exactly which element the user is typing in right now
        const activeElement = document.activeElement;

        // Check if they are focused on specific search input.
        if (activeElement && activeElement.matches('input[type="search"].search-custom')) {

            // Stop the browser from refreshing the page if it's inside a form
            event.preventDefault();

            // Fire search function
            sendSearchRequest();
        }
    }
});