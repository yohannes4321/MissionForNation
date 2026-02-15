const { body, validationResult } = require('express-validator');

// Validation middleware
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  };
};

// Common validation rules
const validators = {
  email: body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  password: body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  name: (field) => body(field)
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage(`${field} must be between 2 and 50 characters`),
  
  regionId: body('regionId')
    .isMongoId()
    .withMessage('Valid region ID is required'),
  
  role: body('role')
    .isIn(['super_admin', 'regional_admin'])
    .withMessage('Role must be either super_admin or regional_admin'),
  
  contentType: body('type')
    .isIn(['photo', 'video', 'text'])
    .withMessage('Type must be photo, video, or text'),
  
  title: body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  
  content: body('content')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Content is required')
};

// Predefined validation sets
const authValidations = {
  login: validate([
    validators.email,
    body('password').notEmpty().withMessage('Password is required')
  ]),
  
  register: validate([
    validators.email,
    validators.password,
    validators.name('firstName'),
    validators.name('lastName'),
    body('token').notEmpty().withMessage('Invitation token is required')
  ]),
  
  changePassword: validate([
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    validators.password
  ])
};

const invitationValidations = {
  create: validate([
    validators.email,
    validators.role,
    body('regionId')
      .if(body('role').equals('regional_admin'))
      .isMongoId()
      .withMessage('Region ID is required for regional admins')
  ]),
  
  verify: validate([
    body('token').notEmpty().withMessage('Token is required')
  ])
};

const contentValidations = {
  create: validate([
    validators.title,
    validators.content,
    validators.contentType,
    body('description').optional().trim(),
    body('mediaUrl').optional().isURL().withMessage('Media URL must be valid'),
    body('videoUrl').optional().isURL().withMessage('Video URL must be valid')
  ]),
  
  update: validate([
    body('title').optional().trim().isLength({ min: 3, max: 200 }),
    body('content').optional().trim(),
    body('description').optional().trim(),
    body('mediaUrl').optional().isURL(),
    body('videoUrl').optional().isURL()
  ])
};

const blogValidations = {
  create: validate([
    validators.title,
    body('content').trim().isLength({ min: 10 }).withMessage('Content must be at least 10 characters'),
    body('excerpt').optional().trim(),
    body('type').optional().isIn(['text', 'photo', 'video']),
    body('featuredImage').optional().isURL(),
    body('videoUrl').optional().isURL(),
    body('tags').optional().isArray(),
    body('isFeatured').optional().isBoolean(),
    body('isPublished').optional().isBoolean()
  ]),
  
  update: validate([
    body('title').optional().trim().isLength({ min: 3, max: 200 }),
    body('content').optional().trim().isLength({ min: 10 }),
    body('excerpt').optional().trim(),
    body('featuredImage').optional().isURL(),
    body('videoUrl').optional().isURL(),
    body('tags').optional().isArray(),
    body('isFeatured').optional().isBoolean(),
    body('isPublished').optional().isBoolean()
  ])
};

module.exports = {
  validate,
  validators,
  authValidations,
  invitationValidations,
  contentValidations,
  blogValidations
};