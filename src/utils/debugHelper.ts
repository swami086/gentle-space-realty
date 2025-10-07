/**
 * Debug Helper Utility - Simplified Non-Interfering Version
 * Basic debugging tools that don't interfere with authentication flow
 */

import { Environment } from '@/config/environment';

interface AuthState {
  isAuthenticated: boolean;
  user: any;
  token: string | null;
  loading: boolean;
  error: string | null;
}

interface NetworkTest {
  url: string;
  status: 'success' | 'error' | 'pending';
  response?: any;
  error?: string;
  duration?: number;
}

class DebugHelper {
  private static instance: DebugHelper;
  private debugMode: boolean = false;

  constructor() {
    try {
      this.debugMode = Environment.isDebugMode() || Environment.isDevelopment();
    } catch {
      this.debugMode = false;
    }
  }

  static getInstance(): DebugHelper {
    if (!DebugHelper.instance) {
      DebugHelper.instance = new DebugHelper();
    }
    return DebugHelper.instance;
  }

  /**
   * Log debug messages only in debug mode
   */
  log(category: string, message: string, data?: any) {
    if (!this.debugMode) return;
    
    const timestamp = new Date().toISOString();
    console.log(`[DEBUG:${category}] ${timestamp} - ${message}`, data || '');
  }

  /**
   * Log authentication state changes
   */
  logAuthState(state: Partial<AuthState>, action?: string) {
    if (!this.debugMode) return;

    this.log('AUTH', `State change${action ? ` (${action})` : ''}`, {
      isAuthenticated: state.isAuthenticated,
      hasUser: !!state.user,
      hasToken: !!state.token,
      loading: state.loading,
      error: state.error,
      userId: state.user?.id || 'none'
    });
  }

  /**
   * Log API requests and responses
   */
  logApiRequest(method: string, url: string, data?: any) {
    if (!this.debugMode) return;
    
    this.log('API', `${method} ${url}`, {
      requestData: data,
      timestamp: Date.now()
    });
  }

  logApiResponse(method: string, url: string, status: number, response?: any, error?: any) {
    if (!this.debugMode) return;
    
    this.log('API', `${method} ${url} -> ${status}`, {
      success: status >= 200 && status < 300,
      response: response,
      error: error,
      timestamp: Date.now()
    });
  }

  /**
   * Validate environment configuration
   */
  validateEnvironment(): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    try {
      // Check API base URL
      const apiUrl = Environment.getApiBaseUrl();
      if (!apiUrl) {
        issues.push('VITE_API_BASE_URL is not set');
      } else if (!apiUrl.startsWith('http')) {
        issues.push('VITE_API_BASE_URL must start with http:// or https://');
      }

      // Check Firebase configuration
      try {
        const firebaseConfig = {
          apiKey: Environment.getFirebaseApiKey(),
          authDomain: Environment.getFirebaseAuthDomain(),
          projectId: Environment.getFirebaseProjectId(),
          storageBucket: Environment.getFirebaseStorageBucket(),
          messagingSenderId: Environment.getFirebaseMessagingSenderId(),
          appId: Environment.getFirebaseAppId()
        };

        Object.entries(firebaseConfig).forEach(([key, value]) => {
          if (!value) {
            issues.push(`Firebase ${key} is not set`);
          }
        });
      } catch (error) {
        issues.push(`Firebase configuration error: ${error}`);
      }

    } catch (error) {
      issues.push(`Environment validation error: ${error}`);
    }

    const valid = issues.length === 0;
    
    if (this.debugMode) {
      this.log('ENV', `Environment validation ${valid ? 'passed' : 'failed'}`, {
        valid,
        issues
      });
    }

