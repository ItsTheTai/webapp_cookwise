// Dictionary für das Mapping von Ökobilanz-Werten auf Bootstrap-Icon Smiley-Bundles
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

// Globale Variablen für den Portionsrechner
let aktuellesRezept = null;
let aktuellePortionen = 1;

// Logik für die Einkaufsliste
let ingredients = [];
let recipeTitle = "";

// Event-Listener für den Einkaufslisten-Button
const shoppinglistBtn = document.getElementById("shoppingListButton");
if (shoppinglistBtn) {
    shoppinglistBtn.addEventListener("click", handleShoppingListButton);
}

// Fügt die aktuellen Zutaten zur Einkaufsliste im LocalStorage hinzu
function handleShoppingListButton() {
    if (!ingredients.length) return;

    const currentList = JSON.parse(localStorage.getItem("shoppinglist")) || [];
    currentList.push(...ingredients);
    localStorage.setItem("shoppinglist", JSON.stringify(currentList));
    showVisualFeedback(shoppinglistBtn, "success", `"${recipeTitle}" zur Einkaufsliste hinzugefügt!`);
}

// -----------------------------------------------------------------------------
// PORTIONSRECHNER LOGIK
// -----------------------------------------------------------------------------

// Mapping für englische Einheiten und Hinweise auf Deutsch
const unitTranslations = {
    'chopped': 'gehackt',
    'parts': 'Teile',
    'part': 'Teil',
    'large': 'groß',
    'small': 'klein',
    'tblsp': 'EL',
    'tblsp.': 'EL',
    'tbsp': 'EL',
    'tbsp.': 'EL',
    'tbls': 'EL',
    'tsp': 'TL',
    'tsp.': 'TL',
    'to serve': 'zum Servieren',
    'st.': 'Stk',
    'st': 'Stk',
    'el.': 'EL',
    'el': 'EL',
    'tl.': 'TL',
    'tl': 'TL',
    'gr.': 'g',
    'gr': 'g'
};

// Hilfsfunktion: Ersetzt englische Begriffe im gesamten Text
function translateUnit(text) {
    if (!text) return "";
    let translated = text.toString().trim();

    // Geht alle Wörter im Mapping durch und ersetzt sie (unabhängig von Groß-/Kleinschreibung)
    Object.keys(unitTranslations).forEach(englishWord => {
        const germanWord = unitTranslations[englishWord];
        // \b sorgt dafür, dass nur ganze Wörter ersetzt werden
        const regex = new RegExp(`\\b${englishWord}\\b`, 'gi');
        translated = translated.replace(regex, germanWord);
    });

    return translated;
}

// Hilfsfunktion zum Runden von Mengenwerten auf zwei Nachkommastellen
function rundeMenge(menge) {
  if (menge === null || menge === undefined || isNaN(menge)) return "";
  return Number(menge.toFixed(2));
}

// Hauptfunktion: Rendert die dynamische Zutatenliste im DOM
function zutatenAnzeigen() {
  if (!aktuellesRezept || !aktuellesRezept.zutaten) return;

  const basisPortionen = aktuellesRezept.portionen || 1;
  const faktor = aktuellePortionen / basisPortionen;

  // Suche nach dem UL-Element innerhalb des Containers oder direkt per ID
  const container = document.getElementById("ingredients-container");
  const liste = container ? container.querySelector("ul.ingredients-list") || container.querySelector("ul") : document.getElementById("zutaten-liste");
  
  if (!liste) return;

  // Zurücksetzen und Vorbereiten der Liste
  liste.className = "ingredients-list list-unstyled m-0 p-0 mb-3";
  liste.innerHTML = "";
  ingredients = []; // Synchronisation mit der Einkaufsliste

  aktuellesRezept.zutaten.forEach(zutat => {
    const li = document.createElement("li");
    li.className = "py-1 d-flex align-items-center";

    const name = zutat.zutat || zutat.name || "";
    const rawUnit = zutat.einheit || "";
    const unit = translateUnit(rawUnit);
    const baseAmount = parseFloat(zutat.menge);

    let calculatedAmount = null;
    let rightContent = "";

    // Behandlung von Zutaten ohne feste Mengenangabe (z. B. "nach Geschmack" oder "To serve")
    if (zutat.menge === null || zutat.menge === undefined || isNaN(baseAmount)) {
      const rawNote = zutat.hinweis || rawUnit || "";
      const note = translateUnit(rawNote);
      rightContent = `<span class="ingredient-note">${note}</span>`;
    } else {
      calculatedAmount = rundeMenge(baseAmount * faktor);
      rightContent = `
        <span class="ingredient-amount-wrap">
          <strong class="ingredient-amount">${calculatedAmount}</strong> ${unit}
        </span>
      `;
    }

    // Schlankes HTML-Markup ohne duplizierten Code
    li.innerHTML = `
      <i class="bi bi-circle"></i>
      <span class="ingredient-name">${name}</span>
      ${rightContent}
    `;

    liste.appendChild(li);

    // Datenobjekt für die Einkaufsliste speichern
    ingredients.push({
      name: name,
      unit: unit,
      amount: calculatedAmount,
      recipe: aktuellesRezept.titel
    });
  });

  // Aktualisierung der Portionsanzeige im DOM
  const portionenEl = document.getElementById("portionen-anzahl") || document.getElementById("portions-count");
  if (portionenEl) {
    portionenEl.textContent = aktuellePortionen;
  }
}
// -----------------------------------------------------------------------------
// API & INITIALISIERUNG
// -----------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
    // Event-Listener für die Portionsrechner-Buttons (+ / -)
    const btnPlus = document.getElementById("portionen-plus") || document.getElementById("btn-plus");
    const btnMinus = document.getElementById("portionen-minus") || document.getElementById("btn-minus");

    if (btnPlus) {
        btnPlus.addEventListener("click", () => {
            aktuellePortionen++;
            zutatenAnzeigen();
        });
    }

    if (btnMinus) {
        btnMinus.addEventListener("click", () => {
            if (aktuellePortionen > 1) {
                aktuellePortionen--;
                zutatenAnzeigen();
            }
        });
    }

    // Rezept-ID aus der URL auslesen (mit Fallback auf ID '1')
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id') || '1';

    const detailUrl = `https://recipes.digitalhumanities.io/api/rezepte/${recipeId}/?format=json`;

    // Rezeptdaten von der REST-API abrufen
    fetch(detailUrl)
        .then(response => {
            if (!response.ok) throw new Error("Fehler beim Laden der Rezeptdaten");
            return response.json();
        })
        .then(recipe => renderRecipeDetail(recipe))
        .catch(error => console.error("Fehler beim Abrufen der Rezeptdetails:", error));
});

