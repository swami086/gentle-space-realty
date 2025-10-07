/**
 * Companies Routes
 * Handles company CRUD operations for partner company management
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

// Company validation schemas
const companySchemas = {
  create: {
    body: Joi.object({
      name: Joi.string().min(1).max(100).required(),
      logo: Joi.string().uri().required(),
      website: Joi.string().uri().optional(),
      description: Joi.string().max(500).optional(),
      order: Joi.number().min(0).default(0),
      is_active: Joi.boolean().default(true)
    })
  },
  update: {
    body: Joi.object({
      name: Joi.string().min(1).max(100).optional(),
      logo: Joi.string().uri().optional(),
      website: Joi.string().uri().optional(),
      description: Joi.string().max(500).optional(),
      order: Joi.number().min(0).optional(),
      is_active: Joi.boolean().optional()
    }).min(1)
  }
};

/**
 * Get all companies (admin only)
 */
router.get('/',
  requireRole(['admin', 'agent']),
  asyncHandler(async (req: Request, res: Response) => {
    const { data, error } = await DatabaseService.companies.getAll();

    if (error) {
      logger.error('Failed to fetch all companies', {
        requestId: req.requestId,
        error: error.message,
        userId: req.user!.id
      });
      throw createApiError('Failed to fetch companies', 500, 'FETCH_FAILED');
    }

    logger.info('All companies fetched successfully', {
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
 * Get active companies (public)
 */
router.get('/active',
  publicRateLimit,
  asyncHandler(async (req: Request, res: Response) => {
    const { data, error } = await DatabaseService.companies.getActive();

    if (error) {
      logger.error('Failed to fetch active companies', {
        requestId: req.requestId,
        error: error.message
      });
      throw createApiError('Failed to fetch active companies', 500, 'FETCH_FAILED');
    }

    logger.info('Active companies fetched successfully', {
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
 * Get company by ID
 */
router.get('/:id',
  requireRole(['admin', 'agent']),
  validate({ params: commonSchemas.uuidParam }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    if (!id) {
      throw createApiError('Company ID is required', 400, 'MISSING_ID');
    }
    
    const { data, error } = await DatabaseService.companies.getById(id);

    if (error) {
      logger.error('Failed to fetch company by ID', {
        requestId: req.requestId,
        companyId: id,
        error: error.message,
        userId: req.user!.id
      });

      if (error.message === 'Company not found') {
        throw createApiError('Company not found', 404, 'COMPANY_NOT_FOUND');
      }

      throw createApiError('Failed to fetch company', 500, 'FETCH_FAILED');
    }

    logger.info('Company fetched successfully', {
      requestId: req.requestId,
      companyId: id,
      userId: req.user!.id
    });

    res.json({
      success: true,
      data
    });
  })
);

/**
 * Create new company (admin only)
 */
router.post('/',
  requireRole('admin'),
  validate(companySchemas.create),
  asyncHandler(async (req: Request, res: Response) => {
    const companyData = req.body;

    logger.info('Company creation attempt', {
      requestId: req.requestId,
      companyName: companyData.name,
      userId: req.user!.id
    });

    const { data, error } = await DatabaseService.companies.create(companyData);

    if (error) {
      logger.error('Failed to create company', {
        requestId: req.requestId,
        error: error.message,
        companyData,
        userId: req.user!.id
      });
      throw createApiError('Failed to create company', 500, 'CREATE_FAILED');
    }

    logger.info('Company created successfully', {
      requestId: req.requestId,
      companyId: data.id,
      companyName: companyData.name,
      userId: req.user!.id
    });

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data
    });
  })
);

/**
 * Update company (admin only)
 */
router.put('/:id',
  requireRole('admin'),
  validate({
    params: commonSchemas.uuidParam,
    ...companySchemas.update
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    if (!id) {
      throw createApiError('Company ID is required', 400, 'MISSING_ID');
    }

    const { data, error } = await DatabaseService.companies.update(id, req.body);

    if (error) {
      logger.error('Failed to update company', {
        requestId: req.requestId,
        companyId: id,
        userId: req.user!.id,
        error: error.message
      });

      if (error.message === 'Company not found') {
        throw createApiError('Company not found', 404, 'COMPANY_NOT_FOUND');
      }

      throw createApiError('Failed to update company', 500, 'UPDATE_FAILED');
    }

    logger.info('Company updated successfully', {
      requestId: req.requestId,
      companyId: id,
      userId: req.user!.id
    });

    res.json({
      success: true,
      message: 'Company updated successfully',
      data
    });
  })
);

/**
 * Delete company (admin only)
 */
router.delete('/:id',
  requireRole('admin'),
  validate({ params: commonSchemas.uuidParam }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    if (!id) {
      throw createApiError('Company ID is required', 400, 'MISSING_ID');
    }

    const { error } = await DatabaseService.companies.delete(id);

    if (error) {
      logger.error('Failed to delete company', {
        requestId: req.requestId,
        companyId: id,
        userId: req.user!.id,
        error: error.message
      });

      if (error.message === 'Company not found') {
        throw createApiError('Company not found', 404, 'COMPANY_NOT_FOUND');
      }

      throw createApiError('Failed to delete company', 500, 'DELETE_FAILED');
    }

    logger.info('Company deleted successfully', {
      requestId: req.requestId,
      companyId: id,
      userId: req.user!.id
    });

    res.json({
      success: true,
      message: 'Company deleted successfully'
    });
  })
);

export default router;