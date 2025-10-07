/**
 * API Service for Backend Integration
 * 
 * Centralized service for making HTTP requests to the Express.js backend.
 * Handles authentication, error handling, and request/response interceptors.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { Environment } from '@/config/environment';
import { createAppError, logError } from '@/utils/errorHandler';
import { logApiRequest, logApiResponse } from '@/utils/debugHelper';
import type { Property, PropertyFilters as CorePropertyFilters } from '@/types/property';
import type { PropertyFilters as ApiPropertyFilters, CreatePropertyRequest, UpdatePropertyRequest, ApiError } from '@/types/api';

// Enhanced API configuration with debug mode awareness
const API_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const DEBUG_API_CALLS = Environment.isDebugMode() || Environment.isDevelopment();

// Request/Response types
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
  };
}


// Simplified authentication token management
let authToken: string | null = null;

/**
 * Set Firebase ID token synchronously
 */
export const setAuthToken = (idToken: string) => {
  if (DEBUG_API_CALLS) {
    console.log('🔐 ApiService.setAuthToken: Setting auth token synchronously', {
      hasToken: !!idToken,
      tokenLength: idToken?.length || 0,
      timestamp: new Date().toISOString()
    });
  }
  authToken = idToken;
};

/**
 * Clear authentication tokens
 */
export const clearAuthTokens = () => {
  if (DEBUG_API_CALLS) {
    console.log('🗑️ ApiService.clearAuthTokens: Clearing auth tokens');
  }
  authToken = null;
};

/**
 * Get current auth token
 */
export const getAuthToken = () => authToken;

/**
 * Legacy method for backward compatibility
 */
export const setAuthTokens = (access: string, refresh?: string) => {
  // For Firebase, we only need the ID token (access token)
  authToken = access;
  // Refresh token is not used with Firebase ID tokens
};

/**
 * Create axios instance with default configuration
 */
