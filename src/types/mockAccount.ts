export interface MockAccountCredentials {
  email: string;
  password: string;
}

export interface MockAccountCreationRequest {
  credentials: MockAccountCredentials;
  profile: {
    name: string;
    role: 'admin' | 'super_admin' | 'user';
  };
  options?: {
    skipEmailConfirmation?: boolean;
    generateRandomEmail?: boolean;
    emailDomain?: string;
  };
}

export interface MockAccount {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin' | 'user'; // Supports all roles including 'user'
  credentials: MockAccountCredentials;
  isTestAccount: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface MockAccountTestResult {
  success: boolean;
  accountId?: string;
  message: string;
  credentials?: MockAccountCredentials; // Include login credentials for successful account creation
  profile?: {
    name: string;
    role: string;
  };
  validationResults?: {
    canLogin: boolean;
    hasCorrectRole: boolean;
    canAccessAdmin: boolean;
  };
  error?: Error;
}

export interface MockAccountCleanupResult {
  deletedAccounts: number;
  errors: string[];
  success: boolean;
}

export enum MockAccountType {
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
  USER = 'user'
}

export enum TestScenario {
  BASIC_LOGIN = 'basic_login',
  ADMIN_ACCESS = 'admin_access',
  ROLE_VERIFICATION = 'role_verification',
  SESSION_PERSISTENCE = 'session_persistence',
  PASSWORD_VALIDATION = 'password_validation'
}

export enum AccountValidationState {
  PENDING = 'pending',
  VALID = 'valid',
  INVALID = 'invalid',
  EXPIRED = 'expired',
  CLEANUP_REQUIRED = 'cleanup_required'
}

export interface MockAccountFilter {
  role?: MockAccountType;
  isTestAccount?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  emailDomain?: string;
}

export interface MockAccountStats {
  totalAccounts: number;
  accountsByRole: Record<MockAccountType, number>;
  testAccountsCount: number;
  lastCreated?: Date;
  oldestAccount?: Date;
}

// Utility type for converting MockAccount to Admin (only for admin/super_admin roles)
export type MockAccountAsAdmin = Omit<MockAccount, 'role' | 'credentials' | 'isTestAccount' | 'lastLoginAt'> & {
  role: 'admin' | 'super_admin';
};

// Utility function to convert MockAccount to Admin interface
export const mockAccountToAdmin = (mockAccount: MockAccount): MockAccountAsAdmin | null => {
  if (mockAccount.role === 'user') {
    return null; // Cannot convert user role to admin
  }
  
  return {
    id: mockAccount.id,
    email: mockAccount.email,
    name: mockAccount.name,
    role: mockAccount.role as 'admin' | 'super_admin',
    createdAt: mockAccount.createdAt
  };
};