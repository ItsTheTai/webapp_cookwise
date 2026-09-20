// // Mapping of eco-balance values ("gut", "mittel", "schlecht")
// // to the corresponding emoji icons. The "active" class highlights
// // the icon that represents the recipe's eco rating.
// const ecoToSmiley = {
//     gut: `
//         <i class="bi bi-emoji-smile-fill active"></i>
//         <i class="bi bi-emoji-neutral"></i>
//         <i class="bi bi-emoji-frown"></i>
//     `,
//     mittel: `
//         <i class="bi bi-emoji-smile"></i>
//         <i class="bi bi-emoji-neutral-fill active"></i>
//         <i class="bi bi-emoji-frown"></i>
//     `,
//     schlecht: `
//         <i class="bi bi-emoji-smile"></i>
//         <i class="bi bi-emoji-neutral"></i>
//         <i class="bi bi-emoji-frown-fill active"></i>
//     `
// };

// // Creates a single recipe card HTML block.
// function createRecipeCard(recipe) {
//     return `
//         <a href="rezeptkarte_2.html?id=${recipe.id}" class="col-custom-grid text-decoration-none">
//             <div class="recipe-card">
//                 <img src="${recipe.bild_url}" class="recipe-bg" alt="${recipe.titel}">
//                 <div class="recipe-content">
//                     <div class="recipe-title">${recipe.titel}</div>
//                     <div class="recipe-meta">
//                         ${recipe.schwierigkeitsgrad}, ${recipe.zubereitungszeit.gesamt_min} min.
//                     </div>
//                     <div class="smiley-group">
//                         ${ecoToSmiley[recipe.oekobilanz]}
//                     </div>
//                 </div>
//             </div>
//         </a>
//     `;
// }

// // Renders a list of recipes into the #recipe-container element.
// function renderRecipes(recipes) {
//     const container = document.getElementById("recipe-container");
//     // Build all recipe cards into one HTML string
//     let recipesHtml = "";
//     for (let recipe of recipes) {
//         recipesHtml += createRecipeCard(recipe);
//     }
//     // Insert the cards inside a responsive row wrapper
//     container.innerHTML = `
//         <div class="row responsive-recipe-row">
//             ${recipesHtml}
//         </div>
//     `;
// }

// Mapping of eco-balance values ("gut", "mittel", "schlecht")
// to the corresponding emoji icons. The "active" class highlights
// the icon that represents the recipe's eco rating.
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

// Creates a single recipe card HTML block.
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

// Renders a list of recipes into the #recipe-container element.
function renderRecipes(recipes) {
    const container = document.getElementById("recipe-container");
    if (!container) return;

    // Direct client-side duplicate filter right before DOM injection
    const seenTitles = new Set();
    const uniqueRecipes = recipes.filter(recipe => {
        if (!recipe || !recipe.titel) return false;
        const normalizedTitle = recipe.titel.trim().toLowerCase();
        if (seenTitles.has(normalizedTitle)) return false;
        seenTitles.add(normalizedTitle);
        return true;
    });

    let recipesHtml = "";
    for (let recipe of uniqueRecipes) {
        recipesHtml += createRecipeCard(recipe);
    }

    container.innerHTML = `
        <div class="row responsive-recipe-row">
            ${recipesHtml}
        </div>
    `;
}