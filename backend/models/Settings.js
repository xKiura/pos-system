const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  taxRate: {
    type: Number,
    required: true,
    default: 15
  },
  printCopies: {
    type: Number,
    required: true,
    default: 1
  },
  requireManagerApproval: {
    type: Boolean,
    required: true,
    default: false
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Settings', settingsSchema);
