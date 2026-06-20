const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-memory product catalog (resets when container restarts)
let products = [
    { id: 1, name: "DevOps Handbook", price: 29.99, category: "Books" },
    { id: 2, name: "Docker Mug", price: 14.99, category: "Merch" },
    { id: 3, name: "Kubernetes Sticker Pack", price: 4.99, category: "Accessories" }
];

// GET: Fetch all products
app.get('/api/products', (req, res) => {
    console.log(`[INFO] [${new Date().toISOString()}] Fetching product catalog. Total count: ${products.length}`);
    res.json(products);
});

// POST: Add a new product
app.post('/api/products', (req, res) => {
    const { name, price, category } = req.body;
    
    if (!name || !price || !category) {
        console.error(`[ERROR] [${new Date().toISOString()}] Failed product creation attempt. Missing fields.`);
        return res.status(400).json({ error: "Name, price, and category are required." });
    }

    const newProduct = { id: products.length + 1, name, price: parseFloat(price), category };
    products.push(newProduct);

    console.log(`[SUCCESS] [${new Date().toISOString()}] Product added: ${name} (${category})`);
    res.status(201).json(newProduct);
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[START] Backend microservice running on port ${PORT}`);
});