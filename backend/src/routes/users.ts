/**
 * Users Routes
 * Handles user management operations (admin only)
 */

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/cloudSqlService';
import { asyncHandler, createApiError } from '../middleware/errorHandler';
import { validate, userSchemas, commonSchemas } from '../middleware/validationMiddleware';
import { requireRole } from '../middleware/authMiddleware';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger();

/**
 * Get all users (admin only)
 */
router.get('/',
  requireRole('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const filters: any = {};

    // Apply filters from query params
    if (req.query.role) {
      filters.role = req.query.role;
    }
    if (req.query.is_active !== undefined) {
      filters.is_active = req.query.is_active === 'true';
    }

    const { data, error } = await DatabaseService.users.getAll(filters);

    if (error) {
      logger.error('Failed to fetch users', {
        requestId: req.requestId,
        error: error.message,
        userId: req.user!.id,
        filters
      });
      throw createApiError('Failed to fetch users', 500, 'FETCH_FAILED');
    }

    logger.info('Users fetched successfully', {
      requestId: req.requestId,
      count: data?.length || 0,
      userId: req.user!.id,
      filters
    });

    res.json({
      success: true,
      data: data || [],
      meta: {
        total: data?.length || 0,
        filters
      }
    });
  })
);

/**
 * Get user by ID (admin only)
 */
router.get('/:id',
  requireRole('admin'),
  validate({ params: commonSchemas.uuidParam }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    if (!id) {
      throw createApiError('User ID is required', 400, 'MISSING_ID');
    }

    const { data, error } = await DatabaseService.users.getById(id);

    if (error) {
      logger.error('Failed to fetch user', {
        requestId: req.requestId,
        targetUserId: id,
        error: error.message,
        userId: req.user!.id
      });

      if (error.code === 'PGRST116') {
        throw createApiError('User not found', 404, 'USER_NOT_FOUND');
      }

      throw createApiError('Failed to fetch user', 500, 'FETCH_FAILED');
    }

    logger.info('User fetched successfully', {
      requestId: req.requestId,
      targetUserId: id,
      userId: req.user!.id
    });

    res.json({
      success: true,
      data
    });
  })
);

/**
 * Create new user (admin only)
 */
router.post('/',
  requireRole('admin'),
  validate(userSchemas.create),
  asyncHandler(async (req: Request, res: Response) => {
    const userData = req.body;

    logger.info('User creation attempt', {
      requestId: req.requestId,
      targetUserEmail: userData.email,
      targetUserRole: userData.role,
      userId: req.user!.id
    });

    const { data, error } = await DatabaseService.users.create(userData);

    if (error) {
      logger.error('Failed to create user', {
        requestId: req.requestId,
        error: error.message,
        userData: {
          email: userData.email,
          name: userData.name,
          role: userData.role
        },
        userId: req.user!.id
      });

      if (error.code === '23505') { // Unique constraint violation
        throw createApiError('User with this email already exists', 409, 'EMAIL_EXISTS');
      }

      throw createApiError('Failed to create user', 500, 'CREATE_FAILED');
    }

    logger.info('User created successfully', {
      requestId: req.requestId,
      targetUserId: data.id,
      targetUserEmail: data.email,
      targetUserRole: data.role,
      userId: req.user!.id
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data
    });
  })
);

/**
 * Update user (admin only)
 */
