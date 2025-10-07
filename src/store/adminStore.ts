import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Admin, CustomerInquiry, DashboardStats, Testimonial, TestimonialStats } from '@/types/admin';
import { Property } from '@/types/property';
import { API, ApiService } from '@/services/apiService';
import { storeAuthTokens, clearAuthTokens, formatApiError } from '@/utils/apiMigrationUtils';
import { createAppError, logError } from '@/utils/errorHandler';
import { Environment } from '@/config/environment';
import type { LoadingState, BaseStoreState, AdminStoreState } from '@/types/api';
import { logAuthState, logAdminStoreState } from '@/utils/debugHelper';

interface AdminStore extends AdminStoreState {
  // Auth (extends AdminStoreState)
  admin: Admin | null;
  isRestoringAuth: boolean;
  
  // Properties
  adminProperties: Property[];
  
  // Testimonials
  testimonials: Testimonial[];
  testimonialStats: TestimonialStats | null;
  
  // Dashboard
  dashboardStats: DashboardStats | null;
  
  // Additional loading states beyond base
  isLoading: boolean;
  error: string | null;
  
  // Actions - Backend API auth methods
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  restoreFirebaseToken: () => Promise<void>;
  setAdmin: (admin: Admin) => void;
  setAuthenticated: (authenticated: boolean) => void;
  
