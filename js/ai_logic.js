/**
 * Steuert die Interaktionen auf der KI-Assistenten-Seite
 * Integriert Google Gemini API (generateContent) für Chat und Rezept-Schritt-Optimierung.
 */


// 1. api schlüssel abfrage - session storage
// ==========================================================================

// Endpunkt-URL der Google Gemini API 
// später genutzt, um die Anfragen an Gemini zu stellen 
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-3.6-flash:generateContent"; //

// Liest den gespeicherten API-Schlüssel aus dem SessionStorage des Browsers aus.
// (SessionStorage speichert Daten für die Dauer der aktuellen Browser-Sitzung.)
function getApiKey() {
    return sessionStorage.getItem('gemini_api_key'); //gibt nur API-Schlüssel oder null, falls nicht vorhanden.
}


// 2. HILFSFUNKTIONEN 
// ==========================================================================

// Wandelt Markdown-Text (Antwort form Gemini-API) via RegEx in sauberes HTML um
// "markdownText" = der unformatierte Text von Gemini
function markdownToHtml(markdownText) {
    // Falls kein Text übergeben wurde, Standardantwort liefern
    if (!markdownText) return "Keine Antwort erhalten."; //

    // HTML-Sonderzeichen durch ihre sichere Textdarstellung ersetzen, damit Inhalt aus der KI-Antwort nicht selbst als HTML ausgeführt wird.
    let html = String(markdownText)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    // Schrittweise Ersetzung von Markdown durch HTML-Tags
    // möglichst alle grundlegenden markdown regeln vorhanden, zur Sicherheit
    html = html
        // Überschriften (# Titel -> <h3>Titel</h3>)
        .replace(/^### (.*$)/gm, '<h5>$1</h5>')
        .replace(/^## (.*$)/gm, '<h4>$1</h4>')
        .replace(/^# (.*$)/gm, '<h3>$1</h3>')

        // Durchgestrichener Text (~~Text~~ -> <s>Text</s>)
        .replace(/~~(.*?)~~/g, '<s>$1</s>')

        // Fett gedruckter Text (**Text** -> <strong>Text</strong>)
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

        // Kursiver Text (*Text* -> <em>Text</em>)
        .replace(/(^|[^\*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')

        // Code-Blöcke (`Code` -> <code>Code</code>)
        .replace(/`([^`\n]+)`/g, '<code>$1</code>')

        // Horizontale Trennlinien (--- -> <hr>)
        .replace(/^---$/gm, '<hr>')

        // Hyperlinks ([Titel](URL) -> <a href="URL">Titel</a>)
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    // Nummerierte Listen in ein <ol>-Tag umwandeln
    html = html.replace(
        /((?:^\d+\. .*(?:\n|$))+)/gm,
        (match) => {
            const items = match
                .trim()
                .split('\n')
                .map(line => line.replace(/^\d+\. (.*)$/, '<li>$1</li>'))
                .join('');

            return `<ol>${items}</ol>`;
        }
    );

    // Aufzählungszeichen (* oder - -> <li>Element</li>)
    html = html.replace(
        /((?:^[*-] .*(?:\n|$))+)/gm,
        (match) => {
            const items = match
                .trim()
                .split('\n')
                .map(line => line.replace(/^[*-] (.*)$/, '<li>$1</li>'))
                .join('');

            return `<ul>${items}</ul>`;
        }
    );

    // Zeilenumbrüche umwandeln
    // Doppelte Umbrüche trennen Absätze, einzelne Umbrüche werden zu <br>
    html = html
        .replace(/\n\n+/g, '</p><p>')
        .replace(/\n/g, '<br>');

    // Falls der Text nicht bereits in Tags gewickelt ist, mit <p> umschließen
    if (!html.startsWith('<') && !html.includes('<p>')) { //
        html = `<p>${html}</p>`; //
    }

    return html; //
}


// Sichere Hilfsfunktion zum Lesen der gespeicherten Rezepte.
// beschädigter oder fehlender LocalStorage-Eintrag führt nicht zum Abbruch der Anwendung
// (wenn Kochplaner auf seine gespeicherten Daten zugreift)

function getPlannerRecipes() {
    const savedRecipes = localStorage.getItem("ai_planner_recipes");

    // Falls noch keine Rezepte gespeichert wurden, leere Liste.
    if (!savedRecipes) {
        return [];
    }

    try {
        const recipes = JSON.parse(savedRecipes);

        // nur ein Array als gültige gespeicherte Rezeptliste
        return Array.isArray(recipes) ? recipes : [];
    } catch (error) {
        // Falls der gespeicherte Text kein gültiges JSON enthält,Speicherstand wie leere Rezeptliste behandelt
        console.error("Gespeicherte Kochplaner-Daten konnten nicht gelesen werden:", error);
        return [];
    }
}


// Speichert die aktuelle Rezeptliste wieder im LocalStorage - überall gleicher speicher verwendet
function savePlannerRecipes(recipes) {
    localStorage.setItem("ai_planner_recipes", JSON.stringify(recipes));
}


// 3. Initialisierung beim Laden der Seite 
// ==========================================================================

// Wartet, bis das gesamte HTML-Dokument vollständig vom Browser geladen wurde | wichtig um Fehler zu vermeiden z.B. mit RezeptAPI
document.addEventListener('DOMContentLoaded', () => { //

    // Referenzen auf HTML-Elemente für die Modus-Umschaltung holen (Chat <-> kochplaner )
    const btnChat = document.getElementById('btn-mode-chat'); //
    const btnPlanner = document.getElementById('btn-mode-planner'); //
    const viewChat = document.getElementById('view-chat'); //
    const viewPlanner = document.getElementById('view-planner'); //

    // HTML Referenzen für Chat-Komponenten Eingabefeld, Senden-Button und Nachrichtenbereich
    const chatInput = document.getElementById('chat-input'); //
    const chatSendBtn = document.getElementById('chat-send-btn'); //
    const chatMessagesBox = document.getElementById('chat-messages-box'); //

    // Referenz für den API-Schlüssel Button
    const btnApiKey = document.getElementById('btn-api-key'); //

    // Referenzen für buttons Löschen und Optimieren 
    const btnClearAll = document.getElementById('btn-clear-all'); //
    const btnOptimize = document.getElementById('btn-optimize'); //


    // 3.1 LOGIK ZUR ANSICHTEN-UMSCHALTUNG (Chat <-> Kochplaner)
    // ----------------------------------------------------------------------
    if (btnChat && btnPlanner) { //wenn beide buttons vorhanden, dann..

        // Wechsel auf Chat-Ansicht
        btnChat.addEventListener('click', () => { //Wartet darauf, dass der Chat-Button angeklickt
            btnChat.classList.add('active'); //spricht css klasse an - setzt aktiv -> farblicher Anpassung
            btnPlanner.classList.remove('active'); //entfernt "active" aus btnPlanner
            viewChat.classList.remove('d-none'); // Chat anzeigen
            viewPlanner.classList.add('d-none'); // Planer ausblenden
        });

        // Wechsel auf Kochplaner-Ansicht
        btnPlanner.addEventListener('click', () => { //wartet auf klick für kochplaner
            btnPlanner.classList.add('active'); //
            btnChat.classList.remove('active'); //
            viewPlanner.classList.remove('d-none'); // Planer anzeigen
            viewChat.classList.add('d-none'); // Chat ausblenden
        });
    }


    // 3.2 api-key abfragen und zwischenspeichern 
    // ----------------------------------------------------------------------
    if (btnApiKey) { //Prüft, ob der API-Key-Button vorhanden
        btnApiKey.addEventListener('click', () => { //wartet auf api button klick
            const apiKey = prompt("Bitte gib deinen Google Gemini API Key ein:"); // Zeigt ein Eingabefenster im Browser an
            if (apiKey) { //prüft auf eingaben in das fenster
                sessionStorage.setItem('gemini_api_key', apiKey.trim()); // Speichert den Schlüssel ausschließlich im SessionStorage
                appendMessage("Google Gemini API Key gespeichert! ✅ Du kannst jetzt mit der KI chatten.", 'ai'); //neue Nachricht in den Chat schreiben
            }
        });
    }


    // 3.3 chat interaktionen - Eingaben verarbeiten & Senden
    // ----------------------------------------------------------------------
    if (chatInput && chatSendBtn && chatMessagesBox) { //

        const sendMessage = () => { // Innere Hilfsfunktion zum Verarbeiten der Benutzereingabe
            const userMessage = chatInput.value.trim(); //liest den Text aus dem Eingabefeld und entfernt Leerzeichen vorne und hinten.
            if (!userMessage) return; // abbruch, falls die nachricht leer

            appendMessage(userMessage, 'user'); // Nachricht des Nutzers sofort im Chatfenster anzeigen
            chatInput.value = ''; // Eingabefeld leeren

            callGeminiAPI(userMessage, (response) => { // Nachricht an die Gemini API schicken  
                appendMessage(response, 'ai'); // Antwort im chat rendern
            });
        };

        // Klick auf den Senden-Button
        chatSendBtn.addEventListener('click', sendMessage); // Beim Klick auf Senden wird sendMessage() ausgeführt

        // Drücken der Enter-Taste im Eingabefeld
        chatInput.addEventListener('keypress', (e) => { //
            if (e.key === 'Enter') sendMessage(); // Beim Klick auf Senden wird sendMessage() ausgeführt
        });
    }


    // 3.4 buttons: Leeren und Optimieren 
    // ----------------------------------------------------------------------
    if (btnClearAll) { //Prüft, ob der Löschen-Button vorhanden ist
        btnClearAll.addEventListener('click', () => { //Wartet auf einen Klick auf Löschen
            localStorage.removeItem("ai_planner_recipes"); // Löscht den Eintrag im LocalStorage  
            renderPlannerRecipes(); //aktualisiert die Ansicht
        });
    }

    if (btnOptimize) { //button vorhanden?
        btnOptimize.addEventListener('click', () => { //button klick?
            optimizeRecipeSteps(); //funktion ausführen
        });
    }

    renderPlannerRecipes(); // Beim ersten Laden der Seite gespeicherte Rezepte im Planer anzeigen
});


// 4. CHAT-FUNKTIONEN
// ==========================================================================

//Fügt eine neue Nachricht als HTML-Element in den Chatverlauf ein.
// ges gibt 2 types: "user" für Benutzereingaben, 'ai' für KI-Antworten
function appendMessage(text, type) { //
    const chatMessagesBox = document.getElementById('chat-messages-box'); //Sucht das Chatfenster. Wenn es nicht existiert, wird die Funktion beendet.
    if (!chatMessagesBox) return; //

    const messageDiv = document.createElement('div');     // Erstellt ein neues <div>-Element für die Sprechblase
    messageDiv.className = `msg-bubble msg-${type}`; // gibt dem element css klassen für Darstellung in chatblase

    if (type === 'ai') { //  KI-Antworten werden Markdown-Formatierungen in HTML umgewandelt
        messageDiv.innerHTML = markdownToHtml(text); //
    } else {
        messageDiv.textContent = text; // Für Benutzereingaben wird plain text verwendet
    }

    chatMessagesBox.appendChild(messageDiv);     // Element ans Ende des Chatfensters anfügen

    chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;     // Automatisch nach ganz unten scrollen, damit die neueste Nachricht sichtbar ist
}


//Führt einen asynchronen HTTP-POST Aufruf (Fetch) an die Google Gemini API durch.
// prompt = die Nachricht des Nutzers, callback = Funktion für die Antwort
function callGeminiAPI(prompt, callback) { //
    const loadingSpinner = document.getElementById('loading-spinner'); //holt html element für ladeanzeige  
    const apiKey = getApiKey(); //holt api key

    // Prüfen, ob ein API-Key vorhanden ist; falls nicht: Fehlermeldung & Abbruch
    if (!apiKey) { //
        callback("Fehler: Bitte gib zuerst deinen Google Gemini API Key ein (⚙️-Symbol)."); //
        return; //
    }

    // Ladeanzeige einblenden
    if (loadingSpinner) loadingSpinner.classList.remove('d-none'); //Falls die Ladeanzeige vorhanden ist, wird die CSS-Klasse d-none entfernt.
                                                                   //Dadurch wird der Ladeindikator sichtbar.

    // Asynchrone Netzwerkanfrage mit 'fetch'
    fetch(GEMINI_API_URL, { //Startet eine Netzwerkanfrage an die in GEMINI_API_URL gespeicherte Adresse
        method: 'POST', //HTTP-Methode POST zur datensendung
        headers: { //zusätliche Informatonen mitgeschickts
            'Content-Type': 'application/json', //
            'x-goog-api-key': apiKey // Übermittlung des API-Keys im Header
        },
        body: JSON.stringify({  //
            contents: [{ //
                parts: [{ text: prompt }] // Übermittlung der Nutzerfrage als JSON-Struktur, passend für gemini
            }]
        })
    })
    .then(response => { //warte auf server antwort 
        // HTTP-Statuscodes auswerten
        if (!response.ok) { //prüfen auf fehler
            return response.json().then(err => { //liest fehlermeldung des servers aus
                const errorMsg = err.message || response.statusText; //falls keine fehlermeldung vorhande, generische verwenden
                throw new Error(`API-Fehler: ${response.status} - ${errorMsg}`);  //neue fehermeldung erstellt
            }).catch(() => { //Falls schon beim Auslesen der Fehlermeldung ein Fehler, wird dieser abgefangen und generischer fehlermeldung ausgegeben
                throw new Error(`API-Fehler: ${response.status} - ${response.statusText}`);  //
            });
        }
        return response.json(); // Wandelt die Antwort des Servers in ein JS-Objekt um
    })
    .then(data => { //Verarbeitet die erfolgreiche Antwort der API
        // Die verwendete Gemini-API liefert die Antwort im candidates-Objekt.
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "Keine Antwort erhalten.";

        // Aufrufen der Callback-Funktion mit dem extrahierten KI-Text - damit angezeigt werden kann
        callback(aiResponse); //
    })
    .catch(error => { //fängt einen Fehler bei der API-Anfrage ab
        console.error("Fehler bei der API-Anfrage:", error); // Gibt den Fehler in der Browser-Konsole aus
        callback(`Fehler: ${error.message}. Bitte überprüfe deine Internetverbindung oder den API-Key.`); //Fehlermeldung im Chat
    })
    .finally(() => {
        // Ladeanzeige unabhängig von Erfolg/Fehler wieder ausblenden
        if (loadingSpinner) loadingSpinner.classList.add('d-none'); //
    });
}


// 5. Funktionen des Kochplaners
// ==========================================================================

//Liest Rezepte aus dem LocalStorage
// erzeugt dynamisch das HTML für die Liste ausgewählter Rezepte im Planer
function renderPlannerRecipes() { //rezepte im planer anzeigen
    const list = document.getElementById('selected-recipes-list'); //Sucht die HTML-Liste Rezepte. Wenn sie nicht existiert, wird abgebrochen
    if (!list) return; //

    // Rezepte aus dem LocalStorage auslesen
    const plannerRecipes = getPlannerRecipes();

    // Zustand 1: Keine Rezepte vorhanden
    if (plannerRecipes.length === 0) { //
        list.innerHTML = `<p class="text-muted small text-center my-3">Keine Rezepte ausgewählt. Klicke auf das Uhr-Symbol in einer Rezeptkarte.</p>`; //
        return; //
    }

    // Zustand 2: Rezepte vorhanden -> Inhalt leeren und neu aufbauen
    list.innerHTML = ''; //

    plannerRecipes.forEach((recipe, index) => {  //geht einzeln jedes rezept durch 
        const item = document.createElement('div'); //erstellt für jedes rezept neues div
        item.className = 'selected-recipe-item'; //<div> erhält die CSS-Klasse selected-recipe-item

        // gespeicherter Rezepttitel nur als Textinhalt verwendet
        const titleSpan = document.createElement('span');
        titleSpan.innerHTML = '<i class="bi bi-check-circle-fill text-success me-2"></i>';
        titleSpan.appendChild(document.createTextNode(recipe.titel || "Unbenanntes Rezept"));

        const removeButton = document.createElement('button');
        removeButton.className = 'btn-remove-recipe';
        removeButton.dataset.index = index;
        removeButton.innerHTML = '<i class="bi bi-x-circle"></i>';

        item.appendChild(titleSpan);
        item.appendChild(removeButton);
        list.appendChild(item);
    });

    // Event-Listener an alle neu erstellten Lösch-Buttons anhängen
    const removeButtons = list.querySelectorAll('.btn-remove-recipe');
    removeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const indexToRemove = parseInt(btn.getAttribute('data-index'));
            let currentRecipes = getPlannerRecipes();

            // Entfernt den Eintrag an der entsprechenden Stelle aus dem Array
            currentRecipes.splice(indexToRemove, 1);

            // Aktualisiert den LocalStorage
            savePlannerRecipes(currentRecipes);

            // Aktualisiert die Anzeige
            renderPlannerRecipes(); //
        });
    });
}


// Sendet die ausgewählten Rezepte samt allen detaillierten Kochschritten an Gemini,
// damit die KI einen zeitlich optimierten, parallelen Ablaufplan generiert.
function optimizeRecipeSteps() {
    const stepsContainer = document.getElementById('ki-steps-container');
    const loadingSpinner = document.getElementById('loading-spinner');
    if (!stepsContainer) return;

    // Rezepte aus LocalStorage auslesen
    const plannerRecipes = getPlannerRecipes();

    if (plannerRecipes.length === 0) {
        stepsContainer.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="bi bi-robot fs-1 d-block mb-2"></i>
                Wähle Rezepte aus, um einen kombinierten Zeitplan zu generieren.
            </div>
        `;
        return;
    }

    // Ladeanimation anzeigen
    if (loadingSpinner) loadingSpinner.classList.remove('d-none');
    stepsContainer.innerHTML = `
        <div class="text-center text-muted py-3">
            <div class="spinner-border spinner-border-sm" role="status"></div>
            <span class="ms-2">Optimiert Kochschritte...</span>
        </div>
    `;

    // Baut aus allen ausgewählten Rezepten einen übersichtlichen Gesamttext
    const formattedRecipesDetails = plannerRecipes.map((recipe, index) => {
        const title = recipe.titel || `Rezept ${index + 1}`;

        // Die ursprüngliche Portionszahl wird mitgegeben,
        // damit die KI weiß, für wie viele Portionen die vorhandenen Mengen gedacht sind.
        const portions = recipe.portionen ? `  Portionen: ${recipe.portionen}\n` : "";

        let stepsText = "";

        // Prüft, ob das Schritte-Objekt mit Vorbereitung und Zubereitung vorhanden ist
        if (recipe.schritte && typeof recipe.schritte === 'object' && !Array.isArray(recipe.schritte)) {

            // Vorbereitungsschritte
            if (Array.isArray(recipe.schritte.vorbereitung) && recipe.schritte.vorbereitung.length > 0) {
                stepsText += "  Vorbereitung:\n";

                recipe.schritte.vorbereitung.forEach(step => {
                    const nr = step.nummer ? `[${step.nummer}] ` : "";
                    const text = typeof step === 'object' ? (step.text || "") : step;
                    const zeit = typeof step === 'object' && step.zeit_min != null
                        ? ` (${step.zeit_min} Min.)`
                        : "";
                    stepsText += `  - ${nr}${text}${zeit}\n`;
                });
            }

            // Zubereitungsschritte
            if (Array.isArray(recipe.schritte.zubereitung) && recipe.schritte.zubereitung.length > 0) {
                stepsText += "  Zubereitung:\n";

                recipe.schritte.zubereitung.forEach(step => {
                    const nr = step.nummer ? `[${step.nummer}] ` : "";
                    const text = typeof step === 'object' ? (step.text || "") : step;
                    const zeit = typeof step === 'object' && step.zeit_min != null
                        ? ` (${step.zeit_min} Min.)`
                        : "";
                    stepsText += `  - ${nr}${text}${zeit}\n`;
                });
            }
        }

        // Fallback: Schritte als einfaches Array
        else if (Array.isArray(recipe.schritte) && recipe.schritte.length > 0) {
            stepsText = recipe.schritte.map((step, sIdx) => {
                if (typeof step === 'object') {
                    return `  - ${step.text || JSON.stringify(step)}${step.zeit_min != null ? ` (${step.zeit_min} Min.)` : ''}`;
                }
                return `  - ${sIdx + 1}. ${step}`;
            }).join("\n");
        }

        // Fallback: Schritte als String
        else if (typeof recipe.schritte === 'string' && recipe.schritte.trim() !== '') {
            stepsText = recipe.schritte;
        }

        // Falls gar keine Schritte gelesen werden konnten
        if (!stepsText) {
            stepsText = "  Keine detaillierten Schritte angegeben.";
        }

        // Zutaten für zusätzlichen Kontext
        let ingredientsText = "";

        if (Array.isArray(recipe.zutaten) && recipe.zutaten.length > 0) {
            const zutatenList = recipe.zutaten.map(z => {
                if (typeof z === 'object') {
                    const menge = z.menge_original != null && z.menge_original !== ''
                        ? z.menge_original
                        : `${z.menge ?? ''} ${z.einheit ?? ''}`.trim(); // bewahrt Menge und Einheit

                    return `${menge} ${z.name}`.trim(); // verbindet Menge, Einheit und Zutatenname
                }

                return z;
            }).join(", ");

            ingredientsText = `  Zutaten: ${zutatenList}\n`;
        }

        // Führt Titel, Portionen, Zutaten und alle Kochschritte zusammen
        return `--- REZEPT ${index + 1}: ${title} ---\n${portions}${ingredientsText}Kochschritte:\n${stepsText}`;
    }).join("\n\n");


    // Erstellt eine kommagetrennte Liste aller Rezepttitel
    const recipeTitlesList = plannerRecipes.map(r => r.titel).join(', ');

    // Detaillierter Prompt für Gemini
    const prompt = `
        Du bist ein professioneller Chefkoch und Küchen-Organisator.
        Ich möchte folgende Rezepte gleichzeitig kochen:

        ${formattedRecipesDetails}

        Kombiniere und optimiere die Kochschritte aller oben genannten Rezepte so, dass sie parallel ausgeführt werden können, wo es möglich ist (z. B. Gemüse schneiden oder Soße ansetzen, während etwas im Ofen backt oder Wasser kocht).

        Berücksichtige dabei:
        - ALLE angegebenen Zutaten, jeweils mit der tatsächlichen Menge und Einheit
        - die ursprünglichen Portionszahlen der Rezepte
        - ALLE angegebenen Vorbereitungs- und Zubereitungsschritte
        - die angegebenen Zeiten (zeit_min) jedes einzelnen Vorbereitungs- und Zubereitungsschritts
        - die Reihenfolge, in der einzelne Schritte ausgeführt werden müssen
        - dass KEINE Zutat, Menge, Einheit, Portionenangabe oder Vorbereitung/Zubereitungsschritt aus einem der Rezepte verloren geht
        - dass Mengen und Einheiten nicht erfunden, verändert oder weggelassen werden dürfen

        Gib die Kochschritte so aus, dass die tatsächlichen Mengen, Einheiten und Zutaten weiterhin eindeutig erkennbar sind.
        Verwende die übergebenen Schrittzeiten als Grundlage für die zeitliche Planung und schätze nur dort, wo keine Zeit angegeben ist.

        Antworte in einer klaren, chronologischen Reihenfolge mit geschätzten Zeitangaben.

        Antworte im folgenden Format:

        Minute 0-10: [Schrittbeschreibung mit Angabe, zu welchem Rezept die Aktion gehört]
        Minute 10-20: [Schrittbeschreibung...]
    `;

    // API Aufrufen und Ergebnis anzeigen
    callGeminiAPI(prompt, (response) => {
        stepsContainer.innerHTML = `
            <div class="step-item">
                <strong>Optimierter Zeitplan für: ${recipeTitlesList}</strong>
                <hr class="my-2">
                ${markdownToHtml(response)}
            </div>
        `;
    });
}


// Fügt ein Rezept zum Kochplaner hinzu und speichert es im LocalStorage.
// Das übergebene Rezept enthält die vollständigen Daten aus dem Detail-Endpunkt,
// damit Zutaten, Mengen, Portionen und Kochschritte später für die Optimierung verfügbar sind.
function addRecipe(recipe) {
    // Bereits gespeicherte Rezepte aus dem LocalStorage auslesen
    let plannerRecipes = getPlannerRecipes();

    // ID als eindeutige Zuordnung des Rezepts
    const isAlreadyAdded = plannerRecipes.some(item => item.id === recipe.id);

    if (!isAlreadyAdded) {
        // Vollständiges Rezeptobjekt speichern
        // damit der Kochplaner später auf alle Daten des Detail-Endpunkts zugreifen kann.
        plannerRecipes.push({
            id: recipe.id,
            titel: recipe.titel,
            bild_url: recipe.bild_url,
            kategorie: recipe.kategorie,
            kueche: recipe.kueche,
            portionen: recipe.portionen,
            zutaten: recipe.zutaten || [],
            schritte: recipe.schritte || {}
        });

        // vollständige Rezeptliste wieder im LocalStorage speichern
        savePlannerRecipes(plannerRecipes);

        renderPlannerRecipes();
    } else {
        alert(`"${recipe.titel}" befindet sich bereits im Kochplaner.`);
    }
}


// Funktionen im globalen 'window'-Objekt verfügbar machen,
// damit sie auch von Inline-HTML Event-Handlern aufgerufen werden können
window.renderPlannerRecipes = renderPlannerRecipes; //
window.addRecipe = addRecipe; //