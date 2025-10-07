# Frontend-API Integration Guide

This guide explains the frontend-to-API integration setup for Gentle Space Realty, including environment configuration, API client usage, and troubleshooting.

## Overview

The application uses a unified API client that automatically adapts to different environments:
- **Development**: Uses localhost (`http://localhost:8000/api`)
- **Production (Vercel)**: Uses relative paths (`/api`)

## Key Files Modified

### 1. API Client (`src/lib/api.ts`)
- **Environment-based URL configuration**: Automatically detects environment and uses appropriate base URL
- **Relative paths in production**: Uses `/api` for Vercel serverless functions
- **Development localhost**: Uses `http://localhost:8000/api` for local development

### 2. Property Store (`src/store/propertyStore.ts`)
- **API integration**: Added methods to fetch properties from API endpoints
- **Real-time filtering**: Connects search and filters to API calls
- **Error handling**: Comprehensive error states and recovery

### 3. Components Updated
- **PropertyListings**: Replaced mock data with real API calls
- **PropertySearch**: Triggers API calls when filters change
- **AdminPage**: Uses validated API authentication

### 4. Environment Configuration
- **`.env.development`**: Local development settings
- **`.env.production`**: Production/Vercel settings
- **Vite config**: Environment variable loading and API proxy

## Environment Variables

### Development (`.env.development`)
```bash
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_ENV=development
```

### Production (`.env.production`)
```bash
VITE_API_BASE_URL=/api
VITE_APP_ENV=production
```

## API Endpoints Integration

### Properties API (`/api/properties`)

The frontend now connects to the working Vercel API endpoint:

**Available endpoints:**
- `GET /api/properties` - List all properties with filtering
- `GET /api/properties?id={id}` - Get specific property
- `GET /api/properties?search={query}` - Search properties
- `GET /api/properties?category={cat}&location={loc}` - Filtered properties

**Query Parameters Supported:**
- `category` - Filter by property category
- `location` - Filter by location
- `availability` - Filter by availability (true/false)
- `search` - Search in title, description, location
- `minPrice`, `maxPrice` - Price range filtering
- `minSize`, `maxSize` - Size range filtering

### Authentication API (`/api/auth`)

Admin authentication endpoints:
- `POST /api/auth/login` - Admin login
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/me` - Get user profile

## How It Works

### 1. Environment Detection
```typescript
const getApiBaseUrl = (): string => {
  // In production (Vercel), use relative paths
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_BASE_URL || '/api';
  }
  
  // In development, use localhost
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
};
```

### 2. API Integration Flow
1. **Component Mount**: `PropertyListings` calls `fetchProperties()`
2. **API Request**: Store constructs query parameters and calls API
3. **Response Processing**: API response is processed and stored
4. **UI Update**: Components re-render with real data

### 3. Search and Filtering
1. **User Action**: Search or filter change
2. **Parameter Building**: Convert filters to API query parameters  
3. **API Call**: Fetch properties with new parameters
4. **State Update**: Update store with filtered results

## Vercel Configuration

The app works with Vercel's existing configuration in `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/properties",
      "destination": "/index.html"
    }
  ]
}
```

This ensures:
- Frontend routes like `/properties` load the React app
- API routes like `/api/properties` go to serverless functions
- No conflicts between frontend and API routes

## Testing the Integration

### 1. Verify API Endpoints
Test the API endpoints directly:

```bash
# Test properties endpoint
curl https://your-app.vercel.app/api/properties

# Test with filters
curl "https://your-app.vercel.app/api/properties?category=co-working-spaces"