const createApiClient = (): AxiosInstance => {
  let baseURL: string;
  try {
    baseURL = Environment.getApiBaseUrl();
  } catch (error) {
    console.error('[ApiService] Failed to get API base URL:', error);
    throw new Error('API service not available - environment not configured');
  }
  
  const client = axios.create({
    baseURL,
    timeout: API_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-Client-Version': '1.0.0',
      'X-Client-Info': 'gentle-space-realty-frontend'
    },
    // Enable cookies for session management
    withCredentials: true
  });

  // Enhanced request interceptor with comprehensive logging
  client.interceptors.request.use(
    async (config) => {
      // Enhanced debug logging for auth token handling
      console.log('🔍 ApiService Request Interceptor:', {
        url: config.url,
        method: config.method,
        hasAuthToken: !!authToken,
        authTokenLength: authToken ? authToken.length : 0,
        isInquiriesEndpoint: config.url?.includes('/inquiries'),
        isPropertiesEndpoint: config.url?.includes('/properties')
      });
      
      // Add auth token if available - with fresh token check for protected endpoints
      if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
        console.log('✅ ApiService: Set existing auth token in headers');
      } else if (config.url?.includes('/inquiries') || (config.url?.includes('/properties') && config.method?.toUpperCase() !== 'GET')) {
        // For protected endpoints, try to get a fresh token
        console.log('🔄 ApiService: No token available, attempting to get fresh token for protected endpoint');
        try {
          const { FirebaseAuthService } = await import('@/lib/firebaseClient');
          const freshToken = await FirebaseAuthService.getIdToken(true);
          if (freshToken) {
            authToken = freshToken;
            config.headers.Authorization = `Bearer ${freshToken}`;
            console.log('✅ ApiService: Retrieved and set fresh auth token for protected endpoint', {
              tokenLength: freshToken.length,
              tokenPreview: freshToken.substring(0, 20) + '...'
            });
          } else {
            console.warn('⚠️ ApiService: Fresh token retrieval returned null');
          }
        } catch (error) {
          console.warn('⚠️ ApiService: Could not retrieve fresh auth token:', error);
        }
      } else {
        console.log('ℹ️ ApiService: No auth token needed for this endpoint');
      }
      
      // Log final auth header status
      console.log('🔐 ApiService Final Auth Status:', {
        hasAuthorizationHeader: !!config.headers.Authorization,
        authHeaderPreview: config.headers.Authorization ? 
          (config.headers.Authorization as string).substring(0, 20) + '...' : 'none'
      });

      // Add request ID for tracing
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      config.headers['X-Request-ID'] = requestId;
      config.metadata = { ...config.metadata, requestId, startTime: Date.now() };

      // Enhanced debug logging with debug helper integration
      if (DEBUG_API_CALLS) {
        const method = config.method?.toUpperCase() || 'UNKNOWN';
        const fullUrl = `${config.baseURL || ''}${config.url || ''}`;
        
        logApiRequest(method, fullUrl, {
          headers: {
            ...config.headers,
            Authorization: config.headers.Authorization ? '[REDACTED]' : undefined
          },
          params: config.params,
          data: config.data,
          timeout: config.timeout,
          requestId
        });
        
        console.log(`🌐 API Request [${requestId}]:`, {
          method,
          url: fullUrl,
          hasAuth: !!authToken,
          hasData: !!config.data,
          hasParams: !!config.params
        });
      }

      return config;
    },
    (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Request setup failed';
      
      if (DEBUG_API_CALLS) {
        console.error('❌ Request interceptor error:', {
          message: errorMessage,
          error: error,
          timestamp: new Date().toISOString()
        });
      }
      
      logApiResponse('UNKNOWN', 'interceptor_error', 0, null, errorMessage);
      return Promise.reject(createAppError(error, 'API Request Setup'));
    }
  );

  // Enhanced response interceptor with comprehensive error handling
  client.interceptors.response.use(
    (response: AxiosResponse) => {
      const requestId = response.config.headers?.['X-Request-ID'];
      const startTime = response.config.metadata?.startTime;
      const duration = startTime ? Date.now() - startTime : undefined;
      
      // Enhanced success logging with performance metrics
      if (DEBUG_API_CALLS) {
        const method = response.config.method?.toUpperCase() || 'UNKNOWN';
        const fullUrl = `${response.config.baseURL || ''}${response.config.url || ''}`;
        
        logApiResponse(method, fullUrl, response.status, {
          status: response.status,
          statusText: response.statusText,
          duration: `${duration}ms`,
          dataSize: JSON.stringify(response.data || {}).length,
          headers: Object.fromEntries(
            Object.entries(response.headers || {}).filter(([key]) => 
              !key.toLowerCase().includes('auth') && 
              !key.toLowerCase().includes('token')
            )
          )
        });
        
        console.log(`✅ API Response [${requestId}]:`, {
          status: response.status,
          statusText: response.statusText,
          duration: duration ? `${duration}ms` : 'unknown',
          hasData: !!response.data,
          success: response.status >= 200 && response.status < 300
        });
      }

      return response;
    },
    async (error: AxiosError) => {
      const requestId = error.config?.headers?.['X-Request-ID'];
      const method = error.config?.method?.toUpperCase() || 'UNKNOWN';
      const fullUrl = error.config ? `${error.config.baseURL || ''}${error.config.url || ''}` : 'unknown';
      const startTime = error.config?.metadata?.startTime;
      const duration = startTime ? Date.now() - startTime : undefined;
      
      // Handle different error scenarios with enhanced logging
      if (error.response) {
        // Server responded with error status
        const { status, data, statusText } = error.response;
        
        // Enhanced error logging with debug helper integration
        if (DEBUG_API_CALLS) {
          logApiResponse(method, fullUrl, status, data, {
            message: error.message,
            duration: duration ? `${duration}ms` : 'unknown',
            requestId
          });
        }
        
        console.error(`❌ API Error [${requestId}] ${method} ${fullUrl} -> ${status}:`, {
          status,
          statusText,
          data,
          duration: duration ? `${duration}ms` : 'unknown',
          hasAuth: !!authToken
        });

        // Simplified authentication error handling - let admin store handle auth failures
        if (status === 401) {
          if (DEBUG_API_CALLS) {
            console.warn(`🔑 Authentication error detected [${requestId}]:`, {
              endpoint: fullUrl,
              hasToken: !!authToken
            });
          }
          
          // Clear the invalid token and let admin store handle the logout
          clearAuthTokens();
        }

        // Enhanced error object creation with context
        const apiError: ApiError = {
          message: (data as any)?.message || `HTTP ${status}: ${statusText || 'Unknown Error'}`,
          code: (data as any)?.code || `HTTP_${status}`,
          statusCode: status,
          details: {
            ...data,
            requestId,
            method,
            url: fullUrl,
            duration: duration ? `${duration}ms` : 'unknown',
            timestamp: new Date().toISOString()
          }
        };

        // Log the structured error for debugging
        if (DEBUG_API_CALLS) {
          console.error(`📊 Structured API Error [${requestId}]:`, apiError);
        }

        return Promise.reject(apiError);
      } else if (error.request) {
        // Network error or no response - enhanced handling
        const networkErrorMessage = error.message || 'Network request failed';
        
        if (DEBUG_API_CALLS) {
          logApiResponse(method, fullUrl, 0, null, networkErrorMessage);
          
          console.error(`❌ Network Error [${requestId}]:`, {
            message: networkErrorMessage,
            method,
            url: fullUrl,
            timeout: error.code === 'ECONNABORTED',
            duration: duration ? `${duration}ms` : 'unknown',
            requestConfig: {
              timeout: error.config?.timeout,
              baseURL: error.config?.baseURL
            }
          });
        }
        
        const apiError: ApiError = {
          message: error.code === 'ECONNABORTED' 
            ? `Request timeout after ${API_TIMEOUT}ms. Please try again.`
            : 'Network error. Please check your internet connection and try again.',
          code: error.code === 'ECONNABORTED' ? 'REQUEST_TIMEOUT' : 'NETWORK_ERROR',
          statusCode: 0,
          details: {
            originalMessage: networkErrorMessage,
            requestId,
            method,
            url: fullUrl,
            duration: duration ? `${duration}ms` : 'unknown',
            timeout: error.code === 'ECONNABORTED',
            timestamp: new Date().toISOString()
          }
        };

        return Promise.reject(apiError);
      } else {
        // Request setup error - enhanced handling
        const setupErrorMessage = error.message || 'Request configuration failed';
        
        if (DEBUG_API_CALLS) {
          logApiResponse(method, fullUrl, 0, null, setupErrorMessage);
          
          console.error(`❌ Request Setup Error [${requestId}]:`, {
            message: setupErrorMessage,
            method,
            url: fullUrl,
            errorType: 'setup',
            config: error.config ? {
              method: error.config.method,
              url: error.config.url,
              baseURL: error.config.baseURL,
              hasAuth: !!error.config.headers?.Authorization
            } : null
          });
        }
        
        const apiError: ApiError = {
          message: `Request setup failed: ${setupErrorMessage}`,
          code: 'REQUEST_SETUP_ERROR',
          statusCode: 0,
          details: {
            originalMessage: setupErrorMessage,
            requestId,
            method,
            url: fullUrl,
            timestamp: new Date().toISOString()
          }
        };

        return Promise.reject(apiError);
      }
    }
  );

  return client;
};

