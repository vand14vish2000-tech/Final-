import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');

  // Dynamically points to backend container/service port 5000
  const API_URL = `http://${window.location.hostname}:5000/api/products`;

  const fetchProducts = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price || !category) return;

    try {
      await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, price, category })
      });
      setName('');
      setPrice('');
      setCategory('');
      fetchProducts(); // Refresh list
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>📦 DevOps Product Catalog</h1>
        
        <form onSubmit={handleSubmit} className="product-form">
          <input type="text" placeholder="Product Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} />
          <input type="text" placeholder="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
          <button type="submit">Add Product</button>
        </form>

        <div className="product-list">
          <h2>Available Products</h2>
          <ul>
            {products.map(product => (
              <li key={product.id}>
                <strong>{product.name}</strong> - ${product.price} <span className="tag">{product.category}</span>
              </li>
            ))}
          </ul>
        </div>
      </header>
    </div>
  );
}

export default App;