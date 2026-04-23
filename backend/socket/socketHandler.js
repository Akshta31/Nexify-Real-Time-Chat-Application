const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

// Map: userId (MongoDB _id) → socketId
const onlineUsers = new Map();

module.exports = (io) => {
  // Authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error('Authentication error'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();
    console.log(`🔌 User connected: ${socket.user.userId} (${socket.id})`);

    // Register online
    onlineUsers.set(userId, socket.id);
    await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });

    // Notify contacts that this user is online
    const user = await User.findById(userId).populate('contacts', '_id');
    user.contacts.forEach((contact) => {
      const contactSocketId = onlineUsers.get(contact._id.toString());
      if (contactSocketId) {
        io.to(contactSocketId).emit('user:online', { userId });
      }
    });

    // Deliver any pending messages
    const pendingMessages = await Message.find({
      receiverId: userId,
      status: 'sent',
    });
    if (pendingMessages.length > 0) {
      await Message.updateMany(
        { receiverId: userId, status: 'sent' },
        { status: 'delivered' }
      );
      pendingMessages.forEach((msg) => {
        const senderSocket = onlineUsers.get(msg.senderId.toString());
        if (senderSocket) {
          io.to(senderSocket).emit('message:delivered', { messageId: msg._id });
        }
      });
    }

    // ── SEND MESSAGE ──────────────────────────────────────
    socket.on('message:send', async (data) => {
      try {
        const { receiverUserId, message } = data;
        if (!message || !message.trim()) return;

        const receiver = await User.findOne({ userId: receiverUserId });
        if (!receiver) {
          socket.emit('error', { message: 'Receiver not found' });
          return;
        }

        const receiverSocketId = onlineUsers.get(receiver._id.toString());
        const status = receiverSocketId ? 'delivered' : 'sent';

        const newMessage = new Message({
          senderId: socket.user._id,
          receiverId: receiver._id,
          message: message.trim(),
          status,
        });
        await newMessage.save();

        const messageData = {
          _id: newMessage._id,
          senderId: socket.user._id,
          senderUserId: socket.user.userId,
          receiverId: receiver._id,
          receiverUserId: receiver.userId,
          message: newMessage.message,
          status: newMessage.status,
          createdAt: newMessage.createdAt,
        };

        // Send to receiver if online
        if (receiverSocketId) {
          io.to(receiverSocketId).emit('message:receive', messageData);
          // Confirm delivery to sender
          socket.emit('message:delivered', { messageId: newMessage._id });
        }

        // Confirm sent to sender
        socket.emit('message:sent', messageData);
      } catch (error) {
        console.error('Message send error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // ── TYPING INDICATORS ────────────────────────────────
    socket.on('typing:start', async ({ receiverUserId }) => {
      const receiver = await User.findOne({ userId: receiverUserId });
      if (!receiver) return;
      const receiverSocket = onlineUsers.get(receiver._id.toString());
      if (receiverSocket) {
        io.to(receiverSocket).emit('typing:start', {
          senderUserId: socket.user.userId,
        });
      }
    });

    socket.on('typing:stop', async ({ receiverUserId }) => {
      const receiver = await User.findOne({ userId: receiverUserId });
      if (!receiver) return;
      const receiverSocket = onlineUsers.get(receiver._id.toString());
      if (receiverSocket) {
        io.to(receiverSocket).emit('typing:stop', {
          senderUserId: socket.user.userId,
        });
      }
    });

    // ── READ RECEIPTS ─────────────────────────────────────
    socket.on('messages:read', async ({ senderUserId }) => {
      const sender = await User.findOne({ userId: senderUserId });
      if (!sender) return;

      await Message.updateMany(
        {
          senderId: sender._id,
          receiverId: socket.user._id,
          status: { $in: ['sent', 'delivered'] },
        },
        { status: 'read' }
      );

      const senderSocket = onlineUsers.get(sender._id.toString());
      if (senderSocket) {
        io.to(senderSocket).emit('messages:read', {
          byUserId: socket.user.userId,
        });
      }
    });

    // ── DISCONNECT ────────────────────────────────────────
    socket.on('disconnect', async () => {
      console.log(`🔴 User disconnected: ${socket.user.userId}`);
      onlineUsers.delete(userId);

      const lastSeen = new Date();
      await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });

      // Notify contacts
      const updatedUser = await User.findById(userId).populate('contacts', '_id');
      updatedUser.contacts.forEach((contact) => {
        const contactSocketId = onlineUsers.get(contact._id.toString());
        if (contactSocketId) {
          io.to(contactSocketId).emit('user:offline', { userId, lastSeen });
        }
      });
    });
  });

  return onlineUsers;
};