// Create the main API client instance
const apiClient = createApiClient();

/**
 * Enhanced retry mechanism with detailed logging
 */
const retryRequest = async <T>(
  requestFn: () => Promise<T>, 
  retries = MAX_RETRIES,
  context: { method?: string; url?: string; requestId?: string } = {}
): Promise<T> => {
  const { method = 'UNKNOWN', url = 'unknown', requestId = 'unknown' } = context;
  const attemptNumber = MAX_RETRIES - retries + 1;
  
  try {
    return await requestFn();
  } catch (error) {
    const shouldRetryRequest = retries > 0 && shouldRetry(error);
    
    if (DEBUG_API_CALLS) {
      console.warn(`⏳ Request attempt ${attemptNumber}/${MAX_RETRIES} failed [${requestId}]:`, {
        method,
        url,
        error: error instanceof Error ? error.message : 'Unknown error',
        willRetry: shouldRetryRequest,
        remainingRetries: retries
      });
    }
    
    if (shouldRetryRequest) {
      const delayMs = RETRY_DELAY * attemptNumber; // Exponential backoff
      
      if (DEBUG_API_CALLS) {
        console.warn(`⏳ Retrying request in ${delayMs}ms... (${attemptNumber}/${MAX_RETRIES}) [${requestId}]`);
      }
      
      await delay(delayMs);
      return retryRequest(requestFn, retries - 1, context);
    }
    
    // Enhance error with retry context before throwing
    if (error && typeof error === 'object' && 'details' in error) {
      (error as any).details = {
        ...(error as any).details,
        retryAttempts: attemptNumber,
        maxRetries: MAX_RETRIES,
        finalAttempt: true
      };
    }
    
    throw error;
  }
};

