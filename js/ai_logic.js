/**
 * ai_logic.js
 * Steuert die Interaktionen auf der KI-Assistenten-Seite von CookWise.
 */

document.addEventListener('DOMContentLoaded', () => {
    const btnChat = document.getElementById('btn-mode-chat');
    const btnPlanner = document.getElementById('btn-mode-planner');
    const viewChat = document.getElementById('view-chat');
    const viewPlanner = document.getElementById('view-planner');
    const btnClearAll = document.getElementById('btn-clear-all');

    // 1. Umschalten zwischen Chat-Ansicht und Kochplaner-Ansicht
    if (btnChat && btnPlanner) {
        btnChat.addEventListener('click', () => {
            btnChat.classList.add('active');
            btnPlanner.classList.remove('active');
            viewChat.classList.remove('d-none');
            viewPlanner.classList.add('d-none');
        });

        btnPlanner.addEventListener('click', () => {
            btnPlanner.classList.add('active');
            btnChat.classList.remove('active');
            viewPlanner.classList.remove('d-none');
            viewChat.classList.add('d-none');
        });
    }

    // 2. Das gesamte Menü im Kochplaner leeren
    if (btnClearAll) {
        btnClearAll.addEventListener('click', () => {
            localStorage.removeItem("ai_planner_recipes");
            renderPlannerRecipes();
        });
    }

    // Initiale Beladung der gespeicherten Rezepte aus dem LocalStorage
    renderPlannerRecipes();
});

/**
 * Lädt Rezepte aus dem LocalStorage und rendert sie im Kochplaner
 */
function renderPlannerRecipes() {
    const list = document.getElementById('selected-recipes-list');
    if (!list) return;

    const plannerRecipes = JSON.parse(localStorage.getItem("ai_planner_recipes")) || [];

    if (plannerRecipes.length === 0) {
        list.innerHTML = `<p class="text-muted small text-center my-3">Keine Rezepte ausgewählt. Klicke auf das Uhr-Symbol in einer Rezeptkarte.</p>`;
        updateMockSteps();
        return;
    }

    list.innerHTML = ''; // Clear fallback notifications

    plannerRecipes.forEach((recipe, index) => {
        const item = document.createElement('div');
        item.className = 'selected-recipe-item';
        item.innerHTML = `
            <span><i class="bi bi-check-circle-fill text-success me-2"></i>${recipe.titel}</span>
            <button class="btn-remove-recipe" data-index="${index}"><i class="bi bi-x-circle"></i></button>
        `;
        list.appendChild(item);
    });

    // Event Listener für Löschknöpfe anhängen
    const removeButtons = list.querySelectorAll('.btn-remove-recipe');
    removeButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const indexToRemove = parseInt(btn.getAttribute('data-index'));
            let currentRecipes = JSON.parse(localStorage.getItem("ai_planner_recipes")) || [];
            
            currentRecipes.splice(indexToRemove, 1);
            localStorage.setItem("ai_planner_recipes", JSON.stringify(currentRecipes));
            
            renderPlannerRecipes(); // UI neu zeichnen
        });
    });

    // Generiert die gemischten Kochschritte auf Basis der ausgewählten Liste
    updateMockSteps();
}

/**
 * Simuliert das Aktualisieren der optimierten Kochschritte durch die KI
 */
function updateMockSteps() {
    const steps = document.getElementById('ki-steps-container');
    const plannerRecipes = JSON.parse(localStorage.getItem("ai_planner_recipes")) || [];
    
    if (!steps) return;
    
    if (plannerRecipes.length === 0) {
        steps.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="bi bi-robot fs-1 d-block mb-2"></i>
                Wähle Rezepte aus, um einen kombinierten Zeitplan zu generieren.
            </div>`;
        return;
    }

    const names = plannerRecipes.map(r => r.titel).join(' & ');

    steps.innerHTML = `
        <div class="step-item">
            <div class="step-time">Minute 0 - 15</div>
            <strong>Zutaten vorbereiten für:</strong> ${names}. Alle Gemüse-Komponenten wie vorgeschrieben säubern und bereitstellen.
        </div>
        <div class="step-item">
            <div class="step-time">Minute 15 - 40</div>
            <strong>Paralleles Kochen & Hitze-Management:</strong> Behalte die Garzeiten im Auge. Nutze Timer für die Hauptkomponenten der ausgewählten Rezepte.
        </div>
        <div class="step-item">
            <div class="step-time">Ab Minute 40</div>
            <strong>Anrichten:</strong> Alles ist perfekt getaktet fertig! Heiß servieren.
        </div>
    `;
}

/**
 * Fügt ein Rezept aus dem verfügbaren Pool zum Kochplaner hinzu
 */
function addRecipe(recipeTitle) {
    let plannerRecipes = JSON.parse(localStorage.getItem("ai_planner_recipes")) || [];

    // Verhindern, dass dasselbe Rezept mehrfach hinzugefügt wird
    const isAlreadyAdded = plannerRecipes.some(item => item.titel === recipeTitle);

    if (!isAlreadyAdded) {
        // Da hier nur der Titel übergeben wird, generieren wir eine temporäre ID oder nutzen den Titel
        plannerRecipes.push({
            id: 'mock-' + Date.now(),
            titel: recipeTitle
        });
        localStorage.setItem("ai_planner_recipes", JSON.stringify(plannerRecipes));
        renderPlannerRecipes(); // UI aktualisieren
    } else {
        alert(`"${recipeTitle}" befindet sich bereits im Kochplaner.`);
    }
}


// Global freigeben für Kompatibilität mit Inline-Handlern falls nötig
window.renderPlannerRecipes = renderPlannerRecipes;