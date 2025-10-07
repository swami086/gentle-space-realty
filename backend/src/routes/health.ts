/**
 * Health Check Routes
 * System health monitoring endpoints
 */

import { Router, Request, Response } from 'express';
import { testConnection } from '../services/cloudSqlService';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

/**
 * Basic health check
 */
router.get('/', asyncHandler(async (_req: Request, res: Response) => {
  const timestamp = new Date().toISOString();
  
  res.json({
    success: true,
    status: 'healthy',
    timestamp,
    service: 'gentle-space-realty-api',
    version: '1.0.0'
  });
}));

/**
 * Detailed health check with dependencies
 */
router.get('/detailed', asyncHandler(async (_req: Request, res: Response) => {
  const timestamp = new Date().toISOString();
  const startTime = Date.now();

  // Test Supabase connection
  const supabaseHealthy = await testConnection();

  const responseTime = Date.now() - startTime;

  res.json({
    success: true,
    status: 'healthy',
    timestamp,
    responseTime: `${responseTime}ms`,
    service: 'gentle-space-realty-api',
    version: '1.0.0',
    dependencies: {
      supabase: {
        status: supabaseHealthy ? 'healthy' : 'unhealthy',
        responseTime: `${responseTime}ms`
      }
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: `${Math.floor(process.uptime())}s`,
      memory: {
        used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
      }
    }
  });
}));

/**
 * Clear rate limit cache (development only) - DISABLED
 * Rate limiting has been completely disabled
 */
router.post('/clear-rate-limit', asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Rate limiting is disabled - no cache to clear',
    timestamp: new Date().toISOString()
  });
}));

export default router;