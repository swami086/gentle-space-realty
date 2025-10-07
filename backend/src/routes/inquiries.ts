/**
 * Inquiries Routes
 * Handles inquiry submissions and management
 */

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/cloudSqlService';
import { asyncHandler, createApiError } from '../middleware/errorHandler';
import { validate, inquirySchemas, commonSchemas } from '../middleware/validationMiddleware';
import { requireRole } from '../middleware/authMiddleware';
import { strictRateLimit } from '../middleware/rateLimiter';
import { createLogger } from '../utils/logger';

const router = Router();
const logger = createLogger();

/**
 * Get all inquiries (admin/agent only)
 */
router.get('/',
  requireRole(['admin', 'agent']),
  asyncHandler(async (req: Request, res: Response) => {
    const filters: any = {};

    // Agents can only see inquiries assigned to them
    if (req.user!.role === 'agent') {
      filters.assigned_to = req.user!.id;
    }

    // Apply additional filters from query params
    if (req.query.status) {
      filters.status = req.query.status;
    }
    if (req.query.assigned_to && req.user!.role === 'admin') {
      filters.assigned_to = req.query.assigned_to;
    }

    const { data, error } = await DatabaseService.inquiries.getAll(filters);

    if (error) {
      logger.error('Failed to fetch inquiries', {
        requestId: req.requestId,
        error: error.message,
        userId: req.user!.id,
        filters
      });
      throw createApiError('Failed to fetch inquiries', 500, 'FETCH_FAILED');
    }

    logger.info('Inquiries fetched successfully', {
      requestId: req.requestId,
      count: data?.length || 0,
      userId: req.user!.id,
      userRole: req.user!.role
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
 * Get inquiry by ID (admin/agent only)
 */
router.get('/:id',
  requireRole(['admin', 'agent']),
  validate({ params: commonSchemas.uuidParam }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id: inquiryId } = req.params;
    
    if (!inquiryId) {
      throw createApiError('Inquiry ID is required', 400, 'MISSING_ID');
    }

    const id = inquiryId as string;
    const { data, error } = await DatabaseService.inquiries.getById(id);

    if (error) {
      logger.error('Failed to fetch inquiry', {
        requestId: req.requestId,
        inquiryId: id,
        error: error.message
      });

      if (error.code === 'PGRST116') {
        throw createApiError('Inquiry not found', 404, 'INQUIRY_NOT_FOUND');
      }

      throw createApiError('Failed to fetch inquiry', 500, 'FETCH_FAILED');
    }

    // Agents can only view inquiries assigned to them
    if (req.user!.role === 'agent' && data.assigned_to !== req.user!.id) {
      throw createApiError('You can only view inquiries assigned to you', 403, 'INSUFFICIENT_PERMISSIONS');
    }

    logger.info('Inquiry fetched successfully', {
      requestId: req.requestId,
      inquiryId: id,
      userId: req.user!.id
    });

    res.json({
      success: true,
      data
    });
  })
);

/**
 * Submit new inquiry (public with strict rate limiting)
 */
router.post('/',
  strictRateLimit, // Strict rate limiting for public submissions
  validate(inquirySchemas.create),
  asyncHandler(async (req: Request, res: Response) => {
    const inquiryData = {
      ...req.body,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      source: 'website'
    };

    // Log inquiry submission attempt
    logger.info('Inquiry submission attempt', {
      requestId: req.requestId,
      email: inquiryData.email,
      name: inquiryData.name,
      inquiry_type: inquiryData.inquiry_type,
      property_id: inquiryData.property_id,
      ip: req.ip
    });

    const { data, error } = await DatabaseService.inquiries.create(inquiryData);

    if (error) {
      logger.error('Failed to create inquiry', {
        requestId: req.requestId,
        error: error.message,
        inquiryData: {
          email: inquiryData.email,
          name: inquiryData.name,
          inquiry_type: inquiryData.inquiry_type
        }
      });
      throw createApiError('Failed to submit inquiry', 500, 'CREATE_FAILED');
    }

    // TODO: Send notification to admin/agents about new inquiry
    logger.info('Inquiry submitted successfully', {
      requestId: req.requestId,
      inquiryId: data.id,
      email: inquiryData.email,
      inquiry_type: inquiryData.inquiry_type
    });

    res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully. We will get back to you soon.',
      data: {
        id: data.id,
        status: data.status,
        created_at: data.created_at
      }
    });
  })
);

/**
 * Update inquiry (admin/agent only - agents can only update assigned inquiries)
 */
router.put('/:id',
  requireRole(['admin', 'agent']),
  validate({
    params: commonSchemas.uuidParam,
    body: inquirySchemas.update.body
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id: inquiryId } = req.params;
    
    if (!inquiryId) {
      throw createApiError('Inquiry ID is required', 400, 'MISSING_ID');
    }

    const id = inquiryId as string;

    // Check if inquiry exists and user has permission to update
    const { data: existingInquiry, error: fetchError } = await DatabaseService.inquiries.getById(id);

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw createApiError('Inquiry not found', 404, 'INQUIRY_NOT_FOUND');
      }
      throw createApiError('Failed to fetch inquiry', 500, 'FETCH_FAILED');
    }

    // Agents can only update inquiries assigned to them
    if (req.user!.role === 'agent' && existingInquiry.assigned_to !== req.user!.id) {
      throw createApiError('You can only update inquiries assigned to you', 403, 'INSUFFICIENT_PERMISSIONS');
    }

    const { data, error } = await DatabaseService.inquiries.update(id, req.body);

    if (error) {
      logger.error('Failed to update inquiry', {
        requestId: req.requestId,
        inquiryId: id,
        userId: req.user!.id,
        error: error.message
      });
      throw createApiError('Failed to update inquiry', 500, 'UPDATE_FAILED');
    }

    logger.info('Inquiry updated successfully', {
      requestId: req.requestId,
      inquiryId: id,
      userId: req.user!.id
    });

    res.json({
      success: true,
      message: 'Inquiry updated successfully',
      data
    });
  })
);

