/**
 * CookWise - Rezept-Zwischenspeicher (Temporary Storage)
 */
const STORAGE_KEY = 'cookwise_temporary_recipes';

// Holt alle aktuell gespeicherten Rezepte aus dem localStorage
function getTemporaryRecipes() {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
}

// Speichert ein Rezept im temporären Speicher (verhindert Duplikate)
function saveRecipeToTemporaryStorage(recipeData) {
    if (!recipeData || !recipeData.id) return;

    let currentRecipes = getTemporaryRecipes();
    const exists = currentRecipes.some(item => item.id === recipeData.id);

    if (!exists) {
        currentRecipes.push(recipeData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentRecipes));
        alert(`"${recipeData.titel}" wurde zum KI Kochplaner hinzugefügt.`);
    } else {
        alert(`"${recipeData.titel}" ist bereits im KI Kochplaner.`);
    }
}

// Hilfsfunktion: Extrahiert Daten aus der HTML-Struktur für das spätere API-Format
function extractDataFromHTMLCard(card) {
    const titleElement = card.querySelector('.recipe-title');
    const title = titleElement ? titleElement.textContent.trim() : 'Unbekanntes Rezept';
    const id = card.getAttribute('data-id') || title.replace(/\s+/g, '-').toLowerCase();

    const imgElement = card.querySelector('.recipe-bg');
    const bildUrl = imgElement ? imgElement.src : '';

    const metaElement = card.querySelector('.recipe-meta');
    const metaText = metaElement ? metaElement.textContent.trim() : '';

    let minutes = 0;
    const timeMatch = metaText.match(/(\d+)\s*min/i);
    if (timeMatch && timeMatch[1]) {
        minutes = parseInt(timeMatch[1], 10);
    }

    // Exaktes Abbild deiner zukünftigen API-Struktur
    return {
        "id": id,
        "titel": title,
        "bild_url": bildUrl,
        "kategorie": "",
        "kueche": "",
        "schwierigkeitsgrad": metaText.split(',')[0] || "leicht",
        "oekobilanz": "",
        "portionen": 4,
        "kurzbeschreibung": "",
        "zubereitungszeit": {
            "gesamt_min": minutes,
            "vorbereitung_min": 0,
            "kochen_min": minutes
        }
    };
}