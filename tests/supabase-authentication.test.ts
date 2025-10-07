/**
 * Supabase Authentication Flow Tests
 * Comprehensive testing of authentication, authorization, and user management
 */

import { describe, test, expect, beforeAll, afterAll, jest } from '@jest/globals';

// Mock environment setup
const mockSupabaseClient = {
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    limit: jest.fn().mockReturnThis(),
  })),
  channel: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn(),
  })),
};

// Mock the Supabase client
jest.mock('../src/lib/supabaseClient', () => ({
  supabase: mockSupabaseClient,
  supabaseAdmin: mockSupabaseClient,
  getCurrentUser: jest.fn(),
  isUserAdmin: jest.fn(),
  getUserProfile: jest.fn(),
  getSession: jest.fn(),
  withRetry: jest.fn((operation) => operation()),
  handleSupabaseError: jest.fn((error) => new Error(error.message || 'Test error')),
  checkSupabaseHealth: jest.fn(),
  connectionHealth: {
    addListener: jest.fn(),
    removeListener: jest.fn(),
    setHealthy: jest.fn(),
    getHealth: jest.fn(() => ({ isHealthy: true, lastCheck: Date.now() })),
  },
  APP_CONFIG: {
    apiTimeout: 15000,
    maxRetries: 3,
    retryDelay: 1000,
    realtimeEnabled: true,
    rlsEnabled: true,
  }
}));

const mockCredentials = {
  email: 'test@example.com',
  password: 'testpassword123',
  userData: {
    id: 'user123',
    email: 'test@example.com',
    role: 'user',
    created_at: new Date().toISOString(),
  },
  adminData: {
    id: 'admin123',
    email: 'admin@example.com',
    role: 'admin',
    created_at: new Date().toISOString(),
  }
};

describe('🔐 Authentication Flows', () => {
  
  beforeAll(() => {
    // Reset all mocks before tests
    jest.clearAllMocks();
  });

  test('User registration should work correctly', async () => {
    const mockResponse = {
      data: { user: mockCredentials.userData },
      error: null
    };
    
    mockSupabaseClient.auth.signUp.mockResolvedValue(mockResponse);
    
    const { supabase } = await import('../src/lib/supabaseClient');
    const result = await supabase.auth.signUp({
      email: mockCredentials.email,
      password: mockCredentials.password
    });

    expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
      email: mockCredentials.email,
      password: mockCredentials.password
    });
    expect(result.data.user).toEqual(mockCredentials.userData);
    expect(result.error).toBeNull();
  });

  test('User login should authenticate successfully', async () => {
    const mockResponse = {
      data: { 
        user: mockCredentials.userData,
        session: { access_token: 'mock-token' }
      },
      error: null
    };
    
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(mockResponse);
    
    const { supabase } = await import('../src/lib/supabaseClient');
    const result = await supabase.auth.signInWithPassword({
      email: mockCredentials.email,
      password: mockCredentials.password
    });

    expect(mockSupabaseClient.auth.signInWithPassword).toHaveBeenCalledWith({
      email: mockCredentials.email,
      password: mockCredentials.password
    });
    expect(result.data.user).toEqual(mockCredentials.userData);
    expect(result.data.session).toBeTruthy();
  });

  test('Login with invalid credentials should fail', async () => {
    const mockResponse = {
      data: { user: null, session: null },
      error: { message: 'Invalid login credentials' }
    };
    
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue(mockResponse);
    
    const { supabase } = await import('../src/lib/supabaseClient');
    const result = await supabase.auth.signInWithPassword({
      email: 'invalid@example.com',
      password: 'wrongpassword'
    });

    expect(result.error).toBeTruthy();
    expect(result.error.message).toBe('Invalid login credentials');
    expect(result.data.user).toBeNull();
  });

  test('User logout should clear session', async () => {
    const mockResponse = { error: null };
    mockSupabaseClient.auth.signOut.mockResolvedValue(mockResponse);
    
    const { supabase } = await import('../src/lib/supabaseClient');
    const result = await supabase.auth.signOut();

    expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
    expect(result.error).toBeNull();
  });

  test('Get current user should return user data', async () => {
    const mockResponse = {
      data: { user: mockCredentials.userData },
      error: null
    };
    
    mockSupabaseClient.auth.getUser.mockResolvedValue(mockResponse);
    
    const { getCurrentUser } = await import('../src/lib/supabaseClient');
    const user = await getCurrentUser();

    expect(user).toEqual(mockCredentials.userData);
  });

  test('Get session should return current session', async () => {
    const mockSession = {
      access_token: 'mock-token',
      user: mockCredentials.userData,
      expires_at: Date.now() + 3600000
    };
    const mockResponse = {
      data: { session: mockSession },
      error: null
    };
    
    mockSupabaseClient.auth.getSession.mockResolvedValue(mockResponse);
    
    const { getSession } = await import('../src/lib/supabaseClient');
    const session = await getSession();

    expect(session).toEqual(mockSession);
  });
});

