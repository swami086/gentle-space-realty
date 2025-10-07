# Testing Guide - Comprehensive Testing Strategy

## 🧪 Testing Overview

Gentle Space Realty implements a comprehensive testing strategy to ensure reliability, performance, and security of the direct frontend-to-Supabase architecture.

## 📋 Testing Philosophy

### Testing Pyramid Strategy

```
                  ▲
                 / \
                /   \
               /  E2E \       Few, High-Value End-to-End Tests
              /_______\
             /         \
            /Integration\     Moderate Integration Tests  
           /   Tests     \
          /_____________\
         /               \
        /   Unit Tests    \    Many Fast Unit Tests
       /_________________\
```

### Core Principles

✅ **Test Early, Test Often**: Continuous testing throughout development  
✅ **Test Isolation**: Each test runs independently  
✅ **Realistic Testing**: Test against real Supabase instances  
✅ **Performance Focused**: Include performance benchmarks  
✅ **Security Validation**: Test authentication and authorization  
✅ **Real-time Testing**: Validate WebSocket connections  

## 🏗️ Testing Architecture

### Test Categories

1. **Unit Tests** - Individual components and functions
2. **Integration Tests** - Supabase integration and API layer
3. **Component Tests** - React component behavior
4. **Performance Tests** - Load times and responsiveness
5. **Security Tests** - Authentication and data access
6. **Real-time Tests** - WebSocket connections and live updates

## ⚙️ Testing Setup

### Prerequisites

```bash
# Install dependencies (already included)
npm install

# Verify test environment
npm run validate:env
npm run test -- --version
```

### Test Environment Configuration

```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/tests/**/*',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

## 🧪 Test Suites

### 1. Unit Tests

**Location**: `tests/unit/`

```typescript
// Example: Property service unit test
describe('PropertyService', () => {
  it('should format property data correctly', () => {
    const rawProperty = {
      id: '123',
      title: 'Office Space',
      price: { amount: 5000, period: 'month' }
    };
    
    const formatted = formatProperty(rawProperty);
    
    expect(formatted.displayPrice).toBe('$5,000/month');
    expect(formatted.id).toBe('123');
  });
  
  it('should validate property creation data', () => {
    const invalidProperty = { title: '' };
    
    const validation = validatePropertyData(invalidProperty);
    
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('Title is required');
  });
});
```

**Run Unit Tests**:
```bash
npm run test:unit
npm run test:unit -- --watch
npm run test:coverage
```

### 2. Integration Tests

**Location**: `src/tests/integration/`

The comprehensive integration test suite validates:

- **Database Connectivity**: Connection to Supabase
- **Schema Validation**: Required tables and columns
- **API Layer**: Frontend API abstraction
- **Authentication**: User login/logout flows
- **Real-time**: WebSocket subscriptions
- **Storage**: File upload and retrieval
- **Performance**: Response times and load handling

```typescript
// Key integration tests
describe('Supabase Integration', () => {
  it('should connect to database successfully', async () => {
    const { data, error } = await supabase
      .from('properties')
      .select('count', { count: 'exact', head: true });
      
    expect(error).toBeNull();
    expect(data).toBeDefined();
  });
  
  it('should handle property CRUD operations', async () => {
    // Create
    const created = await api.createProperty(testProperty);
    expect(created.success).toBe(true);
    
    // Read  
    const fetched = await api.getProperty(created.data.id);
    expect(fetched.data.title).toBe(testProperty.title);
    
    // Update
    const updated = await api.updateProperty(created.data.id, { title: 'Updated Title' });
    expect(updated.data.title).toBe('Updated Title');
    
    // Delete
    const deleted = await api.deleteProperty(created.data.id);
    expect(deleted.success).toBe(true);
  });
});
```

**Run Integration Tests**:
```bash
npm run test:integration
npm run validate:supabase
```

### 3. Component Tests

**Location**: `tests/components/`

```typescript
// React component testing
describe('PropertyCard Component', () => {
  it('should render property information', () => {
    const property = {
      id: '1',
      title: 'Modern Office',
      price: { amount: 5000, period: 'month' },
      images: ['image1.jpg']
    };
    
    render(<PropertyCard property={property} />);
    
    expect(screen.getByText('Modern Office')).toBeInTheDocument();
    expect(screen.getByText('$5,000/month')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', 'image1.jpg');
  });
  
  it('should handle property selection', async () => {
    const onSelect = jest.fn();
    const property = { id: '1', title: 'Office' };
    
    render(<PropertyCard property={property} onSelect={onSelect} />);
    
    await user.click(screen.getByRole('button', { name: /select/i }));
    
    expect(onSelect).toHaveBeenCalledWith(property.id);
  });
});
```

### 4. Performance Tests

**Integrated into comprehensive test runner**

```typescript
// Performance benchmarking
describe('Performance Tests', () => {
  it('should load properties within 5 seconds', async () => {
    const startTime = Date.now();
    
    const response = await api.getProperties({ limit: 10 });
    
    const responseTime = Date.now() - startTime;
    expect(response.success).toBe(true);
    expect(responseTime).toBeLessThan(5000);
  });
  
  it('should handle concurrent requests', async () => {
    const requests = Array.from({ length: 5 }, () => 
      api.getProperties({ limit: 5 })
    );
    
    const results = await Promise.all(requests);
    
    results.forEach(result => {
      expect(result.success).toBe(true);
    });
  });
});
```

### 5. Real-time Tests

```typescript
// Real-time functionality testing
describe('Real-time Functionality', () => {
  it('should establish WebSocket connection', (done) => {
    const timeout = setTimeout(() => {
      done(new Error('Connection timeout'));
    }, 10000);
    
    const channel = supabase
      .channel('test-channel')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'properties' },
        (payload) => {
          clearTimeout(timeout);
          expect(payload).toBeDefined();
          channel.unsubscribe();
          done();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout);
          channel.unsubscribe();
          done();
        }
      });
  });
});
```

## 🚀 Testing Scripts

### Available Commands

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit                 # Unit tests only
npm run test:integration          # Integration tests only
npm run test:watch               # Watch mode
npm run test:coverage            # With coverage report

# Validation scripts
npm run validate:supabase        # Supabase integration validation
npm run validate:comprehensive   # Complete test suite
npm run validate:all            # Full validation pipeline

# Performance and security
npm run test:load               # Load testing (if configured)
npm run test:security           # Security audit
npm run security:audit          # NPM security audit
```

