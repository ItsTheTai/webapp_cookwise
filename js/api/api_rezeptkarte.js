// Dictionary for mapping eco balance values onto Bootstrap Icon smiley bundles
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

let ingredients = []
let recipeTitle = ""
const btn = document.getElementById("shoppingListButton")
btn.addEventListener("click", handleShoppingListButton)

function handleShoppingListButton() {
    const portionsCountEl = document.getElementById("portions-count");
    const portions = parseInt(portionsCountEl.textContent);

    for (let ingredient of ingredients) {
        ingredient.amount = ingredient.baseAmount * portions;
        ingredient.recipe = recipeTitle;
    }
    const currentList = JSON.parse(localStorage.getItem("shoppinglist")) || [];
    currentList.push(...ingredients);
    localStorage.setItem("shoppinglist", JSON.stringify(currentList));
}

document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');

    if (!recipeId) {
        console.error("Recipe ID not found in URL");
        return;
    }

    const detailUrl = `https://recipes.digitalhumanities.io/api/rezepte/${recipeId}/?format=json`;

    fetch(detailUrl)
        .then(response => {
            if (!response.ok) throw new Error("Error loading the recipe data");
            return response.json();
        })
        .then(recipe => renderRecipeDetail(recipe))
        .catch(error => console.error("Failed to fetch recipe details:", error));
});

function renderRecipeDetail(recipe) {
    document.title = recipe.titel;

    // 1. Map simple metadata values directly onto HTML elements via IDs
    const textMappings = {
        "kochdauer-value": `${recipe.zubereitungszeit?.gesamt_min || 0} Min.`,
        "schwierigkeit-value": recipe.schwierigkeitsgrad,
        "gerichttyp-value": recipe.kategorie,
        "kueche-value": recipe.kueche
    };

    for (const [id, value] of Object.entries(textMappings)) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    // 2. Map structural values via CSS class selectors
    const titleEl = document.querySelector(".recipe-title-detail");
    if (titleEl) titleEl.textContent = recipe.titel;

    // Update the recipe description text dynamically
    const descEl = document.querySelector(".recipe-description-text");
    if (descEl) descEl.textContent = recipe.kurzbeschreibung;

    // 3. Inject matching eco-smiley bundle from the dictionary layout
    const ecoContainer = document.querySelector(".smiley-group-detail");
    if (ecoContainer && recipe.oekobilanz) {
        ecoContainer.innerHTML = ecoToSmiley[recipe.oekobilanz];
    }

    // 4. Handle core image component attributes
    const imgEl = document.querySelector(".recipe-card-layout img");
    if (imgEl) {
        imgEl.src = recipe.bild_url;
        imgEl.alt = recipe.titel;
    }

    // ==========================================================================
    // 5. DYNAMIC TAB CONTENT GENERATION (Prep, Cook, Serve)
    // ==========================================================================

    // --- A. PREP TAB (Ingredients) ---
    try {
        const mainContainer = document.getElementById("ingredients-container");
        const portionsCountEl = document.getElementById("portions-count");

        // Fetch the initial target serving size multiplier from the DOM layout
        const currentServings = portionsCountEl ? parseInt(portionsCountEl.textContent) : 1;

        if (mainContainer && recipe.zutaten) {
            // Build the core unordered list structure from scratch dynamically
            mainContainer.innerHTML = '<ul class="ingredients-list list-unstyled m-0 p-0"></ul>';
            const ulElement = mainContainer.querySelector(".ingredients-list");

            recipe.zutaten.forEach((item, index) => {
                const amountOnOneServing = parseFloat(item.menge) || 0;
                const unit = item.einheit || '';
                const name = item.name || item.zutat || '';

                // Calculate the initial display volume relative to the active target serving size
                const initialDisplayedAmount = amountOnOneServing ? Number((amountOnOneServing * currentServings).toFixed(2)) : '';

                const li = document.createElement("li");
                li.className = "py-1 d-flex align-items-baseline";
                li.innerHTML = `
                    <i class="bi bi-circle me-2" style="font-size: 0.8rem;"></i> 
                    <span>
                        <strong class="ingredient-amount" data-base="${amountOnOneServing}">${initialDisplayedAmount} ${unit}</strong> ${name}
                    </span>
                `;
                ulElement.appendChild(li);

                let currentIngredient = { "name": name, "unit": unit, "baseAmount": amountOnOneServing, "recipe": recipe.titel }
                recipeTitle = recipe.titel
                ingredients.push(currentIngredient)
            });
            console.log("Prep tab rendered and synced with portions engine successfully.");
        }
    } catch (e) {
        console.error("Error rendering Prep tab:", e);
    }

    // --- B. COOK TAB (Steps) ---
    try {
        const stepsContainer = document.querySelector(".cooking-steps");
        if (stepsContainer && recipe.schritte) {
            stepsContainer.innerHTML = "";

            const vorbereitungSteps = recipe.schritte.vorbereitung || [];
            const zubereitungSteps = recipe.schritte.zubereitung || [];
            const allSteps = [...vorbereitungSteps, ...zubereitungSteps];

            if (allSteps.length > 0) {
                allSteps.forEach(step => {
                    const li = document.createElement("li");
                    li.className = "mb-2 recipe-text-block";
                    li.textContent = typeof step === 'string' ? step : (step.beschreibung || step.text || "");
                    stepsContainer.appendChild(li);
                });
                console.log("Cook tab rendered successfully.");
            } else {
                stepsContainer.innerHTML = "<li>Keine Schritte verfügbar.</li>";
            }
        }
    } catch (e) {
        console.error("Error in Cook tab block:", e);
    }

    // --- C. SERVE TAB (Serving Suggestion) ---
    try {
        const servePane = document.getElementById("serve-pane");
        if (servePane && recipe.serviervorschlag) {
            servePane.innerHTML = `
                <h5 class="tab-section-title">Anrichten & Servieren</h5>
                <p class="recipe-text-block">${recipe.serviervorschlag}</p>
            `;
            console.log("Serve tab rendered successfully.");
        }
    } catch (e) {
        console.error("Error rendering Serve tab:", e);
    }

    // ==========================================================================
    // 6. FAVORITES STORAGE ENGINE (Heart Button)
    // ==========================================================================
    const favoriteBtn = document.querySelector(".btn-favorite");
    if (favoriteBtn) {
        // Initial Page-Load Check: Check if recipe is already favorited
        let favorites = JSON.parse(localStorage.getItem("recipe_favorites")) || [];
        if (favorites.some(fav => fav.id === recipe.id)) {
            favoriteBtn.style.color = "#dc3545"; // Keep it visibly red if already stored
        }

        favoriteBtn.addEventListener("click", (e) => {
            e.preventDefault(); // Stop any redirection or page-jump

            let currentFavorites = JSON.parse(localStorage.getItem("recipe_favorites")) || [];
            const isAlreadyFavorite = currentFavorites.some(fav => fav.id === recipe.id);

            if (!isAlreadyFavorite) {
                currentFavorites.push({
                    id: recipe.id,
                    titel: recipe.titel,
                    kategorie: recipe.kategorie,
                    zubereitungszeit: recipe.zubereitungszeit?.gesamt_min || 0,
                    bild_url: recipe.bild_url,
                    oekobilanz: recipe.oekobilanz
                });

                localStorage.setItem("recipe_favorites", JSON.stringify(currentFavorites));
                favoriteBtn.style.color = "#dc3545"; // Change heart icon color directly
                showVisualFeedback(favoriteBtn, "success", `"${recipe.titel}" zu Favoriten hinzugefügt!`);
            } else {
                showVisualFeedback(favoriteBtn, "warning", "Bereits in Favoriten vorhanden!");
            }
        });
    }

    // ==========================================================================
    // 7. AI PLANNER STORAGE ENGINE (Clock Button)
    // ==========================================================================
    const plannerBtn = document.querySelector(".btn-timer");

    if (plannerBtn) {
        // Initial Page-Load Check: Check if recipe is already in the AI Planner
        let plannerRecipes = JSON.parse(localStorage.getItem("ai_planner_recipes")) || [];
        if (plannerRecipes.some(item => item.id === recipe.id)) {
            plannerBtn.style.color = "#0dcaf0"; // Highlight with AI accent color (cyan) if already added
        }

        plannerBtn.addEventListener("click", (e) => {
            e.preventDefault(); // Stop redirection

            let currentPlannerRecipes = JSON.parse(localStorage.getItem("ai_planner_recipes")) || [];
            const isAlreadyAdded = currentPlannerRecipes.some(item => item.id === recipe.id);

            if (!isAlreadyAdded) {
                currentPlannerRecipes.push({
                    id: recipe.id,
                    titel: recipe.titel
                });
                localStorage.setItem("ai_planner_recipes", JSON.stringify(currentPlannerRecipes));
                plannerBtn.style.color = "#0dcaf0"; // Update color immediately
                showVisualFeedback(plannerBtn, "success", `"${recipe.titel}" zum Kochplaner hinzugefügt!`);
            } else {
                showVisualFeedback(plannerBtn, "warning", "Bereits im Kochplaner vorhanden!");
            }
        });
    }

    console.log("API:", recipe);
    console.log("Recipe layout sync completed successfully.");
}