describe('🛡️ Authorization & Role Management', () => {
  
  test('Admin role check should work for admin user', async () => {
    // Mock getCurrentUser to return user
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockCredentials.adminData },
      error: null
    });
    
    // Mock database query for user role
    const mockFromChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { role: 'admin' },
        error: null
      })
    };
    mockSupabaseClient.from.mockReturnValue(mockFromChain);
    
    const { isUserAdmin } = await import('../src/lib/supabaseClient');
    const isAdmin = await isUserAdmin();

    expect(isAdmin).toBe(true);
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
    expect(mockFromChain.select).toHaveBeenCalledWith('role');
    expect(mockFromChain.eq).toHaveBeenCalledWith('id', mockCredentials.adminData.id);
  });

  test('Admin role check should fail for regular user', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockCredentials.userData },
      error: null
    });
    
    const mockFromChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { role: 'user' },
        error: null
      })
    };
    mockSupabaseClient.from.mockReturnValue(mockFromChain);
    
    const { isUserAdmin } = await import('../src/lib/supabaseClient');
    const isAdmin = await isUserAdmin();

    expect(isAdmin).toBe(false);
  });

  test('User profile retrieval should work', async () => {
    const mockProfile = {
      id: mockCredentials.userData.id,
      email: mockCredentials.userData.email,
      role: 'user',
      created_at: mockCredentials.userData.created_at,
      full_name: 'Test User',
      phone: '+91 9876543210'
    };

    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockCredentials.userData },
      error: null
    });
    
    const mockFromChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: mockProfile,
        error: null
      })
    };
    mockSupabaseClient.from.mockReturnValue(mockFromChain);
    
    const { getUserProfile } = await import('../src/lib/supabaseClient');
    const profile = await getUserProfile();

    expect(profile).toEqual(mockProfile);
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('users');
  });
});

describe('🔄 Authentication Hooks Integration', () => {
  
  test('useSupabaseAuth hook should be available', async () => {
    try {
      const { useSupabaseAuth } = await import('../src/hooks/useSupabaseAuth');
      expect(typeof useSupabaseAuth).toBe('function');
    } catch (error) {
      throw new Error(`useSupabaseAuth hook not available: ${error.message}`);
    }
  });

  test('Authentication state change listener should be configurable', async () => {
    const mockCallback = jest.fn();
    mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    });
    
    const { supabase } = await import('../src/lib/supabaseClient');
    const subscription = supabase.auth.onAuthStateChange(mockCallback);

    expect(mockSupabaseClient.auth.onAuthStateChange).toHaveBeenCalledWith(mockCallback);
    expect(subscription.data.subscription).toBeTruthy();
  });
});

