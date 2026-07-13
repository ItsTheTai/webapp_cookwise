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

function updateCarousel(recipes) {
    const randomRecipes = recipes
        .filter(r => r.bild_url)
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

    // Grab the new links, alongside the images and titles
    const links = document.querySelectorAll('.carousel-link');
    const images = document.querySelectorAll('.carousel-hero-img');
    const titles = document.querySelectorAll('.carousel-caption h2');

    randomRecipes.forEach((recipe, i) => {
        if (images[i] && titles[i] && links[i]) {
            images[i].src = recipe.bild_url;
            titles[i].innerText = recipe.titel;

            // Set the clickable URL using the recipe ID
            links[i].href = `rezeptkarte_2.html?id=${recipe.id}`;
        }
    });
}