# Regional Admin Backend System

A complete backend system with role-based access control featuring Super Admin and Regional Admin roles, 16 regions, invitation system, and content management.

## Features

### 👤 Roles

- **Super Admin (Mr Yohannes)**: Full system access
- **Regional Admin**: Can only manage their assigned region
- **Public Users**: Read-only access, no login required

### 🌍 Regions

- 16 predefined regions
- Each Regional Admin can ONLY manage their own region
- Cannot access or modify other regions

### 📩 Invitation System

- Super Admin sends email invitations
- Invited users register via secure email link
- Email verification required
- Automatic role assignment after signup
- Region assignment for Regional Admins

### 📝 Content Management

**Regional Admin:**
- Add/Edit/Delete: Photos, Videos, Text
- Only for their assigned region
- Content visible publicly without login

**Super Admin:**
- Post blog content to homepage
- Text, Video, Photo content
- Manage all regions
- Send/Revoke invitations
- Promote/Demote users between roles
- Delete users permanently

## Tech Stack

- **Node.js** + **Express.js**
- **MongoDB** + **Mongoose**
- **JWT** Authentication
- **Nodemailer** for emails
- **bcryptjs** for password hashing
- **Express Validator** for validation
- **Multer** for file uploads

## Installation

1. **Clone and install dependencies:**
```bash
cd regional-admin-backend
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Set up MongoDB:**
   - Install MongoDB locally or use MongoDB Atlas
   - Update MONGODB_URI in .env

4. **Configure Email (SMTP):**
   - For Gmail: Enable 2FA and generate App Password
   - Update SMTP settings in .env

5. **Run the server:**
```bash
# Development
npm run dev

# Production
npm start
```

## Default Configuration

The system automatically initializes:
- 16 regions with codes and names
- Default configuration settings

## API Endpoints

### Authentication
```
POST   /api/auth/login          # Login
POST   /api/auth/register       # Register with invitation token
GET    /api/auth/verify-invitation/:token  # Verify invitation
```

### Users (Super Admin Only)
```
GET    /api/users               # List all users
GET    /api/users/:id           # Get user details
PUT    /api/users/:id/role      # Change user role
PUT    /api/users/:id/region    # Change user's region
PUT    /api/users/:id/status    # Activate/Deactivate user
DELETE /api/users/:id           # Delete user
GET    /api/users/statistics/overview  # User statistics
```

### Invitations (Super Admin Only)
```
POST   /api/invitations         # Create invitation
GET    /api/invitations         # List invitations
GET    /api/invitations/:id     # Get invitation details
DELETE /api/invitations/:id     # Revoke invitation
POST   /api/invitations/:id/resend  # Resend invitation
```

### Regions (Mixed Access)
```
GET    /api/regions             # List all regions (Public)
GET    /api/regions/:id         # Get region details (Public)
GET    /api/regions/:id/content # Get region content (Public)
PUT    /api/regions/:id         # Update region (Super Admin)
PUT    /api/regions/:id/admin   # Assign admin (Super Admin)
DELETE /api/regions/:id/admin   # Remove admin (Super Admin)
```

### Content (Regional Admin Only)
```
POST   /api/content             # Create content
GET    /api/content             # List region content
GET    /api/content/:id         # Get content details
PUT    /api/content/:id         # Update content
DELETE /api/content/:id         # Delete content
PUT    /api/content/:id/restore # Restore content
GET    /api/content/statistics/overview  # Content statistics
```

### Blog Posts (Super Admin Only)
```
POST   /api/blog                # Create blog post
GET    /api/blog                # List all posts
GET    /api/blog/:id            # Get post details
PUT    /api/blog/:id            # Update post
DELETE /api/blog/:id            # Delete post
PUT    /api/blog/:id/publish    # Toggle publish
PUT    /api/blog/:id/featured   # Toggle featured
GET    /api/blog/statistics/overview  # Blog statistics
```

### Public Routes (No Login Required)
```
GET    /api/public/blog         # Published blog posts
GET    /api/public/blog/:slug   # Single blog post
GET    /api/public/regions      # All regions with counts
GET    /api/public/regions/:id  # Region details
GET    /api/public/regions/:id/content  # Region content
GET    /api/public/content/:id  # Single content item
GET    /api/public/featured     # Homepage featured content
GET    /api/public/search?q=... # Search across content
```

## Creating the First Super Admin

To create Mr. Yohannes as the first Super Admin, run this script once:

```javascript
// create-super-admin.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User } = require('./models');

async function createSuperAdmin() {
  await mongoose.connect('mongodb://localhost:27017/regional_admin_db');
  
  const existingAdmin = await User.findOne({ role: 'super_admin' });
  if (existingAdmin) {
    console.log('Super admin already exists');
    process.exit(0);
  }
  
  const hashedPassword = await bcrypt.hash('your-secure-password', 12);
  
  const superAdmin = new User({
    email: 'yohannes@example.com',
    password: hashedPassword,
    firstName: 'Yohannes',
    lastName: 'Admin',
    role: 'super_admin',
    isEmailVerified: true,
    isActive: true
  });
  
  await superAdmin.save();
  console.log('Super admin created successfully');
  process.exit(0);
}

createSuperAdmin().catch(console.error);
```

Run: `node create-super-admin.js`

## Security Features

- JWT-based authentication
- Role-based access control
- Rate limiting
- Helmet security headers
- Input validation
- Password hashing with bcrypt
- Soft deletes for content
- Secure invitation tokens

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| MONGODB_URI | MongoDB connection string | mongodb://localhost:27017/regional_admin_db |
| JWT_SECRET | Secret key for JWT | - |
| PORT | Server port | 5000 |
| SMTP_HOST | Email server host | smtp.gmail.com |
| SMTP_USER | Email username | - |
| SMTP_PASS | Email password | - |
| FRONTEND_URL | Frontend application URL | http://localhost:3000 |
| INVITATION_EXPIRY_DAYS | Invitation expiration | 7 |
| MAX_CONTENT_PER_REGION | Max content per region | 100 |

## License

ISC