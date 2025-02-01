const fs = require('fs');
const fsPromises = require('fs').promises; // Add this line
const path = require('path');
const express = require('express');
const cors = require('cors');
const LocalStorage = require('./services/localStorage');
const bodyParser = require('body-parser');

const app = express();
const dbPath = path.join(__dirname, 'db.json'); // Use __dirname to ensure correct path
const storage = new LocalStorage(dbPath);
const PORT = 5000; // Change port to 5000

// Add these near the top with other constants
const historyDir = path.join(__dirname, 'history');
const historyFiles = {
  products: path.join(historyDir, 'products-history.json'),
  settings: path.join(historyDir, 'settings-history.json'),
  bills: path.join(historyDir, 'bills-history.json')
};

// Initialize server function
const initializeServer = async () => {
  try {
    // Initialize storage first
    await storage.init();

    // Check if we need to populate initial data
    const data = await storage.get('products');
    if (!data) {
      // Set initial data
      const initialData = {
        products: [
          {
            id: "123",
            name: "مندي لحم",
            price: "45",
            image: "https://example.com/image.jpg",
            category: "رز",
            stock: 10,
            minStock: 5,
            costPrice: 35
          }
        ],
        settings: {
          taxRate: 15,
          printCopies: 1,
          requireManagerApproval: false,
          restaurantName: 'مطعمي',
          restaurantLogo: '',
          history: []
        },
        users: [],
        "confirmed-orders": []
      };

      // Save initial data to storage
      await Promise.all([
        storage.set('products', initialData.products),
        storage.set('settings', initialData.settings),
        storage.set('users', initialData.users),
        storage.set('confirmed-orders', initialData['confirmed-orders'])
      ]);
    }

    console.log('Server initialized successfully');
  } catch (error) {
    console.error('Error initializing server:', error);
    process.exit(1);
  }
};

// Add this after the existing initialization code
if (!fs.existsSync(historyDir)) {
  fs.mkdirSync(historyDir);
}

// Initialize history files if they don't exist
Object.values(historyFiles).forEach(file => {
  if (!fs.existsSync(file)) {
    fs.writeFileSync(file, JSON.stringify([], null, 2));
  }
});

