/**
 * Sentry Instrumentation Examples
 * Demonstrates how to add custom tracing to React components
 */

import React, { useEffect } from 'react';
import * as Sentry from '@sentry/react';
import { trackTransaction, addBreadcrumb, captureMetric } from '../utils/sentry';

// Higher-order component for automatic error boundary
export const withSentryBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  options?: { fallback?: React.ComponentType; showDialog?: boolean }
) => {
  return Sentry.withErrorBoundary(Component, {
    fallback: options?.fallback || DefaultErrorFallback,
    showDialog: options?.showDialog || false,
  });
};

// Default error fallback component
const DefaultErrorFallback = ({ error }: { error: Error }) => (
  <div className="p-4 bg-red-50 border border-red-200 rounded-md">
    <h3 className="text-red-800 font-semibold">Something went wrong</h3>
    <p className="text-red-600 text-sm mt-1">{error.message}</p>
    <button 
      onClick={() => window.location.reload()}
      className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
    >
      Reload Page
    </button>
  </div>
);

// Hook for tracking component lifecycle
export const useSentryTracing = (componentName: string) => {
  useEffect(() => {
    // Add breadcrumb for component mount
    addBreadcrumb(`${componentName} mounted`, 'navigation');
    
    // Track component render time
    const startTime = performance.now();
    
    return () => {
      const renderTime = performance.now() - startTime;
      captureMetric(`component.${componentName.toLowerCase()}.render_time`, renderTime, 'millisecond');
      addBreadcrumb(`${componentName} unmounted`, 'navigation');
    };
  }, [componentName]);
};

// Hook for tracking user interactions
export const useSentryInteraction = () => {
  const trackClick = (element: string, action: string = 'click') => {
    addBreadcrumb(`User ${action}: ${element}`, 'user', 'info');
    captureMetric(`user.interaction.${action}`, 1);
  };

  const trackFormSubmit = (formName: string, success: boolean) => {
    addBreadcrumb(
      `Form ${formName} ${success ? 'submitted successfully' : 'failed'}`, 
      'user', 
      success ? 'info' : 'error'
    );
    captureMetric(`form.${formName}.${success ? 'success' : 'error'}`, 1);
  };

  const trackPageView = (pageName: string) => {
    addBreadcrumb(`Page view: ${pageName}`, 'navigation');
    captureMetric('page.view', 1);
    
    // Set custom context for this page
    Sentry.setContext('page', {
      name: pageName,
      timestamp: new Date().toISOString(),
      url: window.location.href
    });
  };

  return { trackClick, trackFormSubmit, trackPageView };
};

// Component for testing Sentry integration
export const SentryTestComponent: React.FC = withSentryBoundary(() => {
  const { trackClick } = useSentryInteraction();
  useSentryTracing('SentryTestComponent');

  const triggerError = () => {
    throw new Error('Test error from SentryTestComponent');
  };

  const triggerTransaction = async () => {
    trackTransaction('test-user-action', async () => {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      trackClick('test-button', 'custom-action');
      
      // Simulate some processing
      for (let i = 0; i < 1000; i++) {
        Math.sqrt(i);
      }
    });
  };

  return (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
      <h3 className="text-blue-800 font-semibold mb-2">Sentry Test Panel</h3>
      <p className="text-blue-600 text-sm mb-4">
        Use these buttons to test Sentry integration:
      </p>
      
      <div className="space-x-2">
        <button
          onClick={() => trackClick('breadcrumb-test')}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          Add Breadcrumb
        </button>
        
        <button
          onClick={triggerTransaction}
          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
        >
          Track Transaction
        </button>
        
        <button
          onClick={triggerError}
          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
        >
          Trigger Error
        </button>
      </div>
      
      <div className="mt-3 text-xs text-blue-500">
        Check your Sentry dashboard to see the results!
      </div>
    </div>
  );
});

// Example of instrumenting a property card component
export const InstrumentedPropertyCard: React.FC<{ property: any }> = withSentryBoundary(({ property }) => {
  const { trackClick, trackPageView } = useSentryInteraction();
  useSentryTracing('PropertyCard');

  const handleViewDetails = () => {
    trackClick(`property-${property.id}`, 'view_details');
    // Navigation logic here
  };

  const handleContactInquiry = () => {
    trackClick(`property-${property.id}`, 'contact_inquiry');
    // Contact form logic here
  };

  useEffect(() => {
    // Track property card impressions
    captureMetric('property.card.impression', 1);
    
    // Set property context
    Sentry.setContext('property', {
      id: property.id,
      type: property.type,
      price: property.price
    });
  }, [property]);

  return (
    <div className="property-card">
      {/* Property card content */}
      <button onClick={handleViewDetails}>View Details</button>
      <button onClick={handleContactInquiry}>Contact</button>
    </div>
  );
});

export default { withSentryBoundary, useSentryTracing, useSentryInteraction, SentryTestComponent };