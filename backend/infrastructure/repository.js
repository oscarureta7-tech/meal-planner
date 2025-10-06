import fs from 'fs';

class Repository {
  constructor(filename) {
    this.filename = filename;
    this.data = this._load();
  }

  _load() {
    try {
      if (!fs.existsSync(this.filename)) {
        fs.writeFileSync(this.filename, '[]');
      }
      const raw = fs.readFileSync(this.filename);
      return JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }

  _save() {
    fs.writeFileSync(this.filename, JSON.stringify(this.data, null, 2));
  }

  getAll() {
    return this.data;
  }

  add(item) {
    this.data.push(item);
    this._save();
  }

  update(index, item) {
    this.data[index] = item;
    this._save();
  }

  delete(index) {
    this.data.splice(index, 1);
    this._save();
  }
}

export default Repository;
