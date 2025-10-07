/**
 * Network Utility Module
 * Handles CSP-related errors and provides network diagnostics
 */

export interface NetworkError {
  type: 'csp' | 'network' | 'api' | 'timeout' | 'unknown';
  message: string;
  originalError?: Error;
  url?: string;
  statusCode?: number;
  retryable: boolean;
  userMessage: string;
  debugInfo?: Record<string, any>;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryCondition?: (error: NetworkError) => boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2
};

// CSP violation detection patterns
const CSP_ERROR_PATTERNS = [
  /refused to connect/i,
  /violates.*content security policy/i,
  /csp.*violation/i,
  /blocked.*content security policy/i,
  /refused to load/i
];

// Network connectivity patterns
const NETWORK_ERROR_PATTERNS = [
  /network error/i,
  /failed to fetch/i,
  /connection refused/i,
  /timeout/i,
  /net::/i
];

// API error patterns
const API_ERROR_PATTERNS = [
  /unauthorized/i,
  /forbidden/i,
  /not found/i,
  /internal server error/i,
  /bad request/i
];

/**
 * Detect if an error is CSP-related
 */
export function isCSPError(error: Error | string): boolean {
  const errorMessage = typeof error === 'string' ? error : error.message;
  return CSP_ERROR_PATTERNS.some(pattern => pattern.test(errorMessage));
}

/**
 * Detect if an error is network-related
 */
export function isNetworkError(error: Error | string): boolean {
  const errorMessage = typeof error === 'string' ? error : error.message;
  return NETWORK_ERROR_PATTERNS.some(pattern => pattern.test(errorMessage));
}

/**
 * Detect if an error is API-related
 */
export function isAPIError(error: Error | string, statusCode?: number): boolean {
  if (statusCode && statusCode >= 400 && statusCode < 600) {
    return true;
  }
  const errorMessage = typeof error === 'string' ? error : error.message;
  return API_ERROR_PATTERNS.some(pattern => pattern.test(errorMessage));
}

/**
 * Classify an error into specific types
 */
export function classifyError(error: Error, statusCode?: number, url?: string): NetworkError {
  const message = error.message;
  
  // Check for CSP violations first
  if (isCSPError(message)) {
    return {
      type: 'csp',
      message,
      originalError: error,
      url,
      retryable: false,
      userMessage: 'Connection blocked by security policy. Please check your browser settings or contact support.',
      debugInfo: {
        cspViolation: true,
        possibleCause: 'Content Security Policy blocking external request',
        solution: 'Update CSP configuration to allow the requested domain'
      }
    };
  }
  
  // Check for API errors
  if (isAPIError(message, statusCode)) {
    return {
      type: 'api',
      message,
      originalError: error,
      url,
      statusCode,
      retryable: statusCode ? statusCode >= 500 : false,
      userMessage: getAPIErrorMessage(statusCode),
      debugInfo: {
        statusCode,
        apiError: true
      }
    };
  }
  
  // Check for network errors
  if (isNetworkError(message)) {
    return {
      type: 'network',
      message,
      originalError: error,
      url,
      retryable: true,
      userMessage: 'Network connection issue. Please check your internet connection and try again.',
      debugInfo: {
        networkError: true,
        possibleCause: 'Internet connectivity or server unavailability'
      }
    };
  }
  
  // Check for timeout
  if (message.toLowerCase().includes('timeout')) {
    return {
      type: 'timeout',
      message,
      originalError: error,
      url,
      retryable: true,
      userMessage: 'Request timed out. Please try again.',
      debugInfo: {
        timeout: true
      }
    };
  }
  
  // Default to unknown error
  return {
    type: 'unknown',
    message,
    originalError: error,
    url,
    statusCode,
    retryable: true,
    userMessage: 'Something went wrong. Please try again later.',
    debugInfo: {
      unknownError: true
    }
  };
}

/**
 * Get user-friendly message for API errors
 */
function getAPIErrorMessage(statusCode?: number): string {
  switch (statusCode) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Authentication required. Please sign in and try again.';
    case 403:
      return 'Access denied. You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Please try again later.';
    case 502:
    case 503:
    case 504:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return 'An error occurred while processing your request.';
  }
}

