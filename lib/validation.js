// Input validation utilities
import { z } from 'zod';

// Project validation schemas
export const projectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  members: z.array(z.string()).default([]),
});

export const updateProjectSchema = projectSchema.partial();

// Page validation schemas
export const pageSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1).max(200),
  content: z.string().default(''),
  parentId: z.string().uuid().nullable().optional(),
  authorId: z.string().uuid(),
});

export const updatePageSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
  parentId: z.string().uuid().nullable().optional(),
});

// Board validation schemas
export const boardSchema = z.object({
  projectId: z.string().uuid(),
  name: z.string().min(1).max(100),
  columns: z.array(z.object({
    id: z.string().uuid(),
    title: z.string().min(1).max(50),
    cards: z.array(z.any()).default([]),
  })).optional(),
});

export const updateBoardSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  columns: z.array(z.any()).optional(),
});

// Version validation schemas
export const versionSchema = z.object({
  pageId: z.string().uuid(),
  content: z.string(),
  authorId: z.string().uuid(),
  authorName: z.string().min(1),
});

// Activity validation schemas
export const activitySchema = z.object({
  type: z.enum([
    'page_created',
    'page_updated',
    'page_deleted',
    'board_created',
    'card_created',
    'card_moved',
    'card_deleted',
    'card_updated',
    'version_restored',
    'project_created',
    'project_updated',
  ]),
  projectId: z.string().uuid(),
  userId: z.string().uuid(),
  userName: z.string().min(1),
  resourceId: z.string().uuid().nullable().optional(),
  resourceName: z.string().nullable().optional(),
  details: z.string().default(''),
});

// User validation schemas
export const userSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
  role: z.enum(['Owner', 'Admin', 'Editor', 'Viewer']).default('Editor'),
});

// Card validation schemas
export const cardSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  labels: z.array(z.string()).default([]),
  assignee: z.string().uuid().nullable().optional(),
  dueDate: z.number().nullable().optional(),
  linkedPageId: z.string().uuid().nullable().optional(),
});

// Validation middleware
export function validateBody(schema) {
  return async (request) => {
    try {
      const body = await request.json();
      const validated = schema.parse(body);
      return { success: true, data: validated, error: null };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          data: null,
          error: {
            message: 'Validation error',
            details: error.errors,
          },
        };
      }
      return {
        success: false,
        data: null,
        error: {
          message: 'Invalid request body',
          details: error.message,
        },
      };
    }
  };
}

// Query parameter validation
export function validateQuery(schema) {
  return (request) => {
    try {
      const { searchParams } = new URL(request.url);
      const params = Object.fromEntries(searchParams.entries());
      const validated = schema.parse(params);
      return { success: true, data: validated, error: null };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          data: null,
          error: {
            message: 'Invalid query parameters',
            details: error.errors,
          },
        };
      }
      return {
        success: false,
        data: null,
        error: {
          message: 'Invalid query parameters',
          details: error.message,
        },
      };
    }
  };
}

// UUID validation helper
export function isValidUUID(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

