const express = require('express');
const router = express.Router();
const { BlogPost } = require('../models');
const { authenticate, requireSuperAdmin } = require('../middleware/auth');
const { blogValidations } = require('../middleware/validation');
const { success, error, getPagination, createPaginationMeta } = require('../utils/response');

// All routes require authentication and Super Admin privileges
router.use(authenticate);
router.use(requireSuperAdmin);

// @route   POST /api/blog
// @desc    Create new blog post
// @access  Super Admin
router.post('/', blogValidations.create, async (req, res) => {
  try {
    const { title, content, excerpt, type, featuredImage, videoUrl, tags, isFeatured, isPublished } = req.body;
    
    const blogPost = new BlogPost({
      title,
      content,
      excerpt,
      type,
      featuredImage,
      videoUrl,
      author: req.user._id,
      tags,
      isFeatured: isFeatured || false,
      isPublished: isPublished !== undefined ? isPublished : true
    });
    
    await blogPost.save();
    
    success(res, blogPost, 'Blog post created successfully', 201);
  } catch (err) {
    console.error('Create blog post error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   GET /api/blog
// @desc    Get all blog posts (admin view)
// @access  Super Admin
router.get('/', async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { isPublished, isFeatured, author, search } = req.query;
    
    const query = {};
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';
    if (isFeatured !== undefined) query.isFeatured = isFeatured === 'true';
    if (author) query.author = author;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }
    
    const posts = await BlogPost.find(query)
      .populate('author', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await BlogPost.countDocuments(query);
    
    success(res, posts, 'Blog posts retrieved', 200, createPaginationMeta(page, limit, total));
  } catch (err) {
    console.error('Get blog posts error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   GET /api/blog/:id
// @desc    Get single blog post
// @access  Super Admin
router.get('/:id', async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id)
      .populate('author', 'firstName lastName email');
    
    if (!post) {
      return error(res, 'Blog post not found', 404);
    }
    
    success(res, post, 'Blog post retrieved');
  } catch (err) {
    console.error('Get blog post error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   PUT /api/blog/:id
// @desc    Update blog post
// @access  Super Admin
router.put('/:id', blogValidations.update, async (req, res) => {
  try {
    const updateData = req.body;
    updateData.updatedAt = new Date();
    
    const post = await BlogPost.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('author', 'firstName lastName email');
    
    if (!post) {
      return error(res, 'Blog post not found', 404);
    }
    
    success(res, post, 'Blog post updated successfully');
  } catch (err) {
    console.error('Update blog post error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   DELETE /api/blog/:id
// @desc    Delete blog post
// @access  Super Admin
router.delete('/:id', async (req, res) => {
  try {
    const post = await BlogPost.findByIdAndDelete(req.params.id);
    
    if (!post) {
      return error(res, 'Blog post not found', 404);
    }
    
    success(res, null, 'Blog post deleted successfully');
  } catch (err) {
    console.error('Delete blog post error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   PUT /api/blog/:id/publish
// @desc    Toggle publish status
// @access  Super Admin
router.put('/:id/publish', async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    
    if (!post) {
      return error(res, 'Blog post not found', 404);
    }
    
    post.isPublished = !post.isPublished;
    if (post.isPublished && !post.publishDate) {
      post.publishDate = new Date();
    }
    post.updatedAt = new Date();
    await post.save();
    
    const status = post.isPublished ? 'published' : 'unpublished';
    success(res, post, `Blog post ${status}`);
  } catch (err) {
    console.error('Toggle publish error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   PUT /api/blog/:id/featured
// @desc    Toggle featured status
// @access  Super Admin
router.put('/:id/featured', async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    
    if (!post) {
      return error(res, 'Blog post not found', 404);
    }
    
    post.isFeatured = !post.isFeatured;
    post.updatedAt = new Date();
    await post.save();
    
    const status = post.isFeatured ? 'featured' : 'unfeatured';
    success(res, post, `Blog post ${status}`);
  } catch (err) {
    console.error('Toggle featured error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   GET /api/blog/statistics/overview
// @desc    Get blog statistics
// @access  Super Admin
router.get('/statistics/overview', async (req, res) => {
  try {
    const totalPosts = await BlogPost.countDocuments();
    const publishedPosts = await BlogPost.countDocuments({ isPublished: true });
    const draftPosts = await BlogPost.countDocuments({ isPublished: false });
    const featuredPosts = await BlogPost.countDocuments({ isFeatured: true });
    
    const totalViews = await BlogPost.aggregate([
      { $group: { _id: null, totalViews: { $sum: '$views' } } }
    ]);
    
    const postsByType = await BlogPost.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);
    
    success(res, {
      totalPosts,
      publishedPosts,
      draftPosts,
      featuredPosts,
      totalViews: totalViews[0]?.totalViews || 0,
      postsByType
    }, 'Blog statistics retrieved');
  } catch (err) {
    console.error('Get statistics error:', err);
    error(res, 'Server error', 500);
  }
});

module.exports = router;