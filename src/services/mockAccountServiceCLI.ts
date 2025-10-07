import { supabase } from '../lib/supabaseClientCLI';
import { supabaseAdmin } from '../lib/supabaseAdminClientCLI';
import { 
  MockAccountCredentials, 
  MockAccountCreationRequest, 
  MockAccount, 
  MockAccountTestResult,
  MockAccountCleanupResult,
  MockAccountType,
  MockAccountFilter,
  MockAccountStats,
  TestScenario,
  AccountValidationState
} from '../types/mockAccount';

/**
 * CLI-compatible Mock Account Service
 * Uses Node.js compatible Supabase clients
 */
export class MockAccountService {
  private static readonly TEST_EMAIL_DOMAIN = 'test.gentlespacerealty.local';
  private static readonly DEFAULT_PASSWORD = 'TestPass123!';
  
  /**
   * Create a mock account with Supabase authentication
   */
  static async createMockAccount(request: MockAccountCreationRequest): Promise<MockAccountTestResult> {
    console.log('🧪 MockAccountService (CLI): Creating mock account...', { email: request.credentials.email });
    
    try {
      const { credentials, profile, options = {} } = request;
      
      // Generate email if requested
      const email = options.generateRandomEmail 
        ? this.generateTestEmail(options.emailDomain)
        : credentials.email;
      
      const finalCredentials = { ...credentials, email };
      
      // Create user in Supabase Auth - use admin endpoint to skip email confirmation if requested
      const { data: authData, error: authError } = request.options?.skipEmailConfirmation && supabaseAdmin
        ? await supabaseAdmin.auth.admin.createUser({
            email: finalCredentials.email,
            password: finalCredentials.password,
            email_confirm: true, // Skip email confirmation
            user_metadata: {
              name: profile.name,
              role: profile.role,
              isTestAccount: true
            }
          })
        : await supabase.auth.signUp({
            email: finalCredentials.email,
            password: finalCredentials.password,
            options: {
              data: {
                name: profile.name,
                role: profile.role,
                isTestAccount: true
              }
            }
          });

      if (authError) {
        console.error('❌ MockAccountService (CLI): Auth creation failed:', authError.message);
        return {
          success: false,
          message: `Authentication creation failed: ${authError.message}`,
          error: new Error(authError.message)
        };
      }

      if (!authData.user) {
        console.error('❌ MockAccountService (CLI): No user returned from auth creation');
        return {
          success: false,
          message: 'No user data returned from authentication service'
        };
      }

      console.log('✅ MockAccountService (CLI): Auth user created:', authData.user.id);

      // Create profile in database
      const profileData = {
        id: authData.user.id,
        email: finalCredentials.email,
        name: profile.name,
        role: profile.role,
        is_test_account: true,
        created_at: new Date().toISOString()
      };

      const { data: profileResult, error: profileError } = await supabase
        .from('users')
        .insert([profileData])
        .select()
        .single();

      if (profileError) {
        console.error('❌ MockAccountService (CLI): Profile creation failed:', profileError.message);
        
        // Cleanup auth user if profile creation failed
        try {
          if (supabaseAdmin) {
            await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
            console.log('🧹 MockAccountService (CLI): Cleaned up auth user after profile creation failure');
          }
        } catch (cleanupError) {
          console.error('⚠️ MockAccountService (CLI): Failed to cleanup auth user:', cleanupError);
        }
        
        return {
          success: false,
          message: `Profile creation failed: ${profileError.message}`,
          error: new Error(profileError.message)
        };
      }

      console.log('✅ MockAccountService (CLI): Profile created successfully');

      // Test login to validate account
      const loginResult = await this.testAccountLogin(finalCredentials);
      
      return {
        success: true,
        accountId: authData.user.id,
        message: `Mock ${profile.role} account created successfully`,
        validationResults: loginResult.validationResults
      };
      
    } catch (error) {
      console.error('❌ MockAccountService (CLI): Unexpected error:', error);
      return {
        success: false,
        message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  /**
   * Test account login and validation
   */
  static async testAccountLogin(credentials: MockAccountCredentials): Promise<MockAccountTestResult> {
    console.log('🔍 MockAccountService (CLI): Testing account login...', { email: credentials.email });
    
    try {
      // Attempt login
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (loginError) {
        console.error('❌ MockAccountService (CLI): Login failed:', loginError.message);
        return {
          success: false,
          message: `Login failed: ${loginError.message}`,
          validationResults: {
            canLogin: false,
            hasCorrectRole: false,
            canAccessAdmin: false
          },
          error: new Error(loginError.message)
        };
      }

      if (!loginData.user) {
        console.error('❌ MockAccountService (CLI): No user data returned from login');
        return {
          success: false,
          message: 'No user data returned from login',
          validationResults: {
            canLogin: false,
            hasCorrectRole: false,
            canAccessAdmin: false
          }
        };
      }

      console.log('✅ MockAccountService (CLI): Login successful');

      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', loginData.user.id)
        .single();

      if (profileError) {
        console.error('❌ MockAccountService (CLI): Failed to fetch profile:', profileError.message);
        return {
          success: false,
          message: `Failed to fetch user profile: ${profileError.message}`,
          validationResults: {
            canLogin: true,
            hasCorrectRole: false,
            canAccessAdmin: false
          },
          error: new Error(profileError.message)
        };
      }

      const hasCorrectRole = !!profileData?.role;
      const canAccessAdmin = profileData?.role === 'admin' || profileData?.role === 'super_admin';

      console.log('📊 MockAccountService (CLI): Login validation completed:', {
        canLogin: true,
        hasCorrectRole,
        canAccessAdmin,
        role: profileData?.role
      });

      // Sign out after testing
      await supabase.auth.signOut();

      return {
        success: true,
        accountId: loginData.user.id,
        message: `Login test successful for ${profileData?.role || 'unknown'} account`,
        validationResults: {
          canLogin: true,
          hasCorrectRole,
          canAccessAdmin
        }
      };
      
    } catch (error) {
      console.error('❌ MockAccountService (CLI): Login test error:', error);
      return {
        success: false,
        message: `Login test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        validationResults: {
          canLogin: false,
          hasCorrectRole: false,
          canAccessAdmin: false
        },
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  /**
   * Create quick test account with minimal configuration
   */
  static async createQuickTestAccount(
    accountType: MockAccountType, 
    emailPrefix?: string
  ): Promise<MockAccountTestResult> {
    const timestamp = Date.now();
    const email = emailPrefix 
      ? `${emailPrefix}@${this.TEST_EMAIL_DOMAIN}`
      : `${accountType}-${timestamp}@${this.TEST_EMAIL_DOMAIN}`;
    
    const request: MockAccountCreationRequest = {
      credentials: {
        email,
        password: this.DEFAULT_PASSWORD
      },
      profile: {
        name: `Test ${accountType.charAt(0).toUpperCase() + accountType.slice(1)} ${timestamp}`,
        role: accountType as 'admin' | 'super_admin' | 'user'
      },
      options: {
        skipEmailConfirmation: true
      }
    };

    return this.createMockAccount(request);
  }

  /**
   * Cleanup single account
   */
  static async cleanupAccount(accountId: string): Promise<boolean> {
    console.log('🧹 MockAccountService (CLI): Cleaning up account...', accountId);
    
    try {
      if (!supabaseAdmin) {
        console.error('❌ MockAccountService (CLI): Admin client not available for cleanup');
        return false;
      }

      // Use the database function for RLS-safe cleanup
      const { error: cleanupError } = await supabaseAdmin
        .rpc('cleanup_test_account', { target_user_id: accountId });

      if (cleanupError) {
        console.error('❌ MockAccountService (CLI): Cleanup failed:', cleanupError.message);
        return false;
      }

      console.log('✅ MockAccountService (CLI): Account cleaned up successfully');
      return true;
      
    } catch (error) {
      console.error('❌ MockAccountService (CLI): Cleanup error:', error);
      return false;
    }
  }

  /**
   * Cleanup all test accounts
   */
  static async cleanupAllTestAccounts(): Promise<MockAccountCleanupResult> {
    console.log('🧹 MockAccountService (CLI): Cleaning up all test accounts...');
    
    try {
      if (!supabaseAdmin) {
        return {
          success: false,
          deletedAccounts: 0,
          errors: ['Admin client not available for cleanup operations']
        };
      }

      // Get all test accounts
      const { data: testAccounts, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('id, email')
        .eq('is_test_account', true);

      if (fetchError) {
        return {
          success: false,
          deletedAccounts: 0,
          errors: [`Failed to fetch test accounts: ${fetchError.message}`]
        };
      }

      if (!testAccounts || testAccounts.length === 0) {
        console.log('ℹ️ MockAccountService (CLI): No test accounts to clean up');
        return {
          success: true,
          deletedAccounts: 0,
          errors: []
        };
      }

      console.log(`🔍 MockAccountService (CLI): Found ${testAccounts.length} test accounts to clean up`);

      let deletedCount = 0;
      const errors: string[] = [];

      // Clean up each account
      for (const account of testAccounts) {
        const success = await this.cleanupAccount(account.id);
        if (success) {
          deletedCount++;
        } else {
          errors.push(`Failed to delete account: ${account.email}`);
        }
      }

      const result = {
        success: errors.length === 0,
        deletedAccounts: deletedCount,
        errors
      };

      console.log('📊 MockAccountService (CLI): Cleanup completed:', result);
      return result;
      
    } catch (error) {
      console.error('❌ MockAccountService (CLI): Cleanup all error:', error);
      return {
        success: false,
        deletedAccounts: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get mock account statistics
   */
  static async getMockAccountStats(): Promise<MockAccountStats> {
    console.log('📊 MockAccountService (CLI): Fetching account statistics...');
    
    try {
      // Get total accounts
      const { data: allAccounts, error: allError } = await supabase
        .from('users')
        .select('role, is_test_account, created_at')
        .order('created_at', { ascending: true });

      if (allError) {
        throw new Error(`Failed to fetch accounts: ${allError.message}`);
      }

      const accounts = allAccounts || [];
      const totalAccounts = accounts.length;
      const testAccountsCount = accounts.filter(acc => acc.is_test_account).length;

      // Count by role
      const accountsByRole = accounts.reduce((acc, account) => {
        const role = account.role as MockAccountType;
        if (role && Object.values(MockAccountType).includes(role)) {
          acc[role] = (acc[role] || 0) + 1;
        }
        return acc;
      }, {} as Record<MockAccountType, number>);

      // Ensure all roles have counts
      Object.values(MockAccountType).forEach(role => {
        if (!(role in accountsByRole)) {
          accountsByRole[role] = 0;
        }
      });

      // Get date range
      const dates = accounts.map(acc => new Date(acc.created_at));
      const oldestAccount = dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : undefined;
      const lastCreated = dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : undefined;

      const stats: MockAccountStats = {
        totalAccounts,
        accountsByRole,
        testAccountsCount,
        oldestAccount,
        lastCreated
      };

      console.log('📊 MockAccountService (CLI): Statistics loaded:', stats);
      return stats;
      
    } catch (error) {
      console.error('❌ MockAccountService (CLI): Failed to load statistics:', error);
      throw error;
    }
  }

  /**
   * Validate account state
   */
  static async validateAccountState(accountId: string): Promise<AccountValidationState> {
    try {
      // Check if account exists in auth
      const { data: authUser, error: authError } = supabaseAdmin
        ? await supabaseAdmin.auth.admin.getUserById(accountId)
        : { data: null, error: new Error('Admin client not available') };

      if (authError || !authUser) {
        return AccountValidationState.INVALID;
      }

      // Check if profile exists
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', accountId)
        .single();

      if (profileError || !profileData) {
        return AccountValidationState.CLEANUP_REQUIRED;
      }

      return AccountValidationState.VALID;
      
    } catch (error) {
      console.error('❌ MockAccountService (CLI): Validation error:', error);
      return AccountValidationState.INVALID;
    }
  }

  /**
   * Generate test email
   */
  private static generateTestEmail(domain?: string): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const emailDomain = domain || this.TEST_EMAIL_DOMAIN;
    return `test-${timestamp}-${randomSuffix}@${emailDomain}`;
  }
}