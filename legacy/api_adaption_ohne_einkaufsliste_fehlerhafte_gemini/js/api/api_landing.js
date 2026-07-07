const ecoToSmiley = {
    gut: `
        <i class="bi bi-emoji-smile-fill active"></i>
        <i class="bi bi-emoji-neutral"></i>
        <i class="bi bi-emoji-frown"></i>
    `,
    mittel: `
        <i class="bi bi-emoji-smile"></i>
        <i class="bi bi-emoji-neutral-fill active"></i>
        <i class="bi bi-emoji-frown"></i>
    `,
    schlecht: `
        <i class="bi bi-emoji-smile"></i>
        <i class="bi bi-emoji-neutral"></i>
        <i class="bi bi-emoji-frown-fill active"></i>
    `
};

function createRecipeCard(recipe) {
    return `
        <a href="rezeptkarte_2.html?id=${recipe.id}" class="col-custom-grid text-decoration-none">
            <div class="recipe-card">
                <img src="${recipe.bild_url}" class="recipe-bg" alt="${recipe.titel}">
                <div class="recipe-content">
                    <div class="recipe-title">${recipe.titel}</div>
                    <div class="recipe-meta">
                        ${recipe.schwierigkeitsgrad}, ${recipe.zubereitungszeit.gesamt_min} min.
                    </div>
                    <div class="smiley-group">
                        ${ecoToSmiley[recipe.oekobilanz]}
                    </div>
                </div>
            </div>
        </a>
    `;
}

function renderRecipes(recipes) {
    const container = document.getElementById("recipe-container");
    let recipesHtml = "";
    for (let recipe of recipes) {
        recipesHtml += createRecipeCard(recipe);
    }

    container.innerHTML = `
        <div class="row responsive-recipe-row">
            ${recipesHtml}
        </div>
    `;
}