// Add these helper functions
const readHistory = async (type) => {
  try {
    const data = await fsPromises.readFile(historyFiles[type], 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading ${type} history:`, error);
    return [];
  }
};

const writeHistory = async (type, data) => {
  try {
    await fsPromises.writeFile(historyFiles[type], JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error(`Error writing ${type} history:`, error);
    return false;
  }
};

// CORS middleware update
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(bodyParser.json());

// Update the storage methods to work directly with db.json
const readFromDb = async () => {
  try {
    const data = await fsPromises.readFile(dbPath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading from db:', error);
    return null;
  }
};

const writeToDb = async (data) => {
  try {
    await fsPromises.writeFile(dbPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing to db:', error);
    return false;
  }
};

// Update products endpoint
app.get('/products', async (req, res) => {
  try {
    const data = await readFromDb();
    res.json(data.products || []);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.patch('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await readFromDb();
    const products = data.products || [];
    const productIndex = products.findIndex(p => p.id === id);
    
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const oldProduct = products[productIndex];
    const updatedProduct = {
      ...oldProduct,
      ...req.body,
    };

    const changesDetected = 
      oldProduct.stock !== updatedProduct.stock ||
      oldProduct.minStock !== updatedProduct.minStock ||
      oldProduct.costPrice !== updatedProduct.costPrice;

    if (changesDetected) {
      // Create a single history entry with all changes
      const historyEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        employeeName: req.body.employeeName || 'Unknown',
        employeeNumber: req.body.employeeNumber || 'Unknown',
        type: 'INVENTORY_UPDATE',
        origin: 'صفحة المخزون',
        changes: [{
          productName: oldProduct.name,
          detailedChanges: []
        }]
      };

      // Compare and record changes
      if (oldProduct.stock !== updatedProduct.stock) {
        historyEntry.changes[0].detailedChanges.push({
          field: 'المخزون',
          oldValue: oldProduct.stock,
          newValue: updatedProduct.stock
        });
      }
      if (oldProduct.minStock !== updatedProduct.minStock) {
        historyEntry.changes[0].detailedChanges.push({
          field: 'الحد الأدنى',
          oldValue: oldProduct.minStock,
          newValue: updatedProduct.minStock
        });
      }
      if (oldProduct.costPrice !== updatedProduct.costPrice) {
        historyEntry.changes[0].detailedChanges.push({
          field: 'سعر التكلفة',
          oldValue: oldProduct.costPrice,
          newValue: updatedProduct.costPrice
        });
      }

      // Only save history if there are actual changes
      if (historyEntry.changes[0].detailedChanges.length > 0) {
        if (!data.productsHistory) {
          data.productsHistory = [];
        }
        data.productsHistory.unshift(historyEntry);
        data.productsHistory = data.productsHistory.slice(0, 100);
      }

      products[productIndex] = updatedProduct;
      data.products = products;
      
      await writeToDb(data);
      res.json(updatedProduct);
    } else {
      res.status(400).json({ error: 'No changes detected' });
    }
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.post('/products', async (req, res) => {
  try {
    const newProduct = {
      id: Date.now().toString(),
      name: req.body.name,
      price: req.body.price,
      image: req.body.image,
      category: req.body.category,
      stock: req.body.stock || 0,
      minStock: req.body.minStock || 0,
      costPrice: req.body.costPrice || 0,
      adjustmentDate: new Date().toISOString()
    };

    // Validate required fields
    if (!newProduct.name || !newProduct.price || !newProduct.category) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        requiredFields: ['name', 'price', 'category']
      });
    }

    const data = await readFromDb();
    data.products = data.products || [];
    data.products.push(newProduct);
    
    await writeToDb(data);
    
    console.log('Product added successfully:', newProduct);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Failed to add product' });
  }
});

app.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await readFromDb();
    const productIndex = data.products.findIndex(p => p.id === id);

    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updatedProduct = {
      ...data.products[productIndex],
      ...req.body,
      adjustmentDate: new Date().toISOString()
    };

    data.products[productIndex] = updatedProduct;
    await writeToDb(data);

    res.json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await readFromDb();
    
    const productIndex = data.products.findIndex(p => p.id === id);
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    data.products = data.products.filter(p => p.id !== id);
    await writeToDb(data);

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Update categories endpoint
app.get('/categories', async (req, res) => {
  try {
    const data = await readFromDb();
    const products = data.products || [];
    
    // Get unique categories and sort them
    const categories = [...new Set(products.map(p => p.category || 'غير مصنف'))].sort();
    
    // Add metrics for each category
    const categoryMetrics = categories.map(category => {
      const categoryProducts = products.filter(p => (p.category || 'غير مصنف') === category);
      return {
        name: category,
        productCount: categoryProducts.length,
        averagePrice: categoryProducts.reduce((acc, p) => acc + Number(p.price), 0) / categoryProducts.length,
        totalStock: categoryProducts.reduce((acc, p) => acc + (p.stock || 0), 0),
      };
    });

    res.json({
      categories,
      metrics: categoryMetrics
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

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
    const { 
      taxRate, 
      printCopies, 
      requireManagerApproval, 
      restaurantName,
      restaurantLogo,
      changedBy, 
      employeeNumber, 
      changes 
    } = req.body;

    if (taxRate !== undefined) settings.taxRate = taxRate;
    if (printCopies !== undefined) settings.printCopies = printCopies;
    if (requireManagerApproval !== undefined) settings.requireManagerApproval = requireManagerApproval;
    if (restaurantName !== undefined) settings.restaurantName = restaurantName;
    if (restaurantLogo !== undefined) settings.restaurantLogo = restaurantLogo;

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
app.post('/settings-history', async (req, res) => {
  try {
    const data = await readFromDb();
    if (!data.settingsHistory) {
      data.settingsHistory = [];
    }

    const historyEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      employeeName: req.body.employeeName,
      employeeNumber: req.body.employeeNumber,
      type: req.body.type || 'SETTINGS',
      origin: req.body.origin || 'غير محدد',
      changes: req.body.changes || []
    };

    data.settingsHistory.unshift(historyEntry);
    data.settingsHistory = data.settingsHistory.slice(0, 100); // Keep last 100 entries
    
    await writeToDb(data);
    res.json(historyEntry);
  } catch (error) {
    console.error('Error saving settings history:', error);
    res.status(500).json({ error: 'Failed to save history' });
  }
});

app.get('/settings-history', async (req, res) => {
  try {
    const data = await readFromDb();
    res.json(data.settingsHistory || []);
  } catch (error) {
    console.error('Error fetching settings history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Products history endpoints
app.get('/products-history', async (req, res) => {
  try {
    const history = await readHistory('products');
    res.json(history);
  } catch (error) {
    console.error('Error fetching products history:', error);
    res.status(500).json({ error: 'Failed to fetch products history' });
  }
});

app.post('/products-history', async (req, res) => {
  try {
    const history = await readHistory('products');
    const historyEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      employeeName: req.body.employeeName,
      employeeNumber: req.body.employeeNumber,
      type: req.body.type || 'INVENTORY_UPDATE',
      origin: req.body.origin || 'صفحة المخزون',
      changes: req.body.changes || []
    };

    history.unshift(historyEntry);
    history.splice(100); // Keep only last 100 entries
    
    await writeHistory('products', history);
    res.json(historyEntry);
  } catch (error) {
    console.error('Error saving product history:', error);
    res.status(500).json({ error: 'Failed to save history' });
  }
});

app.post('/products-history', async (req, res) => {
  try {
    const data = await readFromDb();
    if (!data.productsHistory) {
      data.productsHistory = [];
    }

    const historyEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      employeeName: req.body.employeeName,
      employeeNumber: req.body.employeeNumber,
      type: req.body.type || 'INVENTORY_UPDATE',
      origin: req.body.origin || 'صفحة المخزون',
      changes: req.body.changes || []
    };

    data.productsHistory.unshift(historyEntry);
    data.productsHistory = data.productsHistory.slice(0, 100);
    
    await writeToDb(data);
    res.json(historyEntry);
  } catch (error) {
    console.error('Error saving product history:', error);
    res.status(500).json({ error: 'Failed to save history' });
  }
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
app.post('/confirmed-orders', async (req, res) => {
  try {
    const order = req.body;
    const data = await readFromDb();
    const products = data.products || [];
    
    // Validate stock
    const insufficientStock = [];
    for (const orderItem of order.items) {
      const product = products.find(p => p.id === orderItem.id);
      if (!product || product.stock < orderItem.quantity) {
        insufficientStock.push({
          name: product?.name || 'Unknown product',
          requested: orderItem.quantity,
          available: product?.stock || 0
        });
      }
    }

    if (insufficientStock.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient stock',
        details: insufficientStock
      });
    }

    // Update stock levels
    const updatedProducts = products.map(product => {
      const orderItem = order.items.find(item => item.id === product.id);
      if (orderItem) {
        return {
          ...product,
          stock: product.stock - orderItem.quantity
        };
      }
      return product;
    });

    // Save updated products and new order
    data.products = updatedProducts;
    if (!data['confirmed-orders']) {
      data['confirmed-orders'] = [];
    }
    
    const newOrder = {
      ...order,
      id: Date.now().toString(),
      confirmedAt: new Date().toISOString()
    };
    
    data['confirmed-orders'].unshift(newOrder);
    
    await writeToDb(data);

    res.json({
      success: true,
      order: newOrder,
      updatedProducts
    });

  } catch (error) {
    console.error('Error confirming order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm order',
      details: error.message
    });
  }
});

// Update the confirmed-orders GET endpoint
app.get('/confirmed-orders', async (req, res) => {
  try {
    const data = await readFromDb();
    
    // Ensure data exists
    if (!data) {
      console.error('No database found');
      return res.status(500).json({ 
        error: 'Database not found',
        details: 'Could not read from database'
      });
    }

    // Ensure orders array exists
    const orders = data['confirmed-orders'] || [];
    
    // Log the response being sent
    console.log('Sending orders:', {
      count: orders.length,
      firstOrder: orders[0] ? orders[0].id : 'no orders'
    });

    res.json(orders);
  } catch (error) {
    console.error('Error fetching confirmed orders:', error);
    res.status(500).json({ 
      error: 'Failed to fetch confirmed orders',
      details: error.message
    });
  }
});

// Update the refund endpoint
app.post('/refund-order/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const data = await readFromDb();
    
    // Find the order to refund
    const orderIndex = data['confirmed-orders'].findIndex(o => o.orderNumber === orderNumber);
    
    if (orderIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found'
      });
    }

    // Update the order to mark it as refunded
    const order = data['confirmed-orders'][orderIndex];
    const refundedOrder = {
      ...order,
      isRefunded: true,
      refundedAt: new Date().toISOString(),
      refundedBy: {
        name: req.body.employeeName,
        number: req.body.employeeNumber
      }
    };

    // Update the database
    data['confirmed-orders'][orderIndex] = refundedOrder;
    await writeToDb(data);

    // Send success response
    res.json({
      success: true,
      order: refundedOrder
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process refund',
      details: error.message
    });
  }
});

// Add these routes for authentication
app.post('/register', async (req, res) => {
    try {
        const { name, employeeNumber, pin } = req.body;
        await storage.init();
        
        // Get existing users
        let users = await storage.get('users') || [];
        
        // Check if user already exists
        if (users.some(u => u.employeeNumber === employeeNumber)) {
            return res.status(400).json({
                success: false,
                message: 'رقم الموظف مستخدم مسبقاً'
            });
        }
        
        // Add new user
        const newUser = {
            name: name.trim(),
            employeeNumber: employeeNumber.toString(),
            pin: pin.toString()
        };
        
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

// Add these new endpoints
app.post('/validate-pin', async (req, res) => {
  try {
    const { employeeNumber, pin } = req.body;
    const users = await storage.get('users') || [];
    const user = users.find(u => u.employeeNumber === employeeNumber);

    if (!user || user.pin !== pin) {
      return res.json({ success: false });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error validating PIN:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.post('/update-pin', async (req, res) => {
  try {
    const { employeeNumber, employeeName, newPin } = req.body;
    const users = await storage.get('users') || [];
    const userIndex = users.findIndex(u => u.employeeNumber === employeeNumber);

    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    users[userIndex].pin = newPin;
    await storage.set('users', users);

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating PIN:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Initialize empty arrays for history
let settingsHistory = [];
let productsHistory = [];
let billsHistory = [];

// Clear history data on server start
/*const clearHistoryData = () => {
  settingsHistory = [];
  productsHistory = [];
  billsHistory = [];
};*/

// Initialize storage and clear history
storage.init()
  .then(async () => {
    console.log('Local storage initialized');
    
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
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Add categories route
const categoriesRouter = require('./routes/categories');
app.use('/categories', categoriesRouter);

// Initialize data files if they don't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir);
}

const dataFiles = {
    orders: path.join(dataDir, 'orders.json'),
    settings: path.join(dataDir, 'settings.json'),
    history: path.join(dataDir, 'history.json'),
    confirmedOrders: path.join(dataDir, 'confirmed-orders.json'),
    settingsHistory: path.join(dataDir, 'settings-history.json'),
    productsHistory: path.join(dataDir, 'products-history.json'),
    billsHistory: path.join(dataDir, 'bills-history.json')
};

// Initialize each data file if it doesn't exist
Object.entries(dataFiles).forEach(([key, file]) => {
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, JSON.stringify([]));
    }
});

// Helper function to read data
const readData = (file) => {
    try {
        return JSON.parse(fs.readFileSync(file));
    } catch (error) {
        console.error(`Error reading ${file}:`, error);
        return [];
    }
};

// Helper function to write data
const writeData = (file, data) => {
    try {
        fs.writeFileSync(file, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing to ${file}:`, error);
        return false;
    }
};

