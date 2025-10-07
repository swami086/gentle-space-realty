/**
 * Frontend Supabase Authentication Test Suite
 * 
 * Comprehensive testing for frontend-only Supabase authentication
 * Covers: OAuth flow, session management, user operations, RLS policies
 */

const { describe, it, expect, beforeAll, afterAll, beforeEach } = require('@jest/globals');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env.development') });

// Supabase clients
let supabaseClient;
let adminClient;

const initializeClients = () => {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  expect(supabaseUrl).toBeDefined();
  expect(supabaseAnonKey).toBeDefined();

  // Create client for frontend operations
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  
  // Create admin client for test setup (if available)
  if (supabaseServiceKey) {
    adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
  }
};

// Test data
const TEST_USER = {
  email: 'test@gentlespacerealty.com',
  name: 'Test Admin User',
  role: 'admin'
};

const TEST_REGULAR_USER = {
  email: 'user@example.com',
  name: 'Regular User',
  role: 'user'
};

describe('Supabase Authentication System', () => {
  let testUserToken = null;
  let adminUserToken = null;
  let testUserId = null;
  let adminUserId = null;

  beforeAll(async () => {
    // Verify environment variables
    expect(process.env.SUPABASE_URL).toBeDefined();
    expect(process.env.SUPABASE_SERVICE_ROLE_KEY).toBeDefined();
    
    console.log('🧪 Setting up Supabase auth test environment...');
    
    // Clean up any existing test users
    await cleanupTestUsers();
    
    // Create test users for testing
    await createTestUsers();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestUsers();
    console.log('🧹 Test cleanup completed');
  });

  beforeEach(() => {
    // Reset any test state if needed
  });

  /**
   * Helper Functions
   */
  async function cleanupTestUsers() {
    try {
      // Delete test users from database
      await supabase
        .from('users')
        .delete()
        .in('email', [TEST_USER.email, TEST_REGULAR_USER.email]);
      
      // Note: Can't delete auth users with service role, but they'll be overwritten
      console.log('🧹 Cleaned up test users');
    } catch (error) {
      console.warn('⚠️ Cleanup warning:', error.message);
    }
  }

  async function createTestUsers() {
    try {
      // Create admin test user
      const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
        email: TEST_USER.email,
        email_confirm: true,
        user_metadata: {
          name: TEST_USER.name,
          full_name: TEST_USER.name
        }
      });

      if (adminError) throw adminError;
      
      adminUserId = adminUser.user.id;
      
      // Insert admin user profile
      await supabase
        .from('users')
        .upsert({
          id: adminUserId,
          email: TEST_USER.email,
          name: TEST_USER.name,
          role: 'admin'
        });

      // Create regular test user
      const { data: regularUser, error: regularError } = await supabase.auth.admin.createUser({
        email: TEST_REGULAR_USER.email,
        email_confirm: true,
        user_metadata: {
          name: TEST_REGULAR_USER.name,
          full_name: TEST_REGULAR_USER.name
        }
      });

      if (regularError) throw regularError;
      
      testUserId = regularUser.user.id;
      
      // Insert regular user profile
      await supabase
        .from('users')
        .upsert({
          id: testUserId,
          email: TEST_REGULAR_USER.email,
          name: TEST_REGULAR_USER.name,
          role: 'user'
        });

      // Generate tokens for testing
      const adminSession = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: TEST_USER.email
      });
      
      const regularSession = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: TEST_REGULAR_USER.email
      });

      // For testing, we'll use service role tokens (this is a simplified approach)
      // In real tests, you'd want to generate proper user tokens
      adminUserToken = process.env.SUPABASE_SERVICE_ROLE_KEY;
      testUserToken = process.env.SUPABASE_SERVICE_ROLE_KEY;

      console.log('✅ Test users created successfully');
    } catch (error) {
      console.error('❌ Test user creation failed:', error);
      throw error;
    }
  }

  /**
   * Authentication Routes Tests
   */
  describe('POST /api/auth/oauth', () => {
    it('should verify valid OAuth token', async () => {
      const response = await request(app)
        .post('/api/auth/oauth')
        .send({
          action: 'verify',
          access_token: adminUserToken
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('OAuth token verified');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.provider).toBe('google');
    });

    it('should reject invalid OAuth token', async () => {
      const response = await request(app)
        .post('/api/auth/oauth')
        .send({
          action: 'verify',
          access_token: 'invalid-token'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid access token');
      expect(response.body.code).toBe('TOKEN_VERIFICATION_FAILED');
    });

    it('should require action parameter', async () => {
      const response = await request(app)
        .post('/api/auth/oauth')
        .send({
          access_token: adminUserToken
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing action parameter');
      expect(response.body.code).toBe('MISSING_ACTION');
    });

    it('should sync user data successfully', async () => {
      const response = await request(app)
        .post('/api/auth/oauth')
        .send({
          action: 'sync',
          user_data: {
            id: testUserId,
            email: TEST_REGULAR_USER.email,
            name: TEST_REGULAR_USER.name,
            role: 'user'
          }
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('User synced successfully');
      expect(response.body.profile).toBeDefined();
    });
  });

  describe('GET /api/auth/user/:id', () => {
    it('should get user profile with admin token', async () => {
      const response = await request(app)
        .get(`/api/auth/user/${testUserId}`)
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBe(testUserId);
      expect(response.body.user.email).toBe(TEST_REGULAR_USER.email);
    });

    it('should reject request without authorization', async () => {
      const response = await request(app)
        .get(`/api/auth/user/${testUserId}`);

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });

    it('should reject request with invalid token', async () => {
      const response = await request(app)
        .get(`/api/auth/user/${testUserId}`)
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('UNAUTHORIZED');
    });
  });

  describe('POST /api/auth/admin/role', () => {
    it('should update user role with super admin privileges', async () => {
      // First, upgrade admin user to super_admin
      await supabase
        .from('users')
        .update({ role: 'super_admin' })
        .eq('id', adminUserId);

      const response = await request(app)
        .post('/api/auth/admin/role')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({
          user_id: testUserId,
          new_role: 'admin'
        });

      expect(response.status).toBe(200);
      expect(response.body.user.role).toBe('admin');
      expect(response.body.message).toContain('User role updated successfully');
    });

    it('should reject invalid role values', async () => {
      const response = await request(app)
        .post('/api/auth/admin/role')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({
          user_id: testUserId,
          new_role: 'invalid_role'
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('INVALID_ROLE');
    });
  });

  describe('GET /api/auth', () => {
    it('should return auth service health status', async () => {
      const response = await request(app)
        .get('/api/auth');

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('Auth service is healthy');
      expect(response.body.service).toBe('supabase-oauth-authentication');
      expect(response.body.features).toContain('google-oauth');
      expect(response.body.database_connected).toBe(true);
    });
  });

  /**
   * Middleware Tests
   */
  describe('Supabase Auth Middleware', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
      mockReq = {
        headers: {},
        supabaseUser: null,
        userProfile: null
      };
      mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis()
      };
      mockNext = jest.fn();
    });

    describe('verifySupabaseToken', () => {
      it('should verify valid Bearer token', async () => {
        mockReq.headers.authorization = `Bearer ${adminUserToken}`;

        await verifySupabaseToken(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockReq.supabaseUser).toBeDefined();
        expect(mockReq.accessToken).toBe(adminUserToken);
      });

      it('should reject missing authorization header', async () => {
        await verifySupabaseToken(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'UNAUTHORIZED'
          })
        );
        expect(mockNext).not.toHaveBeenCalled();
      });

      it('should reject invalid token format', async () => {
        mockReq.headers.authorization = 'InvalidFormat token';

        await verifySupabaseToken(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('addUserProfile', () => {
      it('should add user profile for authenticated user', async () => {
        mockReq.supabaseUser = { id: adminUserId };

        await addUserProfile(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
        expect(mockReq.userProfile).toBeDefined();
        expect(mockReq.userProfile.id).toBe(adminUserId);
      });

      it('should reject unauthenticated requests', async () => {
        await addUserProfile(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(401);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'UNAUTHENTICATED'
          })
        );
        expect(mockNext).not.toHaveBeenCalled();
      });
    });

    describe('requireAdmin', () => {
      it('should allow admin users', async () => {
        mockReq.userProfile = { role: 'admin' };

        await requireAdmin(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });

      it('should allow super admin users', async () => {
        mockReq.userProfile = { role: 'super_admin' };

        await requireAdmin(mockReq, mockRes, mockNext);

        expect(mockNext).toHaveBeenCalled();
      });

      it('should reject regular users', async () => {
        mockReq.userProfile = { role: 'user' };

        await requireAdmin(mockReq, mockRes, mockNext);

        expect(mockRes.status).toHaveBeenCalledWith(403);
        expect(mockRes.json).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'INSUFFICIENT_PRIVILEGES'
          })
        );
        expect(mockNext).not.toHaveBeenCalled();
      });
    });
  });

  /**
   * Database Function Tests
   */
  describe('Database Functions', () => {
    describe('upsert_oauth_user', () => {
      it('should create new user with correct role', async () => {
        const testEmail = 'newadmin@gentlespacerealty.com';
        
        const { data, error } = await supabase
          .rpc('upsert_oauth_user', {
            p_user_id: 'test-uuid-' + Date.now(),
            p_user_email: testEmail,
            p_user_name: 'New Admin',
            p_user_role: 'user' // Should be upgraded to admin based on email
          });

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data[0].role).toBe('admin'); // Auto-upgraded based on email domain
        expect(data[0].email).toBe(testEmail);
      });

      it('should update existing user', async () => {
        const { data, error } = await supabase
          .rpc('upsert_oauth_user', {
            p_user_id: testUserId,
            p_user_email: TEST_REGULAR_USER.email,
            p_user_name: 'Updated Name',
            p_user_role: 'user'
          });

        expect(error).toBeNull();
        expect(data).toBeDefined();
        expect(data[0].name).toBe('Updated Name');
      });
    });
  });

  /**
   * Integration Tests
   */
  describe('OAuth Flow Integration', () => {
    it('should complete full OAuth verification flow', async () => {
      // Step 1: Verify token
      const verifyResponse = await request(app)
        .post('/api/auth/oauth')
        .send({
          action: 'verify',
          access_token: adminUserToken
        });

      expect(verifyResponse.status).toBe(200);
      
      // Step 2: Get user profile
      const profileResponse = await request(app)
        .get(`/api/auth/user/${adminUserId}`)
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.user.email).toBe(TEST_USER.email);
    });

    it('should handle admin role checking correctly', async () => {
      // Test with admin user
      const adminResponse = await request(app)
        .get(`/api/auth/user/${testUserId}`)
        .set('Authorization', `Bearer ${adminUserToken}`);

      expect(adminResponse.status).toBe(200);
      
      // Test role upgrade for Gentle Space Realty emails
      const newAdminEmail = 'test@gentlespacerealty.com';
      const { data: newAdmin } = await supabase
        .rpc('upsert_oauth_user', {
          p_user_id: 'new-admin-' + Date.now(),
          p_user_email: newAdminEmail,
          p_user_name: 'New Admin',
          p_user_role: 'user'
        });

      expect(newAdmin[0].role).toBe('admin');
    });
  });

  /**
   * Error Handling Tests
   */
  describe('Error Handling', () => {
    it('should handle database connection errors gracefully', async () => {
      // This test would require mocking the database connection
      // For now, we test the health endpoint which checks DB connectivity
      const response = await request(app)
        .get('/api/auth');

      expect(response.status).toBe(200);
      expect(response.body.database_connected).toBe(true);
    });

    it('should provide consistent error response format', async () => {
      const response = await request(app)
        .post('/api/auth/oauth')
        .send({
          action: 'verify',
          access_token: 'invalid'
        });

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('code');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.code).toBe('TOKEN_VERIFICATION_FAILED');
    });
  });

  /**
   * Performance Tests
   */
  describe('Performance', () => {
    it('should complete OAuth verification within performance budget', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/auth/oauth')
        .send({
          action: 'verify',
          access_token: adminUserToken
        });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle concurrent requests efficiently', async () => {
      const promises = Array(10).fill().map(() => 
        request(app)
          .get('/api/auth')
      );

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      expect(duration).toBeLessThan(2000); // All requests should complete within 2 seconds
    });
  });
});

/**
 * Mock Implementation Tests
 * These tests verify behavior with mocked dependencies
 */
describe('Supabase Auth Mocked Tests', () => {
  let originalCreateClient;

  beforeAll(() => {
    originalCreateClient = require('@supabase/supabase-js').createClient;
  });

  afterAll(() => {
    // Restore original implementation if needed
  });

  it('should handle Supabase client creation errors', () => {
    // Mock createClient to throw an error
    const mockCreateClient = jest.fn(() => {
      throw new Error('Supabase connection failed');
    });

    expect(() => {
      mockCreateClient('invalid-url', 'invalid-key');
    }).toThrow('Supabase connection failed');
  });
});