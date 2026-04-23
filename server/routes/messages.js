const express = require('express');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/messages/:userId — fetch conversation history
router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({
      $or: [
        { senderId: req.user.userId, receiverId: userId },
        { senderId: userId, receiverId: req.user.userId },
      ],
    })
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    // Mark messages as read
    await Message.updateMany(
      { senderId: userId, receiverId: req.user.userId, status: { $ne: 'read' } },
      { status: 'read' }
    );

    res.json({ messages: messages.reverse() });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// GET /api/messages/conversations/list — get all recent conversations
router.get('/conversations/list', auth, async (req, res) => {
  try {
    // Aggregate to get latest message per conversation partner
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: req.user.userId },
            { receiverId: req.user.userId },
          ],
        },
      },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', req.user.userId] },
              '$receiverId',
              '$senderId',
            ],
          },
          lastMessage: { $first: '$$ROOT' },
        },
      },
      { $sort: { 'lastMessage.timestamp': -1 } },
    ]);

    res.json({ conversations });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// DELETE /api/messages/:messageId
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ error: 'Message not found' });
    if (message.senderId !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await message.deleteOne();
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

module.exports = router;
