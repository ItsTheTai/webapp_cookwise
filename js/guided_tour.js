// Guided Tour Steps
const tourSteps = [
    {
        id: 1,
        title: "Willkommen bei CookWise!",
        description: "Diese Tour führt dich durch die wichtigsten Funktionen von CookWise.",
        element: null, // No element to highlight for the welcome step
        position: "center",
    },
    {
        id: 2,
        title: "Rezeptkarten",
        description: "Stöbere auf der Startseite in den Rezepten. Die Smileys indizieren den Schwierigkeitsgrad. Klicke auf eine beliebige Karte, um die Details anzuzeigen. Innerhalb des Rezepts: Klicke auf das Herz, um Gerichte zu favorisieren. Auf den Einkaufswagen, um das Gericht zur Einkaufliste hinzuzufügen. Auf die Uhr, um das Rezept zum Kochplaner hinzuzufügen.",
        element: "#recipes", // Highlight the recipes container
        position: "top",
    },
    {
        id: 3,
        title: "KI-Kochplaner",
        description: "Klicke in der Navigationsleiste auf das Uhr-Icon, um den KI-Assistenten aufzurufen. Der Planer akzeptiert mehrere Gerichte und hilft dir dabei, die an ihn übergebenen Rezepte ressourcenschonend miteinander zu koordinieren. Klicke zu Beginn auf das Schlüssel-Icon, um einen eigenen API-Key einzugeben.",
        element: "#navbar a[href*='ai_assistant']", // Highlight the AI Assistant link in the navbar
        position: "bottom",
    },
    {
        id: 4,
        title: "Einkaufliste",
        description: "Hier werden alle Zutaten gelistet, daren Rezepte du in die Einkaufliste gelegt hast. Zutaten können auch manuell eingegeben werden.",
        element: "#navbar a[href*='shoppinglist']", // Highlight the Cooking Planner button
        position: "bottom",
    },
    {
        id: 5,
        title: "Favoriten",
        description: "Alle favorisierten Rezepte erscheinen hier gelistet. Die Darstellung ist analog zur Startseite, nur mit einem anderem Farbschema.",
        element: "#navbar a[href*='favoriten']", // Highlight the Favorites link in the navbar
        position: "bottom",
    },
    {
        id: 6,
        title: "Profil",
        description: "Hier kann das Farbschema geändert werden: Light- vs. Darkmode stehen dir zur Auswahl.",
        element: "#profileDropdown", // Highlight the Favorites link in the navbar
        position: "bottom",
    },
    {
        id: 7,
        title: "Gefilterte Suche",
        description: "Nutze den Filter, um Rezepte nach Kategorie und die Suchleiste, um Rezepte nach Name oder Zutaten zu finden.",
        element: "#navbarContent > div", // Highlight the filter container
        position: "bottom",
    },
    {
        id: 8,
        title: "Home Button",
        description: "Klicke auf das Logo, um von jeder Seite wieder zurück zum Startbildschirm zu gelangen.",
        element: "#navbar > nav > div > a", // Highlight the filter container
        position: "",
    },
];

// Current Step Tracker
let currentStep = 0;

