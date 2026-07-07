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
            // FIXED: Keep the cyan planner background active on the chat view
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
            resetPlannerViews();
        });
    }
});

function resetPlannerViews() {
    const selectedRecipesList = document.getElementById('selected-recipes-list');
    const kiStepsContainer = document.getElementById('ki-steps-container');

    if (selectedRecipesList) {
        selectedRecipesList.innerHTML = `
            <p class="text-muted text-center py-3 my-0 small" id="no-recipes-msg">
                <i class="bi bi-info-circle me-1"></i>Keine Rezepte ausgewählt. Wähle Rezepte aus dem Menü.
            </p>`;
    }
    if (kiStepsContainer) {
        kiStepsContainer.innerHTML = `
            <p class="text-muted text-center py-4 small">
                Wähle Rezepte aus, um optimierte KI-Kochschritte zu generieren.
            </p>`;
    }
}

/**
 * Entfernt ein einzelnes Rezept aus der Liste der ausgewählten Rezepte.
 */
function removeRecipe(element) {
    const item = element.closest('.selected-recipe-item');
    if (item) {
        const parent = item.parentNode;
        item.remove();
        
        if (parent && parent.querySelectorAll('.selected-recipe-item').length === 0) {
            resetPlannerViews();
        } else {
            updateMockSteps();
        }
    }
}

/**
 * Fügt ein neues Rezept aus dem verfügbaren Pool hinzu.
 */
function addRecipe(recipeName) {
    const list = document.getElementById('selected-recipes-list');
    const msg = document.getElementById('no-recipes-msg');
    if (msg) msg.remove();

    // Prüfen mit .some() anstelle einer manuellen Schleife
    const currentItems = Array.from(list.querySelectorAll('.selected-recipe-item span'));
    if (currentItems.some(item => item.textContent.trim() === recipeName)) {
        alert('Dieses Rezept ist bereits in deinem Menü!');
        return;
    }

    const newItem = document.createElement('div');
    newItem.className = 'selected-recipe-item';
    newItem.innerHTML = `
        <span><i class="bi bi-check-circle-fill text-success me-2"></i>${recipeName}</span>
        <button class="btn-remove-recipe" onclick="removeRecipe(this)"><i class="bi bi-x-circle"></i></button>`;
    
    list.appendChild(newItem);
    updateMockSteps();
}

/**
 * Simuliert das Aktualisieren der optimierten Kochschritte durch die KI
 */
function updateMockSteps() {
    const steps = document.getElementById('ki-steps-container');
    const items = Array.from(document.querySelectorAll('.selected-recipe-item span'));
    
    if (!steps) return;
    if (items.length === 0) {
        resetPlannerViews();
        return;
    }

    const names = items.map(el => el.textContent.trim()).join(' & ');

    steps.innerHTML = `
        <div class="step-item">
            <div class="step-time">Minute 0 - 15</div>
            <strong>Zutaten vorbereiten für:</strong> ${names}. Alle Gemüse-Komponenten wie vorgeschrieben säubern und bereitstellen.
        </div>
        <div class="step-item">
            <div class="step-time">Minute 15 - 40</div>
            <strong>Paralleles Kochen & Hitze-Management:</strong> Behalte die Garzeiten im Auge. Nutze Timer für die Hauptkomponenten.
        </div>
        <div class="step-item">
            <div class="step-time">Ab Minute 40</div>
            <strong>Anrichten:</strong> Alles zeitgleich auf vorgewärmten Tellern servieren. Guten Appetit!
        </div>`;
}