# Gentle Space Realty - Frontend Testing Suite

This directory contains a comprehensive testing suite for the Gentle Space Realty frontend application using Supabase backend, implementing industry best practices for modern SPA (Single Page Application) testing.

## 🎯 Overview

The testing suite provides complete coverage for the frontend-only architecture:
- **Unit Tests** - Business logic and service validation  
- **Integration Tests** - Supabase client functionality
- **Database Tests** - Supabase RLS policies and data operations
- **Authentication Tests** - Firebase/Supabase auth flows
- **Security Tests** - RLS policy validation and input sanitization
- **Performance Tests** - Supabase query optimization and caching

## 📁 Directory Structure

```
tests/
├── fixtures/                    # Test data and mocks
│   ├── mockAccounts.fixtures.ts # Account/user test data
│   └── index.ts                 # Centralized exports
├── services/                    # Service layer tests
│   └── supabaseService.test.ts  # Comprehensive Supabase service tests
├── integration/                 # Integration tests
│   ├── api.test.js              # Supabase integration tests
│   ├── supabase.test.js         # Direct Supabase client tests
│   └── helpers/                 # Test utilities
│       └── supabase-test-helper.ts # Supabase testing utilities
├── auth/                        # Authentication tests
│   ├── firebase-auth.test.js    # Firebase authentication
│   └── supabase-auth.test.js    # Supabase authentication
├── security/                    # Security tests
│   └── security.test.ts         # RLS policies and security validation
├── comprehensive-integration.test.ts  # End-to-end Supabase tests
├── jest.config.js              # Jest configuration
├── setup-simple.js            # Global test setup
├── test-env.js                 # Environment configuration
└── README.md                   # This documentation
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Supabase project with configured database
- Firebase project for authentication (optional)

### Installation

```bash
# Install dependencies
npm install

# Install additional testing tools (optional)
npm install --save-dev @playwright/test
```

### Environment Setup

Create test environment variables:

```bash
# Supabase Configuration
export VITE_SUPABASE_URL=your_supabase_project_url
export VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
export SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key  # For admin operations

# Firebase Configuration (optional)
export VITE_FIREBASE_API_KEY=your_firebase_api_key
export VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
export VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
```

## 🧪 Running Tests

### Quick Commands

```bash
# Run all tests
npm test

# Run specific test types
npm run test:unit           # Service layer tests
npm run test:integration    # Supabase integration tests  
npm run test:auth          # Authentication tests
npm run test:security      # Security and RLS tests

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

### Individual Test Files

```bash
# Run specific test files
npm test tests/services/supabaseService.test.ts
npm test tests/integration/api.test.js
npm test tests/security/security.test.ts
npm test tests/auth/firebase-auth.test.js
npm test tests/comprehensive-integration.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="Property Management"
npm test -- --testPathPattern="integration"
```

## 📊 Test Coverage

### Coverage Targets

- **Services**: >85% (SupabaseService, auth services)
- **Integration**: >80% (Supabase operations)
- **Components**: >75% (UI components with data)
- **Utilities**: >90% (Helper functions)

### Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# View HTML coverage report
open coverage/lcov-report/index.html
```

## 🔧 Test Configuration

### Jest Configuration

Key Jest settings in `jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup-simple.js'],
  testTimeout: 15000,  // Increased for Supabase operations
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

### Test Categories

#### Service Tests
- **Focus**: SupabaseService class methods
- **Environment**: Real Supabase connection
- **Coverage**: CRUD operations, error handling
- **RLS Testing**: Row Level Security policy validation

#### Integration Tests  
- **Focus**: Supabase client operations
- **Authentication**: Firebase/Supabase auth flows
- **Data Flow**: End-to-end data operations
- **Error Handling**: Network failures, invalid queries

#### Security Tests
- **RLS Policies**: Row Level Security validation
- **Input Sanitization**: XSS prevention
- **Authentication**: Unauthorized access attempts
- **Business Logic**: Data access restrictions

#### Performance Tests
- **Query Optimization**: Supabase query performance
- **Caching**: Client-side caching efficiency
- **Concurrent Operations**: Multi-user scenarios
- **Network Resilience**: Connection failure handling

## 🛠️ Test Utilities

### SupabaseTestHelper

The comprehensive testing utility for Supabase operations:

```typescript
import { SupabaseTestHelper } from './integration/helpers/supabase-test-helper';

// Initialize helper
const helper = new SupabaseTestHelper();

// Test connection
const isHealthy = await helper.testConnection();

// Create test data
const property = await helper.createTestProperty({
  title: 'Test Property',
  price: 150000
});

// Test RLS policies
const rlsResults = await helper.testRLSPolicies();

// Performance testing
const performance = await helper.measureQueryPerformance('properties', 10);

// Cleanup
await helper.cleanupTestData();
```

### Authentication Testing

```typescript
// Test anonymous authentication
const { success, session } = await helper.testAnonymousAuth();

// Test OAuth providers
const { success, url } = await helper.testOAuthProvider('google');

// Test Firebase integration
const user = await SupabaseService.getUserByFirebaseUID('test-uid');
```

### RLS Policy Testing

```typescript
// Comprehensive RLS testing
const rlsResults = await helper.testRLSPolicies();

console.log('Can read properties:', rlsResults.canReadProperties);
console.log('Can create inquiries:', rlsResults.canCreateInquiries);
console.log('Can update inquiries:', rlsResults.canUpdateInquiries);
```

