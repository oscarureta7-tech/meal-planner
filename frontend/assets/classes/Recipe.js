class Recipe {
    constructor(name, ingredients = [], instructions = '', tags = []) {
        this.name = name;
        this.ingredients = ingredients; // Array of Ingredient names or objects
        this.instructions = instructions;
        this.tags = tags; // Array of tag objects
    }
}

export default Recipe;
