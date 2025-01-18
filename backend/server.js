const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Store orders in memory (replace with database in production)
let confirmedOrders = [];

// Endpoint to save confirmed orders
app.post('/confirmed-orders', (req, res) => {
  const order = req.body;
  confirmedOrders.push(order);
  res.status(201).json(order);
});

// Endpoint to get all confirmed orders
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
