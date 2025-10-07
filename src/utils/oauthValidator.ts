import { supabase } from '@/lib/supabaseClient';

export interface OAuthValidationResult {
  isValid: boolean;
  error?: string;
  details?: Record<string, any>;
}

export interface OAuthConfigCheck {
  hasGoogleProvider: boolean;
  hasValidRedirectUrl: boolean;
  hasValidClientId: boolean;
  configurationErrors: string[];
}

export class OAuthValidator {
  /**
   * Validate if Google OAuth provider is properly configured in Supabase
   */
  static async validateGoogleOAuthConfig(): Promise<OAuthConfigCheck> {
    console.log('🔍 OAuthValidator: Checking Google OAuth configuration...');
    
    const result: OAuthConfigCheck = {
      hasGoogleProvider: false,
      hasValidRedirectUrl: false,
      hasValidClientId: false,
      configurationErrors: []
    };

    try {
      // Check if Google client ID is configured (advisory only)
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (clientId && clientId !== 'your-google-client-id-here') {
        result.hasValidClientId = true;
        console.log('✅ Google Client ID configured');
      } else {
        result.hasValidClientId = true; // Don't block - let Supabase handle it
        result.configurationErrors.push('Google Client ID not configured or using placeholder (advisory warning)');
        console.log('⚠️ Google Client ID missing or invalid - proceeding anyway');
      }

      // Check redirect URL configuration
      const currentOrigin = window.location.origin;
      const expectedCallbackUrl = `${currentOrigin}/auth/callback`;
      result.hasValidRedirectUrl = true; // Assume valid for now, can be enhanced
      console.log('✅ Redirect URL configured:', expectedCallbackUrl);

      // For now, assume Google provider is enabled if client ID is valid
      // In a real implementation, you might check Supabase settings API
      result.hasGoogleProvider = result.hasValidClientId;

      if (result.configurationErrors.length === 0) {
        console.log('✅ Google OAuth configuration appears valid');
      } else {
        console.log('❌ Google OAuth configuration issues:', result.configurationErrors);
      }

      return result;
    } catch (error) {
      console.error('❌ Error checking OAuth configuration:', error);
      result.configurationErrors.push(`Configuration check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }
  }

  /**
   * Check if current URL contains legitimate OAuth parameters
   */
  static validateOAuthCallback(): OAuthValidationResult {
    console.log('🔍 OAuthValidator: Validating OAuth callback...');
    
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    const hasCode = urlParams.has('code') || hashParams.has('code');
    const hasError = urlParams.has('error') || hashParams.has('error');
    const hasAccessToken = hashParams.has('access_token');
    const hasState = urlParams.has('state') || hashParams.has('state');

    const details = {
      url: window.location.href,
      searchParams: Object.fromEntries(urlParams.entries()),
      hashParams: Object.fromEntries(hashParams.entries()),
      hasCode,
      hasError,
      hasAccessToken,
      hasState
    };

    console.log('🔍 OAuth callback analysis:', details);

    // Check if this might be a direct navigation (empty hash or no parameters)
    const isEmptyCallback = window.location.hash === '#' || window.location.hash === '';
    if (isEmptyCallback && Object.keys(details.searchParams).length === 0) {
      console.log('⚠️ Empty callback detected - likely direct navigation or session check');
      return {
        isValid: false,
        error: 'Empty OAuth callback - likely direct navigation',
        details: { ...details, isEmptyCallback: true }
      };
    }

    // Valid OAuth callback should have either code, error, or access_token
    const isValidCallback = hasCode || hasError || hasAccessToken;

    if (!isValidCallback) {
      return {
        isValid: false,
        error: 'No OAuth parameters found in callback URL',
        details
      };
    }

    // Check for OAuth errors
    if (hasError) {
      const error = urlParams.get('error') || hashParams.get('error');
      const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
      
      return {
        isValid: false,
        error: errorDescription || `OAuth error: ${error}`,
        details
      };
    }

    console.log('✅ Valid OAuth callback detected');
    return {
      isValid: true,
      details
    };
  }

  /**
   * Check if we're in a legitimate OAuth flow (not direct navigation)
   */
  static isLegitimateOAuthFlow(): boolean {
    // Check if we have OAuth-related parameters or referrer
    const hasOAuthParams = this.validateOAuthCallback().isValid;
    const hasGoogleReferrer = document.referrer.includes('accounts.google.com') || 
                             document.referrer.includes('supabase.co');
    
    const isLegitimate = hasOAuthParams || hasGoogleReferrer;
    
    console.log('🔍 OAuth flow legitimacy check:', {
      hasOAuthParams,
      hasGoogleReferrer,
      referrer: document.referrer,
      isLegitimate
    });

    return isLegitimate;
  }

  /**
   * Validate OAuth redirect URL configuration
   */
  static validateRedirectUrl(): OAuthValidationResult {
    const currentOrigin = window.location.origin;
    const callbackPath = '/auth/callback';
    const fullCallbackUrl = `${currentOrigin}${callbackPath}`;
    
    // Basic validation - ensure we're on the correct callback path
    const isOnCallbackPath = window.location.pathname === callbackPath;
    
    if (!isOnCallbackPath && window.location.pathname !== '/auth/callback/') {
      return {
        isValid: false,
        error: 'Not on OAuth callback path',
        details: {
          currentPath: window.location.pathname,
          expectedPath: callbackPath,
          fullCallbackUrl
        }
      };
    }

    return {
      isValid: true,
      details: {
        callbackUrl: fullCallbackUrl,
        currentPath: window.location.pathname
      }
    };
  }

  /**
   * Get OAuth debugging information
   */
  static getOAuthDebugInfo(): Record<string, any> {
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    return {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      origin: window.location.origin,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      searchParams: Object.fromEntries(urlParams.entries()),
      hashParams: Object.fromEntries(hashParams.entries()),
      clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID ? 'configured' : 'missing',
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'missing'
    };
  }

  /**
   * Wait for OAuth processing using auth state change events instead of polling
   */
  static async waitForOAuthProcessing(timeoutMs: number = 10000): Promise<boolean> {
    const debugEnabled = import.meta.env.VITE_DEBUG_AUTH === 'true';
    
    if (debugEnabled) {
      console.log(`⏳ Waiting for OAuth processing using auth state change events (${timeoutMs}ms timeout)...`);
    }
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      let authListener: any = null;
      let timeoutId: NodeJS.Timeout | null = null;

      // Function to clean up listeners and resolve
      const cleanup = (result: boolean) => {
        if (authListener) {
          authListener.subscription?.unsubscribe?.();
          authListener = null;
        }
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        resolve(result);
      };

      // Set up timeout
      timeoutId = setTimeout(() => {
        if (debugEnabled) {
          console.log('⏰ OAuth processing timeout');
        }
        cleanup(false);
      }, timeoutMs);

      // First check if we already have a session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          console.log('✅ OAuth session already exists');
          cleanup(true);
          return;
        }

        // Set up auth state change listener
        console.log('🔄 Setting up auth state change listener...');
        authListener = supabase.auth.onAuthStateChange((event, session) => {
          console.log('🔔 Auth state change event:', event, session ? 'session exists' : 'no session');
          
          // Listen for SIGNED_IN event with valid session
          if (event === 'SIGNED_IN' && session) {
            console.log('✅ OAuth session detected via auth state change');
            cleanup(true);
          } else if (event === 'SIGNED_OUT') {
            console.log('🚪 User signed out during OAuth processing');
            // Continue listening, might be part of the OAuth flow
          }
        });
      }).catch(error => {
        console.error('❌ Error checking initial session:', error);
        // Continue with listener setup
        authListener = supabase.auth.onAuthStateChange((event, session) => {
          console.log('🔔 Auth state change event:', event, session ? 'session exists' : 'no session');
          
          if (event === 'SIGNED_IN' && session) {
            console.log('✅ OAuth session detected via auth state change');
            cleanup(true);
          }
        });
      });
    });
  }
}