    return { valid, issues };
  }

  /**
   * Simplified API connectivity test - non-interfering
   */
  async testApiConnectivity(): Promise<NetworkTest[]> {
    if (!this.debugMode) return [];

    const tests: NetworkTest[] = [];
    const baseUrl = Environment.getApiBaseUrl();

    // Only test health endpoint to avoid interfering with auth flow
    const endpoints = [
      { name: 'Health Check', path: '/v1/health' }
    ];

    for (const endpoint of endpoints) {
      const test: NetworkTest = {
        url: `${baseUrl}${endpoint.path}`,
        status: 'pending'
      };

      const startTime = Date.now();
      
      try {
        const response = await fetch(test.url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        test.duration = Date.now() - startTime;
        test.status = 'success';
        test.response = {
          status: response.status,
          statusText: response.statusText
        };

        this.log('NETWORK', `${endpoint.name} test passed`, test);
      } catch (error) {
        test.duration = Date.now() - startTime;
        test.status = 'error';
        test.error = error instanceof Error ? error.message : 'Unknown error';
        
        this.log('NETWORK', `${endpoint.name} test failed`, test);
      }

      tests.push(test);
    }

    return tests;
  }

  /**
   * Simplified Firebase status check - non-interfering
   */
  async checkFirebaseStatus(): Promise<{ available: boolean; error?: string }> {
    if (!this.debugMode) return { available: false };

    try {
      // Basic availability check without interfering with auth state
      const { isFirebaseReady } = await import('@/lib/firebaseClient');
      
      const available = isFirebaseReady();
      
      this.log('FIREBASE', 'Firebase status check', {
        ready: available
      });

      return { available };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.log('FIREBASE', 'Firebase status check failed', { error: errorMsg });
      return { available: false, error: errorMsg };
    }
  }

  /**
   * Inspect admin store state
   */
  logAdminStoreState(store: any, action?: string) {
    if (!this.debugMode) return;

    this.log('STORE', `Admin store state${action ? ` (${action})` : ''}`, {
      isAuthenticated: store.isAuthenticated,
      hasUser: !!store.user,
      loading: store.loading,
      error: store.error,
      inquiries: store.inquiries?.length || 0,
      testimonials: store.testimonials?.length || 0,
      dashboardStats: !!store.dashboardStats,
      userId: store.user?.id || 'none'
    });
  }

  /**
   * Display comprehensive debug info
   */
  async displayDebugInfo(): Promise<void> {
    if (!this.debugMode) return;

    console.group('🔍 Admin Debug Information');
    
    // Environment validation
    console.group('📋 Environment Validation');
    const envCheck = this.validateEnvironment();
    console.log('Valid:', envCheck.valid);
    if (envCheck.issues.length > 0) {
      console.log('Issues:', envCheck.issues);
    }
    console.groupEnd();

    // Firebase status
    console.group('🔥 Firebase Status');
    const firebaseStatus = await this.checkFirebaseStatus();
    console.log('Available:', firebaseStatus.available);
    if (firebaseStatus.error) {
      console.log('Error:', firebaseStatus.error);
    }
    console.groupEnd();

    // Network tests
    console.group('🌐 Network Connectivity');
    const networkTests = await this.testApiConnectivity();
    networkTests.forEach(test => {
      console.log(`${test.url}: ${test.status} (${test.duration}ms)`, test.error ? test.error : '');
    });
    console.groupEnd();

    console.groupEnd();
  }

  /**
   * Create a debug info object for error reporting
   */
  async createDebugSnapshot(): Promise<any> {
    if (!this.debugMode) return null;

    const envCheck = this.validateEnvironment();
    const firebaseStatus = await this.checkFirebaseStatus();
    const networkTests = await this.testApiConnectivity();

    return {
      timestamp: new Date().toISOString(),
      environment: {
        valid: envCheck.valid,
        issues: envCheck.issues,
        apiBaseUrl: Environment.getApiBaseUrl(),
        debugMode: this.debugMode
      },
      firebase: firebaseStatus,
      network: networkTests,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
  }

  /**
   * Track component lifecycle events
   */
  logComponentEvent(component: string, event: string, data?: any) {
    if (!this.debugMode) return;
    
    this.log('COMPONENT', `${component}: ${event}`, data);
  }

  /**
   * Log routing events
   */
  logRouteChange(from: string, to: string, state?: any) {
    if (!this.debugMode) return;
    
    this.log('ROUTER', `Route change: ${from} -> ${to}`, state);
  }
}

// Create singleton instance
const debugHelper = DebugHelper.getInstance();

// Export convenience functions
export const logAuthState = (state: Partial<AuthState>, action?: string) => 
  debugHelper.logAuthState(state, action);

export const logApiRequest = (method: string, url: string, data?: any) => 
  debugHelper.logApiRequest(method, url, data);

export const logApiResponse = (method: string, url: string, status: number, response?: any, error?: any) => 
  debugHelper.logApiResponse(method, url, status, response, error);

export const validateEnvironment = () => 
  debugHelper.validateEnvironment();

export const testApiConnectivity = () => 
  debugHelper.testApiConnectivity();

export const checkFirebaseStatus = () => 
  debugHelper.checkFirebaseStatus();

export const logAdminStoreState = (store: any, action?: string) => 
  debugHelper.logAdminStoreState(store, action);

export const displayDebugInfo = () => 
  debugHelper.displayDebugInfo();

export const createDebugSnapshot = () => 
  debugHelper.createDebugSnapshot();

export const logComponentEvent = (component: string, event: string, data?: any) => 
  debugHelper.logComponentEvent(component, event, data);

export const logRouteChange = (from: string, to: string, state?: any) => 
  debugHelper.logRouteChange(from, to, state);

export default debugHelper;