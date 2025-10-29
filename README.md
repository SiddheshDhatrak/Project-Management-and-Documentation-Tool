# Project Management and Documentation Tool

A Confluence-style rich text editor combined with Jira-style Kanban boards for collaborative project management.

## Features

- **Rich Text Editor**: Collaborative editing with real-time synchronization
- **Kanban Boards**: Drag-and-drop task management
- **Version History**: Track changes with diff comparison
- **Activity Feed**: Real-time updates on team activities
- **Multi-Project**: Switch between multiple workspaces
- **Real-time Collaboration**: See who's editing with live cursors

## Tech Stack

- **Frontend**: Next.js 14, React, TipTap Editor
- **Backend**: Next.js API Routes
- **Database**: MongoDB
- **Real-time**: WebSockets (ws)
- **UI**: Radix UI, Tailwind CSS

## Quick Start

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up MongoDB and configure `.env.local`
4. Run: `npm run dev`

See `docs/SETUP.md` for detailed setup instructions.

## Project Structure

```
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   └── page.js         # Main page
├── components/          # React components
├── lib/                # Utilities and helpers
│   ├── db.js           # MongoDB connection
│   ├── api.js          # API client
│   └── extensions/     # TipTap custom extensions
└── hooks/              # Custom React hooks
```

## Development

The project uses:
- MongoDB for data persistence
- WebSockets for real-time updates
- localStorage as fallback (when MongoDB unavailable)

For production deployment, ensure MongoDB is properly configured and consider:
- File storage service for images
- Authentication system
- Rate limiting
- Error monitoring
