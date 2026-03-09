const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', { expiresIn: '7d' });

// POST /api/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, address, role } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ message: 'Name, email, phone, and password are required.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(400).json({ message: 'Email already registered.' });

    const allowedRole = ['customer', 'agent'].includes(role) ? role : 'customer';

    const user = new User({ name, email, phone, password, address: address || {}, role: allowedRole });
    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({ message: 'Registration successful!', token, user });
  } catch (err) {
    res.status(500).json({ message: 'Registration failed.', error: err.message });
  }
});

// POST /api/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password required.' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials.' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials.' });

    const token = generateToken(user._id);
    res.json({ message: 'Login successful!', token, user });
  } catch (err) {
    res.status(500).json({ message: 'Login failed.', error: err.message });
  }
});

// GET /api/me
router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, address },
      { new: true, runValidators: true }
    );
    res.json({ message: 'Profile updated!', user });
  } catch (err) {
    res.status(500).json({ message: 'Update failed.', error: err.message });
  }
});

module.exports = router;
