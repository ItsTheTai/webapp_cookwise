// 1. The Master Function (This is what you call when your API data arrives)
function populateDropdowns(recipes) {

    // If the navbar HTML hasn't finished loading yet, wait 100ms and try again
    if (!document.getElementById("dropdown-kategorie")) {
        setTimeout(() => populateDropdowns(recipes), 100);
        return;
    }

    // Just pass the list element ID and the recipe object property name!
    setupSingleDropdown("dropdown-kategorie", "kategorie", recipes);
    setupSingleDropdown("dropdown-kueche", "kueche", recipes);
    setupSingleDropdown("dropdown-schwierigkeit", "schwierigkeitsgrad", recipes);
    setupSingleDropdown("dropdown-eco", "oekobilanz", recipes);
}

// 2. The Reusable Helper (It does all the heavy lifting for ONE dropdown)
function setupSingleDropdown(elementId, keyName, recipes) {
    const listElement = document.getElementById(elementId);
    let uniqueItems = [];

    // Loop through the data to find unique items
    for (let recipe of recipes) {
        let value = recipe[keyName];

        if (value && !uniqueItems.includes(value)) {
            uniqueItems.push(value);
        }
    }

    // 🌟 FIXED: Start with an empty string instead of the "Alle anzeigen" button
    let dropdownHtml = "";

    // Build out only the actual categories found in your data
    for (let item of uniqueItems) {
        dropdownHtml += `<li><button class="dropdown-item" type="button" onclick="filterBy('${keyName}', '${item}')">${item}</button></li>`;
    }

    listElement.innerHTML = dropdownHtml;
}