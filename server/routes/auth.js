const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'nexify_secret', { expiresIn: '7d' });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { userId, username, password } = req.body;

    if (!userId || !username || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existing = await User.findOne({ userId: userId.toLowerCase() });
    if (existing) return res.status(400).json({ error: 'User ID already taken' });

    const user = new User({
      userId: userId.toLowerCase(),
      username,
      password,
    });

    await user.save();
    const token = generateToken(user.userId);

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res.status(400).json({ error: 'User ID and password required' });
    }

    const user = await User.findOne({ userId: userId.toLowerCase() });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = generateToken(user.userId);
    res.json({ token, user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user });
});

// PATCH /api/auth/profile
router.patch('/profile', auth, async (req, res) => {
  try {
    const { username, bio, avatar } = req.body;
    const updates = {};
    if (username) updates.username = username;
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findOneAndUpdate(
      { userId: req.user.userId },
      updates,
      { new: true }
    );
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

module.exports = router;
