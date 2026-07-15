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

includeHTML("#navbar", "html/components/navbar_api.html", function () {

    if (typeof initializeThemeToggle === "function") {
        initializeThemeToggle();
    }

    includeHTML("#carousel", "html/components/carousel.html");
    includeHTML("#recipes", "html/components/recipes_api.html");
});