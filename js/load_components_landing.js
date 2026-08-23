// Loads an external HTML file into a target element.
function includeHTML(selector, file, callback) {
    const container = document.querySelector(selector);

    // If the target element doesn't exist, stop silently
    if (!container) return;
    // Fetch the external HTML fil
    fetch(file)
        .then(response => response.text())
        .then(html => {
            // Insert the HTML into the selected element
            container.innerHTML = html;
            // Run callback if provided
            if (callback) callback();
        });
}

includeHTML("#navbar", "./components/navbar_landing_api.html", function () {

    if (typeof initializeThemeToggle === "function") {
        initializeThemeToggle();
    }

    includeHTML("#carousel", "./components/carousel.html");
    includeHTML("#recipes", "./components/recipes_api.html");
});