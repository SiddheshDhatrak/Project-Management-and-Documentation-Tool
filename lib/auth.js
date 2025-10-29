// Authentication and authorization utilities
import { connectToDatabase } from './db';
import { isValidUUID } from './validation';

// Get current user from request (mock implementation)
export async function getCurrentUser(request) {
  // In production, this should:
  // 1. Extract JWT token from Authorization header
  // 2. Verify and decode token
  // 3. Fetch user from database
  
  const userId = request.nextUrl.searchParams.get('userId') 
    || request.headers.get('x-user-id');
  
  if (!userId || !isValidUUID(userId)) {
    return null;
  }

  try {
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ id: userId });
    return user ? sanitizeDoc(user) : null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

// Check project membership
export async function isProjectMember(userId, projectId) {
  try {
    const { db } = await connectToDatabase();
    const project = await db.collection('projects').findOne({ id: projectId });
    return project?.members?.includes(userId) || false;
  } catch (error) {
    console.error('Error checking project membership:', error);
    return false;
  }
}

// Get user role in project
export async function getProjectRole(userId, projectId) {
  try {
    const { db } = await connectToDatabase();
    const project = await db.collection('projects').findOne({ id: projectId });
    
    if (!project || !project.members?.includes(userId)) {
      return null;
    }

    // For now, return default role
    // In production, store roles in project.memberRoles map
    return project.memberRoles?.[userId] || 'Editor';
  } catch (error) {
    console.error('Error getting project role:', error);
    return null;
  }
}

// Role hierarchy
export const ROLE_HIERARCHY = {
  Owner: 4,
  Admin: 3,
  Editor: 2,
  Viewer: 1,
};

// Check if user has required permission
export function hasPermission(userRole, requiredRole) {
  const userLevel = ROLE_HIERARCHY[userRole] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole] || 1;
  return userLevel >= requiredLevel;
}

// Sanitize document (helper)
function sanitizeDoc(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return rest;
}

