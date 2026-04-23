const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// GET /api/messages/:userId — get conversation with a user
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const otherUser = await User.findOne({ userId: req.params.userId });
    if (!otherUser) return res.status(404).json({ message: 'User not found' });

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({
      $or: [
        { senderId: req.user._id, receiverId: otherUser._id },
        { senderId: otherUser._id, receiverId: req.user._id },
      ],
      deletedFor: { $ne: req.user._id },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Mark delivered messages as read
    await Message.updateMany(
      {
        senderId: otherUser._id,
        receiverId: req.user._id,
        status: { $in: ['sent', 'delivered'] },
      },
      { status: 'read' }
    );

    res.json({
      messages: messages.reverse(),
      page,
      hasMore: messages.length === limit,
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/messages/conversations/list — get all conversations
router.get('/conversations/list', authMiddleware, async (req, res) => {
  try {
    // Get latest message per conversation
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: req.user._id },
            { receiverId: req.user._id },
          ],
          deletedFor: { $ne: req.user._id },
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', req.user._id] },
              '$receiverId',
              '$senderId',
            ],
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$receiverId', req.user._id] },
                    { $ne: ['$status', 'read'] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
    ]);

    // Populate user data
    const populatedConversations = await Promise.all(
      conversations.map(async (conv) => {
        const user = await User.findById(conv._id)
          .select('userId username avatar isOnline lastSeen');
        return { ...conv, user };
      })
    );

    res.json({ conversations: populatedConversations });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/messages/:messageId
router.delete('/:messageId', authMiddleware, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: 'Message not found' });

    if (!message.senderId.equals(req.user._id)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Soft delete for sender
    await Message.findByIdAndUpdate(req.params.messageId, {
      $addToSet: { deletedFor: req.user._id },
    });

    res.json({ message: 'Message deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
