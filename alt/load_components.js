function includeHTML(selector, file, callback) {
    const container = document.querySelector(selector);
    if (!container) return;

    fetch(file)
        .then(response => response.text())
        .then(html => {
            container.innerHTML = html;
            if (callback) callback();
        });
}

includeHTML("#navbar", "./components/navbar_api.html", function () {

    if (typeof initializeThemeToggle === "function") {
        initializeThemeToggle();
    }

    includeHTML("#carousel", "./components/carousel.html");
    includeHTML("#recipes", "./components/recipes_api.html");
});