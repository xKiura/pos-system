const express = require('express');
const cors = require('cors');
const LocalStorage = require('./services/localStorage');

const app = express();
const storage = new LocalStorage('db.json');

// Initialize empty arrays for history
let settingsHistory = [];
let productsHistory = [];
let billsHistory = [];

// Clear history data on server start
const clearHistoryData = () => {
  settingsHistory = [];
  productsHistory = [];
  billsHistory = [];
};

// Initialize storage and clear history
storage.init()
  .then(async () => {
    console.log('Local storage initialized');
    clearHistoryData(); // Clear history on server start
    
    // Initialize settings if they don't exist
    await storage.get('settings') || await storage.set('settings', {
      taxRate: 15,
      printCopies: 1,
      requireManagerApproval: false,
      history: []
    });

    // Initialize users if they don't exist
    await storage.get('users') || await storage.set('users', []);

    console.log('Settings and users initialized');
  })
  .catch(err => {
    console.error('Error initializing storage:', err);
  });

// Store orders in memory
let confirmedOrders = [];

// Middleware
app.use(cors({
    origin: 'http://localhost:3000', // Your React app's URL
    credentials: true
}));
app.use(express.json());

// Add categories route
const categoriesRouter = require('./routes/categories');
app.use('/categories', categoriesRouter);

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

// Modified settings history endpoints
app.post('/settings-history', (req, res) => {
  console.log('Received history entry:', req.body);
  
  if (!req.body.employeeName || !req.body.employeeNumber) {
    console.error('Missing employee information in request');
    return res.status(400).json({ error: 'Employee information is required' });
  }

  // Keep the original type from the request instead of modifying it
  const historyEntry = {
    id: Date.now(),
    timestamp: new Date().toISOString(),
    employeeName: req.body.employeeName,
    employeeNumber: req.body.employeeNumber,
    type: req.body.type || 'UNKNOWN',
    origin: req.body.origin || 'غير محدد',
    changes: req.body.changes || []
  };

  // Log the entry for debugging
  console.log('Processing history entry:', {
    type: historyEntry.type,
    origin: historyEntry.origin,
    changes: historyEntry.changes
  });

  settingsHistory.unshift(historyEntry);
  settingsHistory = settingsHistory.slice(0, 100);
  
  res.json(historyEntry);
});

// Modified get settings history endpoint
app.get('/settings-history', (req, res) => {
  console.log('Sending settings history:', settingsHistory);
  res.json(settingsHistory);
});

// Products history endpoints
app.get('/products-history', (req, res) => {
  res.json(productsHistory);
});

app.post('/products-history', (req, res) => {
  const historyEntry = {
    id: Date.now(),
    ...req.body,
    timestamp: new Date().toISOString()
  };
  productsHistory.unshift(historyEntry);
  // Keep only last 100 entries
  productsHistory = productsHistory.slice(0, 100);
  res.json(historyEntry);
});

// Bills history endpoints
app.get('/bills-history', (req, res) => {
  res.json(billsHistory);
});

app.post('/bills-history', (req, res) => {
  const historyEntry = {
    id: Date.now(),
    ...req.body,
    timestamp: new Date().toISOString()
  };
  billsHistory.unshift(historyEntry);
  // Keep only last 100 entries
  billsHistory = billsHistory.slice(0, 100);
  res.json(historyEntry);
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

// Add these routes for authentication
app.post('/register', async (req, res) => {
    try {
        const { name, employeeNumber, pin, email, phoneNumber } = req.body;

        // Name validation with normalization
        const normalizedName = name.trim();
        if (!normalizedName || !/^[\u0600-\u06FFa-zA-Z\s]+$/.test(normalizedName)) {
            return res.status(400).json({
                success: false,
                message: 'اسم الموظف يجب أن يحتوي على حروف فقط'
            });
        }

        // Get existing users
        let users = await storage.get('users') || [];

        // Check if the employee number already exists
        if (users.some(user => user.employeeNumber === employeeNumber)) {
            return res.status(400).json({
                success: false,
                message: 'رقم الموظف مستخدم مسبقاً'
            });
        }

        // Create new user
        const newUser = {
            name: normalizedName, // Store normalized name
            employeeNumber,
            pin,
            email,
            phoneNumber,
            createdAt: new Date().toISOString()
        };

        // Add to users array
        users.push(newUser);
        await storage.set('users', users);

        res.json({
            success: true,
            message: 'تم تسجيل الموظف بنجاح'
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ أثناء تسجيل الموظف'
        });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { employeeNumber, employeeName, pin } = req.body;

        // Input validation
        if (!employeeName || !employeeNumber || !pin) {
            return res.status(400).json({
                success: false,
                message: 'جميع الحقول مطلوبة'
            });
        }

        // Get existing users
        const users = await storage.get('users') || [];
        
        // Normalize input name and convert to string for comparison
        const normalizedInputName = employeeName.trim();
        const normalizedInputNumber = employeeNumber.toString();

        // Debug login attempt
        console.log('Login attempt:', {
            attemptedName: normalizedInputName,
            attemptedNumber: normalizedInputNumber,
            hasPin: !!pin
        });

        // Find user with strict matching
        const user = users.find(user => {
            // Convert all values to strings and normalize for comparison
            const storedName = user.name.trim();
            const storedNumber = user.employeeNumber.toString();
            const storedPin = user.pin.toString();

            const nameMatches = storedName === normalizedInputName;
            const numberMatches = storedNumber === normalizedInputNumber;
            const pinMatches = storedPin === pin;

            // Log each comparison for debugging
            console.log('Credential comparison:', {
                storedName,
                nameMatches,
                numberMatches,
                pinMatches
            });

            // All three must match exactly
            return nameMatches && numberMatches && pinMatches;
        });

        if (!user) {
            // Log failed attempt details
            console.log('Login failed - Invalid credentials');
            return res.status(401).json({
                success: false,
                message: 'بيانات تسجيل الدخول غير صحيحة'
            });
        }

        // Successful login
        console.log('Login successful for:', user.name);
        res.json({
            success: true,
            employeeName: user.name, // Send back the exact stored name
            employeeNumber: user.employeeNumber
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'حدث خطأ في النظام'
        });
    }
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
