async function includeHTML(selector, file) {
    const container = document.querySelector(selector);
    const html = await fetch(file).then(r => r.text());
    container.innerHTML = html;
    initializeThemeToggle();
}

includeHTML("#navbar", "./components/navbar.html");
includeHTML("#carousel", "./components/carousel.html");
includeHTML("#recipes", "./components/recipes.html");