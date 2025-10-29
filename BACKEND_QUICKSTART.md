# Backend Quick Start Guide

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   Create `.env.local` file:
   ```env
   MONGO_URL=mongodb://localhost:27017
   DB_NAME=pm_docs
   CORS_ORIGINS=http://localhost:3000
   ```

3. **Start MongoDB**
   Make sure MongoDB is running on `localhost:27017` or update `MONGO_URL`

4. **Seed Database** (Optional)
   ```bash
   npm run seed
   ```
   This creates sample data for testing.

5. **Start Server**
   ```bash
   npm run dev
   ```

## Test the Backend

### Health Check
```bash
curl http://localhost:3000/api/health
```

### Create a Project
```bash
curl -X POST http://localhost:3000/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Project",
    "description": "Test description",
    "members": []
  }'
```

### Get Projects
```bash
curl http://localhost:3000/api/projects
```

## API Base URL
```
http://localhost:3000/api
```

## Key Endpoints
- `/api/health` - Health check
- `/api/projects` - Projects CRUD
- `/api/pages` - Pages CRUD
- `/api/boards` - Boards CRUD
- `/api/versions` - Version history
- `/api/activities` - Activity feed
- `/api/users` - User management

## Documentation
See `docs/BACKEND.md` for complete API documentation.

## Features
✅ Full CRUD operations for all entities
✅ Input validation with Zod
✅ Error handling with proper status codes
✅ Rate limiting (100 req/min)
✅ CORS support
✅ Database indexes
✅ Cascade deletes
✅ Activity auto-cleanup

