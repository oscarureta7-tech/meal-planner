import Repository from './Repository.js';
import Ingredient from './Ingredient.js';
import Recipe from './Recipe.js';
import CalendarEntry from './CalendarEntry.js';
import LANGUAGES from './Languages.js';

class MealPlannerApp {
    static currentLang = 'en';
    static t(key) {
        return LANGUAGES[MealPlannerApp.currentLang][key] || key;
    }
    constructor() {
        this.ingredientRepo = new Repository('ingredients');
        this.recipeRepo = new Repository('recipes');
        this.tagRepo = new Repository('tags');
        this.calendarRepo = new Repository('calendar');
        // repositories initialized; UI rendering happens in async init()
        this.setupTabListeners();
        this.setupSettings();
    }

    async init() {
        await this.renderMealsCatalog();
        await this.renderIngredientsView();
        await this.renderTagsView();
        await this.renderCalendarView();
        this.updateStaticText();
    }

    setupSettings() {
        const btn = document.getElementById('settingsBtn');
        if (!btn) return;
        btn.onclick = () => {
            this.showSettingsModal();
        };
    }

    showSettingsModal() {
        let modal = document.getElementById('settingsModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'settingsModal';
            modal.className = 'modal fade';
            modal.tabIndex = -1;
            modal.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">${MealPlannerApp.t('settings')}</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <div class="modal-body">
                            <label for="langSelect">Language / Idioma:</label>
                            <select id="langSelect" class="form-select">
                                <option value="en">English</option>
                                <option value="es">Español</option>
                            </select>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" id="saveLangBtn">${MealPlannerApp.t('save')}</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        document.getElementById('langSelect').value = MealPlannerApp.currentLang;
        document.getElementById('saveLangBtn').onclick = () => {
            MealPlannerApp.currentLang = document.getElementById('langSelect').value;
            bsModal.hide();
            this.renderMealsCatalog();
            this.renderIngredientsView();
            this.renderTagsView();
            this.renderCalendarView();
            this.updateStaticText();
        };
    }

    updateStaticText() {
        document.querySelector('.navbar-brand').textContent = MealPlannerApp.t('mealPlanner');
        document.getElementById('meals-tab').textContent = MealPlannerApp.t('mealsCatalog');
        document.getElementById('ingredients-tab').textContent = MealPlannerApp.t('ingredients');
        document.getElementById('tags-tab').textContent = MealPlannerApp.t('tags');
        document.getElementById('calendar-tab').textContent = MealPlannerApp.t('calendar');
        document.getElementById('settingsBtn').textContent = MealPlannerApp.t('settings');
    }

    setupTabListeners() {
        document.getElementById('meals-tab').addEventListener('click', () => this.renderMealsCatalog());
        document.getElementById('ingredients-tab').addEventListener('click', () => this.renderIngredientsView());
        document.getElementById('diet-tags-tab').addEventListener('click', () => this.renderTagTypeView('diet'));
        document.getElementById('allergy-tags-tab').addEventListener('click', () => this.renderTagTypeView('allergy'));
        document.getElementById('macronutrient-tags-tab').addEventListener('click', () => this.renderTagTypeView('macronutrient'));
        document.getElementById('ingredient-tags-tab').addEventListener('click', () => this.renderTagTypeView('ingredient'));
        document.getElementById('calendar-tab').addEventListener('click', () => this.renderCalendarView());
    }

    async renderTagTypeView(type) {
        const container = document.getElementById(`${type}-tags-view`);
        const allTags = (await this.getAllTags()).filter(tag => tag.type === type && !tag.deleted);
        if (!container) return;
        container.innerHTML = `
            <div class="mb-3">
                <button class="btn btn-success" id="addTagBtn">${MealPlannerApp.t('addIngredient')}</button>
            </div>
            <div id="tagsList"></div>
        `;
        await this.renderTagsList(type);
        const addBtn = document.getElementById('addTagBtn');
        if (addBtn) addBtn.onclick = () => this.showAddTagModal(type);
    }

    async renderTagsList(type) {
        const allTags = await this.getAllTags();
        const tags = allTags.filter(tag => tag.type === type && !tag.deleted);
        const remote = await this.tagRepo.getAll();
        const remoteFiltered = (remote || []).filter(t => t.type === type && !t.deleted);
        const container = document.getElementById('tagsList');
        if (!container) return;
        if (tags.length === 0) {
            container.innerHTML = `<p>${MealPlannerApp.t('noIngredients')}</p>`;
            return;
        }
        container.innerHTML = tags.map((tag) => {
            // find remote tag by name/type
            const remoteTag = remoteFiltered.find(rt => rt.name === tag.name && rt.type === tag.type && !rt.deleted);
            const editBtns = remoteTag ? `
                <button class="btn btn-sm btn-primary me-1" onclick="window.mealPlannerApp.showEditTagModal('${type}', ${remoteTag.id})">${MealPlannerApp.t('save')}</button>
                <button class="btn btn-sm btn-danger" onclick="window.mealPlannerApp.softDeleteTag('${type}', ${remoteTag.id})">${MealPlannerApp.t('cancel')}</button>
            ` : '';
            return `
            <div class="card mb-2">
                <div class="card-body d-flex justify-content-between align-items-center">
                    <span>${tag.name}</span>
                    <div>
                        ${editBtns}
                    </div>
                </div>
            </div>
        `;
        }).join('');
    }

    async showAddTagModal(type) {
        const container = document.getElementById('tagsList');
        container.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">${MealPlannerApp.t('addIngredient')}</h5>
                    <div class="mb-2">
                        <input type="text" class="form-control" id="newTagName" placeholder="${MealPlannerApp.t('ingredientName')}">
                    </div>
                    <button class="btn btn-primary" id="saveTagBtn">${MealPlannerApp.t('save')}</button>
                    <button class="btn btn-secondary" id="cancelTagBtn">${MealPlannerApp.t('cancel')}</button>
                </div>
            </div>
        `;
        document.getElementById('saveTagBtn').onclick = async () => {
            const name = document.getElementById('newTagName').value.trim();
            if (!name) {
                alert(MealPlannerApp.t('ingredientName'));
                return;
            }
            // Persist tag to backend
            await this.tagRepo.add({ name, type, deleted: false });
            await this.renderTagTypeView(type);
        };
        document.getElementById('cancelTagBtn').onclick = () => this.renderTagTypeView(type);
    }

    async showEditTagModal(type, tagId) {
        // Fetch remote tag by id
        const all = await this.tagRepo.getAll();
        const tag = (all || []).find(t => t.id === tagId && !t.deleted);
        const container = document.getElementById('tagsList');
        container.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">${MealPlannerApp.t('addIngredient')}</h5>
                    <div class="mb-2">
                        <input type="text" class="form-control" id="editTagName" value="${tag ? tag.name : ''}">
                    </div>
                    <button class="btn btn-primary" id="updateTagBtn">${MealPlannerApp.t('save')}</button>
                    <button class="btn btn-secondary" id="cancelEditTagBtn">${MealPlannerApp.t('cancel')}</button>
                </div>
            </div>
        `;
        document.getElementById('updateTagBtn').onclick = async () => {
            const newName = document.getElementById('editTagName').value.trim();
            if (!newName) {
                alert(MealPlannerApp.t('ingredientName'));
                return;
            }
            if (!tag) {
                alert('Tag not found.');
                return;
            }
            const updated = { ...tag, name: newName };
            const idToUse = tag.id !== undefined ? tag.id : null;
            if (idToUse === null) {
                alert('Tag has no id and cannot be updated.');
                return;
            }
            await this.tagRepo.update(idToUse, updated);
            await this.renderTagTypeView(type);
        };
        document.getElementById('cancelEditTagBtn').onclick = () => this.renderTagTypeView(type);
    }

    async softDeleteTag(type, tagId) {
        const all = await this.tagRepo.getAll();
        const tag = (all || []).find(t => t.id === tagId);
        if (!tag) {
            alert('Could not find tag to delete.');
            return;
        }
        const updated = { ...tag, deleted: true };
        const idToUse = tag.id !== undefined ? tag.id : null;
        if (idToUse === null) {
            alert('Tag has no id and cannot be deleted.');
            return;
        }
        await this.tagRepo.update(idToUse, updated);
        await this.renderTagTypeView(type);
    }

    async renderTagsView() {
        const container = document.getElementById('tags-view');
        if (!container) return;
        const allTags = await this.getAllTags();
        // Group tags by type
        const tagTypes = [
            { type: 'diet', label: MealPlannerApp.t('diet') },
            { type: 'allergy', label: MealPlannerApp.t('allergy') },
            { type: 'macronutrient', label: MealPlannerApp.t('macronutrient') },
            { type: 'ingredient', label: MealPlannerApp.t('ingredients') },
            { type: 'custom', label: MealPlannerApp.t('custom') }
        ];
        container.innerHTML = `
            <div class="row">
                ${tagTypes.map(tt => {
                    const tags = allTags.filter(tag => tag.type === tt.type && !tag.deleted);
                    return `
                        <div class="col-md-6 mb-4">
                            <h5>${tt.label}</h5>
                            <div>
                                ${tags.length === 0 ? '<span class="text-muted">No tags.</span>' : tags.map(tag => `<span class="badge bg-${TAG_COLORS[tag.type] || 'secondary'} me-1">${tag.name}</span>`).join(' ')}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    async renderMealsCatalog() {
        const container = document.getElementById('meals-catalog-view');
        container.innerHTML = `
            <div class="mb-3">
                <input type="text" class="form-control" id="searchRecipe" placeholder="${MealPlannerApp.t('searchRecipes')}">
            </div>
            <div class="mb-3">
                <button class="btn btn-success" id="addRecipeBtn">${MealPlannerApp.t('addNewRecipe')}</button>
            </div>
            <div id="recipesList"></div>
        `;
        await this.renderRecipesList();
        document.getElementById('addRecipeBtn').onclick = () => this.showAddRecipeModal();
        const searchEl = document.getElementById('searchRecipe');
        if (searchEl) searchEl.oninput = (e) => this.renderRecipesList(e.target.value);
    }
    async renderRecipesList(filter = '') {
        const recipes = await this.recipeRepo.getAll();
        const container = document.getElementById('recipesList');
        if (!container) return;
        let filtered = recipes || [];
        if (filter) {
            const f = filter.toLowerCase();
            filtered = filtered.filter(r => r.name.toLowerCase().includes(f) || (r.tags || []).some(t => t.name.toLowerCase().includes(f)));
        }
        if (!filtered || filtered.length === 0) {
            container.innerHTML = `<p>${MealPlannerApp.t('noRecipes')}</p>`;
            return;
        }
        container.innerHTML = filtered.map((r, i) => `
            <div class="card mb-2">
                <div class="card-body">
                    <h5 class="card-title">${r.name}</h5>
                    <p class="card-text">${r.instructions || 'No instructions.'}</p>
                    <div>${(r.tags || []).map(tag => `<span class='badge bg-info me-1'>${tag.name} <span class='text-muted'>(${tag.type})</span></span>`).join('')}</div>
                </div>
            </div>
        `).join('');
    }

    async showAddRecipeModal() {
        const container = document.getElementById('recipesList');
        const allTags = await this.getAllTags();
        container.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">Add New Recipe</h5>
                    <div class="mb-2">
                        <input type="text" class="form-control" id="newRecipeName" placeholder="Recipe name">
                    </div>
                    <div class="mb-2">
                        <textarea class="form-control" id="newRecipeInstructions" placeholder="Instructions (optional)"></textarea>
                    </div>
                    <div class="mb-2">
                        <label>Tags (select or type):</label>
                        <input type="text" class="form-control mb-2" id="newRecipeTags" placeholder="Comma separated tags">
                        <div>${allTags.map(t => `<span class="badge bg-secondary me-1">${t.name} <span class='text-muted'>(${t.type})</span></span>`).join('')}</div>
                    </div>
                    <button class="btn btn-primary" id="saveRecipeBtn">Save</button>
                    <button class="btn btn-secondary" id="cancelRecipeBtn">Cancel</button>
                </div>
            </div>
        `;
        document.getElementById('saveRecipeBtn').onclick = async () => {
            const name = document.getElementById('newRecipeName').value.trim();
            const instructions = document.getElementById('newRecipeInstructions').value.trim();
            const tagsInput = document.getElementById('newRecipeTags').value.split(',').map(t => t.trim()).filter(t => t);
            // Map tags to objects, try to match type from allTags, else default to 'custom'
            const allTagsMap = new Map(allTags.map(t => [t.name.toLowerCase(), t.type]));
            const tags = tagsInput.map(tagName => ({ name: tagName, type: allTagsMap.get(tagName.toLowerCase()) || 'custom' }));
            if (!name || tags.length === 0) {
                alert('Recipe name and at least one tag are required.');
                return;
            }
            await this.recipeRepo.add(new Recipe(name, [], instructions, tags));
            await this.renderMealsCatalog();
        };
        document.getElementById('cancelRecipeBtn').onclick = () => this.renderMealsCatalog();
    }

    async getAllTags() {
        // Predefined tags for dietary, meal type, nutrition, plus ingredient names, plus remote/custom tags
        const dietTags = ['vegan', 'pescatarian', 'carnivore', 'vegetarian'].map(name => ({ name, type: 'diet' }));
        const mealTags = ['breakfast', 'brunch', 'lunch', 'dinner', 'snack', 'whole meal'].map(name => ({ name, type: 'meal' }));
        const nutritionTags = ['high protein', 'carbohydrates', 'fat'].map(name => ({ name, type: 'nutrition' }));
        const ingredientRepoList = await this.ingredientRepo.getAll();
        const ingredientTags = (ingredientRepoList || []).map(i => i.tag);
        const remote = await this.tagRepo.getAll();
        return [...dietTags, ...mealTags, ...nutritionTags, ...ingredientTags, ...(remote || [])];
    }

    async renderIngredientsView() {
        const container = document.getElementById('ingredients-view');
        if (!container) {
            console.error('Could not find #ingredients-view container. Check index.html for correct tab content.');
            return;
        }
        container.innerHTML = `
            <div class="mb-3">
                <button class="btn btn-success" id="addIngredientBtn">${MealPlannerApp.t('addIngredient')}</button>
            </div>
            <div id="ingredientsList"></div>
        `;
        await this.renderIngredientsList();
        document.getElementById('addIngredientBtn').onclick = () => this.showAddIngredientModal();
    }

    async renderIngredientsList() {
        const ingredients = await this.ingredientRepo.getAll();
        const container = document.getElementById('ingredientsList');
        if (!container) return;
        if (!ingredients || ingredients.length === 0) {
            container.innerHTML = `<p>${MealPlannerApp.t('noIngredients')}</p>`;
            return;
        }
        container.innerHTML = (ingredients || []).map((i, idx) => `
            <div class="card mb-2">
                <div class="card-body d-flex justify-content-between align-items-center">
                    <div>
                        <h5 class="card-title">${i.name}</h5>
                        <p>${MealPlannerApp.t('stock')}: ${i.stock} (${MealPlannerApp.t(i.location)})</p>
                    </div>
                    <button class="btn btn-sm btn-primary" onclick="window.mealPlannerApp.showManageIngredientModal(${typeof i.id !== 'undefined' ? i.id : idx})">Manage</button>
                </div>
            </div>
        `).join('');
    }

    async showManageIngredientModal(idOrIdx) {
        const ingredients = await this.ingredientRepo.getAll();
        // support both numeric id and legacy index
        let ingredient = (ingredients || []).find(it => it.id === idOrIdx);
        if (!ingredient) ingredient = ingredients[idOrIdx];
        const container = document.getElementById('ingredientsList');
        container.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">Manage Stock for ${ingredient.name}</h5>
                    <div class="mb-2">
                        <label>Current Stock: ${ingredient.stock}</label>
                    </div>
                    <div class="mb-2">
                        <input type="number" class="form-control" id="addStock" placeholder="Add/Remove amount (use negative to remove)">
                    </div>
                    <div class="mb-2">
                        <input type="number" class="form-control" id="setStock" placeholder="Set stock value">
                    </div>
                    <button class="btn btn-success" id="addRemoveStockBtn">Add/Remove</button>
                    <button class="btn btn-warning" id="setStockBtn">Set Value</button>
                    <button class="btn btn-secondary" id="cancelManageBtn">Cancel</button>
                </div>
            </div>
        `;
        document.getElementById('addRemoveStockBtn').onclick = async () => {
            const val = parseInt(document.getElementById('addStock').value, 10);
            if (isNaN(val)) {
                alert('Enter a valid number to add/remove.');
                return;
            }
            ingredient.stock += val;
            if (ingredient.stock < 0) ingredient.stock = 0;
            // prefer using stable id if returned by repo
            const idToUse = ingredient.id !== undefined ? ingredient.id : idOrIdx;
            await this.ingredientRepo.update(idToUse, ingredient);
            await this.renderIngredientsList();
        };
        document.getElementById('setStockBtn').onclick = async () => {
            const val = parseInt(document.getElementById('setStock').value, 10);
            if (isNaN(val) || val < 0) {
                alert('Enter a valid non-negative number.');
                return;
            }
            ingredient.stock = val;
            const idToUse = ingredient.id !== undefined ? ingredient.id : idOrIdx;
            await this.ingredientRepo.update(idToUse, ingredient);
            await this.renderIngredientsList();
        };
        document.getElementById('cancelManageBtn').onclick = () => this.renderIngredientsList();
    }

    async showAddIngredientModal() {
        const container = document.getElementById('ingredientsList');
        container.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">Add Ingredient</h5>
                    <div class="mb-2">
                        <input type="text" class="form-control" id="newIngredientName" placeholder="Ingredient name">
                    </div>
                    <div class="mb-2">
                        <input type="number" class="form-control" id="newIngredientStock" placeholder="Stock">
                    </div>
                    <div class="mb-2">
                        <select class="form-select" id="newIngredientLocation">
                            <option value="pantry">Pantry</option>
                            <option value="fridge">Fridge</option>
                        </select>
                    </div>
                    <button class="btn btn-primary" id="saveIngredientBtn">Save</button>
                    <button class="btn btn-secondary" id="cancelIngredientBtn">Cancel</button>
                </div>
            </div>
        `;
        document.getElementById('saveIngredientBtn').onclick = async () => {
            const name = document.getElementById('newIngredientName').value.trim();
            const stock = parseInt(document.getElementById('newIngredientStock').value, 10) || 0;
            const location = document.getElementById('newIngredientLocation').value;
            if (!name) {
                alert('Ingredient name is required.');
                return;
            }
            await this.ingredientRepo.add(new Ingredient(name, stock, location));
            await this.renderIngredientsView();
        };
        document.getElementById('cancelIngredientBtn').onclick = () => this.renderIngredientsView();
    }

    async renderCalendarView() {
        const container = document.getElementById('calendar-view');
        container.innerHTML = `
            <div class="mb-3">
                <button class="btn btn-success" id="addCalendarEntryBtn">Plan Meal</button>
            </div>
            <div id="calendarList"></div>
        `;
        await this.renderCalendarList();
        document.getElementById('addCalendarEntryBtn').onclick = () => this.showAddCalendarEntryModal();
    }

    async renderCalendarList() {
        const entries = await this.calendarRepo.getAll();
        const container = document.getElementById('calendarList');
        if (!container) return;
        if (!entries || entries.length === 0) {
            container.innerHTML = '<p>No planned meals.</p>';
            return;
        }
        container.innerHTML = (entries || []).map((e, idx) => `
            <div class="card mb-2">
                <div class="card-body">
                    <h5 class="card-title">${e.recipeName}</h5>
                    <p>Date: ${e.date}</p>
                </div>
            </div>
        `).join('');
    }

    async showAddCalendarEntryModal() {
        const container = document.getElementById('calendarList');
        const recipes = await this.recipeRepo.getAll();
        container.innerHTML = `
            <div class="card">
                <div class="card-body">
                    <h5 class="card-title">Plan Meal</h5>
                    <div class="mb-2">
                        <input type="date" class="form-control" id="calendarDate">
                    </div>
                    <div class="mb-2">
                        <select class="form-select" id="calendarRecipe">
                            ${recipes.map(r => `<option value="${r.name}">${r.name}</option>`).join('')}
                        </select>
                    </div>
                    <button class="btn btn-primary" id="saveCalendarBtn">Save</button>
                    <button class="btn btn-secondary" id="cancelCalendarBtn">Cancel</button>
                </div>
            </div>
        `;
        document.getElementById('saveCalendarBtn').onclick = async () => {
            const date = document.getElementById('calendarDate').value;
            const recipeName = document.getElementById('calendarRecipe').value;
            if (!date || !recipeName) {
                alert('Date and recipe are required.');
                return;
            }
            await this.calendarRepo.add(new CalendarEntry(date, recipeName));
            await this.renderCalendarView();
        };
        document.getElementById('cancelCalendarBtn').onclick = () => this.renderCalendarView();
    }
}

export default MealPlannerApp;
