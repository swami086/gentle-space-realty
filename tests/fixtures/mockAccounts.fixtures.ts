import {
  MockAccountCredentials,
  MockAccountCreationRequest,
  MockAccount,
  MockAccountType,
  TestScenario,
  AccountValidationState
} from '../../src/types/mockAccount';

/**
 * Test fixtures for mock account testing
 * Used across unit tests, integration tests, and E2E tests
 */

export const TEST_CREDENTIALS: Record<string, MockAccountCredentials> = {
  ADMIN: {
    email: 'test-admin@test.gentlespacerealty.local',
    password: 'TestAdminPass123!'
  },
  SUPER_ADMIN: {
    email: 'test-superadmin@test.gentlespacerealty.local',
    password: 'TestSuperPass123!'
  },
  USER: {
    email: 'test-user@test.gentlespacerealty.local',
    password: 'TestUserPass123!'
  },
  INVALID: {
    email: 'invalid@test.gentlespacerealty.local',
    password: 'WrongPassword123!'
  }
};

export const TEST_CREATION_REQUESTS: Record<string, MockAccountCreationRequest> = {
  ADMIN: {
    credentials: TEST_CREDENTIALS.ADMIN,
    profile: {
      name: 'Test Admin User',
      role: 'admin'
    },
    options: {
      skipEmailConfirmation: true
    }
  },
  SUPER_ADMIN: {
    credentials: TEST_CREDENTIALS.SUPER_ADMIN,
    profile: {
      name: 'Test Super Admin User',
      role: 'super_admin'
    },
    options: {
      skipEmailConfirmation: true
    }
  },
  USER: {
    credentials: TEST_CREDENTIALS.USER,
    profile: {
      name: 'Test Regular User',
      role: 'user'
    },
    options: {
      skipEmailConfirmation: true
    }
  },
  RANDOM_EMAIL: {
    credentials: {
      email: '', // Will be generated
      password: 'TestRandomPass123!'
    },
    profile: {
      name: 'Test Random User',
      role: 'admin'
    },
    options: {
      skipEmailConfirmation: true,
      generateRandomEmail: true
    }
  },
  CUSTOM_DOMAIN: {
    credentials: {
      email: '', // Will be generated
      password: 'TestCustomPass123!'
    },
    profile: {
      name: 'Test Custom Domain User',
      role: 'admin'
    },
    options: {
      skipEmailConfirmation: true,
      generateRandomEmail: true,
      emailDomain: 'custom.test.local'
    }
  }
};

export const MOCK_ACCOUNTS: Record<string, MockAccount> = {
  ADMIN: {
    id: 'test-admin-id-001',
    email: TEST_CREDENTIALS.ADMIN.email,
    name: 'Test Admin User',
    role: 'admin',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    credentials: TEST_CREDENTIALS.ADMIN,
    isTestAccount: true,
    lastLoginAt: '2024-01-01T12:00:00Z'
  },
  SUPER_ADMIN: {
    id: 'test-superadmin-id-001',
    email: TEST_CREDENTIALS.SUPER_ADMIN.email,
    name: 'Test Super Admin User',
    role: 'super_admin',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    credentials: TEST_CREDENTIALS.SUPER_ADMIN,
    isTestAccount: true,
    lastLoginAt: '2024-01-01T12:00:00Z'
  },
  INACTIVE_USER: {
    id: 'test-inactive-id-001',
    email: 'inactive@test.gentlespacerealty.local',
    name: 'Test Inactive User',
    role: 'user',
    isActive: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    credentials: {
      email: 'inactive@test.gentlespacerealty.local',
      password: 'InactivePass123!'
    },
    isTestAccount: true
  }
};

