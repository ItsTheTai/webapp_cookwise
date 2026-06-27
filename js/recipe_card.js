document.addEventListener('DOMContentLoaded', () => {
            

    // Dynamic Portions Scaling Scaling Engine Architecture
    const btnMinus = document.getElementById('btn-minus');
    const btnPlus = document.getElementById('btn-plus');
    const portionsCount = document.getElementById('portions-count');
    const ingredientAmounts = document.querySelectorAll('.ingredient-amount');

    // Recalculates ingredient volumes based on targeted target servings multiplier
    const updateIngredients = (servings) => {
        ingredientAmounts.forEach(element => {
            const baseValue = parseFloat(element.getAttribute('data-base'));
            const newValue = baseValue * servings;
            element.textContent = Number(newValue.toFixed(2));
        });
    };

    // Decrement Trigger Management Click Loop
    btnMinus.addEventListener('click', () => {
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