// Orders endpoints
app.get('/confirmed-orders', (req, res) => {
    const orders = readData(dataFiles.confirmedOrders);
    res.json(orders);
});

app.post('/confirmed-orders', async (req, res) => {
  try {
    const order = req.body;
    await storage.init();
    
    const products = await storage.get('products') || [];
    const insufficientStock = [];

    // Final stock validation
    for (const orderItem of order.items) {
      const product = products.find(p => p.id === orderItem.id);
      if (!product || product.stock < orderItem.quantity) {
        insufficientStock.push({
          name: product?.name || 'Unknown product',
          requested: orderItem.quantity,
          available: product?.stock || 0
        });
      }
    }

    if (insufficientStock.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient stock',
        details: insufficientStock
      });
    }

    // Atomic stock update
    const updatedProducts = products.map(product => {
      const orderItem = order.items.find(item => item.id === product.id);
      if (orderItem) {
        return {
          ...product,
          stock: Math.max(0, product.stock - orderItem.quantity),
          lastUpdated: new Date().toISOString()
        };
      }
      return product;
    });

    // Save updated products first
    await storage.set('products', updatedProducts);

    // Then save the order
    const confirmedOrder = {
      ...order,
      status: 'completed',
      confirmedAt: new Date().toISOString(),
      orderNumber: order.orderNumber,
      total: order.total
    };

    // Update orders collection
    const orders = await storage.get('orders') || [];
    orders.unshift(confirmedOrder);
    await storage.set('orders', orders);

    res.status(200).json({
      success: true,
      order: confirmedOrder,
      updatedProducts
    });

  } catch (error) {
    console.error('Error processing order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process order',
      details: error.message
    });
  }
});

