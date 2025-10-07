/**
 * Authentication Middleware
 * Handles JWT token validation and user authentication
 */

import { Request, Response, NextFunction } from 'express';
import { AuthService, DatabaseService } from '../services/cloudSqlService';
import { createApiError } from './errorHandler';
import { createLogger } from '../utils/logger';

const logger = createLogger();

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Authentication middleware
 */
export const authMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    // Enhanced debug logging for auth headers
    logger.info('Auth middleware processing request', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      hasAuthHeader: !!authHeader,
      authHeaderType: authHeader ? (authHeader.startsWith('Bearer ') ? 'Bearer' : 'Other') : 'None',
      headers: Object.keys(req.headers).filter(h => h.toLowerCase().includes('auth')),
      allHeaders: Object.keys(req.headers)
    });
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Missing or invalid auth header', {
        requestId: req.requestId,
        authHeader: authHeader ? authHeader.substring(0, 20) + '...' : 'null',
        headerKeys: Object.keys(req.headers)
      });
      throw createApiError('Authentication token required', 401, 'MISSING_TOKEN');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    if (!token) {
      logger.warn('Empty token after Bearer prefix', {
        requestId: req.requestId,
        authHeaderLength: authHeader.length
      });
      throw createApiError('Authentication token required', 401, 'MISSING_TOKEN');
    }

    // Verify Firebase ID token
    logger.info('Attempting token verification', {
      requestId: req.requestId,
      tokenLength: token.length,
      tokenPreview: token.substring(0, 30) + '...'
    });
    
    const { data: decodedToken, error } = await AuthService.verifyToken(token);

    if (error || !decodedToken) {
      logger.warn('Authentication failed', {
        requestId: req.requestId,
        error: error?.message,
        errorCode: error?.code,
        token: token.substring(0, 20) + '...',
        hasDecodedToken: !!decodedToken
      });
      throw createApiError('Invalid or expired token', 401, 'INVALID_TOKEN');
    }
    
    logger.info('Token verification successful', {
      requestId: req.requestId,
      userId: decodedToken.uid,
      email: decodedToken.email
    });

    // Get user details from database
    const { data: userData, error: userError } = await DatabaseService.users.getById(decodedToken.uid);

    if (userError || !userData) {
      logger.warn('User not found in database', {
        requestId: req.requestId,
        userId: decodedToken.uid,
        error: userError?.message
      });
      throw createApiError('User not found', 401, 'USER_NOT_FOUND');
    }

    // Type assertion for user data
    interface UserData {
      id: string;
      email: string;
      name?: string;
      role?: string;
      is_active?: boolean;
    }
    
    const typedUserData = userData as UserData;

    if (typedUserData.is_active === false) {
      throw createApiError('Account is deactivated', 401, 'ACCOUNT_DEACTIVATED');
    }

    // Attach user to request
    req.user = {
      id: typedUserData.id,
      email: typedUserData.email,
      role: typedUserData.role || 'user'
    };

    logger.info('User authenticated', {
      requestId: req.requestId,
      userId: req.user.id,
      userRole: req.user.role
    });

    next();
  } catch (error: any) {
    next(error);
  }
};

/**
 * Role-based authorization middleware that includes authentication
 */
export const requireRole = (roles: string | string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // First run authentication if user is not already set
      if (!req.user) {
        await authMiddleware(req, res, (error: any) => {
          if (error) {
            return next(error);
          }
          
          // Continue with role checking after authentication
          checkRole();
        });
      } else {
        // User already authenticated, proceed with role check
        checkRole();
      }
      
      function checkRole() {
        if (!req.user) {
          return next(createApiError('Authentication required', 401, 'AUTHENTICATION_REQUIRED'));
        }

        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        
        if (!allowedRoles.includes(req.user.role)) {
          logger.warn('Insufficient permissions', {
            requestId: req.requestId,
            userId: req.user.id,
            userRole: req.user.role,
            requiredRoles: allowedRoles
          });
          
          return next(createApiError(
            'Insufficient permissions',
            403,
            'INSUFFICIENT_PERMISSIONS'
          ));
        }

        next();
      }
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Admin role requirement
 */
export const requireAdmin = requireRole('admin');

/**
 * Agent or admin role requirement
 */
export const requireAgent = requireRole(['admin', 'agent']);

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token, continue without authentication
    }

    // Use the main auth middleware logic but don't throw on failure
    await authMiddleware(req, res, (error) => {
      if (error) {
        // Log the error but don't fail the request
        logger.info('Optional authentication failed', {
          requestId: req.requestId,
          error: error.message
        });
      }
      next(); // Continue regardless of auth success/failure
    });
  } catch (error) {
    // Log error but continue
    logger.info('Optional authentication error', {
      requestId: req.requestId,
      error: (error as Error).message
    });
    next();
  }
};