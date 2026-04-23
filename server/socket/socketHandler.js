const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

// Map: userId -> socketId
const onlineUsers = new Map();

const setupSocket = (io) => {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'nexify_secret');
      const user = await User.findOne({ userId: decoded.userId });
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user.userId;
    console.log(`✅ User connected: ${userId} [${socket.id}]`);

    // Register user online
    onlineUsers.set(userId, socket.id);
    await User.findOneAndUpdate({ userId }, { isOnline: true, socketId: socket.id, lastSeen: new Date() });

    // Notify contacts that this user is online
    broadcastStatusToContacts(io, socket.user, true);

    // Send current online users list to newly connected user
    socket.emit('online_users', Array.from(onlineUsers.keys()));

    // ── SEND MESSAGE ──────────────────────────────────────────────
    socket.on('send_message', async (data) => {
      try {
        const { receiverId, message } = data;
        if (!receiverId || !message?.trim()) return;

        const newMessage = new Message({
          senderId: userId,
          receiverId,
          message: message.trim(),
          status: 'sent',
          timestamp: new Date(),
        });
        await newMessage.save();

        // Deliver to receiver if online
        const receiverSocketId = onlineUsers.get(receiverId);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('receive_message', newMessage);
          // Update to delivered
          await Message.findByIdAndUpdate(newMessage._id, { status: 'delivered' });
          newMessage.status = 'delivered';
        }

        // Confirm to sender
        socket.emit('message_sent', newMessage);
      } catch (err) {
        console.error('send_message error:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ── TYPING INDICATOR ─────────────────────────────────────────
    socket.on('typing_start', ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user_typing', { userId, isTyping: true });
      }
    });

    socket.on('typing_stop', ({ receiverId }) => {
      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('user_typing', { userId, isTyping: false });
      }
    });

    // ── READ RECEIPT ──────────────────────────────────────────────
    socket.on('messages_read', async ({ senderId }) => {
      try {
        await Message.updateMany(
          { senderId, receiverId: userId, status: { $ne: 'read' } },
          { status: 'read' }
        );
        const senderSocketId = onlineUsers.get(senderId);
        if (senderSocketId) {
          io.to(senderSocketId).emit('messages_read_by', { readBy: userId });
        }
      } catch (err) {
        console.error('messages_read error:', err);
      }
    });

    // ── DISCONNECT ────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`❌ User disconnected: ${userId}`);
      onlineUsers.delete(userId);
      const now = new Date();
      await User.findOneAndUpdate({ userId }, { isOnline: false, socketId: '', lastSeen: now });
      broadcastStatusToContacts(io, { ...socket.user.toObject(), lastSeen: now }, false);
    });
  });
};

async function broadcastStatusToContacts(io, user, isOnline) {
  try {
    const fullUser = await User.findOne({ userId: user.userId });
    if (!fullUser) return;

    fullUser.contacts.forEach((contactId) => {
      const contactSocketId = onlineUsers.get(contactId);
      if (contactSocketId) {
        io.to(contactSocketId).emit('contact_status_change', {
          userId: user.userId,
          isOnline,
          lastSeen: new Date(),
        });
      }
    });
  } catch (err) {
    console.error('broadcastStatusToContacts error:', err);
  }
}

module.exports = { setupSocket, onlineUsers };