// Settings history endpoints
app.post('/settings-history', (req, res) => {
    const history = readData(dataFiles.settingsHistory);
    const entry = { ...req.body, id: Date.now() };
    history.push(entry);
    
    if (writeData(dataFiles.settingsHistory, history)) {
        res.json({ success: true, entry });
    } else {
        res.status(500).json({ success: false, message: 'Failed to save history' });
    }
});

app.get('/settings-history', (req, res) => {
    const history = readData(dataFiles.settingsHistory);
    res.json(history);
});

// Products history endpoints
app.post('/products-history', async (req, res) => {
  try {
    const data = await readFromDb();
    if (!data.productsHistory) {
      data.productsHistory = [];
    }

    const historyEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      employeeName: req.body.employeeName,
      employeeNumber: req.body.employeeNumber,
      type: req.body.type || 'INVENTORY_UPDATE',
      origin: req.body.origin || 'صفحة المخزون',
      changes: req.body.changes || []
    };

    data.productsHistory.unshift(historyEntry);
    data.productsHistory = data.productsHistory.slice(0, 100);
    
    await writeToDb(data);
    res.json(historyEntry);
  } catch (error) {
    console.error('Error saving product history:', error);
    res.status(500).json({ error: 'Failed to save history' });
  }
});

app.get('/products-history', async (req, res) => {
  try {
    const data = await readFromDb();
    res.json(data.productsHistory || []);
  } catch (error) {
    console.error('Error fetching product history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Bills history endpoints
app.post('/bills-history', (req, res) => {
    const history = readData(dataFiles.billsHistory);
    const entry = { ...req.body, id: Date.now() };
    history.push(entry);
    
    if (writeData(dataFiles.billsHistory, history)) {
        res.json({ success: true, entry });
    } else {
        res.status(500).json({ success: false, message: 'Failed to save history' });
    }
});

app.get('/bills-history', (req, res) => {
    const history = readData(dataFiles.billsHistory);
    res.json(history);
});

// Refund order endpoint
app.post('/refund-order/:orderNumber', (req, res) => {
    const orders = readData(dataFiles.confirmedOrders);
    const orderIndex = orders.findIndex(o => o.orderNumber === req.params.orderNumber);
    
    if (orderIndex === -1) {
        return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    orders[orderIndex] = { ...orders[orderIndex], ...req.body, isRefunded: true };
    
    if (writeData(dataFiles.confirmedOrders, orders)) {
        res.json({ success: true, order: orders[orderIndex] });
    } else {
        res.status(500).json({ success: false, message: 'Failed to process refund' });
    }
});

// Reports endpoints
app.post('/reports', async (req, res) => {
  try {
    const data = await readFromDb();
    if (!data.reports) {
      data.reports = [];
    }
    if (!data.lastReportId) {
      data.lastReportId = 0;
    }

    // Increment the last report ID
    data.lastReportId += 1;

    const newReport = {
      ...req.body,
      id: data.lastReportId // Use sequential ID instead of timestamp
    };

    data.reports.unshift(newReport);
    // Keep only last 100 reports
    data.reports = data.reports.slice(0, 100);
    
    await writeToDb(data);
    res.json({
      success: true,
      report: newReport
    });

  } catch (error) {
    console.error('Error saving report:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save report' 
    });
  }
});

// Update the reports GET endpoint to include proper error handling
app.get('/reports', async (req, res) => {
  try {
    const data = await readFromDb();
    if (!data.reports) {
      return res.json([]);
    }
    // Sort reports by timestamp in descending order
    const sortedReports = data.reports.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    res.json(sortedReports);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ 
      error: 'Failed to fetch reports',
      details: error.message 
    });
  }
});

// Add this with other report endpoints
app.delete('/reports/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = await readFromDb();
    
    if (!data.reports) {
      return res.status(404).json({ error: 'No reports found' });
    }

    const reportIndex = data.reports.findIndex(r => r.id.toString() === id);
    if (reportIndex === -1) {
      return res.status(404).json({ error: 'Report not found' });
    }

    data.reports.splice(reportIndex, 1);
    await writeToDb(data);

    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// Add revert refund endpoint
app.post('/revert-refund/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const data = await readFromDb();
    
    const orderIndex = data['confirmed-orders'].findIndex(
      o => o.orderNumber === orderNumber && o.isRefunded
    );
    
    if (orderIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        error: 'Order not found or not refunded' 
      });
    }

    // Remove refund information
    const order = data['confirmed-orders'][orderIndex];
    const updatedOrder = {
      ...order,
      isRefunded: false,
      refundedAt: null,
      refundedBy: null
    };

    data['confirmed-orders'][orderIndex] = updatedOrder;
    await writeToDb(data);

    // Log the revert refund action
    const logEntry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      employeeName: req.body.employeeName,
      employeeNumber: req.body.employeeNumber,
      type: 'BILL_REVERT_REFUND',
      origin: 'صفحة الفواتير',
      changes: [
        {
          details: `تم إلغاء استرجاع الفاتورة رقم ${orderNumber}`
        }
      ]
    };

    const settings = await storage.get('settings');
    if (!settings.history) {
      settings.history = [];
    }
    settings.history.unshift(logEntry);
    settings.history = settings.history.slice(0, 100);
    await storage.set('settings', settings);

    res.json({
      success: true,
      order: updatedOrder
    });

  } catch (error) {
    console.error('Error reverting refund:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to revert refund' 
    });
  }
});

