# Backend Documentation

## Overview

The backend is built using Next.js API Routes with MongoDB for data persistence. It follows RESTful principles with proper error handling, validation, and middleware.

## Architecture

```
app/api/
├── projects/     # Project CRUD operations
├── pages/        # Page CRUD operations
├── boards/       # Board CRUD operations
├── versions/     # Version history operations
├── activities/   # Activity feed operations
└── users/        # User operations

lib/
├── db.js         # MongoDB connection & utilities
├── api.js        # Frontend API client
├── validation.js # Input validation schemas
├── errors.js     # Error handling utilities
├── middleware.js # Middleware functions (CORS, auth, rate limiting)
└── auth.js       # Authentication & authorization
```

## API Endpoints

### Projects

- `GET /api/projects?userId={uuid}` - Get all projects or filter by user
- `POST /api/projects` - Create a new project
- `PUT /api/projects` - Update a project (requires id in body)
- `DELETE /api/projects?id={uuid}` - Delete a project

### Pages

- `GET /api/pages?projectId={uuid}&id={uuid}` - Get pages by project or single page
- `POST /api/pages` - Create a new page
- `PUT /api/pages` - Update a page (requires id in body)
- `DELETE /api/pages?id={uuid}` - Delete a page

### Boards

- `GET /api/boards?projectId={uuid}&id={uuid}` - Get boards by project or single board
- `POST /api/boards` - Create a new board
- `PUT /api/boards` - Update a board (requires id in body)
- `DELETE /api/boards?id={uuid}` - Delete a board

### Versions

- `GET /api/versions?pageId={uuid}` - Get versions for a page
- `POST /api/versions` - Create a new version
- `DELETE /api/versions?id={uuid}` - Delete a version

### Activities

- `GET /api/activities?projectId={uuid}&limit={number}` - Get activities for a project
- `POST /api/activities` - Create a new activity

### Users

- `GET /api/users?id={uuid}` - Get user by ID
- `POST /api/users` - Create or update a user

## Request/Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "code": "ERROR_CODE",
    "details": "Optional details"
  }
}
```

## Validation

All endpoints use Zod schemas for validation. Validation errors include detailed field-level information.

### Example Validation Error
```json
{
  "success": false,
  "error": {
    "message": "Validation error",
    "code": "VALIDATION_ERROR",
    "details": [
      {
        "path": ["name"],
        "message": "String must contain at least 1 character(s)"
      }
    ]
  }
}
```

## Authentication

Currently uses a mock authentication system that accepts `userId` as a query parameter or in request body. For production:

1. Implement JWT-based authentication
2. Add session management
3. Use middleware to verify tokens
4. Store tokens in HTTP-only cookies

## CORS

CORS is configured via environment variable:
```env
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

## Rate Limiting

Simple in-memory rate limiting:
- **Window**: 60 seconds
- **Max Requests**: 100 per window

For production, use Redis-based rate limiting.

## Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `NOT_FOUND` - Resource not found
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `CONFLICT` - Resource already exists
- `RATE_LIMIT` - Rate limit exceeded
- `DB_ERROR` - Database connection error
- `INTERNAL_ERROR` - Server error

## Database Schema

### Projects
```javascript
{
  id: UUID,
  name: String,
  description: String,
  members: [UUID],
  memberRoles: { [userId]: 'Owner'|'Admin'|'Editor'|'Viewer' },
  createdAt: Number,
  updatedAt: Number
}
```

### Pages
```javascript
{
  id: UUID,
  projectId: UUID,
  title: String,
  content: String (HTML),
  parentId: UUID | null,
  authorId: UUID,
  createdAt: Number,
  updatedAt: Number
}
```

### Boards
```javascript
{
  id: UUID,
  projectId: UUID,
  name: String,
  columns: [{
    id: UUID,
    title: String,
    cards: [Card]
  }],
  createdAt: Number,
  updatedAt: Number
}
```

### Versions
```javascript
{
  id: UUID,
  pageId: UUID,
  content: String (HTML),
  authorId: UUID,
  authorName: String,
  timestamp: Number
}
```

### Activities
```javascript
{
  id: UUID,
  type: String,
  projectId: UUID,
  userId: UUID,
  userName: String,
  resourceId: UUID | null,
  resourceName: String | null,
  details: String,
  timestamp: Number
}
```

### Users
```javascript
{
  id: UUID,
  name: String,
  color: String (hex),
  role: 'Owner'|'Admin'|'Editor'|'Viewer',
  createdAt: Number,
  updatedAt: Number
}
```

## Seeding Database

Run the seed script to populate the database with sample data:

```bash
npm run seed
```

This creates:
- 3 sample users
- 1 sample project
- 2 sample pages
- 1 sample board with cards
- Sample activities

## WebSocket Server

WebSocket server is integrated in `server.js` for real-time collaboration:
- Endpoint: `ws://localhost:3000/api/ws`
- Handles presence, cursor updates, and real-time sync

## Environment Variables

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=pm_docs
CORS_ORIGINS=http://localhost:3000
NODE_ENV=development
```

## Best Practices

1. **Always validate input** using Zod schemas
2. **Handle errors gracefully** with proper error codes
3. **Sanitize database responses** (remove MongoDB _id)
4. **Use consistent response format** (success/error)
5. **Log all errors** for debugging
6. **Use indexes** for frequently queried fields
7. **Implement pagination** for large datasets
8. **Add rate limiting** to prevent abuse

## Production Checklist

- [ ] Implement proper authentication (JWT)
- [ ] Add Redis for rate limiting
- [ ] Set up error monitoring (Sentry)
- [ ] Configure proper CORS origins
- [ ] Add request logging
- [ ] Implement database backups
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Set up CI/CD pipeline
- [ ] Configure environment-specific settings
- [ ] Add health check endpoint

