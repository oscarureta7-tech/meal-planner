class Ingredient {
    constructor(name, stock = 0, location = 'pantry') {
        this.name = name;
        this.stock = stock;
        this.location = location;
        this.tag = { name, type: 'ingredient' };
    }
}

export default Ingredient;
