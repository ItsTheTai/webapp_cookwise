// Expose the function globally so it can scale elements created dynamically by the API
const updateIngredients = (servings) => {
    // CRITICAL: Query the DOM inside the function to capture dynamic elements rendered after API load
    window.currentServings = servings
    const ingredientAmounts = document.querySelectorAll('.ingredient-amount');
    ingredientAmounts.forEach(element => {
        const baseValue = parseFloat(element.getAttribute('data-base'));
        if (!isNaN(baseValue) && baseValue > 0) {
            const newValue = baseValue * servings;
            // Prevent trailing decimals and update the visible text volume
            element.textContent = Number(newValue.toFixed(2));
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    const btnMinus = document.getElementById('btn-minus');
    const btnPlus = document.getElementById('btn-plus');
    const portionsCount = document.getElementById('portions-count');
    const btnShoppingList = document.getElementById('shoppingListButton')

    if (!btnMinus || !btnPlus || !portionsCount) return;

    // Decrement Trigger Management Click Loop
    btnMinus.addEventListener('click', () => {
        console.log(ingredients)
        let currentServings = parseInt(portionsCount.textContent);
        if (currentServings > 1) {
            currentServings--;
            portionsCount.textContent = currentServings;
            updateIngredients(currentServings);
        }
    });

    // Increment Trigger Management Click Loop
    btnPlus.addEventListener('click', () => {
        let currentServings = parseInt(portionsCount.textContent);
        currentServings++;
        portionsCount.textContent = currentServings;
        updateIngredients(currentServings);
    });
});

