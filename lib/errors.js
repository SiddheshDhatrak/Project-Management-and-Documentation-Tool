// Error handling utilities
import { NextResponse } from 'next/server';

export class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409, 'CONFLICT');
  }
}

// Error response formatter
export function errorResponse(error, requestId = null) {
  const response = {
    success: false,
    error: {
      message: error.message || 'Internal server error',
      code: error.code || 'INTERNAL_ERROR',
    },
  };

  if (error.details) {
    response.error.details = error.details;
  }

  if (requestId) {
    response.requestId = requestId;
  }

  if (process.env.NODE_ENV === 'development') {
    response.error.stack = error.stack;
  }

  return response;
}

// Success response formatter
export function successResponse(data, message = null, meta = null) {
  const response = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  if (meta) {
    response.meta = meta;
  }

  return response;
}

// Async error handler wrapper
export function asyncHandler(fn) {
  return async (request, context) => {
    try {
      return await fn(request, context);
    } catch (error) {
      console.error('API Error:', error);
      
      if (error instanceof AppError) {
        return NextResponse.json(
          errorResponse(error),
          { status: error.statusCode }
        );
      }

      return NextResponse.json(
        errorResponse(new AppError('Internal server error', 500)),
        { status: 500 }
      );
    }
  };
}