// Update the order creation endpoint to ensure unique order numbers
app.post('/confirmed-orders', async (req, res) => {
  try {
    const data = await readFromDb();
    const orders = data['confirmed-orders'] || [];
    
    // Find the highest order number and increment by 1
    let maxOrderNumber = 0;
    orders.forEach(order => {
      const num = parseInt(order.orderNumber, 10);
      if (!isNaN(num) && num > maxOrderNumber) {
        maxOrderNumber = num;
      }
    });
    
    const newOrderNumber = (maxOrderNumber + 1).toString().padStart(6, '0');
    
    const newOrder = {
      ...req.body,
      orderNumber: newOrderNumber,
      id: Date.now().toString(),
      confirmedAt: new Date().toISOString()
    };

    data['confirmed-orders'].unshift(newOrder);
    await writeToDb(data);

    res.json({
      success: true,
      order: newOrder
    });
    
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create order' 
    });
  }
});

// Update reports endpoints
app.post('/reports', async (req, res) => {
  try {
    const data = await readFromDb();
    if (!data.reports) {
      data.reports = [];
    }

    const newReport = {
      ...req.body,
      id: Date.now()
    };

    data.reports.unshift(newReport);
    // Keep only last 100 reports
    data.reports = data.reports.slice(0, 100);
    
    await writeToDb(data);
    res.json(newReport);
  } catch (error) {
    console.error('Error saving report:', error);
    res.status(500).json({ error: 'Failed to save report' });
  }
});

