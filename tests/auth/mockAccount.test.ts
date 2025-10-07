import { describe, it, expect, beforeEach, afterEach, vi, MockedFunction } from 'vitest';
import { MockAccountService } from '../../src/services/mockAccountService';
import { supabase } from '../../src/lib/supabaseClient';
import {
  MockAccountType,
  AccountValidationState,
  MockAccountCreationRequest,
  MockAccountCredentials
} from '../../src/types/mockAccount';
import {
  TEST_CREDENTIALS,
  TEST_CREATION_REQUESTS,
  TEST_SCENARIOS,
  VALIDATION_STATE_FIXTURES,
  ERROR_SCENARIOS,
  PERFORMANCE_BENCHMARKS,
  TestFixtureHelpers
} from '../fixtures/mockAccounts.fixtures';

// Mock Supabase client
vi.mock('../../src/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn()
    },
    from: vi.fn(() => ({
      insert: vi.fn(),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        })),
        like: vi.fn(),
        delete: vi.fn(() => ({
          eq: vi.fn(),
          like: vi.fn()
        }))
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(),
        like: vi.fn()
      }))
    }))
  }
}));

// Mock SupabaseService
vi.mock('../../src/services/supabaseService');

describe('MockAccountService', () => {
  const mockSupabase = supabase as any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    console.log = vi.fn(); // Mock console.log to reduce noise in tests
    console.error = vi.fn(); // Mock console.error
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createMockAccount', () => {
    it('should successfully create a mock account with admin role', async () => {
      // Arrange
      const request = TEST_CREATION_REQUESTS.ADMIN;
      const mockAuthUser = { id: 'test-user-id-001', email: request.credentials.email };
      
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null
      });
      
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: mockAuthUser.id,
                email: mockAuthUser.email,
                role: 'admin',
                is_active: true
              },
              error: null
            })
          }))
        }))
      });

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null
      });

      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      // Act
      const result = await MockAccountService.createMockAccount(request);

      // Assert
      expect(result.success).toBe(true);
      expect(result.accountId).toBe(mockAuthUser.id);
      expect(result.message).toContain('Mock account created successfully');
      expect(result.validationResults?.canLogin).toBe(true);
      expect(result.validationResults?.hasCorrectRole).toBe(true);
      expect(result.validationResults?.canAccessAdmin).toBe(true);

      // Verify Supabase calls
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: request.credentials.email,
        password: request.credentials.password,
        options: {
          emailRedirectTo: undefined,
          data: {
            name: request.profile.name,
            role: request.profile.role,
            isTestAccount: true
          }
        }
      });
    });

    it('should handle auth creation failure', async () => {
      // Arrange
      const request = TEST_CREATION_REQUESTS.ADMIN;
      const authError = { message: 'Auth service unavailable' };
      
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: authError
      });

      // Act
      const result = await MockAccountService.createMockAccount(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Auth service unavailable');
      expect(result.error).toEqual(authError);
    });

    it('should generate random email when requested', async () => {
      // Arrange
      const request = TEST_CREATION_REQUESTS.RANDOM_EMAIL;
      const mockAuthUser = { id: 'test-user-id-002', email: 'generated@test.local' };
      
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null
      });

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { id: mockAuthUser.id, role: 'admin', is_active: true },
              error: null
            })
          }))
        }))
      });

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null
      });

      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      // Act
      const result = await MockAccountService.createMockAccount(request);

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: expect.stringContaining('@test.gentlespacerealty.local')
        })
      );
    });

    it('should clean up auth user when profile creation fails', async () => {
      // Arrange
      const request = TEST_CREATION_REQUESTS.ADMIN;
      const mockAuthUser = { id: 'test-user-id-003', email: request.credentials.email };
      const profileError = { message: 'Profile creation failed' };
      
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null
      });
      
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: profileError }),
        delete: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null })
        }))
      });

      // Act
      const result = await MockAccountService.createMockAccount(request);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Profile creation failed');
      expect(mockSupabase.from().delete().eq).toHaveBeenCalledWith('id', mockAuthUser.id);
    });

    it('should meet performance benchmarks for account creation', async () => {
      // Arrange
      const request = TEST_CREATION_REQUESTS.ADMIN;
      const mockAuthUser = { id: 'perf-test-001', email: request.credentials.email };
      
      // Setup fast mocks
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null
      });
      
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { id: mockAuthUser.id, role: 'admin', is_active: true },
              error: null
            })
          }))
        }))
      });

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null
      });

      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      // Act
      const startTime = Date.now();
      const result = await MockAccountService.createMockAccount(request);
      const duration = Date.now() - startTime;

      // Assert
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.ACCOUNT_CREATION.acceptable);
    }, 10000); // 10 second timeout
  });

  describe('testAccountLogin', () => {
    it('should successfully validate admin account login', async () => {
      // Arrange
      const credentials = TEST_CREDENTIALS.ADMIN;
      const mockAuthUser = { id: 'admin-001', email: credentials.email };
      
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null
      });
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: mockAuthUser.id,
                email: mockAuthUser.email,
                role: 'admin',
                is_active: true
              },
              error: null
            })
          }))
        }))
      });

      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      // Act
      const result = await MockAccountService.testAccountLogin(credentials);

      // Assert
      expect(result.success).toBe(true);
      expect(result.validationResults?.canLogin).toBe(true);
      expect(result.validationResults?.hasCorrectRole).toBe(true);
      expect(result.validationResults?.canAccessAdmin).toBe(true);
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it('should handle login failure with invalid credentials', async () => {
      // Arrange
      const credentials = TEST_CREDENTIALS.INVALID;
      const authError = { message: 'Invalid login credentials' };
      
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: authError
      });

      // Act
      const result = await MockAccountService.testAccountLogin(credentials);

      // Assert
      expect(result.success).toBe(false);
      expect(result.message).toContain('Login failed');
      expect(result.validationResults?.canLogin).toBe(false);
      expect(result.validationResults?.hasCorrectRole).toBe(false);
      expect(result.validationResults?.canAccessAdmin).toBe(false);
    });

    it('should correctly identify non-admin user role access', async () => {
      // Arrange
      const credentials = TEST_CREDENTIALS.USER;
      const mockAuthUser = { id: 'user-001', email: credentials.email };
      
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null
      });
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: mockAuthUser.id,
                email: mockAuthUser.email,
                role: 'user', // Regular user role
                is_active: true
              },
              error: null
            })
          }))
        }))
      });

      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      // Act
      const result = await MockAccountService.testAccountLogin(credentials);

      // Assert
      expect(result.success).toBe(true);
      expect(result.validationResults?.canLogin).toBe(true);
      expect(result.validationResults?.hasCorrectRole).toBe(true);
      expect(result.validationResults?.canAccessAdmin).toBe(false); // User cannot access admin
    });

    it('should meet performance benchmarks for login testing', async () => {
      // Arrange
      const credentials = TEST_CREDENTIALS.ADMIN;
      const mockAuthUser = { id: 'perf-login-001', email: credentials.email };
      
      // Setup fast mocks
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null
      });
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { id: mockAuthUser.id, role: 'admin', is_active: true },
              error: null
            })
          }))
        }))
      });

      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      // Act
      const startTime = Date.now();
      const result = await MockAccountService.testAccountLogin(credentials);
      const duration = Date.now() - startTime;

      // Assert
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.LOGIN_TEST.acceptable);
    }, 5000); // 5 second timeout
  });

  describe('createQuickTestAccount', () => {
    it('should create quick admin test account with default settings', async () => {
      // Arrange
      const mockAuthUser = { id: 'quick-admin-001', email: 'test@test.local' };
      
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null
      });
      
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { id: mockAuthUser.id, role: 'admin', is_active: true },
              error: null
            })
          }))
        }))
      });

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null
      });

      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      // Act
      const result = await MockAccountService.createQuickTestAccount();

      // Assert
      expect(result.success).toBe(true);
      expect(result.accountId).toBe(mockAuthUser.id);
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: expect.stringContaining('@test.gentlespacerealty.local'),
          password: 'TestPass123!'
        })
      );
    });

    it('should create quick test account with custom role', async () => {
      // Arrange
      const role = MockAccountType.SUPER_ADMIN;
      const mockAuthUser = { id: 'quick-super-001', email: 'super@test.local' };
      
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null
      });
      
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockResolvedValue({ error: null }),
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { id: mockAuthUser.id, role: 'super_admin', is_active: true },
              error: null
            })
          }))
        }))
      });

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null
      });

      mockSupabase.auth.signOut.mockResolvedValue({ error: null });

      // Act
      const result = await MockAccountService.createQuickTestAccount(role, 'custom-super');

      // Assert
      expect(result.success).toBe(true);
      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'custom-super@test.gentlespacerealty.local',
          options: expect.objectContaining({
            data: expect.objectContaining({
              name: 'Test Super_admin',
              role: 'super_admin'
            })
          })
        })
      );
    });
  });

  describe('cleanupAccount', () => {
    it('should successfully cleanup test account', async () => {
      // Arrange
      const userId = 'cleanup-test-001';
      
      mockSupabase.from.mockReturnValue({
        delete: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ error: null })
        }))
      });

      // Act
      const result = await MockAccountService.cleanupAccount(userId);

      // Assert
      expect(result).toBe(true);
      expect(mockSupabase.from().delete().eq).toHaveBeenCalledWith('id', userId);
    });

    it('should handle cleanup errors gracefully', async () => {
      // Arrange
      const userId = 'cleanup-error-001';
      const cleanupError = new Error('Database connection failed');
      
      mockSupabase.from.mockReturnValue({
        delete: vi.fn(() => ({
          eq: vi.fn().mockRejectedValue(cleanupError)
        }))
      });

      // Act
      const result = await MockAccountService.cleanupAccount(userId);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('cleanupAllTestAccounts', () => {
    it('should successfully cleanup multiple test accounts', async () => {
      // Arrange
      const testAccounts = [
        { id: 'test-1', email: 'test1@test.gentlespacerealty.local' },
        { id: 'test-2', email: 'test2@test.gentlespacerealty.local' }
      ];
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: testAccounts,
          error: null
        }),
        delete: vi.fn(() => ({
          like: vi.fn().mockResolvedValue({ error: null })
        }))
      });

      // Act
      const result = await MockAccountService.cleanupAllTestAccounts();

      // Assert
      expect(result.success).toBe(true);
      expect(result.deletedAccounts).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should handle no test accounts to cleanup', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [],
          error: null
        })
      });

      // Act
      const result = await MockAccountService.cleanupAllTestAccounts();

      // Assert
      expect(result.success).toBe(true);
      expect(result.deletedAccounts).toBe(0);
      expect(result.errors).toHaveLength(0);
    });

    it('should meet performance benchmarks for cleanup operations', async () => {
      // Arrange
      const testAccounts = [
        { id: 'perf-test-1', email: 'perf1@test.gentlespacerealty.local' },
        { id: 'perf-test-2', email: 'perf2@test.gentlespacerealty.local' }
      ];
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: testAccounts,
          error: null
        }),
        delete: vi.fn(() => ({
          like: vi.fn().mockResolvedValue({ error: null })
        }))
      });

      // Act
      const startTime = Date.now();
      const result = await MockAccountService.cleanupAllTestAccounts();
      const duration = Date.now() - startTime;

      // Assert
      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.CLEANUP_OPERATION.acceptable);
    }, 8000); // 8 second timeout
  });

  describe('getMockAccountStats', () => {
    it('should return comprehensive account statistics', async () => {
      // Arrange
      const mockAccounts = [
        { role: 'admin', email: 'admin1@test.gentlespacerealty.local', created_at: '2024-01-01T00:00:00Z' },
        { role: 'admin', email: 'admin2@test.gentlespacerealty.local', created_at: '2024-01-02T00:00:00Z' },
        { role: 'super_admin', email: 'super1@test.gentlespacerealty.local', created_at: '2024-01-03T00:00:00Z' },
        { role: 'user', email: 'user1@test.gentlespacerealty.local', created_at: '2024-01-04T00:00:00Z' }
      ];
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          like: vi.fn().mockResolvedValue({
            data: mockAccounts,
            error: null
          })
        }))
      });

      // Act
      const result = await MockAccountService.getMockAccountStats();

      // Assert
      expect(result.totalAccounts).toBe(4);
      expect(result.testAccountsCount).toBe(4);
      expect(result.accountsByRole[MockAccountType.ADMIN]).toBe(2);
      expect(result.accountsByRole[MockAccountType.SUPER_ADMIN]).toBe(1);
      expect(result.accountsByRole[MockAccountType.USER]).toBe(1);
      expect(result.oldestAccount).toEqual(new Date('2024-01-01T00:00:00Z'));
      expect(result.lastCreated).toEqual(new Date('2024-01-04T00:00:00Z'));
    });

    it('should handle empty account list', async () => {
      // Arrange
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          like: vi.fn().mockResolvedValue({
            data: [],
            error: null
          })
        }))
      });

      // Act
      const result = await MockAccountService.getMockAccountStats();

      // Assert
      expect(result.totalAccounts).toBe(0);
      expect(result.testAccountsCount).toBe(0);
      expect(result.accountsByRole[MockAccountType.ADMIN]).toBe(0);
      expect(result.accountsByRole[MockAccountType.SUPER_ADMIN]).toBe(0);
      expect(result.accountsByRole[MockAccountType.USER]).toBe(0);
    });

    it('should meet performance benchmarks for stats retrieval', async () => {
      // Arrange
      const mockAccounts = [
        { role: 'admin', email: 'perf1@test.gentlespacerealty.local', created_at: '2024-01-01T00:00:00Z' }
      ];
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          like: vi.fn().mockResolvedValue({
            data: mockAccounts,
            error: null
          })
        }))
      });

      // Act
      const startTime = Date.now();
      const result = await MockAccountService.getMockAccountStats();
      const duration = Date.now() - startTime;

      // Assert
      expect(result.totalAccounts).toBe(1);
      expect(duration).toBeLessThan(PERFORMANCE_BENCHMARKS.STATS_RETRIEVAL.acceptable);
    }, 3000); // 3 second timeout
  });

  describe('validateAccountState', () => {
    it('should validate active recent account as VALID', async () => {
      // Arrange
      const userId = 'valid-account-001';
      const fixture = VALIDATION_STATE_FIXTURES[AccountValidationState.VALID];
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: userId,
                email: fixture.mockAccount.email,
                is_active: fixture.mockAccount.isActive,
                created_at: fixture.mockAccount.createdAt
              },
              error: null
            })
          }))
        }))
      });

      // Act
      const result = await MockAccountService.validateAccountState(userId);

      // Assert
      expect(result).toBe(AccountValidationState.VALID);
    });

    it('should validate inactive account as INVALID', async () => {
      // Arrange
      const userId = 'invalid-account-001';
      const fixture = VALIDATION_STATE_FIXTURES[AccountValidationState.INVALID];
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: userId,
                email: fixture.mockAccount.email,
                is_active: fixture.mockAccount.isActive,
                created_at: fixture.mockAccount.createdAt
              },
              error: null
            })
          }))
        }))
      });

      // Act
      const result = await MockAccountService.validateAccountState(userId);

      // Assert
      expect(result).toBe(AccountValidationState.INVALID);
    });

    it('should validate old account as CLEANUP_REQUIRED', async () => {
      // Arrange
      const userId = 'old-account-001';
      const fixture = VALIDATION_STATE_FIXTURES[AccountValidationState.CLEANUP_REQUIRED];
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: userId,
                email: fixture.mockAccount.email,
                is_active: fixture.mockAccount.isActive,
                created_at: fixture.mockAccount.createdAt
              },
              error: null
            })
          }))
        }))
      });

      // Act
      const result = await MockAccountService.validateAccountState(userId);

      // Assert
      expect(result).toBe(AccountValidationState.CLEANUP_REQUIRED);
    });

    it('should handle account not found as INVALID', async () => {
      // Arrange
      const userId = 'nonexistent-account';
      
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Account not found' }
            })
          }))
        }))
      });

      // Act
      const result = await MockAccountService.validateAccountState(userId);

      // Assert
      expect(result).toBe(AccountValidationState.INVALID);
    });
  });
});