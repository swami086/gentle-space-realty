/**
 * Rate Limiting Middleware
 * Currently disabled - provides no-op middleware for API endpoints
 */

/**
 * Rate limiting implementation - COMPLETELY DISABLED
 * All rate limiting functions have been disabled as requested
 */

/**
 * Default rate limiting middleware - DISABLED
 * Rate limiting completely disabled for testing and production
 */
export const rateLimitMiddleware = (_req: any, _res: any, next: any) => next(); // Completely disabled

/**
 * Authentication rate limiting middleware - DISABLED
 * Rate limiting completely disabled as requested
 */
export const authRateLimit = (_req: any, _res: any, next: any) => next(); // Completely disabled

/**
 * Strict rate limiting middleware - DISABLED
 * Rate limiting completely disabled as requested
 */
export const strictRateLimit = (_req: any, _res: any, next: any) => next(); // Completely disabled

/**
 * Public endpoint rate limiting middleware - DISABLED
 * Rate limiting completely disabled as requested
 */
export const publicRateLimit = (_req: any, _res: any, next: any) => next(); // Completely disabled

/**
 * Dynamic rate limiting based on user role - DISABLED
 * Rate limiting completely disabled as requested
 */
export const dynamicRateLimit = (_req: any, _res: any, next: any) => next(); // Completely disabled

// Rate limiting is completely disabled
// TODO: Implement proper rate limiting if needed for production security