/**
 * Update inquiry status (admin/agent only)
 */
router.patch('/:id/status',
  requireRole(['admin', 'agent']),
  validate({
    params: commonSchemas.uuidParam,
    body: inquirySchemas.updateStatus.body
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id: inquiryId } = req.params;
    
    if (!inquiryId) {
      throw createApiError('Inquiry ID is required', 400, 'MISSING_ID');
    }

    const id = inquiryId as string;
    const { status, notes } = req.body;

    // Check permissions (same as update)
    const { data: existingInquiry, error: fetchError } = await DatabaseService.inquiries.getById(id);

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        throw createApiError('Inquiry not found', 404, 'INQUIRY_NOT_FOUND');
      }
      throw createApiError('Failed to fetch inquiry', 500, 'FETCH_FAILED');
    }

    if (req.user!.role === 'agent' && existingInquiry.assigned_to !== req.user!.id) {
      throw createApiError('You can only update inquiries assigned to you', 403, 'INSUFFICIENT_PERMISSIONS');
    }

    const { data, error } = await DatabaseService.inquiries.updateStatus(id, status, notes);

    if (error) {
      logger.error('Failed to update inquiry status', {
        requestId: req.requestId,
        inquiryId: id,
        status,
        userId: req.user!.id,
        error: error.message
      });
      throw createApiError('Failed to update inquiry status', 500, 'UPDATE_STATUS_FAILED');
    }

    logger.info('Inquiry status updated successfully', {
      requestId: req.requestId,
      inquiryId: id,
      status,
      userId: req.user!.id
    });

    res.json({
      success: true,
      message: 'Inquiry status updated successfully',
      data
    });
  })
);

/**
 * Assign inquiry to agent (admin only)
 */
router.patch('/:id/assign',
  requireRole('admin'),
  validate({
    params: commonSchemas.uuidParam,
    body: inquirySchemas.assign.body
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { id: inquiryId } = req.params;
    
    if (!inquiryId) {
      throw createApiError('Inquiry ID is required', 400, 'MISSING_ID');
    }

    const id = inquiryId as string;
    const { agentId } = req.body;

    // Verify the agent exists and has the correct role
    const { data: agent, error: agentError } = await DatabaseService.users.getById(agentId);

    if (agentError || !agent) {
      throw createApiError('Agent not found', 404, 'AGENT_NOT_FOUND');
    }

    if (!['agent', 'admin'].includes(agent.role)) {
      throw createApiError('User is not an agent or admin', 400, 'INVALID_AGENT_ROLE');
    }

    if (!agent.is_active) {
      throw createApiError('Agent account is not active', 400, 'AGENT_INACTIVE');
    }

    const { data, error } = await DatabaseService.inquiries.assign(id, agentId);

    if (error) {
      logger.error('Failed to assign inquiry', {
        requestId: req.requestId,
        inquiryId: id,
        agentId,
        userId: req.user!.id,
        error: error.message
      });

      if (error.code === 'PGRST116') {
        throw createApiError('Inquiry not found', 404, 'INQUIRY_NOT_FOUND');
      }

      throw createApiError('Failed to assign inquiry', 500, 'ASSIGN_FAILED');
    }

    logger.info('Inquiry assigned successfully', {
      requestId: req.requestId,
      inquiryId: id,
      agentId,
      userId: req.user!.id
    });

    res.json({
      success: true,
      message: 'Inquiry assigned successfully',
      data
    });
  })
);

export default router;