export const TEST_SCENARIOS: Record<TestScenario, {
  name: string;
  description: string;
  credentials: MockAccountCredentials;
  expectedResult: {
    canLogin: boolean;
    hasCorrectRole: boolean;
    canAccessAdmin: boolean;
  };
}> = {
  [TestScenario.BASIC_LOGIN]: {
    name: 'Basic Login Test',
    description: 'Test basic login functionality with valid credentials',
    credentials: TEST_CREDENTIALS.ADMIN,
    expectedResult: {
      canLogin: true,
      hasCorrectRole: true,
      canAccessAdmin: true
    }
  },
  [TestScenario.ADMIN_ACCESS]: {
    name: 'Admin Access Test',
    description: 'Test admin role access to admin portal',
    credentials: TEST_CREDENTIALS.ADMIN,
    expectedResult: {
      canLogin: true,
      hasCorrectRole: true,
      canAccessAdmin: true
    }
  },
  [TestScenario.ROLE_VERIFICATION]: {
    name: 'Role Verification Test',
    description: 'Test role-based access control',
    credentials: TEST_CREDENTIALS.SUPER_ADMIN,
    expectedResult: {
      canLogin: true,
      hasCorrectRole: true,
      canAccessAdmin: true
    }
  },
  [TestScenario.SESSION_PERSISTENCE]: {
    name: 'Session Persistence Test',
    description: 'Test session persistence across page reloads',
    credentials: TEST_CREDENTIALS.ADMIN,
    expectedResult: {
      canLogin: true,
      hasCorrectRole: true,
      canAccessAdmin: true
    }
  },
  [TestScenario.PASSWORD_VALIDATION]: {
    name: 'Password Validation Test',
    description: 'Test password validation and incorrect password handling',
    credentials: TEST_CREDENTIALS.INVALID,
    expectedResult: {
      canLogin: false,
      hasCorrectRole: false,
      canAccessAdmin: false
    }
  }
};

