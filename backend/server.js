const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = 5001;

app.use(cors());
app.use(bodyParser.json());

let confirmedOrders = [];

app.post('/confirmed-orders', (req, res) => {
  const order = req.body;
  confirmedOrders.push(order);
  res.status(201).send(order);
});

app.get('/confirmed-orders', (req, res) => {
  res.status(200).send(confirmedOrders);
});

app.delete('/confirmed-orders', (req, res) => {
  confirmedOrders = [];
  res.status(204).send();
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
