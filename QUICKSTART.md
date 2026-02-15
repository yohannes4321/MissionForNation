# Regional Admin Backend - Quick Start

## System Created! 

Your complete backend system is ready with all requested features:

### ✅ Roles Implemented
- **Super Admin** (Mr Yohannes): Full control
- **Regional Admin**: Own region only
- **Public Users**: Read-only access

### ✅ 16 Regions
All regions pre-configured and ready to use.

### ✅ Invitation System
- Email-based invitations
- Secure token-based registration
- Automatic role assignment
- Region assignment for admins

### ✅ Content Management
- **Regional Admin**: Photo, Video, Text for their region
- **Super Admin**: Blog posts for homepage + all regional content

### ✅ User Management
Super Admin can:
- Promote/demote users between roles
- Assign/change regions
- Activate/deactivate users
- Delete users permanently
- Revoke invitations

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your settings
```

### 3. Start MongoDB
Make sure MongoDB is running locally or use MongoDB Atlas

### 4. Create Super Admin
```bash
node create-super-admin.js yohannes@example.com YourPassword123 Yohannes Admin
```

Or via API (one-time only):
```bash
curl -X POST http://localhost:5000/api/auth/setup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "yohannes@example.com",
    "password": "YourPassword123",
    "firstName": "Yohannes",
    "lastName": "Admin"
  }'
```

### 5. Start Server
```bash
npm run dev
```

## Next Steps

1. **Configure Email**: Set up SMTP credentials in `.env` for invitation emails
2. **Test API**: Use the endpoints in `API.md`
3. **Build Frontend**: Connect to these API endpoints
4. **Deploy**: Use services like Railway, Render, or Heroku

## Project Structure

```
backend/
├── config/
│   └── database.js          # MongoDB connection
├── middleware/
│   ├── auth.js              # JWT authentication
│   └── validation.js        # Input validation
├── models/
│   ├── User.js              # User model
│   ├── Region.js            # Region model
│   ├── Content.js           # Content model
│   ├── Invitation.js        # Invitation model
│   ├── BlogPost.js          # Blog post model
│   └── Config.js            # Configuration model
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User management (Super Admin)
│   ├── invitations.js       # Invitation system
│   ├── regions.js           # Region management
│   ├── content.js           # Content management
│   ├── blog.js              # Blog posts (Super Admin)
│   └── public.js            # Public routes
├── utils/
│   ├── email.js             # Email service
│   ├── upload.js            # File upload
│   └── response.js          # API response helpers
├── server.js                # Main server file
├── create-super-admin.js    # Setup script
├── package.json             # Dependencies
├── .env.example             # Environment template
├── README.md                # Full documentation
└── API.md                   # API documentation
```

## API Endpoints Summary

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register with invitation
- `GET /api/auth/verify-invitation/:token` - Verify token
- `POST /api/auth/setup` - One-time Super Admin setup

### Super Admin Only
- `GET|POST|PUT|DELETE /api/users` - User management
- `GET|POST|DELETE /api/invitations` - Invitations
- `GET|POST|PUT|DELETE /api/blog` - Blog posts
- `PUT /api/regions/:id/admin` - Assign region admin

### Regional Admin Only
- `GET|POST|PUT|DELETE /api/content` - Region content

### Public (No Login)
- `GET /api/public/blog` - Published blog posts
- `GET /api/public/regions` - All regions
- `GET /api/public/regions/:id/content` - Region content
- `GET /api/public/featured` - Homepage content
- `GET /api/public/search?q=...` - Search

## Support

For detailed API documentation, see `API.md`
For full setup instructions, see `README.md`

## Security Features Included ✓

- JWT Authentication
- Role-based Access Control
- Password Hashing (bcrypt)
- Input Validation
- Rate Limiting
- Security Headers (Helmet)
- CORS Protection
- Soft Deletes

Ready to use! 🚀