/**
 * Shared Helper Function: Generates floating visual notification banners without blocking UI flow
 */
function showVisualFeedback(element, status, message) {
    // 1. Temporary color flash animation directly on the clicked action button
    const originalColor = element.style.color;
    if (status === "warning") {
        element.style.color = "#ffc107"; // Warning flash
        setTimeout(() => { element.style.color = originalColor; }, 1000);
    }

    // 2. Look for or create the global toast layout fixed window viewport anchor container
    let container = document.getElementById("feedback-toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "feedback-toast-container";
        // Fixed mounting coordinates securely on top of layouts
        container.style.cssText = "position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px;";
        document.body.appendChild(container);
    }

    // 3. Assemble custom alert block
    const alertBox = document.createElement("div");
    const themeClass = status === "success" ? "alert-success text-success-emphasis" : "alert-warning text-warning-emphasis";
    const icon = status === "success" ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill";

    alertBox.className = `alert ${themeClass} alert-dismissible fade show shadow d-flex align-items-center mb-2`;
    alertBox.role = "alert";
    alertBox.style.cssText = "border-radius: 0.6rem; background-color: rgba(255,255,255,0.95); backdrop-filter: blur(4px);";
    alertBox.innerHTML = `
        <i class="bi ${icon} me-2 fs-5"></i>
        <div class="small fw-semibold">${message}</div>
        <button type="button" class="btn-close ps-2" data-bs-dismiss="alert" aria-label="Close" style="transform: scale(0.8); margin-top: -2px;"></button>
    `;

    container.appendChild(alertBox);

    // 4. Clean notification component cleanly from live stack tree structure after 3 seconds
    setTimeout(() => {
        alertBox.classList.remove("show");
        setTimeout(() => alertBox.remove(), 250);
    }, 3000);
}