import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Property } from '@/types/property';
import { 
  Message, 
  Recommendation, 
  Calculation, 
  ComparisonResult,
  UserPreference,
  SearchContext,
  AmenityFilter
} from '@/types/thesys';

interface AIStore {
  // Conversation Management
  conversationHistory: Message[];
  activeConversationId: string | null;
  
  // User Preferences and Context
  userPreferences: UserPreference[];
  searchContext: SearchContext | null;
  
  // AI Features State
  recommendations: Recommendation[];
  savedCalculations: Calculation[];
  comparisonResults: ComparisonResult[];
  
  // Property Analysis and Scoring
  propertyScores: Record<string, number>; // propertyId -> AI score
  propertyAnalysis: Record<string, any>; // propertyId -> analysis data
  
  // Amenity and Filter State
  amenityFilters: AmenityFilter[];
  activeFilters: string[];
  
  // UI State
  isAIAssistantActive: boolean;
  isLoadingRecommendations: boolean;
  isAnalyzingProperty: boolean;
  
  // Performance and Caching
  cacheTimestamps: Record<string, number>;
  cacheExpirationTime: number; // 30 minutes in milliseconds
  
  // Actions - Conversation Management
  addToHistory: (message: Message) => void;
  clearHistory: () => void;
  setActiveConversation: (conversationId: string) => void;
  getConversationHistory: () => Message[];
  
  // Actions - User Preferences
  updateUserPreferences: (preferences: Partial<UserPreference>) => void;
  addUserPreference: (preference: UserPreference) => void;
  removeUserPreference: (preferenceId: string) => void;
  setSearchContext: (context: SearchContext) => void;
  
  // Actions - AI Features
  addRecommendation: (recommendation: Recommendation) => void;
  clearRecommendations: () => void;
  updateRecommendation: (id: string, updates: Partial<Recommendation>) => void;
  
  addCalculation: (calculation: Calculation) => void;
  removeCalculation: (calculationId: string) => void;
  getCalculationHistory: () => Calculation[];
  
  addComparisonResult: (result: ComparisonResult) => void;
  clearComparisonResults: () => void;
  
  // Actions - Property Analysis
  setPropertyScore: (propertyId: string, score: number) => void;
  getPropertyScore: (propertyId: string) => number | undefined;
  setPropertyAnalysis: (propertyId: string, analysis: any) => void;
  getPropertyAnalysis: (propertyId: string) => any | undefined;
  
  // Actions - Amenity Filters
  setAmenityFilters: (filters: AmenityFilter[]) => void;
  addAmenityFilter: (filter: AmenityFilter) => void;
  removeAmenityFilter: (filterId: string) => void;
  setActiveFilters: (filterIds: string[]) => void;
  toggleFilter: (filterId: string) => void;
  
  // Actions - UI State
  setAIAssistantActive: (active: boolean) => void;
  setLoadingRecommendations: (loading: boolean) => void;
  setAnalyzingProperty: (analyzing: boolean) => void;
  
  // Actions - Cache Management
  isCacheValid: (key: string) => boolean;
  setCacheTimestamp: (key: string) => void;
  clearExpiredCache: () => void;
  clearAllCache: () => void;
  
  // Actions - Analytics and Insights
  getRecommendationAccuracy: () => number;
  getUserEngagementMetrics: () => {
    messagesPerSession: number;
    averageResponseTime: number;
    featureUsage: Record<string, number>;
  };
  
  // Actions - Batch Operations
  batchUpdateRecommendations: (recommendations: Recommendation[]) => void;
  batchUpdatePropertyScores: (scores: Record<string, number>) => void;
  
  // Actions - Data Export/Import
  exportUserData: () => string;
  importUserData: (data: string) => boolean;
  
  // Actions - Reset and Cleanup
  resetAIState: () => void;
  resetUserPreferences: () => void;
}

// Default values
const defaultUserPreference: Partial<UserPreference> = {
  id: '',
  type: 'general',
  value: '',
  weight: 1.0,
  createdAt: new Date(),
  updatedAt: new Date()
};

const defaultSearchContext: SearchContext = {
  query: '',
  filters: {},
  location: '',
  priceRange: { min: 0, max: 1000000 },
  sizeRange: { min: 0, max: 10000 },
  amenities: [],
  timestamp: new Date()
};

// Cache expiration time (30 minutes)
const CACHE_EXPIRATION_TIME = 30 * 60 * 1000;