export const VALIDATION_STATE_FIXTURES: Record<AccountValidationState, {
  description: string;
  mockAccount: Partial<MockAccount>;
  expectedState: AccountValidationState;
}> = {
  [AccountValidationState.VALID]: {
    description: 'Valid active account created recently',
    mockAccount: {
      id: 'valid-account-001',
      email: 'valid@test.gentlespacerealty.local',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    expectedState: AccountValidationState.VALID
  },
  [AccountValidationState.INVALID]: {
    description: 'Invalid inactive account',
    mockAccount: {
      id: 'invalid-account-001',
      email: 'invalid@test.gentlespacerealty.local',
      isActive: false,
      createdAt: new Date().toISOString()
    },
    expectedState: AccountValidationState.INVALID
  },
  [AccountValidationState.CLEANUP_REQUIRED]: {
    description: 'Old account requiring cleanup (>30 days)',
    mockAccount: {
      id: 'old-account-001',
      email: 'old@test.gentlespacerealty.local',
      isActive: true,
      createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString() // 35 days ago
    },
    expectedState: AccountValidationState.CLEANUP_REQUIRED
  },
  [AccountValidationState.PENDING]: {
    description: 'Pending account state',
    mockAccount: {
      id: 'pending-account-001',
      email: 'pending@test.gentlespacerealty.local',
      isActive: true,
      createdAt: new Date().toISOString()
    },
    expectedState: AccountValidationState.PENDING
  },
  [AccountValidationState.EXPIRED]: {
    description: 'Expired account state',
    mockAccount: {
      id: 'expired-account-001',
      email: 'expired@test.gentlespacerealty.local',
      isActive: false,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days ago
    },
    expectedState: AccountValidationState.EXPIRED
  }
};

export const ERROR_SCENARIOS = {
  SUPABASE_AUTH_ERROR: {
    name: 'Supabase Auth Error',
    description: 'Simulate Supabase authentication service error',
    errorMessage: 'Database error querying schema',
    errorCode: 'auth_database_error'
  },
  NETWORK_ERROR: {
    name: 'Network Connection Error',
    description: 'Simulate network connectivity issues',
    errorMessage: 'Network request failed',
    errorCode: 'network_error'
  },
  INVALID_CREDENTIALS: {
    name: 'Invalid Credentials Error',
    description: 'Test invalid email/password combinations',
    errorMessage: 'Invalid login credentials',
    errorCode: 'invalid_credentials'
  },
  ROLE_ACCESS_DENIED: {
    name: 'Role Access Denied',
    description: 'Test insufficient role permissions',
    errorMessage: 'Insufficient permissions for admin access',
    errorCode: 'access_denied'
  },
  ACCOUNT_INACTIVE: {
    name: 'Account Inactive Error',
    description: 'Test inactive account login attempt',
    errorMessage: 'Account is inactive',
    errorCode: 'account_inactive'
  }
};

export const PERFORMANCE_BENCHMARKS = {
  ACCOUNT_CREATION: {
    target: 2000, // 2 seconds
    acceptable: 5000, // 5 seconds
    name: 'Account Creation Time'
  },
  LOGIN_TEST: {
    target: 1000, // 1 second
    acceptable: 3000, // 3 seconds
    name: 'Login Test Time'
  },
  CLEANUP_OPERATION: {
    target: 1500, // 1.5 seconds
    acceptable: 4000, // 4 seconds
    name: 'Cleanup Operation Time'
  },
  STATS_RETRIEVAL: {
    target: 500, // 500ms
    acceptable: 1500, // 1.5 seconds
    name: 'Stats Retrieval Time'
  }
};

export const INTEGRATION_TEST_DATA = {
  BULK_ACCOUNT_CREATION: {
    count: 5,
    roles: [MockAccountType.ADMIN, MockAccountType.SUPER_ADMIN, MockAccountType.USER],
    batchSize: 2
  },
  CONCURRENT_LOGIN_TESTS: {
    count: 3,
    accounts: [
      TEST_CREDENTIALS.ADMIN,
      TEST_CREDENTIALS.SUPER_ADMIN,
      TEST_CREDENTIALS.USER
    ]
  },
  STRESS_TEST_LIMITS: {
    maxAccounts: 10,
    maxConcurrentOperations: 5,
    timeoutMs: 30000
  }
};

/**
 * Helper functions for test fixtures
 */
export const TestFixtureHelpers = {
  /**
   * Generate a random test email
   */
  generateRandomTestEmail: (domain = 'test.gentlespacerealty.local'): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `test-${timestamp}-${random}@${domain}`;
  },

  /**
   * Create a test account request with random data
   */
  createRandomTestRequest: (role: MockAccountType = MockAccountType.ADMIN): MockAccountCreationRequest => ({
    credentials: {
      email: TestFixtureHelpers.generateRandomTestEmail(),
      password: 'TestRandomPass123!'
    },
    profile: {
      name: `Test ${role.charAt(0).toUpperCase() + role.slice(1)} ${Date.now()}`,
      role: role as 'admin' | 'super_admin' | 'user'
    },
    options: {
      skipEmailConfirmation: true
    }
  }),

  /**
   * Create multiple test requests for batch operations
   */
  createBatchTestRequests: (count: number, roles?: MockAccountType[]): MockAccountCreationRequest[] => {
    const requests: MockAccountCreationRequest[] = [];
    const useRoles = roles || [MockAccountType.ADMIN, MockAccountType.SUPER_ADMIN, MockAccountType.USER];
    
    for (let i = 0; i < count; i++) {
      const role = useRoles[i % useRoles.length];
      requests.push(TestFixtureHelpers.createRandomTestRequest(role));
    }
    
    return requests;
  },

  /**
   * Clean test data for assertions
   */
  sanitizeForAssertion: (data: any): any => {
    if (data && typeof data === 'object') {
      const cleaned = { ...data };
      delete cleaned.id;
      delete cleaned.createdAt;
      delete cleaned.updatedAt;
      delete cleaned.lastLoginAt;
      return cleaned;
    }
    return data;
  },

  /**
   * Create mock Supabase responses
   */
  createMockSupabaseResponse: (success: boolean, data?: any, error?: any) => ({
    data: success ? data : null,
    error: success ? null : error
  })
};