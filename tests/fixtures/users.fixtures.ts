import { faker } from 'faker';
import bcrypt from 'bcryptjs';

export interface TestUser {
  id?: string;
  username: string;
  email: string;
  password?: string;
  passwordHash?: string;
  role: 'agent' | 'admin' | 'super_admin';
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export const createMockUser = async (overrides: Partial<TestUser> = {}): Promise<TestUser> => {
  const password = overrides.password || 'TestPassword123!';
  const passwordHash = await bcrypt.hash(password, 12);
  
  return {
    id: faker.string.uuid(),
    username: faker.internet.username(),
    email: faker.internet.email(),
    password,
    passwordHash,
    role: faker.helpers.arrayElement(['agent', 'admin', 'super_admin']),
    isActive: true,
    lastLogin: faker.date.recent().toISOString(),
    createdAt: faker.date.past().toISOString(),
    ...overrides,
  };
};

export const createMockUsers = async (count: number, overrides: Partial<TestUser> = {}): Promise<TestUser[]> => {
  const users = [];
  for (let i = 0; i < count; i++) {
    users.push(await createMockUser(overrides));
  }
  return users;
};

// Specific user types for testing
export const mockAdminUser = async (): Promise<TestUser> => createMockUser({
  username: 'admin_user',
  email: 'admin@gentlerealty.com',
  role: 'admin',
  isActive: true,
});

export const mockAgentUser = async (): Promise<TestUser> => createMockUser({
  username: 'agent_user',
  email: 'agent@gentlerealty.com',
  role: 'agent',
  isActive: true,
});

export const mockSuperAdminUser = async (): Promise<TestUser> => createMockUser({
  username: 'super_admin',
  email: 'superadmin@gentlerealty.com',
  role: 'super_admin',
  isActive: true,
});

export const mockInactiveUser = async (): Promise<TestUser> => createMockUser({
  username: 'inactive_user',
  email: 'inactive@example.com',
  role: 'agent',
  isActive: false,
});

// Login request data for testing
export const mockLoginRequest = (user?: Partial<TestUser>) => ({
  username: user?.username || 'testuser',
  password: user?.password || 'TestPassword123!',
});

export const mockValidLoginRequest = () => ({
  username: 'admin_user',
  password: 'TestPassword123!',
});

export const mockInvalidLoginRequests = {
  wrongPassword: {
    username: 'admin_user',
    password: 'WrongPassword123!',
  },
  nonExistentUser: {
    username: 'nonexistent_user',
    password: 'TestPassword123!',
  },
  emptyUsername: {
    username: '',
    password: 'TestPassword123!',
  },
  emptyPassword: {
    username: 'admin_user',
    password: '',
  },
  invalidFormat: {
    username: 123, // Invalid type
    password: 'TestPassword123!',
  },
};

// User creation request data
export const mockCreateUserRequest = () => ({
  username: faker.internet.username(),
  email: faker.internet.email(),
  password: 'NewPassword123!',
  role: 'agent',
});

export const invalidUserCreationData = {
  missingUsername: {
    email: 'test@example.com',
    password: 'Password123!',
    role: 'agent',
  },
  missingEmail: {
    username: 'testuser',
    password: 'Password123!',
    role: 'agent',
  },
  weakPassword: {
    username: 'testuser',
    email: 'test@example.com',
    password: '123', // Too weak
    role: 'agent',
  },
  invalidEmail: {
    username: 'testuser',
    email: 'invalid-email',
    password: 'Password123!',
    role: 'agent',
  },
  invalidRole: {
    username: 'testuser',
    email: 'test@example.com',
    password: 'Password123!',
    role: 'invalid_role',
  },
  duplicateUsername: {
    username: 'admin_user', // Existing username
    email: 'newemail@example.com',
    password: 'Password123!',
    role: 'agent',
  },
  duplicateEmail: {
    username: 'newuser',
    email: 'admin@gentlerealty.com', // Existing email
    password: 'Password123!',
    role: 'agent',
  },
};

// JWT token data for testing
export const mockJWTPayload = (user?: Partial<TestUser>) => ({
  userId: user?.id || faker.string.uuid(),
  username: user?.username || 'testuser',
  role: user?.role || 'agent',
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
});

export const mockExpiredJWTPayload = (user?: Partial<TestUser>) => ({
  userId: user?.id || faker.string.uuid(),
  username: user?.username || 'testuser',
  role: user?.role || 'agent',
  iat: Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
  exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago (expired)
});

// Authentication test scenarios
export const authTestScenarios = {
  validSession: {
    description: 'Valid authenticated session',
    setup: async () => {
      const user = await mockAdminUser();
      return {
        user,
        token: 'valid_jwt_token',
        headers: {
          'Authorization': 'Bearer valid_jwt_token'
        }
      };
    }
  },
  
  expiredSession: {
    description: 'Expired authentication session',
    setup: async () => {
      const user = await mockAdminUser();
      return {
        user,
        token: 'expired_jwt_token',
        headers: {
          'Authorization': 'Bearer expired_jwt_token'
        }
      };
    }
  },
  
  unauthorizedAccess: {
    description: 'No authentication token provided',
    setup: () => ({
      user: null,
      token: null,
      headers: {}
    })
  },
  
  invalidToken: {
    description: 'Invalid or malformed JWT token',
    setup: () => ({
      user: null,
      token: 'invalid.jwt.token',
      headers: {
        'Authorization': 'Bearer invalid.jwt.token'
      }
    })
  },
  
  insufficientPermissions: {
    description: 'Valid token but insufficient role permissions',
    setup: async () => {
      const user = await mockAgentUser();
      return {
        user,
        token: 'agent_jwt_token',
        headers: {
          'Authorization': 'Bearer agent_jwt_token'
        }
      };
    }
  }
};

// Password testing data
export const passwordTestCases = {
  valid: [
    'StrongPassword123!',
    'MySecure@Pass1',
    'Complex#Password9',
    '2024Testing!Safe',
  ],
  invalid: [
    'weak', // Too short
    'alllowercase123', // No uppercase
    'ALLUPPERCASE123', // No lowercase
    'NoNumbers!@#', // No numbers
    'NoSpecialChars123', // No special characters
    '12345678', // Only numbers
    'password', // Common password
    '', // Empty password
  ],
};

// Rate limiting test data
export const rateLimitingTestData = {
  loginAttempts: Array.from({ length: 10 }, () => mockInvalidLoginRequests.wrongPassword),
  bulkRequests: Array.from({ length: 100 }, (_, i) => ({
    username: `bulk_user_${i}`,
    password: 'TestPassword123!',
  })),
};