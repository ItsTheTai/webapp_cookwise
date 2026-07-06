/**
 * ai_logic.js
 * Steuert die Interaktionen auf der KI-Assistenten-Seite von CookWise.
 * Integriert Google Gemini API für Chat und Rezept-Schritt-Optimierung.
 */

// ==========================================================================
// 1. KONFIGURATION (API-KEY)
// ==========================================================================
const GEMINI_API_KEY = ""; // No quotes or extra characters
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";



// ==========================================================================
// 2. DOM-ELEMENTE
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
    // Modus-Umschaltung
    const btnChat = document.getElementById('btn-mode-chat');
    const btnPlanner = document.getElementById('btn-mode-planner');
    const viewChat = document.getElementById('view-chat');
    const viewPlanner = document.getElementById('view-planner');

    // Chat-Elemente
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatMessagesBox = document.getElementById('chat-messages-box');

    // Planner-Elemente
    const btnClearAll = document.getElementById('btn-clear-all');
    const btnOptimize = document.getElementById('btn-optimize');
    const loadingSpinner = document.getElementById('loading-spinner');

    // 2.1 Modus-Umschaltung
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

    // 2.2 Chat-Funktionalität
    if (chatInput && chatSendBtn && chatMessagesBox) {
        // Nachricht senden (Button oder Enter)
        const sendMessage = () => {
            const userMessage = chatInput.value.trim();
            if (!userMessage) return;

            // Benutzernachricht anzeigen
            appendMessage(userMessage, 'user');
            chatInput.value = '';

            // API-Aufruf an Gemini
            callGeminiAPI(userMessage, (response) => {
                appendMessage(response, 'ai');
            });
        };

        chatSendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // 2.3 Planner-Funktionalität
    if (btnClearAll) {
        btnClearAll.addEventListener('click', () => {
            localStorage.removeItem("ai_planner_recipes");
            renderPlannerRecipes();
        });
    }

    if (btnOptimize) {
        btnOptimize.addEventListener('click', () => {
            optimizeRecipeSteps();
        });
    }

    // Initiale Beladung
    renderPlannerRecipes();
});

// ==========================================================================
// 3. CHAT-FUNKTIONEN
// ==========================================================================

/**
 * Fügt eine Nachricht zum Chat hinzu.
 * @param {string} text - Der Nachrichtentext.
 * @param {string} type - 'user' oder 'ai'.
 */
function appendMessage(text, type) {
    const chatMessagesBox = document.getElementById('chat-messages-box');
    if (!chatMessagesBox) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `msg-bubble msg-${type}`;
    messageDiv.textContent = text;
    chatMessagesBox.appendChild(messageDiv);

    // Automatisch nach unten scrollen
    chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
}

/**
 * Ruft die Google Gemini API auf.
 * @param {string} prompt - Der Benutzer-Prompt.
 * @param {function} callback - Rückruffunktion mit der API-Antwort.
 */
function callGeminiAPI(prompt, callback) {
    const loadingSpinner = document.getElementById('loading-spinner');
    if (loadingSpinner) loadingSpinner.classList.remove('d-none');

    fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': GEMINI_API_KEY
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }]
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`API-Fehler: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Keine Antwort erhalten.";
        callback(aiResponse);
    })
    .catch(error => {
        console.error("Fehler bei der API-Anfrage:", error);
        callback(`Fehler: ${error.message}. Bitte überprüfe deine Internetverbindung oder den API-Key.`);
    })
    .finally(() => {
        if (loadingSpinner) loadingSpinner.classList.add('d-none');
    });
}

// ==========================================================================
// 4. PLANNER-FUNKTIONEN
// ==========================================================================

/**
 * Lädt Rezepte aus dem LocalStorage und rendert sie im Kochplaner.
 */
function renderPlannerRecipes() {
    const list = document.getElementById('selected-recipes-list');
    if (!list) return;

    const plannerRecipes = JSON.parse(localStorage.getItem("ai_planner_recipes")) || [];

    if (plannerRecipes.length === 0) {
        list.innerHTML = `<p class="text-muted small text-center my-3">Keine Rezepte ausgewählt. Klicke auf das Uhr-Symbol in einer Rezeptkarte.</p>`;
        return;
    }

    list.innerHTML = '';

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
            renderPlannerRecipes();
        });
    });
}

/**
 * Optimiert die Kochschritte der ausgewählten Rezepte mit KI.
 */
function optimizeRecipeSteps() {
    const stepsContainer = document.getElementById('ki-steps-container');
    const loadingSpinner = document.getElementById('loading-spinner');
    if (!stepsContainer) return;

    // Lade Rezepte aus LocalStorage
    const plannerRecipes = JSON.parse(localStorage.getItem("ai_planner_recipes")) || [];

    if (plannerRecipes.length === 0) {
        stepsContainer.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="bi bi-robot fs-1 d-block mb-2"></i>
                Wähle Rezepte aus, um einen kombinierten Zeitplan zu generieren.
            </div>
        `;
        return;
    }

    // Zeige Ladeanimation
    if (loadingSpinner) loadingSpinner.classList.remove('d-none');
    stepsContainer.innerHTML = `
        <div class="text-center text-muted py-3">
            <div class="spinner-border spinner-border-sm" role="status"></div>
            <span class="ms-2">Optimiert Kochschritte...</span>
        </div>
    `;

    // Erstelle Prompt für die KI
    const recipeNames = plannerRecipes.map(r => r.titel).join(', ');
    const prompt = `
        Kombiniere und optimiere die Kochschritte der folgenden Rezepte so, dass sie parallel ausgeführt werden können, wo es möglich ist.
        Gib die Schritte in chronologischer Reihenfolge mit geschätzten Zeiten zurück.
        Antworte nur mit den optimierten Schritten in diesem Format:

        Minute 0-10: [Schritt 1]
        Minute 10-20: [Schritt 2]
        ...

        Rezepte: ${recipeNames}
    `;

    // Rufe Gemini API auf
    callGeminiAPI(prompt, (response) => {
        stepsContainer.innerHTML = `
            <div class="step-item">
                <strong>Optimierte Kochschritte für: ${recipeNames}</strong>
                <hr class="my-2">
                ${response.split('\n').map(line => `<div class="mb-2">${line}</div>`).join('')}
            </div>
        `;
    });
}

/**
 * Fügt ein Rezept aus dem verfügbaren Pool zum Kochplaner hinzu.
 * @param {string} recipeTitle - Titel des Rezepts.
 */
function addRecipe(recipeTitle) {
    let plannerRecipes = JSON.parse(localStorage.getItem("ai_planner_recipes")) || [];

    const isAlreadyAdded = plannerRecipes.some(item => item.titel === recipeTitle);

    if (!isAlreadyAdded) {
        plannerRecipes.push({
            id: 'mock-' + Date.now(),
            titel: recipeTitle
        });
        localStorage.setItem("ai_planner_recipes", JSON.stringify(plannerRecipes));
        renderPlannerRecipes();
    } else {
        alert(`"${recipeTitle}" befindet sich bereits im Kochplaner.`);
    }
}

// Global freigeben für Kompatibilität mit Inline-Handlern
window.renderPlannerRecipes = renderPlannerRecipes;
window.addRecipe = addRecipe;