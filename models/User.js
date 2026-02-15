const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: function() {
      return this.isEmailVerified;
    }
  },
  firstName: {
    type: String,
    required: function() {
      return this.isEmailVerified;
    }
  },
  lastName: {
    type: String,
    required: function() {
      return this.isEmailVerified;
    }
  },
  role: {
    type: String,
    enum: ['super_admin', 'regional_admin'],
    default: 'regional_admin'
  },
  region: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region',
    required: function() {
      return this.role === 'regional_admin' && this.isEmailVerified;
    }
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.updateLastLogin = function() {
  this.lastLogin = new Date();
  return this.save();
};

module.exports = mongoose.model('User', userSchema);