// Befüllt die Seite dynamisch mit den Daten aus der API
function renderRecipeDetail(recipe) {
    aktuellesRezept = recipe;
    recipeTitle = recipe.titel;
    aktuellePortionen = recipe.portionen || 1;

    document.title = recipe.titel;

    // 1. Text-Zuordnungen für einfache Werte
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

    // 2. Strukturelle Werte (Titel und Beschreibung)
    const titleEl = document.querySelector(".recipe-title-detail");
    if (titleEl) titleEl.textContent = recipe.titel;

    const descEl = document.querySelector(".recipe-description-text");
    if (descEl) descEl.textContent = recipe.kurzbeschreibung;

    // 3. Ökobilanz-Smiley anzeigen
    const ecoContainer = document.querySelector(".smiley-group-detail");
    if (ecoContainer && recipe.oekobilanz) {
        ecoContainer.innerHTML = ecoToSmiley[recipe.oekobilanz];
    }

    // 4. Rezeptbild setzen
    const imgEl = document.querySelector(".recipe-card-layout img");
    if (imgEl) {
        imgEl.src = recipe.bild_url;
        imgEl.alt = recipe.titel;
    }

    // 5. Dynamischer Tab-Inhalt
    // A. PREP-TAB (Zutaten anzeigen)
    zutatenAnzeigen();

    // B. COOK-TAB (Zubereitungsschritte)
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
            } else {
                stepsContainer.innerHTML = "<li>Keine Schritte verfügbar.</li>";
            }
        }
    } catch (e) {
        console.error("Fehler im Cook-Tab-Block:", e);
    }

    // C. SERVE-TAB (Serviervorschlag)
    try {
        const servePane = document.getElementById("serve-pane");
        if (servePane && recipe.serviervorschlag) {
            servePane.innerHTML = `
                <h5 class="tab-section-title">Anrichten & Servieren</h5>
                <p class="recipe-text-block">${recipe.serviervorschlag}</p>
            `;
        }
    } catch (e) {
        console.error("Fehler beim Rendern des Serve-Tabs:", e);
    }

    // 6. Favoriten-Funktionalität
    const favoriteBtn = document.querySelector(".btn-favorite");
    if (favoriteBtn) {
        let favorites = JSON.parse(localStorage.getItem("recipe_favorites")) || [];
        if (favorites.some(fav => fav.id === recipe.id)) {
            favoriteBtn.style.color = "#dc3545";
        }

        favoriteBtn.addEventListener("click", (e) => {
            e.preventDefault();
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
                favoriteBtn.style.color = "#dc3545";
                showVisualFeedback(favoriteBtn, "success", `"${recipe.titel}" zu Favoriten hinzugefügt!`);
            } else {
                showVisualFeedback(favoriteBtn, "warning", "Bereits in Favoriten vorhanden!");
            }
        });
    }

    // 7. KI-Kochplaner-Funktionalität
    const plannerBtn = document.querySelector(".btn-timer");
    if (plannerBtn) {
        let plannerRecipes = JSON.parse(localStorage.getItem("ai_planner_recipes")) || [];
        if (plannerRecipes.some(item => item.id === recipe.id)) {
            plannerBtn.style.color = "#0dcaf0";
        }

        plannerBtn.addEventListener("click", (e) => {
            e.preventDefault();
            let currentPlannerRecipes = JSON.parse(localStorage.getItem("ai_planner_recipes")) || [];
            const isAlreadyAdded = currentPlannerRecipes.some(item => item.id === recipe.id);

            if (!isAlreadyAdded) {
                currentPlannerRecipes.push({ id: recipe.id, titel: recipe.titel });
                localStorage.setItem("ai_planner_recipes", JSON.stringify(currentPlannerRecipes));
                plannerBtn.style.color = "#0dcaf0";
                showVisualFeedback(plannerBtn, "success", `"${recipe.titel}" zum Kochplaner hinzugefügt!`);
            } else {
                showVisualFeedback(plannerBtn, "warning", "Bereits im Kochplaner vorhanden!");
            }
        });
    }
}

// Erstellt und zeigt dynamische Toast-Benachrichtigungen für Nutzer-Feedback
function showVisualFeedback(element, status, message) {
    const originalColor = element.style.color;
    if (status === "warning") {
        element.style.color = "#ffc107";
        setTimeout(() => { element.style.color = originalColor; }, 1000);
    }

    let container = document.getElementById("feedback-toast-container");
    if (!container) {
        container = document.createElement("div");
        container.id = "feedback-toast-container";
        container.style.cssText = "position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px;";
        document.body.appendChild(container);
    }

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

    setTimeout(() => {
        alertBox.classList.remove("show");
        setTimeout(() => alertBox.remove(), 250);
    }, 3000);
}