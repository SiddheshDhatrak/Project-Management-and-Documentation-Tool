import { connectToDatabase, sanitizeDoc, sanitizeDocs } from '@/lib/db';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { handleCORS, corsOptions, withDatabase } from '@/lib/middleware';
import { validateQuery } from '@/lib/validation';
import { successResponse, errorResponse } from '@/lib/errors';
import { z } from 'zod';

const querySchema = z.object({
  userId: z.string().uuid().optional(),
});

// GET /api/projects - Get all projects or filter by member
export async function GET(request) {
  try {
    const { db } = await connectToDatabase();
    const validation = validateQuery(querySchema)(request);
    
    if (!validation.success) {
      return handleCORS(NextResponse.json(
        errorResponse(validation.error),
        { status: 400 }
      ));
    }

    const { userId } = validation.data;
    let query = {};
    
    if (userId) {
      query = { members: userId };
    }

    const projects = await db.collection('projects')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    return handleCORS(NextResponse.json(
      successResponse(sanitizeDocs(projects))
    ));
  } catch (error) {
    console.error('Error fetching projects:', error);
    return handleCORS(NextResponse.json(
      errorResponse(error),
      { status: 500 }
    ));
  }
}

// POST /api/projects - Create a new project
export async function POST(request) {
  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    
    // Validation
    const { projectSchema } = await import('@/lib/validation');
    try {
      const validated = projectSchema.parse(body);
      
      const project = {
        id: uuidv4(),
        name: validated.name,
        description: validated.description || '',
        members: validated.members || [],
        memberRoles: {},
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // Set creator as Owner
      if (validated.members?.length > 0) {
        project.memberRoles[validated.members[0]] = 'Owner';
      }

      await db.collection('projects').insertOne(project);
      
      return handleCORS(NextResponse.json(
        successResponse(sanitizeDoc(project), 'Project created successfully'),
        { status: 201 }
      ));
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return handleCORS(NextResponse.json(
          errorResponse({
            message: 'Validation error',
            code: 'VALIDATION_ERROR',
            details: validationError.errors,
          }),
          { status: 400 }
        ));
      }
      throw validationError;
    }
  } catch (error) {
    console.error('Error creating project:', error);
    return handleCORS(NextResponse.json(
      errorResponse(error),
      { status: 500 }
    ));
  }
}

// PUT /api/projects - Update a project
export async function PUT(request) {
  try {
    const { db } = await connectToDatabase();
    const body = await request.json();
    
    if (!body.id || !body.id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return handleCORS(NextResponse.json(
        errorResponse({ message: 'Valid project ID is required', code: 'VALIDATION_ERROR' }),
        { status: 400 }
      ));
    }

    const { updateProjectSchema } = await import('@/lib/validation');
    let validated;
    try {
      validated = updateProjectSchema.parse(body);
    } catch (validationError) {
      if (validationError instanceof z.ZodError) {
        return handleCORS(NextResponse.json(
          errorResponse({
            message: 'Validation error',
            code: 'VALIDATION_ERROR',
            details: validationError.errors,
          }),
          { status: 400 }
        ));
      }
      throw validationError;
    }

    const updates = {
      ...validated,
      updatedAt: Date.now(),
    };
    delete updates.id;

    const result = await db.collection('projects').findOneAndUpdate(
      { id: body.id },
      { $set: updates },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return handleCORS(NextResponse.json(
        errorResponse({ message: 'Project not found', code: 'NOT_FOUND' }),
        { status: 404 }
      ));
    }

    return handleCORS(NextResponse.json(
      successResponse(sanitizeDoc(result.value), 'Project updated successfully')
    ));
  } catch (error) {
    console.error('Error updating project:', error);
    return handleCORS(NextResponse.json(
      errorResponse(error),
      { status: 500 }
    ));
  }
}

// DELETE /api/projects - Delete a project
export async function DELETE(request) {
  try {
    const { db } = await connectToDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id || !id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return handleCORS(NextResponse.json(
        errorResponse({ message: 'Valid project ID is required', code: 'VALIDATION_ERROR' }),
        { status: 400 }
      ));
    }

    const result = await db.collection('projects').deleteOne({ id });
    
    if (result.deletedCount === 0) {
      return handleCORS(NextResponse.json(
        errorResponse({ message: 'Project not found', code: 'NOT_FOUND' }),
        { status: 404 }
      ));
    }

    // Cascade delete related data
    await Promise.all([
      db.collection('pages').deleteMany({ projectId: id }),
      db.collection('boards').deleteMany({ projectId: id }),
      db.collection('activities').deleteMany({ projectId: id }),
      db.collection('versions').deleteMany({ pageId: { $in: await db.collection('pages').distinct('id', { projectId: id }) } }),
    ]);

    return handleCORS(NextResponse.json(
      successResponse(null, 'Project deleted successfully')
    ));
  } catch (error) {
    console.error('Error deleting project:', error);
    return handleCORS(NextResponse.json(
      errorResponse(error),
      { status: 500 }
    ));
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS(request) {
  return corsOptions(request);
}