/**
 * Simplified retry logic - no auth error retries to prevent loops
 */
const shouldRetry = (error: any): boolean => {
  if (!error.response) {
    // Network errors should be retried
    const isTimeout = error.code === 'ECONNABORTED';
    const isNetworkError = !error.response && !isTimeout;
    return isNetworkError || isTimeout;
  }
  
  const status = error.response.status;
  
  // Only retry server errors, rate limits, and timeouts - not auth errors
  const isServerError = status >= 500;
  const isRateLimit = status === 429;
  const isRequestTimeout = status === 408;
  const isTemporaryUnavailable = status === 503;
  const isAuthError = status === 401;
  
  // Don't retry auth errors to prevent loops
  return (isServerError || isRateLimit || isRequestTimeout || isTemporaryUnavailable) && !isAuthError;
};

/**
 * Delay utility for retry mechanism
 */
const delay = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Enhanced generic API request method with comprehensive error handling
 */
const request = async <T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  endpoint: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> => {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const fullUrl = `${Environment.getApiBaseUrl()}${endpoint}`;
  
  return retryRequest(
    async () => {
      const response = await apiClient.request({
        method,
        url: endpoint,
        data: method !== 'GET' ? data : undefined,
        params: method === 'GET' ? data : undefined,
        ...config,
        metadata: { requestId, method, endpoint }
      });

      // Handle API response format with validation
      if (response.data && typeof response.data === 'object' && 'success' in response.data) {
        const apiResponse = response.data as ApiResponse<T>;
        
        if (apiResponse.success) {
          if (DEBUG_API_CALLS && apiResponse.meta) {
            console.log(`📊 API Response Meta [${requestId}]:`, {
              pagination: {
                page: apiResponse.meta.page,
                limit: apiResponse.meta.limit,
                total: apiResponse.meta.total,
                hasMore: apiResponse.meta.hasMore
              }
            });
          }
          return apiResponse.data;
        } else {
          // Create enhanced error for API-level failures
          const errorMessage = apiResponse.error || apiResponse.message || 'API request failed';
          const enhancedError = createAppError(
            new Error(errorMessage),
            'API Response Error',
            {
              requestId,
              method,
              endpoint,
              apiResponse
            }
          );
          throw enhancedError;
        }
      }

      // Return raw data if not in standard API format
      return response.data;
    },
    MAX_RETRIES,
    { method, url: fullUrl, requestId }
  );
};

/**
 * API Service - Main export with all HTTP methods
 */
export const ApiService = {
  /**
   * GET request
   */
  get: <T>(endpoint: string, params?: any, config?: AxiosRequestConfig): Promise<T> => {
    return request<T>('GET', endpoint, params, config);
  },

  /**
   * POST request
   */
  post: <T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return request<T>('POST', endpoint, data, config);
  },

  /**
   * PUT request
   */
  put: <T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return request<T>('PUT', endpoint, data, config);
  },

  /**
   * PATCH request
   */
  patch: <T>(endpoint: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return request<T>('PATCH', endpoint, data, config);
  },

  /**
   * DELETE request
   */
  delete: <T>(endpoint: string, params?: any, config?: AxiosRequestConfig): Promise<T> => {
    return request<T>('DELETE', endpoint, params, config);
  },

  /**
   * Upload file
   */
  upload: <T>(endpoint: string, file: File, additionalData?: any, config?: AxiosRequestConfig): Promise<T> => {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    return request<T>('POST', endpoint, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers
      }
    });
  },

  /**
   * Enhanced health check with timeout and error handling
   */
  healthCheck: async (): Promise<{ status: string; timestamp: string; details?: any }> => {
    try {
      const result = await request('GET', '/v1/health');
      
      if (DEBUG_API_CALLS) {
        console.log('💚 Health check successful:', result);
      }
      
      return result;
    } catch (error) {
      const healthError = {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Health check failed',
        details: error
      };
      
      if (DEBUG_API_CALLS) {
        console.error('💔 Health check failed:', healthError);
      }
      
      throw createAppError(error, 'Health Check Failed', healthError);
    }
  },

  /**
   * Set Firebase ID token synchronously
   */
  setAuth: (token: string) => {
    setAuthToken(token);
  },

  /**
   * Set authentication tokens (legacy compatibility)
   */
  setAuthTokens,

  /**
   * Clear authentication tokens
   */
  clearAuth: () => {
    clearAuthTokens();
  },

  /**
   * Get current auth token
   */
  getAuthToken,

  /**
   * Get base URL
   */
  getBaseUrl: () => Environment.getApiBaseUrl()
};

