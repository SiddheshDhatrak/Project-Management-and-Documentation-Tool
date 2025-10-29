import { connectToDatabase, sanitizeDoc, sanitizeDocs } from '@/lib/db';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// GET /api/versions - Get versions by page
export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');

    if (!pageId) {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
    }

    const versions = await db.collection('versions')
      .find({ pageId })
      .sort({ timestamp: -1 })
      .toArray();
    
    return NextResponse.json(sanitizeDocs(versions));
  } catch (error) {
    console.error('Error fetching versions:', error);
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 });
  }
}

// POST /api/versions - Create a new version
export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    
    const version = {
      id: uuidv4(),
      pageId: body.pageId,
      content: body.content,
      authorId: body.authorId,
      authorName: body.authorName,
      timestamp: Date.now(),
    };

    await db.collection('versions').insertOne(version);
    return NextResponse.json(sanitizeDoc(version), { status: 201 });
  } catch (error) {
    console.error('Error creating version:', error);
    return NextResponse.json({ error: 'Failed to create version' }, { status: 500 });
  }
}

// DELETE /api/versions - Delete a version
export async function DELETE(request) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Version ID is required' }, { status: 400 });
    }

    const result = await db.collection('versions').deleteOne({ id });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Version not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting version:', error);
    return NextResponse.json({ error: 'Failed to delete version' }, { status: 500 });
  }
}

