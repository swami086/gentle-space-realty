/**
 * Custom hook to monitor network status and handle CSP-related connectivity issues
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  NetworkError, 
  classifyError, 
  retryWithBackoff, 
  checkNetworkConnectivity, 
  testUrlAccess,
  NetworkDebug,
  FallbackStrategies 
} from '../utils/networkUtils';

export interface NetworkStatus {
  isOnline: boolean;
  isConnecting: boolean;
  lastError: NetworkError | null;
  connectionQuality: 'fast' | 'slow' | 'offline' | 'unknown';
  retryCount: number;
}

export interface NetworkStatusHookResult {
  status: NetworkStatus;
  retry: () => Promise<void>;
  clearError: () => void;
  testConnection: (url?: string) => Promise<boolean>;
  executeWithRetry: <T>(operation: () => Promise<T>, fallback?: T) => Promise<T>;
}

interface UseNetworkStatusOptions {
  enableAutoRetry?: boolean;
  maxAutoRetries?: number;
  pingInterval?: number;
  testUrls?: string[];
  onNetworkChange?: (status: NetworkStatus) => void;
  onCSPViolation?: (error: NetworkError) => void;
}

const DEFAULT_OPTIONS: Required<UseNetworkStatusOptions> = {
  enableAutoRetry: true,
  maxAutoRetries: 3,
  pingInterval: 30000, // 30 seconds
  testUrls: [],
  onNetworkChange: () => {},
  onCSPViolation: () => {}
};

/**
 * Hook to monitor network status and handle connectivity issues
 */
export function useNetworkStatus(options: UseNetworkStatusOptions = {}): NetworkStatusHookResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isConnecting: false,
    lastError: null,
    connectionQuality: 'unknown',
    retryCount: 0
  });
  
  const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  
  // Update status safely
  const updateStatus = useCallback((updates: Partial<NetworkStatus>) => {
    if (mountedRef.current) {
      setStatus(prev => {
        const newStatus = { ...prev, ...updates };
        opts.onNetworkChange(newStatus);
        return newStatus;
      });
    }
  }, [opts]);
  
  // Test network connectivity
  const testNetworkConnectivity = useCallback(async (): Promise<boolean> => {
    try {
      updateStatus({ isConnecting: true });
      
      // Test basic connectivity
      const isConnected = await checkNetworkConnectivity();
      if (!isConnected) {
        updateStatus({ 
          isOnline: false, 
          connectionQuality: 'offline',
          isConnecting: false 
        });
        return false;
      }
      
      // Test specific URLs if provided
      if (opts.testUrls.length > 0) {
        const urlTests = await Promise.allSettled(
          opts.testUrls.map(url => testUrlAccess(url, 5000))
        );
        
        const successCount = urlTests.filter(result => 
          result.status === 'fulfilled' && result.value
        ).length;
        
        const quality = successCount === urlTests.length ? 'fast' :
                       successCount > 0 ? 'slow' : 'offline';
        
        updateStatus({ 
          isOnline: successCount > 0,
          connectionQuality: quality,
          isConnecting: false 
        });
        
        return successCount > 0;
      }
      
      updateStatus({ 
        isOnline: true, 
        connectionQuality: 'fast',
        isConnecting: false 
      });
      return true;
      
    } catch (error) {
      const networkError = classifyError(error as Error);
      
      // Handle CSP violations specially
      if (networkError.type === 'csp') {
        opts.onCSPViolation(networkError);
      }
      
      updateStatus({ 
        isOnline: false, 
        connectionQuality: 'offline',
        lastError: networkError,
        isConnecting: false 
      });
      return false;
    }
  }, [opts, updateStatus]);
  
  // Retry connection
  const retry = useCallback(async (): Promise<void> => {
    if (status.retryCount >= opts.maxAutoRetries) {
      console.warn('⚠️ Max auto retries reached');
      return;
    }
    
    updateStatus({ 
      retryCount: status.retryCount + 1,
      lastError: null 
    });
    
    await testNetworkConnectivity();
  }, [status.retryCount, opts.maxAutoRetries, testNetworkConnectivity, updateStatus]);
  
  // Clear error
  const clearError = useCallback(() => {
    updateStatus({ lastError: null, retryCount: 0 });
  }, [updateStatus]);
  
  // Test specific connection
  const testConnection = useCallback(async (url?: string): Promise<boolean> => {
    if (!url) {
      return await testNetworkConnectivity();
    }
    
    try {
      return await testUrlAccess(url, 10000);
    } catch (error) {
      const networkError = classifyError(error as Error, undefined, url);
      updateStatus({ lastError: networkError });
      
      if (networkError.type === 'csp') {
        opts.onCSPViolation(networkError);
      }
      
      return false;
    }
  }, [testNetworkConnectivity, updateStatus, opts]);
  
  // Execute operation with retry logic
  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    fallback?: T
  ): Promise<T> => {
    try {
      return await retryWithBackoff(operation, {
        maxRetries: 2,
        baseDelay: 1000,
        retryCondition: (error) => error.type !== 'csp' // Don't retry CSP errors
      });
    } catch (error) {
      const networkError = error as NetworkError;
      
      updateStatus({ lastError: networkError });
      
      if (networkError.type === 'csp') {
        opts.onCSPViolation(networkError);
      }
      
      // Log detailed error for debugging
      if (process.env.NODE_ENV === 'development') {
        NetworkDebug.logError(networkError);
      }
      
      // Return fallback if provided, otherwise rethrow
      if (fallback !== undefined) {
        console.warn('⚠️ Using fallback data due to network error:', networkError.userMessage);
        return fallback;
      }
      
      throw networkError;
    }
  }, [updateStatus, opts]);
  
  // Handle browser online/offline events
  useEffect(() => {
    const handleOnline = () => {
      updateStatus({ isOnline: true, lastError: null });
      testNetworkConnectivity();
    };
    
    const handleOffline = () => {
      updateStatus({ 
        isOnline: false, 
        connectionQuality: 'offline' 
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [testNetworkConnectivity, updateStatus]);
  
  // Periodic connectivity checks
  useEffect(() => {
    if (opts.pingInterval > 0) {
      pingIntervalRef.current = setInterval(() => {
        if (navigator.onLine) {
          testNetworkConnectivity();
        }
      }, opts.pingInterval);
    }
    
    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
    };
  }, [opts.pingInterval, testNetworkConnectivity]);
  
  // Auto retry on failure
  useEffect(() => {
    if (opts.enableAutoRetry && status.lastError && status.lastError.retryable) {
      const delay = Math.min(2000 * Math.pow(2, status.retryCount), 30000); // Max 30s
      
      retryTimeoutRef.current = setTimeout(() => {
        if (status.retryCount < opts.maxAutoRetries) {
          retry();
        }
      }, delay);
    }
    
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [status.lastError, status.retryCount, opts.enableAutoRetry, opts.maxAutoRetries, retry]);
  
  // Initial connectivity test
  useEffect(() => {
    testNetworkConnectivity();
  }, []); // Empty dependency array for mount-only effect
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);
  
  return {
    status,
    retry,
    clearError,
    testConnection,
    executeWithRetry
  };
}

/**
 * Hook specifically for Supabase connectivity
 */
export function useSupabaseNetworkStatus() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  
  return useNetworkStatus({
    testUrls: supabaseUrl ? [supabaseUrl] : [],
    onCSPViolation: (error) => {
      console.error('🛡️ CSP blocking Supabase connection:', error.message);
      // Could trigger a user notification about CSP issues
    }
  });
}

export default useNetworkStatus;
