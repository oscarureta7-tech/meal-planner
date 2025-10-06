// ...existing code...
import Repository from './classes/Repository.js';
import Ingredient from './classes/Ingredient.js';
import Recipe from './classes/Recipe.js';
import CalendarEntry from './classes/CalendarEntry.js';
import MealPlannerApp from './classes/MealPlannerApp.js';

// App Controller methods (if any custom logic is needed, extend MealPlannerApp here)

// Initialize app asynchronously
(async () => {
	window.mealPlannerApp = new MealPlannerApp();
	if (typeof window.mealPlannerApp.init === 'function') {
		await window.mealPlannerApp.init();
	}
})();