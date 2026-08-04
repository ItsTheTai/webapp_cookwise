/**
 * ai_logic.js
 * Steuert die Interaktionen auf der KI-Assistenten-Seite von CookWise.
 * Integriert Google Gemini API (generateContent) für Chat und Rezept-Schritt-Optimierung.
 */

// ==========================================================================
// 1. KONFIGURATION (API-KEY)
// ==========================================================================
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-3.6-flash:generateContent";

// Funktion zum Abrufen des API-Keys aus sessionStorage
function getApiKey() {
    return sessionStorage.getItem('gemini_api_key');
}

// ==========================================================================
// 2. HILFSFUNKTIONEN
// ==========================================================================

/**
 * Konvertiert Markdown-Text in HTML
 * @param {string} markdownText - Der Markdown-Text von der API
 * @returns {string} HTML-Formatierter Text
 */
function markdownToHtml(markdownText) {
    if (!markdownText) return "Keine Antwort erhalten.";
    
    // Ersetze Markdown-Formatierungen durch HTML
    let html = markdownText
        // Überschriften
        .replace(/^# (.*$)/gm, '<h3>$1</h3>')
        .replace(/^## (.*$)/gm, '<h4>$1</h4>')
        .replace(/^### (.*$)/gm, '<h5>$1</h5>')
        
        // Fett
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        
        // Kursiv
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        
        // Durchgestrichen
        .replace(/~~(.*?)~~/g, '<s>$1</s>')
        
        // Aufzählungen (mit * oder -)
        .replace(/^\* (.*$)/gm, '<li>$1</li>')
        .replace(/^\- (.*$)/gm, '<li>$1</li>')
        
        // Numerierte Listen
        .replace(/^\d+\. (.*$)/gm, '<li>$1</li>')
        
        // Code-Blöcke
        .replace(/`(.*?)`/g, '<code>$1</code>')
        
        // Horizontale Linie
        .replace(/^---$/gm, '<hr>')
        
        // Links
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank">$1</a>')
        
        // Zeilenumbrüche: Leere Zeilen in <p>-Tags umwandeln
        .replace(/\n\n+/g, '</p><p>')
        .replace(/\n/g, '<br>')
        
        // Aufzählungen in <ul>-Tags umwandeln
        .replace(/(<li>.*<\/li>)+/g, (match) => {
            return `<ul>${match}</ul>`;
        })
        
        // Numerierte Listen in <ol>-Tags umwandeln
        .replace(/(<li>\d+\. .*<\/li>)+/g, (match) => {
            return `<ol>${match.replace(/<li>\d+\. /g, '<li>')}</ol>`;
        });
    
    // Standard <p>-Tag hinzufügen, wenn nicht vorhanden
    if (!html.startsWith('<') && !html.includes('<p>')) {
        html = `<p>${html}</p>`;
    }
    
    return html;
}

// ==========================================================================
// 3. DOM-ELEMENTE
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

    // API Key Button
    const btnApiKey = document.getElementById('btn-api-key');

    // Planner-Elemente
    const btnClearAll = document.getElementById('btn-clear-all');
    const btnOptimize = document.getElementById('btn-optimize');
    const loadingSpinner = document.getElementById('loading-spinner');

    // 3.1 Modus-Umschaltung
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

    // 3.2 API Key Button
    if (btnApiKey) {
        btnApiKey.addEventListener('click', () => {
            const apiKey = prompt("Bitte gib deinen Google Gemini API Key ein:");
            if (apiKey) {
                sessionStorage.setItem('gemini_api_key', apiKey.trim());
                appendMessage("Google Gemini API Key gespeichert! \u2705 Du kannst jetzt mit der KI chatten.", 'ai');
            }
        });
    }

    // 3.3 Chat-Funktionalität
    if (chatInput && chatSendBtn && chatMessagesBox) {
        // Nachricht senden (Button oder Enter)
        const sendMessage = () => {
            const userMessage = chatInput.value.trim();
            if (!userMessage) return;

            // Benutzernachricht anzeigen
            appendMessage(userMessage, 'user');
            chatInput.value = '';

            // API-Aufruf an Google Gemini
            callGeminiAPI(userMessage, (response) => {
                appendMessage(response, 'ai');
            });
        };

        chatSendBtn.addEventListener('click', sendMessage);
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // 3.4 Planner-Funktionalität
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
// 4. CHAT-FUNKTIONEN
// ==========================================================================

/**
 * Fügt eine Nachricht zum Chat hinzu.
 * @param {string} text - Der Nachrichtentext (kann Markdown enthalten).
 * @param {string} type - 'user' oder 'ai'.
 */
function appendMessage(text, type) {
    const chatMessagesBox = document.getElementById('chat-messages-box');
    if (!chatMessagesBox) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `msg-bubble msg-${type}`;
    
    // Für AI-Nachrichten: Markdown in HTML umwandeln
    if (type === 'ai') {
        messageDiv.innerHTML = markdownToHtml(text);
    } else {
        // Für Benutzernachrichten: Normalen Text verwenden
        messageDiv.textContent = text;
    }
    
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
    const apiKey = getApiKey();

    if (!apiKey) {
        callback("Fehler: Bitte gib zuerst deinen Google Gemini API Key ein (\u2699\uFE0F-Symbol).");
        return;
    }

    if (loadingSpinner) loadingSpinner.classList.remove('d-none');

    fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }]
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => {
                const errorMsg = err.message || response.statusText;
                throw new Error(`API-Fehler: ${response.status} - ${errorMsg}`);
            }).catch(() => {
                throw new Error(`API-Fehler: ${response.status} - ${response.statusText}`);
            });
        }
        return response.json();
    })
    .then(data => {
        // Try to extract the response text from multiple possible paths
        let aiResponse = "Keine Antwort erhalten.";
        
        // Standard generateContent response format
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            aiResponse = data.candidates[0].content.parts?.[0]?.text || "Keine Antwort erhalten.";
        }
        // Alternative response format
        else if (data.content && Array.isArray(data.content)) {
            aiResponse = data.content[0]?.text || "Keine Antwort erhalten.";
        }
        // Check for output_text (Interactions API format)
        else if (data.output_text) {
            aiResponse = data.output_text;
        }
        // Check for message.content format
        else if (data.message && data.message.content) {
            aiResponse = data.message.content[0]?.text || "Keine Antwort erhalten.";
        }
        
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
// 5. PLANNER-FUNKTIONEN
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

    // Rufe Google Gemini API auf
    callGeminiAPI(prompt, (response) => {
        stepsContainer.innerHTML = `
            <div class="step-item">
                <strong>Optimierte Kochschritte für: ${recipeNames}</strong>
                <hr class="my-2">
                ${markdownToHtml(response)}
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
