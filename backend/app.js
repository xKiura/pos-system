
const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, getSettingsHistory } = require('../controllers/settingsController');

// Get current settings
router.get('/', getSettings);

// Update settings
router.post('/', updateSettings);

// Get settings change history
router.get('/history', getSettingsHistory);

module.exports = router;