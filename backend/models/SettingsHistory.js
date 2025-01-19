const mongoose = require('mongoose');

const settingsHistorySchema = new mongoose.Schema({
  timestamp: {
    type: Date,
    default: Date.now
  },
  employeeName: String,
  employeeNumber: String,
  changes: [{
    setting: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed
  }]
});

module.exports = mongoose.model('SettingsHistory', settingsHistorySchema);
