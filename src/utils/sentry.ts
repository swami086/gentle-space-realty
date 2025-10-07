// Sentry has been removed from this project
// This file now provides no-op functions to maintain compatibility

let sentryInitialized = false;

export const initializeSentry = () => {
  // Prevent multiple initializations
  if (sentryInitialized) {
    console.warn('Sentry initialization skipped (removed from project)');
    return;
  }

  console.log('🔇 Sentry disabled - monitoring functionality removed');
  sentryInitialized = true;
};

// No-op helper functions to maintain compatibility
export const trackTransaction = (name: string, callback: () => void) => {
  if (typeof callback === 'function') {
    callback();
  }
  return null;
};

export const addBreadcrumb = (message: string, category: string, level: 'info' | 'warning' | 'error' = 'info') => {
  // No-op: Sentry removed
};

export const setUserContext = (user: { id: string; email?: string; username?: string }) => {
  // No-op: Sentry removed
};

export const captureMetric = (name: string, value: number, unit: string = 'count') => {
  // No-op: Sentry removed
};