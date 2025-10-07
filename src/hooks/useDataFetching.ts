import { useState, useEffect, useCallback, useRef } from 'react';
import { createAppError, withRetry, ErrorCategory } from '../utils/errorHandler';
import type { LoadingState, CacheConfig, CachedData, UseDataFetchingResult } from '../types/api';

// Debug logging
const debugEnabled = import.meta.env.VITE_DEBUG_AUTH === 'true' || 
                     import.meta.env.VITE_DEBUG_SUPABASE === 'true' ||
                     import.meta.env.MODE === 'development';

// In-memory cache
const cache = new Map<string, CachedData<any>>();

// Network status tracking
const getNetworkStatus = () => ({
  online: navigator.onLine,
  healthy: true, // Will be updated by connection checks
  lastCheck: Date.now()
});

// Cache utilities
const getCachedData = <T>(key: string): T | null => {
  const cached = cache.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > cached.ttl) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
};

const setCachedData = <T>(key: string, data: T, ttl: number): void => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl
  });
};

// Default loading state
const createLoadingState = (overrides: Partial<LoadingState> = {}): LoadingState => ({
  isLoading: false,
  isRefreshing: false,
  isSubmitting: false,
  error: null,
  lastFetchTime: null,
  ...overrides
});

/**
 * Custom hook for consistent data fetching patterns across the application
 */
export const useDataFetching = <T>(
  fetcher: () => Promise<T>,
  options: {
    key: string;
    cache?: CacheConfig;
    retry?: {
      maxAttempts?: number;
      baseDelay?: number;
    };
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    immediate?: boolean;
    dependencies?: any[];
  }
): UseDataFetchingResult<T> => {
  const {
    key,
    cache: cacheConfig,
    retry = { maxAttempts: 3, baseDelay: 1000 },
    onSuccess,
    onError,
    immediate = true,
    dependencies = []
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<LoadingState>(createLoadingState({ isLoading: immediate }));
  const [error, setError] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const lastFetchRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Safe state updates (only if component is still mounted)
  const safeSetState = useCallback((updater: () => void) => {
    if (isMountedRef.current) {
      updater();
    }
  }, []);

  // Fetch data with error handling and retry logic
  const fetchData = useCallback(async (isRefresh = false) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Check cache first (skip during refresh)
    if (!isRefresh && cacheConfig) {
      const cachedData = getCachedData<T>(key);
      if (cachedData) {
        safeSetState(() => {
          setData(cachedData);
          setLoading(createLoadingState({
            lastFetchTime: Date.now()
          }));
          setError(null);
        });
        return;
      }
    }

    // Update loading state
    safeSetState(() => {
      setLoading(prev => createLoadingState({
        ...prev,
        isLoading: !isRefresh,
        isRefreshing: isRefresh,
        error: null
      }));
      setError(null);
    });

    try {
      // Create a fetcher that respects abort signal
      const abortableFetcher = async (): Promise<T> => {
        if (controller.signal.aborted) {
          throw new Error('Request was cancelled');
        }
        return await fetcher();
      };

      const result = await withRetry(
        abortableFetcher,
        `Data fetch: ${key}`,
        retry.maxAttempts,
        retry.baseDelay,
        { key, isRefresh, networkStatus: getNetworkStatus() }
      );

      if (!isMountedRef.current || controller.signal.aborted) {
        return;
      }

      // Cache the result
      if (cacheConfig) {
        setCachedData(key, result, cacheConfig.ttl);
      }

      const fetchTime = Date.now();
      lastFetchRef.current = fetchTime;

      safeSetState(() => {
        setData(result);
        setLoading(createLoadingState({
          lastFetchTime: fetchTime
        }));
        setError(null);
      });

      onSuccess?.(result);

      if (debugEnabled) {
        console.log(`✅ Data fetch successful for key: ${key}`, result);
      }

    } catch (err: any) {
      if (!isMountedRef.current || controller.signal.aborted) {
        return;
      }

      const appError = createAppError(err, `Data fetch: ${key}`, {
        key,
        isRefresh,
        networkStatus: getNetworkStatus(),
        dependencies
      });

      safeSetState(() => {
        setLoading(createLoadingState({
          error: appError.userMessage,
          lastFetchTime: lastFetchRef.current || null
        }));
        setError(appError.userMessage);
      });

      onError?.(appError);

      if (debugEnabled) {
        console.error(`❌ Data fetch failed for key: ${key}`, appError);
      }
    }
  }, [key, fetcher, cacheConfig, retry, onSuccess, onError, safeSetState, ...dependencies]);

  // Refetch function (bypass cache)
  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // Refresh function (respect cache)
  const refresh = useCallback(async () => {
    await fetchData(false);
  }, [fetchData]);

  // Mutate function for optimistic updates
  const mutate = useCallback((newData: T) => {
    safeSetState(() => {
      setData(newData);
      
      // Update cache if configured
      if (cacheConfig) {
        setCachedData(key, newData, cacheConfig.ttl);
      }
    });
  }, [key, cacheConfig, safeSetState]);

  // Initial fetch
  useEffect(() => {
    if (immediate) {
      fetchData(false);
    }
  }, [immediate, ...dependencies]);

  return {
    data,
    loading,
    error,
    refetch,
    refresh,
    mutate
  };
};

