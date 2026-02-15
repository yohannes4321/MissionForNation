const express = require('express');
const router = express.Router();
const { User, Region, Invitation, Content } = require('../models');
const { authenticate, requireSuperAdmin } = require('../middleware/auth');
const { validators, validate } = require('../middleware/validation');
const { success, error, getPagination, createPaginationMeta } = require('../utils/response');
const { sendNotificationEmail } = require('../utils/email');
const { body } = require('express-validator');

// All routes require authentication and Super Admin privileges
router.use(authenticate);
router.use(requireSuperAdmin);

// @route   GET /api/users
// @desc    Get all users
// @access  Super Admin
router.get('/', async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { role, isActive, region } = req.query;
    
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (region) query.region = region;
    
    const users = await User.find(query)
      .populate('region', 'name code')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await User.countDocuments(query);
    
    success(res, users, 'Users retrieved', 200, createPaginationMeta(page, limit, total));
  } catch (err) {
    console.error('Get users error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Super Admin
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('region', 'name code')
      .select('-password');
    
    if (!user) {
      return error(res, 'User not found', 404);
    }
    
    success(res, user, 'User retrieved');
  } catch (err) {
    console.error('Get user error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   PUT /api/users/:id/role
// @desc    Change user role (promote/demote)
// @access  Super Admin
router.put('/:id/role', 
  validate([validators.role]),
  async (req, res) => {
    try {
      const { role } = req.body;
      const userId = req.params.id;
      
      // Prevent changing own role
      if (userId === req.user._id.toString()) {
        return error(res, 'Cannot change your own role', 400);
      }
      
      const user = await User.findById(userId);
      if (!user) {
        return error(res, 'User not found', 404);
      }
      
      const oldRole = user.role;
      user.role = role;
      
      // If changing to super_admin, remove region
      if (role === 'super_admin') {
        // If was regional admin, remove from region
        if (user.region) {
          await Region.findByIdAndUpdate(user.region, { $unset: { admin: 1 } });
          user.region = null;
        }
      }
      
      user.updatedAt = new Date();
      await user.save();
      
      // Send notification email
      await sendNotificationEmail(
        user.email,
        'Role Updated',
        `Your role has been changed from ${oldRole} to ${role}.`
      );
      
      success(res, {
        user: await User.findById(userId)
          .populate('region', 'name code')
          .select('-password')
      }, `User role changed to ${role}`);
    } catch (err) {
      console.error('Change role error:', err);
      error(res, 'Server error', 500);
    }
  }
);

// @route   PUT /api/users/:id/region
// @desc    Change user's region (only for regional admins)
// @access  Super Admin
router.put('/:id/region',
  validate([body('regionId').isMongoId().withMessage('Valid region ID is required')]),
  async (req, res) => {
    try {
      const { regionId } = req.body;
      const userId = req.params.id;
      
      const user = await User.findById(userId);
      if (!user) {
        return error(res, 'User not found', 404);
      }
      
      // Only regional admins can have regions
      if (user.role !== 'regional_admin') {
        return error(res, 'Only regional admins can be assigned to regions', 400);
      }
      
      // Check if new region exists
      const newRegion = await Region.findById(regionId);
      if (!newRegion) {
        return error(res, 'Region not found', 404);
      }
      
      // Check if new region already has an admin
      if (newRegion.admin && newRegion.admin.toString() !== userId) {
        return error(res, 'This region already has an assigned admin', 400);
      }
      
      // Remove user from old region
      if (user.region) {
        await Region.findByIdAndUpdate(user.region, { $unset: { admin: 1 } });
      }
      
      // Assign to new region
      user.region = regionId;
      user.updatedAt = new Date();
      await user.save();
      
      // Update region with new admin
      await Region.findByIdAndUpdate(regionId, { admin: userId });
      
      success(res, {
        user: await User.findById(userId)
          .populate('region', 'name code')
          .select('-password')
      }, 'User region updated');
    } catch (err) {
      console.error('Change region error:', err);
      error(res, 'Server error', 500);
    }
  }
);

// @route   PUT /api/users/:id/status
// @desc    Activate/Deactivate user
// @access  Super Admin
router.put('/:id/status', async (req, res) => {
  try {
    const { isActive } = req.body;
    const userId = req.params.id;
    
    // Prevent deactivating self
    if (userId === req.user._id.toString()) {
      return error(res, 'Cannot change your own status', 400);
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return error(res, 'User not found', 404);
    }
    
    user.isActive = isActive;
    user.updatedAt = new Date();
    await user.save();
    
    const statusText = isActive ? 'activated' : 'deactivated';
    
    // Send notification email
    await sendNotificationEmail(
      user.email,
      `Account ${statusText}`,
      `Your account has been ${statusText} by the administrator.`
    );
    
    success(res, {
      user: await User.findById(userId)
        .populate('region', 'name code')
        .select('-password')
    }, `User ${statusText}`);
  } catch (err) {
    console.error('Change status error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user permanently
// @access  Super Admin
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Prevent deleting self
    if (userId === req.user._id.toString()) {
      return error(res, 'Cannot delete your own account', 400);
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return error(res, 'User not found', 404);
    }
    
    // Remove user from region
    if (user.region) {
      await Region.findByIdAndUpdate(user.region, { $unset: { admin: 1 } });
    }
    
    // Delete all user's content
    await Content.deleteMany({ createdBy: userId });
    
    // Delete user
    await User.findByIdAndDelete(userId);
    
    // Send notification email
    await sendNotificationEmail(
      user.email,
      'Account Deleted',
      'Your account has been permanently deleted by the administrator.'
    );
    
    success(res, null, 'User deleted permanently');
  } catch (err) {
    console.error('Delete user error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   GET /api/users/statistics/overview
// @desc    Get user statistics
// @access  Super Admin
router.get('/statistics/overview', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const superAdmins = await User.countDocuments({ role: 'super_admin' });
    const regionalAdmins = await User.countDocuments({ role: 'regional_admin' });
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });
    const pendingVerifications = await User.countDocuments({ isEmailVerified: false });
    
    const regionStats = await Region.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'admin',
          foreignField: '_id',
          as: 'adminInfo'
        }
      },
      {
        $project: {
          name: 1,
          code: 1,
          hasAdmin: { $gt: [{ $size: '$adminInfo' }, 0] }
        }
      }
    ]);
    
    success(res, {
      totalUsers,
      superAdmins,
      regionalAdmins,
      activeUsers,
      inactiveUsers,
      pendingVerifications,
      regionStats
    }, 'User statistics retrieved');
  } catch (err) {
    console.error('Get statistics error:', err);
    error(res, 'Server error', 500);
  }
});

module.exports = router;