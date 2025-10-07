import React, { Component, ReactNode, ErrorInfo } from 'react';
import * as Sentry from '@sentry/react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  initializationFailed: boolean;
  failedServices: string[];
}

interface InitializationError extends Error {
  service?: string;
  phase?: string;
  isCritical?: boolean;
}

/**
 * Specialized error boundary for handling initialization failures
 * that might cause blank screens during app startup
 */
class InitializationErrorBoundary extends Component<Props, State> {
  private initializationTimeout: NodeJS.Timeout | null = null;
  private readonly INITIALIZATION_TIMEOUT = 10000; // 10 seconds

  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      initializationFailed: false,
      failedServices: [],
    };

    // Set up initialization timeout to catch hanging initialization
    this.initializationTimeout = setTimeout(() => {
      if (!this.state.hasError) {
        console.warn('⚠️ InitializationErrorBoundary: Initialization timeout reached');
        this.handleInitializationTimeout();
      }
    }, this.INITIALIZATION_TIMEOUT);
  }

  componentDidMount() {
    // Listen for unhandled promise rejections during initialization
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
    
    // Clear timeout if component mounts successfully
    if (this.initializationTimeout) {
      clearTimeout(this.initializationTimeout);
      this.initializationTimeout = null;
    }
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
    
    if (this.initializationTimeout) {
      clearTimeout(this.initializationTimeout);
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const initError = error as InitializationError;
    
    return {
      hasError: true,
      error,
      initializationFailed: true,
      failedServices: initError.service ? [initError.service] : ['unknown'],
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const initError = error as InitializationError;
    
    // Enhanced logging for initialization errors
    console.group('🚨 InitializationErrorBoundary: Initialization failure detected');
    console.error('Error:', error.message);
    console.error('Service:', initError.service || 'unknown');
    console.error('Phase:', initError.phase || 'unknown');
    console.error('Critical:', initError.isCritical || false);
    console.error('Stack:', error.stack);
    console.error('Component Stack:', errorInfo.componentStack);
    console.groupEnd();

    // Capture detailed initialization error in Sentry
    Sentry.withScope((scope) => {
      scope.setTag('errorBoundary', 'initialization');
      scope.setTag('initializationPhase', initError.phase || 'unknown');
      scope.setTag('failedService', initError.service || 'unknown');
      scope.setTag('isCritical', initError.isCritical || false);
      
      scope.setContext('initialization', {
        service: initError.service,
        phase: initError.phase,
        isCritical: initError.isCritical,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        referrer: document.referrer,
        connectionType: (navigator as any)?.connection?.effectiveType || 'unknown',
      });

      scope.setLevel('fatal');
      Sentry.captureException(error);
    });

    this.setState({
      errorInfo,
      failedServices: initError.service ? [initError.service] : ['unknown'],
    });
  }

  handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    console.error('🚨 InitializationErrorBoundary: Unhandled promise rejection:', event.reason);
    
    // If we haven't already caught an error, treat this as an initialization failure
    if (!this.state.hasError) {
      const error = new Error(`Unhandled promise rejection: ${event.reason}`) as InitializationError;
      error.service = 'promise_rejection';
      error.phase = 'async_initialization';
      error.isCritical = true;

      this.setState({
        hasError: true,
        error,
        initializationFailed: true,
        failedServices: ['async_service'],
      });
    }
  };

  handleInitializationTimeout = () => {
    console.error('🚨 InitializationErrorBoundary: Initialization timeout - app may be stuck');
    
    const error = new Error('Application initialization timed out') as InitializationError;
    error.service = 'initialization_timeout';
    error.phase = 'startup';
    error.isCritical = true;

    this.setState({
      hasError: true,
      error,
      initializationFailed: true,
      failedServices: ['initialization'],
    });
  };

  handleRetryInitialization = () => {
    console.log('🔄 InitializationErrorBoundary: Retrying initialization...');
    
    // Clear any existing state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      initializationFailed: false,
      failedServices: [],
    });

    // Restart initialization timeout
    this.initializationTimeout = setTimeout(() => {
      if (!this.state.hasError) {
        this.handleInitializationTimeout();
      }
    }, this.INITIALIZATION_TIMEOUT);
  };

  handleSafeMode = () => {
    console.log('🛡️ InitializationErrorBoundary: Entering safe mode...');
    
    // Redirect to a minimal safe mode version of the app
    const safeUrl = new URL(window.location.href);
    safeUrl.searchParams.set('safe_mode', 'true');
    window.location.href = safeUrl.toString();
  };

  handleReload = () => {
    console.log('🔄 InitializationErrorBoundary: Performing full reload...');
    window.location.reload();
  };

  getServiceDisplayName = (service: string): string => {
    const serviceNames: Record<string, string> = {
      sentry: 'Error Tracking',
      dynatrace: 'Performance Monitoring', 
      supabase: 'Database Connection',
      realtime: 'Real-time Updates',
      css: 'Styling System',
      promise_rejection: 'Async Service',
      initialization_timeout: 'App Startup',
      unknown: 'Unknown Service',
    };

    return serviceNames[service] || service;
  };

  render() {
    const { hasError, error, initializationFailed, failedServices } = this.state;
    const { children } = this.props;

    if (hasError && error && initializationFailed) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100">
          <div className="max-w-md w-full mx-4">
            <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-red-500">
              {/* Icon */}
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    App Startup Failed
                  </h1>
                  <p className="text-sm text-gray-600">
                    Unable to initialize the application
                  </p>
                </div>
              </div>

              {/* Failed Services */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Affected Services:</h3>
                <div className="space-y-1">
                  {failedServices.map((service, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-gray-600">{this.getServiceDisplayName(service)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Error Message */}
              <div className="mb-4 p-3 bg-red-50 rounded border border-red-200">
                <p className="text-sm text-red-700 font-medium">
                  {error.message}
                </p>
              </div>

              {/* Development Details */}
              {process.env.NODE_ENV === 'development' && (
                <details className="mb-4">
                  <summary className="text-sm font-medium text-gray-700 cursor-pointer mb-2">
                    Technical Details (Development)
                  </summary>
                  <div className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-32">
                    <pre>{error.stack}</pre>
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={this.handleRetryInitialization}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors font-medium"
                >
                  Retry Initialization
                </button>
                
                <button
                  onClick={this.handleSafeMode}
                  className="w-full bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700 transition-colors font-medium"
                >
                  Enter Safe Mode
                </button>
                
                <button
                  onClick={this.handleReload}
                  className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors font-medium"
                >
                  Reload Page
                </button>
              </div>

              {/* Help Text */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  This error occurred during app startup. If the problem persists, 
                  check your network connection and try again.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

export default InitializationErrorBoundary;