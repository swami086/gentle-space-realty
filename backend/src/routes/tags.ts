/**
 * Tags Routes
 * Handles tag CRUD operations for property categorization
 */

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/cloudSqlService';
import { asyncHandler, createApiError } from '../middleware/errorHandler';
import Joi from 'joi';
import { validate, commonSchemas } from '../middleware/validationMiddleware';
import { requireRole } from '../middleware/authMiddleware';
import { publicRateLimit } from '../middleware/rateLimiter';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger();

// Tag validation schemas
const tagSchemas = {
  create: {
    body: Joi.object({
      name: Joi.string().min(1).max(100).required(),
      color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
      backgroundColor: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
      description: Joi.string().max(500).optional().allow(''),
      isActive: Joi.boolean().default(true)
    })
  },
  update: {
    body: Joi.object({
      name: Joi.string().min(1).max(100).optional(),
      color: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
      backgroundColor: Joi.string().pattern(/^#[0-9A-F]{6}$/i).optional(),
      description: Joi.string().max(500).optional().allow(''),
      isActive: Joi.boolean().optional()
    }).min(1)
  }
};

/**
 * Get all tags (admin only)
 */
router.get('/',
  requireRole(['admin', 'agent']),
  asyncHandler(async (req: Request, res: Response) => {
    const { data, error } = await DatabaseService.tags.getAll();

    if (error) {
      logger.error('Failed to fetch all tags', {
        requestId: req.requestId,
        error: error.message,
        userId: req.user!.id
      });
      throw createApiError('Failed to fetch tags', 500, 'FETCH_FAILED');
    }

    logger.info('All tags fetched successfully', {
      requestId: req.requestId,
      count: data?.length || 0,
      userId: req.user!.id
    });

    res.json({
      success: true,
      data: data || [],
      meta: {
        total: data?.length || 0
      }
    });
  })
);

/**
 * Get active tags (public)
 */
router.get('/active',
  publicRateLimit,
  asyncHandler(async (req: Request, res: Response) => {
    const { data, error } = await DatabaseService.tags.getActive();

    if (error) {
      logger.error('Failed to fetch active tags', {
        requestId: req.requestId,
        error: error.message
      });
      throw createApiError('Failed to fetch active tags', 500, 'FETCH_FAILED');
    }

    logger.info('Active tags fetched successfully', {
      requestId: req.requestId,
      count: data?.length || 0
    });

    res.json({
      success: true,
      data: data || [],
      meta: {
        total: data?.length || 0
      }
    });
  })
);

/**
 * Get tag by ID
 */
router.get('/:id',
  requireRole(['admin', 'agent']),
  validate({ params: commonSchemas.uuidParam }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    if (!id) {
      throw createApiError('Tag ID is required', 400, 'MISSING_ID');
    }
    
    const { data, error } = await DatabaseService.tags.getById(id);

    if (error) {
      logger.error('Failed to fetch tag by ID', {
        requestId: req.requestId,
        tagId: id,
        error: error.message,
        userId: req.user!.id
      });

      if (error.message === 'Tag not found') {
        throw createApiError('Tag not found', 404, 'TAG_NOT_FOUND');
      }

      throw createApiError('Failed to fetch tag', 500, 'FETCH_FAILED');
    }

    logger.info('Tag fetched successfully', {
      requestId: req.requestId,
      tagId: id,
      userId: req.user!.id
    });

    res.json({
      success: true,
      data
    });
  })
);

/**
 * Create new tag (admin only)
 */
router.post('/',
  requireRole('admin'),
  validate(tagSchemas.create),
  asyncHandler(async (req: Request, res: Response) => {
    const tagData = req.body;

    logger.info('Tag creation attempt', {
      requestId: req.requestId,
      tagName: tagData.name,
      userId: req.user!.id
    });

    const { data, error } = await DatabaseService.tags.create(tagData);

    if (error) {
      logger.error('Failed to create tag', {
        requestId: req.requestId,
        error: error.message,
        tagData,
        userId: req.user!.id
      });
      
      if (error.message === 'Tag name already exists') {
        throw createApiError('Tag name already exists', 409, 'TAG_NAME_EXISTS');
      }
      
      throw createApiError('Failed to create tag', 500, 'CREATE_FAILED');
    }

    logger.info('Tag created successfully', {
      requestId: req.requestId,
      tagId: data.id,
      tagName: tagData.name,
      userId: req.user!.id
    });

    res.status(201).json({
      success: true,
      message: 'Tag created successfully',
      data
    });
  })
);

/**
 * Update tag (admin only)
 */
router.put('/:id',
  requireRole('admin'),
  validate({
    params: commonSchemas.uuidParam,
    ...tagSchemas.update
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    if (!id) {
      throw createApiError('Tag ID is required', 400, 'MISSING_ID');
    }

    const { data, error } = await DatabaseService.tags.update(id, req.body);

    if (error) {
      logger.error('Failed to update tag', {
        requestId: req.requestId,
        tagId: id,
        userId: req.user!.id,
        error: error.message
      });

      if (error.message === 'Tag not found') {
        throw createApiError('Tag not found', 404, 'TAG_NOT_FOUND');
      }
      
      if (error.message === 'Tag name already exists') {
        throw createApiError('Tag name already exists', 409, 'TAG_NAME_EXISTS');
      }

      throw createApiError('Failed to update tag', 500, 'UPDATE_FAILED');
    }

    logger.info('Tag updated successfully', {
      requestId: req.requestId,
      tagId: id,
      userId: req.user!.id
    });

    res.json({
      success: true,
      message: 'Tag updated successfully',
      data
    });
  })
);

/**
 * Delete tag (admin only)
 */
router.delete('/:id',
  requireRole('admin'),
  validate({ params: commonSchemas.uuidParam }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    if (!id) {
      throw createApiError('Tag ID is required', 400, 'MISSING_ID');
    }

    const { error } = await DatabaseService.tags.delete(id);

    if (error) {
      logger.error('Failed to delete tag', {
        requestId: req.requestId,
        tagId: id,
        userId: req.user!.id,
        error: error.message
      });

      if (error.message === 'Tag not found') {
        throw createApiError('Tag not found', 404, 'TAG_NOT_FOUND');
      }

      throw createApiError('Failed to delete tag', 500, 'DELETE_FAILED');
    }

    logger.info('Tag deleted successfully', {
      requestId: req.requestId,
      tagId: id,
      userId: req.user!.id
    });

    res.json({
      success: true,
      message: 'Tag deleted successfully'
    });
  })
);

export default router;