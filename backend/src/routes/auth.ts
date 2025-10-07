/**
 * Authentication Routes
 * Handles user authentication, registration, and session management
 */

import { Router, Request, Response } from 'express';
import { AuthService, DatabaseService } from '../services/cloudSqlService';
import { asyncHandler, createApiError } from '../middleware/errorHandler';
import { validate } from '../middleware/validationMiddleware';
import { authRateLimit } from '../middleware/rateLimiter';
import { authMiddleware } from '../middleware/authMiddleware';
import { createLogger } from '../utils/logger';
import Joi from 'joi';

const router = Router();
const logger = createLogger();

/**
 * Get login status (for frontend checks)
 */
router.get('/login', (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Login endpoint available - use POST method',
    methods: ['POST']
  });
});

/**
 * Verify Firebase ID token and get user profile
 */
router.post('/login', 
  authRateLimit,
  validate({
    body: Joi.object({
      idToken: Joi.string().required()
    })
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { idToken } = req.body;

    logger.info('Token verification attempt', { 
      requestId: req.requestId,
      ip: req.ip 
    });

    // Verify Firebase ID token
    const { data: decodedToken, error } = await AuthService.verifyToken(idToken);

    if (error || !decodedToken) {
      logger.warn('Token verification failed', {
        requestId: req.requestId,
        error: error?.message,
        ip: req.ip
      });

      throw createApiError('Invalid or expired token', 401, 'INVALID_TOKEN');
    }

    // Get or create user details in database
    let { data: userData, error: userError } = await DatabaseService.users.getById(decodedToken.uid);

    if (userError || !userData) {
      // User doesn't exist with Firebase UID, check if user exists by email
      const { data: existingUsers } = await DatabaseService.users.getAll({ email: decodedToken.email });
      
      if (existingUsers && Array.isArray(existingUsers) && existingUsers.length > 0) {
        // User exists with same email but different ID (old UUID format)
        // Migrate to Firebase UID by recreating the user
        const existingUser = existingUsers[0];
        
        logger.info('Migrating existing user to Firebase UID', {
          requestId: req.requestId,
          oldId: existingUser.id,
          newId: decodedToken.uid,
          email: decodedToken.email
        });

        // Delete old user and create new one with Firebase UID, preserving important data
        await DatabaseService.users.delete(existingUser.id);
        
        const { data: newUser, error: createError } = await DatabaseService.users.create({
          id: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name || existingUser.name || decodedToken.email?.split('@')[0] || 'User',
          role: existingUser.role || 'user', // Preserve existing role
          is_active: existingUser.is_active !== false
        });

        if (createError || !newUser) {
          logger.error('Failed to migrate user to Firebase UID', {
            requestId: req.requestId,
            userId: decodedToken.uid,
            error: createError?.message
          });
          throw createApiError('Failed to migrate user account', 500, 'USER_MIGRATION_FAILED');
        }

        userData = newUser;
        
        logger.info('User migration completed successfully', {
          requestId: req.requestId,
          userId: userData.id,
          email: userData.email,
          role: userData.role
        });
      } else {
        // User doesn't exist at all, create them
        const { data: newUser, error: createError } = await DatabaseService.users.create({
          id: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
          role: 'user',
          is_active: true
        });

        if (createError || !newUser) {
          logger.error('Failed to create user record', {
            requestId: req.requestId,
            userId: decodedToken.uid,
            error: createError?.message
          });
          throw createApiError('Failed to create user account', 500, 'USER_CREATION_FAILED');
        }

        userData = newUser;
      }
    }

    if (!userData.is_active) {
      logger.warn('Login attempt with deactivated account', {
        requestId: req.requestId,
        userId: userData.id,
        email: userData.email
      });

      throw createApiError('Account is deactivated', 401, 'ACCOUNT_DEACTIVATED');
    }

    // Update last login
    await DatabaseService.users.update(userData.id, { last_login: new Date().toISOString() });

    logger.info('Login successful', {
      requestId: req.requestId,
      userId: userData.id,
      userRole: userData.role
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        tokenValid: true
      }
    });
  })
);

