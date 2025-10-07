# C1 React SDK Implementation Guide

## Overview

The C1 React SDK enables AI-powered generative user interfaces in the Gentle Space Realty application. This guide covers proper implementation patterns, component usage, and best practices for integrating C1's generative UI capabilities.

## What is the C1 SDK?

The C1 SDK transforms natural language prompts into interactive React UI components. Instead of static responses, users get functional interfaces they can interact with - perfect for property search, data visualization, and complex workflows.

## Setup Verification

### Required Packages

Ensure these packages are installed in your project:

```json
{
  "dependencies": {
    "@thesysai/genui-sdk": "^0.6.34",
    "@crayonai/react-ui": "^0.8.32"
  }
}
```

### CSS Import

The Crayon UI styles must be imported. Add this to your `src/index.tsx` or `src/index.css`:

```typescript
// In src/index.tsx
import '@crayonai/react-ui/styles/index.css';
```

### Font Setup

The Inter font is recommended. Add this to your `src/index.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap');

body {
  font-family: 'Inter', sans-serif;
}
```

## Core Components

### 1. C1Component

The main component for rendering C1 API responses as interactive UI.

**Purpose:** Renders C1 API responses as functional React components

**Required Props:**
- `c1Response: string` - The JSON response from the C1 API

**Optional Props:**
- `isStreaming?: boolean` - Shows streaming indicators during response generation
- `updateMessage?: (message: string) => void` - Callback for real-time streaming updates
- `onAction?: (action) => void` - Handle user interactions within the generated UI

**Basic Example:**
```typescript
import { ThemeProvider, C1Component } from '@thesysai/genui-sdk';

<ThemeProvider>
  <C1Component 
    c1Response={apiResponse}
    onAction={(action, data) => {
      console.log('User clicked:', action, data);
    }}
  />
</ThemeProvider>
```

### 2. ThemeProvider

**Purpose:** Provides theme context and styling for all C1 components

**Usage:** Must wrap all `C1Component` instances

**Customization:** Can pass theme configuration for brand alignment

```typescript
<ThemeProvider theme={{ primaryColor: '#your-brand-color' }}>
  <C1Component c1Response={response} />
</ThemeProvider>
```

### 3. C1Chat

**Purpose:** Complete chat interface with built-in conversation management

**When to Use:** For conversational interfaces requiring chat history and state management

**Key Props:**
- `apiUrl: string` - Backend endpoint for C1 API calls
- `initialMessages?: Message[]` - Starting conversation context
- `onAction?: (action, data) => void` - Handle interactions from chat responses

**Example:**
```typescript
import { C1Chat } from '@thesysai/genui-sdk';

<C1Chat
  apiUrl="/api/v1/c1/generate"
  initialMessages={[
    {
      role: 'system',
      content: 'You are a property search assistant for Gentle Space Realty...'
    }
  ]}
  onAction={(action, data) => {
    if (action === 'selectProperty') {
      handlePropertySelection(data.propertyId);
    }
  }}
/>
```

## Implementation Patterns

### Pattern 1: Basic Rendering

Minimal implementation for displaying C1 responses:

```typescript
import React, { useState } from 'react';
import { ThemeProvider, C1Component } from '@thesysai/genui-sdk';

export const BasicC1Component = () => {
  const [response, setResponse] = useState('');

  const handleGenerate = async () => {
    const result = await callC1API('Generate a property search interface');
    setResponse(result);
  };

  return (
    <div>
      <button onClick={handleGenerate}>Generate UI</button>
      {response && (
        <ThemeProvider>
          <C1Component c1Response={response} />
        </ThemeProvider>
      )}
    </div>
  );
};
```

### Pattern 2: Streaming Support

Enhanced implementation with real-time streaming:

```typescript
export const StreamingC1Component = () => {
  const [response, setResponse] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);

  const handleStreamingGenerate = async () => {
    setIsStreaming(true);
    setResponse('');
    
    // Your streaming API call implementation
    await streamingAPICall({
      onChunk: (chunk) => setResponse(prev => prev + chunk),
      onComplete: () => setIsStreaming(false)
    });
  };

  return (
    <ThemeProvider>
      <C1Component 
        c1Response={response}
        isStreaming={isStreaming}
        updateMessage={(message) => setResponse(message)}
      />
    </ThemeProvider>
  );
};
```

### Pattern 3: Interactive Actions

Full implementation with user interaction handling:

