# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

### Login
**POST** `/auth/login`

Request:
```json
{
  "email": "yohannes@example.com",
  "password": "your-password"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "...",
      "email": "yohannes@example.com",
      "firstName": "Yohannes",
      "lastName": "Admin",
      "role": "super_admin",
      "region": null
    }
  }
}
```

### Register (with Invitation)
**POST** `/auth/register`

Request:
```json
{
  "token": "invitation-token-from-email",
  "email": "newadmin@example.com",
  "password": "secure-password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Verify Invitation Token
**GET** `/auth/verify-invitation/:token`

Response:
```json
{
  "success": true,
  "data": {
    "email": "newadmin@example.com",
    "role": "regional_admin",
    "region": {
      "name": "Tigray",
      "code": "TIG"
    }
  }
}
```

## Users (Super Admin Only)

### List Users
**GET** `/users?page=1&limit=10&role=regional_admin`

### Get User
**GET** `/users/:id`

### Change User Role
**PUT** `/users/:id/role`

Request:
```json
{
  "role": "super_admin"  // or "regional_admin"
}
```

### Change User Region
**PUT** `/users/:id/region`

Request:
```json
{
  "regionId": "region-mongodb-id"
}
```

### Activate/Deactivate User
**PUT** `/users/:id/status`

Request:
```json
{
  "isActive": false
}
```

### Delete User
**DELETE** `/users/:id`

### User Statistics
**GET** `/users/statistics/overview`

## Invitations (Super Admin Only)

### Create Invitation
**POST** `/invitations`

Request:
```json
{
  "email": "newadmin@example.com",
  "role": "regional_admin",
  "regionId": "region-mongodb-id"  // Required for regional_admin
}
```

### List Invitations
**GET** `/invitations?status=pending`

### Revoke Invitation
**DELETE** `/invitations/:id`

### Resend Invitation
**POST** `/invitations/:id/resend`

## Regions

### List Regions (Public)
**GET** `/regions`

### Get Region (Public)
**GET** `/regions/:id`

### Get Region Content (Public)
**GET** `/regions/:id/content?page=1&limit=10&type=photo`

### Update Region (Super Admin)
**PUT** `/regions/:id`

Request:
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "isActive": true
}
```

### Assign Admin (Super Admin)
**PUT** `/regions/:id/admin`

Request:
```json
{
  "adminId": "user-mongodb-id"
}
```

### Remove Admin (Super Admin)
**DELETE** `/regions/:id/admin`

## Content (Regional Admin Only)

### Create Content
**POST** `/content`

Request:
```json
{
  "title": "Sample Content",
  "description": "Description here",
  "type": "photo",  // "photo", "video", or "text"
  "content": "Main content text",
  "mediaUrl": "https://example.com/image.jpg",  // For photos
  "videoUrl": "https://youtube.com/..."  // For videos
}
```

### List Content (Own Region Only)
**GET** `/content?page=1&limit=10&type=video`

### Get Content
**GET** `/content/:id`

### Update Content
**PUT** `/content/:id`

Request:
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "content": "Updated content"
}
```

### Delete Content (Soft Delete)
**DELETE** `/content/:id`

### Restore Content
**PUT** `/content/:id/restore`

### Content Statistics
**GET** `/content/statistics/overview`

## Blog Posts (Super Admin Only)

### Create Blog Post
**POST** `/blog`

Request:
```json
{
  "title": "Blog Post Title",
  "content": "Full blog content here...",
  "excerpt": "Short excerpt",
  "type": "text",  // "text", "photo", or "video"
  "featuredImage": "https://example.com/image.jpg",
  "videoUrl": "https://youtube.com/...",
  "tags": ["news", "update"],
  "isFeatured": false,
  "isPublished": true
}
```

### List Blog Posts
**GET** `/blog?page=1&limit=10&isPublished=true&isFeatured=true`

### Get Blog Post
**GET** `/blog/:id`

### Update Blog Post
**PUT** `/blog/:id`

### Delete Blog Post
**DELETE** `/blog/:id`

### Toggle Publish
**PUT** `/blog/:id/publish`

### Toggle Featured
**PUT** `/blog/:id/featured`

### Blog Statistics
**GET** `/blog/statistics/overview`

## Public Routes (No Authentication Required)

### Get Homepage Content
**GET** `/public/featured`

Response includes:
- Featured blog posts
- Popular regions
- Latest content from all regions

### Search
**GET** `/public/search?q=search-term`

### List Published Blog Posts
**GET** `/public/blog?page=1&limit=10&featured=true`

### Get Blog Post by Slug
**GET** `/public/blog/:slug`

### List All Regions
**GET** `/public/regions`

### Get Region Content
**GET** `/public/regions/:id/content?page=1&limit=10`

### Get Single Content
**GET** `/public/content/:id`

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [  // Only for validation errors
    {
      "field": "email",
      "message": "Valid email is required"
    }
  ]
}
```

## Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (no permission)
- `404` - Not Found
- `500` - Server Error

## Headers

For authenticated requests, include:
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```