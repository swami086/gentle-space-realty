import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import { MockAccountService } from '../../../src/services/mockAccountService';
import {
  MockAccountType,
  MockAccountCreationRequest,
  AccountValidationState,
  MockAccountCredentials
} from '../../../src/types/mockAccount';
import {
  TEST_CREATION_REQUESTS,
  INTEGRATION_TEST_DATA,
  PERFORMANCE_BENCHMARKS,
  TestFixtureHelpers
} from '../../fixtures/mockAccounts.fixtures';

// Create isolated Supabase client for concurrent testing
const createIsolatedClient = () => {
  const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase configuration for isolated client');
  }
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      storageKey: `isolated-test-${Date.now()}-${Math.random()}`
    }
  });
};

// Isolated login test function
const testAccountLoginIsolated = async (credentials: MockAccountCredentials, clientId: string) => {
  const isolatedClient = createIsolatedClient();
  
  try {
    console.log(`🔐 Testing isolated login for client ${clientId}...`);
    
    // Test login with isolated client
    const { data: authData, error: authError } = await isolatedClient.auth.signInWithPassword({
      email: credentials.email,
      password: credentials.password
    });

    if (authError || !authData.user) {
      return {
        success: false,
        message: `Login failed: ${authError?.message || 'No user data'}`,
        clientId,
        validationResults: {
          canLogin: false,
          hasCorrectRole: false,
          canAccessAdmin: false
        },
        error: authError || new Error('No user data returned')
      };
    }

    // Get user profile to check role
    const { data: userProfile, error: profileError } = await isolatedClient
      .from('users')
      .select('id, email, name, role, is_active')
      .eq('id', authData.user.id)
      .single();

    if (profileError || !userProfile) {
      return {
        success: false,
        message: `Profile lookup failed: ${profileError?.message || 'No profile found'}`,
        clientId,
        validationResults: {
          canLogin: true,
          hasCorrectRole: false,
          canAccessAdmin: false
        }
      };
    }

    const hasAdminRole = ['admin', 'super_admin'].includes(userProfile.role);
    
    // Sign out from isolated client
    await isolatedClient.auth.signOut();
    
    return {
      success: true,
      accountId: authData.user.id,
      message: `Isolated login test successful for client ${clientId}: ${credentials.email}`,
      clientId,
      validationResults: {
        canLogin: true,
        hasCorrectRole: true,
        canAccessAdmin: hasAdminRole
      }
    };
    
  } catch (error) {
    console.error(`❌ Isolated login test error for client ${clientId}:`, error);
    return {
      success: false,
      message: `Isolated login test failed for client ${clientId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      clientId,
      validationResults: {
        canLogin: false,
        hasCorrectRole: false,
        canAccessAdmin: false
      },
      error: error as Error
    };
  }
};

/**
 * Integration tests for MockAccountService
 * These tests run against the actual Supabase instance
 * and should be used to verify end-to-end functionality
 */

describe('MockAccountService Integration Tests', () => {
  let createdAccountIds: string[] = [];

  beforeAll(async () => {
    console.log('🧪 Starting MockAccountService integration tests...');
    // Clean up any existing test accounts before starting
    await MockAccountService.cleanupAllTestAccounts();
  });

  afterAll(async () => {
    console.log('🧹 Cleaning up integration test accounts...');
    // Clean up all test accounts created during tests
    const cleanupResult = await MockAccountService.cleanupAllTestAccounts();
    console.log(`✅ Cleaned up ${cleanupResult.deletedAccounts} test accounts`);
  });

  beforeEach(() => {
    createdAccountIds = [];
  });

  afterEach(async () => {
    // Clean up accounts created in this specific test
    if (createdAccountIds.length > 0) {
      console.log(`🧹 Cleaning up ${createdAccountIds.length} test-specific accounts...`);
      for (const accountId of createdAccountIds) {
        await MockAccountService.cleanupAccount(accountId);
      }
    }
  });

  describe('End-to-End Account Lifecycle', () => {
    it('should create, test, and cleanup admin account successfully', async () => {
      // Arrange
      const testRequest = TestFixtureHelpers.createRandomTestRequest(MockAccountType.ADMIN);
      
      // Act & Assert - Create Account
      console.log('📝 Creating mock admin account...');
      const createResult = await MockAccountService.createMockAccount(testRequest);
      
      expect(createResult.success).toBe(true);
      expect(createResult.accountId).toBeDefined();
      expect(createResult.message).toContain('Mock account created successfully');
      expect(createResult.validationResults?.canLogin).toBe(true);
      expect(createResult.validationResults?.canAccessAdmin).toBe(true);

      if (createResult.accountId) {
        createdAccountIds.push(createResult.accountId);
      }

      // Act & Assert - Test Login
      console.log('🔐 Testing account login...');
      const loginResult = await MockAccountService.testAccountLogin(testRequest.credentials);
      
      expect(loginResult.success).toBe(true);
      expect(loginResult.validationResults?.canLogin).toBe(true);
      expect(loginResult.validationResults?.hasCorrectRole).toBe(true);
      expect(loginResult.validationResults?.canAccessAdmin).toBe(true);

      // Act & Assert - Validate Account State
      if (createResult.accountId) {
        console.log('🔍 Validating account state...');
        const validationState = await MockAccountService.validateAccountState(createResult.accountId);
        expect(validationState).toBe(AccountValidationState.VALID);
      }

      // Act & Assert - Cleanup
      if (createResult.accountId) {
        console.log('🧹 Testing account cleanup...');
        const cleanupSuccess = await MockAccountService.cleanupAccount(createResult.accountId);
        expect(cleanupSuccess).toBe(true);
        
        // Remove from tracking since it's already cleaned up
        createdAccountIds = createdAccountIds.filter(id => id !== createResult.accountId);
        
        // Verify account is gone
        const postCleanupState = await MockAccountService.validateAccountState(createResult.accountId);
        expect(postCleanupState).toBe(AccountValidationState.INVALID);
      }
    }, 30000); // 30 second timeout for full lifecycle test

    it('should handle super admin account with elevated permissions', async () => {
      // Arrange
      const testRequest = TestFixtureHelpers.createRandomTestRequest(MockAccountType.SUPER_ADMIN);
      
      // Act - Create Super Admin Account
      console.log('📝 Creating mock super admin account...');
      const createResult = await MockAccountService.createMockAccount(testRequest);
      
      // Assert - Super Admin Creation
      expect(createResult.success).toBe(true);
      expect(createResult.accountId).toBeDefined();
      expect(createResult.validationResults?.canAccessAdmin).toBe(true);

      if (createResult.accountId) {
        createdAccountIds.push(createResult.accountId);
      }

      // Act - Test Super Admin Login
      console.log('🔐 Testing super admin login...');
      const loginResult = await MockAccountService.testAccountLogin(testRequest.credentials);
      
      // Assert - Super Admin Login
      expect(loginResult.success).toBe(true);
      expect(loginResult.validationResults?.canLogin).toBe(true);
      expect(loginResult.validationResults?.hasCorrectRole).toBe(true);
      expect(loginResult.validationResults?.canAccessAdmin).toBe(true);
    }, 15000); // 15 second timeout

    it('should create regular user with no admin access', async () => {
      // Arrange
      const testRequest = TestFixtureHelpers.createRandomTestRequest(MockAccountType.USER);
      
      // Act - Create User Account
      console.log('📝 Creating mock user account...');
      const createResult = await MockAccountService.createMockAccount(testRequest);
      
      // Assert - User Creation
      expect(createResult.success).toBe(true);
      expect(createResult.accountId).toBeDefined();
      expect(createResult.validationResults?.canAccessAdmin).toBe(false); // User should not have admin access

      if (createResult.accountId) {
        createdAccountIds.push(createResult.accountId);
      }

      // Act - Test User Login
      console.log('🔐 Testing user login...');
      const loginResult = await MockAccountService.testAccountLogin(testRequest.credentials);
      
      // Assert - User Login (can login but no admin access)
      expect(loginResult.success).toBe(true);
      expect(loginResult.validationResults?.canLogin).toBe(true);
      expect(loginResult.validationResults?.hasCorrectRole).toBe(true);
      expect(loginResult.validationResults?.canAccessAdmin).toBe(false);
    }, 15000); // 15 second timeout
  });

  describe('Bulk Operations', () => {
    it('should create multiple accounts concurrently', async () => {
      // Arrange
      const accountRequests = TestFixtureHelpers.createBatchTestRequests(
        INTEGRATION_TEST_DATA.BULK_ACCOUNT_CREATION.count,
        INTEGRATION_TEST_DATA.BULK_ACCOUNT_CREATION.roles
      );

      // Act - Create Multiple Accounts
      console.log(`📝 Creating ${accountRequests.length} mock accounts concurrently...`);
      const startTime = Date.now();
      
      const createPromises = accountRequests.map(request => 
        MockAccountService.createMockAccount(request)
      );
      
      const results = await Promise.all(createPromises);
      const duration = Date.now() - startTime;

      // Assert - All Accounts Created
      const successfulResults = results.filter(result => result.success);
      expect(successfulResults.length).toBe(accountRequests.length);
      
      // Track created accounts for cleanup
      successfulResults.forEach(result => {
        if (result.accountId) {
          createdAccountIds.push(result.accountId);
        }
      });

      console.log(`✅ Created ${successfulResults.length} accounts in ${duration}ms`);

      // Performance assertion
      const avgTimePerAccount = duration / accountRequests.length;
      expect(avgTimePerAccount).toBeLessThan(PERFORMANCE_BENCHMARKS.ACCOUNT_CREATION.acceptable);
    }, 45000); // 45 second timeout for bulk operations

    it('should handle concurrent login tests with isolated clients', async () => {
      // Arrange - First create test accounts
      const accountRequests = INTEGRATION_TEST_DATA.CONCURRENT_LOGIN_TESTS.accounts.map((cred, index) => 
        TestFixtureHelpers.createRandomTestRequest(MockAccountType.ADMIN)
      );

      console.log('📝 Creating accounts for concurrent login test...');
      const createResults = await Promise.all(
        accountRequests.map(request => MockAccountService.createMockAccount(request))
      );

      const successfulAccounts = createResults.filter(result => result.success);
      expect(successfulAccounts.length).toBe(accountRequests.length);

      // Track for cleanup
      successfulAccounts.forEach(result => {
        if (result.accountId) {
          createdAccountIds.push(result.accountId);
        }
      });

      // Act - Concurrent Login Tests with Isolated Clients
      console.log('🔐 Testing concurrent logins with isolated Supabase clients...');
      const startTime = Date.now();
      
      const loginPromises = accountRequests.map((request, index) => 
        testAccountLoginIsolated(request.credentials, `client-${index}`)
      );
      
      const loginResults = await Promise.all(loginPromises);
      const duration = Date.now() - startTime;

      // Assert - All Logins Successful
      const successfulLogins = loginResults.filter(result => result.success);
      expect(successfulLogins.length).toBe(accountRequests.length);

      // Verify no client interference
      const uniqueClientIds = new Set(loginResults.map(result => result.clientId));
      expect(uniqueClientIds.size).toBe(accountRequests.length); // Each test should have unique client

      console.log(`✅ Completed ${successfulLogins.length} isolated concurrent logins in ${duration}ms`);
      console.log(`🔍 Used ${uniqueClientIds.size} unique isolated clients`);

      // Performance assertion (may be slightly slower due to client isolation overhead)
      const avgTimePerLogin = duration / accountRequests.length;
      expect(avgTimePerLogin).toBeLessThan(PERFORMANCE_BENCHMARKS.LOGIN_TEST.acceptable * 1.5); // Allow 50% overhead for isolation
    }, 45000); // 45 second timeout (increased for isolation overhead)

    it('should clean up multiple accounts efficiently', async () => {
      // Arrange - Create several test accounts first
      const accountRequests = TestFixtureHelpers.createBatchTestRequests(3, [MockAccountType.ADMIN]);

      console.log('📝 Creating accounts for cleanup test...');
      const createResults = await Promise.all(
        accountRequests.map(request => MockAccountService.createMockAccount(request))
      );

      const successfulAccounts = createResults.filter(result => result.success);
      expect(successfulAccounts.length).toBe(3);

      // Don't add to createdAccountIds since we're testing cleanup directly

      // Act - Bulk Cleanup
      console.log('🧹 Testing bulk cleanup...');
      const startTime = Date.now();
      const cleanupResult = await MockAccountService.cleanupAllTestAccounts();
      const duration = Date.now() - startTime;

      // Assert - Cleanup Success
      expect(cleanupResult.success).toBe(true);
      expect(cleanupResult.deletedAccounts).toBeGreaterThanOrEqual(3);
      expect(cleanupResult.errors).toHaveLength(0);

      console.log(`✅ Cleaned up ${cleanupResult.deletedAccounts} accounts in ${duration}ms`);

      // Performance assertion
      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.CLEANUP_OPERATION.acceptable);

      // Verify accounts are gone
      for (const result of successfulAccounts) {
        if (result.accountId) {
          const validationState = await MockAccountService.validateAccountState(result.accountId);
          expect(validationState).toBe(AccountValidationState.INVALID);
        }
      }
    }, 20000); // 20 second timeout
  });

  describe('Quick Test Account Creation', () => {
    it('should create quick admin test account', async () => {
      // Act
      console.log('⚡ Creating quick admin test account...');
      const result = await MockAccountService.createQuickTestAccount(MockAccountType.ADMIN, 'quick-admin');

      // Assert
      expect(result.success).toBe(true);
      expect(result.accountId).toBeDefined();
      expect(result.validationResults?.canAccessAdmin).toBe(true);

      if (result.accountId) {
        createdAccountIds.push(result.accountId);
      }
    }, 15000); // 15 second timeout

    it('should create quick super admin test account', async () => {
      // Act
      console.log('⚡ Creating quick super admin test account...');
      const result = await MockAccountService.createQuickTestAccount(MockAccountType.SUPER_ADMIN, 'quick-super');

      // Assert
      expect(result.success).toBe(true);
      expect(result.accountId).toBeDefined();
      expect(result.validationResults?.canAccessAdmin).toBe(true);

      if (result.accountId) {
        createdAccountIds.push(result.accountId);
      }
    }, 15000); // 15 second timeout

    it('should create quick test account with default settings', async () => {
      // Act
      console.log('⚡ Creating quick test account with defaults...');
      const result = await MockAccountService.createQuickTestAccount();

      // Assert
      expect(result.success).toBe(true);
      expect(result.accountId).toBeDefined();
      expect(result.validationResults?.canAccessAdmin).toBe(true); // Default is admin

      if (result.accountId) {
        createdAccountIds.push(result.accountId);
      }
    }, 15000); // 15 second timeout
  });

  describe('Statistics and Monitoring', () => {
    it('should provide accurate account statistics', async () => {
      // Arrange - Create a mix of account types
      const adminRequest = TestFixtureHelpers.createRandomTestRequest(MockAccountType.ADMIN);
      const superAdminRequest = TestFixtureHelpers.createRandomTestRequest(MockAccountType.SUPER_ADMIN);
      const userRequest = TestFixtureHelpers.createRandomTestRequest(MockAccountType.USER);

      // Act - Create Test Accounts
      console.log('📝 Creating diverse account types for stats test...');
      const [adminResult, superResult, userResult] = await Promise.all([
        MockAccountService.createMockAccount(adminRequest),
        MockAccountService.createMockAccount(superAdminRequest),
        MockAccountService.createMockAccount(userRequest)
      ]);

      // Track for cleanup
      [adminResult, superResult, userResult].forEach(result => {
        if (result.accountId) {
          createdAccountIds.push(result.accountId);
        }
      });

      // Act - Get Statistics
      console.log('📊 Retrieving account statistics...');
      const startTime = Date.now();
      const stats = await MockAccountService.getMockAccountStats();
      const duration = Date.now() - startTime;

      // Assert - Statistics Accuracy
      expect(stats.totalAccounts).toBeGreaterThanOrEqual(3);
      expect(stats.testAccountsCount).toBeGreaterThanOrEqual(3);
      expect(stats.accountsByRole[MockAccountType.ADMIN]).toBeGreaterThanOrEqual(1);
      expect(stats.accountsByRole[MockAccountType.SUPER_ADMIN]).toBeGreaterThanOrEqual(1);
      expect(stats.accountsByRole[MockAccountType.USER]).toBeGreaterThanOrEqual(1);
      expect(stats.lastCreated).toBeInstanceOf(Date);
      expect(stats.oldestAccount).toBeInstanceOf(Date);

      console.log('📊 Statistics:', {
        total: stats.totalAccounts,
        admins: stats.accountsByRole[MockAccountType.ADMIN],
        superAdmins: stats.accountsByRole[MockAccountType.SUPER_ADMIN],
        users: stats.accountsByRole[MockAccountType.USER]
      });

      // Performance assertion
      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.STATS_RETRIEVAL.acceptable);
    }, 25000); // 25 second timeout
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle duplicate email creation gracefully', async () => {
      // Arrange
      const testRequest = TestFixtureHelpers.createRandomTestRequest(MockAccountType.ADMIN);
      
      // Act - Create First Account
      console.log('📝 Creating first account...');
      const firstResult = await MockAccountService.createMockAccount(testRequest);
      expect(firstResult.success).toBe(true);
      
      if (firstResult.accountId) {
        createdAccountIds.push(firstResult.accountId);
      }

      // Act - Try to Create Duplicate
      console.log('📝 Attempting duplicate account creation...');
      const duplicateResult = await MockAccountService.createMockAccount(testRequest);

      // Assert - Duplicate Should Fail
      expect(duplicateResult.success).toBe(false);
      expect(duplicateResult.message).toContain('already registered');
    }, 20000); // 20 second timeout

    it('should handle invalid login credentials', async () => {
      // Arrange - Create valid account first
      const testRequest = TestFixtureHelpers.createRandomTestRequest(MockAccountType.ADMIN);
      
      console.log('📝 Creating account for invalid login test...');
      const createResult = await MockAccountService.createMockAccount(testRequest);
      expect(createResult.success).toBe(true);
      
      if (createResult.accountId) {
        createdAccountIds.push(createResult.accountId);
      }

      // Act - Test with Wrong Password
      console.log('🔐 Testing with invalid password...');
      const invalidCredentials = {
        email: testRequest.credentials.email,
        password: 'WrongPassword123!'
      };
      
      const loginResult = await MockAccountService.testAccountLogin(invalidCredentials);

      // Assert - Login Should Fail
      expect(loginResult.success).toBe(false);
      expect(loginResult.validationResults?.canLogin).toBe(false);
      expect(loginResult.message).toContain('Login failed');
    }, 20000); // 20 second timeout

    it('should validate nonexistent account as invalid', async () => {
      // Act
      console.log('🔍 Validating nonexistent account...');
      const validationState = await MockAccountService.validateAccountState('nonexistent-id-12345');

      // Assert
      expect(validationState).toBe(AccountValidationState.INVALID);
    }, 5000); // 5 second timeout
  });

  describe('Performance Stress Tests', () => {
    it('should handle stress test within limits', async () => {
      // Arrange
      const { maxAccounts, maxConcurrentOperations, timeoutMs } = INTEGRATION_TEST_DATA.STRESS_TEST_LIMITS;
      const accountRequests = TestFixtureHelpers.createBatchTestRequests(maxAccounts);

      // Act - Create Accounts in Batches
      console.log(`🔥 Stress test: Creating ${maxAccounts} accounts in batches of ${maxConcurrentOperations}...`);
      const startTime = Date.now();
      
      const results: any[] = [];
      for (let i = 0; i < accountRequests.length; i += maxConcurrentOperations) {
        const batch = accountRequests.slice(i, i + maxConcurrentOperations);
        const batchResults = await Promise.all(
          batch.map(request => MockAccountService.createMockAccount(request))
        );
        results.push(...batchResults);
        
        // Small delay between batches to avoid overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const duration = Date.now() - startTime;

      // Assert - Performance Within Limits
      expect(duration).toBeLessThan(timeoutMs);
      
      const successfulResults = results.filter(result => result.success);
      expect(successfulResults.length).toBeGreaterThan(maxAccounts * 0.8); // At least 80% success rate
      
      // Track for cleanup
      successfulResults.forEach(result => {
        if (result.accountId) {
          createdAccountIds.push(result.accountId);
        }
      });

      console.log(`✅ Stress test completed: ${successfulResults.length}/${maxAccounts} successful in ${duration}ms`);
    }, 60000); // 60 second timeout for stress test
  });
});