```typescript
export const InteractiveC1Component = () => {
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = ({ llmFriendlyMessage, ...rest }) => {
    if (llmFriendlyMessage && !isLoading) {
      // Handle follow-up conversational queries
      generateFollowUp(llmFriendlyMessage);
    } else {
      // Handle other UI actions
      console.log('UI Action:', rest);
    }
  };

  return (
    <ThemeProvider>
      <C1Component 
        c1Response={response}
        isStreaming={isLoading}
        updateMessage={setResponse}
        onAction={handleAction}
      />
    </ThemeProvider>
  );
};
```

### Pattern 4: Conversational Interface

Complete chat-based property search:

```typescript
export const PropertySearchChat = () => {
  const initialMessages = [
    {
      role: 'system',
      content: 'You are an AI assistant for Gentle Space Realty, specializing in commercial real estate in Bangalore.'
    },
    {
      role: 'assistant',
      content: 'Welcome! I can help you find office spaces, meeting rooms, and co-working facilities. What are you looking for?'
    }
  ];

  return (
    <div style={{ height: '600px' }}>
      <C1Chat
        apiUrl="/api/v1/c1/generate"
        initialMessages={initialMessages}
        onAction={(action, data) => {
          switch (action) {
            case 'selectProperty':
              handlePropertySelection(data.propertyId);
              break;
            case 'scheduleViewing':
              handleViewingSchedule(data);
              break;
            default:
              console.log('Chat action:', action, data);
          }
        }}
      />
    </div>
  );
};
```

## Component Reference

### ✅ Correct Implementations

1. **`C1RealEstateComponent.tsx`** - Full-featured property search
   - Uses ThemeProvider + C1Component
   - Implements streaming with isStreaming and updateMessage
   - Handles conversational follow-ups via onAction
   - Perfect reference implementation

2. **`C1ChatComponent.tsx`** - Chat-based interface
   - Uses C1Chat for conversation management
   - Provides initial context and example prompts
   - Handles property-specific actions

3. **`C1ComponentTemplate.tsx`** - Basic template
   - Clean ThemeProvider + C1Component usage
   - Includes clear/reset functionality
   - Good starting point for new implementations

4. **`C1APITest.tsx`** - API testing interface
   - Renders actual UI components from API responses
   - Includes collapsible JSON view for debugging
   - Useful for development and testing

### ⚠️ Custom Implementations

**`GenUIRenderer.tsx`** - Custom renderer (NOT using SDK)
- Manual parsing of UISpec objects
- Custom styling and behavior
- **Use only for specialized cases requiring custom logic**
- For standard use cases, prefer the SDK components above

## Common Mistakes to Avoid

### 1. Missing ThemeProvider
❌ **Wrong:**
```typescript
<C1Component c1Response={response} />
```

✅ **Correct:**
```typescript
<ThemeProvider>
  <C1Component c1Response={response} />
</ThemeProvider>
```

### 2. Displaying Raw Text
❌ **Wrong:**
```typescript
<div>{c1Response}</div>
```

✅ **Correct:**
```typescript
<ThemeProvider>
  <C1Component c1Response={c1Response} />
</ThemeProvider>
```

### 3. Missing Action Handler
❌ **Wrong:**
```typescript
<C1Component c1Response={response} />
// User interactions are ignored
```

✅ **Correct:**
```typescript
<C1Component 
  c1Response={response}
  onAction={(action, data) => {
    // Handle user interactions
    console.log('Action:', action, data);
  }}
/>
```

### 4. No Streaming Support
❌ **Wrong:**
```typescript
<C1Component c1Response={response} />
// No indication during streaming
```

✅ **Correct:**
```typescript
<C1Component 
  c1Response={response}
  isStreaming={isLoading}
  updateMessage={setResponse}
/>
```

## Testing Your Implementation

### Available Test Routes

1. **`/test-c1`** - API connectivity and configuration test
   - Verifies environment variables
   - Tests basic API communication
   - Shows rendered UI components from API responses

2. **`/c1-template`** - Basic C1Component rendering test
   - Template for simple implementations
   - Tests streaming and user interactions
   - Includes clear/reset functionality

3. **`/c1-real-estate`** - Full-featured property search
   - Complete implementation example
   - Tests all SDK features
   - Real estate context integration

4. **`/c1-chat`** - Conversational interface test
   - Chat-based property search
   - Conversation history management
   - Multi-turn interactions

