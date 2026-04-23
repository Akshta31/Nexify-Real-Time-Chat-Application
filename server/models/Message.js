const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: String,
    required: true,
  },
  receiverId: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
    maxlength: 2000,
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  edited: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Index for fast chat history retrieval
messageSchema.index({ senderId: 1, receiverId: 1, timestamp: -1 });

module.exports = mongoose.model('Message', messageSchema);
