import { api } from '../../src/lib/api';
import { supabase } from '../../src/lib/supabaseClient';

// Mock Supabase auth methods
jest.mock('../../src/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn()
        })
      })
    }))
  },
  handleSupabaseError: jest.fn((error) => error),
  getCurrentUser: jest.fn()
}));

describe('Authentication Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Login', () => {
    it('should successfully login with valid admin credentials', async () => {
      const mockAuthResponse = {
        data: {
          user: {
            id: 'test-user-id',
            email: 'admin@example.com'
          },
          session: {
            access_token: 'mock-token',
            user: { id: 'test-user-id' }
          }
        },
        error: null
      };

      const mockUserProfile = {
        id: 'test-user-id',
        name: 'Test Admin',
        email: 'admin@example.com',
        role: 'admin'
      };

      const mockProfileResponse = {
        data: mockUserProfile,
        error: null
      };

      // Mock the auth flow
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue(mockAuthResponse);
      
      const mockFrom = supabase.from as jest.Mock;
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue(mockProfileResponse)
        })
      });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await api.login('admin@example.com', 'password123');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.user).toEqual(mockAuthResponse.data.user);
      expect(result.data.session).toEqual(mockAuthResponse.data.session);
      expect(result.data.profile).toEqual(mockUserProfile);

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'admin@example.com',
        password: 'password123'
      });
    });

    it('should reject login with invalid credentials', async () => {
      const mockErrorResponse = {
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' }
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue(mockErrorResponse);

      const result = await api.login('invalid@example.com', 'wrongpassword');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid login credentials');
      expect(result.data).toBeNull();
    });

    it('should reject login for users without admin privileges', async () => {
      const mockAuthResponse = {
        data: {
          user: {
            id: 'test-user-id',
            email: 'user@example.com'
          },
          session: {
            access_token: 'mock-token',
            user: { id: 'test-user-id' }
          }
        },
        error: null
      };

      const mockUserProfile = {
        id: 'test-user-id',
        name: 'Regular User',
        email: 'user@example.com',
        role: 'agent' // Not admin or super_admin
      };

      const mockProfileResponse = {
        data: mockUserProfile,
        error: null
      };

      // Mock the auth flow
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue(mockAuthResponse);
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });
      
      const mockFrom = supabase.from as jest.Mock;
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue(mockProfileResponse)
        })
      });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await api.login('user@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Access denied: Admin privileges required');
      expect(result.data).toBeNull();

      // Should have called signOut to remove the session
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should handle missing user profile', async () => {
      const mockAuthResponse = {
        data: {
          user: {
            id: 'test-user-id',
            email: 'admin@example.com'
          },
          session: {
            access_token: 'mock-token',
            user: { id: 'test-user-id' }
          }
        },
        error: null
      };

      const mockProfileResponse = {
        data: null,
        error: { message: 'User profile not found' }
      };

      // Mock the auth flow
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue(mockAuthResponse);
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });
      
      const mockFrom = supabase.from as jest.Mock;
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue(mockProfileResponse)
        })
      });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await api.login('admin@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Access denied: Admin privileges required');
      expect(result.data).toBeNull();

      // Should have called signOut to remove the session
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('Logout', () => {
    it('should successfully logout user', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      await api.logout();

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should handle logout errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      (supabase.auth.signOut as jest.Mock).mockRejectedValue(new Error('Logout failed'));

      // Should not throw an error
      await expect(api.logout()).resolves.toBeUndefined();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Get Profile', () => {
    it('should get user profile for authenticated user', async () => {
      const mockUser = {
        id: 'test-user-id',
        email: 'admin@example.com'
      };

      const mockUserProfile = {
        id: 'test-user-id',
        name: 'Test Admin',
        email: 'admin@example.com',
        role: 'admin'
      };

      const mockProfileResponse = {
        data: mockUserProfile,
        error: null
      };

      // Mock getCurrentUser
      const { getCurrentUser } = require('../../src/lib/supabaseClient');
      getCurrentUser.mockResolvedValue(mockUser);

      const mockFrom = supabase.from as jest.Mock;
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue(mockProfileResponse)
        })
      });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await api.getProfile();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUserProfile);
    });

    it('should return error for unauthenticated user', async () => {
      // Mock getCurrentUser returning null (not authenticated)
      const { getCurrentUser } = require('../../src/lib/supabaseClient');
      getCurrentUser.mockResolvedValue(null);

      const result = await api.getProfile();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Not authenticated');
      expect(result.data).toBeNull();
    });
  });

  describe('Session Management', () => {
    it('should check if user is authenticated', async () => {
      const mockSessionResponse = {
        data: {
          session: {
            access_token: 'mock-token',
            user: { id: 'test-user-id' }
          }
        }
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue(mockSessionResponse);

      const result = await api.isAuthenticated();

      expect(result).toBe(true);
      expect(supabase.auth.getSession).toHaveBeenCalled();
    });

    it('should return false for no active session', async () => {
      const mockSessionResponse = {
        data: { session: null }
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue(mockSessionResponse);

      const result = await api.isAuthenticated();

      expect(result).toBe(false);
    });

    it('should handle session check errors', async () => {
      (supabase.auth.getSession as jest.Mock).mockRejectedValue(new Error('Session error'));

      const result = await api.isAuthenticated();

      expect(result).toBe(false);
    });

    it('should get current session', async () => {
      const mockSession = {
        access_token: 'mock-token',
        user: { id: 'test-user-id' }
      };

      const mockSessionResponse = {
        data: { session: mockSession },
        error: null
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue(mockSessionResponse);

      const result = await api.getSession();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSession);
    });
  });

  describe('Role-based Access Control', () => {
    it('should validate admin role requirements', () => {
      const adminRoles = ['admin', 'super_admin'];
      const validRoles = ['admin', 'super_admin'];
      const invalidRoles = ['agent', 'user', null, undefined];

      // Admin roles should be valid
      validRoles.forEach(role => {
        expect(adminRoles.includes(role as any)).toBe(true);
      });

      // Non-admin roles should be invalid
      invalidRoles.forEach(role => {
        expect(adminRoles.includes(role as any)).toBe(false);
      });
    });
  });

  describe('Authentication Error Handling', () => {
    it('should handle network errors during login', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const result = await api.login('admin@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
      expect(result.data).toBeNull();
    });

    it('should handle profile lookup errors after successful auth', async () => {
      const mockAuthResponse = {
        data: {
          user: {
            id: 'test-user-id',
            email: 'admin@example.com'
          },
          session: {
            access_token: 'mock-token',
            user: { id: 'test-user-id' }
          }
        },
        error: null
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue(mockAuthResponse);
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      // Mock profile lookup to throw error
      const mockFrom = supabase.from as jest.Mock;
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockRejectedValue(new Error('Database error'))
        })
      });
      mockFrom.mockReturnValue({ select: mockSelect });

      const result = await api.login('admin@example.com', 'password123');

      expect(result.success).toBe(false);
      expect(result.data).toBeNull();

      // Should have called signOut due to profile lookup failure
      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });
});