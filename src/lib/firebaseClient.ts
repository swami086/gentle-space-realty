/**
 * Firebase Authentication Client - Stabilized Integration
 * Simplified and stabilized authentication flow for admin login
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  UserCredential,
  Unsubscribe
} from 'firebase/auth';
import { Environment } from '../config/environment';
import { createLogger } from '../utils/logger';

const logger = createLogger();

/**
 * Get Firebase configuration from environment
 */
function getFirebaseConfig() {
  return {
    apiKey: Environment.getFirebaseApiKey(),
    authDomain: Environment.getFirebaseAuthDomain(),
    projectId: Environment.getFirebaseProjectId(),
    storageBucket: Environment.getFirebaseStorageBucket(),
    messagingSenderId: Environment.getFirebaseMessagingSenderId(),
    appId: Environment.getFirebaseAppId()
  };
}

// Simplified connection tracking - remove complex reconnection logic
let connectionHealthy = true;

// Stable Firebase app and auth instances
let app: FirebaseApp | null = null;
let auth: Auth | null = null;

/**
 * Simplified Firebase initialization - remove complex retry logic
 */
function initializeFirebase(): { app: FirebaseApp; auth: Auth } {
  if (app && auth) {
    return { app, auth };
  }

  try {
    // Initialize Firebase app if not already initialized
    if (getApps().length === 0) {
      const config = getFirebaseConfig();
      app = initializeApp(config);
      console.log('✅ Firebase app initialized successfully');
    } else {
      app = getApps()[0];
    }

    // Initialize Firebase Auth
    auth = getAuth(app);
    
    // Simple debug logging
    console.log('✅ Firebase Auth initialized successfully');

    return { app, auth };
  } catch (error) {
    console.error('[Firebase] Failed to initialize:', error instanceof Error ? error.message : error);
    throw error;
  }
}

/**
 * Simplified Firebase ready check
 */
export function isFirebaseReady(): boolean {
  try {
    return app !== null && auth !== null;
  } catch (error) {
    console.error('[Firebase] Error checking ready state:', error);
    return false;
  }
}

/**
 * Wait for Firebase to be ready with timeout
 */
export async function waitForFirebaseReady(timeoutMs: number = 5000): Promise<boolean> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const checkReady = () => {
      if (isFirebaseReady()) {
        resolve(true);
        return;
      }
      
      if (Date.now() - startTime >= timeoutMs) {
        console.warn(`[Firebase] Ready timeout after ${timeoutMs}ms`);
        resolve(false);
        return;
      }
      
      // Try to initialize if not ready
      try {
        initializeFirebase();
        if (isFirebaseReady()) {
          resolve(true);
          return;
        }
      } catch (error) {
        console.error('[Firebase] Initialization error during wait:', error);
      }
      
      // Check again in 100ms
      setTimeout(checkReady, 100);
    };
    
    checkReady();
  });
}

/**
 * Simplified Firebase auth instance getter
 */
export function getFirebaseAuth(): Auth | null {
  try {
    if (!isFirebaseReady()) {
      const { auth } = initializeFirebase();
      return auth;
    }
    
    return auth;
  } catch (error) {
    console.error('[Firebase] Failed to get auth instance:', error);
    return null;
  }
}

