/**
 * Error Handler Middleware
 * Centralized error handling for the Express.js backend
 */

import { Request, Response, NextFunction } from 'express';
import { createLogger } from '../utils/logger';

const logger = createLogger();

export interface ApiError extends Error {
  statusCode?: number;
  code?: string | undefined;
  details?: any;
  isOperational?: boolean;
}

/**
 * Create standardized API error
 */
export const createApiError = (
  message: string,
  statusCode = 500,
  code?: string,
  details?: any
): ApiError => {
  const error = new Error(message) as ApiError;
  error.statusCode = statusCode;
  error.code = code;
  error.details = details;
  error.isOperational = true;
  return error;
};

/**
 * Not Found Handler - 404 errors
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  const error = createApiError(
    `Route ${req.method} ${req.path} not found`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};

/**
 * Error Handler Middleware
 */
export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Default error values
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let code = error.code || 'INTERNAL_ERROR';

  // Handle specific error types
  if (error.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  } else if (error.name === 'UnauthorizedError' || error.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = 'UNAUTHORIZED';
    message = 'Authentication required';
  } else if (error.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = 'Invalid ID format';
  } else if (error.code === '11000') {
    statusCode = 409;
    code = 'DUPLICATE_ENTRY';
    message = 'Duplicate entry';
  }

  // Log error details
  logger.error('API Error', {
    requestId: req.requestId,
    error: {
      message: error.message,
      stack: error.stack,
      statusCode,
      code,
      details: error.details
    },
    request: {
      method: req.method,
      path: req.path,
      body: req.body,
      query: req.query,
      params: req.params,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    }
  });

  // Prepare error response
  const errorResponse: any = {
    success: false,
    error: message,
    code,
    timestamp: new Date().toISOString(),
    path: req.path,
    requestId: req.requestId
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack;
    errorResponse.details = error.details;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper
 */
export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};