const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-zA-Z0-9_]+$/,
  },
  username: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  avatar: {
    type: String,
    default: '',
  },
  bio: {
    type: String,
    default: '',
    maxlength: 150,
  },
  contacts: [{
    type: String, // userId references
    ref: 'User',
  }],
  pendingRequests: [{
    from: { type: String },
    sentAt: { type: Date, default: Date.now },
  }],
  isOnline: {
    type: Boolean,
    default: false,
  },
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  socketId: {
    type: String,
    default: '',
  },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Hide password in responses
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.socketId;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
