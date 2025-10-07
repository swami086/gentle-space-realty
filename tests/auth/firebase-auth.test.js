/**
 * Firebase Authentication Test Suite
 * 
 * Comprehensive tests for Firebase authentication integration,
 * including client-side auth service and server-side middleware.
 */

const request = require('supertest');
const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Import Firebase Auth Service (simulate ES module import)
const FirebaseAuthService = require('../../src/services/firebaseAuthService.ts');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

// Mock Firebase client for testing
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  GoogleAuthProvider: jest.fn()
}));

// Mock Firebase Admin
jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  credential: {
    cert: jest.fn()
  },
  auth: jest.fn(() => ({
    verifyIdToken: jest.fn(),
    createUser: jest.fn(),
    getUserByEmail: jest.fn(),
    setCustomUserClaims: jest.fn()
  }))
}));

describe('Firebase Authentication Integration Tests', () => {
  let app;
  let supabase;
  let mockFirebaseUser;
  let mockIdToken;

  beforeAll(async () => {
    // Initialize test environment
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Mock Firebase user data
    mockFirebaseUser = {
      uid: 'test-firebase-uid-123',
      email: 'test@example.com',
      displayName: 'Test User',
      emailVerified: true,
      photoURL: 'https://example.com/avatar.jpg'
    };

    // Mock Firebase ID token
    mockIdToken = 'mock.firebase.idtoken';

    // Setup Express app for testing
    const express = require('express');
    app = express();
    app.use(express.json());
    
    // Load auth routes
    const authRoutes = require('../../server/routes/auth.cjs');
    app.use('/auth', authRoutes);
  });

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  afterAll(async () => {
    // Cleanup test data from Supabase
    try {
      await supabase
        .from('users')
        .delete()
        .eq('firebase_uid', mockFirebaseUser.uid);
    } catch (error) {
      console.log('Cleanup error (expected in test environment):', error.message);
    }
  });

  describe('Firebase Auth Service Client-Side Tests', () => {
    
    describe('signInWithGoogle', () => {
      test('should successfully sign in with Google', async () => {
        const { signInWithPopup } = require('firebase/auth');
        signInWithPopup.mockResolvedValue({
          user: mockFirebaseUser
        });

        const result = await FirebaseAuthService.signInWithGoogle();
        
        expect(result.user).toBeDefined();
        expect(result.user.uid).toBe(mockFirebaseUser.uid);
        expect(result.user.email).toBe(mockFirebaseUser.email);
        expect(result.error).toBeNull();
      });

      test('should handle sign-in errors gracefully', async () => {
        const { signInWithPopup } = require('firebase/auth');
        const mockError = new Error('Sign-in failed');
        mockError.code = 'auth/popup-closed-by-user';
        signInWithPopup.mockRejectedValue(mockError);

        const result = await FirebaseAuthService.signInWithGoogle();
        
        expect(result.user).toBeNull();
        expect(result.error).toBeDefined();
        expect(result.error.code).toBe('auth/popup-closed-by-user');
      });
    });

    describe('signOut', () => {
      test('should successfully sign out', async () => {
        const { signOut } = require('firebase/auth');
        signOut.mockResolvedValue();

        const result = await FirebaseAuthService.signOut();
        
        expect(result.success).toBe(true);
        expect(result.error).toBeNull();
      });

      test('should handle sign-out errors', async () => {
        const { signOut } = require('firebase/auth');
        const mockError = new Error('Sign-out failed');
        signOut.mockRejectedValue(mockError);

        const result = await FirebaseAuthService.signOut();
        
        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    describe('getCurrentUser', () => {
      test('should return current authenticated user', () => {
        const { getAuth } = require('firebase/auth');
        getAuth.mockReturnValue({
          currentUser: mockFirebaseUser
        });

        const user = FirebaseAuthService.getCurrentUser();
        
        expect(user).toEqual(mockFirebaseUser);
      });

      test('should return null when no user is authenticated', () => {
        const { getAuth } = require('firebase/auth');
        getAuth.mockReturnValue({
          currentUser: null
        });

        const user = FirebaseAuthService.getCurrentUser();
        
        expect(user).toBeNull();
      });
    });
  });

  describe('Server-Side Firebase Auth API Tests', () => {
    
    describe('POST /auth/firebase - verify action (legacy)', () => {
      test('should verify Firebase token and sync user', async () => {
        // Mock Firebase Admin token verification
        const mockDecodedToken = {
          uid: mockFirebaseUser.uid,
          email: mockFirebaseUser.email,
          name: mockFirebaseUser.displayName,
          email_verified: true,
          picture: mockFirebaseUser.photoURL
        };

        admin.auth().verifyIdToken.mockResolvedValue(mockDecodedToken);

        // Mock Supabase upsert function response
        const mockUserProfile = [{
          id: 1,
          firebase_uid: mockFirebaseUser.uid,
          email: mockFirebaseUser.email,
          name: mockFirebaseUser.displayName,
          role: 'user',
          avatar_url: mockFirebaseUser.photoURL
        }];

        // Mock Supabase RPC call
        jest.spyOn(supabase, 'rpc').mockResolvedValue({
          data: mockUserProfile,
          error: null
        });

        const response = await request(app)
          .post('/auth/firebase')
          .send({
            action: 'verify',
            idToken: mockIdToken
          });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Firebase token verified and user synced');
        expect(response.body.user.uid).toBe(mockFirebaseUser.uid);
        expect(response.body.user.email).toBe(mockFirebaseUser.email);
        expect(response.body.profile).toEqual(mockUserProfile[0]);
      });

      test('should return 400 for missing idToken', async () => {
        const response = await request(app)
          .post('/auth/firebase')
          .send({
            action: 'verify'
            // Missing idToken
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Missing Firebase ID token');
        expect(response.body.code).toBe('MISSING_TOKEN');
      });

      test('should return 401 for invalid token', async () => {
        admin.auth().verifyIdToken.mockRejectedValue(new Error('Invalid token'));

        const response = await request(app)
          .post('/auth/firebase')
          .send({
            action: 'verify',
            idToken: 'invalid-token'
          });

        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Invalid Firebase ID token');
        expect(response.body.code).toBe('TOKEN_VERIFICATION_FAILED');
      });

      test('should handle database sync errors', async () => {
        const mockDecodedToken = {
          uid: mockFirebaseUser.uid,
          email: mockFirebaseUser.email,
          name: mockFirebaseUser.displayName,
          email_verified: true
        };

        admin.auth().verifyIdToken.mockResolvedValue(mockDecodedToken);

        // Mock Supabase error
        jest.spyOn(supabase, 'rpc').mockResolvedValue({
          data: null,
          error: { message: 'Database error' }
        });

        const response = await request(app)
          .post('/auth/firebase')
          .send({
            action: 'verify',
            idToken: mockIdToken
          });

        expect(response.status).toBe(500);
        expect(response.body.error).toBe('Failed to sync user with database');
        expect(response.body.code).toBe('USER_SYNC_FAILED');
      });
    });

    describe('New Authentication Flow Tests', () => {
      test('should handle new login flow with access_token', async () => {
        const mockDecodedToken = {
          uid: mockFirebaseUser.uid,
          email: mockFirebaseUser.email,
          name: mockFirebaseUser.displayName,
          email_verified: true
        };

        admin.auth().verifyIdToken.mockResolvedValue(mockDecodedToken);

        const response = await request(app)
          .post('/auth/oauth')
          .send({
            action: 'verify',
            access_token: mockIdToken
          });

        // Expected to hit Firebase verification path
        expect(admin.auth().verifyIdToken).toHaveBeenCalledWith(mockIdToken);
      });

      test('should verify access token via GET /auth/verify', async () => {
        const mockDecodedToken = {
          uid: mockFirebaseUser.uid,
          email: mockFirebaseUser.email,
          name: mockFirebaseUser.displayName
        };

        admin.auth().verifyIdToken.mockResolvedValue(mockDecodedToken);

        const response = await request(app)
          .get(`/auth/verify?access_token=${mockIdToken}`);

        // Should attempt to verify token
        expect(admin.auth().verifyIdToken).toHaveBeenCalledWith(mockIdToken);
      });

      test('should test middleware authentication with new token format', async () => {
        const mockUser = {
          id: mockFirebaseUser.uid,
          firebase_uid: mockFirebaseUser.uid,
          email: mockFirebaseUser.email,
          role: 'user'
        };

        admin.auth().verifyIdToken.mockResolvedValue({
          uid: mockFirebaseUser.uid,
          email: mockFirebaseUser.email
        });

        jest.spyOn(supabase, 'from').mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockUser,
                error: null
              })
            })
          })
        });

        const response = await request(app)
          .get('/auth/profile')
          .set('Authorization', `Bearer ${mockIdToken}`);

        // Should attempt to verify and lookup user
        expect(admin.auth().verifyIdToken).toHaveBeenCalledWith(mockIdToken);
      });
    });

    describe('POST /auth/firebase - sync action', () => {
      test('should sync user data successfully', async () => {
        const mockUserProfile = [{
          id: 2,
          firebase_uid: mockFirebaseUser.uid,
          email: mockFirebaseUser.email,
          name: mockFirebaseUser.displayName,
          role: 'admin',
          avatar_url: mockFirebaseUser.photoURL
        }];

        jest.spyOn(supabase, 'rpc').mockResolvedValue({
          data: mockUserProfile,
          error: null
        });

        const response = await request(app)
          .post('/auth/firebase')
          .send({
            action: 'sync',
            userData: {
              uid: mockFirebaseUser.uid,
              email: mockFirebaseUser.email,
              name: mockFirebaseUser.displayName,
              role: 'admin',
              picture: mockFirebaseUser.photoURL
            }
          });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('User synced successfully');
        expect(response.body.profile).toEqual(mockUserProfile[0]);
      });

      test('should return 400 for missing user data', async () => {
        const response = await request(app)
          .post('/auth/firebase')
          .send({
            action: 'sync'
            // Missing userData
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Missing user data (uid, email required)');
        expect(response.body.code).toBe('MISSING_USER_DATA');
      });
    });

    describe('POST /auth/firebase - invalid action', () => {
      test('should return 400 for unsupported action', async () => {
        const response = await request(app)
          .post('/auth/firebase')
          .send({
            action: 'invalid_action',
            idToken: mockIdToken
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Invalid action. Supported actions: verify, sync');
        expect(response.body.code).toBe('INVALID_ACTION');
      });

      test('should return 400 for missing action', async () => {
        const response = await request(app)
          .post('/auth/firebase')
          .send({
            idToken: mockIdToken
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Missing action parameter');
        expect(response.body.code).toBe('MISSING_ACTION');
      });
    });
  });

  describe('Protected Endpoints Tests', () => {
    
    describe('GET /auth/profile', () => {
      test('should return user profile for authenticated user', async () => {
        // Mock valid Firebase token verification
        admin.auth().verifyIdToken.mockResolvedValue({
          uid: mockFirebaseUser.uid,
          email: mockFirebaseUser.email
        });

        // Mock Supabase user lookup
        const mockSupabaseUser = {
          id: 1,
          firebase_uid: mockFirebaseUser.uid,
          email: mockFirebaseUser.email,
          name: mockFirebaseUser.displayName,
          role: 'user',
          avatar_url: mockFirebaseUser.photoURL
        };

        jest.spyOn(supabase, 'from').mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockSupabaseUser,
                error: null
              })
            })
          })
        });

        const response = await request(app)
          .get('/auth/profile')
          .set('Authorization', `Bearer ${mockIdToken}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Profile retrieved successfully');
        expect(response.body.user.firebase_uid).toBe(mockFirebaseUser.uid);
        expect(response.body.user.email).toBe(mockFirebaseUser.email);
      });

      test('should return 401 for missing Authorization header', async () => {
        const response = await request(app)
          .get('/auth/profile');

        expect(response.status).toBe(401);
      });

      test('should return 401 for invalid token', async () => {
        admin.auth().verifyIdToken.mockRejectedValue(new Error('Invalid token'));

        const response = await request(app)
          .get('/auth/profile')
          .set('Authorization', 'Bearer invalid-token');

        expect(response.status).toBe(401);
      });
    });

    describe('POST /auth/admin', () => {
      test('should allow access for admin users', async () => {
        // Mock valid Firebase token verification
        admin.auth().verifyIdToken.mockResolvedValue({
          uid: mockFirebaseUser.uid,
          email: mockFirebaseUser.email
        });

        // Mock admin user lookup
        const mockAdminUser = {
          id: 1,
          firebase_uid: mockFirebaseUser.uid,
          email: mockFirebaseUser.email,
          role: 'admin'
        };

        jest.spyOn(supabase, 'from').mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockAdminUser,
                error: null
              })
            })
          })
        });

        const response = await request(app)
          .post('/auth/admin')
          .set('Authorization', `Bearer ${mockIdToken}`);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Admin access granted');
        expect(response.body.user.uid).toBe(mockFirebaseUser.uid);
      });

      test('should deny access for non-admin users', async () => {
        // Mock valid Firebase token verification
        admin.auth().verifyIdToken.mockResolvedValue({
          uid: mockFirebaseUser.uid,
          email: mockFirebaseUser.email
        });

        // Mock regular user (non-admin)
        const mockRegularUser = {
          id: 1,
          firebase_uid: mockFirebaseUser.uid,
          email: mockFirebaseUser.email,
          role: 'user'
        };

        jest.spyOn(supabase, 'from').mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockRegularUser,
                error: null
              })
            })
          })
        });

        const response = await request(app)
          .post('/auth/admin')
          .set('Authorization', `Bearer ${mockIdToken}`);

        expect(response.status).toBe(403);
      });
    });
  });

  describe('Legacy Authentication Tests', () => {
    
    describe('POST /auth/legacy - signup', () => {
      test('should create user with legacy Supabase auth', async () => {
        const mockSignUpData = {
          user: {
            id: 'supabase-user-id',
            email: 'legacy@example.com',
            user_metadata: { name: 'Legacy User' }
          }
        };

        // Mock Supabase auth signup
        jest.spyOn(supabase.auth, 'signUp').mockResolvedValue({
          data: mockSignUpData,
          error: null
        });

        const response = await request(app)
          .post('/auth/legacy')
          .send({
            action: 'signup',
            email: 'legacy@example.com',
            password: 'password123',
            name: 'Legacy User'
          });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('User created successfully (legacy)');
        expect(response.body.user).toEqual(mockSignUpData.user);
      });

      test('should return 400 for missing fields', async () => {
        const response = await request(app)
          .post('/auth/legacy')
          .send({
            action: 'signup',
            email: 'legacy@example.com'
            // Missing password and name
          });

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('Missing required fields: email, password, name');
        expect(response.body.code).toBe('MISSING_FIELDS');
      });
    });

    describe('POST /auth/legacy - signin', () => {
      test('should sign in with legacy Supabase auth', async () => {
        const mockSignInData = {
          user: {
            id: 'supabase-user-id',
            email: 'legacy@example.com'
          },
          session: {
            access_token: 'supabase-access-token'
          }
        };

        jest.spyOn(supabase.auth, 'signInWithPassword').mockResolvedValue({
          data: mockSignInData,
          error: null
        });

        const response = await request(app)
          .post('/auth/legacy')
          .send({
            action: 'signin',
            email: 'legacy@example.com',
            password: 'password123'
          });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Sign in successful (legacy)');
        expect(response.body.user).toEqual(mockSignInData.user);
        expect(response.body.session).toEqual(mockSignInData.session);
      });
    });
  });

  describe('Health Check Tests', () => {
    
    test('GET /auth should return service health', async () => {
      const response = await request(app)
        .get('/auth');

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Auth service is healthy');
      expect(response.body.service).toBe('authentication');
      expect(response.body.features).toEqual(['firebase', 'supabase-legacy']);
    });
  });

  describe('Error Handling Tests', () => {
    
    test('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/auth/firebase')
        .send('{ invalid json }')
        .set('Content-Type', 'application/json');

      expect(response.status).toBe(400);
    });

    test('should handle database connection errors gracefully', async () => {
      // Mock Supabase connection error
      jest.spyOn(supabase, 'rpc').mockRejectedValue(new Error('Connection failed'));

      admin.auth().verifyIdToken.mockResolvedValue({
        uid: mockFirebaseUser.uid,
        email: mockFirebaseUser.email
      });

      const response = await request(app)
        .post('/auth/firebase')
        .send({
          action: 'verify',
          idToken: mockIdToken
        });

      expect(response.status).toBe(500);
      expect(response.body.code).toBe('INTERNAL_ERROR');
    });

    test('should include timestamp in all error responses', async () => {
      const response = await request(app)
        .post('/auth/firebase')
        .send({
          action: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body.timestamp).toBeDefined();
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Security Tests', () => {
    
    test('should reject requests with expired tokens', async () => {
      const expiredTokenError = new Error('Token expired');
      expiredTokenError.code = 'auth/id-token-expired';
      admin.auth().verifyIdToken.mockRejectedValue(expiredTokenError);

      const response = await request(app)
        .post('/auth/firebase')
        .send({
          action: 'verify',
          idToken: 'expired-token'
        });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe('TOKEN_VERIFICATION_FAILED');
    });

    test('should sanitize error messages in production', async () => {
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const response = await request(app)
        .post('/auth/firebase')
        .send({
          action: 'verify'
          // Missing token
        });

      expect(response.status).toBe(400);
      expect(response.body.error).not.toContain('stack');
      expect(response.body.error).not.toContain('database');
      
      process.env.NODE_ENV = originalNodeEnv;
    });

    test('should validate CORS headers', async () => {
      const response = await request(app)
        .get('/auth')
        .set('Origin', 'https://malicious-site.com');

      // Should not include CORS headers for unauthorized origins
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('Integration Tests', () => {
    
    test('should complete full authentication flow', async () => {
      // Step 1: Verify Firebase token
      const mockDecodedToken = {
        uid: mockFirebaseUser.uid,
        email: mockFirebaseUser.email,
        name: mockFirebaseUser.displayName,
        email_verified: true,
        picture: mockFirebaseUser.photoURL
      };

      admin.auth().verifyIdToken.mockResolvedValue(mockDecodedToken);

      const mockUserProfile = [{
        id: 1,
        firebase_uid: mockFirebaseUser.uid,
        email: mockFirebaseUser.email,
        name: mockFirebaseUser.displayName,
        role: 'user',
        avatar_url: mockFirebaseUser.photoURL
      }];

      jest.spyOn(supabase, 'rpc').mockResolvedValue({
        data: mockUserProfile,
        error: null
      });

      const verifyResponse = await request(app)
        .post('/auth/firebase')
        .send({
          action: 'verify',
          idToken: mockIdToken
        });

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.user.uid).toBe(mockFirebaseUser.uid);

      // Step 2: Access protected resource
      jest.spyOn(supabase, 'from').mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUserProfile[0],
              error: null
            })
          })
        })
      });

      const profileResponse = await request(app)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${mockIdToken}`);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.user.firebase_uid).toBe(mockFirebaseUser.uid);
    });
  });
});

// Performance Tests
describe('Performance Tests', () => {
  
  test('should handle token verification within acceptable time', async () => {
    admin.auth().verifyIdToken.mockResolvedValue({
      uid: 'test-uid',
      email: 'test@example.com'
    });

    const startTime = Date.now();
    
    const response = await request(app)
      .post('/auth/firebase')
      .send({
        action: 'verify',
        idToken: 'test-token'
      });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    expect(response.status).toBe(500); // Expected due to mock setup
    expect(responseTime).toBeLessThan(5000); // Should complete within 5 seconds
  });
});

// Cleanup and utilities
afterAll(async () => {
  // Clean up any remaining test data
  try {
    await supabase
      .from('users')
      .delete()
      .like('email', '%test%');
  } catch (error) {
    console.log('Final cleanup completed');
  }
});