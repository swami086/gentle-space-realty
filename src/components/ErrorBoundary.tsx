import React, { Component, ReactNode, ErrorInfo } from 'react';
import { 
  NetworkError, 
  classifyError, 
  isCSPError, 
  NetworkDebug 
} from '@/utils/networkUtils';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
  context?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  networkError: NetworkError | null;
  isCSPError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  private retryCount: number = 0;
  private maxRetries: number = 3;

  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      networkError: null,
      isCSPError: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Classify the error to determine if it's CSP-related
    const networkError = classifyError(error);
    const isCspError = networkError.type === 'csp' || isCSPError(error.message);
    
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      networkError,
      isCSPError: isCspError,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, level = 'component', context } = this.props;
    
    // Classify the error for detailed handling
    const networkError = classifyError(error, undefined, import.meta.env.VITE_SUPABASE_URL);
    const isCspError = networkError.type === 'csp' || isCSPError(error.message);
    
    // Log error details to console with context
    console.group(`🚨 ErrorBoundary: ${level} error in ${context || 'unknown context'}`);
    console.error('Error:', error);
    console.error('Error Type:', networkError.type);
    console.error('Is CSP Error:', isCspError);
    console.error('Network Error Details:', networkError);
    console.error('Error Info:', errorInfo);
    console.error('Component Stack:', errorInfo.componentStack);
    console.error('Error Stack:', error.stack);
    console.error('Retry Count:', this.retryCount);
    
    // Special logging for CSP errors
    if (isCspError) {
      console.error('🛡️ CSP Error Details:', {
        userMessage: networkError.userMessage,
        solutions: [
          'Check if all required URLs are allowed in CSP policy',
          'Verify browser is not blocking requests',
          'Check for browser extension interference',
          'Try refreshing the page or using incognito mode'
        ],
        currentCSPPolicy: document.querySelector('meta[http-equiv="Content-Security-Policy"]')?.getAttribute('content')
      });
      
      // Log CSP debugging information
      NetworkDebug.logCSPError(networkError, {
        component: 'ErrorBoundary',
        context,
        level,
        timestamp: new Date().toISOString(),
        componentStack: errorInfo.componentStack
      });
    } else {
      NetworkDebug.logError(networkError);
    }
    
    console.groupEnd();

    // Store error details for display (Sentry removed)
    this.setState({
      errorId: null, // No longer tracking error IDs
      errorInfo,
      networkError,
      isCSPError: isCspError,
    });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`🔄 ErrorBoundary: Attempting retry ${this.retryCount}/${this.maxRetries}`);
      
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        networkError: null,
        isCSPError: false,
      });
    } else {
      console.error('❌ ErrorBoundary: Maximum retries exceeded');
    }
  };

  handleReload = () => {
    console.log('🔄 ErrorBoundary: Reloading page...');
    window.location.reload();
  };

  render() {
    const { hasError, error, errorInfo, networkError, isCSPError } = this.state;
    const { children, fallback, level = 'component', context } = this.props;

    if (hasError && error) {
      // If a custom fallback is provided, use it
      if (fallback) {
        return fallback;
      }

      // Determine error UI based on level
      const isPageLevel = level === 'page';
      const isCritical = level === 'critical';

      return (
        <div className={`${isPageLevel ? 'min-h-screen' : 'min-h-64'} flex items-center justify-center bg-red-50 border-2 border-red-200 rounded-lg p-4`}>
          <div className="text-center max-w-lg">
            {/* Error Icon */}
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-xl font-bold text-red-800 mb-2">
              {isCritical ? 'Critical Application Error' : 
               isPageLevel ? 'Page Load Error' : 
               'Component Error'}
            </h1>

            {/* Error Description */}
            <p className="text-red-600 mb-4">
              {isCSPError ? 
                'Connection blocked by browser security policy. This may be due to Content Security Policy restrictions.' :
                isCritical ? 
                  'A critical error occurred that prevents the application from working properly.' :
                  'Something went wrong while loading this content.'}
            </p>
            
            {/* CSP-specific guidance */}
            {isCSPError && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 text-left">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      <strong>CSP Security Policy Issue</strong>
                    </p>
                    <div className="mt-2 text-sm text-yellow-600">
                      <p>This error may be caused by:</p>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Browser security extensions</li>
                        <li>Corporate firewall policies</li>
                        <li>Browser privacy settings</li>
                        <li>Ad blockers or content filters</li>
                      </ul>
                      <p className="mt-2">Try refreshing the page or using incognito mode.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Error Details (in development) */}
            {process.env.NODE_ENV === 'development' && (
              <details className="text-left bg-red-100 p-3 rounded mb-4 text-sm">
                <summary className="cursor-pointer font-medium text-red-800 mb-2">
                  Error Details (Development Only)
                </summary>
                <div className="space-y-2">
                  {context && (
                    <div>
                      <strong>Context:</strong> {context}
                    </div>
                  )}
                  <div>
                    <strong>Error:</strong> {error.message}
                  </div>
                  {error.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="text-xs mt-1 bg-red-200 p-2 rounded overflow-auto max-h-32">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                  {errorInfo?.componentStack && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="text-xs mt-1 bg-red-200 p-2 rounded overflow-auto max-h-32">
                        {errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              {this.retryCount < this.maxRetries ? (
                <button
                  onClick={this.handleRetry}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                >
                  Try Again ({this.maxRetries - this.retryCount} retries left)
                </button>
              ) : (
                <button
                  onClick={this.handleReload}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
                >
                  Reload Page
                </button>
              )}
              
              {!isPageLevel && (
                <button
                  onClick={() => window.history.back()}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                >
                  Go Back
                </button>
              )}
            </div>

            {/* Help Text */}
            <p className="text-xs text-red-500 mt-4">
              {isCritical ? 
                'If this problem persists, please contact support.' :
                'If this problem continues, try refreshing the page or contact support.'}
              {this.state.errorId && (
                <> Error ID: <code className="bg-red-100 px-1 rounded">{this.state.errorId}</code></>
              )}
            </p>
          </div>
        </div>
      );
    }

    return children;
  }
}

// Higher-order component for easy wrapping
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Specialized error boundaries for different contexts
export const PageErrorBoundary: React.FC<Omit<Props, 'level'>> = ({ children, ...props }) => (
  <ErrorBoundary level="page" {...props}>
    {children}
  </ErrorBoundary>
);

export const ComponentErrorBoundary: React.FC<Omit<Props, 'level'>> = ({ children, ...props }) => (
  <ErrorBoundary level="component" {...props}>
    {children}
  </ErrorBoundary>
);

export const CriticalErrorBoundary: React.FC<Omit<Props, 'level'>> = ({ children, ...props }) => (
  <ErrorBoundary level="critical" {...props}>
    {children}
  </ErrorBoundary>
);

export default ErrorBoundary;