const fs = require('fs').promises;
const path = require('path');

class LocalStorage {
  constructor(dbPath) {
    this.dbPath = dbPath;
    this.data = {};
  }

  async init() {
    try {
      // Ensure the directory exists
      const dir = path.dirname(this.dbPath);
      await fs.mkdir(dir, { recursive: true });

      try {
        const data = await fs.readFile(this.dbPath, 'utf8');
        this.data = JSON.parse(data);
      } catch (error) {
        if (error.code === 'ENOENT') {
          // If file doesn't exist, create it with initial data
          this.data = {
            products: [],
            settings: {},
            users: [],
            'confirmed-orders': []
          };
          await this.save();
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error('Error initializing localStorage:', error);
      throw error;
    }
  }

  async save() {
    await fs.writeFile(this.dbPath, JSON.stringify(this.data, null, 2));
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
