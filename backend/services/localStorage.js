const fs = require('fs').promises;
const path = require('path');

class LocalStorage {
  constructor(filename) {
    this.filepath = path.join(__dirname, '..', 'data', filename);
    this.data = null;
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    try {
      await fs.mkdir(path.dirname(this.filepath), { recursive: true });
      
      try {
        const fileContent = await fs.readFile(this.filepath, 'utf8');
        this.data = JSON.parse(fileContent);
        
        // Ensure required structures exist
        if (!this.data.products) this.data.products = [];
        if (!this.data.settings) {
          this.data.settings = {
            taxRate: 15,
            printCopies: 1,
            requireManagerApproval: false,
            history: []
          };
        }
        if (!this.data.users) this.data.users = [];
        
        await this.save(); // Save initialized data
      } catch (error) {
        console.error('Error reading file, creating new one:', error);
        this.data = {
          products: [],
          settings: {
            taxRate: 15,
            printCopies: 1,
            requireManagerApproval: false,
            history: []
          },
          users: []
        };
        await this.save();
      }
      
      this.initialized = true;
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
    if (!this.initialized) await this.init();
    return this.data[key];
  }

  async set(key, value) {
    if (!this.initialized) await this.init();
    this.data[key] = value;
    await this.save();
    return value;
  }
}

module.exports = LocalStorage;
