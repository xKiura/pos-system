const express = require('express');
const cors = require('cors');
const LocalStorage = require('./services/localStorage');

const app = express();
const storage = new LocalStorage('db.json');

// Initialize storage
storage.init()
  .then(() => {
    console.log('Local storage initialized');
    
    // Initialize settings if they don't exist
    return storage.get('settings') || storage.set('settings', {
      taxRate: 15,
      printCopies: 1,
      requireManagerApproval: false,
      history: []
    });
  })
  .then(() => {
    console.log('Settings initialized');
  })
  .catch(err => {
    console.error('Error initializing storage:', err);
  });

// Store orders in memory
let confirmedOrders = [];

// Middleware
app.use(cors());
app.use(express.json());

// Settings routes
app.get('/settings', async (req, res) => {
  try {
    const settings = await storage.get('settings');
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/settings/history', async (req, res) => {
  try {
    const settings = await storage.get('settings');
    res.json(settings.history || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/settings', async (req, res) => {
  try {
    const settings = await storage.get('settings');
    const { taxRate, printCopies, requireManagerApproval, changedBy, employeeNumber, changes } = req.body;

    if (taxRate !== undefined) settings.taxRate = taxRate;
    if (printCopies !== undefined) settings.printCopies = printCopies;
    if (requireManagerApproval !== undefined) settings.requireManagerApproval = requireManagerApproval;

    if (changes && changes.length > 0) {
      if (!settings.history) settings.history = [];
      settings.history.push({
        timestamp: new Date(),
        employeeName: changedBy,
        employeeNumber,
        changes
      });
    }

    await storage.set('settings', settings);
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Existing order endpoints
app.post('/confirmed-orders', (req, res) => {
  const order = req.body;
  confirmedOrders.push(order);
  res.status(201).json(order);
});

app.get('/confirmed-orders', (req, res) => {
  res.json(confirmedOrders);
});

// Update the refund endpoint
app.post('/refund-order/:orderNumber', (req, res) => {
    try {
        const orderNumber = parseInt(req.params.orderNumber, 10);
        const orderData = req.body;

        // Find the order to refund using number comparison
        const orderIndex = confirmedOrders.findIndex(o => {
            const confirmedOrderNumber = parseInt(o.orderNumber, 10);
            return confirmedOrderNumber === orderNumber;
        });
        
        if (orderIndex === -1) {
            console.log('Order not found:', orderNumber);
            console.log('Available orders:', confirmedOrders.map(o => o.orderNumber));
            return res.status(404).json({ error: 'Order not found' });
        }

        // Update the order
        confirmedOrders[orderIndex] = {
            ...confirmedOrders[orderIndex],
            isRefunded: true,
            refundedAt: new Date().toISOString()
        };

        res.json(confirmedOrders[orderIndex]);
    } catch (error) {
        console.error('Error processing refund:', error);
        res.status(500).json({ error: 'Failed to process refund' });
    }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
