import { FirebaseAuthService } from '../lib/firebaseClient';
import { API } from '../services/apiService';
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
 * Firebase-compatible Mock Account Service
 * Uses Firebase Auth instead of Supabase
 */
export class MockAccountService {
  private static readonly TEST_EMAIL_DOMAIN = 'test.gentlespacerealty.local';
  private static readonly DEFAULT_PASSWORD = 'TestPass123!';
  
  /**
   * Create a mock account with Firebase authentication
   */
  static async createMockAccount(request: MockAccountCreationRequest): Promise<MockAccountTestResult> {
    console.log('🧪 MockAccountService: Creating mock account...', { email: request.credentials.email });
    
    try {
      const { credentials, profile, options = {} } = request;
      
      // Generate email if requested
      const email = options.generateRandomEmail 
        ? this.generateTestEmail(options.emailDomain)
        : credentials.email;
      
      const finalCredentials = { ...credentials, email };
      
      // Create user in Firebase Auth
      const { data: authData, error: authError } = await FirebaseAuthService.signUp(
        finalCredentials.email,
        finalCredentials.password,
        profile.name
      );

      if (authError) {
        console.error('❌ MockAccountService: Auth creation failed:', authError.message);
        return {
          success: false,
          message: `Authentication creation failed: ${authError.message}`,
          error: new Error(authError.message)
        };
      }

      if (!authData) {
        console.error('❌ MockAccountService: No user returned from auth creation');
        return {
          success: false,
          message: 'No user data returned from authentication service'
        };
      }

      console.log('✅ MockAccountService: Auth user created:', authData.uid);

      // Get Firebase ID token and register with backend
      const idToken = await FirebaseAuthService.getIdToken();
      if (!idToken) {
        console.error('❌ MockAccountService: Failed to get ID token');
        return {
          success: false,
          message: 'Failed to get authentication token'
        };
      }

      // Create profile in backend database
      try {
        const response = await API.auth.register({ 
          idToken, 
          name: profile.name 
        } as any);

        if (!response.user) {
          throw new Error('Backend user creation failed');
        }

        console.log('✅ MockAccountService: Profile created in backend:', response.user.id);

        // Validate the account
        const validationResults = await this.validateAccount(finalCredentials, profile.role);

        return {
          success: true,
          message: `Mock ${profile.role} account created successfully`,
          accountId: response.user.id,
          credentials: finalCredentials,
          profile: {
            id: response.user.id,
            name: profile.name,
            email: finalCredentials.email,
            role: profile.role,
            isTestAccount: true
          },
          validationResults
        };
      } catch (backendError) {
        console.error('❌ MockAccountService: Backend registration failed:', backendError);
        return {
          success: false,
          message: `Backend registration failed: ${backendError instanceof Error ? backendError.message : 'Unknown error'}`,
          error: backendError instanceof Error ? backendError : new Error('Backend registration failed')
        };
      }
    } catch (error) {
      console.error('❌ MockAccountService: Unexpected error:', error);
      return {
        success: false,
        message: `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error : new Error('Unexpected error')
      };
    }
  }

  /**
   * Create a quick test account with default settings
   */
  static async createQuickTestAccount(
    role: MockAccountType, 
    emailPrefix?: string
  ): Promise<MockAccountTestResult> {
    const email = emailPrefix 
      ? `${emailPrefix}-${role.toLowerCase()}-${Date.now()}@${this.TEST_EMAIL_DOMAIN}`
      : this.generateTestEmail();
    
    const request: MockAccountCreationRequest = {
      credentials: {
        email,
        password: this.DEFAULT_PASSWORD
      },
      profile: {
        name: `Test ${role}`,
        email,
        role
      },
      options: {
        skipEmailConfirmation: true,
        generateRandomEmail: false
      }
    };

    return this.createMockAccount(request);
  }

  /**
   * Validate account login and access permissions
   */
  static async validateAccount(
    credentials: MockAccountCredentials, 
    expectedRole: MockAccountType
  ): Promise<AccountValidationState> {
    try {
      // Test login with Firebase Auth
      const { data: loginData, error: loginError } = await FirebaseAuthService.signIn(
        credentials.email, 
        credentials.password
      );

      if (loginError || !loginData) {
        return {
          canLogin: false,
          canAccessAdmin: false,
          errors: [`Login failed: ${loginError?.message || 'Unknown error'}`]
        };
      }

      // Test backend authentication
      const idToken = await FirebaseAuthService.getIdToken();
      if (!idToken) {
        return {
          canLogin: true,
          canAccessAdmin: false,
          errors: ['Failed to get authentication token for backend access']
        };
      }

      try {
        // Test backend API access
        const response = await API.auth.me();
        
        const canAccessAdmin = response.user && 
          (response.user.role === MockAccountType.ADMIN || 
           response.user.role === MockAccountType.SUPER_ADMIN);

        return {
          canLogin: true,
          canAccessAdmin,
          errors: []
        };
      } catch (apiError) {
        return {
          canLogin: true,
          canAccessAdmin: false,
          errors: [`Backend access failed: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`]
        };
      }
    } catch (error) {
      return {
        canLogin: false,
        canAccessAdmin: false,
        errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Get mock account statistics
   */
  static async getMockAccountStats(): Promise<MockAccountStats> {
    try {
      // Since we're using Firebase Auth, we can't directly query test accounts
      // Return mock stats for now - in a real implementation, you'd track this
      // in your backend database
      return {
        totalAccounts: 0,
        accountsByRole: {
          [MockAccountType.USER]: 0,
          [MockAccountType.ADMIN]: 0,
          [MockAccountType.SUPER_ADMIN]: 0
        },
        createdInLast24Hours: 0,
        lastCreatedAt: null
      };
    } catch (error) {
      console.error('Failed to get mock account stats:', error);
      throw error;
    }
  }

  /**
   * Cleanup all test accounts
   */
  static async cleanupAllTestAccounts(): Promise<MockAccountCleanupResult> {
    try {
      console.log('⚠️ MockAccountService: Test account cleanup not fully implemented for Firebase Auth');
      console.log('Firebase Auth doesn\'t provide easy querying of users by metadata');
      console.log('In a production setup, you\'d track test accounts in your backend database');
      
      return {
        success: true,
        deletedAccounts: 0,
        errors: [],
        summary: 'Test account cleanup requires backend implementation for Firebase Auth'
      };
    } catch (error) {
      console.error('Failed to cleanup test accounts:', error);
      return {
        success: false,
        deletedAccounts: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        summary: 'Cleanup failed'
      };
    }
  }

  /**
   * Generate a random test email
   */
  static generateTestEmail(domain?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const finalDomain = domain || this.TEST_EMAIL_DOMAIN;
    return `test-${timestamp}-${random}@${finalDomain}`;
  }

  /**
   * Get all mock accounts (stub implementation)
   */
  static async getAllMockAccounts(filter?: MockAccountFilter): Promise<MockAccount[]> {
    console.log('⚠️ MockAccountService: getAllMockAccounts not implemented for Firebase Auth');
    return [];
  }

  /**
   * Delete a specific mock account (stub implementation)
   */
  static async deleteMockAccount(accountId: string): Promise<boolean> {
    console.log('⚠️ MockAccountService: deleteMockAccount not implemented for Firebase Auth');
    console.log('Account ID:', accountId);
    return false;
  }
}