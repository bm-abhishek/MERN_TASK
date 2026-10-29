const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// In-memory Array of items (CRUD target)
let items = [
  { id: 1, name: 'Book', price: 250 },
  { id: 2, name: 'Pen', price: 25 }
];
let nextId = 3;

// --- REST API ROUTES ---

// 1. READ ALL - GET /api/items
app.get('/api/items', (req, res) => {
  res.json({ success: true, data: items });
});

// 2. READ ONE - GET /api/items/:id
app.get('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const item = items.find(i => i.id === id);

  if (!item) {
    return res.status(404).json({ success: false, message: `Item with ID ${id} not found.` });
  }

  res.json({ success: true, data: item });
});

// 3. CREATE - POST /api/items
app.post('/api/items', (req, res) => {
  const { name, price } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Item name is required.' });
  }

  const parsedPrice = parseFloat(price);
  if (isNaN(parsedPrice) || parsedPrice < 0) {
    return res.status(400).json({ success: false, message: 'Price must be a valid non-negative number.' });
  }

  const newItem = {
    id: nextId++,
    name: name.trim(),
    price: parsedPrice
  };

  items.push(newItem);
  res.status(201).json({ success: true, message: 'Item created successfully.', data: newItem });
});

// 4. UPDATE - PUT /api/items/:id
app.put('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { name, price } = req.body;

  const itemIndex = items.findIndex(i => i.id === id);
  if (itemIndex === -1) {
    return res.status(404).json({ success: false, message: `Item with ID ${id} not found.` });
  }

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Name cannot be empty.' });
    }
    items[itemIndex].name = name.trim();
  }

  if (price !== undefined) {
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ success: false, message: 'Price must be a valid non-negative number.' });
    }
    items[itemIndex].price = parsedPrice;
  }

  res.json({ success: true, message: 'Item updated successfully.', data: items[itemIndex] });
});

// 5. DELETE - DELETE /api/items/:id
app.delete('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const itemIndex = items.findIndex(i => i.id === id);

  if (itemIndex === -1) {
    return res.status(404).json({ success: false, message: `Item with ID ${id} not found.` });
  }

  const deletedItem = items.splice(itemIndex, 1)[0];
  res.json({ success: true, message: 'Item deleted successfully.', data: deletedItem });
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`CRUD Operations Server is running on http://localhost:${PORT}`);
  console.log(`Open http://localhost:${PORT} in your web browser`);
  console.log(`====================================================`);
});
