const express = require('express');
const router = express.Router();
const { Region, User } = require('../models');
const { authenticate, requireSuperAdmin } = require('../middleware/auth');
const { success, error } = require('../utils/response');

// @route   GET /api/regions
// @desc    Get all regions (public)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const regions = await Region.find({ isActive: true })
      .populate('admin', 'firstName lastName email')
      .sort({ name: 1 });
    
    success(res, regions, 'Regions retrieved');
  } catch (err) {
    console.error('Get regions error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   GET /api/regions/:id
// @desc    Get single region (public)
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const region = await Region.findById(req.params.id)
      .populate('admin', 'firstName lastName email');
    
    if (!region) {
      return error(res, 'Region not found', 404);
    }
    
    success(res, region, 'Region retrieved');
  } catch (err) {
    console.error('Get region error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   GET /api/regions/:id/content
// @desc    Get content for a region (public)
// @access  Public
router.get('/:id/content', async (req, res) => {
  try {
    const { Content } = require('../models');
    const { getPagination, createPaginationMeta } = require('../utils/response');
    
    const { page, limit, skip } = getPagination(req);
    const { type } = req.query;
    
    const query = { 
      region: req.params.id,
      isActive: true
    };
    
    if (type) query.type = type;
    
    const contents = await Content.find(query)
      .populate('createdBy', 'firstName lastName')
      .select('-__v')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    // Increment view count
    const contentIds = contents.map(c => c._id);
    await Content.updateMany(
      { _id: { $in: contentIds } },
      { $inc: { views: 1 } }
    );
    
    const total = await Content.countDocuments(query);
    
    success(res, contents, 'Content retrieved', 200, createPaginationMeta(page, limit, total));
  } catch (err) {
    console.error('Get region content error:', err);
    error(res, 'Server error', 500);
  }
});

// Super Admin routes
router.use(authenticate);
router.use(requireSuperAdmin);

// @route   PUT /api/regions/:id
// @desc    Update region
// @access  Super Admin
router.put('/:id', async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    
    const region = await Region.findByIdAndUpdate(
      req.params.id,
      { 
        name, 
        description, 
        isActive,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate('admin', 'firstName lastName email');
    
    if (!region) {
      return error(res, 'Region not found', 404);
    }
    
    success(res, region, 'Region updated successfully');
  } catch (err) {
    console.error('Update region error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   PUT /api/regions/:id/admin
// @desc    Assign admin to region
// @access  Super Admin
router.put('/:id/admin', async (req, res) => {
  try {
    const { adminId } = req.body;
    
    const region = await Region.findById(req.params.id);
    if (!region) {
      return error(res, 'Region not found', 404);
    }
    
    // Verify user exists and is a regional admin
    const user = await User.findById(adminId);
    if (!user) {
      return error(res, 'User not found', 404);
    }
    
    if (user.role !== 'regional_admin') {
      return error(res, 'User must be a regional admin', 400);
    }
    
    // Check if admin is already assigned to another region
    if (user.region && user.region.toString() !== req.params.id) {
      // Remove from old region
      await Region.findByIdAndUpdate(user.region, { $unset: { admin: 1 } });
    }
    
    // Assign to new region
    region.admin = adminId;
    await region.save();
    
    // Update user's region
    user.region = region._id;
    await user.save();
    
    const updatedRegion = await Region.findById(req.params.id)
      .populate('admin', 'firstName lastName email');
    
    success(res, updatedRegion, 'Admin assigned to region');
  } catch (err) {
    console.error('Assign admin error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   DELETE /api/regions/:id/admin
// @desc    Remove admin from region
// @access  Super Admin
router.delete('/:id/admin', async (req, res) => {
  try {
    const region = await Region.findById(req.params.id);
    if (!region) {
      return error(res, 'Region not found', 404);
    }
    
    if (region.admin) {
      // Update user
      await User.findByIdAndUpdate(region.admin, { $unset: { region: 1 } });
      
      // Update region
      region.admin = null;
      await region.save();
    }
    
    success(res, region, 'Admin removed from region');
  } catch (err) {
    console.error('Remove admin error:', err);
    error(res, 'Server error', 500);
  }
});

module.exports = router;