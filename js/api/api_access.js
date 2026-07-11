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

function updateCarousel(recipes) {
    // Filter for recipes with images, shuffle them quickly, and grab the first 3
    const randomRecipes = recipes
        .filter(r => r.bild_url)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

    // Find the 3 existing images and titles currently in your HTML
    const images = document.querySelectorAll('.carousel-hero-img');
    const titles = document.querySelectorAll('.carousel-caption h2');

    // Overwrite their sources and text with the new API data
    randomRecipes.forEach((recipe, i) => {
        if (images[i] && titles[i]) {
            images[i].src = recipe.bild_url;
            titles[i].innerText = recipe.titel;
        }
    });
}