## 📈 Performance Benchmarks

### Target Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| Supabase Query Time | <200ms | 95th percentile |
| Component Render | <100ms | Initial render time |  
| Error Rate | <1% | Failed operations |
| Memory Usage | <150MB | Frontend memory consumption |
| Network Requests | <10 | Per page load |

### Performance Testing Scenarios

Built-in performance tests include:

- **Query Performance**: Individual table query timing
- **Concurrent Operations**: Multiple simultaneous operations
- **Network Resilience**: Connection failure scenarios
- **RLS Policy Impact**: Performance impact of security policies

## 🔒 Security Testing

### Test Categories

#### Row Level Security (RLS)
- Anonymous user access restrictions
- Authenticated user permissions
- Admin-only operations
- Cross-user data access prevention
- Business logic security rules

#### Input Validation
- XSS payload testing in form inputs
- SQL injection prevention (Supabase handles)
- Parameter validation
- Data type validation
- Required field validation

#### Authentication Security
- Firebase authentication flows
- Supabase auth integration
- Session management
- Token validation
- Unauthorized access attempts

## 🐛 Debugging Tests

### Common Issues

#### Supabase Connection Issues
```bash
# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY

# Test connection manually
curl -H "apikey: $VITE_SUPABASE_ANON_KEY" "$VITE_SUPABASE_URL/rest/v1/"
```

#### Test Timeouts
```bash
# Increase timeout for Supabase operations
jest --testTimeout=30000

# Debug network issues
export DEBUG=supabase*
```

#### RLS Policy Failures
```bash
# Check if service key is available
echo $SUPABASE_SERVICE_ROLE_KEY

# Run tests that require admin access
npm test -- --testNamePattern="admin"
```

### Test Debugging

```typescript
// Add debug logging
console.log('Supabase response:', { data, error });

// Use Jest debugging
// Add "debugger;" statement and run:
node --inspect-brk node_modules/.bin/jest --runInBand
```

## 📋 CI/CD Integration

### GitHub Actions

```yaml
name: Frontend Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
        
      - name: Run test suite
        run: npm test
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### Environment Variables for CI

Required secrets in GitHub Actions:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_ANON_KEY`: Your Supabase anonymous key  
- `SUPABASE_SERVICE_KEY`: Your Supabase service role key (for admin tests)

## 📝 Contributing

### Adding New Tests

1. **Choose the right category**: Service vs Integration vs Security
2. **Follow naming conventions**: `feature.test.ts` or `feature.test.js`
3. **Use SupabaseTestHelper**: Leverage the comprehensive testing utility
4. **Test RLS policies**: Validate Row Level Security where applicable
5. **Update documentation**: Document new test scenarios

### Test Quality Standards

- **Descriptive names**: Test names should explain what and why
- **RLS Awareness**: Consider Row Level Security in all data tests
- **Cleanup**: Always clean up test data using helper methods
- **Error Handling**: Test both success and failure scenarios
- **Performance**: Consider Supabase operation timing

### Code Review Checklist

- [ ] Tests work with RLS policies enabled
- [ ] Supabase operations are properly tested
- [ ] Test data is cleaned up after execution
- [ ] Error scenarios are handled gracefully
- [ ] Performance implications are considered
- [ ] Documentation is updated

## 🆘 Troubleshooting

### Common Error Solutions

| Error | Solution |
|-------|----------|
| `Invalid API key` | Check VITE_SUPABASE_ANON_KEY environment variable |
| `Supabase connection failed` | Verify VITE_SUPABASE_URL is correct |
| `RLS policy violation` | Check if operation requires admin client |
| `Test timeout` | Increase Jest timeout for network operations |
| `Network error` | Check internet connection and Supabase status |

### Getting Help

- Check Supabase dashboard for project status
- Review test logs for specific error messages  
- Run tests individually to isolate issues
- Use debug mode for detailed Supabase responses
- Check environment variables are properly set

## 📚 References

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Firebase Documentation](https://firebase.google.com/docs/web/setup)

## 📖 Key Testing Patterns

### Creating Test Data

```typescript
// Create test property with admin client
const property = await helper.createTestProperty({
  title: 'Test Property',
  price: 150000
});

// Create test inquiry (works with anonymous client)
const inquiry = await helper.createTestInquiry({
  name: 'Test User',
  email: 'test@example.com'
});
```

### Testing RLS Policies

```typescript
// Test that anonymous users can read properties but not create them
describe('RLS Policies', () => {
  test('anonymous users can read properties', async () => {
    const properties = await SupabaseService.getAllProperties();
    expect(Array.isArray(properties)).toBe(true);
  });

  test('anonymous users cannot create properties', async () => {
    await expect(SupabaseService.createProperty(mockProperty))
      .rejects.toThrow();
  });
});
```

### Performance Testing

```typescript
// Test query performance
const performance = await helper.measureQueryPerformance('properties', 100);
expect(performance.responseTime).toBeLessThan(500); // ms
expect(performance.success).toBe(true);
```

---

**Last Updated**: 2024-01-20  
**Architecture**: Frontend-only SPA with Supabase  
**Test Coverage**: 85%+ across services and integrations