/**
 * API Utilities
 * Helper functions for Firebase Auth and Express API integration
 */

import { PropertyFilters } from '@/types/property';
import { ApiService } from '@/services/apiService';
import type { ApiError } from '@/types/api';

/**
 * Maps frontend PropertyFilters to backend query parameters
 * Handles both property.ts and api.ts PropertyFilters definitions
 */
export const mapPropertyFiltersToQuery = (filters: PropertyFilters | any): Record<string, string> => {
  const query: Record<string, string> = {};

  // Handle search parameter (from FilterParams)
  if (filters.search) {
    query.search = filters.search;
  }

  // Map category to propertyType (backend expects camelCase)
  if (filters.category) {
    query.propertyType = filters.category;
  }

  // Handle API-style type field (maps to propertyType)
  if (filters.type) {
    query.propertyType = filters.type;
  }

  // Location filters
  if (filters.location) {
    query.location = filters.location;
  }

  if (filters.locations && filters.locations.length > 0) {
    query.locations = filters.locations.join(',');
  }

  if (filters.locationRadius) {
    query.locationRadius = filters.locationRadius.toString();
  }

  // Size range filters
  if (filters.sizeRange?.min) {
    query.minSize = filters.sizeRange.min.toString();
  }

  if (filters.sizeRange?.max) {
    query.maxSize = filters.sizeRange.max.toString();
  }

  // Amenities filter
  if (filters.amenities && filters.amenities.length > 0) {
    query.amenities = filters.amenities.join(',');
  }

  // Availability filters
  if (filters.availability !== undefined) {
    query.available = filters.availability.toString();
  }

  // Handle API-style available field
  if (filters.available !== undefined) {
    query.available = filters.available.toString();
  }

  if (filters.availabilityStatus) {
    query.availabilityStatus = filters.availabilityStatus;
  }

  // Custom tags filter
  if (filters.customTags && filters.customTags.length > 0) {
    query.tags = filters.customTags.join(',');
  }

  // Sorting parameters
  if (filters.sortBy) {
    query.sortBy = filters.sortBy;
  }

  if (filters.sortOrder) {
    query.sortOrder = filters.sortOrder;
  }

  // Price filters
  if (filters.minPrice) {
    query.minPrice = filters.minPrice.toString();
  }

  if (filters.maxPrice) {
    query.maxPrice = filters.maxPrice.toString();
  }

  // Bedroom/bathroom filters (API-style)
  if (filters.bedrooms) {
    query.bedrooms = filters.bedrooms.toString();
  }

  if (filters.bathrooms) {
    query.bathrooms = filters.bathrooms.toString();
  }

  // Min/Max bedroom/bathroom filters (backend expects camelCase)
  if (filters.minBedrooms) {
    query.minBedrooms = filters.minBedrooms.toString();
  }

  if (filters.maxBedrooms) {
    query.maxBedrooms = filters.maxBedrooms.toString();
  }

  if (filters.minBathrooms) {
    query.minBathrooms = filters.minBathrooms.toString();
  }

  if (filters.maxBathrooms) {
    query.maxBathrooms = filters.maxBathrooms.toString();
  }

  return query;
};

/**
 * Converts API error to user-friendly message
 */
