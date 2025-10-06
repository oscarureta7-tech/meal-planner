class Recipe {
  constructor(name, ingredients = [], instructions = '', tags = []) {
    this.name = name;
    this.ingredients = ingredients;
    this.instructions = instructions;
    this.tags = tags;
  }
}

export default Recipe;
