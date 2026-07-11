//List of active Recipe filters used to render only the corresponding ingredients
let activeRecipeFilters = [];

const clearShoppingListBtn = document.getElementById("clearListBtn");
const addIngredientBtn = document.getElementById("addIngredientBtn");
addIngredientBtn.addEventListener("click", addCustomIngredient);
clearShoppingListBtn.addEventListener("click", clearShoppingList);
renderShoppingList();
renderRecipeFilters();

/*Main UI-Function that creates a row into the table for each ingredient saved in localStorage. It is called whenever the UI needs to be refreshed (e.g. when manipulating the localStorage)
It gets the data via the groupIngredients() function which in case an ingredient is used in multiple recipes, adds up the amount and lists the recipes in the last column. */
function renderShoppingList(list = null) {
    const ingredients = groupIngredients(list);

    const tbody = document.getElementById("shoppinglist-body");
    tbody.innerHTML = "";

    ingredients.forEach(ingredient => {

        const tr = document.createElement("tr");

        tr.innerHTML = `

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

/*Main Function for rendering the Recipe Filters above the table. After recieving each unique recipe via the getRecipes() function, it creates a button and sets its onCLick-function to the toggleRecipeFilter() function.
It is also called whenever the list of recipes might have been changed to re-render the UI. */
function renderRecipeFilters() {
    const recipes = getRecipes();
    const container = document.getElementById("recipe-filter-container");

    container.innerHTML = "";

    recipes.forEach(recipe => {
        const button = document.createElement("button");

        button.type = "button";
        button.classList.add(
            "btn",
            "btn-outline-success",
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

//Returns a Set with each unique recipe
function getRecipes() {
    const shoppingList = JSON.parse(localStorage.getItem("shoppinglist")) || [];

    return [
        ...new Set(
            shoppingList.map(ingredient => ingredient.recipe)
        )
    ];
}

/*This function handles adding filters to the active Filter lists and also changes the Buttons stlye to indicate whether the filter is active or not.
Therefore, it needs two Parameters: the recipe that gets added/removed from the filter-list, and the corresponding button to change its state to active/passive.
It then calles the applyRecipeFilters() function.
*/
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

/*When called, this function applies the filters found in activeRecipeFilters to the shoppinglist using the .filter function on the ingredient list from localStorage 
and then calls renderShoppingList() with the filtered list to re-render the UI.
*/
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

//Simple function that adds the functionality to each delete button
function addDeleteListeners() {
    const buttons = document.querySelectorAll(".delete-btn");

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            const ingredientName = button.dataset.name;

            deleteIngredient(ingredientName);
        });
    });
}

//When clicked, the corresponding ingredient is filtered from the shopping list, which then gets saved to localStorage again. Then, the table & filters get re-rendered.
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
    renderRecipeFilters();
}


/*Functionality to add a new Ingredient from scratch to the shopping list.
It reads the user inputs and sends an alert if a value is missing.
If successful, the item is added to the shoppinglist and saved to localStorage. UI gets re-rendered at the end.
*/
function addCustomIngredient() {
    const name = document.getElementById("ingredientName").value;
    const amount = Number(document.getElementById("ingredientAmount").value);
    const unit = document.getElementById("ingredientUnit").value;
    const recipe = document.getElementById("ingredientRecipe").value;

    if (!name || !amount || !unit || !recipe) {
        alert("Bitte Zutat, Menge und Rezept eingeben.");
        return;
    }

    const shoppingList = JSON.parse(localStorage.getItem("shoppinglist")) || [];

    shoppingList.push({
        name: name,
        amount: amount,
        unit: unit,
        recipe: recipe
    });

    localStorage.setItem(
        "shoppinglist",
        JSON.stringify(shoppingList)
    );

    renderShoppingList();
    renderRecipeFilters();
}

//Removes the shoppingList entry from localStorage when clicking the 'clear' button.
function clearShoppingList() {
    const confirmed = confirm("Möchtest du die gesamte Einkaufsliste wirklich löschen?");

    if (!confirmed) {
        return;
    }

    localStorage.removeItem("shoppinglist");

    renderShoppingList();
    renderRecipeFilters();
}