app.get('/reports', async (req, res) => {
  try {
    const data = await readFromDb();
    res.json(data.reports || []);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Add this endpoint to delete history
app.delete('/history', async (req, res) => {
  try {
    // Read current data
    const data = await readFromDb();
    
    // Initialize arrays if they don't exist
    data.settingsHistory = [];
    data.productsHistory = [];
    data.billsHistory = [];
    if (data.settings) {
      data.settings.history = [];
    }

    // Clear any specific history properties that might exist
    if (data.history) {
      data.history = [];
    }
    
    // Save the cleared data back to database
    const success = await writeToDb(data);
    if (!success) {
      throw new Error('Failed to write to database');
    }
    
    // Clear history files
    await Promise.all([
      writeData(dataFiles.settingsHistory, []),
      writeData(dataFiles.productsHistory, []),
      writeData(dataFiles.billsHistory, []),
      writeData(dataFiles.history, [])
    ]);

    // Clear in-memory history
    settingsHistory = [];
    productsHistory = [];
    billsHistory = [];
    
    res.json({ 
      success: true, 
      message: 'تم مسح سجل التغييرات بنجاح'
    });
  } catch (error) {
    console.error('Error clearing history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear history',
      details: error.message
    });
  }
});

// Add or modify the history endpoints
app.get('/history', async (req, res) => {
  try {
    const data = await readFromDb();
    const combinedHistory = [
      ...(data.settingsHistory || []),
      ...(data.productsHistory || []),
      ...(data.billsHistory || []),
      ...(data.settings?.history || [])
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    res.json(combinedHistory);
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch history' });
  }
});

// Start server
initializeServer().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Using database at: ${dbPath}`);
  });
});