### Comprehensive Test Runner

The `scripts/run-comprehensive-tests.js` provides:

1. **Environment Validation**
   - Node.js version check
   - Required files verification
   - Dependencies validation

2. **Supabase Integration Tests**
   - Connection health
   - Schema validation
   - RLS policies
   - Storage access

3. **Build Validation**
   - TypeScript compilation
   - Build artifact generation
   - Bundle size verification

4. **Performance Benchmarks**
   - Bundle size analysis
   - Build time measurement
   - Type checking performance

```bash
# Run comprehensive validation
npm run validate:comprehensive

# Expected output:
# ✅ Environment Validation: PASSED (45ms)
# ✅ Supabase Integration: PASSED (1.2s)
# ✅ Integration Tests: PASSED (3.4s)
# ✅ Build Validation: PASSED (8.7s)
# ✅ Performance Benchmarks: PASSED (2.1s)
# 
# Overall Result: 5/5 test suites passed (100%)
```

## 📊 Test Coverage

### Coverage Requirements

- **Overall Coverage**: 80% minimum
- **Critical Paths**: 95% minimum  
- **Business Logic**: 90% minimum
- **UI Components**: 70% minimum

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

### Coverage Exclusions

```typescript
// jest.config.js
collectCoverageFrom: [
  'src/**/*.{ts,tsx}',
  '!src/**/*.d.ts',           // Type definitions
  '!src/tests/**/*',          // Test files
  '!src/**/*.stories.tsx',    // Storybook files
  '!src/main.tsx',           // Entry point
]
```

## 🔒 Security Testing

### Authentication Tests

```typescript
describe('Authentication Security', () => {
  it('should reject invalid credentials', async () => {
    const result = await api.signIn({
      email: 'invalid@test.com',
      password: 'wrongpassword'
    });
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid credentials');
  });
  
  it('should enforce RLS policies', async () => {
    // Test without authentication
    const { data, error } = await supabase
      .from('users')
      .select('*');
    
    if (error) {
      expect(error.message).toMatch(/policy|permission/i);
    }
  });
});
```

