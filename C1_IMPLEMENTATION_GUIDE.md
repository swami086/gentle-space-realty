# C1 SDK Implementation Guide

**Version:** 2.1.0  
**Last Updated:** 2025-01-22  
**Integration Pattern:** Secure Backend Proxy

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Environment Setup](#environment-setup)
4. [Backend API Endpoints](#backend-api-endpoints)
5. [Frontend Components](#frontend-components)
6. [Development Workflow](#development-workflow)
7. [Testing Guide](#testing-guide)
8. [Troubleshooting](#troubleshooting)
9. [Security Best Practices](#security-best-practices)
10. [Performance Optimization](#performance-optimization)

## Overview

This guide provides comprehensive instructions for implementing and maintaining the Thesys C1 SDK integration in the Gentle Space Realty application. The integration follows a secure backend proxy pattern to protect API keys and ensure scalable, maintainable architecture.

### Key Features
- 🔒 **Secure Backend Proxy:** API keys never exposed to frontend
- 🚀 **Dual Endpoints:** `/generate` for UI creation, `/chat` for conversations
- 🛡️ **Type Safety:** Full TypeScript support with Zod validation
- 📊 **Comprehensive Monitoring:** Health checks and error tracking
- ⚡ **Performance Optimized:** Caching and efficient request handling

## Architecture

### System Design

```
Frontend Components → Backend Proxy → Thesys C1 API
     ↓                    ↓               ↓
[C1ChatComponent]   [/api/c1/chat]   [api.thesys.dev]
[C1RealEstate]      [/api/c1/generate] [/v1/embed]
[C1APITest]         [/api/c1/health]
[CustomRenderer]
```

### Component Types

1. **C1 SDK Components** - Use official `@thesysai/genui-sdk`
   - Require `ThemeProvider` wrapper
   - Connect to backend proxy endpoints
   - Handle real-time interactions

2. **Custom Renderers** - Manual UISpec rendering
   - Independent of C1 SDK
   - Custom styling and behavior
   - Specialized use cases

## Environment Setup

### Prerequisites

- Node.js 18+ 
- TypeScript 4.5+
- Valid Thesys C1 API key
- Backend server running on port 3001

### Backend Configuration

1. **Copy environment template:**
```bash
cp backend/.env.example backend/.env
```

2. **Configure essential variables:**
```bash
# Thesys C1 API Configuration
THESYS_C1_API_KEY=sk-th-your-api-key-here
THESYS_C1_ENDPOINT=https://api.thesys.dev/v1/embed
ANTHROPIC_MODEL=c1/anthropic/claude-sonnet-4/v-20250815

# Server Configuration
NODE_ENV=development
PORT=3001
CORS_ORIGINS=http://localhost:5174,http://localhost:5173
```

3. **Install dependencies and start:**
```bash
cd backend
npm install
npm run dev
```

### Frontend Configuration

No frontend environment variables needed - all API keys are secured backend-only.

```bash
npm install
npm run dev
```

## Backend API Endpoints

### POST /api/c1/generate

**Purpose:** UI generation for property search, forms, and comparisons

**Request Schema:**
```typescript
{
  prompt: string;           // User query or requirement
  context?: Record<string, any>;  // Additional context data
  model?: string;           // Override default model
  systemPrompt?: string;    // Custom system prompt
  useCase?: string;         // 'propertySearch' | 'inquiryForm' | 'propertyComparison'
}
```

**Response:**
```typescript
{
  uiSpec: {
    type: 'component';
    components: UIComponent[];
  };
  metadata: {
    model: string;
    tokensUsed: number;
    latency: number;
  };
  openaiResponse: {
    id: string;
    created: number;
    usage: TokenUsage;
  };
}
```

**Example Usage:**
```bash
curl -X POST http://localhost:3001/api/c1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Show office spaces in Koramangala under 50k",
    "useCase": "propertySearch",
    "context": {
      "availableProperties": [...],
      "userPreferences": {...}
    }
  }'
```

### POST /api/c1/chat

**Purpose:** Conversational chat interface for C1Chat components

**Request Schema:**
```typescript
{
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  model?: string;           // Override default model  
  stream?: boolean;         // Enable streaming (default: true)
  temperature?: number;     // 0-2 (default: 0.7)
  max_tokens?: number;      // Max response tokens (default: 4000)
}
```

**Response (Non-streaming):**
```typescript
{
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: string;
  }>;
  usage: TokenUsage;
}
```

**Response (Streaming):**
```
Content-Type: text/event-stream

data: {"id": "chatcmpl-123", "choices": [{"delta": {"content": "Hello"}}]}
data: {"id": "chatcmpl-123", "choices": [{"delta": {"content": " there!"}}]}
data: [DONE]
```

### GET /api/c1/health

**Purpose:** Health check and configuration validation

**Response:**
```typescript
{
  status: 'healthy' | 'unhealthy';
  configured: {
    apiKey: boolean;
    endpoint: boolean;
  };
  endpoint: string;
  timestamp: string;
}
```

## Frontend Components

### C1ChatComponent

**Location:** `/src/components/ai/C1ChatComponent.tsx`

**Purpose:** Conversational property search interface

**Usage:**
```tsx
import { C1ChatComponent } from '@/components/ai/C1ChatComponent';

<C1ChatComponent
  initialContext={{
    properties: availableProperties,
    userPreferences: preferences
  }}
  onPropertySelect={(propertyId) => {
    // Handle property selection
  }}
/>
```

**Features:**
- Real-time conversational interface
- Property search and recommendations  
- Custom action handling
- Context-aware responses

### C1RealEstateComponent

**Location:** `/src/components/ai/C1RealEstateComponent.tsx`

**Purpose:** Property-focused UI generation

**Usage:**
```tsx
import { C1RealEstateComponent } from '@/components/ai/C1RealEstateComponent';

<C1RealEstateComponent
  prompt="Find office spaces in Koramangala"
  context={{ properties, preferences }}
  onAction={(action, data) => {
    // Handle UI actions
  }}
/>
```

### C1APITest

**Location:** `/src/components/C1APITest.tsx`

**Purpose:** API connectivity testing and debugging

**Usage:**
```tsx
import { C1APITest } from '@/components/C1APITest';

<C1APITest />
```

**Features:**
- Configuration validation
- API connectivity testing
- Response visualization
- Debug information

### Custom Components

#### AIPropertyAssistant

**Location:** `/src/components/ai/AIPropertyAssistant.tsx`

**Purpose:** Custom chat interface with property-specific features

**Key Difference:** Uses `GenUIRenderer` for custom rendering instead of C1 SDK components

#### GenUIRenderer  

**Location:** `/src/components/ai/GenUIRenderer.tsx`

**Purpose:** Custom UISpec renderer for specialized use cases

**When to Use:**
- Custom styling requirements
- Specialized UI patterns
- Fine-grained control over rendering

## Development Workflow

### 1. Component Development

**For C1 SDK Components:**
```tsx
import { C1Component, ThemeProvider } from '@thesysai/genui-sdk';

export const MyComponent = () => {
  return (
    <ThemeProvider>
      <C1Component
        apiUrl="/api/v1/c1/generate"
        // ... other props
      />
    </ThemeProvider>
  );
};
```

**For Custom Renderers:**
```tsx
import { GenUIRenderer } from '@/components/ai/GenUIRenderer';

export const MyCustomComponent = () => {
  const [uiSpec, setUiSpec] = useState(null);
  
  return (
    <GenUIRenderer
      uiSpec={uiSpec}
      onAction={(action) => {
        // Handle custom actions
      }}
    />
  );
};
```

### 2. Testing Locally

**Start Backend:**
```bash
cd backend
npm run dev
```

**Start Frontend:**
```bash
npm run dev
```

**Test API Connectivity:**
```bash
# Health check
curl http://localhost:3001/api/c1/health

# Test generation
curl -X POST http://localhost:3001/api/c1/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test prompt"}'

# Test chat
curl -X POST http://localhost:3001/api/c1/chat \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "hello"}]}'
```

### 3. Component Integration

1. **Import Required Dependencies**
2. **Add ThemeProvider Wrapper (for C1 SDK components)**
3. **Configure API Endpoints**
4. **Implement Action Handlers**
5. **Test Integration**

## Testing Guide

### Unit Testing

**Backend Route Testing:**
```typescript
describe('C1 API Routes', () => {
  test('POST /api/c1/generate should return valid UISpec', async () => {
    const response = await request(app)
      .post('/api/c1/generate')
      .send({
        prompt: 'test prompt',
        useCase: 'propertySearch'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.uiSpec).toBeDefined();
  });
});
```

**Component Testing:**
```typescript
describe('C1ChatComponent', () => {
  test('should render with ThemeProvider', () => {
    render(<C1ChatComponent />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});
```

### Integration Testing

**API Connectivity:**
```bash
# Automated health check
./scripts/test-api-health.sh

# Load testing
ab -n 100 -c 10 http://localhost:3001/api/c1/health
```

**Frontend Integration:**
```typescript
test('C1Chat should communicate with backend', async () => {
  // Mock backend response
  fetchMock.mockResponseOnce(JSON.stringify({
    id: 'test',
    choices: [{ message: { content: 'Hello!' } }]
  }));
  
  render(<C1ChatComponent />);
  
  // Simulate user input
  fireEvent.change(screen.getByRole('textbox'), {
    target: { value: 'test message' }
  });
  fireEvent.click(screen.getByText('Send'));
  
  // Verify API call
  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/c1/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'test message' }]
      })
    });
  });
});
```

## Troubleshooting

### Common Issues

#### 1. "API Key not configured"

**Symptom:** Health check returns `configured: { apiKey: false }`

**Solution:**
```bash
# Check backend environment
cat backend/.env | grep THESYS_C1_API_KEY

# Verify API key format
echo $THESYS_C1_API_KEY | cut -c1-10
# Should output: sk-th-XXXXX
```

#### 2. "ThemeProvider not found"

**Symptom:** React error about missing ThemeProvider context

**Solution:**
```tsx
// Ensure ThemeProvider wraps C1 components
import { ThemeProvider } from '@thesysai/genui-sdk';

<ThemeProvider>
  <C1Chat />
</ThemeProvider>
```

#### 3. "Network Error" / CORS Issues

**Symptom:** Frontend cannot connect to backend

**Solution:**
```bash
# Check CORS configuration
grep CORS_ORIGINS backend/.env

# Verify frontend URL is included
CORS_ORIGINS=http://localhost:5174,http://localhost:5173
```

#### 4. "Invalid endpoint" / 404 Errors

**Symptom:** API returns 404 for C1 requests

**Solution:**
```bash
# Verify endpoint configuration
grep THESYS_C1_ENDPOINT backend/.env

# Should be:
THESYS_C1_ENDPOINT=https://api.thesys.dev/v1/embed
```

#### 5. Streaming Not Working

**Symptom:** Chat messages don't appear in real-time

**Solution:**
```tsx
// Ensure streaming is enabled in chat request
const response = await fetch('/api/v1/c1/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [...],
    stream: true  // Enable streaming
  })
});
```

### Debug Mode

**Enable Debug Logging:**
```bash
# Backend debug
LOG_LEVEL=debug npm run dev

# Frontend debug  
VITE_DEBUG_C1=true npm run dev
```

**Debug API Calls:**
```bash
# Monitor backend logs
tail -f backend/logs/app.log

# Test with curl verbose
curl -v -X POST http://localhost:3001/api/c1/health
```

## Security Best Practices

### API Key Management

1. **Never expose keys to frontend**
2. **Use environment variables only**
3. **Rotate keys monthly in production**
4. **Monitor API usage for anomalies**

### Request Validation

```typescript
// Always validate requests
const validatedData = C1RequestSchema.parse(req.body);

// Sanitize user input
const sanitizedPrompt = validator.escape(prompt);

// Rate limiting
app.use('/api/c1', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
```

### Error Handling

```typescript
// Don't expose internal errors
catch (error) {
  console.error('Internal error:', error);
  
  res.status(500).json({
    error: 'Internal server error',
    // Don't include error details in production
    details: process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Please contact support'
  });
}
```

## Performance Optimization

### Caching Strategy

```typescript
// Response caching
const cache = new Map();

router.post('/generate', async (req, res) => {
  const cacheKey = JSON.stringify(req.body);
  
  if (cache.has(cacheKey)) {
    return res.json(cache.get(cacheKey));
  }
  
  const result = await generateUI(req.body);
  cache.set(cacheKey, result);
  
  res.json(result);
});
```

### Request Optimization

```typescript
// Batch similar requests
const batchRequests = (requests) => {
  return Promise.all(
    requests.map(req => c1Client.chat.completions.create(req))
  );
};

// Streaming optimization
router.post('/chat', async (req, res) => {
  if (req.body.stream) {
    // Use streaming for real-time responses
    res.setHeader('Content-Type', 'text/event-stream');
    // ... streaming implementation
  } else {
    // Use standard response for simple queries
    const response = await c1Client.chat.completions.create({
      ...req.body,
      stream: false
    });
    res.json(response);
  }
});
```

### Frontend Performance

```tsx
// Lazy load C1 components
const C1ChatComponent = lazy(() => import('@/components/ai/C1ChatComponent'));

// Memoize expensive operations
const memoizedRenderer = useMemo(() => (
  <GenUIRenderer uiSpec={uiSpec} />
), [uiSpec]);

// Debounce user input
const debouncedSendMessage = useDeBounce(sendMessage, 300);
```

### Monitoring

```typescript
// Add performance monitoring
const startTime = Date.now();
const result = await c1Client.chat.completions.create(payload);
const duration = Date.now() - startTime;

logger.info('C1 API Request', {
  duration,
  tokens: result.usage?.total_tokens,
  model: result.model
});
```

## Production Deployment

### Environment Configuration

```bash
# Production environment
NODE_ENV=production
PORT=3001

# Security settings
JWT_SECRET=your-production-jwt-secret-32-chars-min
RATE_LIMIT_ENABLED=true
RATE_LIMIT_MAX_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=900000

# Monitoring
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
```

### Health Monitoring

```typescript
// Enhanced health check
router.get('/health', async (req, res) => {
  const checks = {
    api: await testApiConnection(),
    database: await testDatabaseConnection(),
    cache: await testCacheConnection()
  };
  
  const healthy = Object.values(checks).every(check => check.healthy);
  
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString()
  });
});
```

### Scaling Considerations

1. **Load Balancing:** Use nginx or cloud load balancers
2. **Horizontal Scaling:** Deploy multiple backend instances
3. **Caching:** Implement Redis for shared cache
4. **CDN:** Use CDN for static assets
5. **Database:** Consider read replicas for high load

---

**Guide Version:** 2.1.0  
**Last Updated:** 2025-01-22  
**Next Review:** 2025-02-22

For additional support or questions, please refer to:
- [Official Thesys Documentation](https://docs.thesyslabs.com)
- [Project Issue Tracker](https://github.com/your-org/gentle-space-realty/issues)
- [Internal Wiki](https://wiki.company.com/c1-integration)