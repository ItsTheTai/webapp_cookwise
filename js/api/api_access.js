const startUrl = "https://recipes.digitalhumanities.io/api/rezepte/?format=json";

// 1. Create an empty array to collect all recipes across pages
let allRecipes = [];

function fetchAllPages(url) {
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Combine the recipes from this page into our master list
            allRecipes = allRecipes.concat(data.results);

            // Check if there is a next page
            if (data.next) {
                console.log(`Fetching next page: ${data.next}`);
                // Recursively fetch the next page URL provided by the API
                fetchAllPages(data.next);
            } else {
                // No more pages! We have the full dataset.
                console.log(`Finished loading. Total recipes fetched: ${allRecipes.length}`);

                // Render the complete grid and build dropdowns with ALL recipes
                renderRecipes(allRecipes);
                populateDropdowns(allRecipes);
                // Overwrite the static carousel with random data
                updateCarousel(allRecipes);
            }
        })
        .catch(error => {
            console.error("Error fetching paginated data:", error);
        });
}

// Kick off the initial request
fetchAllPages(startUrl);