# Test search
curl "https://your-app.vercel.app/api/properties?search=office"
```

### 2. Check Frontend Integration
1. **Load Properties Page**: Navigate to `/properties`
2. **Verify API Calls**: Open browser DevTools → Network tab
3. **Check Requests**: Should see requests to `/api/properties`
4. **Test Filtering**: Use search and filters, verify API calls
5. **Error Handling**: Test with network disconnected

### 3. Environment Testing
**Local Development:**
```bash
npm run dev
# Should proxy /api calls to localhost:8000
```

**Production Testing:**
```bash
npm run build
npm run preview
# Should use relative /api paths
```

## Troubleshooting

### Common Issues

#### 1. 404 on `/properties` Route
**Cause**: Frontend routing not properly configured
**Solution**: Vercel should rewrite `/properties` to `/index.html`
**Check**: `vercel.json` rewrites configuration

#### 2. API Calls Fail in Development
**Cause**: Proxy not configured or API server not running
**Solutions:**
- Check Vite proxy configuration
- Ensure development API server is running on port 8000
- Verify `VITE_API_BASE_URL` in `.env.development`

#### 3. API Calls Fail in Production
**Cause**: Incorrect base URL or CORS issues
**Solutions:**
- Check `VITE_API_BASE_URL=/api` in production
- Verify Vercel serverless functions are deployed
- Check API responses in Network tab

#### 4. Empty Properties List
**Cause**: API response format mismatch
**Debug Steps:**
1. Check browser Network tab for API response
2. Verify response format matches `PropertiesResponse` type
3. Check console for parsing errors

#### 5. Search/Filters Not Working
**Cause**: Query parameters not properly constructed
**Debug Steps:**
1. Check Network tab for API calls with filters
2. Verify query string format
3. Test API endpoint directly with query parameters

### Debug Tools

#### 1. Browser DevTools
- **Network Tab**: Monitor API calls and responses
- **Console**: Check for JavaScript errors
- **Application Tab**: Verify environment variables

#### 2. API Testing
```bash
# Test basic endpoint
curl https://your-app.vercel.app/api/properties

# Test with query parameters
curl "https://your-app.vercel.app/api/properties?category=fully-furnished-offices&location=mg-road"
```

#### 3. Environment Variables
Check that variables are properly loaded:
```typescript
console.log('Environment:', import.meta.env.VITE_APP_ENV);
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
```

## Performance Considerations

### 1. API Call Optimization
- **Debounced Search**: Search input debounced to avoid excessive API calls
- **Filter Batching**: Multiple filter changes trigger single API call
- **Caching**: Consider implementing response caching for static data

### 2. Error Recovery
- **Retry Logic**: Automatic retry for failed requests
- **Fallback**: Graceful degradation when API unavailable
- **User Feedback**: Clear error messages and recovery actions

### 3. Loading States
- **Immediate Feedback**: Show loading states for all API operations
- **Skeleton Loading**: Consider skeleton screens for better UX
- **Progressive Loading**: Load critical data first

## Migration Notes

### From Mock Data to API
1. **PropertyListings**: Removed `setTimeout` mock, added real API calls
2. **PropertyStore**: Added API integration methods
3. **Error Handling**: Added comprehensive error states
4. **Type Safety**: Created API response types for better development experience

### Backward Compatibility
- Existing component interfaces maintained
- Mock data still available for development/testing
- Gradual migration path for additional features

## Security Considerations

### 1. API Client
- **Token Management**: Automatic token refresh
- **Secure Storage**: Tokens stored in localStorage (consider httpOnly cookies for production)
- **Error Handling**: Secure error messages without sensitive data

### 2. Environment Variables
- **Development**: Safe to include in repository
- **Production**: Configure in Vercel dashboard
- **Secrets**: Never commit production secrets to repository

## Next Steps

### Potential Enhancements
1. **Caching**: Implement response caching for better performance
2. **Offline Support**: Add service worker for offline functionality  
3. **Real-time Updates**: WebSocket integration for live data
4. **Advanced Filtering**: More sophisticated filter combinations
5. **Pagination**: Server-side pagination for large datasets

### Monitoring
1. **API Metrics**: Monitor response times and error rates
2. **User Analytics**: Track search and filter usage
3. **Performance**: Monitor bundle size and loading times
4. **Error Tracking**: Implement error reporting for production issues

This integration provides a solid foundation for the frontend-API connection while maintaining flexibility for future enhancements and optimizations.