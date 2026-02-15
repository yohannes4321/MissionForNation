const express = require('express');
const router = express.Router();
const { User, Region, Config } = require('../models');
const { success, error } = require('../utils/response');

// @route   POST /api/auth/setup
// @desc    One-time setup to create first Super Admin
// @access  Public (one-time use only)
router.post('/setup', async (req, res) => {
  try {
    // Check if any Super Admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    
    if (existingSuperAdmin) {
      return error(res, 'Setup already completed. Super Admin already exists.', 403);
    }
    
    const { email, password, firstName, lastName } = req.body;
    
    // Validation
    if (!email || !password || !firstName || !lastName) {
      return error(res, 'All fields are required: email, password, firstName, lastName', 400);
    }
    
    if (password.length < 8) {
      return error(res, 'Password must be at least 8 characters long', 400);
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return error(res, 'User with this email already exists', 400);
    }
    
    // Create Super Admin
    const superAdmin = new User({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      role: 'super_admin',
      isEmailVerified: true,
      isActive: true
    });
    
    await superAdmin.save();
    
    // Initialize default data if not already done
    await Region.initializeRegions();
    await Config.initializeDefaults();
    
    success(res, {
      message: 'Super Admin created successfully',
      user: {
        id: superAdmin._id,
        email: superAdmin.email,
        firstName: superAdmin.firstName,
        lastName: superAdmin.lastName,
        role: superAdmin.role
      }
    }, 'Setup completed successfully', 201);
  } catch (err) {
    console.error('Setup error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   GET /api/auth/setup/status
// @desc    Check if setup has been completed
// @access  Public
router.get('/setup/status', async (req, res) => {
  try {
    const superAdminExists = await User.exists({ role: 'super_admin' });
    
    success(res, {
      setupComplete: !!superAdminExists,
      message: superAdminExists ? 'Setup already completed' : 'Setup required'
    });
  } catch (err) {
    console.error('Setup status error:', err);
    error(res, 'Server error', 500);
  }
});

module.exports = router;