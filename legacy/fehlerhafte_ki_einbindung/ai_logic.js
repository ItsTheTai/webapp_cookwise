/**
 * ai_logic.js
 * Steuert die Interaktionen auf der KI-Assistenten-Seite von CookWise.
 * Integriert das Modell Gemini 2.5 Flash nativ über das Google Generative AI Web SDK.
 */

// ⚠️ GLOBALER GEMINI API KONFIGURATIONSSCHLÜSSEL
// Ersetze diesen Platzhalter mit deinem echten Schlüssel von https://aistudio.google.com/
const GEMINI_API_KEY = "YOUR_ACTUAL_API_KEY"; 

import { GoogleGenerativeAI } from "@google/generative-ai";

// Nativer Verbindungsaufbau zum freien Google Entwickler-Gateway
const ai = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = ai.getGenerativeModel({ model: "gemini-2.5-flash" });

// ==========================================================================
// UI-ELEMENTE ABGREIFEN
// ==========================================================================
const btnChat = document.getElementById('btn-mode-chat');
const btnPlanner = document.getElementById('btn-mode-planner');
const viewChat = document.getElementById('view-chat');
const viewPlanner = document.getElementById('view-planner');
const btnClearAll = document.getElementById('btn-clear-all');

// ==========================================================================
// UI LAYOUT NAVIGATION (Umschalten zwischen Chat und Kochplaner)
// ==========================================================================
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
        renderPlannerRecipes(); // Aktualisiert die Rezeptliste und stößt die KI an
    });
}

if (btnClearAll) {
    btnClearAll.addEventListener('click', () => {
        localStorage.removeItem("ai_planner_recipes");
        renderPlannerRecipes();
    });
}

// Chat UI Funktionen initialisieren
initChatFunctionality();


// ==========================================================================
// CHAT INTEGRATION
// ==========================================================================
function initChatFunctionality() {
    const chatInput = document.getElementById('chat-input');
    const btnSend = document.getElementById('btn-send-chat'); // Exakt an die HTML-ID angepasst
    const chatMessages = document.getElementById('chat-messages');

    if (!chatInput || !btnSend || !chatMessages) return;

    async function handleSendMessage() {
        const messageText = chatInput.value.trim();
        if (!messageText) return;

        // User Nachricht sofort anzeigen
        appendMessage('user', messageText);
        chatInput.value = '';

        // Lade-Indikator (Spinner) anzeigen
        const loadingId = appendMessage('ai', '<div class="spinner-border spinner-border-sm text-cyan" role="status"></div> Denke nach...');

        try {
            const result = await model.generateContent(messageText);
            const responseText = result.response.text();
            
            // Spinner entfernen und echte Antwort platzieren
            removeMessage(loadingId);
            appendMessage('ai', responseText);
        } catch (error) {
            console.error("Gemini Chat failed:", error);
            removeMessage(loadingId);
            appendMessage('ai', `<span class="text-danger"><i class="bi bi-exclamation-triangle-fill"></i> Fehler: ${error.message}</span>`);
        }
    }

    btnSend.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSendMessage();
    });
}

function appendMessage(sender, text) {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return null;

    const msgId = 'msg-' + Date.now();
    const msgDiv = document.createElement('div');
    msgDiv.id = msgId;
    msgDiv.className = `d-flex mb-3 ${sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`;

    msgDiv.innerHTML = `
        <div class="p-3 rounded-3 ${sender === 'user' ? 'bg-cyan text-white' : 'bg-dark-card border border-secondary text-light'}" style="max-width: 75%;">
            ${text}
        </div>
    `;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return msgId;
}

function removeMessage(id) {
    const msg = document.getElementById(id);
    if (msg) msg.remove();
}


