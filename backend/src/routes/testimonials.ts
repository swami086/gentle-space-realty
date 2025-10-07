/**
 * Testimonials Routes
 * Handles testimonial CRUD operations and status management
 */

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/cloudSqlService';
import { asyncHandler, createApiError } from '../middleware/errorHandler';
import { validate, testimonialSchemas, commonSchemas } from '../middleware/validationMiddleware';
import { requireRole } from '../middleware/authMiddleware';
import { publicRateLimit, strictRateLimit } from '../middleware/rateLimiter';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger();

/**
 * Get approved testimonials (public)
 */
router.get('/approved',
  publicRateLimit,
  asyncHandler(async (req: Request, res: Response) => {
    const { data, error } = await DatabaseService.testimonials.getApproved();

    if (error) {
      logger.error('Failed to fetch approved testimonials', {
        requestId: req.requestId,
        error: error.message
      });
      throw createApiError('Failed to fetch testimonials', 500, 'FETCH_FAILED');
    }

    logger.info('Approved testimonials fetched successfully', {
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
 * Get all testimonials (admin/agent only)
 */
router.get('/',
  requireRole(['admin', 'agent']),
  asyncHandler(async (req: Request, res: Response) => {
    const { data, error } = await DatabaseService.testimonials.getAll();

    if (error) {
      logger.error('Failed to fetch all testimonials', {
        requestId: req.requestId,
        error: error.message,
        userId: req.user!.id
      });
      throw createApiError('Failed to fetch testimonials', 500, 'FETCH_FAILED');
    }

    logger.info('All testimonials fetched successfully', {
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
 * Get pending testimonials (admin/agent only)
 */
router.get('/pending',
  requireRole(['admin', 'agent']),
  asyncHandler(async (req: Request, res: Response) => {
    const { data, error } = await DatabaseService.testimonials.getPending();

    if (error) {
      logger.error('Failed to fetch pending testimonials', {
        requestId: req.requestId,
        error: error.message,
        userId: req.user!.id
      });
      throw createApiError('Failed to fetch pending testimonials', 500, 'FETCH_FAILED');
    }

    logger.info('Pending testimonials fetched successfully', {
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
 * Submit new testimonial (public with rate limiting)
 */
router.post('/',
  strictRateLimit, // Strict rate limiting for public submissions
  validate(testimonialSchemas.create),
  asyncHandler(async (req: Request, res: Response) => {
    const testimonialData = req.body;

    // Log submission attempt
    logger.info('Testimonial submission attempt', {
      requestId: req.requestId,
      email: testimonialData.email,
      ip: req.ip
    });

    const { data, error } = await DatabaseService.testimonials.create(testimonialData);

    if (error) {
      logger.error('Failed to create testimonial', {
        requestId: req.requestId,
        error: error.message,
        testimonialData
      });
      throw createApiError('Failed to submit testimonial', 500, 'CREATE_FAILED');
    }

    logger.info('Testimonial submitted successfully', {
      requestId: req.requestId,
      testimonialId: data.id,
      email: testimonialData.email
    });

    res.status(201).json({
      success: true,
      message: 'Testimonial submitted successfully. It will be reviewed before appearing on the website.',
      data
    });
  })
);

/**
 * Update testimonial (admin only)
 */
router.put('/:id',
  requireRole('admin'),
  validate({
    params: commonSchemas.uuidParam,
    body: testimonialSchemas.update.body
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    if (!id) {
      throw createApiError('Testimonial ID is required', 400, 'MISSING_ID');
    }

    const { data, error } = await DatabaseService.testimonials.update(id, req.body);

    if (error) {
      logger.error('Failed to update testimonial', {
        requestId: req.requestId,
        testimonialId: id,
        userId: req.user!.id,
        error: error.message
      });

      if (error.code === 'PGRST116') {
        throw createApiError('Testimonial not found', 404, 'TESTIMONIAL_NOT_FOUND');
      }

      throw createApiError('Failed to update testimonial', 500, 'UPDATE_FAILED');
    }

    logger.info('Testimonial updated successfully', {
      requestId: req.requestId,
      testimonialId: id,
      userId: req.user!.id
    });

    res.json({
      success: true,
      message: 'Testimonial updated successfully',
      data
    });
  })
);

/**
 * Update testimonial status (admin/agent only)
 */
router.patch('/:id/status',
  requireRole(['admin', 'agent']),
  validate({
    params: commonSchemas.uuidParam,
    body: testimonialSchemas.updateStatus.body
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    if (!id) {
      throw createApiError('Testimonial ID is required', 400, 'MISSING_ID');
    }
    
    const { status, reviewerId, reason } = req.body;

    // Validate reviewer is the current user
    if (reviewerId !== req.user!.id) {
      throw createApiError('You can only review testimonials as yourself', 400, 'INVALID_REVIEWER');
    }

    const { data, error } = await DatabaseService.testimonials.updateStatus(id, status, reviewerId, reason);

    if (error) {
      logger.error('Failed to update testimonial status', {
        requestId: req.requestId,
        testimonialId: id,
        status,
        reviewerId,
        error: error.message
      });

      if (error.code === 'PGRST116') {
        throw createApiError('Testimonial not found', 404, 'TESTIMONIAL_NOT_FOUND');
      }

      throw createApiError('Failed to update testimonial status', 500, 'UPDATE_STATUS_FAILED');
    }

    logger.info('Testimonial status updated successfully', {
      requestId: req.requestId,
      testimonialId: id,
      status,
      reviewerId,
      reason: reason || 'No reason provided'
    });

    res.json({
      success: true,
      message: `Testimonial ${status} successfully`,
      data
    });
  })
);

/**
 * Delete testimonial (admin only)
 */
router.delete('/:id',
  requireRole('admin'),
  validate({ params: commonSchemas.uuidParam }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    if (!id) {
      throw createApiError('Testimonial ID is required', 400, 'MISSING_ID');
    }

    const { error } = await DatabaseService.testimonials.delete(id);

    if (error) {
      logger.error('Failed to delete testimonial', {
        requestId: req.requestId,
        testimonialId: id,
        userId: req.user!.id,
        error: error.message
      });

      if (error.code === 'PGRST116') {
        throw createApiError('Testimonial not found', 404, 'TESTIMONIAL_NOT_FOUND');
      }

      throw createApiError('Failed to delete testimonial', 500, 'DELETE_FAILED');
    }

    logger.info('Testimonial deleted successfully', {
      requestId: req.requestId,
      testimonialId: id,
      userId: req.user!.id
    });

    res.json({
      success: true,
      message: 'Testimonial deleted successfully'
    });
  })
);

/**
 * Get testimonials statistics (admin/agent only)
 */
router.get('/stats',
  requireRole(['admin', 'agent']),
  asyncHandler(async (req: Request, res: Response) => {
    const { data: allTestimonials, error } = await DatabaseService.testimonials.getAll();

    if (error) {
      logger.error('Failed to fetch testimonials for stats', {
        requestId: req.requestId,
        error: error.message,
        userId: req.user!.id
      });
      throw createApiError('Failed to fetch testimonials statistics', 500, 'STATS_FETCH_FAILED');
    }

    // Calculate statistics
    const stats = {
      total: allTestimonials?.length || 0,
      approved: allTestimonials?.filter((t: any) => t.status === 'approved').length || 0,
      pending: allTestimonials?.filter((t: any) => t.status === 'pending').length || 0,
      rejected: allTestimonials?.filter((t: any) => t.status === 'rejected').length || 0,
      averageRating: 0,
      ratingDistribution: {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0
      }
    };

    // Calculate average rating and distribution from approved testimonials
    const approvedTestimonials = allTestimonials?.filter((t: any) => t.status === 'approved') || [];
    if (approvedTestimonials.length > 0) {
      const totalRating = approvedTestimonials.reduce((sum: number, t: any) => sum + (t.rating || 0), 0);
      stats.averageRating = Math.round((totalRating / approvedTestimonials.length) * 10) / 10;
      
      // Rating distribution
      approvedTestimonials.forEach((t: any) => {
        if (t.rating && t.rating >= 1 && t.rating <= 5) {
          stats.ratingDistribution[t.rating as keyof typeof stats.ratingDistribution]++;
        }
      });
    }

    logger.info('Testimonials statistics retrieved successfully', {
      requestId: req.requestId,
      userId: req.user!.id,
      stats
    });

    res.json({
      success: true,
      data: stats,
      meta: {
        generatedAt: new Date().toISOString()
      }
    });
  })
);

export default router;