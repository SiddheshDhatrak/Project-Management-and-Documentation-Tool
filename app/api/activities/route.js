import { connectToDatabase, sanitizeDoc, sanitizeDocs } from '@/lib/db';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// GET /api/activities - Get activities by project
export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const limit = parseInt(searchParams.get('limit') || '100');

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const activities = await db.collection('activities')
      .find({ projectId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
    
    return NextResponse.json(sanitizeDocs(activities));
  } catch (error) {
    console.error('Error fetching activities:', error);
    return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 });
  }
}

// POST /api/activities - Create a new activity
export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    
    const activity = {
      id: uuidv4(),
      type: body.type,
      projectId: body.projectId,
      userId: body.userId,
      userName: body.userName,
      resourceId: body.resourceId || null,
      resourceName: body.resourceName || null,
      details: body.details || '',
      timestamp: Date.now(),
    };

    await db.collection('activities').insertOne(activity);
    
    // Keep only last 500 activities per project
    const count = await db.collection('activities').countDocuments({ projectId: body.projectId });
    if (count > 500) {
      const toDelete = await db.collection('activities')
        .find({ projectId: body.projectId })
        .sort({ timestamp: 1 })
        .limit(count - 500)
        .toArray();
      
      const idsToDelete = toDelete.map(a => a.id);
      await db.collection('activities').deleteMany({ id: { $in: idsToDelete } });
    }

    return NextResponse.json(sanitizeDoc(activity), { status: 201 });
  } catch (error) {
    console.error('Error creating activity:', error);
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}

