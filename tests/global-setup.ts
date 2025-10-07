import { GlobalSetupContext } from 'vitest/node';

export default async function setup({ provide }: GlobalSetupContext) {
  console.log('🚀 Global test setup starting...');
  
  // Verify environment variables
  const requiredEnvVars = ['NODE_ENV'];
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      console.warn(`⚠️  Environment variable ${envVar} is not set`);
    }
  }
  
  // Set test environment variables if not already set
  if (!process.env.NODE_ENV) {
    process.env.NODE_ENV = 'test';
  }
  
  if (!process.env.VITE_API_URL) {
    process.env.VITE_API_URL = 'http://localhost:3000/api';
  }
  
  // Provide shared test data
  provide('testStartTime', Date.now());
  provide('testConfig', {
    timeout: 30000,
    retries: 2
  });
  
  console.log('✅ Global test setup complete');
}

export async function teardown() {
  console.log('🧹 Global test teardown starting...');
  // Global cleanup if needed
  console.log('✅ Global test teardown complete');
}