# AI Features Guide - Gentle Space Realty

## Overview

This guide provides comprehensive documentation for the AI-powered features integrated into the Gentle Space Realty platform using Thesys C1 Generative UI SDK and Anthropic Claude.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Core AI Components](#core-ai-components)
3. [AI Services](#ai-services)
4. [State Management](#state-management)
5. [Implementation Examples](#implementation-examples)
6. [Customization Guide](#customization-guide)
7. [Performance Optimization](#performance-optimization)
8. [Troubleshooting](#troubleshooting)
9. [API Reference](#api-reference)

## Getting Started

### Prerequisites

- Node.js v16 or higher
- Thesys C1 API Key ([Sign up here](https://c1.thesys.ai/))
- Anthropic API Key ([Get started here](https://console.anthropic.com/))

### Environment Setup

1. **Configure AI API Keys**:
   ```env
   VITE_THESYS_C1_API_KEY=your-thesys-c1-api-key
   VITE_ANTHROPIC_API_KEY=your-anthropic-api-key
   VITE_AI_ENABLED=true
   ```

2. **Verify Installation**:
   ```bash
   npm run validate:env
   ```

3. **Test AI Integration**:
   ```bash
   npm run test:ai
   ```

## Core AI Components

### 1. AI Property Assistant (`AIPropertyAssistant.tsx`)

**Purpose**: Conversational property search interface with natural language understanding.

**Key Features**:
- Natural language query processing
- Context-aware responses
- Property filtering and recommendations
- Conversation memory

**Usage Example**:
```typescript
import { AIPropertyAssistant } from '@/components/ai/AIPropertyAssistant';

<AIPropertyAssistant
  properties={properties}
  onPropertySelect={handlePropertySelection}
  onInquiryGenerated={handleInquiry}
  className="w-full max-w-4xl"
/>
```

**Configuration Options**:
```typescript
interface AIPropertyAssistantProps {
  properties: Property[];
  onPropertySelect?: (property: Property) => void;
  onInquiryGenerated?: (inquiry: SmartInquiry) => void;
  maxSuggestions?: number; // Default: 5
  enableVoiceInput?: boolean; // Default: false
  conversationMode?: 'guided' | 'free-form'; // Default: 'guided'
  className?: string;
}
```

### 2. Smart Inquiry Form (`SmartInquiryForm.tsx`)

**Purpose**: Context-aware form generation based on user intent and conversation history.

**Key Features**:
- Dynamic form field generation
- Smart default values
- Validation based on property requirements
- Lead scoring integration

**Usage Example**:
```typescript
import { SmartInquiryForm } from '@/components/ai/SmartInquiryForm';

<SmartInquiryForm
  property={selectedProperty}
  userContext={userContext}
  onSubmit={handleInquirySubmit}
  mode="property-specific"
/>
```

### 3. Budget Calculator (`BudgetCalculator.tsx`)

**Purpose**: AI-powered cost analysis with insights and projections.

**Key Features**:
- Comprehensive cost breakdown
- ROI projections
- Market comparison
- Scenario analysis

**Usage Example**:
```typescript
import { BudgetCalculator } from '@/components/ai/BudgetCalculator';

<BudgetCalculator
  properties={properties}
  onCalculationComplete={handleCalculation}
  className="w-full"
/>
```

### 4. Property Comparison Tool (`PropertyComparison.tsx`)

**Purpose**: AI-driven property analysis and comparison.

**Key Features**:
- Multi-criteria scoring
- Pros and cons analysis
- Market positioning
- Decision support

**Usage Example**:
```typescript
import { PropertyComparison } from '@/components/ai/PropertyComparison';

<PropertyComparison
  properties={selectedProperties}
  comparisonCriteria={criteria}
  onComparisonComplete={handleComparison}
/>
```

### 5. Personalized Recommendations (`PersonalizedRecommendations.tsx`)

**Purpose**: ML-powered property suggestions based on user behavior.

**Key Features**:
- Behavioral analysis
- Preference learning
- Confidence scoring
- Explanation generation

**Usage Example**:
```typescript
import { PersonalizedRecommendations } from '@/components/ai/PersonalizedRecommendations';

<PersonalizedRecommendations
  userId={user.id}
  properties={properties}
  maxRecommendations={6}
  onRecommendationClick={handleRecommendationClick}
/>
```

### 6. Amenity Explorer (`AmenityExplorer.tsx`)

**Purpose**: Intelligent amenity-based property discovery.

**Key Features**:
- Smart amenity matching
- Importance weighting
- Alternative suggestions
- Trend analysis

**Usage Example**:
```typescript
import { AmenityExplorer } from '@/components/ai/AmenityExplorer';

<AmenityExplorer
  properties={properties}
  onAmenityFilterChange={handleAmenityFilter}
  onPropertyMatch={handlePropertyMatch}
/>
```

### 7. Generative UI Renderer (`GenUIRenderer.tsx`)

**Purpose**: Dynamic UI generation based on AI analysis.

**Key Features**:
- Real-time UI generation
- Context-aware components
- Interactive elements
- Responsive design

**Usage Example**:
```typescript
import { GenUIRenderer } from '@/components/ai/GenUIRenderer';

<GenUIRenderer
  uiSpec={generatedUISpec}
  context={applicationContext}
  onAction={handleUIAction}
/>
```

## AI Services

### 1. Thesys C1 Service (`thesysC1Service.ts`)

**Purpose**: Integration with Thesys C1 Generative UI API.

**Key Methods**:
```typescript
// Generate UI specification
const uiSpec = await generateUI(prompt, context);

// Analyze property data
const analysis = await analyzeProperties(properties, criteria);

// Generate recommendations
const recommendations = await generateRecommendations(userContext, properties);
```

### 2. AI Analysis Service (`aiAnalysisService.ts`)

**Purpose**: Property analysis and scoring algorithms.

**Key Methods**:
```typescript
// Calculate property score
const score = await calculatePropertyScore(property, userPreferences);

// Generate property insights
const insights = await generatePropertyInsights(property, marketData);

// Analyze user behavior
const patterns = await analyzeUserBehavior(userId, interactions);
```

### 3. Recommendation Engine (`recommendationEngine.ts`)

**Purpose**: ML-based recommendation system.

**Key Methods**:
```typescript
// Get personalized recommendations
const recommendations = await getPersonalizedRecommendations(userId, properties);

// Update user preferences
await updateUserPreferences(userId, newPreferences);

// Track recommendation performance
await trackRecommendationPerformance(recommendationId, userAction);
```

## State Management

### AI Store (`aiStore.ts`)

**Purpose**: Centralized state management for AI features.

**Key State**:
```typescript
interface AIStore {
  // Conversation Management
  conversationHistory: Message[];
  activeConversationId: string | null;
  
  // User Preferences
  userPreferences: UserPreference[];
  searchContext: SearchContext | null;
  
  // AI Features State
  recommendations: Recommendation[];
  savedCalculations: Calculation[];
  comparisonResults: ComparisonResult[];
  
  // Property Analysis
  propertyScores: Record<string, number>;
  propertyAnalysis: Record<string, any>;
  
  // Caching and Performance
  cacheTimestamps: Record<string, number>;
  cacheExpirationTime: number;
}
```

**Key Actions**:
```typescript
// Conversation Management
addToHistory(message: Message): void;
clearHistory(): void;
setActiveConversation(conversationId: string): void;

// User Preferences
updateUserPreferences(preferences: Partial<UserPreference>): void;
addUserPreference(preference: UserPreference): void;

// AI Features
addRecommendation(recommendation: Recommendation): void;
addCalculation(calculation: Calculation): void;
addComparisonResult(result: ComparisonResult): void;

// Property Analysis
setPropertyScore(propertyId: string, score: number): void;
getPropertyScore(propertyId: string): number | undefined;
```

### Usage Example:
```typescript
import { useAIStore } from '@/store/aiStore';

const MyComponent = () => {
  const {
    recommendations,
    addRecommendation,
    propertyScores,
    setPropertyScore
  } = useAIStore();

  // Use AI state...
};
```

## Implementation Examples

### 1. Adding AI Features to Property Cards

```typescript
import { PropertyCard } from '@/components/PropertyCard';
import { useAIStore } from '@/store/aiStore';

const PropertiesGrid = ({ properties }) => {
  const { propertyScores, addRecommendation } = useAIStore();

  const handleAIAnalysis = async (property) => {
    // Trigger AI analysis
    const analysis = await analyzeProperty(property);
    
    // Generate recommendation
    const recommendation = await generateRecommendation(property, userContext);
    addRecommendation(recommendation);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          showAIFeatures={true}
          aiScore={propertyScores[property.id]}
          onAIAnalysis={handleAIAnalysis}
          onAddToComparison={handleAddToComparison}
        />
      ))}
    </div>
  );
};
```

### 2. Implementing Conversational Search

```typescript
import { AIPropertyAssistant } from '@/components/ai/AIPropertyAssistant';
import { useAIStore } from '@/store/aiStore';

const SearchPage = () => {
  const { addToHistory, setSearchContext } = useAIStore();

  const handlePropertySelect = (property) => {
    // Track user selection
    addToHistory({
      type: 'user',
      content: `Selected property: ${property.title}`,
      timestamp: new Date()
    });
    
    // Update search context
    setSearchContext({
      query: `Properties similar to ${property.title}`,
      filters: {
        location: property.location,
        priceRange: property.priceRange,
        size: property.size
      },
      timestamp: new Date()
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <AIPropertyAssistant
        properties={properties}
        onPropertySelect={handlePropertySelect}
        conversationMode="free-form"
        enableVoiceInput={true}
      />
    </div>
  );
};
```

### 3. Custom AI Component Integration

```typescript
import { useThesysC1 } from '@/hooks/useThesysC1';
import { GenUIRenderer } from '@/components/ai/GenUIRenderer';

const CustomAIComponent = ({ context }) => {
  const { uiSpec, loading, error, generateUI } = useThesysC1();

  const handleGenerateUI = async () => {
    await generateUI(
      'Create an interactive property comparison dashboard',
      context
    );
  };

  if (loading) return <div>Generating AI interface...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <button onClick={handleGenerateUI}>
        Generate Custom Interface
      </button>
      
      {uiSpec && (
        <GenUIRenderer
          uiSpec={uiSpec}
          context={context}
          onAction={handleUIAction}
        />
      )}
    </div>
  );
};
```

## Customization Guide

### 1. Customizing AI Prompts

**Location**: `src/services/thesysC1Service.ts`

```typescript
const CUSTOM_PROMPTS = {
  propertyAnalysis: `
    Analyze the following property for a {userType} looking for {requirements}.
    Consider factors like location, amenities, pricing, and market trends.
    Provide a detailed analysis with scoring and recommendations.
  `,
  
  budgetCalculation: `
    Calculate comprehensive budget breakdown for office space rental in Bengaluru.
    Include all costs: rent, deposit, maintenance, utilities, taxes.
    Provide ROI analysis and cost optimization suggestions.
  `
};
```

### 2. Custom UI Components

**Location**: `src/components/ai/GenUIRenderer.tsx`

```typescript
// Add custom component types
case 'custom-metric-card':
  return (
    <Card key={key} className="p-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
      <div className="text-2xl font-bold">{properties?.value}</div>
      <div className="text-sm opacity-90">{properties?.label}</div>
    </Card>
  );
```

### 3. Custom Analysis Algorithms

**Location**: `src/services/aiAnalysisService.ts`

```typescript
export const customPropertyScoring = (property: Property, userPreferences: UserPreference[]) => {
  let score = 0;
  
  // Location scoring (0-30 points)
  const locationScore = calculateLocationScore(property.location, userPreferences);
  score += Math.min(locationScore, 30);
  
  // Amenities scoring (0-25 points)
  const amenityScore = calculateAmenityScore(property.amenities, userPreferences);
  score += Math.min(amenityScore, 25);
  
  // Price scoring (0-25 points)
  const priceScore = calculatePriceScore(property.pricing, userPreferences);
  score += Math.min(priceScore, 25);
  
  // Size scoring (0-20 points)
  const sizeScore = calculateSizeScore(property.size, userPreferences);
  score += Math.min(sizeScore, 20);
  
  return Math.round(score);
};
```

### 4. Custom Recommendation Logic

**Location**: `src/services/recommendationEngine.ts`

```typescript
export const generateCustomRecommendations = async (
  userId: string,
  properties: Property[],
  weights: RecommendationWeights
) => {
  const userProfile = await getUserProfile(userId);
  const behaviorData = await getUserBehavior(userId);
  
  const recommendations = properties.map(property => {
    const score = calculateRecommendationScore(property, userProfile, weights);
    const reasoning = generateRecommendationReasoning(property, userProfile);
    
    return {
      id: generateId(),
      propertyId: property.id,
      userId,
      score,
      confidence: calculateConfidence(score, behaviorData),
      reasoning,
      createdAt: new Date()
    };
  });
  
  return recommendations
    .sort((a, b) => b.score - a.score)
    .slice(0, 10); // Top 10 recommendations
};
```

## Performance Optimization

### 1. Caching Strategy

```typescript
// AI Store caching implementation
const CACHE_EXPIRATION_TIME = 30 * 60 * 1000; // 30 minutes

const isCacheValid = (key: string): boolean => {
  const timestamp = cacheTimestamps[key];
  if (!timestamp) return false;
  
  const now = Date.now();
  return (now - timestamp) < CACHE_EXPIRATION_TIME;
};
```

### 2. Lazy Loading AI Components

```typescript
import { lazy, Suspense } from 'react';

const AIPropertyAssistant = lazy(() => import('@/components/ai/AIPropertyAssistant'));
const BudgetCalculator = lazy(() => import('@/components/ai/BudgetCalculator'));

const App = () => {
  return (
    <Suspense fallback={<div>Loading AI features...</div>}>
      <AIPropertyAssistant />
      <BudgetCalculator />
    </Suspense>
  );
};
```

### 3. API Rate Limiting

```typescript
// Implement rate limiting for AI API calls
const rateLimiter = {
  requests: new Map(),
  limit: 100, // requests per minute
  
  canMakeRequest(endpoint: string): boolean {
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    const key = `${endpoint}-${minute}`;
    
    const count = this.requests.get(key) || 0;
    if (count >= this.limit) {
      return false;
    }
    
    this.requests.set(key, count + 1);
    return true;
  }
};
```

### 4. Memory Management

```typescript
// Clean up expired cache and optimize memory usage
const optimizeMemory = () => {
  // Clear expired cache entries
  clearExpiredCache();
  
  // Limit conversation history
  if (conversationHistory.length > 100) {
    conversationHistory.splice(0, conversationHistory.length - 50);
  }
  
  // Clean up old recommendations
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  recommendations = recommendations.filter(rec => rec.createdAt > oneWeekAgo);
};
```

## Troubleshooting

### Common Issues

#### 1. AI Features Not Loading

**Symptoms**: AI components show loading state indefinitely.

**Solutions**:
- Verify API keys are set correctly in `.env`
- Check network connectivity
- Validate API quotas and billing

```bash
# Debug environment
npm run validate:env

# Test API connectivity
curl -H "Authorization: Bearer $VITE_THESYS_C1_API_KEY" https://api.thesys.ai/health
```

#### 2. Poor Recommendation Quality

**Symptoms**: Irrelevant or low-quality property recommendations.

**Solutions**:
- Check user preference data quality
- Verify recommendation weights
- Increase training data

```typescript
// Debug recommendation logic
const debugRecommendations = (userId: string, propertyId: string) => {
  const userProfile = getUserProfile(userId);
  const property = getProperty(propertyId);
  const score = calculateRecommendationScore(property, userProfile);
  
  console.log('Debug Recommendation:', {
    userId,
    propertyId,
    userProfile,
    calculatedScore: score,
    factors: getScoreFactors(property, userProfile)
  });
};
```

#### 3. High API Costs

**Symptoms**: Unexpected high API usage and costs.

**Solutions**:
- Implement request caching
- Add rate limiting
- Optimize prompt sizes

```typescript
// Monitor API usage
const monitorAPIUsage = () => {
  const usage = {
    totalRequests: getTotalRequests(),
    cacheHitRate: getCacheHitRate(),
    averageResponseTime: getAverageResponseTime(),
    costEstimate: calculateCostEstimate()
  };
  
  console.log('API Usage Report:', usage);
  return usage;
};
```

#### 4. Slow AI Response Times

**Symptoms**: AI features take too long to respond.

**Solutions**:
- Enable response caching
- Optimize prompt complexity
- Use parallel processing

```typescript
// Optimize AI requests
const optimizeAIRequests = async (requests: AIRequest[]) => {
  // Group similar requests
  const groupedRequests = groupSimilarRequests(requests);
  
  // Process in parallel
  const results = await Promise.all(
    groupedRequests.map(group => processBatchRequest(group))
  );
  
  return results.flat();
};
```

### Debug Mode

Enable debug mode for detailed logging:

```env
VITE_AI_DEBUG=true
VITE_AI_LOG_LEVEL=verbose
```

```typescript
// Debug logging utility
const debugLog = (component: string, action: string, data: any) => {
  if (process.env.VITE_AI_DEBUG === 'true') {
    console.log(`[AI Debug] ${component}:${action}`, data);
  }
};
```

## API Reference

### Thesys C1 Hook

```typescript
const useThesysC1 = () => {
  return {
    uiSpec: UISpec | null;
    loading: boolean;
    error: Error | null;
    generateUI: (prompt: string, context?: any) => Promise<void>;
    analyzeProperties: (properties: Property[]) => Promise<PropertyAnalysis[]>;
    generateRecommendations: (context: any) => Promise<Recommendation[]>;
  };
};
```

### AI Store Methods

```typescript
interface AIStore {
  // Conversation Management
  addToHistory: (message: Message) => void;
  clearHistory: () => void;
  getConversationHistory: () => Message[];
  
  // User Preferences
  updateUserPreferences: (preferences: Partial<UserPreference>) => void;
  addUserPreference: (preference: UserPreference) => void;
  removeUserPreference: (preferenceId: string) => void;
  
  // Recommendations
  addRecommendation: (recommendation: Recommendation) => void;
  clearRecommendations: () => void;
  updateRecommendation: (id: string, updates: Partial<Recommendation>) => void;
  
  // Property Analysis
  setPropertyScore: (propertyId: string, score: number) => void;
  getPropertyScore: (propertyId: string) => number | undefined;
  setPropertyAnalysis: (propertyId: string, analysis: any) => void;
  
  // Calculations
  addCalculation: (calculation: Calculation) => void;
  removeCalculation: (calculationId: string) => void;
  getCalculationHistory: () => Calculation[];
  
  // Cache Management
  isCacheValid: (key: string) => boolean;
  setCacheTimestamp: (key: string) => void;
  clearExpiredCache: () => void;
  
  // Analytics
  getRecommendationAccuracy: () => number;
  getUserEngagementMetrics: () => EngagementMetrics;
  
  // Data Management
  exportUserData: () => string;
  importUserData: (data: string) => boolean;
  resetAIState: () => void;
}
```

### Type Definitions

```typescript
// Core Types
interface Property {
  id: string;
  title: string;
  description: string;
  location: string;
  pricing: PropertyPricing;
  amenities: string[];
  size: PropertySize;
  coordinates?: Coordinates;
}

interface UserPreference {
  id: string;
  type: string;
  category?: string;
  value: string;
  weight: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Recommendation {
  id: string;
  propertyId: string;
  userId: string;
  score: number;
  confidence: number;
  reasoning: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Calculation {
  id: string;
  type: 'budget' | 'roi' | 'comparison';
  parameters: Record<string, any>;
  results: CalculationResult;
  timestamp: Date;
}

interface UISpec {
  title?: string;
  description?: string;
  components: UIComponent[];
  actions?: UIAction[];
}

interface UIComponent {
  id?: string;
  type: string;
  properties?: Record<string, any>;
  children?: UIComponent[];
}
```

---

## Support and Resources

### Getting Help

- **Documentation**: [Main README](../README.md)
- **GitHub Issues**: [Report bugs and feature requests](https://github.com/your-repo/issues)
- **Thesys C1 Docs**: [Official API documentation](https://docs.thesys.ai/c1)
- **Anthropic Docs**: [Claude API documentation](https://docs.anthropic.com/)

### Contributing

1. Follow the existing code patterns
2. Add comprehensive tests for new AI features
3. Update documentation for API changes
4. Consider performance implications

### Best Practices

1. **Security**: Never expose API keys in client-side code
2. **Performance**: Implement caching and rate limiting
3. **User Experience**: Provide loading states and error handling
4. **Privacy**: Respect user data and implement proper consent
5. **Testing**: Test AI features with various edge cases

---

*Last updated: January 2025*
*Version: 1.0.0*