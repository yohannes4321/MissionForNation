const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { User, Invitation, Region } = require('../models');
const { generateToken } = require('../middleware/auth');
const { authValidations, invitationValidations } = require('../middleware/validation');
const { success, error } = require('../utils/response');
const { sendInvitationEmail } = require('../utils/email');

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authValidations.login, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email }).populate('region');
    
    if (!user) {
      return error(res, 'Invalid credentials', 401);
    }
    
    if (!user.isEmailVerified) {
      return error(res, 'Please verify your email before logging in', 401);
    }
    
    if (!user.isActive) {
      return error(res, 'Account has been deactivated', 401);
    }
    
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      return error(res, 'Invalid credentials', 401);
    }
    
    // Update last login
    await user.updateLastLogin();
    
    const token = generateToken(user._id);
    
    success(res, {
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        region: user.region
      }
    }, 'Login successful');
  } catch (err) {
    console.error('Login error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   POST /api/auth/register
// @desc    Register user with invitation token
// @access  Public
router.post('/register', authValidations.register, async (req, res) => {
  try {
    const { token, email, password, firstName, lastName } = req.body;
    
    // Find invitation
    const invitation = await Invitation.findOne({ 
      token, 
      email: email.toLowerCase(),
      status: 'pending'
    }).populate('region');
    
    if (!invitation) {
      return error(res, 'Invalid or expired invitation', 400);
    }
    
    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      return error(res, 'Invitation has expired', 400);
    }
    
    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      return error(res, 'User already exists', 400);
    }
    
    // Create user
    user = new User({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      role: invitation.role,
      region: invitation.region,
      isEmailVerified: true,
      isActive: true
    });
    
    await user.save();
    
    // Update invitation
    invitation.status = 'accepted';
    invitation.acceptedAt = new Date();
    await invitation.save();
    
    // Update region with admin reference
    if (invitation.region) {
      await Region.findByIdAndUpdate(invitation.region, { admin: user._id });
    }
    
    const authToken = generateToken(user._id);
    
    success(res, {
      token: authToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        region: user.region
      }
    }, 'Registration successful', 201);
  } catch (err) {
    console.error('Registration error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   GET /api/auth/verify-invitation/:token
// @desc    Verify invitation token
// @access  Public
router.get('/verify-invitation/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const invitation = await Invitation.findOne({ 
      token,
      status: 'pending'
    }).populate('region', 'name code');
    
    if (!invitation) {
      return error(res, 'Invalid invitation', 400);
    }
    
    if (invitation.expiresAt < new Date()) {
      invitation.status = 'expired';
      await invitation.save();
      return error(res, 'Invitation has expired', 400);
    }
    
    success(res, {
      email: invitation.email,
      role: invitation.role,
      region: invitation.region
    }, 'Invitation valid');
  } catch (err) {
    console.error('Verify invitation error:', err);
    error(res, 'Server error', 500);
  }
});

// Setup routes
const setupRoutes = require('./setup');
router.use('/setup', setupRoutes);

module.exports = router;