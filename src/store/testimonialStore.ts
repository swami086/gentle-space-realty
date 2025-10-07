import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Testimonial, TestimonialFormData } from '@/types/testimonial';
import { API } from '@/services/apiService';
import { formatApiError } from '@/utils/apiMigrationUtils';
import { createAppError, logError } from '@/utils/errorHandler';
import type { LoadingState, BaseStoreState, TestimonialStoreState } from '@/types/api';

interface TestimonialStore extends TestimonialStoreState {
  // Enhanced loading state beyond base
  error: string | null;
  
  // Additional testimonial collections
  pendingTestimonials: Testimonial[];

  // Actions
  setTestimonials: (testimonials: Testimonial[]) => void;
  addTestimonial: (testimonialData: TestimonialFormData) => Promise<void>;
  updateTestimonial: (id: string, updates: Partial<Testimonial>) => Promise<void>;
  approveTestimonial: (id: string, reviewerId: string) => Promise<void>;
  rejectTestimonial: (id: string, reason: string, reviewerId: string) => Promise<void>;
  deleteTestimonial: (id: string) => Promise<void>;
  loadTestimonials: () => Promise<void>;
  loadApprovedTestimonials: () => Promise<void>;
  loadPendingTestimonials: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  refreshTestimonials: () => Promise<void>;
  clearCache: () => void;
  getTestimonialById: (id: string) => Testimonial | null;
}

// Debug logging
const debugEnabled = import.meta.env.VITE_DEBUG_AUTH === 'true' || 
                     import.meta.env.VITE_DEBUG_SUPABASE === 'true' ||
                     import.meta.env.MODE === 'development';

