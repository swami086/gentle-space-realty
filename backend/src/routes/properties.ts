/**
 * Properties Routes
 * Handles property CRUD operations and search
 */

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/cloudSqlService';
import { asyncHandler, createApiError } from '../middleware/errorHandler';
import { validate, propertySchemas, commonSchemas } from '../middleware/validationMiddleware';
import { requireRole, optionalAuth } from '../middleware/authMiddleware';
import { publicRateLimit } from '../middleware/rateLimiter';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger();

/**
 * Get all properties (with optional filters)
 */
router.get('/',
  optionalAuth,
  publicRateLimit,
  validate({ query: propertySchemas.search.query }),
  asyncHandler(async (req: Request, res: Response) => {
    const filters = {
      status: req.query.status,
      property_type: req.query.propertyType,
      min_price: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      max_price: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      location: req.query.location,
      min_bedrooms: req.query.minBedrooms ? parseInt(req.query.minBedrooms as string) : undefined,
      max_bedrooms: req.query.maxBedrooms ? parseInt(req.query.maxBedrooms as string) : undefined,
      min_bathrooms: req.query.minBathrooms ? parseFloat(req.query.minBathrooms as string) : undefined,
      max_bathrooms: req.query.maxBathrooms ? parseFloat(req.query.maxBathrooms as string) : undefined
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters];
      }
    });

    const { data, error } = await DatabaseService.properties.getAll(filters);

    if (error) {
      logger.error('Failed to fetch properties', {
        requestId: req.requestId,
        error: error.message,
        filters
      });
      throw createApiError('Failed to fetch properties', 500, 'FETCH_FAILED');
    }

    logger.info('Properties fetched successfully', {
      requestId: req.requestId,
      count: data?.length || 0,
      filters
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
 * Search properties
 */
router.get('/search',
  optionalAuth,
  publicRateLimit,
  validate({ query: propertySchemas.search.query }),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query.q as string;
    
    if (!query || query.trim().length < 2) {
      throw createApiError('Search query must be at least 2 characters', 400, 'INVALID_QUERY');
    }

    const filters = {
      status: req.query.status,
      property_type: req.query.propertyType
    };

    const { data, error } = await DatabaseService.properties.search(query.trim(), filters);

    if (error) {
      logger.error('Property search failed', {
        requestId: req.requestId,
        query,
        error: error.message
      });
      throw createApiError('Search failed', 500, 'SEARCH_FAILED');
    }

    logger.info('Property search completed', {
      requestId: req.requestId,
      query,
      resultCount: data?.length || 0
    });

    res.json({
      success: true,
      data: data || [],
      meta: {
        query,
        total: data?.length || 0
      }
    });
  })
);

/**
 * Get property by ID
 */
router.get('/:id',
  optionalAuth,
  validate({ params: commonSchemas.uuidParam }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    if (!id) {
      throw createApiError('Property ID is required', 400, 'MISSING_ID');
    }

    const { data, error } = await DatabaseService.properties.getById(id);

    if (error) {
      logger.error('Failed to fetch property', {
        requestId: req.requestId,
        propertyId: id,
        error: error.message
      });

      if (error.code === 'PGRST116') {
        throw createApiError('Property not found', 404, 'PROPERTY_NOT_FOUND');
      }

      throw createApiError('Failed to fetch property', 500, 'FETCH_FAILED');
    }

    logger.info('Property fetched successfully', {
      requestId: req.requestId,
      propertyId: id
    });

    res.json({
      success: true,
      data
    });
  })
);

/**
 * Create new property (admin/agent only)
 */
router.post('/',
  requireRole(['admin', 'agent']),
  validate(propertySchemas.create),
  asyncHandler(async (req: Request, res: Response) => {
    const propertyData = {
      ...req.body,
      listing_agent_id: req.user!.id
    };

    const { data, error } = await DatabaseService.properties.create(propertyData);

    if (error) {
      logger.error('Failed to create property', {
        requestId: req.requestId,
        userId: req.user!.id,
        error: error.message,
        propertyData
      });
      throw createApiError('Failed to create property', 500, 'CREATE_FAILED');
    }

    logger.info('Property created successfully', {
      requestId: req.requestId,
      propertyId: data.id,
      userId: req.user!.id
    });

    res.status(201).json({
      success: true,
      message: 'Property created successfully',
      data
    });
  })
);

/**
 * Update property (admin/agent only, agents can only update their own)
 */
router.put('/:id',
  requireRole(['admin', 'agent']),
  validate({
    params: commonSchemas.uuidParam,
    body: propertySchemas.update.body
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    if (!id) {
      throw createApiError('Property ID is required', 400, 'MISSING_ID');
    }

    // Check if property exists and user has permission to update
    const { data: existingProperty, error: fetchError } = await DatabaseService.properties.getById(id);

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw createApiError('Property not found', 404, 'PROPERTY_NOT_FOUND');
      }
      throw createApiError('Failed to fetch property', 500, 'FETCH_FAILED');
    }

    // Agents can only update their own properties
    if (req.user!.role === 'agent' && existingProperty.listing_agent_id !== req.user!.id) {
      throw createApiError('You can only update your own properties', 403, 'INSUFFICIENT_PERMISSIONS');
    }

    const { data, error } = await DatabaseService.properties.update(id, req.body);

    if (error) {
      logger.error('Failed to update property', {
        requestId: req.requestId,
        propertyId: id,
        userId: req.user!.id,
        error: error.message
      });
      throw createApiError('Failed to update property', 500, 'UPDATE_FAILED');
    }

    logger.info('Property updated successfully', {
      requestId: req.requestId,
      propertyId: id,
      userId: req.user!.id
    });

    res.json({
      success: true,
      message: 'Property updated successfully',
      data
    });
  })
);

/**
 * Delete property (admin only)
 */
router.delete('/:id',
  requireRole('admin'),
  validate({ params: commonSchemas.uuidParam }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    if (!id) {
      throw createApiError('Property ID is required', 400, 'MISSING_ID');
    }

    // Check if property exists
    const { error: fetchError } = await DatabaseService.properties.getById(id);

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw createApiError('Property not found', 404, 'PROPERTY_NOT_FOUND');
      }
      throw createApiError('Failed to fetch property', 500, 'FETCH_FAILED');
    }

    const { error } = await DatabaseService.properties.delete(id);

    if (error) {
      logger.error('Failed to delete property', {
        requestId: req.requestId,
        propertyId: id,
        userId: req.user!.id,
        error: error.message
      });
      throw createApiError('Failed to delete property', 500, 'DELETE_FAILED');
    }

    logger.info('Property deleted successfully', {
      requestId: req.requestId,
      propertyId: id,
      userId: req.user!.id
    });

    res.json({
      success: true,
      message: 'Property deleted successfully'
    });
  })
);

export default router;