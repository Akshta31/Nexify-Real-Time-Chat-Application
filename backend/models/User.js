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
    minlength: 2,
    maxlength: 30,
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
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  pendingRequests: [{
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sentAt: { type: Date, default: Date.now },
  }],
  sentRequests: [{
    to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    sentAt: { type: Date, default: Date.now },
  }],
  lastSeen: {
    type: Date,
    default: Date.now,
  },
  isOnline: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove sensitive fields when converting to JSON
userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
