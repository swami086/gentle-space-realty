/**
 * Dynatrace Real User Monitoring (RUM) Configuration
 * Optional client-side monitoring for user experience tracking
 */

interface DynatraceConfig {
  enabled: boolean;
  environmentUrl?: string;
  applicationId?: string;
  beacon?: string;
}

class DynatraceRUM {
  private config: DynatraceConfig;
  private initialized: boolean = false;

  constructor() {
    this.config = {
      enabled: import.meta.env.VITE_DYNATRACE_ENABLED === 'true',
      environmentUrl: import.meta.env.VITE_DYNATRACE_ENVIRONMENT_URL,
      applicationId: import.meta.env.VITE_DYNATRACE_APPLICATION_ID,
      beacon: import.meta.env.VITE_DYNATRACE_BEACON_URL
    };
  }

  /**
   * Initialize Dynatrace RUM
   * This would typically be done by injecting the Dynatrace script
   */
  initialize(): void {
    if (!this.config.enabled || this.initialized) {
      return;
    }

    try {
      // In a real implementation, you would inject the Dynatrace RUM script here
      // This is a placeholder for the actual RUM initialization
      console.log('Dynatrace RUM would be initialized here');
      console.log('Config:', {
        environmentUrl: this.config.environmentUrl,
        applicationId: this.config.applicationId
      });

      this.initialized = true;
    } catch (error) {
      console.warn('Failed to initialize Dynatrace RUM:', error);
    }
  }

  /**
   * Track a custom action
   * @param actionName - Name of the action
   * @param properties - Additional properties
   */
  trackAction(actionName: string, properties: Record<string, any> = {}): void {
    if (!this.config.enabled || !this.initialized) {
      return;
    }

    try {
      // In a real implementation, this would call the Dynatrace RUM API
      console.log('Dynatrace RUM: Tracking action', { actionName, properties });
      
      // Example of how this might work with actual Dynatrace RUM:
      // window.dtrum?.enterAction(actionName, undefined, undefined, properties);
    } catch (error) {
      console.warn('Failed to track Dynatrace action:', error);
    }
  }

  /**
   * Add user properties
   * @param properties - User properties
   */
  setUserProperties(properties: Record<string, any>): void {
    if (!this.config.enabled || !this.initialized) {
      return;
    }

    try {
      console.log('Dynatrace RUM: Setting user properties', properties);
      
      // Example of how this might work with actual Dynatrace RUM:
      // Object.entries(properties).forEach(([key, value]) => {
      //   window.dtrum?.setCustomProperty(key, value);
      // });
    } catch (error) {
      console.warn('Failed to set Dynatrace user properties:', error);
    }
  }

  /**
   * Report an error
   * @param error - Error object or message
   * @param context - Additional context
   */
  reportError(error: Error | string, context: Record<string, any> = {}): void {
    if (!this.config.enabled || !this.initialized) {
      return;
    }

    try {
      const errorMessage = typeof error === 'string' ? error : error.message;
      const errorStack = typeof error === 'object' && error.stack ? error.stack : undefined;
      
      console.log('Dynatrace RUM: Reporting error', { 
        message: errorMessage, 
        stack: errorStack, 
        context 
      });
      
      // Example of how this might work with actual Dynatrace RUM:
      // window.dtrum?.reportError(error, context);
    } catch (e) {
      console.warn('Failed to report error to Dynatrace:', e);
    }
  }

  /**
   * Start a load action
   * @param actionName - Name of the load action
   * @returns Action ID for ending the action later
   */
  startLoadAction(actionName: string): string | null {
    if (!this.config.enabled || !this.initialized) {
      return null;
    }

    try {
      const actionId = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      console.log('Dynatrace RUM: Starting load action', { actionName, actionId });
      
      // Example of how this might work with actual Dynatrace RUM:
      // return window.dtrum?.enterLoadAction(actionName);
      
      return actionId;
    } catch (error) {
      console.warn('Failed to start Dynatrace load action:', error);
      return null;
    }
  }

  /**
   * End a load action
   * @param actionId - Action ID returned from startLoadAction
   */
  endLoadAction(actionId: string | null): void {
    if (!this.config.enabled || !this.initialized || !actionId) {
      return;
    }

    try {
      console.log('Dynatrace RUM: Ending load action', { actionId });
      
      // Example of how this might work with actual Dynatrace RUM:
      // window.dtrum?.leaveLoadAction(actionId);
    } catch (error) {
      console.warn('Failed to end Dynatrace load action:', error);
    }
  }

  /**
   * Check if RUM is enabled and initialized
   */
  isEnabled(): boolean {
    return this.config.enabled && this.initialized;
  }
}

// Create singleton instance
const dynatraceRUM = new DynatraceRUM();

export default dynatraceRUM;