const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { auth, adminAuth } = require('../middleware/auth');

// GET /api/products - public
router.get('/products', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 12 } = req.query;
    const query = { isActive: true };

    if (category) query.category = category;
    if (search) query.name = { $regex: search, $options: 'i' };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    res.json({ products, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch products.', error: err.message });
  }
});

// GET /api/products/:id - public
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product || !product.isActive) return res.status(404).json({ message: 'Product not found.' });
    res.json({ product });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch product.', error: err.message });
  }
});

// POST /api/products - admin only
router.post('/products', adminAuth, async (req, res) => {
  try {
    const { name, description, price, image, stock, category } = req.body;
    if (!name || !description || price === undefined || stock === undefined) {
      return res.status(400).json({ message: 'Name, description, price, and stock are required.' });
    }

    const product = new Product({ name, description, price, image, stock, category, createdBy: req.user._id });
    await product.save();
    res.status(201).json({ message: 'Product created!', product });
  } catch (err) {
    res.status(500).json({ message: 'Failed to create product.', error: err.message });
  }
});

// PUT /api/products/:id - admin only
router.put('/products/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    res.json({ message: 'Product updated!', product });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update product.', error: err.message });
  }
});

// DELETE /api/products/:id - admin only
router.delete('/products/:id', adminAuth, async (req, res) => {
  try {
    await Product.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Product deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete product.', error: err.message });
  }
});

module.exports = router;
