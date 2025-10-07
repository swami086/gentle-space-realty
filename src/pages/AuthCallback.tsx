import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '@/store/adminStore';
import { GoogleAuthService } from '@/services/googleAuthService';
import { Loader2, CheckCircle, XCircle, AlertCircle, Shield, RefreshCw, Info } from 'lucide-react';
import { Environment } from '@/config/environment';

// Global flag to prevent multiple OAuth callback processing
let oauthCallbackInProgress = false;

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error' | 'access_denied' | 'retrying'>('processing');
  const [message, setMessage] = useState('Processing OAuth callback...');
  const [userInfo, setUserInfo] = useState<{ name: string; email: string } | null>(null);
  const [errorDetails, setErrorDetails] = useState<{
    type: string;
    code?: string;
    details?: string;
    retryable: boolean;
  } | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  
  const { isAuthenticated, admin, setAdmin, setGoogleUser, setAuthenticated } = useAdminStore();

  // Safe debug mode check
  const isDebugEnabled = (): boolean => {
    try {
      return Environment.isDebugMode();
    } catch {
      return false; // Safe fallback
    }
  };

  // Enhanced logging function
  const addDebugInfo = useCallback((info: string) => {
    if (isDebugEnabled()) {
      console.log(info);
      setDebugInfo(prev => [...prev, `${new Date().toISOString()}: ${info}`]);
    }
  }, [isDebugEnabled()]);

  // Enhanced error classification
  const classifyError = useCallback((error: any): {
    type: string;
    code?: string;
    details?: string;
    retryable: boolean;
  } => {
    if (!error) return { type: 'unknown', retryable: false };

    const errorMessage = error.message || error.toString() || '';
    const errorName = error.name || 'UnknownError';

    // OAuth Provider Errors (new - from explicit code exchange)
    if (errorName === 'OAuthProviderError' || errorMessage.includes('OAuth provider error')) {
      return {
        type: 'oauth_provider_error',
        code: 'PROVIDER_ERROR',
        details: 'OAuth provider returned an error during authentication',
        retryable: false
      };
    }

    // Code Exchange Errors (new - from explicit code exchange)
    if (errorName === 'CodeExchangeError' || errorMessage.includes('Authorization code exchange failed')) {
      return {
        type: 'code_exchange_error',
        code: 'CODE_EXCHANGE',
        details: 'Failed to exchange authorization code for session token',
        retryable: true
      };
    }

    // OAuth Configuration Errors (from enhanced GoogleAuthService)
    if (errorName === 'OAuthConfigError' || errorMessage.includes('OAuth configuration error')) {
      return {
        type: 'config_error',
        code: 'OAUTH_CONFIG',
        details: 'Invalid API key or OAuth provider configuration',
        retryable: false
      };
    }

    // Network Errors (from enhanced GoogleAuthService)
    if (errorName === 'NetworkError' || 
        errorMessage.includes('network') || 
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('timeout')) {
      return {
        type: 'network_error',
        code: 'NETWORK',
        details: 'Network connectivity issue during authentication',
        retryable: true
      };
    }

    // PKCE Token Exchange Errors
    if (errorMessage.includes('Invalid API key') || 
        errorMessage.includes('PKCE verification failed') ||
        errorMessage.includes('invalid_request')) {
      return {
        type: 'pkce_error',
        code: 'PKCE_INVALID',
        details: 'PKCE token validation failed - possible API key issue',
        retryable: true
      };
    }

    // Session/Token Errors
    if (errorMessage.includes('session') || 
        errorMessage.includes('token') ||
        errorMessage.includes('invalid_grant')) {
      return {
        type: 'session_error',
        code: 'SESSION_INVALID',
        details: 'Session or token validation failed',
        retryable: true
      };
    }

    // Database/User Errors
    if (errorMessage.includes('database') || 
        errorMessage.includes('user') ||
        errorMessage.includes('upsert')) {
      return {
        type: 'database_error',
        code: 'DB_ERROR',
        details: 'Database operation failed during user processing',
        retryable: true
      };
    }

    // Default case
    return {
      type: 'unknown_error',
      code: 'UNKNOWN',
      details: errorMessage,
      retryable: errorMessage.includes('timeout') || errorMessage.includes('network')
    };
  }, []);

  // Enhanced OAuth callback handler with retry logic
  const handleSupabaseOAuthCallback = useCallback(async (isRetry = false): Promise<void> => {
    const maxRetries = 3;
    const currentAttempt = isRetry ? retryCount + 1 : 1;
    
    // Prevent multiple concurrent OAuth callback processing
    if (oauthCallbackInProgress && !isRetry) {
      addDebugInfo('⚠️ OAuth callback already in progress, skipping duplicate call');
      return;
    }
    
    if (!isRetry) {
      oauthCallbackInProgress = true;
    }
    
    try {
      addDebugInfo(`🔐 AuthCallback: Processing enhanced OAuth callback (attempt ${currentAttempt}/${maxRetries + 1})...`);
      
      // Check if user is already authenticated
      if (isAuthenticated && admin && !isRetry) {
        addDebugInfo(`✅ User already authenticated: ${admin.email}`);
        setStatus('success');
        setMessage('Already authenticated! Redirecting to admin dashboard...');
        setUserInfo({ name: admin.name, email: admin.email });
        
        setTimeout(() => {
          navigate('/admin/dashboard', { replace: true });
        }, 1500);
        return;
      }

      setMessage(isRetry ? `Retrying authentication... (${currentAttempt}/${maxRetries})` : 'Processing enhanced Google OAuth callback...');
      if (isRetry) {
        setStatus('retrying');
        setRetryCount(currentAttempt - 1);
      }
      
      // Handle the OAuth callback with enhanced GoogleAuthService
      addDebugInfo('🔄 Calling GoogleAuthService.handleAuthCallback...');
      const { user: googleUser, error } = await GoogleAuthService.handleAuthCallback();
      
      if (error) {
        addDebugInfo(`❌ OAuth callback error: ${error.message} (${error.name})`);
        const errorClassification = classifyError(error);
        setErrorDetails(errorClassification);
        
        // Determine if we should retry
        if (errorClassification.retryable && currentAttempt <= maxRetries) {
          addDebugInfo(`🔄 Error is retryable, scheduling retry ${currentAttempt + 1}/${maxRetries + 1}...`);
          setTimeout(() => {
            handleSupabaseOAuthCallback(true);
          }, 2000 * currentAttempt); // Exponential backoff
          return;
        }
        
        // Max retries reached or non-retryable error
        setStatus('error');
        switch (errorClassification.type) {
          case 'oauth_provider_error':
            setMessage('OAuth provider error. Please try signing in again.');
            break;
          case 'code_exchange_error':
            setMessage('Authorization code exchange failed. Please try again.');
            break;
          case 'config_error':
            setMessage('Authentication configuration error. Please contact support.');
            break;
          case 'network_error':
            setMessage('Network error. Please check your connection and try again.');
            break;
          case 'pkce_error':
            setMessage('OAuth validation failed. Please try signing in again.');
            break;
          case 'session_error':
            setMessage('Session expired or invalid. Please sign in again.');
            break;
          case 'database_error':
            setMessage('Database error during authentication. Please try again.');
            break;
          default:
            setMessage('Authentication failed. Please try signing in again.');
        }
        
        setTimeout(() => {
          navigate('/admin', { replace: true });
        }, errorClassification.retryable ? 5000 : 3000);
        return;
      }

      if (!googleUser) {
        addDebugInfo('⚠️ No user returned from OAuth callback');
        
        if (currentAttempt <= maxRetries) {
          addDebugInfo(`🔄 No user data, retrying in 2 seconds... (${currentAttempt + 1}/${maxRetries + 1})`);
          setTimeout(() => {
            handleSupabaseOAuthCallback(true);
          }, 2000);
          return;
        }
        
        setStatus('error');
        setMessage('No user information received after retries. Please sign in again.');
        setErrorDetails({
          type: 'no_user_data',
          code: 'NO_USER',
          details: 'OAuth completed but no user data received',
          retryable: false
        });
        
        setTimeout(() => {
          navigate('/admin', { replace: true });
        }, 3000);
        return;
      }

      addDebugInfo(`✅ User received: ${googleUser.email} (${googleUser.id})`);
      
      // Check if user has admin privileges
      addDebugInfo('🔐 Checking admin access...');
      const hasAdminAccess = await GoogleAuthService.checkAdminAccess(googleUser.id);
      
      if (!hasAdminAccess) {
        addDebugInfo(`❌ User does not have admin privileges: ${googleUser.email}`);
        setStatus('access_denied');
        setMessage('Access denied. Admin privileges required.');
        setUserInfo({ name: googleUser.name, email: googleUser.email });
        
        // Sign out the user since they don't have admin access
        await GoogleAuthService.signOut();
        
        setTimeout(() => {
          navigate('/admin', { replace: true });
        }, 4000);
        return;
      }

      // Get user role for admin profile
      addDebugInfo('👤 Getting user role...');
      const userRole = await GoogleAuthService.getUserRole(googleUser.id);
      
      // Create admin profile
      const adminProfile = {
        id: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        role: (userRole as 'admin' | 'super_admin') || 'admin',
        createdAt: new Date().toISOString()
      };

      // Update store with authenticated user
      setAdmin(adminProfile);
      setGoogleUser(googleUser);
      setAuthenticated(true);
      
      addDebugInfo(`✅ Admin authentication successful: ${adminProfile.email} (${adminProfile.role})`);
      setStatus('success');
      setMessage('Authentication successful! Redirecting to admin dashboard...');
      setUserInfo({ name: googleUser.name, email: googleUser.email });
      
      setTimeout(() => {
        navigate('/admin/dashboard', { replace: true });
      }, 1500);
      
    } catch (error) {
      addDebugInfo(`❌ Unexpected error in OAuth callback: ${error}`);
      const errorClassification = classifyError(error);
      setErrorDetails(errorClassification);
      
      // Determine if we should retry
      if (errorClassification.retryable && currentAttempt <= maxRetries) {
        addDebugInfo(`🔄 Unexpected error is retryable, scheduling retry ${currentAttempt + 1}/${maxRetries + 1}...`);
        setTimeout(() => {
          handleSupabaseOAuthCallback(true);
        }, 2000 * currentAttempt);
        return;
      }
      
      setStatus('error');
      setMessage('Authentication processing failed. Please try signing in again.');
      
      setTimeout(() => {
        navigate('/admin', { replace: true });
      }, 4000);
    } finally {
      // Reset the global flag when callback processing is complete or fails
      if (!isRetry) {
        oauthCallbackInProgress = false;
      }
    }
  }, [navigate, isAuthenticated, admin, setAdmin, setGoogleUser, setAuthenticated, retryCount, addDebugInfo, classifyError]);

  useEffect(() => {
    // Only run callback handler once when component mounts
    handleSupabaseOAuthCallback();
  }, []); // Empty dependency array to run only once

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Loader2 className="h-8 w-8 animate-spin text-blue-600" />;
      case 'retrying':
        return <RefreshCw className="h-8 w-8 animate-spin text-orange-600" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'error':
        return <XCircle className="h-8 w-8 text-red-600" />;
      case 'access_denied':
        return <AlertCircle className="h-8 w-8 text-yellow-600" />;
      default:
        return <Loader2 className="h-8 w-8 animate-spin text-blue-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'text-blue-600';
      case 'retrying':
        return 'text-orange-600';
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'access_denied':
        return 'text-yellow-600';
      default:
        return 'text-blue-600';
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'processing':
        return 'Processing Authentication...';
      case 'retrying':
        return 'Retrying Authentication...';
      case 'success':
        return 'Welcome Back!';
      case 'error':
        return 'Authentication Failed';
      case 'access_denied':
        return 'Access Denied';
      default:
        return 'Processing Authentication...';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="flex flex-col items-center space-y-4">
            {getStatusIcon()}
            
            <h2 className="text-xl font-semibold text-gray-900 text-center">
              {getStatusTitle()}
            </h2>
            
            <p className={`text-sm text-center ${getStatusColor()}`}>
              {message}
            </p>
            
            {/* Retry indicator */}
            {status === 'retrying' && retryCount > 0 && (
              <div className="text-center">
                <p className="text-xs text-orange-600 font-medium">
                  Attempt {retryCount} of 3
                </p>
              </div>
            )}
            
            {userInfo && (
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Welcome, <strong>{userInfo.name}</strong>
                </p>
                <p className="text-xs text-gray-500">{userInfo.email}</p>
              </div>
            )}
            
            {(status === 'processing' || status === 'retrying') && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`h-2 rounded-full animate-pulse ${status === 'retrying' ? 'bg-orange-600' : 'bg-blue-600'}`} 
                     style={{ width: '70%' }}></div>
              </div>
            )}

            {/* Enhanced error details */}
            {status === 'error' && errorDetails && (
              <div className="w-full p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-start space-x-3">
                  <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900 mb-1">
                      {errorDetails.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      {errorDetails.code && (
                        <span className="ml-2 px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">
                          {errorDetails.code}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-red-700 mb-2">
                      {errorDetails.details}
                    </p>
                    {errorDetails.retryable && (
                      <p className="text-xs text-red-600 font-medium">
                        ✓ This error was automatically retried
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Supabase Auth Info */}
            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg mt-4 w-full">
              <Shield className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">Enhanced Supabase Authentication</p>
                <p className="text-xs text-blue-700">
                  {status === 'retrying' ? 'Retrying with explicit code exchange' : 'Explicit OAuth code exchange with retry logic'}
                </p>
              </div>
            </div>
            
            {status === 'access_denied' && (
              <div className="w-full p-4 bg-yellow-50 rounded-lg">
                <p className="text-sm font-medium text-yellow-900 mb-1">Admin Access Required</p>
                <p className="text-xs text-yellow-700">
                  You must have an authorized email address (@gentlespacerealty.com) to access the admin portal.
                </p>
              </div>
            )}

            {/* Debug information (only shown when debug enabled) */}
            {isDebugEnabled() && debugInfo.length > 0 && (
              <div className="w-full mt-6 p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center space-x-2 mb-2">
                  <Info className="h-4 w-4 text-gray-600" />
                  <p className="text-sm font-medium text-gray-900">Debug Information</p>
                </div>
                <div className="max-h-40 overflow-y-auto">
                  {debugInfo.slice(-10).map((info, index) => (
                    <p key={index} className="text-xs text-gray-600 font-mono mb-1">
                      {info}
                    </p>
                  ))}
                </div>
                {debugInfo.length > 10 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Showing last 10 of {debugInfo.length} debug entries
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="text-center mt-4">
        <p className="text-xs text-gray-500">
          Gentle Space Realty Admin Portal - Enhanced Supabase Auth v2.0
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;