/**
 * Hook for data mutations (create, update, delete operations)
 */
export const useMutation = <TData, TVariables>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    onSettled?: (data: TData | null, error: Error | null, variables: TVariables) => void;
  } = {}
) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TData | null>(null);
  
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const mutate = useCallback(async (variables: TVariables): Promise<TData> => {
    if (!isMountedRef.current) {
      throw new Error('Component unmounted');
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await mutationFn(variables);
      
      if (isMountedRef.current) {
        setData(result);
        setIsLoading(false);
        options.onSuccess?.(result, variables);
        options.onSettled?.(result, null, variables);
      }
      
      return result;
    } catch (err: any) {
      const appError = createAppError(err, 'Mutation', { variables });
      
      if (isMountedRef.current) {
        setError(appError.userMessage);
        setIsLoading(false);
        options.onError?.(appError, variables);
        options.onSettled?.(null, appError, variables);
      }
      
      throw appError;
    }
  }, [mutationFn, options]);

  const reset = useCallback(() => {
    if (isMountedRef.current) {
      setData(null);
      setError(null);
      setIsLoading(false);
    }
  }, []);

  return {
    mutate,
    isLoading,
    error,
    data,
    reset
  };
};

/**
 * Hook for optimistic updates
 */
export const useOptimisticUpdate = <T>(
  currentData: T | null,
  mutationFn: (data: T) => Promise<T>
) => {
  const [optimisticData, setOptimisticData] = useState<T | null>(currentData);
  const [isReverting, setIsReverting] = useState(false);

  const performOptimisticUpdate = useCallback(async (newData: T): Promise<T> => {
    const previousData = optimisticData;
    
    // Immediately update to optimistic state
    setOptimisticData(newData);
    
    try {
      const result = await mutationFn(newData);
      setOptimisticData(result);
      return result;
    } catch (error) {
      // Revert on error
      setIsReverting(true);
      setOptimisticData(previousData);
      
      setTimeout(() => {
        setIsReverting(false);
      }, 300);
      
      throw error;
    }
  }, [optimisticData, mutationFn]);

  // Sync with external data changes
  useEffect(() => {
    if (!isReverting) {
      setOptimisticData(currentData);
    }
  }, [currentData, isReverting]);

  return {
    data: optimisticData,
    performOptimisticUpdate,
    isReverting
  };
};

/**
 * Hook for managing multiple related data fetches
 */
export const useMultiDataFetching = <T extends Record<string, any>>(
  fetchers: Record<keyof T, () => Promise<T[keyof T]>>,
  options: {
    immediate?: boolean;
    dependencies?: any[];
  } = {}
) => {
  const [data, setData] = useState<Partial<T>>({});
  const [loading, setLoading] = useState<Record<keyof T, LoadingState>>({} as Record<keyof T, LoadingState>);
  const [errors, setErrors] = useState<Record<keyof T, string | null>>({} as Record<keyof T, string | null>);
  
  const { immediate = true, dependencies = [] } = options;

  const fetchAll = useCallback(async () => {
    const keys = Object.keys(fetchers) as (keyof T)[];
    
    // Initialize loading states
    const initialLoading = keys.reduce((acc, key) => {
      acc[key] = createLoadingState({ isLoading: true });
      return acc;
    }, {} as Record<keyof T, LoadingState>);
    
    setLoading(initialLoading);
    
    // Fetch all data in parallel
    const results = await Promise.allSettled(
      keys.map(async (key) => {
        try {
          const result = await fetchers[key]();
          return { key, result, error: null };
        } catch (error) {
          const appError = createAppError(error, `Multi-fetch: ${String(key)}`);
          return { key, result: null, error: appError.userMessage };
        }
      })
    );

    // Process results
    const newData: Partial<T> = {};
    const newLoading: Record<keyof T, LoadingState> = {} as Record<keyof T, LoadingState>;
    const newErrors: Record<keyof T, string | null> = {} as Record<keyof T, string | null>;

    results.forEach((result, index) => {
      const key = keys[index];
      
      if (result.status === 'fulfilled') {
        const { result: fetchResult, error } = result.value;
        newData[key] = fetchResult;
        newLoading[key] = createLoadingState({ lastFetchTime: Date.now() });
        newErrors[key] = error;
      } else {
        newLoading[key] = createLoadingState({ error: result.reason?.message || 'Unknown error' });
        newErrors[key] = result.reason?.message || 'Unknown error';
      }
    });

    setData(newData);
    setLoading(newLoading);
    setErrors(newErrors);
  }, [fetchers, ...dependencies]);

  useEffect(() => {
    if (immediate) {
      fetchAll();
    }
  }, [immediate, fetchAll]);

  const isAnyLoading = Object.values(loading).some(l => l.isLoading);
  const hasAnyError = Object.values(errors).some(e => e !== null);

  return {
    data,
    loading,
    errors,
    refetchAll: fetchAll,
    isAnyLoading,
    hasAnyError
  };
};

export default { useDataFetching, useMutation, useOptimisticUpdate, useMultiDataFetching };