export const useAIStore = create<AIStore>()(
  persist(
    (set, get) => ({
      // Initial State
      conversationHistory: [],
      activeConversationId: null,
      userPreferences: [],
      searchContext: null,
      recommendations: [],
      savedCalculations: [],
      comparisonResults: [],
      propertyScores: {},
      propertyAnalysis: {},
      amenityFilters: [],
      activeFilters: [],
      isAIAssistantActive: false,
      isLoadingRecommendations: false,
      isAnalyzingProperty: false,
      cacheTimestamps: {},
      cacheExpirationTime: CACHE_EXPIRATION_TIME,

      // Conversation Management Actions
      addToHistory: (message: Message) => {
        set((state) => ({
          conversationHistory: [...state.conversationHistory, message]
        }));
      },

      clearHistory: () => {
        set(() => ({ 
          conversationHistory: [],
          activeConversationId: null 
        }));
      },

      setActiveConversation: (conversationId: string) => {
        set(() => ({ activeConversationId: conversationId }));
      },

      getConversationHistory: () => {
        return get().conversationHistory;
      },

      // User Preferences Actions
      updateUserPreferences: (preferences: Partial<UserPreference>) => {
        set((state) => {
          const existingIndex = state.userPreferences.findIndex(
            p => p.type === preferences.type && p.category === preferences.category
          );
          
          if (existingIndex >= 0) {
            const updatedPreferences = [...state.userPreferences];
            updatedPreferences[existingIndex] = {
              ...updatedPreferences[existingIndex],
              ...preferences,
              updatedAt: new Date()
            };
            return { userPreferences: updatedPreferences };
          } else {
            const newPreference: UserPreference = {
              ...defaultUserPreference,
              ...preferences,
              id: Date.now().toString(),
              createdAt: new Date(),
              updatedAt: new Date()
            } as UserPreference;
            return { userPreferences: [...state.userPreferences, newPreference] };
          }
        });
      },

      addUserPreference: (preference: UserPreference) => {
        set((state) => ({
          userPreferences: [...state.userPreferences, {
            ...preference,
            createdAt: new Date(),
            updatedAt: new Date()
          }]
        }));
      },

      removeUserPreference: (preferenceId: string) => {
        set((state) => ({
          userPreferences: state.userPreferences.filter(p => p.id !== preferenceId)
        }));
      },

      setSearchContext: (context: SearchContext) => {
        set(() => ({
          searchContext: {
            ...context,
            timestamp: new Date()
          }
        }));
      },

      // AI Features Actions
      addRecommendation: (recommendation: Recommendation) => {
        set((state) => {
          // Prevent duplicate recommendations for the same property
          const existingIndex = state.recommendations.findIndex(
            r => r.propertyId === recommendation.propertyId
          );
          
          if (existingIndex >= 0) {
            const updated = [...state.recommendations];
            updated[existingIndex] = {
              ...recommendation,
              updatedAt: new Date()
            };
            return { recommendations: updated };
          }
          
          return {
            recommendations: [...state.recommendations, {
              ...recommendation,
              createdAt: new Date(),
              updatedAt: new Date()
            }]
          };
        });
      },

      clearRecommendations: () => {
        set(() => ({ recommendations: [] }));
      },

      updateRecommendation: (id: string, updates: Partial<Recommendation>) => {
        set((state) => ({
          recommendations: state.recommendations.map(r =>
            r.id === id ? { ...r, ...updates, updatedAt: new Date() } : r
          )
        }));
      },

      addCalculation: (calculation: Calculation) => {
        set((state) => ({
          savedCalculations: [...state.savedCalculations, {
            ...calculation,
            timestamp: new Date()
          }]
        }));
      },

      removeCalculation: (calculationId: string) => {
        set((state) => ({
          savedCalculations: state.savedCalculations.filter(c => c.id !== calculationId)
        }));
      },

      getCalculationHistory: () => {
        return get().savedCalculations.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      },

      addComparisonResult: (result: ComparisonResult) => {
        set((state) => ({
          comparisonResults: [...state.comparisonResults, {
            ...result,
            timestamp: new Date()
          }]
        }));
      },

      clearComparisonResults: () => {
        set(() => ({ comparisonResults: [] }));
      },

      // Property Analysis Actions
      setPropertyScore: (propertyId: string, score: number) => {
        set((state) => ({
          propertyScores: {
            ...state.propertyScores,
            [propertyId]: Math.max(0, Math.min(100, score)) // Clamp between 0-100
          }
        }));
        
        // Update cache timestamp
        get().setCacheTimestamp(`property-score-${propertyId}`);
      },

      getPropertyScore: (propertyId: string) => {
        const state = get();
        const cacheKey = `property-score-${propertyId}`;
        
        if (state.isCacheValid(cacheKey)) {
          return state.propertyScores[propertyId];
        }
        
        // Cache expired, return undefined to trigger refresh
        return undefined;
      },

      setPropertyAnalysis: (propertyId: string, analysis: any) => {
        set((state) => ({
          propertyAnalysis: {
            ...state.propertyAnalysis,
            [propertyId]: {
              ...analysis,
              analyzedAt: new Date()
            }
          }
        }));
        
        // Update cache timestamp
        get().setCacheTimestamp(`property-analysis-${propertyId}`);
      },

      getPropertyAnalysis: (propertyId: string) => {
        const state = get();
        const cacheKey = `property-analysis-${propertyId}`;
        
        if (state.isCacheValid(cacheKey)) {
          return state.propertyAnalysis[propertyId];
        }
        
        return undefined;
      },

      // Amenity Filters Actions
      setAmenityFilters: (filters: AmenityFilter[]) => {
        set(() => ({ amenityFilters: filters }));
      },

      addAmenityFilter: (filter: AmenityFilter) => {
        set((state) => ({
          amenityFilters: [...state.amenityFilters, filter]
        }));
      },

      removeAmenityFilter: (filterId: string) => {
        set((state) => ({
          amenityFilters: state.amenityFilters.filter(f => f.id !== filterId),
          activeFilters: state.activeFilters.filter(id => id !== filterId)
        }));
      },

      setActiveFilters: (filterIds: string[]) => {
        set(() => ({ activeFilters: filterIds }));
      },

      toggleFilter: (filterId: string) => {
        set((state) => {
          const isActive = state.activeFilters.includes(filterId);
          return {
            activeFilters: isActive
              ? state.activeFilters.filter(id => id !== filterId)
              : [...state.activeFilters, filterId]
          };
        });
      },

      // UI State Actions
      setAIAssistantActive: (active: boolean) => {
        set(() => ({ isAIAssistantActive: active }));
      },

      setLoadingRecommendations: (loading: boolean) => {
        set(() => ({ isLoadingRecommendations: loading }));
      },

      setAnalyzingProperty: (analyzing: boolean) => {
        set(() => ({ isAnalyzingProperty: analyzing }));
      },

      // Cache Management Actions
      isCacheValid: (key: string) => {
        const state = get();
        const timestamp = state.cacheTimestamps[key];
        if (!timestamp) return false;
        
        const now = Date.now();
        return (now - timestamp) < state.cacheExpirationTime;
      },

      setCacheTimestamp: (key: string) => {
        set((state) => ({
          cacheTimestamps: {
            ...state.cacheTimestamps,
            [key]: Date.now()
          }
        }));
      },

      clearExpiredCache: () => {
        const state = get();
        const now = Date.now();
        const validTimestamps: Record<string, number> = {};
        
        Object.entries(state.cacheTimestamps).forEach(([key, timestamp]) => {
          if ((now - timestamp) < state.cacheExpirationTime) {
            validTimestamps[key] = timestamp;
          }
        });
        
        set(() => ({ cacheTimestamps: validTimestamps }));
      },

      clearAllCache: () => {
        set(() => ({
          cacheTimestamps: {},
          propertyScores: {},
          propertyAnalysis: {}
        }));
      },

      // Analytics and Insights Actions
      getRecommendationAccuracy: () => {
        const state = get();
        const recommendations = state.recommendations;
        
        if (recommendations.length === 0) return 0;
        
        const totalConfidence = recommendations.reduce((sum, rec) => 
          sum + (rec.confidence || 0), 0
        );
        
        return (totalConfidence / recommendations.length) * 100;
      },

      getUserEngagementMetrics: () => {
        const state = get();
        const history = state.conversationHistory;
        
        // Calculate basic metrics
        const messagesPerSession = history.length;
        
        // Calculate average response time (mock for now)
        const averageResponseTime = 2500; // ms
        
        // Feature usage tracking
        const featureUsage = {
          recommendations: state.recommendations.length,
          calculations: state.savedCalculations.length,
          comparisons: state.comparisonResults.length,
          preferences: state.userPreferences.length
        };
        
        return {
          messagesPerSession,
          averageResponseTime,
          featureUsage
        };
      },

      // Batch Operations Actions
      batchUpdateRecommendations: (recommendations: Recommendation[]) => {
        set(() => ({
          recommendations: recommendations.map(rec => ({
            ...rec,
            updatedAt: new Date()
          }))
        }));
      },

      batchUpdatePropertyScores: (scores: Record<string, number>) => {
        set((state) => ({
          propertyScores: {
            ...state.propertyScores,
            ...scores
          }
        }));
        
        // Update cache timestamps for all updated properties
        const currentTime = Date.now();
        const newTimestamps: Record<string, number> = {};
        Object.keys(scores).forEach(propertyId => {
          newTimestamps[`property-score-${propertyId}`] = currentTime;
        });
        
        set((state) => ({
          cacheTimestamps: {
            ...state.cacheTimestamps,
            ...newTimestamps
          }
        }));
      },

      // Data Export/Import Actions
      exportUserData: () => {
        const state = get();
        const exportData = {
          userPreferences: state.userPreferences,
          conversationHistory: state.conversationHistory,
          recommendations: state.recommendations,
          savedCalculations: state.savedCalculations,
          searchContext: state.searchContext,
          exportedAt: new Date().toISOString()
        };
        
        return JSON.stringify(exportData, null, 2);
      },

      importUserData: (data: string) => {
        try {
          const importedData = JSON.parse(data);
          
          set((state) => ({
            userPreferences: importedData.userPreferences || [],
            conversationHistory: importedData.conversationHistory || [],
            recommendations: importedData.recommendations || [],
            savedCalculations: importedData.savedCalculations || [],
            searchContext: importedData.searchContext || state.searchContext
          }));
          
          return true;
        } catch (error) {
          console.error('Failed to import user data:', error);
          return false;
        }
      },

      // Reset and Cleanup Actions
      resetAIState: () => {
        set(() => ({
          conversationHistory: [],
          activeConversationId: null,
          recommendations: [],
          comparisonResults: [],
          propertyScores: {},
          propertyAnalysis: {},
          isAIAssistantActive: false,
          isLoadingRecommendations: false,
          isAnalyzingProperty: false,
          cacheTimestamps: {}
        }));
      },

      resetUserPreferences: () => {
        set(() => ({
          userPreferences: [],
          searchContext: null,
          amenityFilters: [],
          activeFilters: []
        }));
      }
    }),
    {
      name: 'ai-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Only persist certain parts of the state
        userPreferences: state.userPreferences,
        savedCalculations: state.savedCalculations,
        searchContext: state.searchContext,
        amenityFilters: state.amenityFilters,
        propertyScores: state.propertyScores,
        // Don't persist sensitive or temporary data
        conversationHistory: [], // Reset on reload for privacy
        recommendations: [], // Fresh recommendations on reload
        cacheTimestamps: {} // Reset cache on reload
      }),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        // Handle store migrations if needed
        if (version === 0) {
          // Migration logic for version 1
          return {
            ...persistedState,
            cacheExpirationTime: CACHE_EXPIRATION_TIME
          };
        }
        return persistedState;
      }
    }
  )
);

