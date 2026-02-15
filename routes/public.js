const express = require('express');
const router = express.Router();
const { BlogPost, Region, Content } = require('../models');
const { success, error, getPagination, createPaginationMeta } = require('../utils/response');

// @route   GET /api/public/blog
// @desc    Get published blog posts for homepage
// @access  Public
router.get('/blog', async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { featured, search } = req.query;
    
    const query = { isPublished: true };
    
    if (featured === 'true') {
      query.isFeatured = true;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    const posts = await BlogPost.find(query)
      .populate('author', 'firstName lastName')
      .select('-__v')
      .sort({ isFeatured: -1, publishDate: -1 })
      .skip(skip)
      .limit(limit);
    
    // Increment views
    const postIds = posts.map(p => p._id);
    await BlogPost.updateMany(
      { _id: { $in: postIds } },
      { $inc: { views: 1 } }
    );
    
    const total = await BlogPost.countDocuments(query);
    
    success(res, posts, 'Blog posts retrieved', 200, createPaginationMeta(page, limit, total));
  } catch (err) {
    console.error('Get public blog error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   GET /api/public/blog/:slug
// @desc    Get single blog post by slug
// @access  Public
router.get('/blog/:slug', async (req, res) => {
  try {
    const post = await BlogPost.findOne({ 
      slug: req.params.slug,
      isPublished: true 
    }).populate('author', 'firstName lastName');
    
    if (!post) {
      return error(res, 'Blog post not found', 404);
    }
    
    // Increment views
    post.views += 1;
    await post.save();
    
    success(res, post, 'Blog post retrieved');
  } catch (err) {
    console.error('Get blog post error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   GET /api/public/regions
// @desc    Get all regions with content counts
// @access  Public
router.get('/regions', async (req, res) => {
  try {
    const regions = await Region.find({ isActive: true })
      .populate('admin', 'firstName lastName')
      .sort({ name: 1 });
    
    // Get content count for each region
    const regionsWithCount = await Promise.all(
      regions.map(async (region) => {
        const contentCount = await Content.countDocuments({
          region: region._id,
          isActive: true
        });
        
        return {
          ...region.toObject(),
          contentCount
        };
      })
    );
    
    success(res, regionsWithCount, 'Regions retrieved');
  } catch (err) {
    console.error('Get public regions error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   GET /api/public/regions/:id
// @desc    Get region details
// @access  Public
router.get('/regions/:id', async (req, res) => {
  try {
    const region = await Region.findById(req.params.id)
      .populate('admin', 'firstName lastName');
    
    if (!region || !region.isActive) {
      return error(res, 'Region not found', 404);
    }
    
    // Get content count
    const contentCount = await Content.countDocuments({
      region: region._id,
      isActive: true
    });
    
    success(res, {
      ...region.toObject(),
      contentCount
    }, 'Region retrieved');
  } catch (err) {
    console.error('Get region error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   GET /api/public/regions/:id/content
// @desc    Get content for a specific region
// @access  Public
router.get('/regions/:id/content', async (req, res) => {
  try {
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

// @route   GET /api/public/content/:id
// @desc    Get single content item
// @access  Public
router.get('/content/:id', async (req, res) => {
  try {
    const content = await Content.findOne({
      _id: req.params.id,
      isActive: true
    }).populate('createdBy', 'firstName lastName')
      .populate('region', 'name');
    
    if (!content) {
      return error(res, 'Content not found', 404);
    }
    
    // Increment view count
    content.views += 1;
    await content.save();
    
    success(res, content, 'Content retrieved');
  } catch (err) {
    console.error('Get content error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   GET /api/public/featured
// @desc    Get featured content (homepage)
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    // Get featured blog posts
    const featuredPosts = await BlogPost.find({ 
      isPublished: true, 
      isFeatured: true 
    })
      .populate('author', 'firstName lastName')
      .sort({ publishDate: -1 })
      .limit(5);
    
    // Get regions with most content
    const popularRegions = await Content.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$region', contentCount: { $sum: 1 } } },
      { $sort: { contentCount: -1 } },
      { $limit: 5 }
    ]);
    
    // Populate region details
    const regionIds = popularRegions.map(r => r._id);
    const regionDetails = await Region.find({ _id: { $in: regionIds } });
    
    const regionsWithCount = popularRegions.map(pr => ({
      ...regionDetails.find(r => r._id.toString() === pr._id.toString())?.toObject(),
      contentCount: pr.contentCount
    }));
    
    // Get latest content across all regions
    const latestContent = await Content.find({ isActive: true })
      .populate('createdBy', 'firstName lastName')
      .populate('region', 'name')
      .sort({ createdAt: -1 })
      .limit(10);
    
    success(res, {
      featuredPosts,
      popularRegions: regionsWithCount,
      latestContent
    }, 'Featured content retrieved');
  } catch (err) {
    console.error('Get featured content error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   GET /api/public/search
// @desc    Search across all content
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return error(res, 'Search query must be at least 2 characters', 400);
    }
    
    const searchRegex = new RegExp(q, 'i');
    
    // Search blog posts
    const blogResults = await BlogPost.find({
      isPublished: true,
      $or: [
        { title: searchRegex },
        { content: searchRegex },
        { excerpt: searchRegex }
      ]
    }).select('title excerpt slug type featuredImage createdAt')
      .limit(10);
    
    // Search content
    const contentResults = await Content.find({
      isActive: true,
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { content: searchRegex }
      ]
    }).populate('region', 'name')
      .select('title description type mediaUrl videoUrl createdAt region')
      .limit(10);
    
    // Search regions
    const regionResults = await Region.find({
      isActive: true,
      $or: [
        { name: searchRegex },
        { description: searchRegex }
      ]
    }).select('name description code')
      .limit(5);
    
    success(res, {
      blogPosts: blogResults,
      content: contentResults,
      regions: regionResults,
      totalResults: blogResults.length + contentResults.length + regionResults.length
    }, 'Search results retrieved');
  } catch (err) {
    console.error('Search error:', err);
    error(res, 'Server error', 500);
  }
});

module.exports = router;