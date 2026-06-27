async function includeHTML(selector, file) {
    const container = document.querySelector(selector);
    if (!container) return; // Added safety check so it doesn't crash on recipe card pages
    
    const html = await fetch(file).then(r => r.text());
    container.innerHTML = html;
}

// Wrap the loading in an async sequence so we can control the order
async function loadAllComponents() {
    // 1. Load the navbar first and immediately initialize the theme
    await includeHTML("#navbar", "./components/navbar.html");
    if (typeof initializeThemeToggle === "function") {
        initializeThemeToggle();
    }

    // 2. Load the remaining components afterwards
    await includeHTML("#carousel", "./components/carousel.html");
    await includeHTML("#recipes", "./components/recipes.html");
}

loadAllComponents();