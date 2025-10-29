# Setup Guide

## Prerequisites

- Node.js 18+ 
- MongoDB (local or remote)
- npm or yarn

## Environment Variables

Create a `.env.local` file in the root directory:

```env
MONGO_URL=mongodb://localhost:27017
# Or for MongoDB Atlas:
# MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net

DB_NAME=pm_docs
CORS_ORIGINS=http://localhost:3000
```

## Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

The application will be available at `http://localhost:3000`

## Database Setup

MongoDB will automatically create the necessary collections and indexes on first connection:
- `projects`
- `pages`
- `boards`
- `versions`
- `activities`
- `users`

## Features Implemented

### Core Features
- ✅ Multi-project support with sidebar navigation
- ✅ Rich text editor with formatting toolbar
- ✅ Real-time collaboration via WebSocket
- ✅ Kanban boards with drag-and-drop
- ✅ Version history with restore capability
- ✅ Activity feed
- ✅ Page navigation tree

### Editor Features
- ✅ Bold, italic, strikethrough, code, highlight
- ✅ Headings (H1, H2, H3)
- ✅ Lists (bullet, numbered, task)
- ✅ Tables (resizable)
- ✅ Links
- ✅ Blockquotes
- ✅ Images (base64)
- ✅ Mentions (@user) - basic implementation
- ✅ Slash commands - basic implementation

### Collaboration
- ✅ Real-time WebSocket connection
- ✅ Live cursor indicators
- ✅ Collaborative editing

## Known Limitations

1. Y.js integration needs refinement for production use
2. Image uploads are stored as base64 (consider file storage service)
3. Mentions UI needs enhancement
4. Slash commands need better positioning
5. Access control is UI-only (needs backend enforcement)

## Next Steps

1. Set up proper file storage for images (S3, Cloudinary, etc.)
2. Enhance mentions with autocomplete dropdown
3. Complete Y.js synchronization
4. Add backend authentication
5. Implement proper access control middleware

