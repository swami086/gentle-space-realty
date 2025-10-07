import { MockAccountService } from '../services/mockAccountService';
import {
  MockAccountType,
  MockAccountCreationRequest,
  MockAccountCredentials,
  MockAccountTestResult,
  TestScenario,
  AccountValidationState
} from '../types/mockAccount';

/**
 * Test Account Helper Utilities
 * Provides convenient methods for test account management and validation
 */

export class TestAccountHelper {
  private static readonly DEFAULT_TEST_DOMAIN = 'test.gentlespacerealty.local';
  private static readonly DEFAULT_PASSWORD = 'TestHelper123!';

  /**
   * Quick account creation with sensible defaults
   */
  static async createTestAdmin(emailPrefix?: string): Promise<MockAccountTestResult> {
    console.log('🚀 TestAccountHelper: Creating test admin account...');
    
    return MockAccountService.createQuickTestAccount(
      MockAccountType.ADMIN,
      emailPrefix || `test-admin-${Date.now()}`
    );
  }

  static async createTestSuperAdmin(emailPrefix?: string): Promise<MockAccountTestResult> {
    console.log('🚀 TestAccountHelper: Creating test super admin account...');
    
    return MockAccountService.createQuickTestAccount(
      MockAccountType.SUPER_ADMIN,
      emailPrefix || `test-super-${Date.now()}`
    );
  }

  static async createTestUser(emailPrefix?: string): Promise<MockAccountTestResult> {
    console.log('🚀 TestAccountHelper: Creating test user account...');
    
    return MockAccountService.createQuickTestAccount(
      MockAccountType.USER,
      emailPrefix || `test-user-${Date.now()}`
    );
  }

  /**
   * Create multiple test accounts of different types
   */
  static async createTestSuite(): Promise<{
    admin: MockAccountTestResult;
    superAdmin: MockAccountTestResult;
    user: MockAccountTestResult;
    summary: {
      created: number;
      failed: number;
      adminAccess: number;
    };
  }> {
    console.log('🎯 TestAccountHelper: Creating complete test suite...');

    const timestamp = Date.now();
    const [admin, superAdmin, user] = await Promise.all([
      this.createTestAdmin(`suite-admin-${timestamp}`),
      this.createTestSuperAdmin(`suite-super-${timestamp}`),
      this.createTestUser(`suite-user-${timestamp}`)
    ]);

    const results = [admin, superAdmin, user];
    const created = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const adminAccess = results.filter(r => r.validationResults?.canAccessAdmin).length;

    const summary = {
      created,
      failed,
      adminAccess
    };

    console.log('📊 TestAccountHelper: Test suite summary:', summary);

    return {
      admin,
      superAdmin,
      user,
      summary
    };
  }

