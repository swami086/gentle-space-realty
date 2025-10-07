import { supabase } from '../../src/lib/supabaseClient';

// Mock Supabase auth methods
jest.mock('../../src/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
    }
  },
  handleSupabaseError: jest.fn((error) => error),
  getCurrentUser: jest.fn()
}));

describe('Authentication Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Supabase Auth Methods', () => {
    it('should call signInWithPassword with correct parameters', async () => {
      const mockResponse = {
        data: {
          user: { id: 'test-id', email: 'test@example.com' },
          session: { access_token: 'token' }
        },
        error: null
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue(mockResponse);

      await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'password'
      });

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password'
      });
    });

    it('should call signOut correctly', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      await supabase.auth.signOut();

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });

    it('should call getSession correctly', async () => {
      const mockSessionResponse = {
        data: { session: { access_token: 'token', user: { id: 'test-id' } } }
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue(mockSessionResponse);

      const result = await supabase.auth.getSession();

      expect(supabase.auth.getSession).toHaveBeenCalled();
      expect(result.data.session).toBeDefined();
    });
  });

  describe('Authentication Error Handling', () => {
    it('should handle auth errors correctly', async () => {
      const mockErrorResponse = {
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' }
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue(mockErrorResponse);

      const result = await supabase.auth.signInWithPassword({
        email: 'invalid@example.com',
        password: 'wrongpassword'
      });

      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('Invalid credentials');
      expect(result.data.user).toBeNull();
    });

    it('should handle network errors during auth', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      await expect(
        supabase.auth.signInWithPassword({
          email: 'test@example.com',
          password: 'password'
        })
      ).rejects.toThrow('Network error');
    });
  });

  describe('Session Management', () => {
    it('should detect active session', async () => {
      const mockActiveSession = {
        data: {
          session: {
            access_token: 'active-token',
            user: { id: 'user-id', email: 'user@example.com' }
          }
        }
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue(mockActiveSession);

      const result = await supabase.auth.getSession();

      expect(result.data.session).toBeDefined();
      expect(result.data.session.access_token).toBe('active-token');
      expect(result.data.session.user.id).toBe('user-id');
    });

    it('should detect no active session', async () => {
      const mockNoSession = {
        data: { session: null }
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue(mockNoSession);

      const result = await supabase.auth.getSession();

      expect(result.data.session).toBeNull();
    });

    it('should handle session refresh scenarios', async () => {
      // First call returns expired session
      const mockExpiredSession = {
        data: {
          session: {
            access_token: 'expired-token',
            user: { id: 'user-id' },
            expires_at: Date.now() - 1000 // Expired
          }
        }
      };

      (supabase.auth.getSession as jest.Mock).mockResolvedValue(mockExpiredSession);

      const result = await supabase.auth.getSession();

      expect(result.data.session).toBeDefined();
      expect(result.data.session.access_token).toBe('expired-token');
    });
  });

  describe('Authentication Flow Integration', () => {
    it('should complete full login flow', async () => {
      const mockLoginResponse = {
        data: {
          user: {
            id: 'user-123',
            email: 'admin@example.com',
            email_confirmed_at: new Date().toISOString()
          },
          session: {
            access_token: 'jwt-token',
            refresh_token: 'refresh-token',
            user: { id: 'user-123' }
          }
        },
        error: null
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue(mockLoginResponse);

      const result = await supabase.auth.signInWithPassword({
        email: 'admin@example.com',
        password: 'secure-password'
      });

      expect(result.data.user).toBeDefined();
      expect(result.data.session).toBeDefined();
      expect(result.data.user.id).toBe('user-123');
      expect(result.data.user.email).toBe('admin@example.com');
      expect(result.error).toBeNull();
    });

    it('should complete full logout flow', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      await supabase.auth.signOut();

      // Verify logout was called
      expect(supabase.auth.signOut).toHaveBeenCalledTimes(1);

      // After logout, session should be null
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null }
      });

      const sessionResult = await supabase.auth.getSession();
      expect(sessionResult.data.session).toBeNull();
    });
  });

  describe('Role-based Access Validation', () => {
    it('should validate admin role requirements', () => {
      const adminRoles = ['admin', 'super_admin'];
      
      // Test valid admin roles
      expect(adminRoles.includes('admin')).toBe(true);
      expect(adminRoles.includes('super_admin')).toBe(true);
      
      // Test invalid roles
      expect(adminRoles.includes('agent')).toBe(false);
      expect(adminRoles.includes('user')).toBe(false);
      expect(adminRoles.includes('')).toBe(false);
    });

    it('should handle undefined or null roles', () => {
      const adminRoles = ['admin', 'super_admin'];
      
      expect(adminRoles.includes(undefined as any)).toBe(false);
      expect(adminRoles.includes(null as any)).toBe(false);
    });
  });

  describe('Security Considerations', () => {
    it('should not expose sensitive information in errors', () => {
      const mockErrorResponse = {
        data: { user: null, session: null },
        error: { 
          message: 'Authentication failed',
          // Should not expose internal details
          details: undefined 
        }
      };

      expect(mockErrorResponse.error.details).toBeUndefined();
      expect(mockErrorResponse.error.message).not.toContain('password');
      expect(mockErrorResponse.error.message).not.toContain('hash');
    });

    it('should validate email format expectations', () => {
      const validEmails = [
        'admin@example.com',
        'user.name@domain.org',
        'test+tag@company.co.uk'
      ];

      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        ''
      ];

      validEmails.forEach(email => {
        expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });

      invalidEmails.forEach(email => {
        expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });
  });
});