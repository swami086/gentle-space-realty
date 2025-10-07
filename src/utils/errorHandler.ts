import * as Sentry from '@sentry/react';

// Error classification and categorization
export enum ErrorCategory {
  NETWORK = 'network',
  AUTH = 'auth',
  VALIDATION = 'validation',
  DATABASE = 'database',
  PERMISSION = 'permission',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface AppError extends Error {
  category: ErrorCategory;
  severity: ErrorSeverity;
  recoverable: boolean;
  userMessage: string;
  technicalDetails?: any;
  context?: Record<string, any>;
}

// Debug logging
const debugEnabled = import.meta.env.VITE_DEBUG_AUTH === 'true' || 
                     import.meta.env.VITE_DEBUG_SUPABASE === 'true' ||
                     import.meta.env.MODE === 'development';

// Error classification utility
export const classifyError = (error: any): { category: ErrorCategory; severity: ErrorSeverity; recoverable: boolean } => {
  const message = error?.message?.toLowerCase() || '';
  const code = error?.code || '';
  
  // Network errors
  if (message.includes('fetch') || message.includes('network') || code === 'NETWORK_ERROR') {
    return { category: ErrorCategory.NETWORK, severity: ErrorSeverity.MEDIUM, recoverable: true };
  }
  
  // Authentication errors
  if (message.includes('jwt') || message.includes('unauthorized') || message.includes('auth') || code === 'PGRST301') {
    return { category: ErrorCategory.AUTH, severity: ErrorSeverity.HIGH, recoverable: false };
  }
  
  // Database errors
  if (code?.startsWith('PGRST') || message.includes('database') || message.includes('relation')) {
    const severity = code === 'PGRST116' ? ErrorSeverity.LOW : ErrorSeverity.MEDIUM; // No data vs actual error
    return { category: ErrorCategory.DATABASE, severity, recoverable: true };
  }
  
  // Permission errors
  if (message.includes('permission') || message.includes('forbidden') || code === '42501') {
    return { category: ErrorCategory.PERMISSION, severity: ErrorSeverity.HIGH, recoverable: false };
  }
  
  // Validation errors
  if (message.includes('validation') || message.includes('invalid') || code?.startsWith('23')) {
    return { category: ErrorCategory.VALIDATION, severity: ErrorSeverity.MEDIUM, recoverable: false };
  }
  
  return { category: ErrorCategory.UNKNOWN, severity: ErrorSeverity.MEDIUM, recoverable: true };
};

// User-friendly error message generation
export const generateUserMessage = (error: any, operation: string): string => {
  const { category } = classifyError(error);
  
  switch (category) {
    case ErrorCategory.NETWORK:
      return 'Connection issue. Please check your internet connection and try again.';
    
    case ErrorCategory.AUTH:
      return 'Authentication required. Please sign in to continue.';
    
    case ErrorCategory.PERMISSION:
      return 'You don\'t have permission to perform this action.';
    
    case ErrorCategory.VALIDATION:
      return 'Invalid data provided. Please check your input and try again.';
    
    case ErrorCategory.DATABASE:
      if (error?.code === 'PGRST116') {
        return 'No data found for your request.';
      }
      return 'Data operation failed. Please try again in a moment.';
    
    default:
      return `${operation} failed. Please try again or contact support if the issue persists.`;
  }
};

// Create enhanced AppError
export const createAppError = (
  error: any, 
  operation: string, 
  context?: Record<string, any>
): AppError => {
  const { category, severity, recoverable } = classifyError(error);
  const userMessage = generateUserMessage(error, operation);
  
  const appError = new Error(userMessage) as AppError;
  appError.name = 'AppError';
  appError.category = category;
  appError.severity = severity;
  appError.recoverable = recoverable;
  appError.userMessage = userMessage;
  appError.technicalDetails = {
    originalError: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint
  };
  appError.context = { operation, ...context };
  
  return appError;
};

// Error logging and reporting
export const logError = (error: AppError): void => {
  if (debugEnabled) {
    console.group(`❌ ${error.category.toUpperCase()} ERROR - ${error.severity.toUpperCase()}`);
    console.error('User Message:', error.userMessage);
    console.error('Technical Details:', error.technicalDetails);
    console.error('Context:', error.context);
    console.error('Recoverable:', error.recoverable);
    console.groupEnd();
  }
  
  // Report to Sentry with appropriate level
  const sentryLevel = error.severity === ErrorSeverity.CRITICAL ? 'fatal' : 
                     error.severity === ErrorSeverity.HIGH ? 'error' :
                     error.severity === ErrorSeverity.MEDIUM ? 'warning' : 'info';
  
  Sentry.withScope(scope => {
    scope.setTag('errorCategory', error.category);
    scope.setTag('severity', error.severity);
    scope.setTag('recoverable', error.recoverable);
    scope.setContext('technicalDetails', error.technicalDetails);
    scope.setContext('errorContext', error.context);
    scope.setLevel(sentryLevel);
    
    Sentry.captureException(error);
  });
};

// Retry logic for recoverable errors
export const withRetry = async <T>(
  operation: () => Promise<T>,
  operationName: string,
  maxAttempts = 3,
  baseDelay = 1000,
  context?: Record<string, any>
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const appError = createAppError(error, operationName, { ...context, attempt });
      lastError = appError;
      
      if (!appError.recoverable || attempt === maxAttempts) {
        logError(appError);
        throw appError;
      }
      
      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      
      if (debugEnabled) {
        console.warn(`⚠️ ${operationName} failed (attempt ${attempt}/${maxAttempts}), retrying in ${Math.round(delay)}ms...`);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

// Error recovery strategies
export interface RecoveryStrategy {
  canRecover: (error: AppError) => boolean;
  recover: (error: AppError) => Promise<void>;
  message: string;
}

export const networkRecoveryStrategy: RecoveryStrategy = {
  canRecover: (error) => error.category === ErrorCategory.NETWORK,
  recover: async () => {
    // Wait for network to potentially recover
    await new Promise(resolve => setTimeout(resolve, 2000));
  },
  message: 'Waiting for network connection to recover...'
};

export const authRecoveryStrategy: RecoveryStrategy = {
  canRecover: (error) => error.category === ErrorCategory.AUTH,
  recover: async () => {
    // Clear auth state and redirect to login
    localStorage.removeItem('gentle-space-realty-auth-v3');
    window.location.href = '/login';
  },
  message: 'Redirecting to login page...'
};

// Error boundary helper
export const handleErrorBoundary = (error: Error, errorInfo: { componentStack: string }): void => {
  const appError = createAppError(error, 'Component Render', {
    componentStack: errorInfo.componentStack
  });
  
  logError(appError);
};

// Network error detection
export const isNetworkError = (error: any): boolean => {
  return error?.message?.includes('fetch') ||
         error?.message?.includes('NetworkError') ||
         error?.code === 'NETWORK_ERROR' ||
         !navigator.onLine;
};

// Authentication error detection
export const isAuthError = (error: any): boolean => {
  return error?.message?.includes('JWT') ||
         error?.message?.includes('unauthorized') ||
         error?.code === 'PGRST301' ||
         error?.status === 401;
};

// Database error detection
export const isDatabaseError = (error: any): boolean => {
  return error?.code?.startsWith('PGRST') ||
         error?.code?.startsWith('23') ||
         error?.message?.includes('database') ||
         error?.message?.includes('relation');
};

export default {
  classifyError,
  createAppError,
  logError,
  withRetry,
  generateUserMessage,
  handleErrorBoundary,
  isNetworkError,
  isAuthError,
  isDatabaseError,
  ErrorCategory,
  ErrorSeverity
};