export const formatApiError = (error: unknown): string => {
  // Check if it's an ApiError object (not class instance, but object with ApiError shape)
  if (error && typeof error === 'object' && 'message' in error && 'code' in error && 'statusCode' in error) {
    return (error as ApiError).message;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (typeof error === 'string') {
    return error;
  }
  
  return 'An unexpected error occurred';
};

/**
 * Initializes API authentication with Firebase ID token
 */
export const initializeApiAuth = async (): Promise<void> => {
  try {
    // Import Firebase Auth service and utilities
    const { FirebaseAuthService, waitForFirebaseReady, isFirebaseReady } = await import('@/lib/firebaseClient');
    
    // Check if Firebase is ready, if not wait for it
    if (!isFirebaseReady()) {
      console.log('⏳ Firebase not ready, waiting for initialization...');
      const isReady = await waitForFirebaseReady(5000); // 5 second timeout
      
      if (!isReady) {
        console.warn('⚠️ Firebase initialization timeout, proceeding without authentication');
        ApiService.clearAuth();
        return;
      }
      
      console.log('✅ Firebase ready after waiting');
    }
    
    // Get current Firebase user and ID token
    const currentUser = FirebaseAuthService.getCurrentUser();
    if (currentUser) {
      try {
        const idToken = await FirebaseAuthService.getIdToken();
        if (idToken) {
          ApiService.setAuth(idToken);
          console.log('✅ API authentication initialized with Firebase token');
        } else {
          console.warn('⚠️ No Firebase ID token available');
          ApiService.clearAuth();
        }
      } catch (tokenError) {
        console.error('❌ Failed to get Firebase ID token:', tokenError);
        ApiService.clearAuth();
      }
    } else {
      // Clear any existing auth tokens if no Firebase user
      console.log('ℹ️ No Firebase user found, clearing API auth');
      ApiService.clearAuth();
    }
  } catch (error) {
    console.error('❌ Failed to initialize API authentication:', error);
    ApiService.clearAuth();
  }
};

/**
 * Handles token storage for Firebase Auth
 * Firebase tokens are managed by Firebase, not stored locally
 */
export const storeAuthTokens = (accessToken: string, refreshToken?: string): void => {
  try {
    // For Firebase, we just set the ID token in the API service
    // Firebase manages token persistence automatically
    ApiService.setAuth(accessToken);
  } catch (error) {
    console.error('Failed to store authentication tokens:', error);
  }
};

/**
 * Clears authentication tokens
 */
export const clearAuthTokens = (): void => {
  try {
    // Clear tokens from ApiService
    ApiService.clearAuth();
    
    // Firebase handles its own token cleanup, but we clear any legacy tokens
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('sb-access-token');
    localStorage.removeItem('sb-refresh-token');
  } catch (error) {
    console.error('Failed to clear authentication tokens:', error);
  }
};

/**
 * Checks if user is authenticated with Firebase
 */
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const { FirebaseAuthService } = await import('@/lib/firebaseClient');
    const user = FirebaseAuthService.getCurrentUser();
    return user !== null;
  } catch (error) {
    console.error('Failed to check authentication status:', error);
    return false;
  }
};

/**
 * Maps backend property data to frontend Property interface
 * Handles data shape differences between backend responses and frontend expectations
 */
export const mapPropertyData = (backendProperty: any): any => {
  if (!backendProperty) return null;

  // Handle both individual property and property within data wrapper
  const property = backendProperty.data || backendProperty;

  return {
    id: property.id,
    title: property.title,
    description: property.description,
    
    // Handle category/type field variations
    category: property.category || property.type || property.property_type,
    
    // Location data normalization
    location: property.location,
    approximateLocation: property.approximate_location || property.approximateLocation,
    coordinates: property.coordinates,
    placeDetails: property.place_details || property.placeDetails,
    
    // Price normalization
    price: property.price ? {
      amount: property.price.amount || property.price,
      period: property.price.period || 'monthly',
      currency: property.price.currency || 'INR'
    } : undefined,
    
    // Size normalization  
    size: property.size ? {
      area: property.size.area || property.size,
      unit: property.size.unit || 'sqft'
    } : { area: 0, unit: 'sqft' },
    
    // Media handling - prioritize new media field, fallback to images
    media: property.media || (property.images ? property.images.map((url: string, index: number) => ({
      id: `img-${index}`,
      type: 'image' as const,
      url,
      filename: `image-${index}`,
      size: 0,
      createdAt: new Date().toISOString()
    })) : []),
    
    // Keep images for backward compatibility
    images: property.images || (property.media ? property.media.filter((m: any) => m.type === 'image').map((m: any) => m.url) : []),
    
    // Amenities normalization
    amenities: Array.isArray(property.amenities) ? property.amenities : 
                (typeof property.amenities === 'string' ? property.amenities.split(',') : []),
    
    // Availability normalization
    availability: property.availability ? {
      available: property.availability.available !== undefined ? property.availability.available : true,
      availableFrom: property.availability.available_from || property.availability.availableFrom,
      status: property.availability.status || 'available'
    } : {
      available: property.available !== undefined ? property.available : true,
      status: 'available'
    },
    
    // Custom tags normalization
    customTags: property.custom_tags || property.customTags || [],
    
    // Features normalization
    features: property.features ? {
      furnished: property.features.furnished || false,
      parking: property.features.parking || false,
      wifi: property.features.wifi || false,
      ac: property.features.ac || false,
      security: property.features.security || false,
      cafeteria: property.features.cafeteria || false
    } : {
      furnished: false,
      parking: false,
      wifi: false,
      ac: false,
      security: false,
      cafeteria: false
    },
    
    // Contact normalization
    contact: property.contact ? {
      phone: property.contact.phone || '',
      email: property.contact.email || '',
      whatsapp: property.contact.whatsapp
    } : {
      phone: '',
      email: ''
    },
    
    // Timestamps normalization
    createdAt: property.created_at || property.createdAt || new Date().toISOString(),
    updatedAt: property.updated_at || property.updatedAt || new Date().toISOString()
  };
};

/**
 * Maps an array of backend properties to frontend format
 */
export const mapPropertiesData = (backendProperties: any[]): any[] => {
  if (!Array.isArray(backendProperties)) return [];
  return backendProperties.map(mapPropertyData).filter(Boolean);
};