// Export additional utilities
export const aiStoreUtils = {
  // Helper to check if user has active preferences
  hasActivePreferences: (): boolean => {
    const state = useAIStore.getState();
    return state.userPreferences.length > 0;
  },
  
  // Helper to get user preference by type
  getPreferenceByType: (type: string): UserPreference | undefined => {
    const state = useAIStore.getState();
    return state.userPreferences.find(p => p.type === type);
  },
  
  // Helper to get recent conversations
  getRecentMessages: (limit: number = 10): Message[] => {
    const state = useAIStore.getState();
    return state.conversationHistory.slice(-limit);
  },
  
  // Helper to calculate storage usage
  getStorageUsage: (): { size: number; breakdown: Record<string, number> } => {
    const state = useAIStore.getState();
    const dataString = JSON.stringify(state);
    const totalSize = new Blob([dataString]).size;
    
    const breakdown = {
      conversationHistory: new Blob([JSON.stringify(state.conversationHistory)]).size,
      userPreferences: new Blob([JSON.stringify(state.userPreferences)]).size,
      recommendations: new Blob([JSON.stringify(state.recommendations)]).size,
      calculations: new Blob([JSON.stringify(state.savedCalculations)]).size,
      propertyData: new Blob([JSON.stringify({
        propertyScores: state.propertyScores,
        propertyAnalysis: state.propertyAnalysis
      })]).size
    };
    
    return { size: totalSize, breakdown };
  }
};