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
        "kochdauer-value": `${recipe.zubereitungszeit.gesamt_min} Min.`,
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
                // Assume the fallback data schema treats ingredient quantity as a single serving baseline
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
                        <!-- CRITICAL: Embed the single serving volume inside data-base for scaling engine tracking -->
                        <strong class="ingredient-amount" data-base="${amountOnOneServing}">${initialDisplayedAmount} ${unit}</strong> ${name}
                    </span>
                `;
                ulElement.appendChild(li);
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
            // Clear static fallback step placeholders from the layout
            stepsContainer.innerHTML = ""; 

            // Extract nested process arrays from the split schema object (fallback to empty arrays if missing)
            const vorbereitungSteps = recipe.schritte.vorbereitung || [];
            const zubereitungSteps = recipe.schritte.zubereitung || [];

            // Merge preparation phase and active cooking phase into a single chronological matrix
            const allSteps = [...vorbereitungSteps, ...zubereitungSteps];

            if (allSteps.length > 0) {
                allSteps.forEach(step => {
                    const li = document.createElement("li");
                    li.className = "mb-2 recipe-text-block";
                    
                    // Safely extract string data whether the payload delivers raw strings or structured property fields
                    li.textContent = typeof step === 'string' ? step : (step.beschreibung || step.text || "");
                    stepsContainer.appendChild(li);
                });
                console.log("Cook tab rendered successfully with split API structures.");
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

    console.log("API:", recipe);
    console.log("Recipe layout sync completed successfully.");
}