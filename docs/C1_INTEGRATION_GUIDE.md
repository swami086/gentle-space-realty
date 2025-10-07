# C1 Integration Guide

This document provides comprehensive information about the Thesys C1 API integration in the Gentle Space Realty application.

## Overview

The C1 integration enables AI-powered UI generation for property search, inquiry forms, property comparisons, and other real estate-specific use cases. The integration follows a secure backend proxy pattern to protect API keys and ensure proper request handling.

## Architecture

### Security Model
- **Frontend**: No API keys exposed, calls backend endpoints
- **Backend**: Secure API key storage, acts as proxy to C1 API
- **Environment**: Separate configuration for development/production

### Request Flow
```
Frontend → Backend API → C1 API → Backend Processing → Frontend Response
```

## API Endpoints

### Backend Endpoints

#### POST `/api/c1/generate`
Generate UI components using C1 API.

**Request Body:**
```json
{
  "prompt": "string (required, 1-10000 chars)",
  "context": "object (optional)",
  "model": "string (optional)",
  "stream": "boolean (optional, default: false)",
  "systemPrompt": "string (optional)",
  "useCase": "string (optional)"
}
```

**Response:**
```json
{
  "uiSpec": {
    "type": "component",
    "components": [...]
  },
  "metadata": {
    "model": "string",
    "tokensUsed": "number",
    "latency": "number"
  },
  "openaiResponse": {
    "id": "string",
    "created": "number",
    "usage": {...}
  }
}
```

#### GET `/api/c1/health`
Health check for C1 API integration.

**Response:**
```json
{
  "status": "healthy",
  "configured": {
    "apiKey": true,
    "endpoint": true
  },
  "endpoint": "https://api.thesyslabs.com",
  "timestamp": "2025-01-22T..."
}
```

## Environment Configuration

### Backend (.env)
```bash
# Thesys C1 API Configuration (Backend Only)
THESYS_C1_API_KEY=sk-th-xxx...
THESYS_C1_ENDPOINT=https://api.thesyslabs.com
ANTHROPIC_MODEL=c1/anthropic/claude-sonnet-4/v-20250815

# Fallback Anthropic API
ANTHROPIC_API_KEY=sk-ant-xxx...
```

### Frontend (.env)
```bash
# Backend API URL
VITE_API_BASE_URL=http://localhost:3001/api

# C1 API keys REMOVED for security (now handled by backend)
```

## Use Cases

The integration supports multiple specialized use cases:

### 1. Property Search UI Generation
**Use Case:** `propertySearch`
- Generates dynamic search result interfaces
- Highlights matching property features
- Includes filtering and sorting options
- Shows map views for location-specific queries

### 2. Inquiry Form Generation
**Use Case:** `inquiryForm`
- Creates contextual inquiry forms
- Adapts fields based on property type
- Pre-fills information from conversation context
- Includes validation rules and helpful suggestions

### 3. Property Comparison UI
**Use Case:** `propertyComparison`
- Generates side-by-side comparison interfaces
- Provides AI insights on pros/cons
- Creates visual charts for metrics
- Shows location comparisons on maps

## Frontend Service Usage

### Basic Usage
```typescript
import { thesysC1Service } from '@/services/thesysC1Service';

// Generate property search UI
const response = await thesysC1Service.generatePropertySearchUI(
  "Find office spaces in Koramangala under 2000 sq ft",
  availableProperties,
  userPreferences,
  currentFilters
);
```

### Custom UI Generation
```typescript
// Generic UI generation with custom use case
const uiSpec = await thesysC1Service.generateUI(
  "Create a property comparison table",
  { useCase: 'propertyComparison', properties: [...] },
  { model: 'c1/anthropic/claude-sonnet-4/v-20250815' }
);
```

## Error Handling

### Common Error Types

#### 1. Validation Errors (400)
```json
{
  "error": "Invalid request format",
  "details": [
    {
      "path": ["prompt"],
      "message": "String must contain at least 1 character(s)"
    }
  ]
}
```

#### 2. API Errors (500)
```json
{
  "error": "C1 API request failed",
  "details": "Rate limit exceeded"
}
```

#### 3. Configuration Errors
```json
{
  "error": "C1 API key not configured on server"
}
```

