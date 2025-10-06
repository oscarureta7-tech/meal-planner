import Ingredient from '../domain/Ingredient.js';
import Recipe from '../domain/Recipe.js';
import CalendarEntry from '../domain/CalendarEntry.js';
import Tag from '../domain/Tag.js';

// These will be imported from infrastructure in index.js
export let ingredientRepo;
export let recipeRepo;
export let calendarRepo;
export let tagRepo;

export function setRepositories(repos) {
  ingredientRepo = repos.ingredientRepo;
  recipeRepo = repos.recipeRepo;
  calendarRepo = repos.calendarRepo;
  tagRepo = repos.tagRepo;
}

export function addIngredient(data) {
  const ingredient = new Ingredient(data.name, data.stock, data.location);
  ingredientRepo.add(ingredient);
  return ingredient;
}

export function addRecipe(data) {
  const recipe = new Recipe(data.name, data.ingredients, data.instructions, data.tags);
  recipeRepo.add(recipe);
  return recipe;
}

export function addCalendarEntry(data) {
  const entry = new CalendarEntry(data.date, data.mealType, data.recipeName);
  calendarRepo.add(entry);
  return entry;
}

export function addTag(data) {
  const tag = new Tag(data.name, data.type);
  tagRepo.add(tag);
  return tag;
}
