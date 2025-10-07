import { GenericContainer } from 'testcontainers';

// Global test setup
beforeAll(async () => {
  // Increase timeout for container setup
  jest.setTimeout(60000);
});

// Global test teardown
afterAll(async () => {
  // Clean up any global resources
});

// Mock external services by default
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
  }))
}));

jest.mock('redis', () => ({
  createClient: jest.fn(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    flushAll: jest.fn(),
    isOpen: true
  }))
}));

// Global test utilities
(global as any).testUtils = {
  // Test database connection
  testDbConfig: {
    host: process.env.TEST_DB_HOST || 'localhost',
    port: parseInt(process.env.TEST_DB_PORT || '5432'),
    database: process.env.TEST_DB_NAME || 'gentle_realty_test',
    username: process.env.TEST_DB_USER || 'test',
    password: process.env.TEST_DB_PASS || 'test'
  },
  
  // Test Redis connection
  testRedisConfig: {
    host: process.env.TEST_REDIS_HOST || 'localhost',
    port: parseInt(process.env.TEST_REDIS_PORT || '6379'),
    db: parseInt(process.env.TEST_REDIS_DB || '1')
  },

  // Helper to wait for async operations
  waitFor: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Generate test IDs
  generateTestId: () => `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
};

// Extend Jest matchers for API testing
expect.extend({
  toBeValidApiResponse(received) {
    const pass = received && 
                 typeof received === 'object' &&
                 received.hasOwnProperty('status') &&
                 received.hasOwnProperty('data');
    
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid API response`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid API response with status and data`,
        pass: false,
      };
    }
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidApiResponse(): R;
    }
  }
  
  const testUtils: {
    testDbConfig: {
      host: string;
      port: number;
      database: string;
      username: string;
      password: string;
    };
    testRedisConfig: {
      host: string;
      port: number;
      db: number;
    };
    waitFor: (ms: number) => Promise<void>;
    generateTestId: () => string;
  };
}