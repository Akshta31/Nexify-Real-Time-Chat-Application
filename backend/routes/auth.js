const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Generate JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '7d' }
  );
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { userId, username, password } = req.body;

    if (!userId || !username || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(userId)) {
      return res.status(400).json({ message: 'User ID can only contain letters, numbers, and underscores' });
    }

    if (userId.length < 3 || userId.length > 20) {
      return res.status(400).json({ message: 'User ID must be 3-20 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ userId: userId.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'This User ID is already taken' });
    }

    const user = new User({
      userId: userId.toLowerCase(),
      username,
      password,
    });

    await user.save();

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ message: 'User ID and password are required' });
    }

    const user = await User.findOne({ userId: userId.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid User ID or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid User ID or password' });
    }

    // Update online status
    user.isOnline = true;
    user.lastSeen = new Date();
    await user.save();

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      isOnline: false,
      lastSeen: new Date(),
    });
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
