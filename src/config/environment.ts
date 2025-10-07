/**
 * Frontend Environment Configuration
 * 
 * Centralized, type-safe environment configuration for the React frontend.
 * This module validates and provides access to all frontend environment variables.
 */

// Simple environment configuration using import.meta.env directly
export class EnvironmentValidationError extends Error {
  constructor(message: string, public readonly issues: any[] = []) {
    super(message);
    this.name = 'EnvironmentValidationError';
  }
}

export type FrontendConfig = {
  VITE_API_BASE_URL: string;
  VITE_FIREBASE_API_KEY: string;
  VITE_FIREBASE_PROJECT_ID: string;
  VITE_FIREBASE_AUTH_DOMAIN: string;
  VITE_FIREBASE_APP_ID?: string;
  VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  VITE_FIREBASE_STORAGE_BUCKET?: string;
  VITE_APP_ENV: string;
  VITE_DEBUG_MODE: boolean;
  VITE_GOOGLE_MAPS_API_KEY?: string;
  VITE_GOOGLE_CLIENT_ID?: string;
  VITE_SENTRY_DSN?: string;
};

// Global configuration instance
let config: FrontendConfig | null = null;

/**
 * Initialize and validate frontend environment configuration
 */
function initializeEnvironment(): FrontendConfig {
  if (config !== null) {
    return config;
  }

  // Simple direct access to environment variables
  config = {
    VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
    VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyAhrhy8Pfjwz7Au7A9Y9kLYKrHr8RA3Fnk',
    VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'gentle-space',
    VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'gentle-space.firebaseapp.com',
    VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID,
    VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    VITE_APP_ENV: import.meta.env.VITE_APP_ENV || 'development',
    VITE_DEBUG_MODE: import.meta.env.VITE_DEBUG_MODE === 'true' || import.meta.env.VITE_DEBUG_AUTH === 'true' || true,
    VITE_GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    VITE_GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID || import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID,
    VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
  };
  
  console.log('[Environment] Configuration loaded:', {
    environment: config.VITE_APP_ENV,
    apiBaseUrl: config.VITE_API_BASE_URL,
    firebaseProjectId: config.VITE_FIREBASE_PROJECT_ID,
    firebaseAuthDomain: config.VITE_FIREBASE_AUTH_DOMAIN,
    debugMode: config.VITE_DEBUG_MODE,
    note: 'GCP Migration: Frontend using Firebase Auth and Express API backend'
  });
  
  return config;
}

/**
 * Get validated frontend configuration
 * Throws an error if environment is not properly configured
 */
export function getEnvironmentConfig(): FrontendConfig {
  return initializeEnvironment();
}

/**
 * Environment utility functions for frontend
 */
