const express = require('express');
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // Get categories from products
    const products = await req.app.locals.storage.get('products') || [];
    const uniqueCategories = [...new Set(products.map(product => product.category))];
    res.json(uniqueCategories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;
