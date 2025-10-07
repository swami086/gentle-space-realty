// Comprehensive API types for Express API integration
import type { Property } from './property';
import type { User } from './user';
import type { Testimonial } from './testimonial';

// Express API Response Types - Updated for API-first architecture
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    hasMore?: boolean;
    count?: number;
  };
}

export interface ApiError {
  message: string;
  code: string;
  statusCode: number;
  details?: any;
}

// Legacy Supabase-style response (for backward compatibility during migration)
export interface LegacyApiResponse<T = any> {
  data: T;
  error: null;
  count?: number;
}

export interface LegacyApiError {
  data: null;
  error: {
    message: string;
    code?: string;
    details?: any;
    hint?: string;
  };
  count?: null;
}

export type ApiResult<T = any> = ApiResponse<T> | ApiError;

// Loading and Error State Types
export interface LoadingState {
  isLoading: boolean;
  isRefreshing: boolean;
  isSubmitting: boolean;
  error: string | null;
  lastFetchTime: number | null;
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginationResponse {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Filter and Search Types
export interface FilterParams {
  search?: string;
  category?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price' | 'date' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchParams {
  query: string;
  fields?: string[];
  limit?: number;
}

// Property API Types - Updated for Express API
export interface PropertyListResponse extends ApiResponse<Property[]> {
  meta: {
    count: number;
    total: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

export interface PropertyResponse extends ApiResponse<Property> {}

export interface PropertyCreateResponse extends ApiResponse<Property> {}

export interface PropertyUpdateResponse extends ApiResponse<Property> {}

export interface PropertyDeleteResponse extends ApiResponse<{ success: boolean }> {}

export interface PropertyFilters extends FilterParams {
  type?: string;
  bedrooms?: number;
  bathrooms?: number;
  available?: boolean;
}

export interface CreatePropertyRequest {
  title: string;
  description: string;
  price: number;
  location: string;
  type: string;
  bedrooms?: number;
  bathrooms?: number;
  images?: string[];
  features?: string[];
  available?: boolean;
}

export interface UpdatePropertyRequest extends Partial<CreatePropertyRequest> {
  id: string;
}

// User API Types - Updated for Express API
export interface UserResponse extends ApiResponse<User> {}

export interface UserListResponse extends ApiResponse<User[]> {
  meta: {
    count: number;
    total: number;
    page?: number;
    limit?: number;
  };
}

export interface AuthRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse extends ApiResponse<{
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
  };
}> {}

// Token management types
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface TokenRefreshResponse extends ApiResponse<{
  user: User;
  tokens: TokenPair;
}> {}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: 'user' | 'admin';
  avatar_url?: string;
}

// Testimonial API Types - Updated for Express API
export interface TestimonialListResponse extends ApiResponse<Testimonial[]> {
  meta: {
    count: number;
    total: number;
    page?: number;
    limit?: number;
  };
}

export interface TestimonialResponse extends ApiResponse<Testimonial> {}

export interface TestimonialCreateResponse extends ApiResponse<Testimonial> {}

export interface TestimonialUpdateResponse extends ApiResponse<Testimonial> {}

export interface TestimonialDeleteResponse extends ApiResponse<{ success: boolean }> {}

export interface TestimonialStatsResponse extends ApiResponse<{
  total: number;
  approved: number;
  pending: number;
  rejected: number;
}> {}

export interface CreateTestimonialRequest {
  name: string;
  email: string;
  company?: string;
  position?: string;
  content: string;
  rating: number;
  imageUrl?: string;
  propertyId?: string;
}

export interface UpdateTestimonialRequest extends Partial<CreateTestimonialRequest> {
  id: string;
}

export interface TestimonialStatusUpdateRequest {
  status: 'pending' | 'approved' | 'rejected';
  reviewerId?: string;
  reason?: string;
  approvedBy?: string;
  rejectedBy?: string;
}

// Inquiry API Types - Updated for Express API
export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  propertyId?: string;
  status: 'new' | 'contacted' | 'qualified' | 'closed';
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InquiryListResponse extends ApiResponse<Inquiry[]> {
  meta: {
    count: number;
    total: number;
    page?: number;
    limit?: number;
  };
}

export interface InquiryResponse extends ApiResponse<Inquiry> {}

export interface InquiryCreateResponse extends ApiResponse<Inquiry> {}

export interface InquiryUpdateResponse extends ApiResponse<Inquiry> {}

export interface InquiryDeleteResponse extends ApiResponse<{ success: boolean }> {}

export interface CreateInquiryRequest {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  propertyId?: string;
}

export interface UpdateInquiryRequest extends Partial<CreateInquiryRequest> {
  id: string;
  status?: 'new' | 'contacted' | 'qualified' | 'closed';
  priority?: 'low' | 'medium' | 'high';
  assignedTo?: string;
  notes?: string;
}

export interface InquiryStatusUpdateRequest {
  status: 'new' | 'contacted' | 'qualified' | 'closed';
  notes?: string;
  assignedTo?: string;
}

// File Upload Types - Updated for Express API
export interface FileUploadResponse extends ApiResponse<{
  filename: string;
  originalName: string;
  size: number;
  mimetype: string;
  url: string;
  path: string;
  uploadedAt: string;
}> {}

export interface UploadRequest {
  file: File;
  folder?: string;
  filename?: string;
  allowedTypes?: string[];
  maxSize?: number;
}

export interface MultipleUploadResponse extends ApiResponse<{
  files: Array<{
    filename: string;
    originalName: string;
    size: number;
    mimetype: string;
    url: string;
    path: string;
  }>;
  uploadedAt: string;
}> {}

// Real-time Subscription Types
export interface SubscriptionCallback<T> {
  (payload: {
    eventType: 'INSERT' | 'UPDATE' | 'DELETE';
    new: T | null;
    old: T | null;
    errors: any[] | null;
  }): void;
}

// Express API Database Types - Simplified for API-first architecture
export interface ApiDatabase {
  properties: {
    create: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>;
    update: Partial<Omit<Property, 'id' | 'createdAt' | 'updatedAt'>>;
    response: Property;
  };
  users: {
    create: Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
    update: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>;
    response: User;
  };
  testimonials: {
    create: Omit<Testimonial, 'id' | 'createdAt' | 'updatedAt'>;
    update: Partial<Omit<Testimonial, 'id' | 'createdAt' | 'updatedAt'>>;
    response: Testimonial;
  };
  inquiries: {
    create: Omit<Inquiry, 'id' | 'createdAt' | 'updatedAt'>;
    update: Partial<Omit<Inquiry, 'id' | 'createdAt' | 'updatedAt'>>;
    response: Inquiry;
  };
}

// Validation Types - Enhanced for Express API
export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ValidationResponse extends ApiResponse<void> {
  success: boolean;
  errors?: ValidationError[];
}

// API Health Check Types
export interface HealthCheckResponse extends ApiResponse<{
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version: string;
  database: 'connected' | 'disconnected';
  services: {
    auth: 'up' | 'down';
    upload: 'up' | 'down';
    email: 'up' | 'down';
  };
}> {}

// API Statistics Types
export interface ApiStatsResponse extends ApiResponse<{
  requests: {
    total: number;
    today: number;
    success: number;
    errors: number;
  };
  users: {
    total: number;
    active: number;
    new: number;
  };
  properties: {
    total: number;
    active: number;
    featured: number;
  };
}> {}

// Cache Types
export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  key: string;
  invalidateOn?: string[]; // Events that should invalidate this cache
}

export interface CachedData<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Retry Configuration
export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

// Connection Status
export interface ConnectionStatus {
  online: boolean;
  healthy: boolean;
  lastCheck: number;
  retryCount: number;
}

// Hook Return Types
export interface UseDataFetchingResult<T> {
  data: T | null;
  loading: LoadingState;
  error: string | null;
  refetch: () => Promise<void>;
  refresh: () => Promise<void>;
  mutate: (newData: T) => void;
}

export interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  isLoading: boolean;
  error: string | null;
  data: TData | null;
  reset: () => void;
}

