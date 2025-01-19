const fs = require('fs').promises;
const path = require('path');

class LocalStorage {
  constructor(filename) {
    this.filepath = path.join(__dirname, '..', 'data', filename);
    this.data = null;
  }

  async init() {
    try {
      await fs.mkdir(path.join(__dirname, '..', 'data'), { recursive: true });
      try {
        const fileContent = await fs.readFile(this.filepath, 'utf8');
        this.data = JSON.parse(fileContent);
      } catch (error) {
        this.data = {};
        await this.save();
      }
    } catch (error) {
      console.error('Error initializing localStorage:', error);
      throw error;
    }
  }

  async save() {
    try {
      await fs.writeFile(this.filepath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Error saving data:', error);
      throw error;
    }
  }

  async get(key) {
    return this.data[key];
  }

  async set(key, value) {
    this.data[key] = value;
    await this.save();
    return value;
  }
}

module.exports = LocalStorage;