/**
 * Calculate delay for exponential backoff
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelay * Math.pow(config.backoffFactor, attempt - 1);
  const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
  return Math.min(delay + jitter, config.maxDelay);
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: NetworkError | null = null;
  
  for (let attempt = 1; attempt <= retryConfig.maxRetries + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const networkError = classifyError(error as Error);
      lastError = networkError;
      
      // Don't retry if error is not retryable
      if (!networkError.retryable) {
        throw networkError;
      }
      
      // Don't retry if custom condition fails
      if (retryConfig.retryCondition && !retryConfig.retryCondition(networkError)) {
        throw networkError;
      }
      
      // Don't retry on last attempt
      if (attempt > retryConfig.maxRetries) {
        throw networkError;
      }
      
      // Calculate and wait for delay
      const delay = calculateDelay(attempt, retryConfig);
      console.warn(`⚠️ Retry attempt ${attempt}/${retryConfig.maxRetries} in ${Math.round(delay)}ms:`, networkError.message);
      await sleep(delay);
    }
  }
  
  throw lastError;
}

/**
 * Check network connectivity
 */
export async function checkNetworkConnectivity(): Promise<boolean> {
  try {
    // Try to fetch a small resource with minimal timeout
    const response = await fetch('/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
      signal: AbortSignal.timeout(5000)
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Test if a specific URL is accessible
 */
export async function testUrlAccess(url: string, timeout: number = 10000): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return true;
  } catch (error) {
    console.warn(`⚠️ URL access test failed for ${url}:`, error);
    return false;
  }
}

/**
 * Get network quality information
 */
export function getNetworkQuality(): {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
} {
  // @ts-ignore - navigator.connection is not in TypeScript types
  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  
  if (!connection) {
    return {};
  }
  
  return {
    effectiveType: connection.effectiveType,
    downlink: connection.downlink,
    rtt: connection.rtt,
    saveData: connection.saveData
  };
}

/**
 * Create fallback strategies for when external services are blocked
 */
export const FallbackStrategies = {
  /**
   * Handle Supabase connection failures
   */
  supabase: {
    async handleConnectionError(error: NetworkError, fallbackData?: any) {
      console.warn('🔴 Supabase connection failed:', error.message);
      
      if (error.type === 'csp') {
        console.error('🛡️ CSP blocking Supabase connection. Check CSP configuration.');
        // Could show a modal to user explaining CSP issue
      }
      
      // Return fallback data or empty array/object
      return fallbackData || [];
    },
    
    async retryConnection<T>(operation: () => Promise<T>, fallbackData?: T): Promise<T> {
      try {
        return await retryWithBackoff(operation, {
          maxRetries: 2,
          baseDelay: 2000,
          retryCondition: (error) => error.type !== 'csp' // Don't retry CSP errors
        });
      } catch (error) {
        console.error('🔴 Supabase operation failed after retries:', error);
        return fallbackData as T;
      }
    }
  },
  
  /**
   * Handle Google Maps API failures
   */
  googleMaps: {
    async handleLoadError() {
      console.warn('🗺️ Google Maps failed to load, using fallback');
      // Could show static map or alternative mapping service
      return null;
    }
  }
};

/**
 * Debug utilities for network troubleshooting
 */
export const NetworkDebug = {
  logNetworkInfo: () => {
    console.group('🌐 Network Information');
    console.log('Online:', navigator.onLine);
    console.log('Network Quality:', getNetworkQuality());
    console.log('User Agent:', navigator.userAgent);
    console.groupEnd();
  },
  
  async runConnectivityTests(urls: string[] = []) {
    console.group('🔍 Network Connectivity Tests');
    
    const baseConnectivity = await checkNetworkConnectivity();
    console.log('Base Connectivity:', baseConnectivity ? '✅ PASS' : '❌ FAIL');
    
    for (const url of urls) {
      const accessible = await testUrlAccess(url);
      console.log(`${url}:`, accessible ? '✅ PASS' : '❌ FAIL');
    }
    
    console.groupEnd();
  },
  
  logError: (error: NetworkError) => {
    console.group(`🚨 ${error.type.toUpperCase()} Error`);
    console.error('Message:', error.message);
    console.log('Retryable:', error.retryable);
    console.log('User Message:', error.userMessage);
    if (error.debugInfo) {
      console.log('Debug Info:', error.debugInfo);
    }
    if (error.originalError) {
      console.error('Original Error:', error.originalError);
    }
    console.groupEnd();
  }
};

export default {
  classifyError,
  retryWithBackoff,
  checkNetworkConnectivity,
  testUrlAccess,
  getNetworkQuality,
  FallbackStrategies,
  NetworkDebug,
  isCSPError,
  isNetworkError,
  isAPIError
};
