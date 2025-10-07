/**
 * Dynatrace Client-Side Tracing for Gentle Space Realty
 * Tracks user interactions, page loads, and frontend performance
 */

interface DynatraceConfig {
  enabled: boolean;
  applicationId: string;
  environmentUrl: string;
}

interface UserAction {
  name: string;
  type: 'click' | 'view' | 'form' | 'navigation' | 'search' | 'custom';
  properties?: Record<string, string | number>;
}

interface PageLoadMetrics {
  url: string;
  loadTime: number;
  domContentLoaded: number;
  resourcesLoaded: number;
}

class DynatraceClient {
  private config: DynatraceConfig;
  private sessionId: string;
  private userId?: string;

  constructor() {
    this.config = {
      enabled: import.meta.env.VITE_DYNATRACE_ENABLED === 'true',
      applicationId: import.meta.env.VITE_DYNATRACE_APPLICATION_ID || 'gentle-space-realty-localhost',
      environmentUrl: import.meta.env.VITE_DYNATRACE_ENVIRONMENT_URL || 'https://qcu28457.apps.dynatrace.com'
    };

    this.sessionId = this.generateSessionId();
    
    if (this.config.enabled) {
      this.initializeTracking();
    }
  }

  private generateSessionId(): string {
    return `gs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeTracking(): void {
    console.log('🎯 Initializing Dynatrace client-side tracking for Gentle Space Realty');
    
    // Track page load performance
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        this.trackPageLoad();
      });

      // Track unhandled errors
      window.addEventListener('error', (event) => {
        this.trackError({
          message: event.error?.message || 'Unknown error',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error?.stack
        });
      });

      // Track unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        this.trackError({
          message: event.reason?.message || 'Unhandled promise rejection',
          type: 'promise_rejection',
          reason: event.reason
        });
      });
    }
  }

  /**
   * Track user actions (clicks, form submissions, etc.)
   */
  trackUserAction(action: UserAction): void {
    if (!this.config.enabled) return;

    const actionData = {
      sessionId: this.sessionId,
      userId: this.userId,
      application: this.config.applicationId,
      timestamp: new Date().toISOString(),
      action: {
        name: action.name,
        type: action.type,
        properties: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          screenResolution: `${screen.width}x${screen.height}`,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          ...action.properties
        }
      }
    };

    this.sendToCollector('user_action', actionData);
    console.log('📊 Tracked user action:', action.name);
  }

  /**
   * Track property-specific interactions
   */
  trackPropertyInteraction(action: string, propertyId?: string, propertyType?: string): void {
    this.trackUserAction({
      name: `property_${action}`,
      type: 'click',
      properties: {
        property_id: propertyId || '',
        property_type: propertyType || '',
        page: 'properties'
      }
    });
  }

  /**
   * Track inquiry form interactions
   */
  trackInquiryInteraction(action: string, inquiryType?: string, propertyId?: string): void {
    this.trackUserAction({
      name: `inquiry_${action}`,
      type: action === 'submit' ? 'form' : 'click',
      properties: {
        inquiry_type: inquiryType || 'general',
        property_id: propertyId || '',
        page: 'contact'
      }
    });
  }

  /**
   * Track search interactions
   */
  trackSearch(searchTerm: string, filters: Record<string, any> = {}, resultsCount?: number): void {
    this.trackUserAction({
      name: 'property_search',
      type: 'search',
      properties: {
        search_term: searchTerm,
        filters_applied: Object.keys(filters).length > 0 ? 'yes' : 'no',
        filter_count: Object.keys(filters).length.toString(),
        results_count: resultsCount?.toString() || '0',
        ...filters
      }
    });
  }

  /**
   * Track navigation events
   */
  trackNavigation(fromPage: string, toPage: string): void {
    this.trackUserAction({
      name: 'page_navigation',
      type: 'navigation',
      properties: {
        from_page: fromPage,
        to_page: toPage,
        navigation_type: 'internal'
      }
    });
  }

  /**
   * Track page load performance
   */
  trackPageLoad(): void {
    if (!this.config.enabled || typeof window === 'undefined') return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    
    if (navigation) {
      const metrics: PageLoadMetrics = {
        url: window.location.href,
        loadTime: navigation.loadEventEnd - navigation.navigationStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        resourcesLoaded: performance.getEntriesByType('resource').length
      };

      const performanceData = {
        sessionId: this.sessionId,
        userId: this.userId,
        application: this.config.applicationId,
        timestamp: new Date().toISOString(),
        performance: {
          ...metrics,
          connection: (navigator as any)?.connection?.effectiveType || 'unknown',
          deviceMemory: (navigator as any)?.deviceMemory || 'unknown'
        }
      };

      this.sendToCollector('page_performance', performanceData);
      console.log('⚡ Tracked page load performance:', Math.round(metrics.loadTime), 'ms');
    }
  }

  /**
   * Track API call performance
   */
  trackApiCall(endpoint: string, method: string, duration: number, status: number, error?: string): void {
    if (!this.config.enabled) return;

    const apiData = {
      sessionId: this.sessionId,
      userId: this.userId,
      application: this.config.applicationId,
      timestamp: new Date().toISOString(),
      api: {
        endpoint,
        method,
        duration,
        status,
        error: error || null,
        success: status >= 200 && status < 300,
        performance: duration < 500 ? 'fast' : duration < 1000 ? 'medium' : 'slow'
      }
    };

    this.sendToCollector('api_call', apiData);
    console.log(`🔌 Tracked API call: ${method} ${endpoint} - ${status} (${duration}ms)`);
  }

  /**
   * Track errors
   */
  trackError(error: any): void {
    if (!this.config.enabled) return;

    const errorData = {
      sessionId: this.sessionId,
      userId: this.userId,
      application: this.config.applicationId,
      timestamp: new Date().toISOString(),
      error: {
        message: error.message || 'Unknown error',
        type: error.type || 'javascript',
        filename: error.filename || window.location.href,
        lineno: error.lineno || 0,
        colno: error.colno || 0,
        stack: error.stack || '',
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    };

    this.sendToCollector('error', errorData);
    console.error('❌ Tracked error:', error.message);
  }

  /**
   * Set user identifier for tracking
   */
  setUserId(userId: string): void {
    this.userId = userId;
  }

  /**
   * Track business conversions
   */
  trackConversion(type: 'inquiry_submitted' | 'property_viewed' | 'contact_initiated', value?: number): void {
    this.trackUserAction({
      name: `conversion_${type}`,
      type: 'custom',
      properties: {
        conversion_type: type,
        conversion_value: value?.toString() || '0',
        page: window.location.pathname
      }
    });
  }

  /**
   * Send data to collector (in real implementation, this would send to Dynatrace)
   */
  private sendToCollector(eventType: string, data: any): void {
    // In development, log to console
    if (import.meta.env.DEV) {
      console.log(`[Dynatrace ${eventType}]`, data);
    }

    // In production, you would send to Dynatrace beacon endpoint
    // fetch(`${this.config.environmentUrl}/api/beacon`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data)
    // }).catch(err => console.warn('Failed to send to Dynatrace:', err));

    // For now, store in localStorage for debugging
    try {
      const existingData = JSON.parse(localStorage.getItem('dynatrace_events') || '[]');
      existingData.push({ eventType, ...data });
      
      // Keep only last 100 events
      if (existingData.length > 100) {
        existingData.splice(0, existingData.length - 100);
      }
      
      localStorage.setItem('dynatrace_events', JSON.stringify(existingData));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  /**
   * Get session info for debugging
   */
  getSessionInfo(): { sessionId: string; userId?: string; config: DynatraceConfig } {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      config: this.config
    };
  }

  /**
   * Get collected events (for debugging)
   */
  getCollectedEvents(): any[] {
    try {
      return JSON.parse(localStorage.getItem('dynatrace_events') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Clear collected events
   */
  clearCollectedEvents(): void {
    localStorage.removeItem('dynatrace_events');
  }
}

// Create singleton instance
const dynatraceClient = new DynatraceClient();

export default dynatraceClient;
export type { UserAction, PageLoadMetrics };