const API_URL = "https://recipes.digitalhumanities.io/api/rezepte/";
const API_KEY = "your_secret_key_here"; // Replace with your actual API key

// Ein neues Rezept an die API schicken
function legeRezeptAn(rezept) {
    return fetch(API_URL, {
        method: "POST",

        headers: {
            "Content-Type": "application/json",
            "X-API-Key": API_KEY
        },

        body: JSON.stringify(rezept)
    })

    .then(response => {
        if (response.status === 403) {
            throw new Error("API-Key fehlt oder ist falsch.");
        }

        if (!response.ok) {
            throw new Error("Anlegen fehlgeschlagen: " + response.statusText);
        }

        return response.json();
    });
}

// 1. Rezept: Borschtsch
const borschtschRezept = {
    titel: "Klassischer Borschtsch",
    kategorie: "Suppe",
    kueche: "osteuropäisch",
    schwierigkeitsgrad: "mittel",     
    oekobilanz: "gut",               
    portionen: 4,
    kurzbeschreibung: "Traditionelle Suppe mit Rote Bete, Rindfleisch und Kohl.",
    zubereitungszeit: { gesamt_min: 120, vorbereitung_min: 30, kochen_min: 90 },
    zutaten: [
        { name: "Rote Bete", menge: 300, menge_original: "300 g", einheit: "g" },
        { name: "Weißkohl", menge: 250, menge_original: "250 g", einheit: "g" },
        { name: "Rindfleisch", menge: 500, menge_original: "500 g", einheit: "g" },
        { name: "Kartoffeln", menge: 300, menge_original: "300 g", einheit: "g" },
        { name: "Karotten", menge: 150, menge_original: "150 g", einheit: "g" },
        { name: "Zwiebeln", menge: 100, menge_original: "100 g", einheit: "g" }
    ],
    schritte: {
        vorbereitung: [ { nummer: "1.1", text: "Gemüse schneiden und Fleisch kochen.", zeit_min: 30 } ],
        zubereitung: [ { nummer: "2.1", text: "Rote Bete anbraten und zusammen mit dem Gemüse in die Brühe geben.", zeit_min: 90 } ]
    }
};

// 2. Rezept: Napoleon Torte
const napoleonRezept = {
    titel: "Napoleon Torte",
    kategorie: "Dessert",
    kueche: "osteuropäisch",
    schwierigkeitsgrad: "schwer",    
    oekobilanz: "mittel",           
    portionen: 4,
    kurzbeschreibung: "Knusprige Blätterteigtorte mit feiner Vanillecreme.",
    zubereitungszeit: { gesamt_min: 180, vorbereitung_min: 60, kochen_min: 120 },
    zutaten: [
        { name: "Blätterteig", menge: 500, menge_original: "500 g", einheit: "g" },
        { name: "Milch", menge: 1000, menge_original: "1000 ml", einheit: "ml" },
        { name: "Butter", menge: 200, menge_original: "200 g", einheit: "g" },
        { name: "Zucker", menge: 250, menge_original: "250 g", einheit: "g" },
        { name: "Eier", menge: 4, menge_original: "4 Stk", einheit: "Stk" }
    ],
    schritte: {
        vorbereitung: [ { nummer: "1.1", text: "Teigböden backen und Vanillecreme zubereiten.", zeit_min: 60 } ],
        zubereitung: [ { nummer: "2.1", text: "Torte schichten und über Nacht im Kühlschrank ziehen lassen.", zeit_min: 120 } ]
    }
};

// 3. Rezept: Olivier Salat
const olivierRezept = {
    titel: "Olivier Salat",
    kategorie: "Salat",
    kueche: "osteuropäisch",
    schwierigkeitsgrad: "leicht",    
    oekobilanz: "gut",                
    portionen: 4,
    kurzbeschreibung: "Klassischer Kartoffelsalat mit Erbsen, Gewürzgurken und Mayonnaise.",
    zubereitungszeit: { gesamt_min: 45, vorbereitung_min: 30, kochen_min: 15 },
    zutaten: [
        { name: "Gekochte Kartoffeln", menge: 400, menge_original: "400 g", einheit: "g" },
        { name: "Gekochte Karotten", menge: 150, menge_original: "150 g", einheit: "g" },
        { name: "Gekochte Eier", menge: 4, menge_original: "4 Stk", einheit: "Stk" },
        { name: "Gewürzgurken", menge: 200, menge_original: "200 g", einheit: "g" },
        { name: "Erbsen (Dose)", menge: 150, menge_original: "150 g", einheit: "g" },
        { name: "Mayonnaise", menge: 150, menge_original: "150 g", einheit: "g" }
    ],
    schritte: {
        vorbereitung: [ { nummer: "1.1", text: "Kartoffeln, Karotten und Eier kochen und abkühlen lassen.", zeit_min: 15 } ],
        zubereitung: [ { nummer: "2.1", text: "Alles in kleine Würfel schneiden, Erbsen und Mayonnaise dazugeben und verrühren.", zeit_min: 30 } ]
    }
};