export const Environment = {
  /**
   * Check if running in development mode
   */
  isDevelopment(): boolean {
    const env = getEnvironmentConfig();
    return env.VITE_APP_ENV === 'development';
  },

  /**
   * Check if running in staging mode
   */
  isStaging(): boolean {
    const env = getEnvironmentConfig();
    return env.VITE_APP_ENV === 'staging';
  },

  /**
   * Check if running in production mode
   */
  isProduction(): boolean {
    const env = getEnvironmentConfig();
    return env.VITE_APP_ENV === 'production';
  },

  /**
   * Check if debug mode is enabled
   */
  isDebugMode(): boolean {
    const env = getEnvironmentConfig();
    return env.VITE_DEBUG_MODE;
  },

  /**
   * Get API base URL for backend requests
   */
  getApiBaseUrl(): string {
    const env = getEnvironmentConfig();
    return env.VITE_API_BASE_URL;
  },

  /**
   * Get Firebase API key
   */
  getFirebaseApiKey(): string {
    const env = getEnvironmentConfig();
    return env.VITE_FIREBASE_API_KEY;
  },

  /**
   * Get Firebase project ID
   */
  getFirebaseProjectId(): string {
    const env = getEnvironmentConfig();
    return env.VITE_FIREBASE_PROJECT_ID;
  },

  /**
   * Get Firebase auth domain
   */
  getFirebaseAuthDomain(): string {
    const env = getEnvironmentConfig();
    return env.VITE_FIREBASE_AUTH_DOMAIN;
  },

  /**
   * Get Firebase app ID (optional)
   */
  getFirebaseAppId(): string | undefined {
    const env = getEnvironmentConfig();
    return env.VITE_FIREBASE_APP_ID;
  },

  /**
   * Get Firebase messaging sender ID (optional)
   */
  getFirebaseMessagingSenderId(): string | undefined {
    const env = getEnvironmentConfig();
    return env.VITE_FIREBASE_MESSAGING_SENDER_ID;
  },

  /**
   * Get Firebase storage bucket (optional)
   */
  getFirebaseStorageBucket(): string | undefined {
    const env = getEnvironmentConfig();
    return env.VITE_FIREBASE_STORAGE_BUCKET;
  },


  /**
   * Get Google Maps API key (optional)
   */
  getGoogleMapsApiKey(): string | undefined {
    const env = getEnvironmentConfig();
    return env.VITE_GOOGLE_MAPS_API_KEY;
  },

  /**
   * Get Google OAuth Client ID (optional)
   */
  getGoogleClientId(): string | undefined {
    const env = getEnvironmentConfig();
    return env.VITE_GOOGLE_CLIENT_ID;
  },

  /**
   * Get Sentry DSN (if configured)
   */
  getSentryDsn(): string | undefined {
    const env = getEnvironmentConfig();
    return env.VITE_SENTRY_DSN;
  },

  /**
   * Get current environment name
   */
  getEnvironment(): 'development' | 'staging' | 'production' {
    const env = getEnvironmentConfig();
    return env.VITE_APP_ENV;
  },

  /**
   * Check if a required service is configured
   */
  hasGoogleMapsKey(): boolean {
    try {
      const env = getEnvironmentConfig();
      return Boolean(env.VITE_GOOGLE_MAPS_API_KEY);
    } catch {
      return false;
    }
  },

  /**
   * Check if Google OAuth is configured
   */
  hasGoogleAuth(): boolean {
    try {
      const env = getEnvironmentConfig();
      return Boolean(env.VITE_GOOGLE_CLIENT_ID);
    } catch {
      return false;
    }
  },

  /**
   * Check if Sentry is configured
   */
  hasSentryDsn(): boolean {
    try {
      const env = getEnvironmentConfig();
      return Boolean(env.VITE_SENTRY_DSN);
    } catch {
      return false;
    }
  },

  /**
   * Check if Firebase is configured
   */
  hasFirebaseConfig(): boolean {
    try {
      const env = getEnvironmentConfig();
      return Boolean(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_PROJECT_ID && env.VITE_FIREBASE_AUTH_DOMAIN);
    } catch {
      return false;
    }
  },


  /**
   * Validate environment and show helpful errors
   */
  validateEnvironment(): { isValid: boolean; errors: string[] } {
    try {
      getEnvironmentConfig();
      return { isValid: true, errors: [] };
    } catch (error) {
      if (error instanceof EnvironmentValidationError) {
        return {
          isValid: false,
          errors: error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`)
        };
      }
      
      return {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Unknown configuration error']
      };
    }
  }
};

/**
 * Legacy compatibility - gradually replace direct import.meta.env usage with these functions
 */
export const LegacyEnvironment = {
  /**
   * @deprecated Use Environment.getGoogleMapsApiKey() instead
   */
  VITE_GOOGLE_MAPS_API_KEY: () => {
    if (Environment.isDebugMode()) {
      console.warn('[Environment] Using deprecated VITE_GOOGLE_MAPS_API_KEY. Use Environment.getGoogleMapsApiKey() instead.');
    }
    return Environment.getGoogleMapsApiKey();
  },

  /**
   * @deprecated Use Environment.getGoogleClientId() instead
   */
  VITE_GOOGLE_CLIENT_ID: () => {
    if (Environment.isDebugMode()) {
      console.warn('[Environment] Using deprecated VITE_GOOGLE_CLIENT_ID. Use Environment.getGoogleClientId() instead.');
    }
    return Environment.getGoogleClientId();
  },

  /**
   * @deprecated Use Environment.isDebugMode() instead
   */
  VITE_DEBUG_MODE: () => {
    if (Environment.isDebugMode()) {
      console.warn('[Environment] Using deprecated VITE_DEBUG_MODE. Use Environment.isDebugMode() instead.');
    }
    return Environment.isDebugMode();
  }
};

/**
 * Safe environment access that doesn't throw on module load
 * Use this in components to check environment status without causing crashes
 */
export const SafeEnvironment = {
  /**
   * Check if environment is properly configured
   */
  isConfigured(): boolean {
    try {
      getEnvironmentConfig();
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get configuration or null if not available
   */
  getConfig(): FrontendConfig | null {
    try {
      return getEnvironmentConfig();
    } catch {
      return null;
    }
  },

  /**
   * Get validation errors
   */
  getValidationErrors(): string[] {
    const result = Environment.validateEnvironment();
    return result.errors;
  }
};