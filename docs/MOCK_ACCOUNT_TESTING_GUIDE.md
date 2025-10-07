# Mock Account Testing Guide

A comprehensive guide to using the Mock Account testing system for development, testing, and QA workflows.

## Table of Contents

- [Overview](#overview)
- [Quick Start](#quick-start)
- [Core Components](#core-components)
- [Usage Patterns](#usage-patterns)
- [API Reference](#api-reference)
- [Testing Workflows](#testing-workflows)
- [Performance Guidelines](#performance-guidelines)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

The Mock Account testing system provides a comprehensive solution for creating, managing, and testing user accounts in development and testing environments. It includes support for different user roles, authentication validation, performance benchmarking, and automated cleanup.

### Key Features

- ✅ **Multi-Role Support**: Admin, Super Admin, and User roles
- ✅ **Supabase Integration**: Full integration with Supabase authentication
- ✅ **Validation Testing**: Login, role, and permission validation
- ✅ **Performance Benchmarking**: Built-in performance measurement tools
- ✅ **Automated Cleanup**: Intelligent cleanup of test accounts
- ✅ **CLI Tools**: Command-line interface for account management
- ✅ **React Components**: Ready-to-use UI components for admin interface
- ✅ **Comprehensive Testing**: Unit, integration, and E2E test suites

## Quick Start

### 1. Create a Single Test Account

```typescript
import { TestAccountHelper } from '../src/utils/testAccountHelper';

// Create admin account
const admin = await TestAccountHelper.createTestAdmin('qa-admin');
console.log('Admin account created:', admin.accountId);

// Create complete test suite
const suite = await TestAccountHelper.createTestSuite();
console.log('Created accounts:', suite.summary);
```

### 2. Using the CLI Tool

```bash
# Create single admin account
npm run script:mock-account -- --role=admin

# Create complete test suite
npm run script:mock-account -- --suite

# Show statistics
npm run script:mock-account -- --stats

# Clean up all test accounts
npm run script:mock-account -- --cleanup
```

### 3. Using the React Component

```tsx
import MockAccountManager from '../src/components/admin/MockAccountManager';

function AdminPanel() {
  return (
    <MockAccountManager
      onAccountCreated={(result) => console.log('Created:', result)}
      onAccountsCleaned={(count) => console.log('Cleaned:', count)}
    />
  );
}
```

## Core Components

### 1. MockAccountService

Core service providing all account management functionality:

```typescript
import { MockAccountService } from '../src/services/mockAccountService';

// Create account with full configuration
const result = await MockAccountService.createMockAccount({
  credentials: {
    email: 'test@example.com',
    password: 'TestPass123!'
  },
  profile: {
    name: 'Test Admin',
    role: 'admin'
  },
  options: {
    skipEmailConfirmation: true
  }
});

// Test account login
const loginTest = await MockAccountService.testAccountLogin({
  email: 'test@example.com',
  password: 'TestPass123!'
});

// Get account statistics
const stats = await MockAccountService.getMockAccountStats();
```

### 2. TestAccountHelper

High-level helper utilities for common operations:

```typescript
import { TestAccountHelper } from '../src/utils/testAccountHelper';

// Quick account creation
const admin = await TestAccountHelper.createTestAdmin('my-admin');
const superAdmin = await TestAccountHelper.createTestSuperAdmin('my-super');
const user = await TestAccountHelper.createTestUser('my-user');

// Batch creation
const batch = await TestAccountHelper.createAccountBatch(5, [
  MockAccountType.ADMIN,
  MockAccountType.SUPER_ADMIN,
  MockAccountType.USER
]);

// Performance benchmarking
const benchmark = await TestAccountHelper.benchmarkAccountOperations(10);

// Generate comprehensive report
const report = await TestAccountHelper.generateTestReport();
```

### 3. Type Definitions

Comprehensive TypeScript types for type safety:

```typescript
import {
  MockAccountType,
  MockAccountCredentials,
  MockAccountTestResult,
  AccountValidationState
} from '../src/types/mockAccount';

// Account types
enum MockAccountType {
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  USER = 'user'
}

// Test result interface
interface MockAccountTestResult {
  success: boolean;
  accountId?: string;
  message: string;
  validationResults?: {
    canLogin: boolean;
    hasCorrectRole: boolean;
    canAccessAdmin: boolean;
  };
  error?: Error;
}
```

## Usage Patterns

### Development Workflow

```typescript
// 1. Set up test environment
const testAccounts = await TestAccountHelper.createTestSuite();

// 2. Use accounts for development testing
const adminCredentials = testAccounts.admin;
// ... perform development testing

// 3. Clean up when done
await TestAccountHelper.cleanupAllTestAccounts();
```

### QA Testing Workflow

```typescript
// 1. Create specific test accounts for different scenarios
const loginTestAdmin = await TestAccountHelper.createTestAdmin('login-test');
const permissionTestAdmin = await TestAccountHelper.createTestAdmin('permission-test');
const boundaryTestUser = await TestAccountHelper.createTestUser('boundary-test');

// 2. Validate each account
const validations = await Promise.all([
  TestAccountHelper.validateTestAccount(loginTestAdmin.credentials, MockAccountType.ADMIN),
  TestAccountHelper.validateTestAccount(permissionTestAdmin.credentials, MockAccountType.ADMIN),
  TestAccountHelper.validateTestAccount(boundaryTestUser.credentials, MockAccountType.USER)
]);

// 3. Run comprehensive test scenarios
const scenarios = await TestAccountHelper.runTestScenarios([
  loginTestAdmin,
  permissionTestAdmin,
  boundaryTestUser
]);

// 4. Generate test report
const report = await TestAccountHelper.generateTestReport();
```

### Performance Testing Workflow

```typescript
// 1. Benchmark basic operations
const benchmark = await TestAccountHelper.benchmarkAccountOperations(20);
console.log('Creation average:', benchmark.creation.average);
console.log('Login average:', benchmark.login.average);
console.log('Cleanup average:', benchmark.cleanup.average);

// 2. Stress test with batch operations
const stressTest = await TestAccountHelper.createAccountBatch(50);
console.log('Stress test results:', stressTest.summary);

// 3. Monitor system health
const healthReport = await TestAccountHelper.generateTestReport();
console.log('System health:', healthReport.health);
```

## API Reference

### MockAccountService Methods

#### `createMockAccount(request: MockAccountCreationRequest): Promise<MockAccountTestResult>`

Creates a new mock account with full configuration options.

**Parameters:**
- `request.credentials`: Email and password for the account
- `request.profile`: Name and role information
- `request.options`: Additional options like email confirmation skip

**Returns:** MockAccountTestResult with creation status and validation results

#### `testAccountLogin(credentials: MockAccountCredentials): Promise<MockAccountTestResult>`

Tests login functionality and validates account permissions.

**Parameters:**
- `credentials`: Email and password to test

**Returns:** MockAccountTestResult with login test results

#### `createQuickTestAccount(role: MockAccountType, emailPrefix?: string): Promise<MockAccountTestResult>`

Quick account creation with default settings.

**Parameters:**
- `role`: Account role (admin, super_admin, user)
- `emailPrefix`: Optional email prefix

**Returns:** MockAccountTestResult

#### `cleanupAllTestAccounts(): Promise<MockAccountCleanupResult>`

Removes all test accounts from the system.

**Returns:** Cleanup result with count and errors

#### `getMockAccountStats(): Promise<MockAccountStats>`

Retrieves comprehensive account statistics.

**Returns:** Statistics object with counts by role and timestamps

### TestAccountHelper Methods

#### `createTestSuite(): Promise<TestSuiteResult>`

Creates a complete test suite with admin, super admin, and user accounts.

#### `validateTestAccount(credentials, expectedRole?): Promise<ValidationResult>`

Validates an account with comprehensive checks.

#### `benchmarkAccountOperations(iterations): Promise<BenchmarkResult>`

Runs performance benchmarks on account operations.

#### `generateTestReport(): Promise<TestReport>`

Generates comprehensive system health and usage report.

## Testing Workflows

### Unit Testing

```typescript
import { describe, it, expect } from 'vitest';
import { MockAccountService } from '../src/services/mockAccountService';

describe('MockAccountService', () => {
  it('should create admin account successfully', async () => {
    const result = await MockAccountService.createQuickTestAccount(MockAccountType.ADMIN);
    
    expect(result.success).toBe(true);
    expect(result.validationResults?.canAccessAdmin).toBe(true);
    
    // Cleanup
    if (result.accountId) {
      await MockAccountService.cleanupAccount(result.accountId);
    }
  });
});
```

### Integration Testing

```typescript
describe('Mock Account Integration', () => {
  it('should handle complete account lifecycle', async () => {
    // Create account
    const account = await TestAccountHelper.createTestAdmin();
    expect(account.success).toBe(true);
    
    // Validate account
    const validation = await TestAccountHelper.validateTestAccount(account.credentials);
    expect(validation.isValid).toBe(true);
    
    // Cleanup
    await TestAccountHelper.cleanupAllTestAccounts();
  });
});
```

### E2E Testing

```typescript
describe('Mock Account E2E', () => {
  it('should simulate complete QA workflow', async () => {
    // Phase 1: Setup
    const suite = await TestAccountHelper.createTestSuite();
    expect(suite.summary.created).toBeGreaterThanOrEqual(2);
    
    // Phase 2: Testing
    const scenarios = await TestAccountHelper.runTestScenarios([
      suite.admin,
      suite.superAdmin,
      suite.user
    ]);
    expect(scenarios.summary.passed).toBeGreaterThan(0);
    
    // Phase 3: Reporting
    const report = await TestAccountHelper.generateTestReport();
    expect(report.health.canCreateAccounts).toBe(true);
    
    // Phase 4: Cleanup
    await TestAccountHelper.cleanupAllTestAccounts();
  });
});
```

## Performance Guidelines

### Account Creation Performance

- **Target**: < 2 seconds per account
- **Acceptable**: < 5 seconds per account
- **Monitor**: Creation time trends over time

### Login Testing Performance

- **Target**: < 1 second per login test
- **Acceptable**: < 3 seconds per login test
- **Monitor**: Authentication response times

### Batch Operations

- **Recommended**: Process in batches of 5-10 accounts
- **Maximum**: No more than 20 concurrent operations
- **Timeout**: Set appropriate timeouts for batch operations

### Cleanup Operations

- **Target**: < 1.5 seconds per cleanup
- **Acceptable**: < 4 seconds per cleanup
- **Best Practice**: Run cleanup after test sessions

## Troubleshooting

### Common Issues

#### Account Creation Fails

**Symptoms:**
- `Database error querying schema` 
- Auth creation timeout
- Profile creation failures

**Solutions:**
1. Check Supabase connection configuration
2. Verify database permissions
3. Check for rate limiting
4. Validate email domain restrictions

```typescript
// Debug account creation
const result = await MockAccountService.createMockAccount(request);
if (!result.success) {
  console.error('Creation failed:', result.error);
  console.log('Attempting alternative approach...');
  // Try with different email domain or simplified profile
}
```

#### Login Testing Fails

**Symptoms:**
- Invalid credentials errors
- Session creation failures
- Permission validation failures

**Solutions:**
1. Verify account was created successfully
2. Check password requirements
3. Validate role assignments
4. Test with known working credentials

```typescript
// Debug login testing
try {
  const loginResult = await MockAccountService.testAccountLogin(credentials);
  if (!loginResult.success) {
    console.log('Login validation details:', loginResult.validationResults);
  }
} catch (error) {
  console.error('Login test error:', error);
}
```

#### Performance Issues

**Symptoms:**
- Slow account creation (> 5 seconds)
- Timeout errors
- High memory usage

**Solutions:**
1. Run performance benchmark to identify bottlenecks
2. Check database performance
3. Verify network connectivity
4. Consider batch size reduction

```typescript
// Performance diagnosis
const benchmark = await TestAccountHelper.benchmarkAccountOperations(5);
console.log('Performance metrics:', benchmark);

if (benchmark.creation.average > 5000) {
  console.warn('Account creation is slow - investigate database performance');
}
```

### Debug Mode

Enable debug logging for detailed troubleshooting:

```typescript
// Enable console logging
console.log = (...args) => {
  const timestamp = new Date().toISOString();
  console.info(`[${timestamp}]`, ...args);
};

// Run operations with detailed logging
const result = await MockAccountService.createMockAccount(request);
```

## Best Practices

### Account Management

1. **Use Descriptive Prefixes**: Always use meaningful email prefixes
   ```typescript
   const admin = await TestAccountHelper.createTestAdmin('e2e-login-test');
   ```

2. **Clean Up After Tests**: Always clean up test accounts
   ```typescript
   afterEach(async () => {
     await TestAccountHelper.cleanupAllTestAccounts();
   });
   ```

3. **Monitor Account Count**: Keep track of test account creation
   ```typescript
   const stats = await MockAccountService.getMockAccountStats();
   if (stats.totalAccounts > 100) {
     console.warn('High number of test accounts - consider cleanup');
   }
   ```

### Performance Optimization

1. **Batch Operations**: Group related operations together
   ```typescript
   // Good: Create multiple accounts at once
   const batch = await TestAccountHelper.createAccountBatch(5);
   
   // Avoid: Creating accounts one by one in loop
   ```

2. **Use Appropriate Timeouts**: Set reasonable timeouts for operations
   ```typescript
   // Set timeout based on operation complexity
   const result = await Promise.race([
     MockAccountService.createMockAccount(request),
     new Promise((_, reject) => 
       setTimeout(() => reject(new Error('Timeout')), 10000)
     )
   ]);
   ```

3. **Monitor Performance**: Regularly benchmark performance
   ```typescript
   // Run weekly performance checks
   const benchmark = await TestAccountHelper.benchmarkAccountOperations(10);
   // Log results to monitoring system
   ```

### Testing Strategy

1. **Use Test Fixtures**: Leverage pre-defined test data
   ```typescript
   import { TEST_CREDENTIALS, TEST_CREATION_REQUESTS } from '../fixtures/mockAccounts.fixtures';
   
   const result = await MockAccountService.createMockAccount(TEST_CREATION_REQUESTS.ADMIN);
   ```

2. **Validate Expectations**: Always verify account capabilities
   ```typescript
   const validation = await TestAccountHelper.validateTestAccount(
     credentials, 
     MockAccountType.ADMIN
   );
   expect(validation.canAccessAdmin).toBe(true);
   ```

3. **Handle Edge Cases**: Test boundary conditions
   ```typescript
   // Test with unusual email formats
   // Test with minimum/maximum password lengths
   // Test with special characters in names
   ```

### Security Considerations

1. **Use Test-Specific Domains**: Keep test accounts separate
   ```typescript
   // Good: Use dedicated test domain
   email: 'test-admin@test.gentlespacerealty.local'
   
   // Avoid: Using production-like domains
   ```

2. **Clean Up Regularly**: Don't leave test accounts in production
   ```typescript
   // Automated cleanup in CI/CD
   await TestAccountHelper.cleanupAllTestAccounts();
   ```

3. **Monitor Account Creation**: Track test account usage
   ```typescript
   const report = await TestAccountHelper.generateTestReport();
   if (report.recommendations.length > 0) {
     console.log('Security recommendations:', report.recommendations);
   }
   ```

## Advanced Usage

### Custom Account Types

Extend the system for custom roles:

```typescript
// Define custom role
enum CustomAccountType {
  MODERATOR = 'moderator',
  EDITOR = 'editor'
}

// Create custom account
const moderator = await MockAccountService.createMockAccount({
  credentials: { email: 'mod@test.local', password: 'TestPass123!' },
  profile: { name: 'Test Moderator', role: 'moderator' as any },
  options: { skipEmailConfirmation: true }
});
```

### Integration with CI/CD

```bash
# Add to package.json scripts
{
  "scripts": {
    "test:mock-accounts": "node scripts/createMockAccount.ts --suite",
    "test:cleanup": "node scripts/createMockAccount.ts --cleanup",
    "test:benchmark": "node scripts/createMockAccount.ts --benchmark"
  }
}

# In CI/CD pipeline
npm run test:mock-accounts
npm run test
npm run test:cleanup
```

### Custom Validation Rules

```typescript
// Extend validation logic
class CustomMockAccountService extends MockAccountService {
  static async validateCustomRules(accountId: string): Promise<boolean> {
    // Add custom validation logic
    const account = await this.getAccountById(accountId);
    return account.profile.department === 'QA';
  }
}
```

## Conclusion

The Mock Account testing system provides a robust foundation for development and testing workflows. By following this guide and best practices, teams can effectively manage test accounts, maintain system performance, and ensure reliable testing processes.

For additional support or feature requests, please refer to the project documentation or submit an issue to the development team.