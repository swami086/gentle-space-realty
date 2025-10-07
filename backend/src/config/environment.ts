/**
 * Backend Environment Configuration
 * Validates and provides typed environment variables for the backend
 */

import { z } from 'zod';

// Environment validation schema
const BackendEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  PORT: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1000).max(65535)).default('3001'),
  
  // GCP Database Configuration
  DB_HOST: z.string().min(1),
  DB_PORT: z.string().transform(val => parseInt(val, 10)).pipe(z.number().min(1)).default('5432'),
  DB_NAME: z.string().min(1),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().min(1),
  
  // Firebase Configuration
  FIREBASE_PROJECT_ID: z.string().min(1),
  FIREBASE_PRIVATE_KEY_PATH: z.string().min(1),
  
  // Google Cloud Storage Configuration
  GCS_PROJECT_ID: z.string().min(1),
  GCS_KEY_FILE_PATH: z.string().min(1),
  
  // Legacy Supabase Configuration (optional, for compatibility)
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_JWT_SECRET: z.string().min(32).optional(),
  
  // JWT Configuration
  JWT_SECRET: z.string().min(1).optional(),
  JWT_EXPIRES_IN: z.string().default('1d'),
  
  // CORS Configuration
  CORS_ORIGINS: z.string().default('http://localhost:5175'),
  
  // Firecrawl API Configuration (optional - allows app to run without scraping functionality)
  FIRECRAWL_API_KEY: z.string().startsWith('fc-').optional(),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info')
});

export type BackendConfig = z.infer<typeof BackendEnvSchema>;

/**
 * Validates and returns the backend environment configuration
 */
export function validateBackendEnvironment(env: Record<string, string | undefined>): BackendConfig {
  try {
    const validatedEnv = BackendEnvSchema.parse({
      NODE_ENV: env.NODE_ENV || 'development',
      PORT: env.PORT || '3001',
      
      // GCP Database Configuration
      DB_HOST: env.DB_HOST,
      DB_PORT: env.DB_PORT || '5432',
      DB_NAME: env.DB_NAME,
      DB_USER: env.DB_USER,
      DB_PASSWORD: env.DB_PASSWORD,
      
      // Firebase Configuration
      FIREBASE_PROJECT_ID: env.FIREBASE_PROJECT_ID,
      FIREBASE_PRIVATE_KEY_PATH: env.FIREBASE_PRIVATE_KEY_PATH,
      
      // Google Cloud Storage Configuration
      GCS_PROJECT_ID: env.GCS_PROJECT_ID,
      GCS_KEY_FILE_PATH: env.GCS_KEY_FILE_PATH,
      
      // Legacy Supabase Configuration (optional)
      SUPABASE_URL: env.SUPABASE_URL,
      SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_JWT_SECRET: env.SUPABASE_JWT_SECRET,
      
      // JWT Configuration
      JWT_SECRET: env.JWT_SECRET,
      JWT_EXPIRES_IN: env.JWT_EXPIRES_IN || '1d',
      
      CORS_ORIGINS: env.CORS_ORIGINS || 'http://localhost:5175',
      
      // Firecrawl API Configuration (optional)
      FIRECRAWL_API_KEY: env.FIRECRAWL_API_KEY || undefined,
      
      LOG_LEVEL: env.LOG_LEVEL || 'info'
    });

    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach(err => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      throw new Error(`Invalid environment configuration: ${error.errors.map(e => e.path.join('.')).join(', ')}`);
    }
    throw error;
  }
}

/**
 * Get validated environment configuration
 */
export function getBackendConfig(): BackendConfig {
  return validateBackendEnvironment(process.env);
}