/**
 * Specific API endpoints organized by resource
 */
export const API = {
  // Authentication endpoints - Updated for Firebase Auth
  auth: {
    login: async (credentials: { email: string; password: string } | { idToken: string }) => {
      const response = await ApiService.post<any>('/v1/auth/login', credentials);
      
      // For Firebase Auth, we don't get tokens from backend - they come from Firebase
      // Backend just validates the token and returns user data
      return {
        user: response.user || response.data?.user || response,
        tokens: undefined // Firebase ID tokens are managed by Firebase, not backend
      };
    },
    
    register: async (userData: { name: string; email: string; password: string } | { idToken: string; name: string }) => {
      const response = await ApiService.post<any>('/v1/auth/register', userData);
      
      // For Firebase Auth, we don't get tokens from backend - they come from Firebase
      return {
        user: response.user || response.data?.user || response,
        tokens: undefined // Firebase ID tokens are managed by Firebase, not backend
      };
    },
    
    logout: () => 
      ApiService.post('/v1/auth/logout'),
    
    refresh: async () => {
      // Simplified token refresh - Firebase handles token refreshing automatically
      throw new Error('Token refresh should be handled by Firebase Auth service, not API service');
    },
    
    me: async () => {
      const response = await ApiService.get<any>('/v1/auth/me');
      
      // Normalize backend response to consistent { user } shape
      return {
        user: response.user || response.data?.user || response
      };
    },

    updateProfile: async (updates: any) => {
      const response = await ApiService.patch<any>('/v1/auth/profile', updates);
      
      // Normalize backend response to consistent { user } shape
      return response.user || response.data?.user || response;
    }
  },

  // Properties endpoints
  properties: {
    getAll: (filters?: CorePropertyFilters | ApiPropertyFilters | Record<string, any>) => 
      ApiService.get<Property[]>('/v1/properties', filters),
    
    getById: (id: string) => 
      ApiService.get<Property>(`/v1/properties/${id}`),
    
    create: (propertyData: CreatePropertyRequest | Omit<Property, 'id' | 'createdAt' | 'updatedAt'>) =>
      ApiService.post<Property>('/v1/properties', propertyData),
    
    update: (id: string, propertyData: UpdatePropertyRequest | Partial<Property>) =>
      ApiService.put<Property>(`/v1/properties/${id}`, propertyData),
    
    delete: (id: string) =>
      ApiService.delete<{ success: boolean; message?: string }>(`/v1/properties/${id}`),
    
    search: (query: string, filters?: CorePropertyFilters | ApiPropertyFilters | Record<string, any>) =>
      ApiService.get<Property[]>('/v1/properties/search', { q: query, ...filters })
  },

  // Testimonials endpoints
  testimonials: {
    getAll: () => 
      ApiService.get<any[]>('/v1/testimonials/approved'), // Use public approved endpoint
    
    getApproved: () =>
      ApiService.get<any[]>('/v1/testimonials/approved'),
    
    getPending: () =>
      ApiService.get<any[]>('/v1/testimonials/pending'),
    
    create: (testimonialData: any) =>
      ApiService.post<any>('/v1/testimonials', testimonialData),
    
    update: (id: string, updates: any) =>
      ApiService.put<any>(`/v1/testimonials/${id}`, updates),
    
    updateStatus: (id: string, statusData: { status: string; reviewerId?: string; reason?: string }) =>
      ApiService.patch<any>(`/v1/testimonials/${id}/status`, statusData),
    
    delete: (id: string) =>
      ApiService.delete(`/v1/testimonials/${id}`),
    
    getStats: () =>
      ApiService.get<any>('/v1/testimonials/stats')
  },

  // Inquiries endpoints
  inquiries: {
    getAll: (filters?: any) => 
      ApiService.get<any[]>('/v1/inquiries', filters),
    
    getById: (id: string) =>
      ApiService.get<any>(`/v1/inquiries/${id}`),
    
    create: (inquiryData: any) =>
      ApiService.post<any>('/v1/inquiries', inquiryData),
    
    update: (id: string, updates: any) =>
      ApiService.put<any>(`/v1/inquiries/${id}`, updates),
    
    updateStatus: (id: string, status: string, notes?: string) =>
      ApiService.patch<any>(`/v1/inquiries/${id}/status`, { status, notes }),
    
    assign: (id: string, agentId: string) =>
      ApiService.patch<any>(`/v1/inquiries/${id}/assign`, { agentId }),
    
    delete: (id: string) =>
      ApiService.delete(`/v1/inquiries/${id}`)
  },

  // FAQs endpoints
  faqs: {
    getAll: () => 
      ApiService.get<any[]>('/v1/faqs'),
    
    getById: (id: string) =>
      ApiService.get<any>(`/v1/faqs/${id}`),
    
    getCategories: () =>
      ApiService.get<any[]>('/v1/faqs/categories'),
    
    create: (faqData: any) =>
      ApiService.post<any>('/v1/faqs', faqData),
    
    update: (id: string, updates: any) =>
      ApiService.put<any>(`/v1/faqs/${id}`, updates),
    
    delete: (id: string) =>
      ApiService.delete(`/v1/faqs/${id}`)
  },

  // Users endpoints - DEPRECATED: Most endpoints not implemented in backend
  users: {
    // DEPRECATED: Use API.auth endpoints for user operations
    getAll: (filters?: any) => {
      console.warn('DEPRECATED: API.users.getAll is not implemented in backend. Use admin endpoints instead.');
      return ApiService.get<any[]>('/v1/users', filters);
    },
    
    // DEPRECATED: Use API.auth.me for current user profile
    getById: (id: string) => {
      console.warn('DEPRECATED: API.users.getById is not implemented in backend. Use API.auth.me instead.');
      return ApiService.get<any>(`/v1/users/${id}`);
    },
    
    // DEPRECATED: This endpoint does not exist in backend
    getProfile: (id: string) => {
      console.warn('DEPRECATED: API.users.getProfile endpoint does not exist in backend. Use API.auth.me instead.');
      return Promise.reject(new Error('API.users.getProfile endpoint not implemented in backend'));
    },
    
    // DEPRECATED: Use API.auth.register for user creation
    create: (userData: any) => {
      console.warn('DEPRECATED: API.users.create is not implemented in backend. Use API.auth.register instead.');
      return ApiService.post<any>('/v1/users', userData);
    },
    
    // DEPRECATED: Use API.auth endpoints for profile updates
    update: (id: string, updates: any) => {
      console.warn('DEPRECATED: API.users.update is not implemented in backend. Use API.auth.updateProfile instead.');
      return ApiService.put<any>(`/v1/users/${id}`, updates);
    },
    
    // DEPRECATED: This endpoint does not exist in backend
    updateProfile: (id: string, profile: any) => {
      console.warn('DEPRECATED: API.users.updateProfile endpoint does not exist in backend. Use API.auth.updateProfile instead.');
      return Promise.reject(new Error('API.users.updateProfile endpoint not implemented in backend'));
    },
    
    // DEPRECATED: Role management not implemented in backend
    updateRole: (id: string, role: string) => {
      console.warn('DEPRECATED: API.users.updateRole is not implemented in backend.');
      return ApiService.patch<any>(`/v1/users/${id}/role`, { role });
    },
    
    // DEPRECATED: Property saving not implemented in backend
    saveProperty: (userId: string, propertyId: string) => {
      console.warn('DEPRECATED: API.users.saveProperty is not implemented in backend. Use local state only.');
      return Promise.reject(new Error('API.users.saveProperty endpoint not implemented in backend'));
    },
    
    // DEPRECATED: Property unsaving not implemented in backend
    unsaveProperty: (userId: string, propertyId: string) => {
      console.warn('DEPRECATED: API.users.unsaveProperty is not implemented in backend. Use local state only.');
      return Promise.reject(new Error('API.users.unsaveProperty endpoint not implemented in backend'));
    },
    
    // DEPRECATED: User deletion not implemented in backend
    delete: (id: string) => {
      console.warn('DEPRECATED: API.users.delete is not implemented in backend.');
      return ApiService.delete(`/v1/users/${id}`);
    }
  },

  // Companies endpoints
  companies: {
    getAll: () => 
      ApiService.get<any[]>('/v1/companies'),
    
    getActive: () =>
      ApiService.get<any[]>('/v1/companies/active'),
    
    getById: (id: string) =>
      ApiService.get<any>(`/v1/companies/${id}`),
    
    create: (companyData: any) =>
      ApiService.post<any>('/v1/companies', companyData),
    
    update: (id: string, updates: any) =>
      ApiService.put<any>(`/v1/companies/${id}`, updates),
    
    delete: (id: string) =>
      ApiService.delete(`/v1/companies/${id}`)
  },

  // Tags endpoints
  tags: {
    getAll: () => 
      ApiService.get<any[]>('/v1/tags'),
    
    getActive: () =>
      ApiService.get<any[]>('/v1/tags/active'),
    
    getById: (id: string) =>
      ApiService.get<any>(`/v1/tags/${id}`),
    
    create: (tagData: any) =>
      ApiService.post<any>('/v1/tags', tagData),
    
    update: (id: string, updates: any) =>
      ApiService.put<any>(`/v1/tags/${id}`, updates),
    
    delete: (id: string) =>
      ApiService.delete(`/v1/tags/${id}`)
  },

  // Company API methods - Direct methods for company store
  getAllCompanies: () => API.companies.getAll(),
  getActiveCompanies: () => API.companies.getActive(),
  createCompany: (companyData: any) => API.companies.create(companyData),
  updateCompany: (id: string, updates: any) => API.companies.update(id, updates),
  deleteCompany: (id: string) => API.companies.delete(id),

  // Tag API methods - Direct methods for tag store
  getAllTags: () => API.tags.getAll(),
  getActiveTags: () => API.tags.getActive(),
  createTag: (tagData: any) => API.tags.create(tagData),
  updateTag: (id: string, updates: any) => API.tags.update(id, updates),
  deleteTag: (id: string) => API.tags.delete(id),

  // FAQ API methods - Legacy compatibility methods for FAQ store
  getAllFAQs: () => API.faqs.getAll(),
  getAllFAQCategories: () => API.faqs.getCategories(),
  getActiveFAQs: () => API.faqs.getAll(), // Backend should filter active FAQs
  getActiveFAQCategories: () => API.faqs.getCategories(), // Backend should filter active categories
  getFAQsByCategory: (categoryId: string) => ApiService.get<any[]>(`/v1/faqs?category=${categoryId}`),
  createFAQ: (faqData: any) => API.faqs.create(faqData),
  updateFAQ: (id: string, updates: any) => API.faqs.update(id, updates),
  deleteFAQ: (id: string) => API.faqs.delete(id),
  createFAQCategory: (categoryData: any) => ApiService.post<any>('/v1/faqs/categories', categoryData),
  updateFAQCategory: (id: string, updates: any) => ApiService.put<any>(`/v1/faqs/categories/${id}`, updates),
  deleteFAQCategory: (id: string) => ApiService.delete(`/v1/faqs/categories/${id}`),

  // Property Scraper endpoints
  scraper: {
    // Preview search URL without scraping
    preview: (searchParams: any) =>
      ApiService.post<any>('/v1/scraper/preview', { searchParams }),
    
    // Scrape properties using search parameters or direct URL
    scrape: (request: {
      searchParams?: any;
      directUrl?: string;
      useCrawl?: boolean;
      maxPages?: number;
    }) =>
      ApiService.post<any>('/v1/scraper/scrape', request),
    
    // Import scraped properties into database
    import: (request: {
      properties: any[];
      skipValidation?: boolean;
      overwriteExisting?: boolean;
    }) =>
      ApiService.post<any>('/v1/scraper/import', request),
    
    // Get scraping history with pagination
    getHistory: (page = 1, limit = 20) =>
      ApiService.get<any>('/v1/scraper/history', { page, limit }),
    
    // Get search configuration examples
    getExamples: () =>
      ApiService.get<any>('/v1/scraper/examples'),
    
    // Save a search preset
    savePreset: (preset: {
      name: string;
      description?: string;
      searchParams: any;
      tags?: string[];
    }) =>
      ApiService.post<any>('/v1/scraper/presets', preset),
    
    // Get saved search presets
    getPresets: () =>
      ApiService.get<any>('/v1/scraper/presets'),
    
    // Update a search preset
    updatePreset: (id: string, updates: any) =>
      ApiService.put<any>(`/v1/scraper/presets/${id}`, updates),
    
    // Delete a search preset
    deletePreset: (id: string) =>
      ApiService.delete<any>(`/v1/scraper/presets/${id}`)
  }
};

export default ApiService;