### Testing Checklist

- [ ] CSS imports are working (components render with proper styling)
- [ ] ThemeProvider wrapper is present
- [ ] API responses render as interactive components
- [ ] User interactions trigger onAction callbacks
- [ ] Streaming updates work during response generation
- [ ] Error states are handled gracefully

## Environment Configuration

### Required Environment Variables

```bash
# Required - API key from Thesys Console
VITE_THESYS_C1_API_KEY=your_api_key_here

# Optional - Custom endpoint
VITE_THESYS_C1_ENDPOINT=https://api.thesys.ai/v1/chat/completions

# Optional - Model selection
VITE_ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

### Getting API Keys

1. Visit [Thesys Console](https://chat.thesys.dev/console/keys)
2. Create a new API key
3. Add it to your environment variables
4. Test connectivity using `/test-c1` route

## Troubleshooting

### CSS Not Loading
- **Symptoms:** Components render without styling
- **Solution:** Check `src/index.tsx` or `src/index.css` for CSS import
- **Verify:** `@import '@crayonai/react-ui/styles/index.css';`

### Components Not Rendering
- **Symptoms:** Blank or error components
- **Solution:** Ensure ThemeProvider wrapper is present
- **Verify:** All C1Component instances are wrapped in ThemeProvider

### Streaming Not Working
- **Symptoms:** No real-time updates during generation
- **Solution:** Add isStreaming and updateMessage props
- **Verify:** `isStreaming={loading}` and `updateMessage={setResponse}`

### Actions Not Working
- **Symptoms:** User clicks don't trigger expected behavior
- **Solution:** Implement onAction callback properly
- **Verify:** Handle both llmFriendlyMessage and direct actions

### API Connection Issues
- **Symptoms:** Network errors or "API key missing" messages
- **Solution:** Check environment variable configuration
- **Verify:** VITE_THESYS_C1_API_KEY is set correctly

## Performance Optimization

### Best Practices

1. **Lazy Loading:** Use React.lazy for C1 components on secondary routes
2. **Memoization:** Wrap components in React.memo if they re-render frequently
3. **Error Boundaries:** Implement error boundaries around C1Components
4. **Loading States:** Always show loading indicators during API calls

### Example Error Boundary

```typescript
class C1ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong with the C1 component.</div>;
    }

    return this.props.children;
  }
}

// Usage
<C1ErrorBoundary>
  <ThemeProvider>
    <C1Component c1Response={response} />
  </ThemeProvider>
</C1ErrorBoundary>
```

## Advanced Usage

### Custom Themes

```typescript
const customTheme = {
  colors: {
    primary: '#your-brand-color',
    secondary: '#secondary-color',
  },
  fonts: {
    primary: 'Inter, sans-serif',
  },
};

<ThemeProvider theme={customTheme}>
  <C1Component c1Response={response} />
</ThemeProvider>
```

### Integration with State Management

```typescript
// Redux integration example
const PropertySearchContainer = () => {
  const dispatch = useDispatch();
  const { properties, loading } = useSelector(state => state.properties);

  const handlePropertyAction = (action, propertyId) => {
    switch (action) {
      case 'selectProperty':
        dispatch(selectProperty(propertyId));
        break;
      case 'favoriteProperty':
        dispatch(favoriteProperty(propertyId));
        break;
    }
  };

  return (
    <ThemeProvider>
      <C1Component 
        c1Response={response}
        onAction={(action, data) => handlePropertyAction(action, data?.propertyId)}
      />
    </ThemeProvider>
  );
};
```

## Additional Resources

- **Official Documentation:** https://docs.thesys.dev
- **API Console:** https://chat.thesys.dev/console/keys
- **Template Repository:** `template-c1-component-next/` directory
- **Example Implementation:** `C1RealEstateComponent.tsx`
- **Support:** Create issues in the project repository

## Version Compatibility

- **SDK Version:** ^0.6.34
- **React UI Version:** ^0.8.32
- **React Version:** ^18.0.0
- **TypeScript:** ^4.5.0 (recommended)

## Migration Guide

If upgrading from a custom implementation to the SDK:

1. Install required packages
2. Replace manual UI parsing with C1Component
3. Add ThemeProvider wrapper
4. Implement onAction callback for interactions
5. Add streaming support with isStreaming and updateMessage
6. Test all user interaction flows

For questions or issues, refer to the testing routes and example implementations in the codebase.