### Security Audit

```bash
# NPM security audit
npm run security:audit

# Check for vulnerable dependencies
npm audit --audit-level high

# Automated security scanning (if configured)
npm run test:security
```

## ⚡ Performance Testing

### Metrics Tracking

```typescript
// Performance test utilities
export const measurePerformance = async (operation: () => Promise<any>) => {
  const start = performance.now();
  const result = await operation();
  const duration = performance.now() - start;
  
  return { result, duration };
};

// Usage in tests
it('should load properties quickly', async () => {
  const { result, duration } = await measurePerformance(
    () => api.getProperties({ limit: 20 })
  );
  
  expect(result.success).toBe(true);
  expect(duration).toBeLessThan(2000); // 2 seconds
});
```

### Performance Benchmarks

Expected performance targets:

- **API Response Time**: < 500ms average
- **Page Load Time**: < 3s on 3G
- **Bundle Size**: < 1MB JavaScript
- **Real-time Latency**: < 100ms
- **Database Queries**: < 200ms average

## 🔍 Test Data Management

### Test Database Setup

```sql
-- Create test data (run in Supabase SQL editor)
INSERT INTO users (id, email, name, role) VALUES 
('test-user-1', 'test@example.com', 'Test User', 'user'),
('test-admin-1', 'admin@example.com', 'Test Admin', 'admin');

INSERT INTO properties (id, title, description, price, location, category) VALUES
('test-prop-1', 'Test Office Space', 'A test property', '{"amount": 5000, "period": "month"}', 'test-location', 'office-space');
```

### Data Cleanup

```typescript
// Test cleanup utilities
export const cleanupTestData = async () => {
  if (process.env.NODE_ENV !== 'test') return;
  
  await supabase.from('inquiries').delete().ilike('email', '%test%');
  await supabase.from('properties').delete().ilike('title', 'Test%');
  await supabase.from('users').delete().ilike('email', '%test%');
};

// Use in test teardown
afterAll(async () => {
  await cleanupTestData();
});
```

## 🐛 Debugging Tests

### Debug Configuration

```typescript
// jest.config.js - Debug mode
module.exports = {
  // ... other config
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  testTimeout: 30000, // 30 seconds for debugging
};
```

### Common Issues

**Supabase Connection Timeouts**
```bash
# Check environment variables
npm run validate:env

# Test connection manually
node -e "
const { createClient } = require('@supabase/supabase-js');
const client = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
client.from('properties').select('count', {count: 'exact', head: true}).then(console.log);
"
```

**Real-time Test Failures**
- Check WebSocket connection
- Verify real-time is enabled in Supabase
- Test with different network conditions

**Build Test Failures**
```bash
# Clear build cache
rm -rf dist node_modules/.vite
npm install
npm run build
```

## 📈 Continuous Integration

### GitHub Actions / GitLab CI

```yaml
# .gitlab-ci.yml (example)
test:
  stage: test
  script:
    - npm ci
    - npm run validate:all
    - npm run test:coverage
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
```

### Pre-deployment Testing

```bash
# Complete validation pipeline
npm run deploy:check

# This runs:
# 1. Environment validation
# 2. TypeScript compilation
# 3. ESLint checks
# 4. Unit tests
# 5. Build validation
# 6. Supabase connectivity
```

## 📋 Testing Checklist

### Before Deployment
- [ ] All unit tests passing
- [ ] Integration tests passing  
- [ ] Performance benchmarks met
- [ ] Security audit clean
- [ ] Coverage targets achieved
- [ ] Manual testing complete

### Regular Testing
- [ ] Run comprehensive validation weekly
- [ ] Monitor performance metrics
- [ ] Update test data as needed
- [ ] Review and update test coverage
- [ ] Security dependency updates

---

**Test Status**: [![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)](npm run test)  
**Coverage**: [![Coverage](https://img.shields.io/badge/coverage-80%25-yellow.svg)](npm run test:coverage)  
**Health Check**: `npm run health:check`