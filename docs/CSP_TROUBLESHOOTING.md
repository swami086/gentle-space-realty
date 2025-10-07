# CSP Troubleshooting Guide

This guide helps diagnose and resolve Content Security Policy (CSP) violations that may block Supabase API calls and other external resources.

## Overview

Content Security Policy (CSP) is a security standard that helps prevent cross-site scripting (XSS) attacks by controlling which resources can be loaded by your web application. However, overly restrictive policies can block legitimate requests to services like Supabase.

## Quick Diagnosis

### 1. Check Browser Console

Look for CSP violation messages in the browser console:
```
Refused to connect to 'https://your-project.supabase.co' because it violates the following Content Security Policy directive: "connect-src 'self'"
```

### 2. Check Network Tab

In browser DevTools Network tab, look for:
- Failed requests to Supabase endpoints
- Status codes like `0` (blocked) or `ERR_BLOCKED_BY_CLIENT`
- Red entries in the network list

### 3. Review Current CSP Policy

Check the CSP meta tag in your HTML head:
```html
<meta http-equiv="Content-Security-Policy" content="...">
```

## Common CSP Issues and Solutions

### Issue 1: Supabase API Calls Blocked

**Symptoms:**
- Properties fail to load
- Database operations return network errors
- Console shows CSP violations for `*.supabase.co`

**Solution:**
Ensure your CSP policy includes Supabase domains in `connect-src`:
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  connect-src 'self' https://*.supabase.co wss://*.supabase.co;
  ...
">
```

### Issue 2: Google Maps Integration Blocked

**Symptoms:**
- Maps fail to load
- Location services don't work
- Console shows violations for `maps.googleapis.com`

**Solution:**
Add Google Maps domains to appropriate directives:
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  connect-src 'self' https://maps.googleapis.com https://maps.gstatic.com;
  script-src 'self' https://maps.googleapis.com https://maps.gstatic.com;
  img-src 'self' data: https://maps.googleapis.com https://maps.gstatic.com;
  ...
">
```

### Issue 3: Development Server Resources Blocked

**Symptoms:**
- Hot reload doesn't work
- Development tools fail to connect
- Vite HMR warnings in console

**Solution:**
Add development server allowances (automatically handled in our implementation):
```html
<!-- Development only -->
connect-src 'self' http://localhost:* ws://localhost:* wss://localhost:*;
script-src 'self' 'unsafe-eval' http://localhost:*;
```

## Environment-Specific Configuration

### Development Environment

```typescript
// src/lib/cspConfig.ts - Development CSP
const developmentCSP: CSPConfig = {
  'default-src': ["'self'"],
  'connect-src': [
    "'self'",
    'https://*.supabase.co',
    'wss://*.supabase.co',
    'http://localhost:*',
    'ws://localhost:*',
    'wss://localhost:*'
  ],
  'script-src': [
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'", // Required for Vite HMR
    'http://localhost:*'
  ]
};
```

### Production Environment

```typescript
// src/lib/cspConfig.ts - Production CSP
const productionCSP: CSPConfig = {
  'default-src': ["'self'"],
  'connect-src': [
    "'self'",
    'https://*.supabase.co',
    'wss://*.supabase.co'
  ],
  'script-src': [
    "'self'",
    "'unsafe-inline'" // Only for inline styles, avoid for scripts
  ]
};
```

## Debugging Tools

### 1. CSP Violation Reporting

Our implementation includes automatic violation reporting in development:

```javascript
// Automatically logs CSP violations to console
document.addEventListener('securitypolicyviolation', function(event) {
  console.group('🛡️ CSP Violation Detected');
  console.error('Violated Directive:', event.violatedDirective);
  console.error('Blocked URI:', event.blockedURI);
  console.groupEnd();
});
```

### 2. Network Error Classification

Use our network utilities to classify errors:

```typescript
import { classifyError, isCSPError } from '@/utils/networkUtils';

try {
  await supabaseCall();
} catch (error) {
  const networkError = classifyError(error);
  if (networkError.type === 'csp') {
    console.error('CSP blocking request:', networkError.userMessage);
  }
}
```

### 3. CSP Policy Validation

Test your CSP policy with online validators:
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [CSP Validator](https://cspvalidator.org/)

## Browser-Specific Issues

### Chrome/Chromium

**Issue:** Extensions blocking requests
**Solution:** Test in incognito mode or disable extensions

**Issue:** Corporate policies
**Solution:** Contact IT department about allowlisting domains

### Firefox

**Issue:** Enhanced Tracking Protection
**Solution:** Add site to exceptions or use custom CSP

### Safari

**Issue:** Intelligent Tracking Prevention
**Solution:** Use first-party domains when possible

## Testing CSP Policies

### 1. Report-Only Mode

Test policies without blocking resources:

```html
<meta http-equiv="Content-Security-Policy-Report-Only" content="...">
```

### 2. Gradual Tightening

Start with permissive policies and gradually tighten:

1. Start with `'unsafe-inline'` and `'unsafe-eval'`
2. Remove unsafe directives one by one
3. Add specific domain allowlists
4. Test thoroughly in all environments

### 3. Automated Testing

Use our network status hook for automated testing:

```typescript
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

const { status, testConnection } = useNetworkStatus({
  testUrls: ['https://your-project.supabase.co'],
  onCSPViolation: (error) => {
    console.error('CSP test failed:', error);
  }
});
```

## Production Deployment Checklist

- [ ] CSP policy includes all required Supabase domains
- [ ] Google Maps domains added if using location features
- [ ] No `'unsafe-eval'` in production (development only)
- [ ] Test in multiple browsers
- [ ] Test with browser extensions enabled/disabled
- [ ] Verify mobile browser compatibility
- [ ] Check corporate network compatibility
- [ ] Monitor CSP violation reports after deployment

## Common Error Messages

### "Refused to connect"
**Cause:** Domain not in `connect-src`
**Fix:** Add domain to `connect-src` directive

### "Refused to load script"
**Cause:** Script domain not in `script-src`
**Fix:** Add domain to `script-src` directive

### "Refused to load image"
**Cause:** Image domain not in `img-src`
**Fix:** Add domain to `img-src` directive

### "Refused to execute inline script"
**Cause:** `'unsafe-inline'` not in `script-src`
**Fix:** Add `'unsafe-inline'` or use nonces

## Getting Help

### Development Team

1. Check browser console for specific violation messages
2. Use our debugging utilities in `@/utils/networkUtils`
3. Test with different browsers and network conditions
4. Review this troubleshooting guide

### Production Issues

1. Collect CSP violation reports from monitoring
2. Test with the same browser/network configuration
3. Use browser incognito mode to isolate extension issues
4. Contact support with specific error messages and browser details

## Related Files

- `src/lib/cspConfig.ts` - CSP configuration management
- `src/utils/networkUtils.ts` - Network error handling and CSP detection
- `src/hooks/useNetworkStatus.ts` - Network status monitoring
- `src/components/ErrorBoundary.tsx` - CSP error display and handling
- `index.html` - CSP meta tags and violation reporting
- `vite.config.ts` - Development server CSP configuration

## External Resources

- [MDN CSP Guide](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Google CSP Guide](https://developers.google.com/web/fundamentals/security/csp)
- [Supabase CORS Documentation](https://supabase.com/docs/guides/api/cors)
- [CSP Generator Tool](https://report-uri.com/home/generate)