### Error Handling in Frontend
```typescript
try {
  const response = await thesysC1Service.generateUI(prompt, context);
  // Handle success
} catch (error) {
  if (error.message.includes('Backend API error: 400')) {
    // Handle validation errors
  } else if (error.message.includes('Backend API error: 500')) {
    // Handle server errors
  } else {
    // Handle network/other errors
  }
}
```

## System Prompts

The integration includes specialized system prompts for different use cases:

### Property Search
- Focuses on Bengaluru locations
- Emphasizes transparency and trust
- Includes amenity highlighting
- Provides clear CTAs for inquiries

### Inquiry Forms
- Adapts to property types (office, co-working, meeting room)
- Includes context-aware field generation
- Provides validation and suggestions
- Integrates WhatsApp contact options

### Property Comparison
- Generates comprehensive comparison tables
- Includes AI insights and recommendations
- Creates visual charts and metrics
- Shows location-based comparisons

## Caching

The service implements intelligent caching:

- **Cache Key**: Generated from prompt, context, model, and use case
- **Cache Storage**: In-memory Map for session duration
- **Cache Invalidation**: Manual via `clearCache()` method
- **Cache Stats**: Available via `getCacheStats()` method

## Security Considerations

### API Key Protection
- API keys stored only in backend environment
- No exposure to frontend code or network requests
- Separate environment files for frontend/backend

### Request Validation
- Input validation using Zod schemas
- Request size limits (10MB)
- Rate limiting (configurable)

### CORS Configuration
- Restricted origins in production
- Proper headers for cross-origin requests
- Credentials handling for authenticated requests

## Troubleshooting

### Common Issues

#### 1. "Backend API error: 404"
- Verify backend server is running
- Check API endpoint configuration
- Ensure routes are properly registered

#### 2. "C1 API key not configured"
- Verify THESYS_C1_API_KEY in backend .env
- Check environment loading in backend
- Restart backend server after config changes

#### 3. Network connectivity issues
- Verify backend URL in frontend .env
- Check CORS configuration
- Test backend health endpoint

### Debug Tools

#### Health Check
```bash
curl http://localhost:3001/api/c1/health
```

#### Test Request
```bash
curl -X POST http://localhost:3001/api/c1/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Generate a simple property card", "useCase": "propertySearch"}'
```

## Development Workflow

### 1. Backend Development
```bash
cd backend
npm install
npm run dev  # Starts backend server on port 3001
```

### 2. Frontend Development
```bash
npm run dev  # Starts frontend server on port 5174
```

### 3. Testing
```bash
# Test C1 API connectivity
node scripts/test-c1-api.js

# Test full integration
open http://localhost:5174/test-c1
```

## Production Deployment

### Environment Setup
1. Configure production API keys in backend environment
2. Update CORS origins for production domains
3. Set appropriate log levels
4. Configure rate limiting

### Health Monitoring
- Monitor `/api/c1/health` endpoint
- Track API usage and token consumption
- Set up error alerting for failed requests

## Migration Notes

### Changes from Direct API Integration

#### Before (Insecure)
```typescript
// Frontend made direct C1 API calls
const response = await fetch('https://api.thesyslabs.com/...', {
  headers: { 'Authorization': `Bearer ${VITE_API_KEY}` } // Exposed!
});
```

#### After (Secure)
```typescript
// Frontend calls backend proxy
const response = await fetch('/api/c1/generate', {
  // No API key exposure
});
```

### Breaking Changes
- Removed `VITE_THESYS_C1_API_KEY` from frontend environment
- Updated service to use backend endpoints
- Changed request/response formats for better security

### Migration Steps
1. ✅ Add OpenAI SDK to backend dependencies
2. ✅ Create backend C1 route with proper validation
3. ✅ Update backend environment with API keys (no VITE_ prefix)
4. ✅ Remove API keys from frontend environment
5. ✅ Update frontend service to use backend endpoints
6. ✅ Test full integration flow
7. 🔄 Update documentation (this file)

## Support and Resources

- **API Documentation**: [C1 API Docs](https://docs.thesyslabs.com)
- **OpenAI SDK**: [npm package](https://www.npmjs.com/package/openai)
- **Zod Validation**: [Zod documentation](https://zod.dev)

## Version History

- **v1.0**: Initial direct API integration (deprecated)
- **v2.0**: Secure backend proxy pattern (current)
- **v2.1**: Enhanced error handling and validation