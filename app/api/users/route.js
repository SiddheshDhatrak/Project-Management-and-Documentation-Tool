import { connectToDatabase, sanitizeDoc } from '@/lib/db';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// GET /api/users - Get user by ID
export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const user = await db.collection('users').findOne({ id });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(sanitizeDoc(user));
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
  }
}

// POST /api/users - Create or update a user
export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    
    // Check if user exists
    const existing = await db.collection('users').findOne({ id: body.id });
    
    if (existing) {
      // Update existing user
      const updates = {
        name: body.name,
        color: body.color,
        role: body.role,
        updatedAt: Date.now(),
      };

      const result = await db.collection('users').findOneAndUpdate(
        { id: body.id },
        { $set: updates },
        { returnDocument: 'after' }
      );

      return NextResponse.json(sanitizeDoc(result.value));
    } else {
      // Create new user
      const user = {
        id: body.id || uuidv4(),
        name: body.name,
        color: body.color || `#${Math.floor(Math.random() * 16777215).toString(16)}`,
        role: body.role || 'Editor',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await db.collection('users').insertOne(user);
      return NextResponse.json(sanitizeDoc(user), { status: 201 });
    }
  } catch (error) {
    console.error('Error creating/updating user:', error);
    return NextResponse.json({ error: 'Failed to create/update user' }, { status: 500 });
  }
}