// Aufrufe 
//legeRezeptAn(borschtschRezept)
//  .then(rezept => console.log("Angelegt mit id:", rezept.id))
//  .catch(error => console.error(error));

//legeRezeptAn(napoleonRezept)
//   .then(rezept => console.log("Angelegt mit id:", rezept.id))
//   .catch(error => console.error(error));

//legeRezeptAn(olivierRezept)
//   .then(rezept => console.log("Angelegt mit id:", rezept.id))
//   .catch(error => console.error(error));

// Rezepte ändern (PATCH)
function aendereRezept(id, aenderungen) {
    return fetch(API_URL + id + "/", {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "X-API-Key": API_KEY
        },
        body: JSON.stringify(aenderungen)
    }).then(response => response.json());
}

// 1. Borschtsch zu Winaigrette umbenennen (Zutatenmengen und Serviervorschlag anpassen)
aendereRezept("7250b93ba3ea", {
    titel: "Winaigrette Salat",
    kategorie: "Salat",
    kurzbeschreibung: "Klassischer kalter Gemüsesalat mit Roter Bete und Sauerkraut.",
    serviervorschlag: "Kühl servieren und nach Wunsch mit frischen Kräutern wie Dill oder Petersilie garnieren.",
    zutaten: [
        { name: "Gekochte Rote Bete", name_original: "Gekochte Rote Bete", menge: 300, menge_original: "300g", einheit: "gr." },
        { name: "Gekochte Kartoffeln", name_original: "Gekochte Kartoffeln", menge: 300, menge_original: "300g", einheit: "gr." },
        { name: "Gekochte Karotten", name_original: "Gekochte Karotten", menge: 200, menge_original: "200g", einheit: "gr." },
        { name: "Gewürzgurken", name_original: "Gewürzgurken", menge: 150, menge_original: "150g", einheit: "gr." },
        { name: "Sauerkraut", name_original: "Sauerkraut", menge: 150, menge_original: "150g", einheit: "gr." },
        { name: "Pflanzenöl", name_original: "Pflanzenöl", menge: 50, menge_original: "50ml", einheit: "ml." }
    ]
}).then(res => console.log("Winaigrette erfolgreich aktualisiert:", res));

// 2. Napoleon Torte aktualisieren (Zutatenmengen/Einheiten und Serviervorschlag anpassen)
aendereRezept("0ffb5fca664c", {
    serviervorschlag: "Mit Krümeln bestreuen und gut gekühlt mit heißem Tee oder Kaffee servieren.",
    zutaten: [
        { name: "Blätterteig", name_original: "Blätterteig", menge: 500, menge_original: "500g", einheit: "gr." },
        { name: "Milch", name_original: "Milch", menge: 1000, menge_original: "1000ml", einheit: "ml." },
        { name: "Butter", name_original: "Butter", menge: 200, menge_original: "200g", einheit: "gr." },
        { name: "Zucker", name_original: "Zucker", menge: 250, menge_original: "250g", einheit: "gr." },
        { name: "Eier", name_original: "Eier", menge: 4, menge_original: "4", einheit: "st." }
    ]
}).then(res => console.log("Napoleon Torte erfolgreich aktualisiert:", res));

// 3. Olivier Salat aktualisieren (Zutatenmengen/Einheiten und Serviervorschlag anpassen)
aendereRezept("6491851d36dd", {
    serviervorschlag: "Gut gekühlt servieren, idealerweise vor dem Servieren mit frischen Erbsen garnieren.",
    zutaten: [
        { name: "Gekochte Kartoffeln", name_original: "Gekochte Kartoffeln", menge: 400, menge_original: "400g", einheit: "gr." },
        { name: "Gekochte Karotten", name_original: "Gekochte Karotten", menge: 150, menge_original: "150g", einheit: "gr." },
        { name: "Gekochte Eier", name_original: "Gekochte Eier", menge: 4, menge_original: "4", einheit: "st." },
        { name: "Gewürzgurken", name_original: "Gewürzgurken", menge: 200, menge_original: "200g", einheit: "gr." },
        { name: "Erbsen (Dose)", name_original: "Erbsen (Dose)", menge: 150, menge_original: "150g", einheit: "gr." },
        { name: "Mayonnaise", name_original: "Mayonnaise", menge: 150, menge_original: "150g", einheit: "gr." }
    ]
}).then(res => console.log("Olivier Salat erfolgreich aktualisiert:", res));