// Store Types - Enhanced for API-first architecture
export interface BaseStoreState {
  loading: LoadingState;
  initialized: boolean;
  lastUpdate: number;
  error?: string | null;
}

export interface PropertyStoreState extends BaseStoreState {
  properties: Property[];
  filteredProperties: Property[];
  selectedProperty: Property | null;
  filters: PropertyFilters;
  pagination: PaginationResponse | null;
  searchQuery: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export interface UserStoreState extends BaseStoreState {
  user: User | null;
  tokens: TokenPair | null;
  isAuthenticated: boolean;
  authError: string | null;
  sessionExpiry: number | null;
  savedProperties: string[];
}

export interface TestimonialStoreState extends BaseStoreState {
  testimonials: Testimonial[];
  featuredTestimonials: Testimonial[];
  pendingTestimonials: Testimonial[];
  stats: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  } | null;
}

export interface AdminStoreState extends BaseStoreState {
  isAdminAuthenticated: boolean;
  adminUser: User | null;
  inquiries: Inquiry[];
  pendingInquiries: Inquiry[];
  testimonials: Testimonial[];
  stats: {
    totalProperties: number;
    totalInquiries: number;
    totalUsers: number;
    totalTestimonials: number;
    pendingTestimonials: number;
    recentActivity: number;
  } | null;
  permissions: string[];
}

// Legacy compatibility for Supabase-style Database type
export interface Database {
  public: {
    Tables: {
      properties: {
        Row: Property;
        Insert: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<Property, 'id' | 'createdAt' | 'updatedAt'>>;
      };
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>;
      };
      testimonials: {
        Row: Testimonial;
        Insert: Omit<Testimonial, 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<Testimonial, 'id' | 'createdAt' | 'updatedAt'>>;
      };
      inquiries: {
        Row: Inquiry;
        Insert: Omit<Inquiry, 'id' | 'createdAt' | 'updatedAt'>;
        Update: Partial<Omit<Inquiry, 'id' | 'createdAt' | 'updatedAt'>>;
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

// Export both new API-first types and legacy compatibility
export default ApiDatabase;