router.put('/:id',
  requireRole('admin'),
  validate({
    params: commonSchemas.uuidParam,
    body: userSchemas.update.body
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id: userId } = req.params;
    
    if (!userId) {
      throw createApiError('User ID is required', 400, 'MISSING_ID');
    }

    const id = userId as string;

    // Prevent admin from deactivating themselves
    if (id === req.user!.id && req.body.is_active === false) {
      throw createApiError('You cannot deactivate your own account', 400, 'CANNOT_DEACTIVATE_SELF');
    }

    const { data, error } = await DatabaseService.users.update(id, req.body);

    if (error) {
      logger.error('Failed to update user', {
        requestId: req.requestId,
        targetUserId: id,
        userId: req.user!.id,
        error: error.message
      });

      if (error.code === 'PGRST116') {
        throw createApiError('User not found', 404, 'USER_NOT_FOUND');
      }

      if (error.code === '23505') {
        throw createApiError('Email already exists', 409, 'EMAIL_EXISTS');
      }

      throw createApiError('Failed to update user', 500, 'UPDATE_FAILED');
    }

    logger.info('User updated successfully', {
      requestId: req.requestId,
      targetUserId: id,
      userId: req.user!.id
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data
    });
  })
);

/**
 * Update user role (admin only)
 */
router.patch('/:id/role',
  requireRole('admin'),
  validate({
    params: commonSchemas.uuidParam,
    body: userSchemas.updateRole.body
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id: userId } = req.params;
    
    if (!userId) {
      throw createApiError('User ID is required', 400, 'MISSING_ID');
    }

    const id = userId as string;
    const { role } = req.body;

    // Prevent admin from demoting themselves if they're the last admin
    if (id === req.user!.id && role !== 'admin') {
      // Check if there are other admins
      const { data: admins, error: adminError } = await DatabaseService.users.getAll({ role: 'admin' });
      
      if (adminError || !admins || admins.length <= 1) {
        throw createApiError('You cannot change your role as the last admin', 400, 'LAST_ADMIN_PROTECTION');
      }
    }

    const { data, error } = await DatabaseService.users.updateRole(id, role, req.user!.id);

    if (error) {
      logger.error('Failed to update user role', {
        requestId: req.requestId,
        targetUserId: id,
        newRole: role,
        userId: req.user!.id,
        error: error.message
      });

      if (error.code === 'PGRST116') {
        throw createApiError('User not found', 404, 'USER_NOT_FOUND');
      }

      throw createApiError('Failed to update user role', 500, 'UPDATE_ROLE_FAILED');
    }

    logger.info('User role updated successfully', {
      requestId: req.requestId,
      targetUserId: id,
      newRole: role,
      userId: req.user!.id
    });

    res.json({
      success: true,
      message: 'User role updated successfully',
      data
    });
  })
);

/**
 * Delete user (admin only)
 */
router.delete('/:id',
  requireRole('admin'),
  validate({ params: commonSchemas.uuidParam }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id: userId } = req.params;
    
    if (!userId) {
      throw createApiError('User ID is required', 400, 'MISSING_ID');
    }

    const id = userId as string;

    // Prevent admin from deleting themselves
    if (id === req.user!.id) {
      throw createApiError('You cannot delete your own account', 400, 'CANNOT_DELETE_SELF');
    }

    // Check if user exists first
    const { data: existingUser, error: fetchError } = await DatabaseService.users.getById(id);

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw createApiError('User not found', 404, 'USER_NOT_FOUND');
      }
      throw createApiError('Failed to fetch user', 500, 'FETCH_FAILED');
    }

    // Prevent deleting the last admin
    if (existingUser.role === 'admin') {
      const { data: admins, error: adminError } = await DatabaseService.users.getAll({ role: 'admin' });
      
      if (adminError || !admins || admins.length <= 1) {
        throw createApiError('Cannot delete the last admin user', 400, 'LAST_ADMIN_PROTECTION');
      }
    }

    const { error } = await DatabaseService.users.delete(id);

    if (error) {
      logger.error('Failed to delete user', {
        requestId: req.requestId,
        targetUserId: id,
        userId: req.user!.id,
        error: error.message
      });
      throw createApiError('Failed to delete user', 500, 'DELETE_FAILED');
    }

    logger.info('User deleted successfully', {
      requestId: req.requestId,
      targetUserId: id,
      deletedUserEmail: existingUser.email,
      deletedUserRole: existingUser.role,
      userId: req.user!.id
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  })
);

export default router;