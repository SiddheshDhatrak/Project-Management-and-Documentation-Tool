# Backend API Summary

## Quick Reference

### Base URL
```
http://localhost:3000/api
```

### Authentication
Currently uses `userId` as query parameter or in request body. In production, use JWT tokens in Authorization header.

### Response Format
All responses follow this structure:
```json
{
  "success": true|false,
  "data": { ... },
  "error": {
    "message": "...",
    "code": "ERROR_CODE",
    "details": { ... }
  }
}
```

## Endpoints

### Health Check
- **GET** `/api/health` - Check API and database status

### Projects
- **GET** `/api/projects?userId={uuid}` - List projects
- **POST** `/api/projects` - Create project
  ```json
  {
    "name": "Project Name",
    "description": "Optional description",
    "members": ["user-uuid"]
  }
  ```
- **PUT** `/api/projects` - Update project
  ```json
  {
    "id": "project-uuid",
    "name": "New Name",
    ...
  }
  ```
- **DELETE** `/api/projects?id={uuid}` - Delete project

### Pages
- **GET** `/api/pages?projectId={uuid}` - List pages
- **GET** `/api/pages?id={uuid}` - Get single page
- **POST** `/api/pages` - Create page
  ```json
  {
    "projectId": "uuid",
    "title": "Page Title",
    "content": "<html>...</html>",
    "parentId": "uuid|null",
    "authorId": "uuid"
  }
  ```
- **PUT** `/api/pages` - Update page
- **DELETE** `/api/pages?id={uuid}` - Delete page

### Boards
- **GET** `/api/boards?projectId={uuid}` - List boards
- **POST** `/api/boards` - Create board
- **PUT** `/api/boards` - Update board
- **DELETE** `/api/boards?id={uuid}` - Delete board

### Versions
- **GET** `/api/versions?pageId={uuid}` - Get page versions
- **POST** `/api/versions` - Create version
- **DELETE** `/api/versions?id={uuid}` - Delete version

### Activities
- **GET** `/api/activities?projectId={uuid}&limit={number}` - Get activities
- **POST** `/api/activities` - Create activity

### Users
- **GET** `/api/users?id={uuid}` - Get user
- **POST** `/api/users` - Create/update user

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Input validation failed |
| `NOT_FOUND` | 404 | Resource not found |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMIT` | 429 | Too many requests |
| `DB_ERROR` | 500 | Database error |
| `INTERNAL_ERROR` | 500 | Server error |

## Example Requests

### Create Project
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Project",
    "description": "Project description",
    "members": ["user-uuid"]
  }'
```

### Get Pages
```bash
curl http://localhost:3000/api/pages?projectId=project-uuid
```

### Create Activity
```bash
curl -X POST http://localhost:3000/api/activities \
  -H "Content-Type: application/json" \
  -d '{
    "type": "page_created",
    "projectId": "project-uuid",
    "userId": "user-uuid",
    "userName": "John Doe",
    "resourceId": "page-uuid",
    "resourceName": "Page Title",
    "details": "Created page \"Page Title\""
  }'
```

