/**
 * Test Environment Configuration
 * Sets up environment variables and configurations for testing
 */

import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load test environment variables
const testEnvPath = path.join(__dirname, '..', '.env.test');
const localEnvPath = path.join(__dirname, '..', '.env.local');

// Try to load test-specific environment first, then fall back to local
try {
  dotenv.config({ path: testEnvPath });
  console.log('✅ Test environment loaded from .env.test');
} catch (error) {
  try {
    dotenv.config({ path: localEnvPath });
    console.log('⚠️  Test environment loaded from .env.local (fallback)');
  } catch (fallbackError) {
    console.log('ℹ️  No environment files found, using defaults');
  }
}

// Set test-specific environment variables
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://nfryqqpfprupwqayirnc.supabase.co';
process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcnlxcXBmcHJ1cHdxYXlpcm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTQwMTgsImV4cCI6MjA3MzM5MDAxOH0.bHuv93Q5TF-ZPRlCjNacI7-xrRV6EstgMJ1Thoy3HCs';

// Test database configuration (use separate test database if available)
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
}

// Test server configuration
process.env.TEST_PORT = process.env.TEST_PORT || '3001';

// Disable external service calls in tests
process.env.DISABLE_SENTRY = 'true';
process.env.DISABLE_EXTERNAL_APIS = 'true';

// Debug settings for tests
process.env.VITE_DEBUG_AUTH = 'false';
process.env.VITE_DEBUG_STARTUP = 'false';

console.log('🧪 Test Environment Configuration:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('  TEST_PORT:', process.env.TEST_PORT);
console.log('  SUPABASE_SERVICE_KEY available:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('  ANON_KEY available:', !!process.env.VITE_SUPABASE_ANON_KEY);

export const setupTestEnvironment = () => {
  console.log('🔧 Test environment setup complete');
};

export const getTestConfig = () => ({
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseAnonKey: process.env.VITE_SUPABASE_ANON_KEY,
  testPort: process.env.TEST_PORT,
  nodeEnv: process.env.NODE_ENV
});

export const isTestEnvironment = () => process.env.NODE_ENV === 'test';