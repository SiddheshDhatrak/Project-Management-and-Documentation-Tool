import { connectToDatabase, sanitizeDoc, sanitizeDocs } from '@/lib/db';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// GET /api/boards - Get boards by project
export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const boardId = searchParams.get('id');

    if (boardId) {
      const board = await db.collection('boards').findOne({ id: boardId });
      if (!board) {
        return NextResponse.json({ error: 'Board not found' }, { status: 404 });
      }
      return NextResponse.json(sanitizeDoc(board));
    }

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID is required' }, { status: 400 });
    }

    const boards = await db.collection('boards')
      .find({ projectId })
      .sort({ createdAt: -1 })
      .toArray();
    
    return NextResponse.json(sanitizeDocs(boards));
  } catch (error) {
    console.error('Error fetching boards:', error);
    return NextResponse.json({ error: 'Failed to fetch boards' }, { status: 500 });
  }
}

// POST /api/boards - Create a new board
export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    
    const board = {
      id: uuidv4(),
      projectId: body.projectId,
      name: body.name,
      columns: body.columns || [
        { id: uuidv4(), title: 'To Do', cards: [] },
        { id: uuidv4(), title: 'In Progress', cards: [] },
        { id: uuidv4(), title: 'Done', cards: [] },
      ],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await db.collection('boards').insertOne(board);
    return NextResponse.json(sanitizeDoc(board), { status: 201 });
  } catch (error) {
    console.error('Error creating board:', error);
    return NextResponse.json({ error: 'Failed to create board' }, { status: 500 });
  }
}

// PUT /api/boards - Update a board
export async function PUT(request) {
  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json({ error: 'Board ID is required' }, { status: 400 });
    }

    const updates = {
      ...body,
      updatedAt: Date.now(),
    };
    delete updates.id;

    const result = await db.collection('boards').findOneAndUpdate(
      { id: body.id },
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    return NextResponse.json(sanitizeDoc(result.value));
  } catch (error) {
    console.error('Error updating board:', error);
    return NextResponse.json({ error: 'Failed to update board' }, { status: 500 });
  }
}

// DELETE /api/boards - Delete a board
export async function DELETE(request) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Board ID is required' }, { status: 400 });
    }

    const result = await db.collection('boards').deleteOne({ id });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting board:', error);
    return NextResponse.json({ error: 'Failed to delete board' }, { status: 500 });
  }
}

