// Centralized exports for all test fixtures
export * from './properties.fixtures';
export * from './inquiries.fixtures';
export * from './users.fixtures';

// Mock file data for upload testing
export const mockFileData = {
  validImage: {
    fieldname: 'image',
    originalname: 'test-property.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024 * 500, // 500KB
    buffer: Buffer.from('fake image data'),
  },
  validLargeImage: {
    fieldname: 'image',
    originalname: 'large-property.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024 * 1024 * 5, // 5MB
    buffer: Buffer.alloc(1024 * 1024 * 5),
  },
  invalidFileType: {
    fieldname: 'image',
    originalname: 'malicious-file.exe',
    encoding: '7bit',
    mimetype: 'application/x-msdownload',
    size: 1024 * 100,
    buffer: Buffer.from('malicious content'),
  },
  tooLargeFile: {
    fieldname: 'image',
    originalname: 'huge-image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024 * 1024 * 50, // 50MB - exceeds limit
    buffer: Buffer.alloc(1024 * 1024 * 50),
  },
  emptyFile: {
    fieldname: 'image',
    originalname: 'empty.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 0,
    buffer: Buffer.alloc(0),
  },
};

// Database seeding utilities
export const databaseSeeds = {
  properties: {
    minimal: 10,
    standard: 50,
    large: 500,
    massive: 2000, // For load testing
  },
  inquiries: {
    perProperty: 5,
    bulk: 1000,
  },
  users: {
    basic: ['admin', 'agent'],
    extended: ['admin', 'agent', 'super_admin', 'inactive'],
  },
};

// Test environment configuration
export const testConfig = {
  server: {
    port: process.env.TEST_PORT || 3001,
    host: process.env.TEST_HOST || 'localhost',
  },
  database: {
    maxConnections: 10,
    connectionTimeout: 10000,
    queryTimeout: 5000,
  },
  redis: {
    maxConnections: 5,
    connectionTimeout: 5000,
  },
  timeouts: {
    unit: 5000,
    integration: 15000,
    load: 60000,
  },
  performance: {
    maxResponseTime: 500, // ms
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
    maxCpuUsage: 80, // %
  },
};

// Test data cleanup utilities
export const testDataCleanup = {
  tablesToClean: [
    'inquiries',
    'property_images', 
    'properties',
    'admin_users',
    'sessions',
  ],
  filesToClean: [
    'uploads/test_*',
    'temp/test_*',
    'logs/test_*',
  ],
  cachesToClear: [
    'test:*',
    'session:test:*',
    'property:test:*',
  ],
};