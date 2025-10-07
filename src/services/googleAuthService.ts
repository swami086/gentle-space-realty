import { FirebaseAuthService } from '@/lib/firebaseClient';
import { API } from '@/services/apiService';

export interface GoogleAuthUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  provider: 'google';
}

export class GoogleAuthService {
  static oauthCallbackInProgress = false;
  
  /**
   * Initiate Google OAuth sign-in flow using Firebase Auth
   */
  static async signInWithGoogle(): Promise<{ error: Error | null }> {
    console.log('🔐 GoogleAuthService: Starting Firebase Google OAuth sign-in...');
    
    try {
      const { data: user, error } = await FirebaseAuthService.signInWithGoogle();
      
      if (error || !user) {
        console.error('❌ Firebase Google OAuth sign-in error:', error);
        return { error: error || new Error('Google sign-in failed') };
      }

      console.log('✅ Firebase Google OAuth sign-in successful:', user.email);
      return { error: null };
    } catch (error) {
      console.error('❌ GoogleAuthService.signInWithGoogle error:', error);
      return { 
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  /**
   * Handle OAuth callback - simplified for Firebase
   */
  static async handleAuthCallback(): Promise<{ user: GoogleAuthUser | null; error: Error | null }> {
    console.log('🔄 GoogleAuthService: Handling Firebase auth callback...');
    
    try {
      // Firebase handles OAuth callbacks automatically
      // We just need to check if user is authenticated
      const currentUser = FirebaseAuthService.getCurrentUser();
      
      if (!currentUser) {
        console.log('⚠️ No authenticated user found in callback handler');
        return { user: null, error: null };
      }

      // Convert Firebase user to GoogleAuthUser format
      const googleUser: GoogleAuthUser = {
        id: currentUser.uid,
        email: currentUser.email || '',
        name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        avatar_url: currentUser.photoURL || undefined,
        provider: 'google'
      };

      console.log('✅ Firebase auth callback processed successfully:', googleUser.email);
      return { user: googleUser, error: null };
    } catch (error) {
      console.error('❌ GoogleAuthService.handleAuthCallback error:', error);
      return { 
        user: null, 
        error: error instanceof Error ? error : new Error('Callback processing failed')
      };
    }
  }

  /**
   * Sign out user from Firebase
   */
  static async signOut(): Promise<{ error: Error | null }> {
    console.log('🚪 GoogleAuthService: Signing out...');
    
    try {
      const { error } = await FirebaseAuthService.signOut();
      
      if (error) {
        console.error('❌ Error signing out:', error);
        return { error };
      }

      console.log('✅ Successfully signed out');
      return { error: null };
    } catch (error) {
      console.error('❌ GoogleAuthService.signOut error:', error);
      return { 
        error: error instanceof Error ? error : new Error('Sign-out failed')
      };
    }
  }

  /**
   * Get current authenticated user
   */
  static async getCurrentUser(): Promise<{ user: GoogleAuthUser | null; error: Error | null }> {
    try {
      const currentUser = FirebaseAuthService.getCurrentUser();
      
      if (!currentUser) {
        return { user: null, error: null };
      }

      const googleUser: GoogleAuthUser = {
        id: currentUser.uid,
        email: currentUser.email || '',
        name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        avatar_url: currentUser.photoURL || undefined,
        provider: 'google'
      };

      return { user: googleUser, error: null };
    } catch (error) {
      console.error('❌ GoogleAuthService.getCurrentUser error:', error);
      return { 
        user: null, 
        error: error instanceof Error ? error : new Error('Failed to get current user')
      };
    }
  }

  /**
   * Check if current user has admin privileges
   */
  static async checkAdminAccess(userId: string): Promise<boolean> {
    try {
      console.log('🔍 Checking admin access for user:', userId);
      
      // Use our API service to check user role
      const response = await API.auth.me();
      
      if (!response.user) {
        return false;
      }

      const isAdmin = response.user.role === 'admin' || response.user.role === 'super_admin';
      console.log('✅ Admin access check result:', isAdmin, `(role: ${response.user.role})`);
      return isAdmin;
    } catch (error) {
      console.error('❌ Error checking admin access:', error);
      return false;
    }
  }

  /**
   * Get user role for a specific user ID
   */
  static async getUserRole(userId: string): Promise<'user' | 'admin' | 'super_admin' | null> {
    try {
      console.log('🔍 Getting user role for user:', userId);
      
      // Use our API service to get user data
      const response = await API.auth.me();
      
      if (!response.user) {
        return null;
      }

      const role = response.user.role || 'user';
      console.log('✅ User role retrieved:', role);
      return role as 'user' | 'admin' | 'super_admin';
    } catch (error) {
      console.error('❌ Error getting user role:', error);
      return null;
    }
  }
}