export const useTestimonialStore = create<TestimonialStore>()(
  persist(
    (set, get) => ({
      // Initial state - extends TestimonialStoreState
      testimonials: [],
      featuredTestimonials: [],
      pendingTestimonials: [],
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

      setTestimonials: (testimonials: Testimonial[]) => {
        const approved = testimonials.filter(t => t.status === 'approved');
        const pending = testimonials.filter(t => t.status === 'pending');
        const now = Date.now();
        
        set({
          testimonials,
          featuredTestimonials: approved,
          pendingTestimonials: pending,
          lastUpdate: now,
          loading: {
            ...get().loading,
            lastFetchTime: now
          }
        });
      },

      addTestimonial: async (testimonialData: TestimonialFormData) => {
        set({ 
          error: null,
          loading: { ...get().loading, isSubmitting: true, error: null }
        });
        
        try {
          if (debugEnabled) {
            console.log('📝 Adding new testimonial via API...');
          }
          
          const newTestimonial = await API.testimonials.create(testimonialData);
          
          const { testimonials } = get();
          const updatedTestimonials = [newTestimonial, ...testimonials];
          const now = Date.now();
          
          get().setTestimonials(updatedTestimonials);
          
          set({ 
            error: null,
            lastUpdate: now,
            loading: {
              ...get().loading,
              isSubmitting: false,
              lastFetchTime: now
            }
          });
          
          if (debugEnabled) {
            console.log('✅ Testimonial added successfully');
          }
        } catch (error) {
          const appError = createAppError(error, 'Add Testimonial', { testimonialData });
          logError(appError);
          
          set({ 
            error: appError.userMessage,
            loading: {
              ...get().loading,
              isSubmitting: false,
              error: appError.userMessage
            }
          });
          throw appError;
        }
      },

      updateTestimonial: async (id: string, updates: Partial<Testimonial>) => {
        set({ 
          error: null,
          loading: { ...get().loading, isSubmitting: true, error: null }
        });
        
        try {
          if (debugEnabled) {
            console.log('🔄 Updating testimonial via API...', { id });
          }
          
          const updatedTestimonial = await API.testimonials.update(id, updates);
          
          const { testimonials } = get();
          const updatedTestimonials = testimonials.map(t => 
            t.id === id ? updatedTestimonial : t
          );
          const now = Date.now();
          
          get().setTestimonials(updatedTestimonials);
          
          set({ 
            error: null,
            lastUpdate: now,
            loading: {
              ...get().loading,
              isSubmitting: false,
              lastFetchTime: now
            }
          });
          
          if (debugEnabled) {
            console.log('✅ Testimonial updated successfully');
          }
        } catch (error) {
          const appError = createAppError(error, 'Update Testimonial', { id, updates });
          logError(appError);
          
          set({ 
            error: appError.userMessage,
            loading: {
              ...get().loading,
              isSubmitting: false,
              error: appError.userMessage
            }
          });
          throw appError;
        }
      },

      approveTestimonial: async (id: string, reviewerId: string) => {
        set({ 
          error: null,
          loading: { ...get().loading, isSubmitting: true, error: null }
        });
        
        try {
          if (debugEnabled) {
            console.log('✅ Approving testimonial via API...', { id, reviewerId });
          }
          
          const updatedTestimonial = await API.testimonials.updateStatus(id, { status: 'approved', reviewerId });
          
          const { testimonials } = get();
          const updatedTestimonials = testimonials.map(t => 
            t.id === id ? updatedTestimonial : t
          );
          const now = Date.now();
          
          get().setTestimonials(updatedTestimonials);
          
          set({ 
            error: null,
            lastUpdate: now,
            loading: {
              ...get().loading,
              isSubmitting: false,
              lastFetchTime: now
            }
          });
          
          if (debugEnabled) {
            console.log('✅ Testimonial approved successfully');
          }
        } catch (error) {
          const appError = createAppError(error, 'Approve Testimonial', { id, reviewerId });
          logError(appError);
          
          set({ 
            error: appError.userMessage,
            loading: {
              ...get().loading,
              isSubmitting: false,
              error: appError.userMessage
            }
          });
          throw appError;
        }
      },

      rejectTestimonial: async (id: string, reason: string, reviewerId: string) => {
        set({ 
          error: null,
          loading: { ...get().loading, isSubmitting: true, error: null }
        });
        
        try {
          if (debugEnabled) {
            console.log('❌ Rejecting testimonial via API...', { id, reason, reviewerId });
          }
          
          const updatedTestimonial = await API.testimonials.updateStatus(id, { status: 'rejected', reviewerId, reason });
          
          const { testimonials } = get();
          const updatedTestimonials = testimonials.map(t => 
            t.id === id ? updatedTestimonial : t
          );
          const now = Date.now();
          
          get().setTestimonials(updatedTestimonials);
          
          set({ 
            error: null,
            lastUpdate: now,
            loading: {
              ...get().loading,
              isSubmitting: false,
              lastFetchTime: now
            }
          });
          
          if (debugEnabled) {
            console.log('✅ Testimonial rejected successfully');
          }
        } catch (error) {
          const appError = createAppError(error, 'Reject Testimonial', { id, reason, reviewerId });
          logError(appError);
          
          set({ 
            error: appError.userMessage,
            loading: {
              ...get().loading,
              isSubmitting: false,
              error: appError.userMessage
            }
          });
          throw appError;
        }
      },

      deleteTestimonial: async (id: string) => {
        set({ 
          error: null,
          loading: { ...get().loading, isSubmitting: true, error: null }
        });
        
        try {
          if (debugEnabled) {
            console.log('🗑️ Deleting testimonial via API...', { id });
          }
          
          await API.testimonials.delete(id);
          
          const { testimonials } = get();
          const filteredTestimonials = testimonials.filter(t => t.id !== id);
          const now = Date.now();
          
          get().setTestimonials(filteredTestimonials);
          
          set({ 
            error: null,
            lastUpdate: now,
            loading: {
              ...get().loading,
              isSubmitting: false,
              lastFetchTime: now
            }
          });
          
          if (debugEnabled) {
            console.log('✅ Testimonial deleted successfully');
          }
        } catch (error) {
          const appError = createAppError(error, 'Delete Testimonial', { id });
          logError(appError);
          
          set({ 
            error: appError.userMessage,
            loading: {
              ...get().loading,
              isSubmitting: false,
              error: appError.userMessage
            }
          });
          throw appError;
        }
      },

      loadTestimonials: async () => {
        set({ 
          error: null,
          loading: { ...get().loading, isLoading: true, error: null }
        });
        
        try {
          if (debugEnabled) {
            console.log('📋 Loading all testimonials via API...');
          }
          
          const testimonials = await API.testimonials.getAll();
          const now = Date.now();
          
          get().setTestimonials(testimonials);
          
          set({ 
            error: null,
            initialized: true,
            lastUpdate: now,
            loading: {
              ...get().loading,
              isLoading: false,
              lastFetchTime: now
            }
          });
          
          if (debugEnabled) {
            console.log('✅ All testimonials loaded successfully:', testimonials.length);
          }
        } catch (error) {
          const appError = createAppError(error, 'Load Testimonials');
          logError(appError);
          
          if (debugEnabled) {
            console.error('❌ Failed to load testimonials, falling back to mock data:', error);
          }
          
          try {
            const { mockTestimonials } = await import('@/data/mockTestimonials');
            get().setTestimonials(mockTestimonials);
            
            set({ 
              error: 'Failed to load testimonials from database. Using offline data.',
              initialized: true,
              loading: {
                ...get().loading,
                isLoading: false,
                error: 'Using offline data'
              }
            });
          } catch (mockError) {
            set({ 
              error: appError.userMessage,
              loading: {
                ...get().loading,
                isLoading: false,
                error: appError.userMessage
              }
            });
          }
        }
      },

      loadApprovedTestimonials: async () => {
        set({ 
          error: null,
          loading: { ...get().loading, isRefreshing: true, error: null }
        });
        
        try {
          if (debugEnabled) {
            console.log('📋 Loading approved testimonials via API...');
          }
          
          const approvedTestimonials = await API.testimonials.getApproved();
          const now = Date.now();
          
          set({ 
            featuredTestimonials: approvedTestimonials,
            error: null,
            lastUpdate: now,
            loading: {
              ...get().loading,
              isRefreshing: false,
              lastFetchTime: now
            }
          });
          
          if (debugEnabled) {
            console.log('✅ Approved testimonials loaded successfully:', approvedTestimonials.length);
          }
        } catch (error) {
          const appError = createAppError(error, 'Load Approved Testimonials');
          logError(appError);
          
          if (debugEnabled) {
            console.error('❌ Failed to load approved testimonials, falling back to mock data:', error);
          }
          
          try {
            const { mockTestimonials } = await import('@/data/mockTestimonials');
            const approvedTestimonials = mockTestimonials.filter(t => t.status === 'approved');
            
            set({ 
              featuredTestimonials: approvedTestimonials,
              error: 'Failed to load approved testimonials from database. Using offline data.',
              loading: {
                ...get().loading,
                isRefreshing: false,
                error: 'Using offline data'
              }
            });
          } catch (mockError) {
            set({ 
              error: appError.userMessage,
              loading: {
                ...get().loading,
                isRefreshing: false,
                error: appError.userMessage
              }
            });
          }
        }
      },

      loadPendingTestimonials: async () => {
        set({ 
          error: null,
          loading: { ...get().loading, isRefreshing: true, error: null }
        });
        
        try {
          if (debugEnabled) {
            console.log('📋 Loading pending testimonials via API...');
          }
          
          const pendingTestimonials = await API.testimonials.getPending();
          const now = Date.now();
          
          set({ 
            pendingTestimonials,
            error: null,
            lastUpdate: now,
            loading: {
              ...get().loading,
              isRefreshing: false,
              lastFetchTime: now
            }
          });
          
          if (debugEnabled) {
            console.log('✅ Pending testimonials loaded successfully:', pendingTestimonials.length);
          }
        } catch (error) {
          const appError = createAppError(error, 'Load Pending Testimonials');
          logError(appError);
          
          if (debugEnabled) {
            console.error('❌ Failed to load pending testimonials, falling back to mock data:', error);
          }
          
          try {
            const { mockTestimonials } = await import('@/data/mockTestimonials');
            const pendingTestimonials = mockTestimonials.filter(t => t.status === 'pending');
            
            set({ 
              pendingTestimonials,
              error: 'Failed to load pending testimonials from database. Using offline data.',
              loading: {
                ...get().loading,
                isRefreshing: false,
                error: 'Using offline data'
              }
            });
          } catch (mockError) {
            set({ 
              error: appError.userMessage,
              loading: {
                ...get().loading,
                isRefreshing: false,
                error: appError.userMessage
              }
            });
          }
        }
      },

      setLoading: (loading: boolean) => {
        set({ 
          loading: { ...get().loading, isLoading: loading }
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

      // Enhanced utility methods
      refreshTestimonials: async () => {
        set({
          loading: { ...get().loading, isRefreshing: true, error: null }
        });
        
        try {
          if (debugEnabled) {
            console.log('🔄 TestimonialStore: Refreshing testimonials via API...');
          }
          
          const testimonials = await API.testimonials.getAll();
          const now = Date.now();
          
          get().setTestimonials(testimonials);
          
          set({
            lastUpdate: now,
            loading: {
              ...get().loading,
              isRefreshing: false,
              lastFetchTime: now
            }
          });
          
          if (debugEnabled) {
            console.log('✅ Testimonials refreshed successfully:', testimonials.length);
          }
        } catch (error) {
          const appError = createAppError(error, 'Refresh Testimonials');
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
        if (debugEnabled) {
          console.log('🗑️ TestimonialStore: Clearing cache');
        }
        
        set({
          testimonials: [],
          featuredTestimonials: [],
          pendingTestimonials: [],
          initialized: false,
          lastUpdate: 0,
          loading: {
            isLoading: false,
            isRefreshing: false,
            isSubmitting: false,
            error: null,
            lastFetchTime: null,
          }
        });
      },

      getTestimonialById: (id: string) => {
        const { testimonials } = get();
        return testimonials.find(t => t.id === id) || null;
      },
    }),
    {
      name: 'gentle-space-realty-testimonials-v3',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        testimonials: state.testimonials,
        featuredTestimonials: state.featuredTestimonials,
        pendingTestimonials: state.pendingTestimonials,
        initialized: state.initialized,
        lastUpdate: state.lastUpdate
      }),
    }
  )
);