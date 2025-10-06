import express from 'express';
import cors from 'cors';
import Repository from './infrastructure/repository.js';
import {
  setRepositories,
  addIngredient,
  addRecipe,
  addCalendarEntry,
  addTag
} from './application/application.js';


const app = express();
app.use(cors());
app.use(express.json());

// Setup repositories and inject into application layer
const ingredientRepo = new Repository('ingredients.json');
const recipeRepo = new Repository('recipes.json');
const calendarRepo = new Repository('calendar.json');
const tagRepo = new Repository('tags.json');
setRepositories({ ingredientRepo, recipeRepo, calendarRepo, tagRepo });

// Ingredients API
app.get('/ingredients', (req, res) => {
  res.json(ingredientRepo.getAll());
});
app.post('/ingredients', (req, res) => {
  const ingredient = addIngredient(req.body);
  res.status(201).json(ingredient);
});
app.put('/ingredients/:id', (req, res) => {
  ingredientRepo.update(parseInt(req.params.id, 10), req.body);
  res.json({ success: true });
});
app.delete('/ingredients/:id', (req, res) => {
  ingredientRepo.delete(parseInt(req.params.id, 10));
  res.json({ success: true });
});

// Recipes API
app.get('/recipes', (req, res) => {
  res.json(recipeRepo.getAll());
});
app.post('/recipes', (req, res) => {
  const recipe = addRecipe(req.body);
  res.status(201).json(recipe);
});
app.put('/recipes/:id', (req, res) => {
  recipeRepo.update(parseInt(req.params.id, 10), req.body);
  res.json({ success: true });
});
app.delete('/recipes/:id', (req, res) => {
  recipeRepo.delete(parseInt(req.params.id, 10));
  res.json({ success: true });
});

// Calendar API
app.get('/calendar', (req, res) => {
  res.json(calendarRepo.getAll());
});
app.post('/calendar', (req, res) => {
  const entry = addCalendarEntry(req.body);
  res.status(201).json(entry);
});
app.put('/calendar/:id', (req, res) => {
  calendarRepo.update(parseInt(req.params.id, 10), req.body);
  res.json({ success: true });
});
app.delete('/calendar/:id', (req, res) => {
  calendarRepo.delete(parseInt(req.params.id, 10));
  res.json({ success: true });
});

// Tags API
app.get('/tags', (req, res) => {
  res.json(tagRepo.getAll());
});
app.post('/tags', (req, res) => {
  const tag = addTag(req.body);
  res.status(201).json(tag);
});
app.put('/tags/:id', (req, res) => {
  tagRepo.update(parseInt(req.params.id, 10), req.body);
  res.json({ success: true });
});
app.delete('/tags/:id', (req, res) => {
  tagRepo.delete(parseInt(req.params.id, 10));
  res.json({ success: true });
});

app.listen(3000, () => {
  console.log('Meal Planner backend running on http://localhost:3000');
});
