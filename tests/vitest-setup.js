/**
 * Vitest Setup Configuration
 * Sets up environment variables and configurations for testing with Vitest
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Set test environment
process.env.NODE_ENV = 'test';
process.env.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://nfryqqpfprupwqayirnc.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcnlxcXBmcHJ1cHdxYXlpcm5jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc4MTQwMTgsImV4cCI6MjA3MzM5MDAxOH0.bHuv93Q5TF-ZPRlCjNacI7-xrRV6EstgMJ1Thoy3HCs';

// Disable external services in tests
process.env.DISABLE_SENTRY = 'true';
process.env.DISABLE_EXTERNAL_APIS = 'true';
process.env.VITE_DEBUG_AUTH = 'false';
process.env.VITE_DEBUG_STARTUP = 'false';

console.log('🧪 Vitest Environment Configuration:');
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
console.log('  SUPABASE_SERVICE_KEY available:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('  ANON_KEY available:', !!process.env.VITE_SUPABASE_ANON_KEY);
console.log('✅ Vitest test environment setup complete');