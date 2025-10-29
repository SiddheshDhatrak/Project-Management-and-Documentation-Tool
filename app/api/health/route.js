// Health check endpoint
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { handleCORS } from '@/lib/middleware';
import { successResponse, errorResponse } from '@/lib/errors';

export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    
    // Test database connection
    await db.admin().ping();
    
    // Get collection counts
    const [projects, pages, boards, users] = await Promise.all([
      db.collection('projects').countDocuments(),
      db.collection('pages').countDocuments(),
      db.collection('boards').countDocuments(),
      db.collection('users').countDocuments(),
    ]);

    return handleCORS(NextResponse.json(
      successResponse({
        status: 'healthy',
        timestamp: Date.now(),
        database: {
          connected: true,
          collections: {
            projects,
            pages,
            boards,
            users,
          },
        },
      })
    ));
  } catch (error) {
    console.error('Health check failed:', error);
    return handleCORS(NextResponse.json(
      errorResponse({
        message: 'Service unavailable',
        code: 'SERVICE_UNAVAILABLE',
      }),
      { status: 503 }
    ));
  }
}

