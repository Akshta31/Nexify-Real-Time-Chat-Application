const express = require('express');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/users/search?q=userId
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json({ users: [] });

    const users = await User.find({
      userId: { $regex: q.toLowerCase(), $options: 'i' },
      userId: { $ne: req.user.userId },
    }).limit(10).select('userId username avatar bio isOnline lastSeen');

    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/users/:userId
router.get('/:userId', auth, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.params.userId })
      .select('userId username avatar bio isOnline lastSeen');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST /api/users/contact/add
router.post('/contact/add', auth, async (req, res) => {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ error: 'Target user ID required' });

    const targetUser = await User.findOne({ userId: targetUserId });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    if (req.user.contacts.includes(targetUserId)) {
      return res.status(400).json({ error: 'Already in contacts' });
    }

    // Add to both users' contacts (direct add for simplicity)
    await User.findOneAndUpdate(
      { userId: req.user.userId },
      { $addToSet: { contacts: targetUserId } }
    );
    await User.findOneAndUpdate(
      { userId: targetUserId },
      { $addToSet: { contacts: req.user.userId } }
    );

    res.json({ message: 'Contact added successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add contact' });
  }
});

// DELETE /api/users/contact/:userId
router.delete('/contact/:contactId', auth, async (req, res) => {
  try {
    await User.findOneAndUpdate(
      { userId: req.user.userId },
      { $pull: { contacts: req.params.contactId } }
    );
    res.json({ message: 'Contact removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove contact' });
  }
});

// GET /api/users/contacts/list
router.get('/contacts/list', auth, async (req, res) => {
  try {
    const me = await User.findOne({ userId: req.user.userId });
    const contacts = await User.find({ userId: { $in: me.contacts } })
      .select('userId username avatar bio isOnline lastSeen');
    res.json({ contacts });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

module.exports = router;
