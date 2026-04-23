const express = require('express');
const router = express.Router();
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// GET /api/users/search?userId=xxx
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId || userId.trim().length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const users = await User.find({
      userId: { $regex: userId.toLowerCase(), $options: 'i' },
      _id: { $ne: req.user._id },
    }).select('userId username avatar isOnline lastSeen bio').limit(10);

    res.json({ users });
  } catch (error) {
    res.status(500).json({ message: 'Search failed' });
  }
});

// GET /api/users/:userId — get user profile
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId })
      .select('userId username avatar isOnline lastSeen bio');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/users/contacts/list
router.get('/contacts/list', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('contacts', 'userId username avatar isOnline lastSeen bio');
    res.json({ contacts: user.contacts });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/users/contacts/add
router.post('/contacts/add', authMiddleware, async (req, res) => {
  try {
    const { targetUserId } = req.body;

    const targetUser = await User.findOne({ userId: targetUserId.toLowerCase() });
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    if (targetUser._id.equals(req.user._id)) {
      return res.status(400).json({ message: 'Cannot add yourself' });
    }

    const currentUser = await User.findById(req.user._id);

    // Check if already a contact
    if (currentUser.contacts.includes(targetUser._id)) {
      return res.status(409).json({ message: 'Already in your contacts' });
    }

    // Add each other as contacts (direct add for simplicity)
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { contacts: targetUser._id },
    });
    await User.findByIdAndUpdate(targetUser._id, {
      $addToSet: { contacts: req.user._id },
    });

    const updatedTarget = await User.findById(targetUser._id)
      .select('userId username avatar isOnline lastSeen bio');

    res.json({ message: 'Contact added successfully', contact: updatedTarget });
  } catch (error) {
    console.error('Add contact error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/users/contacts/:targetUserId
router.delete('/contacts/:targetUserId', authMiddleware, async (req, res) => {
  try {
    const targetUser = await User.findOne({ userId: req.params.targetUserId });
    if (!targetUser) return res.status(404).json({ message: 'User not found' });

    await User.findByIdAndUpdate(req.user._id, {
      $pull: { contacts: targetUser._id },
    });

    res.json({ message: 'Contact removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/users/profile/update
router.patch('/profile/update', authMiddleware, async (req, res) => {
  try {
    const { username, bio, avatar } = req.body;
    const updates = {};
    if (username) updates.username = username;
    if (bio !== undefined) updates.bio = bio;
    if (avatar !== undefined) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true })
      .select('-password');

    res.json({ user, message: 'Profile updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