// Simplified Authentication service - focus on reliability over features
export const FirebaseAuthService = {
  /**
   * Simplified sign in with email and password - remove complex backend integration
   */
  signIn: async (email: string, password: string): Promise<{ data: { user: User } | null; error: Error | null }> => {
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }

      const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log('✅ Firebase sign in successful');

      return {
        data: { user },
        error: null
      };
    } catch (error: any) {
      console.error('Firebase signIn error:', error);
      return {
        data: null,
        error: new Error(error.message || 'Sign in failed')
      };
    }
  },

  /**
   * Sign up with email and password
   */
  signUp: async (email: string, password: string, displayName?: string): Promise<{ data: { user: User } | null; error: Error | null }> => {
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }

      const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update display name if provided
      if (displayName) {
        await updateProfile(user, { displayName });
      }

      // Get Firebase ID token to send to backend
      const idToken = await user.getIdToken();
      
      // Call backend to create user record
      const response = await fetch(`${Environment.getApiBaseUrl()}/v1/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          idToken,
          name: displayName 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      if (Environment.isDebugMode()) {
        console.log('✅ Firebase sign up successful');
      }

      return {
        data: { user },
        error: null
      };
    } catch (error: any) {
      logger.error('Firebase signUp error:', error);
      return {
        data: null,
        error: new Error(error.message || 'Sign up failed')
      };
    }
  },

  /**
   * Sign in with Google
   */
  signInWithGoogle: async (): Promise<{ data: { user: User } | null; error: Error | null }> => {
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }

      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      const userCredential: UserCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Get Firebase ID token to send to backend
      const idToken = await user.getIdToken();
      
      // Call backend to verify token and get/create user record
      const response = await fetch(`${Environment.getApiBaseUrl()}/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Google sign in failed');
      }

      if (Environment.isDebugMode()) {
        console.log('✅ Google sign in successful');
      }

      return {
        data: { user },
        error: null
      };
    } catch (error: any) {
      logger.error('Firebase signInWithGoogle error:', error);
      return {
        data: null,
        error: new Error(error.message || 'Google sign in failed')
      };
    }
  },

  /**
   * Sign out current user
   */
  signOut: async (): Promise<{ error: Error | null }> => {
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }

      await signOut(auth);
      
      // Call backend logout endpoint
      try {
        await fetch(`${Environment.getApiBaseUrl()}/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });
      } catch (backendError) {
        // Backend logout is optional, continue even if it fails
        console.warn('Backend logout failed:', backendError);
      }

      if (Environment.isDebugMode()) {
        console.log('✅ Firebase sign out successful');
      }

      return { error: null };
    } catch (error: any) {
      logger.error('Firebase signOut error:', error);
      return {
        error: new Error(error.message || 'Sign out failed')
      };
    }
  },

  /**
   * Get current user
   */
  getCurrentUser: (): User | null => {
    try {
      const auth = getFirebaseAuth();
      if (!auth) {
        return null;
      }
      return auth.currentUser;
    } catch (error) {
      console.error('Firebase getCurrentUser error:', error);
      return null;
    }
  },

  /**
   * Get current user session (Supabase compatibility)
   */
  getSession: async (): Promise<{ data: { session: { user: User } | null }; error: Error | null }> => {
    try {
      const user = FirebaseAuthService.getCurrentUser();
      return {
        data: {
          session: user ? { user } : null
        },
        error: null
      };
    } catch (error: any) {
      return {
        data: { session: null },
        error: new Error(error.message || 'Failed to get session')
      };
    }
  },

  /**
   * Listen to authentication state changes
   */
  onAuthStateChange: (callback: (user: User | null) => void): Unsubscribe => {
    const auth = getFirebaseAuth();
    if (!auth) {
      console.error('Firebase Auth not initialized');
      return () => {}; // Return empty unsubscribe function
    }

    return onAuthStateChanged(auth, callback);
  },

  /**
   * Simplified and reliable ID token getter - force token refresh for reliability
   */
  getIdToken: async (forceRefresh: boolean = true): Promise<string | null> => {
    try {
      const user = FirebaseAuthService.getCurrentUser();
      if (!user) {
        return null;
      }
      return await user.getIdToken(forceRefresh);
    } catch (error) {
      console.error('Firebase getIdToken error:', error);
      return null;
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (updates: { displayName?: string }): Promise<{ error: Error | null }> => {
    try {
      const user = FirebaseAuthService.getCurrentUser();
      if (!user) {
        throw new Error('No authenticated user');
      }

      await updateProfile(user, updates);

      if (Environment.isDebugMode()) {
        console.log('✅ Firebase profile updated');
      }

      return { error: null };
    } catch (error: any) {
      logger.error('Firebase updateProfile error:', error);
      return {
        error: new Error(error.message || 'Profile update failed')
      };
    }
  }
};

// Simplified connection health check - remove complex retry logic
export const checkConnectionHealth = async (): Promise<boolean> => {
  try {
    const auth = getFirebaseAuth();
    if (!auth) {
      return false;
    }
    
    // Simple check - try to access auth instance
    return auth !== null;
  } catch (err) {
    console.error('❌ Firebase connection health check error:', err);
    return false;
  }
};

// Simplified authentication initialization - remove complex session handling
export const initializeAuth = async () => {
  try {
    const auth = getFirebaseAuth();
    if (!auth) {
      console.warn('[Auth] Firebase auth not available - skipping auth initialization');
      return null;
    }

    // Simple current user check
    const user = auth.currentUser;
    
    if (user) {
      console.log('✅ Existing Firebase session found, user authenticated');
    }
    
    return user;
  } catch (error) {
    console.error('❌ Firebase auth initialization failed:', error);
    return null;
  }
};

// Enhanced error handling utility
export const handleFirebaseError = (error: any, operation: string): Error => {
  const errorMessage = `Firebase ${operation} failed: ${error?.message || 'Unknown error'}`;
  
  if (Environment.isDebugMode()) {
    console.error(`❌ ${errorMessage}`, {
      code: error?.code,
      operation
    });
  }
  
  // Categorize Firebase errors for better handling
  if (error?.code === 'auth/user-not-found') {
    return new Error(`${operation}: User not found`);
  } else if (error?.code === 'auth/wrong-password') {
    return new Error(`${operation}: Invalid password`);
  } else if (error?.code === 'auth/email-already-in-use') {
    return new Error(`${operation}: Email already registered`);
  } else if (error?.code === 'auth/weak-password') {
    return new Error(`${operation}: Password too weak`);
  } else if (error?.code === 'auth/invalid-email') {
    return new Error(`${operation}: Invalid email format`);
  } else if (error?.code === 'auth/too-many-requests') {
    return new Error(`${operation}: Too many attempts, please try again later`);
  } else if (error?.code === 'auth/network-request-failed') {
    return new Error(`${operation}: Network error, please check connection`);
  }
  
  return new Error(errorMessage);
};

// Legacy compatibility exports
export const firebase = FirebaseAuthService;
export const firebaseAuth = FirebaseAuthService;

// Default export for compatibility
export default FirebaseAuthService;