// Initialize the Tour
function initGuidedTour() {
    const startButton = document.getElementById("start-guided-tour");
    const overlay = document.getElementById("guided-tour-overlay");
    const tooltip = document.getElementById("guided-tour-tooltip");
    const tooltipTitle = document.getElementById("tooltip-title");
    const tooltipDescription = document.getElementById("tooltip-description");
    const prevButton = document.getElementById("prev-step");
    const nextButton = document.getElementById("next-step");
    const cancelButton = document.getElementById("cancel-tour");

    // Ensure overlay and tooltip start hidden on load
    overlay.classList.add("d-none");
    tooltip.classList.add("d-none");

    // Create and hide the highlight element before appending
    const highlight = document.createElement("div");
    highlight.id = "guided-tour-highlight";
    highlight.style.display = "none";
    document.body.appendChild(highlight);

    // const startButton = document.getElementById("start-guided-tour");
    // const overlay = document.getElementById("guided-tour-overlay");
    // const tooltip = document.getElementById("guided-tour-tooltip");
    // const tooltipTitle = document.getElementById("tooltip-title");
    // const tooltipDescription = document.getElementById("tooltip-description");
    // const prevButton = document.getElementById("prev-step");
    // const nextButton = document.getElementById("next-step");
    // const cancelButton = document.getElementById("cancel-tour");

    // // Create the highlight element
    // const highlight = document.createElement("div");
    // highlight.id = "guided-tour-highlight";
    // document.body.appendChild(highlight);

    // Start the Tour
    startButton.addEventListener("click", () => {
        currentStep = 0;
        overlay.classList.remove("d-none");
        renderTourStep(currentStep);
    });

    // Cancel the Tour
    cancelButton.addEventListener("click", () => {
        overlay.classList.add("d-none");
        tooltip.classList.add("d-none");
        highlight.style.display = "none";
    });

    // Previous Step
    prevButton.addEventListener("click", () => {
        if (currentStep > 0) {
            currentStep--;
            renderTourStep(currentStep);
        }
    });

    // Next Step
    nextButton.addEventListener("click", () => {
        if (currentStep < tourSteps.length - 1) {
            currentStep++;
            renderTourStep(currentStep);
        } else {
            // Tour is complete
            overlay.classList.add("d-none");
            tooltip.classList.add("d-none");
            highlight.style.display = "none";
        }
    });

    // Render the Current Step
    function renderTourStep(stepIndex) {
        const step = tourSteps[stepIndex];
        tooltipTitle.textContent = step.title;
        tooltipDescription.textContent = step.description;

        // Hide the highlight and tooltip initially
        highlight.style.display = "none";
        tooltip.classList.add("d-none");

        if (step.element) {
            // Highlight the element
            const element = document.querySelector(step.element);
            if (element) {
                const rect = element.getBoundingClientRect();
                highlight.style.display = "block";
                highlight.style.width = `${rect.width}px`;
                highlight.style.height = `${rect.height}px`;
                highlight.style.top = `${rect.top + window.scrollY}px`;
                highlight.style.left = `${rect.left + window.scrollX}px`;

                // Position the tooltip
                tooltip.classList.remove("d-none");
                positionTooltip(step.position, rect, tooltip);
            }
        } else {
            // For steps without an element (e.g., welcome step), center the tooltip
            tooltip.classList.remove("d-none");
            tooltip.style.top = "50%";
            tooltip.style.left = "50%";
            tooltip.style.transform = "translate(-50%, -50%)";
        }

        // Update Button States
        prevButton.disabled = stepIndex === 0;
        nextButton.textContent = stepIndex === tourSteps.length - 1 ? "Fertig" : "Weiter";
    }

    // Position the Tooltip
    function positionTooltip(position, elementRect, tooltip) {
        const tooltipRect = tooltip.getBoundingClientRect();
        const scrollTop = window.scrollY;
        const scrollLeft = window.scrollX;

        switch (position) {
            case "top":
                tooltip.style.top = `${elementRect.top + scrollTop - tooltipRect.height + 70}px`;
                tooltip.style.left = `${elementRect.left + scrollLeft + (elementRect.width / 2) - (tooltipRect.width / 2)}px`;
                break;
            case "bottom":
                tooltip.style.top = `${elementRect.bottom + scrollTop + 200}px`;
                tooltip.style.left = `${elementRect.left + scrollLeft + (elementRect.width / 2) - (tooltipRect.width / 2)}px`;
                break;
            case "left":
                tooltip.style.top = `${elementRect.top + scrollTop + (elementRect.height / 2) - (tooltipRect.height / 2)}px`;
                tooltip.style.left = `${elementRect.left + scrollLeft - tooltipRect.width - 10}px`;
                break;
            case "right":
                tooltip.style.top = `${elementRect.top + scrollTop + (elementRect.height / 2) - (tooltipRect.height / 2)}px`;
                tooltip.style.left = `${elementRect.right + scrollLeft + 10}px`;
                break;
            default: // center
                tooltip.style.top = "50%";
                tooltip.style.left = "50%";
                tooltip.style.transform = "translate(-50%, -50%)";
        }
    }
}

// Load the Tour Script
document.addEventListener("DOMContentLoaded", initGuidedTour);