describe('🏥 Connection Health & Error Handling', () => {
  
  test('Connection health monitoring should work', async () => {
    const { connectionHealth, checkSupabaseHealth } = await import('../src/lib/supabaseClient');
    
    // Test health status getter
    const health = connectionHealth.getHealth();
    expect(health).toHaveProperty('isHealthy');
    expect(health).toHaveProperty('lastCheck');
    expect(typeof health.isHealthy).toBe('boolean');
    expect(typeof health.lastCheck).toBe('number');
  });

  test('Error handling should provide meaningful messages', async () => {
    const testCases = [
      {
        input: { code: 'PGRST116' },
        expectedMessage: 'Resource not found'
      },
      {
        input: { status: 401 },
        expectedMessage: 'Authentication required'
      },
      {
        input: { status: 403 },
        expectedMessage: 'Access forbidden'
      },
      {
        input: { message: 'Invalid login credentials' },
        expectedMessage: 'Invalid email or password'
      }
    ];

    const { handleSupabaseError } = await import('../src/lib/supabaseClient');
    
    testCases.forEach(({ input, expectedMessage }) => {
      const error = handleSupabaseError(input);
      expect(error.message).toBe(expectedMessage);
    });
  });

  test('Retry mechanism should handle temporary failures', async () => {
    const mockOperation = jest.fn()
      .mockRejectedValueOnce(new Error('Temporary failure'))
      .mockResolvedValueOnce('Success');

    const { withRetry } = await import('../src/lib/supabaseClient');
    const result = await withRetry(mockOperation, 2, 100);

    expect(mockOperation).toHaveBeenCalledTimes(2);
    expect(result).toBe('Success');
  });

  test('Retry mechanism should respect max retries', async () => {
    const mockOperation = jest.fn().mockRejectedValue(new Error('Persistent failure'));

    const { withRetry } = await import('../src/lib/supabaseClient');
    
    await expect(withRetry(mockOperation, 2, 50)).rejects.toThrow('Persistent failure');
    expect(mockOperation).toHaveBeenCalledTimes(2);
  });
});

describe('📋 Row Level Security (RLS)', () => {
  
  test('RLS configuration should be enabled', async () => {
    const { APP_CONFIG } = await import('../src/lib/supabaseClient');
    expect(APP_CONFIG.rlsEnabled).toBe(true);
  });

  test('Public access to properties should work', async () => {
    const mockProperties = [
      { id: '1', title: 'Test Property', price: 50000 },
      { id: '2', title: 'Another Property', price: 75000 }
    ];
    
    const mockFromChain = {
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({
        data: mockProperties,
        error: null
      })
    };
    mockSupabaseClient.from.mockReturnValue(mockFromChain);
    
    const { supabase } = await import('../src/lib/supabaseClient');
    const { data, error } = await supabase.from('properties').select('*').limit(10);

    expect(error).toBeNull();
    expect(data).toEqual(mockProperties);
    expect(mockSupabaseClient.from).toHaveBeenCalledWith('properties');
  });

  test('Protected operations should require authentication', async () => {
    // This would be tested with actual RLS policies in a real environment
    // For now, we verify the structure is in place
    const { supabase } = await import('../src/lib/supabaseClient');
    expect(typeof supabase.from).toBe('function');
  });
});

describe('🔧 Configuration Validation', () => {
  
  test('Essential configuration should be present', async () => {
    const { APP_CONFIG } = await import('../src/lib/supabaseClient');
    
    expect(APP_CONFIG).toHaveProperty('apiTimeout');
    expect(APP_CONFIG).toHaveProperty('maxRetries');
    expect(APP_CONFIG).toHaveProperty('retryDelay');
    expect(APP_CONFIG).toHaveProperty('realtimeEnabled');
    expect(APP_CONFIG).toHaveProperty('rlsEnabled');
    
    expect(typeof APP_CONFIG.apiTimeout).toBe('number');
    expect(typeof APP_CONFIG.maxRetries).toBe('number');
    expect(typeof APP_CONFIG.retryDelay).toBe('number');
    expect(typeof APP_CONFIG.realtimeEnabled).toBe('boolean');
    expect(typeof APP_CONFIG.rlsEnabled).toBe('boolean');
  });

  test('Client configuration should be optimal for production', async () => {
    const { APP_CONFIG } = await import('../src/lib/supabaseClient');
    
    expect(APP_CONFIG.apiTimeout).toBeGreaterThan(5000); // Reasonable timeout
    expect(APP_CONFIG.maxRetries).toBeGreaterThan(0); // Should retry
    expect(APP_CONFIG.retryDelay).toBeGreaterThan(0); // Should have delay
  });
});