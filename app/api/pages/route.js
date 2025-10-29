import { connectToDatabase, sanitizeDoc, sanitizeDocs } from '@/lib/db';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// GET /api/pages - Get pages by project
export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const pageId = searchParams.get('id');

    if (pageId) {
      const page = await db.collection('pages').findOne({ id: pageId });
      if (!page) {
        return NextResponse.json({ error: 'Page not found' }, { status: 404 });
      }
      return NextResponse.json(sanitizeDoc(page));
    }

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const pages = await db.collection('pages')
      .find({ projectId })
      .sort({ createdAt: -1 })
      .toArray();
    
    return NextResponse.json(sanitizeDocs(pages));
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
  }
}

// POST /api/pages - Create a new page
export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    
    const page = {
      id: uuidv4(),
      projectId: body.projectId,
      title: body.title,
      content: body.content || '',
      parentId: body.parentId || null,
      authorId: body.authorId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.collection('pages').insertOne(page);
    return NextResponse.json(sanitizeDoc(page), { status: 201 });
  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json({ error: 'Failed to create page' }, { status: 500 });
  }
}

// PUT /api/pages - Update a page
export async function PUT(request) {
  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
    }

    const updates = {
      ...body,
      updatedAt: Date.now(),
    };
    delete updates.id;

    const result = await db.collection('pages').findOneAndUpdate(
      { id: body.id },
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    return NextResponse.json(sanitizeDoc(result.value));
  } catch (error) {
    console.error('Error updating page:', error);
    return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
  }
}

// DELETE /api/pages - Delete a page
export async function DELETE(request) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Page ID is required' }, { status: 400 });
    }

    const result = await db.collection('pages').deleteOne({ id });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Delete related versions
    await db.collection('versions').deleteMany({ pageId: id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 });
  }
}

