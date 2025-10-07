/**
 * FAQs Routes
 * Handles FAQ and FAQ categories CRUD operations
 */

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/cloudSqlService';
import { asyncHandler, createApiError } from '../middleware/errorHandler';
import { validate, commonSchemas } from '../middleware/validationMiddleware';
import { requireRole } from '../middleware/authMiddleware';
import { publicRateLimit } from '../middleware/rateLimiter';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger();

/**
 * Get all active FAQs (public)
 */
router.get('/',
  publicRateLimit,
  asyncHandler(async (req: Request, res: Response) => {
    const { data, error } = await DatabaseService.faqs.getAll();

    if (error) {
      logger.error('Failed to fetch FAQs', {
        requestId: req.requestId,
        error: error.message
      });
      throw createApiError('Failed to fetch FAQs', 500, 'FETCH_FAILED');
    }

    logger.info('FAQs fetched successfully', {
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
 * Get FAQ categories (public)
 */
router.get('/categories',
  publicRateLimit,
  asyncHandler(async (req: Request, res: Response) => {
    const { data, error } = await DatabaseService.faqCategories.getAll();

    if (error) {
      logger.error('Failed to fetch FAQ categories', {
        requestId: req.requestId,
        error: error.message
      });
      throw createApiError('Failed to fetch FAQ categories', 500, 'FETCH_FAILED');
    }

    logger.info('FAQ categories fetched successfully', {
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
 * Get FAQ by ID (public)
 */
router.get('/:id',
  publicRateLimit,
  validate({ params: commonSchemas.uuidParam }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    if (!id) {
      throw createApiError('FAQ ID is required', 400, 'MISSING_ID');
    }

    const { data, error } = await DatabaseService.faqs.getById(id);

    if (error) {
      if (error.code === 'PGRST116') {
        throw createApiError('FAQ not found', 404, 'FAQ_NOT_FOUND');
      }
      throw createApiError('Failed to fetch FAQ', 500, 'FETCH_FAILED');
    }

    res.json({
      success: true,
      data
    });
  })
);

/**
 * Create new FAQ (admin only)
 */
router.post('/',
  requireRole('admin'),
  asyncHandler(async (req: Request, res: Response) => {
    const faqData = {
      ...req.body,
      created_by: req.user!.id
    };

    const { data, error } = await DatabaseService.faqs.create(faqData);

    if (error) {
      logger.error('Failed to create FAQ', {
        requestId: req.requestId,
        error: error.message,
        userId: req.user!.id
      });
      throw createApiError('Failed to create FAQ', 500, 'CREATE_FAILED');
    }

    logger.info('FAQ created successfully', {
      requestId: req.requestId,
      faqId: data.id,
      userId: req.user!.id
    });

    res.status(201).json({
      success: true,
      message: 'FAQ created successfully',
      data
    });
  })
);

/**
 * Update FAQ (admin only)
 */
router.put('/:id',
  requireRole('admin'),
  validate({ params: commonSchemas.uuidParam }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    if (!id) {
      throw createApiError('FAQ ID is required', 400, 'MISSING_ID');
    }

    const updateData = {
      ...req.body,
      updated_by: req.user!.id
    };

    const { data, error } = await DatabaseService.faqs.update(id, updateData);

    if (error) {
      if (error.code === 'PGRST116') {
        throw createApiError('FAQ not found', 404, 'FAQ_NOT_FOUND');
      }
      throw createApiError('Failed to update FAQ', 500, 'UPDATE_FAILED');
    }

    logger.info('FAQ updated successfully', {
      requestId: req.requestId,
      faqId: id,
      userId: req.user!.id
    });

    res.json({
      success: true,
      message: 'FAQ updated successfully',
      data
    });
  })
);

/**
 * Delete FAQ (admin only)
 */
router.delete('/:id',
  requireRole('admin'),
  validate({ params: commonSchemas.uuidParam }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    if (!id) {
      throw createApiError('FAQ ID is required', 400, 'MISSING_ID');
    }

    const { error } = await DatabaseService.faqs.delete(id);

    if (error) {
      if (error.code === 'PGRST116') {
        throw createApiError('FAQ not found', 404, 'FAQ_NOT_FOUND');
      }
      throw createApiError('Failed to delete FAQ', 500, 'DELETE_FAILED');
    }

    logger.info('FAQ deleted successfully', {
      requestId: req.requestId,
      faqId: id,
      userId: req.user!.id
    });

    res.json({
      success: true,
      message: 'FAQ deleted successfully'
    });
  })
);

export default router;