/**
 * Register new user (Firebase handles registration on client-side)
 * This endpoint creates the user record in the database after Firebase registration
 */
router.post('/register',
  authRateLimit,
  validate({
    body: Joi.object({
      idToken: Joi.string().required(),
      name: Joi.string().min(2).max(100).optional()
    })
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { idToken, name } = req.body;

    logger.info('Registration attempt', {
      requestId: req.requestId,
      ip: req.ip
    });

    // Verify Firebase ID token
    const { data: decodedToken, error } = await AuthService.verifyToken(idToken);

    if (error || !decodedToken) {
      logger.warn('Registration token verification failed', {
        requestId: req.requestId,
        error: error?.message
      });

      throw createApiError('Invalid registration token', 401, 'INVALID_TOKEN');
    }

    // Check if user already exists
    const { data: existingUser } = await DatabaseService.users.getById(decodedToken.uid);

    if (existingUser) {
      throw createApiError('User already registered', 409, 'USER_EXISTS');
    }

    // Create user record in database
    const { data: userData, error: userError } = await DatabaseService.users.create({
      id: decodedToken.uid,
      email: decodedToken.email || '',
      name: name?.trim() || decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
      role: 'user',
      is_active: true
    });

    if (userError || !userData) {
      logger.error('Failed to create user record', {
        requestId: req.requestId,
        userId: decodedToken.uid,
        error: userError?.message
      });
      
      throw createApiError('Registration failed. Please try again.', 500, 'USER_CREATION_FAILED');
    }

    logger.info('Registration successful', {
      requestId: req.requestId,
      userId: userData.id,
      email: userData.email
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful.',
      data: {
        user: userData
      }
    });
  })
);

/**
 * Verify current token (Firebase tokens are automatically refreshed client-side)
 */
router.post('/refresh',
  validate({
    body: Joi.object({
      idToken: Joi.string().required()
    })
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { idToken } = req.body;

    const { data: decodedToken, error } = await AuthService.verifyToken(idToken);

    if (error || !decodedToken) {
      logger.warn('Token verification failed', {
        requestId: req.requestId,
        error: error?.message
      });

      throw createApiError('Invalid or expired token', 401, 'INVALID_TOKEN');
    }

    logger.info('Token verified successfully', {
      requestId: req.requestId,
      userId: decodedToken.uid
    });

    res.json({
      success: true,
      message: 'Token verified successfully',
      data: {
        tokenValid: true,
        userId: decodedToken.uid,
        email: decodedToken.email
      }
    });
  })
);

/**
 * Logout user (Firebase handles logout client-side)
 */
router.post('/logout',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    // Firebase logout is handled client-side
    // This endpoint just confirms logout success

    logger.info('User logged out', {
      requestId: req.requestId,
      userId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Logout successful'
    });
  })
);

/**
 * Get current user profile
 */
router.get('/me',
  authMiddleware,
  asyncHandler(async (req: Request, res: Response) => {
    const { data: userData, error } = await DatabaseService.users.getById(req.user!.id);

    if (error || !userData) {
      throw createApiError('User not found', 404, 'USER_NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        user: userData
      }
    });
  })
);

/**
 * Update user profile
 */
router.patch('/profile',
  authMiddleware,
  validate({
    body: Joi.object({
      name: Joi.string().min(2).max(100).optional()
    })
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.body;
    const updates: any = {};

    if (name) updates.name = name.trim();

    if (Object.keys(updates).length === 0) {
      throw createApiError('No valid updates provided', 400, 'NO_UPDATES');
    }

    const { data: userData, error } = await DatabaseService.users.update(req.user!.id, {
      ...updates,
      updated_at: new Date().toISOString()
    });

    if (error || !userData) {
      throw createApiError('Failed to update profile', 500, 'UPDATE_FAILED');
    }

    logger.info('Profile updated', {
      requestId: req.requestId,
      userId: req.user!.id,
      updates
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: userData
      }
    });
  })
);

export default router;