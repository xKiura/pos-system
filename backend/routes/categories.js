const express = require('express');
const router = express.Router();
const LocalStorage = require('../services/localStorage');
const storage = new LocalStorage('db.json');

// Get all categories
router.get('/', async (req, res) => {
    try {
        const products = await storage.get('products') || [];
        // Extract unique categories from products
        const categories = [...new Set(products.map(product => product.category))];
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

module.exports = router;
