import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { User, AuthState, LoginCredentials, RegisterData, UserProfile } from '@/types/user';
import { API } from '@/services/apiService';
import { storeAuthTokens, clearAuthTokens, formatApiError } from '@/utils/apiMigrationUtils';
import { createAppError, logError } from '@/utils/errorHandler';
import { Environment } from '@/config/environment';
import type { LoadingState } from '@/types/api';
import { FirebaseAuthService } from '@/lib/firebaseClient';

interface UserStore extends AuthState {
  // Enhanced loading state
  loading: LoadingState;
  
  // Auth methods
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  refreshSession: () => Promise<void>;
  
  // User profile methods
  updateProfile: (profile: Partial<UserProfile>) => Promise<boolean>;
  
  // Saved properties methods
  saveProperty: (propertyId: string) => Promise<boolean>;
  unsaveProperty: (propertyId: string) => Promise<boolean>;
  getSavedProperties: () => string[];
  isPropertySaved: (propertyId: string) => boolean;
  refreshSavedProperties: () => Promise<void>;
  
  // Utility methods
  setUser: (user: User | null) => void;
  setLoading: (loading: Partial<LoadingState>) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

// Safe debug logging helper
const isDebugEnabled = (): boolean => {
  try {
    return Environment.isDebugMode() || Environment.isDevelopment();
  } catch {
    return false; // Safe fallback
  }
};

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      loading: {
        isLoading: false,
        isRefreshing: false,
        isSubmitting: false,
        error: null,
        lastFetchTime: null,
      },

  // Auth methods
  login: async (credentials: LoginCredentials) => {
    set({ 
      isLoading: true, 
      error: null,
      loading: { ...get().loading, isSubmitting: true, error: null }
    });
    
    try {
      if (isDebugEnabled()) {
        console.log('🔐 Starting Firebase login process for:', credentials.email);
      }

      // Login with Firebase Auth
      const { data: user, error } = await FirebaseAuthService.signIn(credentials.email, credentials.password);
      
      if (error || !user) {
        throw new Error(error?.message || 'Login failed');
      }
      
      // Get Firebase ID token
      const idToken = await FirebaseAuthService.getIdToken();
      if (!idToken) {
        throw new Error('Failed to get authentication token');
      }

      // Set Firebase ID token in API service for subsequent requests
      storeAuthTokens(idToken);
      
      // Call backend to verify token and get user data
      const response = await API.auth.login({ idToken } as any);
      
      if (!response.user) {
        throw new Error('Backend authentication failed');
      }
      
      if (isDebugEnabled()) {
        console.log('✅ Login successful for user:', response.user.id);
      }
      
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        loading: {
          ...get().loading,
          isSubmitting: false,
          lastFetchTime: Date.now()
        }
      });
      
