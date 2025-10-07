// Media interface for property media files
export interface PropertyMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string; // For videos
  filename: string;
  size: number;
  duration?: number; // For videos, in seconds
  createdAt: string;
}

// Interface for media upload workflow
export interface PropertyMediaUpload {
  file: File;
  type: 'image' | 'video';
}

// Upload result interface
export interface MediaUploadResult {
  url: string;
  path: string;
  filename: string;
  size: number;
  mimeType: string;
  duration?: number; // For videos
  thumbnailUrl?: string; // For videos
}

// Property tag interface for custom tagging system
export interface PropertyTag {
  id: string;
  name: string;
  color: string;
  backgroundColor: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  category: PropertyCategory;
  location: string; // Changed to support any location string from Google Places API
  approximateLocation?: {
    area: string; // Changed to support any location string
    radius: string;
    landmarks?: string[];
  };
  coordinates?: {
    lat: number;
    lng: number;
  };
  // New field to store Google Places details
  placeDetails?: {
    placeId?: string;
    formattedAddress?: string;
    types?: string[];
    city?: string;
    state?: string;
    country?: string;
  };
  price?: {
    amount: number;
    period: 'monthly' | 'daily' | 'hourly';
    currency: 'INR';
  };
  size: {
    area: number;
    unit: 'sqft' | 'seats';
  };
  media: PropertyMedia[]; // New primary media field
  images?: string[]; // Keep for backward compatibility, optional
  amenities: string[];
  availability: {
    available: boolean;
    availableFrom?: string;
    status?: 'available' | 'not-available' | 'coming-soon' | 'under-maintenance';
  };
  customTags?: PropertyTag[];
  features: {
    furnished: boolean;
    parking: boolean;
    wifi: boolean;
    ac: boolean;
    security: boolean;
    cafeteria: boolean;
  };
  contact: {
    phone: string;
    email: string;
    whatsapp?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type PropertyCategory = 
  | 'fully-furnished-offices'
  | 'custom-built-workspaces'
  | 'co-working-spaces'
  | 'private-office-cabins'
  | 'enterprise-offices'
  | 'virtual-offices'
  | 'meeting-conference-rooms';

// Legacy type - keeping for backward compatibility, but now location is a flexible string
export type BengaluruLocation = 
  | 'mg-road'
  | 'indiranagar'
  | 'koramangala'
  | 'hsr-layout'
  | 'whitefield'
  | 'electronic-city'
  | 'jp-nagar'
  | 'btm-layout'
  | 'marathahalli'
  | 'sarjapur-road';

// New interface for location data from Google Places API
export interface LocationData {
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  placeDetails?: {
    placeId?: string;
    formattedAddress?: string;
    types?: string[];
    name?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

export interface PropertyFilters {
  category?: PropertyCategory;
  location?: string; // Single location (backward compatibility)
  locations?: string[]; // Multiple locations support
  locationRadius?: number; // Optional radius for location-based search in km
  sizeRange?: {
    min: number;
    max: number;
  };
  amenities?: string[];
  availability?: boolean;
  availabilityStatus?: 'available' | 'not-available' | 'coming-soon' | 'under-maintenance';
  customTags?: string[]; // Tag IDs to filter by
}

export interface SearchParams {
  query?: string;
  filters?: PropertyFilters;
  sortBy?: 'size' | 'location' | 'date';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
