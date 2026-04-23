const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent',
  },
  reactions: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    emoji: String,
  }],
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
}, { timestamps: true });

// Index for faster conversation queries
messageSchema.index({ senderId: 1, receiverId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, status: 1 });

module.exports = mongoose.model('Message', messageSchema);
