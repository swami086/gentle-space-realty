import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

export const initializeSentryServer = () => {
  const dsn = process.env.SENTRY_DSN;
  
  if (!dsn) {
    console.warn('Sentry DSN not found in environment variables');
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || 'development',
    
    // Performance Monitoring
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '1.0'),
    
    // Profiling (optional but recommended)
    profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '1.0'),
    
    integrations: [
      // Add profiling integration
      nodeProfilingIntegration(),
      
      // Automatic instrumentation for popular libraries
      Sentry.httpIntegration({ tracing: true }),
      Sentry.expressIntegration(),
      Sentry.nodeContextIntegration(),
      Sentry.localVariablesIntegration(),
    ],
    
    // Error filtering
    beforeSend(event) {
      // Filter out common development noise
      if (process.env.NODE_ENV === 'development') {
        const error = event.exception?.values?.[0];
        if (error?.value?.includes('ECONNREFUSED') || 
            error?.value?.includes('ENOTFOUND')) {
          return null; // Don't send connection errors in dev
        }
      }
      return event;
    },
    
    // Custom tags
    initialScope: {
      tags: {
        component: 'backend',
        framework: 'express',
        runtime: 'node'
      },
    },
  });
  
  console.log('✅ Sentry initialized for backend');
};

// Express middleware for automatic error capturing
export const sentryErrorHandler = Sentry.expressErrorHandler();
export const sentryRequestHandler = Sentry.expressIntegration().requestHandler;
export const sentryTracingHandler = Sentry.expressIntegration().tracingHandler;

// Helper functions for custom instrumentation
export const trackServerTransaction = (name, operation, callback) => {
  return Sentry.startSpan({ name, op: operation }, callback);
};

export const captureServerException = (error, context = {}) => {
  Sentry.withScope((scope) => {
    Object.keys(context).forEach(key => {
      scope.setContext(key, context[key]);
    });
    Sentry.captureException(error);
  });
};

export const addServerBreadcrumb = (message, category, level = 'info') => {
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    timestamp: Date.now(),
  });
};