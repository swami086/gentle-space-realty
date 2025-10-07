/**
 * Centralized Environment Configuration Manager
 * 
 * This module provides centralized, type-safe environment configuration
 * for the entire application with validation and error handling.
 */

import { z } from 'zod';

// Environment schema definitions
const frontendSchema = z.object({
  VITE_API_BASE_URL: z.string().url(),
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
  VITE_GOOGLE_MAPS_API_KEY: z.string().min(1).optional(),
  VITE_GOOGLE_CLIENT_ID: z.string().min(1).optional(),
  VITE_SENTRY_DSN: z.string().url().optional(),
  VITE_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  VITE_DEBUG_MODE: z.string().transform(val => val === 'true').default('false'),
});

const backendSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  PORT: z.string().transform(val => parseInt(val, 10)).default('3001'),
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  RATE_LIMIT_WINDOW: z.string().transform(val => parseInt(val, 10)).default('900000'), // 15 minutes
  RATE_LIMIT_MAX: z.string().transform(val => parseInt(val, 10)).default('100'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  GOOGLE_OAUTH_CLIENT_SECRET: z.string().min(1).optional(),
});

export type FrontendConfig = z.infer<typeof frontendSchema>;
export type BackendConfig = z.infer<typeof backendSchema>;

/**
 * Environment validation errors
 */
export class EnvironmentValidationError extends Error {
  constructor(
    message: string,
    public readonly issues: z.ZodIssue[]
  ) {
    super(message);
    this.name = 'EnvironmentValidationError';
  }
}

/**
 * Validates and parses environment variables for the frontend
 */
export function validateFrontendEnvironment(env: Record<string, string | undefined>): FrontendConfig {
  const result = frontendSchema.safeParse(env);
  
  if (!result.success) {
    const missingVars = result.error.issues
      .filter(issue => issue.code === 'invalid_type' && issue.received === 'undefined')
      .map(issue => issue.path.join('.'));
    
    const invalidVars = result.error.issues
      .filter(issue => issue.code !== 'invalid_type' || issue.received !== 'undefined')
      .map(issue => `${issue.path.join('.')}: ${issue.message}`);
    
    let errorMessage = 'Frontend environment validation failed:\n';
    
    if (missingVars.length > 0) {
      errorMessage += `Missing required variables: ${missingVars.join(', ')}\n`;
    }
    
    if (invalidVars.length > 0) {
      errorMessage += `Invalid variables: ${invalidVars.join(', ')}\n`;
    }
    
    throw new EnvironmentValidationError(errorMessage, result.error.issues);
  }
  
  return result.data;
}

/**
 * Validates and parses environment variables for the backend
 */
export function validateBackendEnvironment(env: Record<string, string | undefined>): BackendConfig {
  const result = backendSchema.safeParse(env);
  
  if (!result.success) {
    const missingVars = result.error.issues
      .filter(issue => issue.code === 'invalid_type' && issue.received === 'undefined')
      .map(issue => issue.path.join('.'));
    
    const invalidVars = result.error.issues
      .filter(issue => issue.code !== 'invalid_type' || issue.received !== 'undefined')
      .map(issue => `${issue.path.join('.')}: ${issue.message}`);
    
    let errorMessage = 'Backend environment validation failed:\n';
    
    if (missingVars.length > 0) {
      errorMessage += `Missing required variables: ${missingVars.join(', ')}\n`;
    }
    
    if (invalidVars.length > 0) {
      errorMessage += `Invalid variables: ${invalidVars.join(', ')}\n`;
    }
    
    throw new EnvironmentValidationError(errorMessage, result.error.issues);
  }
  
  return result.data;
}

/**
 * Environment utility functions
 */
export const EnvUtils = {
  isDevelopment: (env: string) => env === 'development',
  isStaging: (env: string) => env === 'staging',
  isProduction: (env: string) => env === 'production',
  isDebugMode: (debug: boolean | string) => debug === true || debug === 'true',
  
  /**
   * Get CORS origins as array
   */
  getCorsOrigins: (origins: string): string[] => {
    return origins.split(',').map(origin => origin.trim());
  },
  
  /**
   * Validate required environment variables exist
   */
  validateRequired: (env: Record<string, string | undefined>, requiredVars: string[]): void => {
    const missing = requiredVars.filter(key => !env[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  },
  
  /**
   * Get environment variable with default fallback
   */
  getWithDefault: (env: Record<string, string | undefined>, key: string, defaultValue: string): string => {
    return env[key] || defaultValue;
  },
  
  /**
   * Parse boolean environment variable
   */
  parseBoolean: (value: string | undefined, defaultValue: boolean = false): boolean => {
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
  },
  
  /**
   * Parse integer environment variable
   */
  parseInt: (value: string | undefined, defaultValue: number): number => {
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }
};

/**
 * Common environment validation patterns
 */
export const ValidationPatterns = {
  url: (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },
  
  port: (value: string | number): boolean => {
    const port = typeof value === 'string' ? parseInt(value, 10) : value;
    return port >= 1 && port <= 65535;
  },
  
  apiKey: (value: string): boolean => {
    return value.length > 0 && !value.includes(' ');
  },
  
  jwt: (value: string): boolean => {
    return value.length >= 32; // Minimum length for secure JWT secret
  }
};

/**
 * Environment configuration documentation
 */
export const EnvironmentDocs = {
  frontend: {
    VITE_API_BASE_URL: 'Base URL for the backend API (e.g., http://localhost:3001/api)',
    VITE_SUPABASE_URL: 'Supabase project URL (e.g., https://project-id.supabase.co)',
    VITE_SUPABASE_ANON_KEY: 'Supabase anonymous/public key for client-side operations',
    VITE_GOOGLE_MAPS_API_KEY: 'Google Maps API key with domain restrictions (optional)',
    VITE_GOOGLE_CLIENT_ID: 'Google OAuth 2.0 client ID for authentication (optional)',
    VITE_SENTRY_DSN: 'Sentry DSN for frontend error tracking (optional)',
    VITE_APP_ENV: 'Application environment: development, staging, or production',
    VITE_DEBUG_MODE: 'Enable debug mode for additional logging (true/false)',
  },
  
  backend: {
    SUPABASE_URL: 'Supabase project URL',
    SUPABASE_SERVICE_ROLE_KEY: 'Supabase service role key (server-side only)',
    JWT_SECRET: 'Secret for JWT token signing (minimum 32 characters)',
    PORT: 'Server port number (default: 3001)',
    NODE_ENV: 'Node.js environment: development, staging, or production',
    CORS_ORIGINS: 'Comma-separated list of allowed CORS origins',
    RATE_LIMIT_WINDOW: 'Rate limiting time window in milliseconds',
    RATE_LIMIT_MAX: 'Maximum requests per rate limit window',
    LOG_LEVEL: 'Logging level: error, warn, info, or debug',
    GOOGLE_OAUTH_CLIENT_SECRET: 'Google OAuth client secret (optional)',
  }
};