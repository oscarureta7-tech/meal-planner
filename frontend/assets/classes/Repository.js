const API_BASE = 'http://localhost:3000';

class Repository {
    constructor(key) {
        this.key = key;
        this.endpoint = this._mapKey(key);
    }

    _mapKey(key) {
        const map = {
            ingredients: 'ingredients',
            recipes: 'recipes',
            calendar: 'calendar',
            tags: 'tags'
        };
        return map[key] || key;
    }

    async getAll() {
        const res = await fetch(`${API_BASE}/${this.endpoint}`);
        if (!res.ok) throw new Error(`Failed to fetch ${this.endpoint}`);
        const data = await res.json();
        // decorate with numeric id (index) to have a stable reference for update/delete
        return (data || []).map((item, idx) => ({ ...item, id: idx }));
    }

    async add(item) {
        const res = await fetch(`${API_BASE}/${this.endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        if (!res.ok) throw new Error(`Failed to add to ${this.endpoint}`);
        // backend returns the created item but without id; fetch all and infer index
        const created = await res.json();
        const all = await fetch(`${API_BASE}/${this.endpoint}`);
        const list = await all.json();
        const idx = (list || []).length - 1;
        return { ...(created || {}), id: idx };
    }

    async update(id, item) {
        const res = await fetch(`${API_BASE}/${this.endpoint}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
        });
        if (!res.ok) throw new Error(`Failed to update ${this.endpoint}/${id}`);
        return await res.json();
    }

    async delete(id) {
        const res = await fetch(`${API_BASE}/${this.endpoint}/${id}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error(`Failed to delete ${this.endpoint}/${id}`);
        return await res.json();
    }
}

export default Repository;
