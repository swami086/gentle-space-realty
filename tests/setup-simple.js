/**
 * Simplified Jest Setup for Integration Tests
 */

// Load test environment configuration
require('./test-env.js');

// Set global timeout
jest.setTimeout(30000);

// Global test setup
beforeAll(async () => {
  console.log('🚀 Starting Jest integration test setup...');
  
  // Initialize test environment
  process.env.NODE_ENV = 'test';
  
  console.log('✅ Jest test setup completed');
});

// Global test teardown
afterAll(async () => {
  console.log('🧹 Jest test cleanup completed');
});

// Extend Jest matchers
expect.extend({
  toBeValidUUID(received) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid UUID`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid UUID`,
        pass: false,
      };
    }
  },
  
  toBeValidTimestamp(received) {
    const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    const pass = timestampRegex.test(received) && !isNaN(Date.parse(received));
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid timestamp`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid timestamp`,
        pass: false,
      };
    }
  }
});