// Backend middleware utilities
import { NextResponse } from 'next/server';
import { connectToDatabase } from './db';
import { isValidUUID } from './validation';

// CORS handler
export function handleCORS(response, origin = null) {
  const allowedOrigins = process.env.CORS_ORIGINS 
    ? process.env.CORS_ORIGINS.split(',')
    : ['*'];

  const requestOrigin = origin;
  const corsOrigin = allowedOrigins.includes('*') 
    ? '*'
    : allowedOrigins.includes(requestOrigin) 
      ? requestOrigin 
      : allowedOrigins[0];

  response.headers.set('Access-Control-Allow-Origin', corsOrigin);
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Max-Age', '86400');
  
  return response;
}

// OPTIONS handler
export function corsOptions(request) {
  const response = new NextResponse(null, { status: 200 });
  return handleCORS(response, request.headers.get('origin'));
}

// Database connection middleware
export function withDatabase(handler) {
  return async (request, context) => {
    try {
      const { db } = await connectToDatabase();
      request.db = db;
      return await handler(request, context);
    } catch (error) {
      console.error('Database connection error:', error);
      return NextResponse.json(
        { success: false, error: { message: 'Database connection failed', code: 'DB_ERROR' } },
        { status: 500 }
      );
    }
  };
}

// Basic authentication middleware (mock - can be enhanced with real auth)
export function requireAuth(handler) {
  return async (request, context) => {
    // For now, we'll use a mock user ID from query/body
    // In production, this should read from JWT tokens or session
    const userId = request.nextUrl.searchParams.get('userId') 
      || (request.method !== 'GET' ? (await request.json().userId) : null);

    if (!userId || !isValidUUID(userId)) {
      return NextResponse.json(
        { success: false, error: { message: 'Authentication required', code: 'UNAUTHORIZED' } },
        { status: 401 }
      );
    }

    request.userId = userId;
    return await handler(request, context);
  };
}

// Permission check middleware
export async function checkPermission(db, userId, projectId, requiredRole = 'Viewer') {
  try {
    const project = await db.collection('projects').findOne({ id: projectId });
    if (!project) {
      return { allowed: false, reason: 'Project not found' };
    }

    // Check if user is member
    if (!project.members || !project.members.includes(userId)) {
      return { allowed: false, reason: 'Not a project member' };
    }

    // Get user role (for now, we'll assume Editor for all members)
    // In production, this should be stored in project.memberRoles map
    const role = project.memberRoles?.[userId] || 'Editor';

    const roleHierarchy = { Owner: 4, Admin: 3, Editor: 2, Viewer: 1 };
    const userLevel = roleHierarchy[role] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 1;

    return {
      allowed: userLevel >= requiredLevel,
      role,
      reason: userLevel >= requiredLevel ? null : 'Insufficient permissions',
    };
  } catch (error) {
    console.error('Permission check error:', error);
    return { allowed: false, reason: 'Permission check failed' };
  }
}

// Request logging middleware
export function logRequest(handler) {
  return async (request, context) => {
    const start = Date.now();
    const method = request.method;
    const url = request.url;
    
    console.log(`[${method}] ${url}`);
    
    try {
      const response = await handler(request, context);
      const duration = Date.now() - start;
      console.log(`[${method}] ${url} - ${response.status} (${duration}ms)`);
      return response;
    } catch (error) {
      const duration = Date.now() - start;
      console.error(`[${method}] ${url} - ERROR (${duration}ms):`, error);
      throw error;
    }
  };
}

// Rate limiting (simple in-memory - use Redis in production)
const rateLimitStore = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // requests per window

export function rateLimit(handler) {
  return async (request, context) => {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    
    const key = `${ip}-${request.method}-${request.nextUrl.pathname}`;
    const record = rateLimitStore.get(key);

    if (record) {
      if (now - record.start < RATE_LIMIT_WINDOW) {
        if (record.count >= RATE_LIMIT_MAX) {
          return NextResponse.json(
            { success: false, error: { message: 'Rate limit exceeded', code: 'RATE_LIMIT' } },
            { status: 429 }
          );
        }
        record.count++;
      } else {
        rateLimitStore.set(key, { start: now, count: 1 });
      }
    } else {
      rateLimitStore.set(key, { start: now, count: 1 });
    }

    // Clean up old entries
    if (rateLimitStore.size > 1000) {
      for (const [k, v] of rateLimitStore.entries()) {
        if (now - v.start > RATE_LIMIT_WINDOW * 2) {
          rateLimitStore.delete(k);
        }
      }
    }

    return await handler(request, context);
  };
}

