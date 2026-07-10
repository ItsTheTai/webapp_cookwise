let activeRecipeFilters = [];

function renderShoppingList(list = null) {
    const ingredients = groupIngredients(list);

    const tbody = document.getElementById("shoppinglist-body");
    tbody.innerHTML = "";

    ingredients.forEach(ingredient => {

        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td class="col-check">
                <input type="checkbox">
            </td>
            <td>${ingredient.name}</td>
            <td>${ingredient.amount} ${ingredient.unit}</td>
            <td>${ingredient.recipes.join(", ")}</td>
            <td>
                <button class="delete-btn" data-name="${ingredient.name}">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });

    addDeleteListeners();
}

function getRecipes() {
    const shoppingList = JSON.parse(localStorage.getItem("shoppinglist")) || [];

    return [
        ...new Set(
            shoppingList.map(ingredient => ingredient.recipe)
        )
    ];
}

function addDeleteListeners() {
    const buttons = document.querySelectorAll(".delete-btn");

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            const ingredientName = button.dataset.name;

            deleteIngredient(ingredientName);
        });
    });
}

function deleteIngredient(name) {
    let shoppingList = JSON.parse(localStorage.getItem("shoppinglist")) || [];

    shoppingList = shoppingList.filter(
        ingredient => ingredient.name !== name
    );

    localStorage.setItem(
        "shoppinglist",
        JSON.stringify(shoppingList)
    );

    renderShoppingList();
}

function groupIngredients(list = null) {
    const shoppingList = list || JSON.parse(localStorage.getItem("shoppinglist")) || [];

    const groupedIngredients = {};

    shoppingList.forEach(ingredient => {
        const key = ingredient.name.toLowerCase();

        if (!groupedIngredients[key]) {
            groupedIngredients[key] = {
                name: ingredient.name,
                amount: ingredient.amount,
                unit: ingredient.unit,
                recipes: [ingredient.recipe]
            };
        } else {
            groupedIngredients[key].amount += ingredient.amount;

            if (!groupedIngredients[key].recipes.includes(ingredient.recipe)) {
                groupedIngredients[key].recipes.push(ingredient.recipe);
            }
        }
    });

    return Object.values(groupedIngredients);
}

function renderRecipeFilters() {
    const recipes = getRecipes();
    const container = document.getElementById("recipe-filter-container");

    container.innerHTML = "";

    recipes.forEach(recipe => {
        const button = document.createElement("button");

        button.type = "button";
        button.classList.add(
            "btn",
            "btn-outline-light",
            "btn-sm"
        );

        button.textContent = recipe;
        button.dataset.recipe = recipe;

        button.addEventListener("click", () => {
            toggleRecipeFilter(recipe, button);
        });

        container.appendChild(button);
    });
}

function toggleRecipeFilter(recipe, button) {

    if (activeRecipeFilters.includes(recipe)) {

        activeRecipeFilters = activeRecipeFilters.filter(
            item => item !== recipe
        );

        button.classList.remove("active");

    } else {

        activeRecipeFilters.push(recipe);

        button.classList.add("active");
    }

    applyRecipeFilters();
}

function applyRecipeFilters() {
    const shoppingList = JSON.parse(localStorage.getItem("shoppinglist")) || [];


    if (activeRecipeFilters.length === 0) {
        renderShoppingList();
        return;
    }

    const filteredList = shoppingList.filter(ingredient =>
        activeRecipeFilters.includes(ingredient.recipe)
    );

    renderShoppingList(filteredList);
}

function addCustomIngredient() {
    const name = document.getElementById("ingredientName").value;
    const amount = Number(document.getElementById("ingredientAmount").value);
    const unit = document.getElementById("ingredientUnit").value;

    if (!name || !amount) {
        alert("Bitte Zutat und Menge eingeben.");
        return;
    }

    const shoppingList = JSON.parse(localStorage.getItem("shoppinglist")) || [];

    shoppingList.push({
        name: name,
        amount: amount,
        unit: unit,
        recipe: "Eigene Zutat"
    });

    localStorage.setItem(
        "shoppinglist",
        JSON.stringify(shoppingList)
    );

    renderShoppingList();
}

renderShoppingList()
renderRecipeFilters()
document
    .getElementById("addIngredientBtn")
    .addEventListener("click", addCustomIngredient);