  /**
   * Batch account creation with role distribution
   */
  static async createAccountBatch(
    count: number,
    roles: MockAccountType[] = [MockAccountType.ADMIN, MockAccountType.SUPER_ADMIN, MockAccountType.USER]
  ): Promise<{
    results: MockAccountTestResult[];
    summary: {
      total: number;
      successful: number;
      failed: number;
      byRole: Record<MockAccountType, number>;
    };
  }> {
    console.log(`🔄 TestAccountHelper: Creating batch of ${count} accounts...`);

    const timestamp = Date.now();
    const requests: MockAccountCreationRequest[] = [];

    for (let i = 0; i < count; i++) {
      const role = roles[i % roles.length];
      const emailPrefix = `batch-${role}-${timestamp}-${i}`;
      
      requests.push({
        credentials: {
          email: `${emailPrefix}@${this.DEFAULT_TEST_DOMAIN}`,
          password: this.DEFAULT_PASSWORD
        },
        profile: {
          name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)} ${i + 1}`,
          role: role as 'admin' | 'super_admin' | 'user'
        },
        options: {
          skipEmailConfirmation: true
        }
      });
    }

    // Create accounts concurrently
    const results = await Promise.all(
      requests.map(request => MockAccountService.createMockAccount(request))
    );

    // Calculate summary
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    const byRole: Record<MockAccountType, number> = {
      [MockAccountType.ADMIN]: 0,
      [MockAccountType.SUPER_ADMIN]: 0,
      [MockAccountType.USER]: 0
    };

    requests.forEach((request, index) => {
      if (results[index]?.success) {
        const role = request.profile.role as MockAccountType;
        byRole[role]++;
      }
    });

    const summary = {
      total: count,
      successful,
      failed,
      byRole
    };

    console.log('📊 TestAccountHelper: Batch summary:', summary);

    return { results, summary };
  }

  /**
   * Test account validation with comprehensive checks
   * hasCorrectRole semantics: 
   * - If expectedRole is provided, checks if account role matches expectedRole
   * - If expectedRole is not provided, checks if role is one of the valid roles (admin/super_admin/user)
   * - hasCorrectRole from MockAccountService always returns true if login succeeds with valid profile
   */
  static async validateTestAccount(
    credentials: MockAccountCredentials,
    expectedRole?: MockAccountType
  ): Promise<{
    isValid: boolean;
    canLogin: boolean;
    hasExpectedRole: boolean;
    hasCorrectRole: boolean; // Always true if login succeeds with valid profile
    canAccessAdmin: boolean;
    actualRole?: string;
    details: MockAccountTestResult;
  }> {
    console.log('🔍 TestAccountHelper: Validating test account...', { 
      email: credentials.email,
      expectedRole: expectedRole || 'any'
    });

    const testResult = await MockAccountService.testAccountLogin(credentials);
    
    // hasCorrectRole from service means: login succeeded and user has a valid role in database
    const hasCorrectRole = testResult.validationResults?.hasCorrectRole || false;
    
    // hasExpectedRole means: if expectedRole was specified, does the actual role match it?
    let hasExpectedRole = true; // Default to true if no expected role
    let actualRole: string | undefined;
    
    if (expectedRole && testResult.success && testResult.accountId) {
      // We need to determine the actual role from the test result
      // The service doesn't return the actual role, so we infer from admin access
      if (testResult.validationResults?.canAccessAdmin) {
        actualRole = testResult.message.toLowerCase().includes('super') ? 'super_admin' : 'admin';
      } else {
        actualRole = 'user';
      }
      
      hasExpectedRole = actualRole === expectedRole;
    }

    const validation = {
      isValid: testResult.success,
      canLogin: testResult.validationResults?.canLogin || false,
      hasExpectedRole,
      hasCorrectRole, // This indicates successful login with valid database profile
      canAccessAdmin: testResult.validationResults?.canAccessAdmin || false,
      actualRole,
      details: testResult
    };

    console.log('📋 TestAccountHelper: Validation results:', {
      ...validation,
      semantics: {
        hasCorrectRole: 'Login succeeded with valid database profile',
        hasExpectedRole: expectedRole 
          ? `Actual role (${actualRole}) matches expected role (${expectedRole})`
          : 'No role expectation specified'
      }
    });

    return validation;
  }

  /**
   * Run account state validation scenarios
   * 
   * Note: This method validates account existence and state in the database,
   * but does not perform actual login testing since it doesn't have access to credentials.
   * For comprehensive login testing, use validateTestAccount() with credentials.
   */
  static async runAccountValidationScenarios(
    accountResults: MockAccountTestResult[]
  ): Promise<{
    scenarios: Array<{
      name: string;
      passed: boolean;
      duration: number;
      details: any;
    }>;
    summary: {
      total: number;
      passed: number;
      failed: number;
      averageDuration: number;
    };
  }> {
    console.log('🧪 TestAccountHelper: Running account validation scenarios...');

    const scenarios = [];
    const validAccounts = accountResults.filter(result => result.success && result.accountId);

    if (validAccounts.length === 0) {
      console.warn('⚠️ TestAccountHelper: No valid accounts to validate');
      return {
        scenarios: [],
        summary: { total: 0, passed: 0, failed: 0, averageDuration: 0 }
      };
    }

    // Scenario 1: Database Record Existence Check
    for (const account of validAccounts.slice(0, 3)) { // Test first 3 accounts
      const startTime = Date.now();
      try {
        const validationState = await MockAccountService.validateAccountState(account.accountId!);
        const duration = Date.now() - startTime;
        
        scenarios.push({
          name: `Database Record Existence - ${account.accountId}`,
          passed: validationState === AccountValidationState.VALID,
          duration,
          details: { accountId: account.accountId, validationState: validationState }
        });
      } catch (error) {
        scenarios.push({
          name: `Database Record Existence - ${account.accountId}`,
          passed: false,
          duration: Date.now() - startTime,
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
    }

    // Scenario 2: Account State Consistency Check
    for (const account of validAccounts.slice(0, 2)) { // Test first 2 accounts
      const startTime = Date.now();
      try {
        const validationState = await MockAccountService.validateAccountState(account.accountId!);
        const duration = Date.now() - startTime;
        
        scenarios.push({
          name: `Account State Consistency - ${account.accountId}`,
          passed: validationState === AccountValidationState.VALID,
          duration,
          details: { accountId: account.accountId, state: validationState }
        });
      } catch (error) {
        scenarios.push({
          name: `Account State Consistency - ${account.accountId}`,
          passed: false,
          duration: Date.now() - startTime,
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        });
      }
    }

    // Calculate summary
    const passed = scenarios.filter(s => s.passed).length;
    const failed = scenarios.filter(s => !s.passed).length;
    const averageDuration = scenarios.length > 0 
      ? scenarios.reduce((sum, s) => sum + s.duration, 0) / scenarios.length 
      : 0;

    const summary = {
      total: scenarios.length,
      passed,
      failed,
      averageDuration
    };

    console.log('📊 TestAccountHelper: Account validation scenarios summary:', summary);

    return { scenarios, summary };
  }

  /**
   * @deprecated Use runAccountValidationScenarios() instead.
   * This method name was misleading as it doesn't run comprehensive test scenarios.
   */
  static async runTestScenarios(
    accountResults: MockAccountTestResult[]
  ): Promise<{
    scenarios: Array<{
      name: string;
      passed: boolean;
      duration: number;
      details: any;
    }>;
    summary: {
      total: number;
      passed: number;
      failed: number;
      averageDuration: number;
    };
  }> {
    console.warn('⚠️ TestAccountHelper.runTestScenarios() is deprecated. Use runAccountValidationScenarios() instead.');
    return this.runAccountValidationScenarios(accountResults);
  }

  /**
   * Performance benchmark testing
   */
  static async benchmarkAccountOperations(iterations: number = 5): Promise<{
    creation: { average: number; min: number; max: number; };
    login: { average: number; min: number; max: number; };
    cleanup: { average: number; min: number; max: number; };
    overall: { average: number; total: number; };
  }> {
    console.log(`⚡ TestAccountHelper: Running performance benchmark (${iterations} iterations)...`);

    const creationTimes: number[] = [];
    const loginTimes: number[] = [];
    const cleanupTimes: number[] = [];
    const accountIds: string[] = [];

    const overallStart = Date.now();

    for (let i = 0; i < iterations; i++) {
      // Benchmark Account Creation
      const creationStart = Date.now();
      const createResult = await MockAccountService.createQuickTestAccount(
        MockAccountType.ADMIN,
        `benchmark-${Date.now()}-${i}`
      );
      creationTimes.push(Date.now() - creationStart);

      if (createResult.success && createResult.accountId) {
        accountIds.push(createResult.accountId);

        // Note: We can't benchmark login without credentials
        // This is a limitation of the helper pattern
        loginTimes.push(0); // Placeholder

        // Benchmark Cleanup
        const cleanupStart = Date.now();
        await MockAccountService.cleanupAccount(createResult.accountId);
        cleanupTimes.push(Date.now() - cleanupStart);
      } else {
        loginTimes.push(0);
        cleanupTimes.push(0);
      }
    }

    const overallTime = Date.now() - overallStart;

    const calculateStats = (times: number[]) => ({
      average: times.reduce((sum, time) => sum + time, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times)
    });

    const benchmark = {
      creation: calculateStats(creationTimes),
      login: calculateStats(loginTimes.filter(t => t > 0)), // Filter out placeholders
      cleanup: calculateStats(cleanupTimes),
      overall: {
        average: overallTime / iterations,
        total: overallTime
      }
    };

    console.log('📊 TestAccountHelper: Performance benchmark results:', benchmark);

    return benchmark;
  }

  /**
   * Clean up helper - remove all test accounts
   */
  static async cleanupAllTestAccounts(): Promise<{
    success: boolean;
    deletedCount: number;
    errors: string[];
    duration: number;
  }> {
    console.log('🧹 TestAccountHelper: Cleaning up all test accounts...');

    const startTime = Date.now();
    const cleanupResult = await MockAccountService.cleanupAllTestAccounts();
    const duration = Date.now() - startTime;

    const result = {
      success: cleanupResult.success,
      deletedCount: cleanupResult.deletedAccounts,
      errors: cleanupResult.errors,
      duration
    };

    console.log('✅ TestAccountHelper: Cleanup completed:', result);

    return result;
  }

  /**
   * Generate test report
   */
  static async generateTestReport(): Promise<{
    timestamp: string;
    stats: any;
    health: {
      canCreateAccounts: boolean;
      canCleanupAccounts: boolean;
      averageOperationTime: number;
    };
    recommendations: string[];
  }> {
    console.log('📋 TestAccountHelper: Generating comprehensive test report...');

    const timestamp = new Date().toISOString();
    
    // Get current stats
    const stats = await MockAccountService.getMockAccountStats();
    
    // Health checks
    const healthCheckStart = Date.now();
    
    // Test account creation
    const testAccount = await this.createTestAdmin('health-check');
    const canCreateAccounts = testAccount.success;
    
    let canCleanupAccounts = false;
    if (testAccount.success && testAccount.accountId) {
      canCleanupAccounts = await MockAccountService.cleanupAccount(testAccount.accountId);
    }
    
    const healthCheckTime = Date.now() - healthCheckStart;
    
    const health = {
      canCreateAccounts,
      canCleanupAccounts,
      averageOperationTime: healthCheckTime
    };

    // Generate recommendations
    const recommendations: string[] = [];
    
    if (stats.totalAccounts > 50) {
      recommendations.push('Consider running cleanup - high number of test accounts detected');
    }
    
    if (!canCreateAccounts) {
      recommendations.push('Account creation is failing - check Supabase configuration');
    }
    
    if (!canCleanupAccounts) {
      recommendations.push('Account cleanup is failing - check database permissions');
    }
    
    if (health.averageOperationTime > 5000) {
      recommendations.push('Operations are slow - consider optimizing database queries');
    }

    const report = {
      timestamp,
      stats,
      health,
      recommendations
    };

    console.log('📊 TestAccountHelper: Test report generated:', report);

    return report;
  }
}

/**
 * Convenience functions for common operations
 */

export const createQuickAdminAccount = (emailPrefix?: string) => 
  TestAccountHelper.createTestAdmin(emailPrefix);

export const createQuickSuperAdminAccount = (emailPrefix?: string) => 
  TestAccountHelper.createTestSuperAdmin(emailPrefix);

export const createQuickUserAccount = (emailPrefix?: string) => 
  TestAccountHelper.createTestUser(emailPrefix);

export const validateAccount = (credentials: MockAccountCredentials, expectedRole?: MockAccountType) =>
  TestAccountHelper.validateTestAccount(credentials, expectedRole);

export const cleanupAllAccounts = () => 
  TestAccountHelper.cleanupAllTestAccounts();

export const generateReport = () => 
  TestAccountHelper.generateTestReport();

/**
 * Type guards for test results
 */
export const isSuccessfulAccountResult = (result: MockAccountTestResult): result is MockAccountTestResult & { success: true; accountId: string } => {
  return result.success && !!result.accountId;
};

export const hasAdminAccess = (result: MockAccountTestResult): boolean => {
  return result.validationResults?.canAccessAdmin || false;
};

export const canLogin = (result: MockAccountTestResult): boolean => {
  return result.validationResults?.canLogin || false;
};