class CalendarEntry {
    constructor(date, mealType, recipeName) {
        this.date = date; // ISO string or Date object
        this.mealType = mealType; // e.g., 'breakfast', 'lunch', 'dinner'
        this.recipeName = recipeName;
    }
}

export default CalendarEntry;