// ==========================================================================
// KOCHPLANER LOGIK
// ==========================================================================
async function renderPlannerRecipes() {
    const listContainer = document.getElementById('selected-recipes-list');
    if (!listContainer) return;

    let plannerRecipes = JSON.parse(localStorage.getItem("ai_planner_recipes")) || [];
    listContainer.innerHTML = "";

    if (plannerRecipes.length === 0) {
        listContainer.innerHTML = `
            <div class="text-center text-muted my-5 py-4">
                <i class="bi bi-journal-plus fs-2 d-block mb-2 text-secondary"></i>
                Keine Rezepte ausgewählt.<br>Füge Rezepte aus dem Hauptmenü hinzu.
            </div>`;
        document.getElementById('ki-steps-container').innerHTML = `
            <div class="text-center text-muted my-5 py-4">
                Wähle Rezepte aus, um einen optimierten Zeitplan zu generieren.
            </div>`;
        return;
    }

    plannerRecipes.forEach(recipe => {
        const item = document.createElement('div');
        item.className = "selected-recipe-item";
        item.innerHTML = `
            <span><i class="bi bi-book me-2 text-cyan"></i>${recipe.titel}</span>
            <button class="btn-remove-recipe" onclick="removeRecipe('${recipe.id}')">
                <i class="bi bi-x-circle-fill"></i>
            </button>
        `;
        listContainer.appendChild(item);
    });

    // Nach dem Rendern automatisch den verschachtelten Zeitplan generieren
    await generateAiSchedule(plannerRecipes);
}

async function generateAiSchedule(recipes) {
    const stepsContainer = document.getElementById('ki-steps-container');
    if (!stepsContainer) return;

    stepsContainer.innerHTML = `
        <div class="text-center my-5 py-5">
            <div class="spinner-border text-cyan mb-3" style="width: 2.5rem; height: 2.5rem;" role="status"></div>
            <p class="text-light opacity-75">KI optimiert die Kochschritte für dein Menü...</p>
        </div>`;

    try {
        const recipeTitles = recipes.map(r => r.titel).join(", ");
        const prompt = `Erstelle einen kombinierten, zeitlich optimierten und logisch verschachtelten Kochplan für folgende Rezepte: ${recipeTitles}. 
        Gib NUR reines HTML zurück, das direkt in ein Container-Element eingefügt werden kann. 
        Nutze für jeden Schritt dieses exakte Format:
        <div class="step-item">
            <div class="step-time">Schritt X - ca. Y Min.</div>
            <p class="m-0 text-light">Beschreibung, wie Arbeitsschritte parallel laufen.</p>
        </div>
        Verwende kein Markdown wie \`\`\`html oder \`\`\`.`;

        const result = await model.generateContent(prompt);
        let generatedHtml = result.response.text() || "";

        // Fallback-Bereinigung falls das Modell Markdown mitsendet
        generatedHtml = generatedHtml.replace(/```html|```/g, "").trim();

        if (generatedHtml) {
            stepsContainer.innerHTML = generatedHtml;
        } else {
            throw new Error("Leere Antwort vom KI-Modell erhalten.");
        }

    } catch (error) {
        console.error("Gemini Planner Generation failed:", error);
        stepsContainer.innerHTML = `
            <div class="alert alert-danger text-center my-3 py-3" style="font-size: 0.85rem;">
                <i class="bi bi-exclamation-triangle-fill d-block mb-1 fs-4"></i>
                Der KI-Zeitplan konnte nicht geladen werden.<br>
                <span class="opacity-75">${error.message}</span>
            </div>`;
    }
}

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

function removeRecipe(id) {
    let plannerRecipes = JSON.parse(localStorage.getItem("ai_planner_recipes")) || [];
    plannerRecipes = plannerRecipes.filter(item => item.id !== id);
    localStorage.setItem("ai_planner_recipes", JSON.stringify(plannerRecipes));
    renderPlannerRecipes();
}

// Funktionen an das globale Window-Objekt übergeben, damit inline onclick="" Eventhandler sie finden
window.renderPlannerRecipes = renderPlannerRecipes;
window.addRecipe = addRecipe;
window.removeRecipe = removeRecipe;