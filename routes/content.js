const express = require('express');
const router = express.Router();
const { Content } = require('../models');
const { authenticate, requireRegionalAdmin } = require('../middleware/auth');
const { contentValidations } = require('../middleware/validation');
const { success, error, getPagination, createPaginationMeta } = require('../utils/response');

// All routes require authentication and Regional Admin privileges
router.use(authenticate);
router.use(requireRegionalAdmin);

// Middleware to ensure user can only access their own region's content
const checkRegionAccess = (req, res, next) => {
  if (!req.user.region) {
    return error(res, 'You are not assigned to any region', 403);
  }
  next();
};

router.use(checkRegionAccess);

// @route   POST /api/content
// @desc    Create new content for region
// @access  Regional Admin
router.post('/', contentValidations.create, async (req, res) => {
  try {
    const { title, description, type, content, mediaUrl, videoUrl } = req.body;
    
    // Check content limit
    const contentCount = await Content.countDocuments({ 
      region: req.user.region._id,
      isActive: true 
    });
    
    const maxContent = parseInt(process.env.MAX_CONTENT_PER_REGION) || 100;
    if (contentCount >= maxContent) {
      return error(res, `Maximum content limit (${maxContent}) reached for this region`, 400);
    }
    
    const newContent = new Content({
      title,
      description,
      type,
      content,
      mediaUrl,
      videoUrl,
      region: req.user.region._id,
      createdBy: req.user._id
    });
    
    await newContent.save();
    
    success(res, newContent, 'Content created successfully', 201);
  } catch (err) {
    console.error('Create content error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   GET /api/content
// @desc    Get all content for admin's region
// @access  Regional Admin
router.get('/', async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { type, isActive, search } = req.query;
    
    const query = { region: req.user.region._id };
    if (type) query.type = type;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    const contents = await Content.find(query)
      .populate('createdBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Content.countDocuments(query);
    
    success(res, contents, 'Content retrieved', 200, createPaginationMeta(page, limit, total));
  } catch (err) {
    console.error('Get content error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   GET /api/content/:id
// @desc    Get single content
// @access  Regional Admin
router.get('/:id', async (req, res) => {
  try {
    const content = await Content.findOne({
      _id: req.params.id,
      region: req.user.region._id
    }).populate('createdBy', 'firstName lastName email');
    
    if (!content) {
      return error(res, 'Content not found', 404);
    }
    
    success(res, content, 'Content retrieved');
  } catch (err) {
    console.error('Get content error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   PUT /api/content/:id
// @desc    Update content
// @access  Regional Admin
router.put('/:id', contentValidations.update, async (req, res) => {
  try {
    const content = await Content.findOne({
      _id: req.params.id,
      region: req.user.region._id
    });
    
    if (!content) {
      return error(res, 'Content not found', 404);
    }
    
    // Only allow updating certain fields
    const allowedUpdates = ['title', 'description', 'content', 'mediaUrl', 'videoUrl'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    
    updates.updatedAt = new Date();
    
    const updatedContent = await Content.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName email');
    
    success(res, updatedContent, 'Content updated successfully');
  } catch (err) {
    console.error('Update content error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   DELETE /api/content/:id
// @desc    Delete content (soft delete)
// @access  Regional Admin
router.delete('/:id', async (req, res) => {
  try {
    const content = await Content.findOne({
      _id: req.params.id,
      region: req.user.region._id
    });
    
    if (!content) {
      return error(res, 'Content not found', 404);
    }
    
    // Soft delete
    content.isActive = false;
    content.updatedAt = new Date();
    await content.save();
    
    success(res, null, 'Content deleted successfully');
  } catch (err) {
    console.error('Delete content error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   PUT /api/content/:id/restore
// @desc    Restore deleted content
// @access  Regional Admin
router.put('/:id/restore', async (req, res) => {
  try {
    const content = await Content.findOne({
      _id: req.params.id,
      region: req.user.region._id
    });
    
    if (!content) {
      return error(res, 'Content not found', 404);
    }
    
    content.isActive = true;
    content.updatedAt = new Date();
    await content.save();
    
    success(res, content, 'Content restored successfully');
  } catch (err) {
    console.error('Restore content error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   GET /api/content/statistics/overview
// @desc    Get content statistics for region
// @access  Regional Admin
router.get('/statistics/overview', async (req, res) => {
  try {
    const regionId = req.user.region._id;
    
    const totalContent = await Content.countDocuments({ region: regionId });
    const activeContent = await Content.countDocuments({ region: regionId, isActive: true });
    const inactiveContent = await Content.countDocuments({ region: regionId, isActive: false });
    
    const contentByType = await Content.aggregate([
      { $match: { region: regionId } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    const totalViews = await Content.aggregate([
      { $match: { region: regionId } },
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);
    
    const recentContent = await Content.find({ region: regionId })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('createdBy', 'firstName lastName');
    
    success(res, {
      totalContent,
      activeContent,
      inactiveContent,
      contentByType,
      totalViews: totalViews[0]?.totalViews || 0,
      recentContent
    }, 'Content statistics retrieved');
  } catch (err) {
    console.error('Get statistics error:', err);
    error(res, 'Server error', 500);
  }
});

module.exports = router;