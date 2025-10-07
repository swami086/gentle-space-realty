# Sentry Integration Guide

Complete guide for Sentry error tracking and performance monitoring in the Gentle Space Realty application.

## 🎯 Overview

Sentry is now fully integrated into both the React frontend and Express.js backend, providing:

- **Error Tracking**: Automatic error capture and reporting
- **Performance Monitoring**: Transaction tracing and performance metrics  
- **Profiling**: CPU profiling for performance optimization
- **Session Replay**: Recording user sessions for debugging
- **Custom Instrumentation**: Business-specific metrics and tracing

## 📊 Sentry Project Details

- **Organization**: `gitlab-0u`
- **Project**: `javascript-react` 
- **DSN**: `https://dda821237e5161f1a1d121c3e918f0ff@o4509792644497408.ingest.us.sentry.io/4509792706428928`
- **Dashboard**: https://gitlab-0u.sentry.io/

## 🔧 Configuration

### Environment Variables (.env.local)

```bash
# Frontend Sentry Configuration
VITE_SENTRY_DSN=https://dda821237e5161f1a1d121c3e918f0ff@o4509792644497408.ingest.us.sentry.io/4509792706428928
VITE_SENTRY_ENVIRONMENT=development
VITE_SENTRY_TRACES_SAMPLE_RATE=1.0
VITE_SENTRY_PROFILES_SAMPLE_RATE=1.0

# Backend Sentry Configuration  
SENTRY_DSN=https://dda821237e5161f1a1d121c3e918f0ff@o4509792644497408.ingest.us.sentry.io/4509792706428928
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=1.0
SENTRY_PROFILES_SAMPLE_RATE=1.0
```

### Sample Rates Explained

- **Development**: 1.0 (100%) - Capture everything for testing
- **Production**: 0.1 (10%) - Balance cost vs. coverage
- **Profiling**: 0.1 (10%) - CPU profiling sample rate

## 🎨 Frontend Integration

### Initialization (src/utils/sentry.ts)

```typescript
import { initializeSentry } from './utils/sentry';

// In App.tsx useEffect
initializeSentry();
```

### Key Features

1. **React Router Integration**: Automatic route change tracking
2. **Error Boundaries**: Automatic error capture with UI fallbacks  
3. **Session Replay**: 10% of sessions recorded, 100% on errors
4. **Performance Monitoring**: Component render times and user interactions

### Custom Components

```typescript
import { withSentryBoundary, useSentryTracing } from './components/SentryInstrumentation';

// Wrap components with error boundaries
const MyComponent = withSentryBoundary(MyComponentImpl);

// Track component lifecycle
const MyComponent = () => {
  useSentryTracing('MyComponent');
  // Component logic
};
```

## 🖥️ Backend Integration  

### Initialization (server/index.js)

```javascript
import { initializeSentryServer, sentryRequestHandler, sentryTracingHandler, sentryErrorHandler } from '../src/utils/sentry-server.js';

// Initialize early
initializeSentryServer();

// Add middleware
app.use(sentryRequestHandler);
app.use(sentryTracingHandler);
// ... other middleware

// Add error handler (last)
app.use(sentryErrorHandler);
```

### Automatic Instrumentation

- **HTTP Requests**: All Express routes automatically traced
- **Database Queries**: Automatic query performance tracking
- **External API Calls**: Outbound request monitoring
- **Error Capturing**: Unhandled exceptions and promise rejections

## 📈 Performance Monitoring

### What's Tracked Automatically

**Frontend:**
- Page load times and Core Web Vitals
- Route navigation performance
- React component render times  
- User interactions (clicks, form submissions)
- API call performance from browser

**Backend:**
- HTTP request/response cycles
- Database query performance
- External API call latencies
- Server startup and shutdown events

### Custom Metrics

```typescript
// Frontend
import { captureMetric, trackTransaction } from './utils/sentry';

captureMetric('property.search.results', results.length);

await trackTransaction('property-search', 'business_logic', async () => {
  // Business logic here
});

// Backend
import { trackServerTransaction, captureServerException } from './utils/sentry-server';

await trackServerTransaction('database-query', 'db', async () => {
  // Database operations
});
```

## 🚨 Error Handling

### Automatic Error Capture

- **Frontend**: Unhandled errors, promise rejections, React errors
- **Backend**: Express errors, unhandled exceptions, process crashes

### Manual Error Reporting

```typescript
// Frontend
import * as Sentry from '@sentry/react';

try {
  riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    contexts: { user_action: 'property_search' }
  });
}

// Backend  
import { captureServerException } from './utils/sentry-server';

captureServerException(error, {
  request: req.path,
  user: req.user?.id
});
```

## 🔍 Session Replay

Session Replay captures user interactions for debugging:

- **Sample Rate**: 10% of normal sessions
- **Error Rate**: 100% of sessions with errors  
- **Privacy**: Sensitive inputs automatically masked
- **Storage**: 90 days retention

## 📊 Dashboards and Alerts

### Key Metrics to Monitor

1. **Error Rate**: Percentage of requests with errors
2. **Response Time**: p95 response times for critical endpoints
3. **Throughput**: Requests per minute
4. **User Experience**: Core Web Vitals scores
5. **Custom Business Metrics**: Property searches, inquiries, etc.

### Recommended Alerts

- Error rate > 1% (15 minute window)
- Response time p95 > 1000ms (5 minute window)  
- Failed property searches > 10/hour
- Contact form errors > 5/hour

## 🧪 Testing Integration

### Test Script

```bash
node scripts/test-sentry-tracing.js
```

### Manual Testing

1. **Start Applications**:
   ```bash
   npm run start:server  # Backend
   npm run dev          # Frontend
   ```

2. **Generate Test Data**:
   - Navigate between pages
   - Submit contact forms
   - Search properties
   - Trigger intentional errors

3. **Verify in Dashboard**:
   - Check transaction traces
   - Confirm error reporting  
   - Review performance metrics

## 🚀 Production Deployment

### Environment Variables

Update production environment with:
- Lower sample rates (0.1 for traces, 0.1 for profiles)
- Production environment tag
- Source map upload authentication token

### Source Maps

Source maps are automatically uploaded during build:

```bash
npm run build  # Uploads source maps to Sentry
```

### Release Tracking

Each deployment creates a Sentry release:
- Commit SHA as release version
- Deploy environment tagging
- Performance comparison between releases

## 📋 Troubleshooting

### Common Issues

1. **DSN Not Found**: Check environment variables are loaded
2. **No Data in Dashboard**: Verify sample rates > 0
3. **Source Maps Missing**: Check build configuration and auth token
4. **High Bill**: Reduce sample rates in production

### Debug Mode

Enable debug logging:

```bash
# Frontend
VITE_SENTRY_DEBUG=true

# Backend  
SENTRY_DEBUG=true
```

### Health Checks

The test script verifies:
- Environment configuration
- SDK initialization  
- Transaction tracking
- Error capture
- API tracing

## 📚 Additional Resources

- [Sentry React Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Node.js Documentation](https://docs.sentry.io/platforms/node/)
- [Performance Monitoring Guide](https://docs.sentry.io/product/performance/)
- [Error Monitoring Best Practices](https://docs.sentry.io/product/issues/)

## 🎯 Next Steps

1. **Custom Dashboards**: Create business-specific dashboards
2. **Alert Rules**: Set up email/Slack notifications for critical errors
3. **User Feedback**: Integrate user feedback widget
4. **Release Health**: Track release adoption and crash rates
5. **Integration**: Connect with project management tools (Jira, GitHub)

---

✅ **Sentry Integration Status**: Fully Complete and Production Ready