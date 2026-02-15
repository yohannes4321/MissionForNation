const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { Invitation, User, Region } = require('../models');
const { authenticate, requireSuperAdmin } = require('../middleware/auth');
const { invitationValidations } = require('../middleware/validation');
const { success, error, getPagination, createPaginationMeta } = require('../utils/response');
const { sendInvitationEmail } = require('../utils/email');

// All routes require authentication and Super Admin privileges
router.use(authenticate);
router.use(requireSuperAdmin);

// @route   POST /api/invitations
// @desc    Create new invitation
// @access  Super Admin
router.post('/', invitationValidations.create, async (req, res) => {
  try {
    const { email, role, regionId } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return error(res, 'User with this email already exists', 400);
    }
    
    // Check if there's a pending invitation
    const existingInvitation = await Invitation.findOne({
      email: email.toLowerCase(),
      status: 'pending'
    });
    
    if (existingInvitation) {
      return error(res, 'Pending invitation already exists for this email', 400);
    }
    
    // Validate region for regional_admin
    let region = null;
    if (role === 'regional_admin') {
      if (!regionId) {
        return error(res, 'Region is required for regional admin', 400);
      }
      region = await Region.findById(regionId);
      if (!region) {
        return error(res, 'Invalid region', 400);
      }
      
      // Check if region already has an admin
      if (region.admin) {
        return error(res, 'This region already has an assigned admin', 400);
      }
    }
    
    // Create invitation
    const token = uuidv4();
    const expiryDays = parseInt(process.env.INVITATION_EXPIRY_DAYS) || 7;
    
    const invitation = new Invitation({
      email: email.toLowerCase(),
      token,
      role,
      region: regionId || null,
      invitedBy: req.user._id,
      expiresAt: new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
    });
    
    await invitation.save();
    
    // Send email
    const emailResult = await sendInvitationEmail(
      email,
      token,
      role,
      region ? region.name : null
    );
    
    success(res, {
      invitation: {
        id: invitation._id,
        email: invitation.email,
        role: invitation.role,
        region: region,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
        emailSent: emailResult.success
      }
    }, 'Invitation sent successfully', 201);
  } catch (err) {
    console.error('Create invitation error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   GET /api/invitations
// @desc    Get all invitations
// @access  Super Admin
router.get('/', async (req, res) => {
  try {
    const { page, limit, skip } = getPagination(req);
    const { status } = req.query;
    
    const query = {};
    if (status) query.status = status;
    
    const invitations = await Invitation.find(query)
      .populate('region', 'name code')
      .populate('invitedBy', 'firstName lastName email')
      .populate('revokedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Invitation.countDocuments(query);
    
    success(res, invitations, 'Invitations retrieved', 200, createPaginationMeta(page, limit, total));
  } catch (err) {
    console.error('Get invitations error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   GET /api/invitations/:id
// @desc    Get single invitation
// @access  Super Admin
router.get('/:id', async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id)
      .populate('region', 'name code')
      .populate('invitedBy', 'firstName lastName email')
      .populate('revokedBy', 'firstName lastName email');
    
    if (!invitation) {
      return error(res, 'Invitation not found', 404);
    }
    
    success(res, invitation, 'Invitation retrieved');
  } catch (err) {
    console.error('Get invitation error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   DELETE /api/invitations/:id
// @desc    Revoke invitation
// @access  Super Admin
router.delete('/:id', async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id);
    
    if (!invitation) {
      return error(res, 'Invitation not found', 404);
    }
    
    if (invitation.status !== 'pending') {
      return error(res, 'Can only revoke pending invitations', 400);
    }
    
    invitation.status = 'revoked';
    invitation.revokedAt = new Date();
    invitation.revokedBy = req.user._id;
    await invitation.save();
    
    success(res, null, 'Invitation revoked successfully');
  } catch (err) {
    console.error('Revoke invitation error:', err);
    error(res, 'Server error', 500);
  }
});

// @route   POST /api/invitations/:id/resend
// @desc    Resend invitation
// @access  Super Admin
router.post('/:id/resend', async (req, res) => {
  try {
    const invitation = await Invitation.findById(req.params.id).populate('region');
    
    if (!invitation) {
      return error(res, 'Invitation not found', 404);
    }
    
    // Generate new token and extend expiry
    const token = uuidv4();
    const expiryDays = parseInt(process.env.INVITATION_EXPIRY_DAYS) || 7;
    
    invitation.token = token;
    invitation.expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
    invitation.status = 'pending';
    invitation.revokedAt = null;
    invitation.revokedBy = null;
    await invitation.save();
    
    // Send email
    const emailResult = await sendInvitationEmail(
      invitation.email,
      token,
      invitation.role,
      invitation.region ? invitation.region.name : null
    );
    
    success(res, {
      emailSent: emailResult.success
    }, 'Invitation resent successfully');
  } catch (err) {
    console.error('Resend invitation error:', err);
    error(res, 'Server error', 500);
  }
});

module.exports = router;