      return true;
    } catch (error) {
      const errorMessage = formatApiError(error);
      
      set({
        error: errorMessage,
        isLoading: false,
        loading: {
          ...get().loading,
          isSubmitting: false,
          error: errorMessage
        }
      });
      return false;
    }
  },

  register: async (data: RegisterData) => {
    set({ 
      isLoading: true, 
      error: null,
      loading: { ...get().loading, isSubmitting: true, error: null }
    });
    
    try {
      if (isDebugEnabled()) {
        console.log('🔐 Starting Firebase registration for:', data.email);
      }

      // Register with Firebase Auth
      const { data: user, error } = await FirebaseAuthService.signUp(data.email, data.password, data.name);
      
      if (error || !user) {
        throw new Error(error?.message || 'Registration failed');
      }
      
      // Get Firebase ID token
      const idToken = await FirebaseAuthService.getIdToken();
      if (!idToken) {
        throw new Error('Failed to get authentication token');
      }

      // Set Firebase ID token in API service for subsequent requests
      storeAuthTokens(idToken);
      
      // Call backend to create user record
      const response = await API.auth.register({ idToken, name: data.name } as any);
      
      if (!response.user) {
        throw new Error('Backend user creation failed');
      }

      if (isDebugEnabled()) {
        console.log('✅ Registration successful for user:', response.user.id);
      }
      
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        loading: {
          ...get().loading,
          isSubmitting: false,
          lastFetchTime: Date.now()
        }
      });
      
      return true;
    } catch (error) {
      const errorMessage = formatApiError(error);
      
      set({
        error: errorMessage,
        isLoading: false,
        loading: {
          ...get().loading,
          isSubmitting: false,
          error: errorMessage
        }
      });
      return false;
    }
  },

  loginWithGoogle: async () => {
    set({ 
      isLoading: true, 
      error: null,
      loading: { ...get().loading, isSubmitting: true, error: null }
    });
    
    try {
      if (isDebugEnabled()) {
        console.log('🔐 Starting Firebase Google OAuth login');
      }

      const { data: user, error } = await FirebaseAuthService.signInWithGoogle();
      
      if (error || !user) {
        throw new Error(error?.message || 'Google sign in failed');
      }
      
      // Get Firebase ID token and verify with our backend
      const idToken = await FirebaseAuthService.getIdToken();
      if (!idToken) {
        throw new Error('Failed to get authentication token');
      }

      // Set Firebase ID token in API service for subsequent requests
      storeAuthTokens(idToken);
      
      // Call our backend to verify the token and get user data
      const response = await API.auth.login({ idToken } as any);
      
      if (!response.user) {
        throw new Error('Failed to authenticate with backend');
      }
      
      if (isDebugEnabled()) {
        console.log('✅ Firebase Google OAuth login successful');
      }
      
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        loading: {
          ...get().loading,
          isSubmitting: false,
          lastFetchTime: Date.now()
        }
      });
      
      return true;
    } catch (error) {
      const appError = error instanceof Error ? error : 
                     createAppError(new Error('Google login failed'), 'Google OAuth Login');
      
      set({
        error: appError.message,
        isLoading: false,
        loading: {
          ...get().loading,
          isSubmitting: false,
          error: appError.message
        }
      });
      return false;
    }
  },

  logout: async () => {
    set({ 
      isLoading: true,
      loading: { ...get().loading, isSubmitting: true, error: null }
    });
    
    try {
      if (isDebugEnabled()) {
        console.log('🔐 Starting Firebase logout process');
      }

      // Logout from Firebase first
      const { error: firebaseError } = await FirebaseAuthService.signOut();
      if (firebaseError) {
        console.warn('Firebase logout failed:', firebaseError);
      }

      // Logout from API backend
      try {
        await API.auth.logout();
      } catch (error) {
        // Continue with local cleanup even if server logout fails
        console.warn('Server logout failed, continuing with local cleanup:', error);
      }
      
      // Clear tokens and user state
      clearAuthTokens();
      
      if (isDebugEnabled()) {
        console.log('✅ Logout successful');
      }
      
      // Clear user state
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        loading: {
          isLoading: false,
          isRefreshing: false,
          isSubmitting: false,
          error: null,
          lastFetchTime: null,
        }
      });
    } catch (error) {
      const appError = createAppError(error, 'User Logout');
      
      if (isDebugEnabled()) {
        console.error('❌ Logout error:', appError);
      }
      
      // Clear state anyway to prevent stuck state
      clearAuthTokens();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        loading: {
          isLoading: false,
          isRefreshing: false,
          isSubmitting: false,
          error: null,
          lastFetchTime: null,
        }
      });
    }
  },

  initializeAuth: async () => {
    if (isDebugEnabled()) {
      console.log('🔐 Initializing authentication system with Firebase');
    }

    set({ 
      loading: { ...get().loading, isRefreshing: true, error: null }
    });

    try {
      // CRITICAL FIX: Import Firebase utilities for initialization checks
      const { waitForFirebaseReady, isFirebaseReady, FirebaseAuthService } = await import('@/lib/firebaseClient');
      
      // Check if Firebase is ready, if not wait for it
      if (!isFirebaseReady()) {
        console.log('⏳ Firebase not ready, waiting for initialization...');
        const isReady = await waitForFirebaseReady(5000); // 5 second timeout
        
        if (!isReady) {
          console.warn('⚠️ Firebase initialization timeout during auth init');
          set({ 
            user: null,
            isAuthenticated: false,
            isLoading: false,
            loading: {
              ...get().loading,
              isRefreshing: false,
              error: 'Firebase initialization timeout'
            }
          });
          return;
        }
        
        console.log('✅ Firebase ready after waiting');
      }

      // Check Firebase auth state and sync token with API service
      const currentUser = FirebaseAuthService.getCurrentUser();
      if (currentUser) {
        try {
          const idToken = await FirebaseAuthService.getIdToken();
          if (idToken) {
            console.log('🔑 userStore.initializeAuth: Setting auth token from Firebase');
            storeAuthTokens(idToken);
            
            // Small delay to ensure token is properly set
            await new Promise(resolve => setTimeout(resolve, 100));
          } else {
            console.warn('⚠️ userStore.initializeAuth: No Firebase ID token available');
            clearAuthTokens();
            set({ 
              user: null,
              isAuthenticated: false,
              isLoading: false,
              loading: {
                ...get().loading,
                isRefreshing: false
              }
            });
            return;
          }
        } catch (tokenError) {
          console.error('❌ userStore.initializeAuth: Failed to get Firebase ID token:', tokenError);
          clearAuthTokens();
          set({ 
            user: null,
            isAuthenticated: false,
            isLoading: false,
            loading: {
              ...get().loading,
              isRefreshing: false,
              error: 'Failed to get authentication token'
            }
          });
          return;
        }
      } else {
        console.log('ℹ️ userStore.initializeAuth: No Firebase user found');
        clearAuthTokens();
        set({ 
          user: null,
          isAuthenticated: false,
          isLoading: false,
          loading: {
            ...get().loading,
            isRefreshing: false
          }
        });
        return;
      }
      
      console.log('🔍 userStore.initializeAuth: Attempting to get current user from API');
      
      // Check if we have valid authentication and get user data
      const response = await API.auth.me();
      
      if (response.user) {
        set({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          loading: {
            ...get().loading,
            isRefreshing: false,
            lastFetchTime: Date.now()
          }
        });

        if (isDebugEnabled()) {
          console.log('✅ Auth initialization complete - user authenticated:', response.user.id);
        }
      } else {
        // No valid session, clear any stale tokens
        clearAuthTokens();
        
        set({ 
          user: null,
          isAuthenticated: false,
          isLoading: false,
          loading: {
            ...get().loading,
            isRefreshing: false
          }
        });

        if (isDebugEnabled()) {
          console.log('✅ Auth initialization complete - no user session');
        }
      }
    } catch (error) {
      // Authentication failed, clear any stale tokens
      clearAuthTokens();
      
      const errorMessage = formatApiError(error);
      
      set({ 
        user: null,
        isAuthenticated: false,
        isLoading: false,
        loading: {
          ...get().loading,
          isRefreshing: false,
          error: errorMessage
        }
      });
      
      if (isDebugEnabled()) {
        console.log('⚠️ Auth initialization - no valid session:', errorMessage);
      }
    }
  },

  updateProfile: async (profile: Partial<UserProfile>) => {
    const { user } = get();
    if (!user) return false;
    
    set({ 
      isLoading: true, 
      error: null,
      loading: { ...get().loading, isSubmitting: true, error: null }
    });
    
    try {
      const updatedUser = await API.auth.updateProfile(profile);
      if (updatedUser) {
        set({
          user: updatedUser,
          isLoading: false,
          loading: {
            ...get().loading,
            isSubmitting: false,
            lastFetchTime: Date.now()
          }
        });
        return true;
      }
      return false;
    } catch (error) {
      const errorMessage = formatApiError(error);
      set({
        error: errorMessage,
        isLoading: false,
        loading: {
          ...get().loading,
          isSubmitting: false,
          error: errorMessage
        }
      });
      return false;
    }
  },

  saveProperty: async (propertyId: string) => {
    const { user } = get();
    if (!user) return false;
    
    // STUB: Property saving functionality not implemented in backend yet
    console.warn('saveProperty: Not yet implemented in backend API');
    
    // For now, just update local state
    try {
      const updatedUser = { ...user };
      if (!updatedUser.savedProperties.includes(propertyId)) {
        updatedUser.savedProperties.push(propertyId);
        set({ user: updatedUser });
      }
      return true;
    } catch (error) {
      set({ error: formatApiError(error) });
      return false;
    }
  },

  unsaveProperty: async (propertyId: string) => {
    const { user } = get();
    if (!user) return false;
    
    // STUB: Property unsaving functionality not implemented in backend yet
    console.warn('unsaveProperty: Not yet implemented in backend API');
    
    // For now, just update local state
    try {
      const updatedUser = { ...user };
      updatedUser.savedProperties = updatedUser.savedProperties.filter(id => id !== propertyId);
      set({ user: updatedUser });
      return true;
    } catch (error) {
      set({ error: formatApiError(error) });
      return false;
    }
  },

  refreshSavedProperties: async () => {
    const { user } = get();
    if (!user) return;
    
    if (isDebugEnabled()) {
      console.log('🔄 refreshSavedProperties: Using local state only (backend endpoint not implemented)');
    }

    // STUB: savedProperties refresh not implemented in backend yet
    // This method now uses local state only to avoid calling nonexistent endpoints
    set({
      loading: {
        ...get().loading,
        lastFetchTime: Date.now()
      }
    });

    if (isDebugEnabled()) {
      console.log('✅ Saved properties refresh completed (local state only):', user.savedProperties);
    }
  },

  getSavedProperties: () => {
    const { user } = get();
    return user?.savedProperties || [];
  },

  isPropertySaved: (propertyId: string) => {
    const { user } = get();
    return user?.savedProperties?.includes(propertyId) || false;
  },

  refreshSession: async () => {
    set({
      loading: { ...get().loading, isRefreshing: true, error: null }
    });

    try {
      if (isDebugEnabled()) {
        console.log('🔐 Refreshing Firebase session');
      }

      // Get fresh Firebase ID token
      const idToken = await FirebaseAuthService.getIdToken();
      
      if (idToken) {
        // Update API service with fresh token
        storeAuthTokens(idToken);
        
        // Fetch current user data
        const meResponse = await API.auth.me();
        const user = meResponse.user;
        
        set({
          user,
          isAuthenticated: true,
          loading: {
            ...get().loading,
            isRefreshing: false,
            lastFetchTime: Date.now()
          }
        });

        if (isDebugEnabled()) {
          console.log('✅ Session refresh successful');
        }
      } else {
        // No valid Firebase token, clear user state
        clearAuthTokens();
        
        set({
          user: null,
          isAuthenticated: false,
          loading: {
            ...get().loading,
            isRefreshing: false
          }
        });
      }
    } catch (error) {
      const errorMessage = formatApiError(error);
      
      // Clear tokens on refresh failure
      clearAuthTokens();
      
      set({
        user: null,
        isAuthenticated: false,
        loading: {
          ...get().loading,
          isRefreshing: false,
          error: errorMessage
        }
      });
    }
  },

  // Utility methods
  setUser: (user: User | null) => {
    set({ 
      user, 
      isAuthenticated: !!user,
      loading: {
        ...get().loading,
        lastFetchTime: user ? Date.now() : null
      }
    });
  },

  setLoading: (loading: Partial<LoadingState>) => {
    set({ 
      loading: { ...get().loading, ...loading },
      isLoading: loading.isLoading ?? get().isLoading
    });
  },

  setError: (error: string | null) => {
    set({ 
      error,
      loading: {
        ...get().loading,
        error
      }
    });
  },

  clearError: () => {
    set({ 
      error: null,
      loading: {
        ...get().loading,
        error: null
      }
    });
  },

  reset: () => {
    if (isDebugEnabled()) {
      console.log('🔐 Resetting user store state');
    }

    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      loading: {
        isLoading: false,
        isRefreshing: false,
        isSubmitting: false,
        error: null,
        lastFetchTime: null,
      }
    });
  },
    }),
    {
      name: 'gentle-space-realty-auth-v3',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);