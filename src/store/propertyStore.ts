import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Property, PropertyFilters, SearchParams } from '@/types/property';
import { API } from '@/services/apiService';
import { mapPropertyFiltersToQuery, formatApiError, mapPropertiesData, mapPropertyData } from '@/utils/apiMigrationUtils';
import { createAppError, logError } from '@/utils/errorHandler';
import type { LoadingState, BaseStoreState, PropertyStoreState } from '@/types/api';

interface PropertyStore extends PropertyStoreState {
  // Enhanced loading and error state
  refreshProperties: () => Promise<void>;
  
  // Cache management
  clearCache: () => void;
  getPropertyById: (id: string) => Property | null;
  
  // Actions
  loadProperties: () => Promise<void>;
  setProperties: (properties: Property[]) => void;
  setSelectedProperty: (property: Property | null) => void;
  setFilters: (filters: PropertyFilters) => void;
  setSearchParams: (params: SearchParams) => void;
  applyFilters: () => void;
  clearFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAdmin: (isAdmin: boolean) => void;
  
  // Admin operations via API
  createProperty: (property: Omit<Property, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  updateProperty: (id: string, updates: Partial<Property>) => Promise<boolean>;
  deleteProperty: (id: string) => Promise<boolean>;
  bulkUpdateProperties: (updates: Array<{ id: string; data: Partial<Property> }>) => Promise<boolean>;
}

// Debug logging
const debugEnabled = import.meta.env.VITE_DEBUG_AUTH === 'true' || 
                     import.meta.env.VITE_DEBUG_SUPABASE === 'true' ||
                     import.meta.env.MODE === 'development';

export const usePropertyStore = create<PropertyStore>()(
  persist(
    (set, get) => ({
      // Initial state
      properties: [],
      filteredProperties: [],
      selectedProperty: null,
      filters: {},
      searchParams: {},
      isLoading: false,
      error: null,
      isAdmin: false,
      loading: {
        isLoading: false,
        isRefreshing: false,
        isSubmitting: false,
        error: null,
        lastFetchTime: null,
      },
      initialized: false,
      lastUpdate: 0,

  loadProperties: async () => {
    set({ 
      isLoading: true, 
      error: null,
      loading: { ...get().loading, isLoading: true, error: null }
    });
    
    try {
      if (debugEnabled) {
        console.log('🔄 PropertyStore: Loading properties via API...');
      }
      
      const query = mapPropertyFiltersToQuery(get().filters);
      const rawProperties = await API.properties.getAll(query);
      
      // Map backend response to frontend format
      const properties = mapPropertiesData(rawProperties);
      const now = Date.now();
      
      set({ 
        properties, 
        filteredProperties: properties, 
        isLoading: false,
        error: null,
        initialized: true,
        lastUpdate: now,
        loading: {
          ...get().loading,
          isLoading: false,
          lastFetchTime: now
        }
      });
      
      // Apply existing filters after loading
      get().applyFilters();
      
      if (debugEnabled) {
        console.log('✅ Properties loaded successfully:', properties.length);
      }
    } catch (error) {
      const appError = createAppError(error, 'Load Properties');
      logError(appError);
      
      set({ 
        isLoading: false, 
        error: appError.userMessage,
        loading: {
          ...get().loading,
          isLoading: false,
          error: appError.userMessage
        }
      });
    }
  },

  refreshProperties: async () => {
    set({
      loading: { ...get().loading, isRefreshing: true, error: null }
    });
    
    try {
      if (debugEnabled) {
        console.log('🔄 PropertyStore: Refreshing properties...');
      }
      
      const query = mapPropertyFiltersToQuery(get().filters);
      const rawProperties = await API.properties.getAll(query);
      
      // Map raw properties to normalized Property type
      const properties = mapPropertiesData(rawProperties);
      const now = Date.now();
      
      set({ 
        properties, 
        filteredProperties: properties,
        error: null,
        lastUpdate: now,
        loading: {
          ...get().loading,
          isRefreshing: false,
          lastFetchTime: now
        }
      });
      
      // Apply existing filters after refresh
      get().applyFilters();
      
      if (debugEnabled) {
        console.log('✅ Properties refreshed successfully:', properties.length);
      }
    } catch (error) {
      const appError = createAppError(error, 'Refresh Properties');
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

  setProperties: (properties) => {
    const now = Date.now();
    set({ 
      properties, 
      filteredProperties: properties,
      lastUpdate: now,
      loading: {
        ...get().loading,
        lastFetchTime: now
      }
    });
    get().applyFilters();
  },

  setSelectedProperty: (property) => {
    if (debugEnabled && property) {
      console.log('🏠 PropertyStore: Selected property:', property.id, property.title);
    }
    set({ selectedProperty: property });
  },

  setFilters: (filters) => {
    if (debugEnabled) {
      console.log('🔍 PropertyStore: Applying filters:', filters);
    }
    set({ filters });
    get().applyFilters();
  },

  setSearchParams: (params) => {
    if (debugEnabled) {
      console.log('🔍 PropertyStore: Setting search params:', params);
    }
    set({ searchParams: params });
  },

  applyFilters: () => {
    const { properties, filters } = get();
    let filtered = [...properties];

    // Category filter - use normalized property.category field
    if (filters.category) {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    // Handle both single location (backward compatibility) and multiple locations
    if (filters.locations && filters.locations.length > 0) {
      filtered = filtered.filter(p => 
        filters.locations!.some(location => 
          p.location.toLowerCase().includes(location.toLowerCase()) ||
          location.toLowerCase().includes(p.location.toLowerCase())
        )
      );
    } else if (filters.location) {
      // Single location fallback for backward compatibility
      filtered = filtered.filter(p => 
        p.location.toLowerCase().includes(filters.location!.toLowerCase()) ||
        filters.location!.toLowerCase().includes(p.location.toLowerCase())
      );
    }


    // Area filtering using normalized property.size.area field
    if (filters.sizeRange) {
      filtered = filtered.filter(p => 
        (p.size?.area || 0) >= (filters.sizeRange?.min || 0) &&
        (p.size?.area || 0) <= (filters.sizeRange?.max || Infinity)
      );
    }

    if (filters.amenities && filters.amenities.length > 0) {
      filtered = filtered.filter(p => 
        filters.amenities!.every(amenity => p.amenities.includes(amenity))
      );
    }

    // Availability filtering using normalized property.availability.available field
    if (filters.availability !== undefined) {
      filtered = filtered.filter(p => p.availability && p.availability.available === filters.availability);
    }

    // Availability status filtering using normalized property.availability.status field
    if (filters.availabilityStatus) {
      filtered = filtered.filter(p => p.availability && p.availability.status === filters.availabilityStatus);
    }

    // Custom tag filtering
    if (filters.customTags && filters.customTags.length > 0) {
      filtered = filtered.filter(p => {
        if (!p.customTags || p.customTags.length === 0) return false;
        // Check if property has any of the selected tags
        return filters.customTags!.some(tagId => 
          p.customTags!.some(propertyTag => propertyTag.id === tagId)
        );
      });
    }

    if (debugEnabled) {
      console.log(`🔍 PropertyStore: Filtered ${filtered.length}/${get().properties.length} properties`);
    }
    set({ filteredProperties: filtered });
  },

  clearFilters: () => {
    if (debugEnabled) {
      console.log('🔍 PropertyStore: Clearing all filters');
    }
    set({ 
      filters: {}, 
      searchParams: {},
      filteredProperties: get().properties 
    });
  },

  setLoading: (loading) => {
    set({ 
      isLoading: loading,
      loading: { ...get().loading, isLoading: loading }
    });
  },

  setError: (error) => {
    set({ 
      error,
      loading: { ...get().loading, error }
    });
  },

  setAdmin: (isAdmin) => {
    if (debugEnabled) {
      console.log('👤 PropertyStore: Admin status changed:', isAdmin);
    }
    set({ isAdmin });
  },

  clearCache: () => {
    if (debugEnabled) {
      console.log('🗑️ PropertyStore: Clearing cache');
    }
    set({
      properties: [],
      filteredProperties: [],
      selectedProperty: null,
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

  getPropertyById: (id: string) => {
    const { properties } = get();
    return properties.find(p => p.id === id) || null;
  },

  // Admin operations via SupabaseService
  createProperty: async (propertyData) => {
    const { isAdmin } = get();
    if (!isAdmin) {
      const error = createAppError(
        new Error('Unauthorized access'), 
        'Create Property',
        { adminRequired: true }
      );
      logError(error);
      return false;
    }

    set({ 
      isLoading: true, 
      error: null,
      loading: { ...get().loading, isSubmitting: true, error: null }
    });
    
    try {
      if (debugEnabled) {
        console.log('🏠 PropertyStore: Creating property:', propertyData.title);
      }
      
      const rawProperty = await API.properties.create(propertyData);
      
      if (rawProperty) {
        // Map backend response to frontend format
        const newProperty = mapPropertyData(rawProperty);
        
        // Add new property to store
        const { properties } = get();
        const updatedProperties = [...properties, newProperty];
        const now = Date.now();
        
        set({ 
          properties: updatedProperties,
          isLoading: false,
          error: null,
          lastUpdate: now,
          loading: {
            ...get().loading,
            isSubmitting: false,
            lastFetchTime: now
          }
        });
        
        get().applyFilters(); // Reapply current filters
        
        if (debugEnabled) {
          console.log('✅ Property created successfully:', newProperty.id);
        }
        return true;
      } else {
        const appError = createAppError(
          new Error('Property creation returned null'),
          'Create Property'
        );
        logError(appError);
        
        set({ 
          error: appError.userMessage, 
          isLoading: false,
          loading: {
            ...get().loading,
            isSubmitting: false,
            error: appError.userMessage
          }
        });
        return false;
      }
    } catch (error) {
      const appError = createAppError(error, 'Create Property', { propertyData });
      logError(appError);
      
      set({ 
        error: appError.userMessage, 
        isLoading: false,
        loading: {
          ...get().loading,
          isSubmitting: false,
          error: appError.userMessage
        }
      });
      return false;
    }
  },

  updateProperty: async (id, updates) => {
    const { isAdmin } = get();
    if (!isAdmin) {
      const error = createAppError(
        new Error('Unauthorized access'), 
        'Update Property',
        { adminRequired: true, propertyId: id }
      );
      logError(error);
      return false;
    }

    set({ 
      isLoading: true, 
      error: null,
      loading: { ...get().loading, isSubmitting: true, error: null }
    });
    
    try {
      if (debugEnabled) {
        console.log('🏠 PropertyStore: Updating property:', id, updates);
      }
      
      const rawProperty = await API.properties.update(id, updates);
      
      if (rawProperty) {
        // Map backend response to frontend format
        const updatedProperty = mapPropertyData(rawProperty);
        
        // Update property in store
        const { properties, selectedProperty } = get();
        const updatedProperties = properties.map(p => 
          p.id === id ? updatedProperty : p
        );
        const now = Date.now();
        
        set({ 
          properties: updatedProperties,
          selectedProperty: selectedProperty?.id === id ? updatedProperty : selectedProperty,
          isLoading: false,
          error: null,
          lastUpdate: now,
          loading: {
            ...get().loading,
            isSubmitting: false,
            lastFetchTime: now
          }
        });
        
        get().applyFilters(); // Reapply current filters
        
        if (debugEnabled) {
          console.log('✅ Property updated successfully:', id);
        }
        return true;
      } else {
        const appError = createAppError(
          new Error('Property update returned null'),
          'Update Property',
          { propertyId: id }
        );
        logError(appError);
        
        set({ 
          error: appError.userMessage, 
          isLoading: false,
          loading: {
            ...get().loading,
            isSubmitting: false,
            error: appError.userMessage
          }
        });
        return false;
      }
    } catch (error) {
      const appError = createAppError(error, 'Update Property', { propertyId: id, updates });
      logError(appError);
      
      set({ 
        error: appError.userMessage, 
        isLoading: false,
        loading: {
          ...get().loading,
          isSubmitting: false,
          error: appError.userMessage
        }
      });
      return false;
    }
  },

  deleteProperty: async (id) => {
    const { isAdmin } = get();
    if (!isAdmin) {
      const error = createAppError(
        new Error('Unauthorized access'), 
        'Delete Property',
        { adminRequired: true, propertyId: id }
      );
      logError(error);
      return false;
    }

    set({ 
      isLoading: true, 
      error: null,
      loading: { ...get().loading, isSubmitting: true, error: null }
    });
    
    try {
      if (debugEnabled) {
        console.log('🏠 PropertyStore: Deleting property:', id);
      }
      
      const success = await API.properties.delete(id);
      
      if (success) {
        // Remove property from store
        const { properties, selectedProperty } = get();
        const updatedProperties = properties.filter(p => p.id !== id);
        const now = Date.now();
        
        set({ 
          properties: updatedProperties,
          selectedProperty: selectedProperty?.id === id ? null : selectedProperty,
          isLoading: false,
          error: null,
          lastUpdate: now,
          loading: {
            ...get().loading,
            isSubmitting: false,
            lastFetchTime: now
          }
        });
        
        get().applyFilters(); // Reapply current filters
        
        if (debugEnabled) {
          console.log('✅ Property deleted successfully:', id);
        }
        return true;
      } else {
        const appError = createAppError(
          new Error('Property deletion failed'),
          'Delete Property',
          { propertyId: id }
        );
        logError(appError);
        
        set({ 
          error: appError.userMessage, 
          isLoading: false,
          loading: {
            ...get().loading,
            isSubmitting: false,
            error: appError.userMessage
          }
        });
        return false;
      }
    } catch (error) {
      const appError = createAppError(error, 'Delete Property', { propertyId: id });
      logError(appError);
      
      set({ 
        error: appError.userMessage, 
        isLoading: false,
        loading: {
          ...get().loading,
          isSubmitting: false,
          error: appError.userMessage
        }
      });
      return false;
    }
  },

  bulkUpdateProperties: async (updates) => {
    const { isAdmin } = get();
    if (!isAdmin) {
      const error = createAppError(
        new Error('Unauthorized access'), 
        'Bulk Update Properties',
        { adminRequired: true, updateCount: updates.length }
      );
      logError(error);
      return false;
    }

    set({ 
      isLoading: true, 
      error: null,
      loading: { ...get().loading, isSubmitting: true, error: null }
    });
    
    try {
      if (debugEnabled) {
        console.log('🏠 PropertyStore: Bulk updating', updates.length, 'properties');
      }
      
      // Process updates sequentially using SupabaseService
      const updatedProperties: Property[] = [];
      const errors: string[] = [];
      
      for (const update of updates) {
        try {
          const updated = await API.properties.update(update.id, update.data);
          if (updated) {
            // Map the updated property to ensure it has the normalized structure
            const mappedProperty = mapPropertyData(updated);
            updatedProperties.push(mappedProperty);
          } else {
            errors.push(`Failed to update property ${update.id}`);
          }
        } catch (updateError) {
          const appError = createAppError(updateError, `Bulk Update Item ${update.id}`);
          errors.push(appError.userMessage);
        }
      }
      
      if (updatedProperties.length > 0) {
        // Update multiple properties in store
        const { properties, selectedProperty } = get();
        const newProperties = properties.map(property => {
          const updated = updatedProperties.find(up => up.id === property.id);
          return updated || property;
        });
        const now = Date.now();
        
        // Update selected property if it was modified
        const updatedSelectedProperty = selectedProperty ? 
          updatedProperties.find(up => up.id === selectedProperty.id) || selectedProperty :
          null;
        
        set({ 
          properties: newProperties,
          selectedProperty: updatedSelectedProperty,
          isLoading: false,
          error: errors.length > 0 ? `${errors.length} updates failed` : null,
          lastUpdate: now,
          loading: {
            ...get().loading,
            isSubmitting: false,
            error: errors.length > 0 ? `${errors.length} updates failed` : null,
            lastFetchTime: now
          }
        });
        
        get().applyFilters(); // Reapply current filters
        
        if (debugEnabled) {
          console.log(`✅ Bulk update completed: ${updatedProperties.length} successful, ${errors.length} failed`);
        }
        
        return errors.length === 0;
      } else {
        const appError = createAppError(
          new Error('All bulk updates failed'),
          'Bulk Update Properties',
          { updateCount: updates.length, errors }
        );
        logError(appError);
        
        set({ 
          error: appError.userMessage, 
          isLoading: false,
          loading: {
            ...get().loading,
            isSubmitting: false,
            error: appError.userMessage
          }
        });
        return false;
      }
    } catch (error) {
      const appError = createAppError(error, 'Bulk Update Properties', { updateCount: updates.length });
      logError(appError);
      
      set({ 
        error: appError.userMessage, 
        isLoading: false,
        loading: {
          ...get().loading,
          isSubmitting: false,
          error: appError.userMessage
        }
      });
      return false;
    }
  },
    }),
    {
      name: 'gentle-space-realty-properties-v2',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        properties: state.properties,
        filters: state.filters,
        isAdmin: state.isAdmin,
        initialized: state.initialized,
        lastUpdate: state.lastUpdate
      })
    }
  )
);
