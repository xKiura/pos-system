const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const SettingsHistory = require('../models/SettingsHistory');

// Get current settings
router.get('/', async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update settings
router.post('/', async (req, res) => {
  try {
    const { taxRate, printCopies, requireManagerApproval, changedBy, employeeNumber, changes } = req.body;
    
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }

    settings.taxRate = taxRate;
    settings.printCopies = printCopies;
    settings.requireManagerApproval = requireManagerApproval;
    settings.lastUpdated = new Date();
    
    await settings.save();

    // Record history
    await SettingsHistory.create({
      employeeName: changedBy,
      employeeNumber,
      changes: changes
    });

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get settings history
router.get('/history', async (req, res) => {
  try {
    const history = await SettingsHistory.find().sort({ timestamp: -1 }).limit(50);
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