  // Property actions
  addProperty: (property: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProperty: (id: string, property: Partial<Property>) => Promise<void>;
  deleteProperty: (id: string) => void;
  setAdminProperties: (properties: Property[]) => void;
  
  // Inquiry actions
  addInquiry: (inquiry: Omit<CustomerInquiry, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateInquiry: (id: string, inquiry: Partial<CustomerInquiry>) => Promise<void>;
  deleteInquiry: (id: string) => Promise<void>;
  setInquiries: (inquiries: CustomerInquiry[]) => void;
  loadInquiries: () => Promise<void>;
  
  // Testimonial actions
  loadTestimonials: () => Promise<void>;
  updateTestimonialStatus: (id: string, status: 'pending' | 'approved' | 'rejected', adminEmail?: string, rejectionReason?: string) => Promise<void>;
  deleteTestimonial: (id: string) => Promise<void>;
  loadTestimonialStats: () => Promise<void>;
  setTestimonials: (testimonials: Testimonial[]) => void;
  
  // Dashboard actions
  setDashboardStats: (stats: DashboardStats) => void;
  
  // Utility actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refreshAll: () => Promise<void>;
  clearCache: () => void;
}


// Safe debug logging helper
const isDebugEnabled = (): boolean => {
  try {
    return Environment.isDebugMode() || Environment.isDevelopment();
  } catch {
    return false; // Safe fallback
  }
};

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      // Initial state - simplified authentication state management
      admin: null,
      isAdminAuthenticated: false,
      adminUser: null,
      isAuthenticated: false,
      isRestoringAuth: false,
      adminProperties: [],
      inquiries: [],
      testimonials: [],
      testimonialStats: null,
      dashboardStats: null,
      isLoading: false,
      error: null,
      loading: {
        isLoading: false,
        isRefreshing: false,
        isSubmitting: false,
        error: null,
        lastFetchTime: null,
      },
      initialized: false,
      lastUpdate: 0,
      stats: null,
      _authOperationInProgress: false, // Authentication flow guard

  // Auth actions - Simplified and stabilized authentication flow

  login: async (email: string, password: string) => {
    // Authentication flow guard - prevent concurrent login operations
    const currentState = get();
    if (currentState._authOperationInProgress) {
      console.warn('⚠️ AdminStore.login: Authentication operation already in progress, skipping');
      return false;
    }
    
    set({ 
      _authOperationInProgress: true,
      isLoading: true, 
      error: null,
      loading: { ...get().loading, isSubmitting: true, error: null }
    });
    
    if (isDebugEnabled()) {
      logAuthState({ isAuthenticated: false, loading: true }, 'login_start');
      console.log('🔐 AdminStore.login: Starting simplified authentication process', { email });
    }
    
    try {
      // Sign in via FirebaseAuthService
      const { FirebaseAuthService } = await import('@/lib/firebaseClient');
      const firebaseResult = await FirebaseAuthService.signIn(email, password);
      
      if (firebaseResult.error || !firebaseResult.data?.user) {
        throw new Error(firebaseResult.error?.message || 'Firebase authentication failed');
      }

      // Get ID token synchronously
      const idToken = await FirebaseAuthService.getIdToken();
      if (!idToken) {
        throw new Error('Failed to get Firebase ID token');
      }

      // Set token immediately in ApiService - make this synchronous
      ApiService.setAuth(idToken);

      // Call API.auth.login({ idToken })
      const authResponse = await API.auth.login({ idToken });

      if (!authResponse?.user) {
        throw new Error('Authentication failed - no user data');
      }

      // Check if user has admin role
      const userRole = authResponse.user.role;
      const isAdmin = ['admin', 'super_admin', 'agent'].includes(userRole);
      if (!isAdmin) {
        const errorMsg = 'Access denied - admin privileges required';
        throw new Error(errorMsg);
      }

      // Check if user account is active
      if (!authResponse.user.is_active) {
        throw new Error('Account is not active');
      }

      // Create admin object
      const admin: Admin = {
        id: authResponse.user.id,
        email: authResponse.user.email,
        name: authResponse.user.name || 'Admin User',
        role: authResponse.user.role as 'admin' | 'super_admin' | 'agent',
        permissions: authResponse.user.role === 'super_admin' ? ['all'] : ['properties', 'inquiries', 'testimonials'],
        createdAt: new Date().toISOString()
      };

      const now = Date.now();
      
      // Set stable authentication state atomically
      set({ 
        admin,
        adminUser: admin,
        isAuthenticated: true,
        isAdminAuthenticated: true,
        isLoading: false,
        error: null,
        initialized: true,
        lastUpdate: now,
        _authOperationInProgress: false,
        loading: {
          ...get().loading,
          isSubmitting: false,
          lastFetchTime: now,
          error: null
        }
      });
      
      logAuthState({ 
        isAuthenticated: true, 
        user: admin, 
        token: idToken, 
        loading: false, 
        error: null 
      }, 'login_success');
      
      if (isDebugEnabled()) {
        console.log('✅ AdminStore.login: Authentication completed successfully', {
          email: admin.email,
          role: admin.role
        });
      }
      
      return true;
        
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      
      logAuthState({ isAuthenticated: false, loading: false, error: errorMessage }, 'login_failed');
      
      set({ 
        error: errorMessage, 
        isLoading: false,
        _authOperationInProgress: false,
        loading: {
          ...get().loading,
          isSubmitting: false,
          error: errorMessage
        }
      });
      
      if (isDebugEnabled()) {
        console.error('❌ AdminStore.login: Authentication failed:', errorMessage);
      }
      
      return false;
    }
  },

  getCurrentUser: async () => {
    const currentState = get();
    
    // Prevent session restoration during active login processes
    if (currentState._authOperationInProgress) {
      if (isDebugEnabled()) {
        console.log('⚠️ AdminStore.getCurrentUser: Auth operation in progress, skipping session restoration');
      }
      return;
    }
    
    // Prevent multiple simultaneous calls
    if (currentState.isRestoringAuth) {
      if (isDebugEnabled()) {
        console.log('⚠️ AdminStore.getCurrentUser: Already restoring, skipping');
      }
      return;
    }
    
    // If already authenticated, no need to restore
    if (currentState.isAuthenticated && currentState.admin) {
      if (isDebugEnabled()) {
        console.log('✅ AdminStore.getCurrentUser: Already authenticated, skipping');
      }
      return;
    }
    
    if (isDebugEnabled()) {
      console.log('🔐 AdminStore.getCurrentUser: Starting simplified session restoration');
    }
    
    set({ isRestoringAuth: true, error: null });
    
    try {
      const { FirebaseAuthService } = await import('@/lib/firebaseClient');
      
      // Simple check for Firebase user
      const currentUser = FirebaseAuthService.getCurrentUser();
      if (!currentUser) {
        if (isDebugEnabled()) {
          console.log('⚠️ AdminStore.getCurrentUser: No Firebase user found');
        }
        set({ isRestoringAuth: false });
        return;
      }

      // Get ID token
      const idToken = await FirebaseAuthService.getIdToken();
      if (!idToken) {
        if (isDebugEnabled()) {
          console.log('⚠️ AdminStore.getCurrentUser: No Firebase ID token available');
        }
        set({ isRestoringAuth: false });
        return;
      }

      // Set token synchronously
      ApiService.setAuth(idToken);

      // Get current user from API
      const userResponse = await API.auth.me();
      
      if (!userResponse?.user) {
        // Clear auth and return
        await FirebaseAuthService.signOut();
        ApiService.setAuth('');
        set({ isRestoringAuth: false, error: 'User session not found' });
        return;
      }

      // Validate user role and status
      const userRole = userResponse.user.role;
      const isAdmin = ['admin', 'super_admin', 'agent'].includes(userRole);
      const isActive = userResponse.user.is_active;
      
      if (!isAdmin || !isActive) {
        await FirebaseAuthService.signOut();
        ApiService.setAuth('');
        set({ 
          isRestoringAuth: false, 
          error: !isAdmin ? 'Access denied - admin privileges required' : 'Account is inactive'
        });
        return;
      }

      // Create admin object
      const admin: Admin = {
        id: userResponse.user.id,
        email: userResponse.user.email,
        name: userResponse.user.name || 'Admin User',
        role: userResponse.user.role as 'admin' | 'super_admin' | 'agent',
        permissions: userResponse.user.role === 'super_admin' ? ['all'] : ['properties', 'inquiries', 'testimonials'],
        createdAt: userResponse.user.created_at || new Date().toISOString(),
      };
      
      const now = Date.now();
      
      // Set authentication state
      set({ 
        admin,
        adminUser: admin,
        isAuthenticated: true,
        isAdminAuthenticated: true,
        isRestoringAuth: false,
        error: null,
        initialized: true,
        lastUpdate: now
      });
      
      if (isDebugEnabled()) {
        console.log('✅ AdminStore.getCurrentUser: Session restored successfully', {
          email: admin.email,
          role: admin.role
        });
      }
      
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Session restoration failed';
      
      if (isDebugEnabled()) {
        console.error('❌ AdminStore.getCurrentUser error:', errorMessage);
      }
      
      // Clean up on error
      try {
        const { FirebaseAuthService } = await import('@/lib/firebaseClient');
        await FirebaseAuthService.signOut();
        ApiService.setAuth('');
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
      
      set({ 
        isRestoringAuth: false, 
        error: `Session restoration failed: ${errorMessage}`,
        admin: null,
        adminUser: null,
        isAuthenticated: false,
        isAdminAuthenticated: false
      });
    }
  },

  // Simplified Firebase token restoration
  restoreFirebaseToken: async () => {
    const currentState = get();
    
    if (!currentState.isAuthenticated || !currentState.admin) {
      if (isDebugEnabled()) {
        console.log('⚠️ AdminStore.restoreFirebaseToken: No authenticated user to restore token for');
      }
      return;
    }
    
    if (isDebugEnabled()) {
      console.log('🔐 AdminStore.restoreFirebaseToken: Starting token restoration', { user: currentState.admin.email });
    }
    
    try {
      const { FirebaseAuthService } = await import('@/lib/firebaseClient');
      const currentUser = FirebaseAuthService.getCurrentUser();
      
      if (!currentUser) {
        if (isDebugEnabled()) {
          console.log('⚠️ AdminStore.restoreFirebaseToken: No Firebase user found, clearing auth state');
        }
        set({ 
          admin: null,
          adminUser: null,
          isAuthenticated: false,
          isAdminAuthenticated: false,
          error: 'Session expired - please log in again'
        });
        return;
      }

      // Get fresh ID token
      const idToken = await FirebaseAuthService.getIdToken();
      if (!idToken) {
        throw new Error('Unable to get Firebase ID token');
      }

      // Set token synchronously
      ApiService.setAuth(idToken);
      
      if (isDebugEnabled()) {
        console.log('✅ AdminStore.restoreFirebaseToken: Token restored successfully');
      }
        
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token restoration failed';
      
      if (isDebugEnabled()) {
        console.error('❌ AdminStore.restoreFirebaseToken: Token restoration failed:', errorMessage);
      }
      
      set({ 
        admin: null,
        adminUser: null,
        isAuthenticated: false,
        isAdminAuthenticated: false,
        error: `Token restoration failed: ${errorMessage}`
      });
    }
  },

  logout: async () => {
    const currentUser = get().admin;
    
    if (isDebugEnabled()) {
      console.log('🔐 AdminStore.logout: Starting logout process', { user: currentUser?.email });
    }
    
    // Set auth operation guard to prevent interference
    set({ _authOperationInProgress: true });
    
    try {
      // Sign out from services
      const { FirebaseAuthService } = await import('@/lib/firebaseClient');
      
      await Promise.allSettled([
        FirebaseAuthService.signOut(),
        ApiService.setAuth('') // Clear API auth token
      ]);
      
      if (isDebugEnabled()) {
        console.log('✅ AdminStore.logout: Successfully signed out from all services');
      }
      
    } catch (error) {
      if (isDebugEnabled()) {
        console.warn('⚠️ AdminStore.logout: Error during logout, continuing with cleanup:', error);
      }
      
      // Force cleanup even if logout services fail
      try {
        const { FirebaseAuthService } = await import('@/lib/firebaseClient');
        await FirebaseAuthService.signOut();
        ApiService.setAuth('');
      } catch (cleanupError) {
        console.error('Error during force cleanup:', cleanupError);
      }
    }
    
    // Always clear store state atomically
    const cleanState = {
      admin: null,
      adminUser: null,
      isAuthenticated: false,
      isAdminAuthenticated: false,
      isRestoringAuth: false,
      _authOperationInProgress: false,
      adminProperties: [], 
      inquiries: [], 
      testimonials: [],
      dashboardStats: null,
      error: null,
      initialized: false,
      lastUpdate: 0,
      isLoading: false,
      loading: {
        isLoading: false,
        isRefreshing: false,
        isSubmitting: false,
        error: null,
        lastFetchTime: null,
      },
      stats: null
    };
    
    set(cleanState);
    
    if (isDebugEnabled()) {
      console.log('✅ AdminStore.logout: Store state cleared successfully');
    }
  },

  setAdmin: (admin) => {
    console.log('👤 AdminStore.setAdmin: Setting admin user:', admin.email);
    set({ admin });
  },


  setAuthenticated: (authenticated) => {
    console.log('🔐 AdminStore.setAuthenticated: Setting authentication status:', authenticated);
    set({ isAuthenticated: authenticated });
  },


  // Property actions
  addProperty: async (propertyData) => {
    console.log('🏪 AdminStore.addProperty called');
    console.log('📊 Property data received:', propertyData);
    
    try {
      console.log('🔄 Calling API.properties.create...');
      const newProperty = await API.properties.create(propertyData);
      console.log('📋 API.properties.create returned:', newProperty);
      
      if (newProperty) {
        console.log('✅ New property created, refreshing list...');
        // Refresh the entire admin properties list to ensure consistency
        const updatedProperties = await API.properties.getAll();
        console.log('📝 Updated properties list:', updatedProperties.length, 'items');
        set({
          adminProperties: updatedProperties
        });
        console.log('✅ AdminStore state updated successfully');
      } else {
        console.error('❌ API.properties.create returned null');
        throw new Error('Property creation returned null');
      }
    } catch (error) {
      console.error('❌ AdminStore.addProperty error:', error);
      console.error('   Error type:', typeof error);
      console.error('   Error message:', error?.message);
      console.error('   Error stack:', error?.stack);
      throw error;
    }
  },

  updateProperty: async (id, propertyData) => {
    try {
      const updatedProperty = await API.properties.update(id, propertyData);
      if (updatedProperty) {
        // Refresh the entire admin properties list to ensure consistency
        const updatedProperties = await API.properties.getAll();
        set({
          adminProperties: updatedProperties
        });
      }
    } catch (error) {
      console.error('Failed to update property:', error);
      throw error;
    }
  },

  deleteProperty: (id) => {
    set(state => ({
      adminProperties: state.adminProperties.filter(property => property.id !== id)
    }));
  },

  setAdminProperties: (properties) => {
    set({ adminProperties: properties });
  },

  // Inquiry actions
  addInquiry: async (inquiryData) => {
    console.log('🏪 AdminStore.addInquiry called');
    console.log('📊 Inquiry data received:', inquiryData);
    
    try {
      console.log('🔄 Calling API.inquiries.create...');
      const newInquiry = await API.inquiries.create(inquiryData);
      console.log('📋 API.inquiries.create returned:', newInquiry);
      
      if (newInquiry) {
        console.log('✅ New inquiry created, refreshing list...');
        // Refresh the entire inquiries list to ensure consistency
        const updatedInquiries = await API.inquiries.getAll();
        console.log('📝 Updated inquiries list:', updatedInquiries.length, 'items');
        
        // Transform the Supabase inquiries to match our CustomerInquiry type
        const transformedInquiries: CustomerInquiry[] = updatedInquiries.map((inquiry: any) => ({
          id: inquiry.id,
          name: inquiry.name,
          email: inquiry.email,
          phone: inquiry.phone,
          company: inquiry.company || undefined, // company field may not exist in DB
          message: inquiry.message,
          propertyTitle: inquiry.property_title || inquiry.propertyTitle || undefined, // Use direct field instead of joined
          status: inquiry.status as CustomerInquiry['status'],
          priority: inquiry.priority as CustomerInquiry['priority'],
          notes: inquiry.notes,
          createdAt: inquiry.created_at,
          updatedAt: inquiry.updated_at,
        }));
        
        set({ inquiries: transformedInquiries });
        console.log('✅ AdminStore inquiries updated successfully');
      } else {
        console.error('❌ API.inquiries.create returned null');
        throw new Error('Inquiry creation returned null');
      }
    } catch (error) {
      console.error('❌ AdminStore.addInquiry error:', error);
      console.error('   Error type:', typeof error);
      console.error('   Error message:', error?.message);
      console.error('   Error stack:', error?.stack);
      throw error;
    }
  },

  updateInquiry: async (id, inquiryData) => {
    console.log('🔄 AdminStore.updateInquiry called with:', { id, inquiryData });
    
    try {
      // First update the database
      await API.inquiries.update(id, inquiryData);
      
      // Then update local state
      set(state => ({
        inquiries: state.inquiries.map(inquiry =>
          inquiry.id === id
            ? { ...inquiry, ...inquiryData, updatedAt: new Date().toISOString() }
            : inquiry
        )
      }));
      
      console.log('✅ AdminStore inquiry updated successfully');
    } catch (error) {
      console.error('❌ AdminStore.updateInquiry error:', error);
      throw error;
    }
  },

  deleteInquiry: async (id) => {
    console.log('🗑️ AdminStore.deleteInquiry called with:', id);
    
    try {
      await API.inquiries.delete(id);
      
      // Remove from local state
      set(state => ({
        inquiries: state.inquiries.filter(inquiry => inquiry.id !== id)
      }));
      
      console.log('✅ AdminStore inquiry deleted successfully');
    } catch (error) {
      console.error('❌ AdminStore.deleteInquiry error:', error);
      throw error;
    }
  },

  setInquiries: (inquiries) => {
    set({ inquiries });
  },

  loadInquiries: async () => {
    console.log('📋 AdminStore.loadInquiries called');
    
    try {
      // Add Sentry tracking for inquiry loading
      const { trackTransaction, addBreadcrumb } = await import('@/utils/sentry');
      
      const transaction = trackTransaction('admin_load_inquiries', () => {
        addBreadcrumb('Loading inquiries from API', 'admin', 'info');
      });

      // Check authentication state
      const { isAuthenticated, admin } = get();
      console.log('🔐 AdminStore.loadInquiries: Current auth state:', { isAuthenticated, hasAdmin: !!admin });
      
      if (!isAuthenticated || !admin) {
        console.log('⚠️ AdminStore.loadInquiries: User not authenticated in store');
        addBreadcrumb('User not authenticated for inquiry loading', 'admin', 'warning');
        throw new Error('User must be authenticated to load inquiries');
      }

      // ENHANCED: Wait for both Firebase AND AdminStore authentication to be synchronized
      const { ApiService } = await import('@/services/apiService');
      const { FirebaseAuthService, waitForFirebaseReady } = await import('@/lib/firebaseClient');
      
      console.log('🔑 AdminStore.loadInquiries: Ensuring Firebase authentication synchronization');
      
      // First, ensure Firebase is completely ready
      const firebaseReady = await waitForFirebaseReady(10000); // 10 second timeout
      if (!firebaseReady) {
        throw new Error('Firebase authentication service not ready');
      }
      
      // Second, verify Firebase user exists and matches AdminStore
      const firebaseUser = FirebaseAuthService.getCurrentUser();
      if (!firebaseUser) {
        console.error('❌ AdminStore.loadInquiries: Firebase user not found despite AdminStore being authenticated');
        throw new Error('Firebase user session not found - please log in again');
      }
      
      if (firebaseUser.email !== admin.email) {
        console.error('❌ AdminStore.loadInquiries: Firebase user email mismatch', {
          firebaseEmail: firebaseUser.email,
          adminEmail: admin.email
        });
        throw new Error('Firebase user session mismatch - please log in again');
      }
      
      console.log('✅ AdminStore.loadInquiries: Firebase authentication synchronized', {
        firebaseEmail: firebaseUser.email,
        adminEmail: admin.email
      });
      
      try {
        // Force a fresh token retrieval with the synchronized Firebase user
        const freshToken = await FirebaseAuthService.getIdToken(true); // Force refresh
        
        if (!freshToken) {
          throw new Error('Unable to get fresh Firebase ID token from synchronized user');
        }
        
        // Set the fresh token in ApiService
        ApiService.setAuth(freshToken);
        console.log('✅ AdminStore.loadInquiries: Fresh Firebase token set for inquiries API call');
        
        // Verify the token is properly set
        const currentToken = ApiService.getAuthToken();
        if (!currentToken) {
          throw new Error('Token was not properly set in ApiService');
        }
        
        console.log('🔍 AdminStore.loadInquiries: Token verification successful, making API call');
        
      } catch (tokenError) {
        console.error('❌ AdminStore.loadInquiries: Fresh token retrieval failed:', tokenError);
        throw new Error(`Authentication token refresh failed: ${tokenError.message}`);
      }
      
      // Make the API call with fresh token
      const apiInquiries = await API.inquiries.getAll();
      console.log('📝 Loaded inquiries from API:', apiInquiries.length, 'items');
      
      addBreadcrumb(`Loaded ${apiInquiries.length} inquiries`, 'admin', 'info');
      
      // Transform the inquiries to match our CustomerInquiry type
      const transformedInquiries: CustomerInquiry[] = apiInquiries.map((inquiry: any) => ({
        id: inquiry.id,
        name: inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone || '',
        propertyId: inquiry.property_id,
        propertyTitle: inquiry.property?.title || 'Unknown Property',
        message: inquiry.message,
        status: inquiry.status as 'new' | 'contacted' | 'in_progress' | 'converted' | 'closed',
        priority: inquiry.priority as 'low' | 'medium' | 'high',
        assignedTo: inquiry.assigned_to || '',
        notes: inquiry.notes || '',
        createdAt: inquiry.created_at,
        updatedAt: inquiry.updated_at,
        tags: inquiry.tags || []
      }));

      set({ inquiries: transformedInquiries });
      console.log(`✅ AdminStore.loadInquiries: Successfully loaded and set ${transformedInquiries.length} inquiries`);
      
      transaction?.finish();
      
    } catch (error: any) {
      console.error('❌ AdminStore.loadInquiries error:', error);
      
      // Create a simple error message without external dependencies
      const errorMessage = error?.message || error?.toString() || 'Failed to load inquiries';
      const appError = new Error(errorMessage);
      throw appError;
    }
  },

  // Testimonial actions
  loadTestimonials: async () => {
    console.log('📋 AdminStore.loadTestimonials called');
    
    try {
      console.log('🔄 Loading testimonials via API...');
      const testimonials = await API.testimonials.getAll();
      console.log('📝 Loaded testimonials:', testimonials.length, 'items');
      set({ testimonials });
      console.log('✅ AdminStore testimonials loaded successfully');
    } catch (error) {
      console.error('❌ AdminStore.loadTestimonials error, falling back to mock data:', error);
      try {
        const { mockTestimonials } = await import('@/data/mockTestimonials');
        const testimonials = mockTestimonials;
        set({ testimonials });
        console.log('✅ AdminStore testimonials loaded from mock data');
      } catch (mockError) {
        console.error('❌ Failed to load mock testimonials:', mockError);
        throw error;
      }
    }
  },

  updateTestimonialStatus: async (id, status, adminEmail, rejectionReason) => {
    console.log('📝 AdminStore.updateTestimonialStatus called:', { id, status, adminEmail, rejectionReason });
    
    try {
      console.log('🔄 Updating testimonial status via API...');
      
      // Get reviewerId from current admin
      const { admin } = get();
      const reviewerId = admin?.id || adminEmail;
      
      const updatedTestimonial = await API.testimonials.updateStatus(id, { 
        status, 
        reviewerId, 
        reason: rejectionReason 
      });
      
      // Update local state with the updated testimonial
      const { testimonials } = get();
      const updatedTestimonials = testimonials.map(t =>
        t.id === id ? updatedTestimonial : t
      );
      set({ testimonials: updatedTestimonials });
      
      console.log('✅ AdminStore testimonial status updated successfully via API');
    } catch (error) {
      console.error('❌ AdminStore.updateTestimonialStatus error:', error);
      throw error;
    }
  },

  deleteTestimonial: async (id) => {
    console.log('🗑️ AdminStore.deleteTestimonial called:', id);
    
    try {
      console.log('🔄 Deleting testimonial via API...');
      await API.testimonials.delete(id);
      
      // Remove from local state
      set(state => ({
        testimonials: state.testimonials.filter(t => t.id !== id)
      }));
      
      console.log('✅ AdminStore testimonial deleted successfully via API');
    } catch (error) {
      console.error('❌ AdminStore.deleteTestimonial error:', error);
      throw error;
    }
  },

  loadTestimonialStats: async () => {
    console.log('📊 AdminStore.loadTestimonialStats called');
    
    try {
      console.log('🔄 Loading testimonial stats via API...');
      const stats = await API.testimonials.getStats();
      
      console.log('📊 Loaded testimonial stats:', stats);
      set({ testimonialStats: stats });
      console.log('✅ AdminStore testimonial stats loaded successfully via API');
    } catch (error) {
      console.error('❌ AdminStore.loadTestimonialStats error, calculating from local data:', error);
      
      // Fallback to calculating from current testimonials
      const { testimonials } = get();
      const stats: TestimonialStats = {
        total: testimonials.length,
        approved: testimonials.filter(t => t.status === 'approved').length,
        pending: testimonials.filter(t => t.status === 'pending').length,
        rejected: testimonials.filter(t => t.status === 'rejected').length
      };
      
      console.log('📊 Calculated testimonial stats from local data:', stats);
      set({ testimonialStats: stats });
    }
  },

  setTestimonials: (testimonials) => {
    set({ testimonials });
  },

  // Dashboard actions
  setDashboardStats: (stats) => {
    set({ dashboardStats: stats });
  },

  // Utility actions
  setLoading: (loading) => {
    set({ isLoading: loading });
  },

  setError: (error) => {
    set({ 
      error,
      loading: {
        ...get().loading,
        error
      }
    });
  },

  // Enhanced utility methods
  refreshAll: async () => {
    set({
      loading: { ...get().loading, isRefreshing: true, error: null }
    });
    
    try {
      if (isDebugEnabled()) {
        console.log('🔄 AdminStore: Refreshing all data...');
      }
      
      // Refresh all admin data in parallel
      await Promise.allSettled([
        get().loadInquiries(),
        get().loadTestimonials(),
        get().loadTestimonialStats()
      ]);
      
      const now = Date.now();
      set({
        lastUpdate: now,
        loading: {
          ...get().loading,
          isRefreshing: false,
          lastFetchTime: now
        }
      });
      
      if (isDebugEnabled()) {
        console.log('✅ AdminStore: All data refreshed successfully');
      }
    } catch (error) {
      const appError = createAppError(error, 'Admin Refresh All');
      logError(appError);
      
      set({
        loading: {
          ...get().loading,
          isRefreshing: false,
          error: appError.userMessage
        }
      });
    }
  },

  clearCache: () => {
    if (isDebugEnabled()) {
      console.log('🗑️ AdminStore: Clearing cache');
    }
    
    set({
      inquiries: [],
      testimonials: [],
      testimonialStats: null,
      dashboardStats: null,
      initialized: false,
      lastUpdate: 0,
      loading: {
        isLoading: false,
        isRefreshing: false,
        isSubmitting: false,
        error: null,
        lastFetchTime: null,
      },
      stats: null
    });
  },
    }),
    {
      name: 'gentle-space-realty-admin-v3',
      storage: createJSONStorage(() => localStorage),
      partialize: (state: AdminStore) => ({
        admin: state.admin,
        isAuthenticated: state.isAuthenticated,
        isAdminAuthenticated: state.isAdminAuthenticated,
        initialized: state.initialized,
        lastUpdate: state.lastUpdate
      })
    }
  )
);
