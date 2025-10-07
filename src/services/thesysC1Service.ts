import { Property } from '@/types/property';

// C1 API Request/Response types
export interface C1Request {
  prompt: string;
  context?: Record<string, any>;
  model?: string;
  stream?: boolean;
  systemPrompt?: string;
}

export interface C1Response {
  uiSpec: UISpec;
  metadata?: {
    model: string;
    tokensUsed: number;
    latency: number;
  };
}

// UI Specification types
export interface UISpec {
  type: 'component' | 'layout' | 'form' | 'table' | 'chart';
  components: UIComponent[];
  layout?: LayoutConfig;
  styling?: StyleConfig;
}

export interface UIComponent {
  id: string;
  type: ComponentType;
  props: Record<string, any>;
  children?: UIComponent[];
  events?: EventHandler[];
}

export type ComponentType = 
  | 'PropertyCard'
  | 'ComparisonTable'
  | 'InquiryForm'
  | 'Calculator'
  | 'Chart'
  | 'Grid'
  | 'List'
  | 'Button'
  | 'Input'
  | 'Select';

export interface LayoutConfig {
  columns: number;
  gap: string;
  responsive: boolean;
}

export interface StyleConfig {
  theme: string;
  colors: Record<string, string>;
  spacing: Record<string, string>;
}

export interface EventHandler {
  type: string;
  action: string;
  payload?: Record<string, any>;
}

// Use case specific types
export interface PropertySearchContext {
  query: string;
  availableProperties: Property[];
  userPreferences?: UserPreferences;
  filters?: PropertyFilters;
}

export interface InquiryFormContext {
  property?: Property;
  userIntent: string;
  previousMessages?: Message[];
}

export interface ComparisonContext {
  properties: Property[];
  criteria: string[];
  userPriorities?: string[];
}

export interface UserPreferences {
  preferredLocation?: string;
  budgetRange?: { min: number; max: number };
  spaceSize?: { min: number; max: number };
  amenities?: string[];
  workingStyle?: 'private' | 'collaborative' | 'hybrid';
}

export interface PropertyFilters {
  location?: string;
  category?: string;
  size?: { min: number; max: number };
  tags?: string[];
  availability?: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

class ThesysC1Service {
  private backendUrl: string;
  private cache: Map<string, C1Response> = new Map();

  constructor() {
    // Use backend API endpoint instead of direct C1 API calls
    this.backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    
    console.log('C1 Service initialized with backend URL:', this.backendUrl);
  }

  private getSystemPrompt(useCase: string): string {
    const baseContext = `
You are an AI assistant for Gentle Space Realty, a premium office space rental platform in Bengaluru, India.

Company Context:
- Gentle Space specializes in fully-furnished offices, co-working spaces, and meeting rooms
- Focus on Bengaluru locations (Koramangala, Indiranagar, Whitefield, HSR Layout, etc.)
- Professional, trust-building tone with emphasis on transparency
- Pricing is generally "Contact for pricing" - we don't display exact prices
- Key amenities: parking, WiFi, meeting rooms, cafeteria, 24/7 access, security

Brand Voice:
- Professional but approachable
- Helpful and informative
- Focus on understanding customer needs
- Emphasize quality and trust
`;

    const systemPrompts = {
      propertySearch: `${baseContext}

Use Case: Property Search UI Generation
Generate dynamic, responsive UI components for property search results based on user queries.

Guidelines:
1. Create property cards highlighting relevant features mentioned in the query
2. Include filtering options that match user intent
3. Generate comparison tables when multiple properties are requested
4. Show map integration for location-based queries
5. Highlight matching amenities and features
6. Include clear CTAs for inquiries and property visits

Output format: Generate React component specifications that can be rendered using our existing PropertyCard components and UI library.`,

      inquiryForm: `${baseContext}

Use Case: Contextual Inquiry Form Generation
Create adaptive inquiry forms based on property type, user intent, and conversation context.

Guidelines:
1. Generate relevant form fields based on property type (office, co-working, meeting room)
2. Pre-fill information from conversation context
3. Include validation rules appropriate for the property
4. Add helpful suggestions and next steps
5. Integrate WhatsApp contact option
6. Show estimated response time

Output format: Generate form specifications with proper validation and user experience elements.`,

      propertyComparison: `${baseContext}

Use Case: Property Comparison UI Generation
Create intelligent comparison interfaces highlighting key differences and insights.

Guidelines:
1. Generate comparison tables with relevant metrics
2. Create visual charts for size, amenities, and location scores
3. Provide AI insights on pros/cons for each property
4. Highlight best matches based on stated requirements
5. Include actionable next steps (contact, visit, etc.)
6. Show location comparison on maps

Output format: Generate comparison UI specifications with tables, charts, and insight cards.`,

      recommendations: `${baseContext}

Use Case: Personalized Property Recommendations
Generate recommendation cards with explanations based on user behavior and preferences.

Guidelines:
1. Create recommendation cards with reasoning
2. Include confidence scores and matching criteria
3. Show why each property was recommended
4. Provide quick actions (save, contact, compare)
5. Include similar property suggestions
6. Add feedback mechanisms for improvement

Output format: Generate recommendation UI with explanation cards and interactive elements.`,

      budgetCalculator: `${baseContext}

Use Case: Interactive Budget Calculator
Create financial planning tools for office space decisions.

Guidelines:
1. Generate calculator UI with relevant input parameters
2. Create cost breakdown visualizations
3. Include ROI projections and comparisons
4. Show savings suggestions and alternatives
5. Provide scenario comparison tools
6. Include export and sharing options

Output format: Generate calculator specifications with interactive inputs and chart visualizations.`,

      amenityExplorer: `${baseContext}

Use Case: Amenity Exploration and Comparison
Create interactive tools for exploring property features and nearby facilities.

Guidelines:
1. Generate amenity comparison grids
2. Show nearby facilities (restaurants, metro, parking)
3. Create interactive filtering by importance
4. Include location-based insights
5. Show property scores for different amenities
6. Integrate map views for nearby facilities

Output format: Generate amenity exploration UI with grids, maps, and filtering components.`
    };

    return systemPrompts[useCase as keyof typeof systemPrompts] || systemPrompts.propertySearch;
  }

  private async makeRequest(request: C1Request): Promise<C1Response> {
    // Create cache key
    const cacheKey = JSON.stringify({
      prompt: request.prompt,
      context: request.context,
      model: request.model,
      useCase: request.context?.useCase
    });

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    try {
      // Make request to backend API instead of direct C1 API
      const response = await fetch(`${this.backendUrl}/c1/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: request.prompt,
          context: request.context,
          model: request.model,
          stream: request.stream || false,
          systemPrompt: request.systemPrompt,
          useCase: request.context?.useCase || this.determineUseCase(request.prompt, request.context)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Backend API error: ${response.status} - ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      
      // Backend returns C1-compatible response format
      const c1Response: C1Response = {
        uiSpec: data.uiSpec || {
          type: 'component',
          components: [{
            id: 'generated-content',
            type: 'TextContent',
            props: { content: 'No content generated' },
            children: []
          }]
        },
        metadata: data.metadata || {
          model: 'unknown',
          tokensUsed: 0,
          latency: 0
        }
      };
      
      // Cache successful response
      this.cache.set(cacheKey, c1Response);
      
      return c1Response;
    } catch (error) {
      console.error('C1 Service error:', error);
      throw error;
    }
  }

  async generatePropertySearchUI(
    userQuery: string, 
    availableProperties: Property[],
    userPreferences?: UserPreferences,
    filters?: PropertyFilters
  ): Promise<C1Response> {
    const context: PropertySearchContext = {
      query: userQuery,
      availableProperties,
      userPreferences,
      filters
    };

    const prompt = `
Generate a property search results UI for the query: "${userQuery}"

Available properties: ${JSON.stringify(availableProperties.slice(0, 10))}
User preferences: ${JSON.stringify(userPreferences)}
Current filters: ${JSON.stringify(filters)}

Create a responsive search results interface that:
1. Shows relevant property cards with highlighted matching features
2. Includes dynamic filters based on the query
3. Provides sorting options
4. Shows a map view if location-specific
5. Includes clear CTAs for inquiries

Focus on properties that best match the query intent and highlight why they're relevant.
`;

    return this.makeRequest({
      prompt,
      context,
      systemPrompt: this.getSystemPrompt('propertySearch')
    });
  }

  async generateInquiryForm(
    propertyContext?: Property,
    userIntent: string = '',
    previousMessages: Message[] = []
  ): Promise<C1Response> {
    const context: InquiryFormContext = {
      property: propertyContext,
      userIntent,
      previousMessages
    };

    const prompt = `
Generate a smart inquiry form for property: ${propertyContext ? `"${propertyContext.title}"` : 'general inquiry'}

Property details: ${JSON.stringify(propertyContext)}
User intent: "${userIntent}"
Conversation history: ${JSON.stringify(previousMessages.slice(-3))}

Create a contextual form that:
1. Adapts fields based on property type and user intent
2. Pre-fills information from context
3. Includes relevant validation
4. Shows helpful suggestions
5. Provides clear next steps

Make the form feel personalized and relevant to the user's specific needs.
`;

    return this.makeRequest({
      prompt,
      context,
      systemPrompt: this.getSystemPrompt('inquiryForm')
    });
  }

  async generatePropertyComparison(
    properties: Property[],
    criteria: string[] = [],
    userPriorities?: string[]
  ): Promise<C1Response> {
    const context: ComparisonContext = {
      properties,
      criteria,
      userPriorities
    };

    const prompt = `
Generate a property comparison interface for ${properties.length} properties:
${properties.map(p => `- ${p.title} (${p.location})`).join('\n')}

Comparison criteria: ${criteria.join(', ')}
User priorities: ${userPriorities?.join(', ')}

Create a comprehensive comparison that:
1. Shows side-by-side property details
2. Highlights key differences and similarities
3. Provides AI insights on pros/cons
4. Includes visual charts for metrics
5. Shows location comparison on map
6. Recommends best fit based on priorities

Focus on helping users make informed decisions.
`;

    return this.makeRequest({
      prompt,
      context,
      systemPrompt: this.getSystemPrompt('propertyComparison')
    });
  }

  async generateRecommendations(
    userPreferences: UserPreferences,
    availableProperties: Property[],
    userBehavior?: { viewedProperties: string[]; timeSpent: Record<string, number> }
  ): Promise<C1Response> {
    const prompt = `
Generate personalized property recommendations based on:

User preferences: ${JSON.stringify(userPreferences)}
Available properties: ${JSON.stringify(availableProperties.slice(0, 20))}
User behavior: ${JSON.stringify(userBehavior)}

Create recommendation cards that:
1. Show top 3-5 most relevant properties
2. Explain why each property was recommended
3. Include confidence scores
4. Provide quick action buttons
5. Show similar alternatives
6. Include feedback options for improvement

Focus on properties that best match the user's stated and inferred preferences.
`;

    return this.makeRequest({
      prompt,
      systemPrompt: this.getSystemPrompt('recommendations')
    });
  }

  async generateBudgetCalculator(
    requirements: {
      propertyType: string;
      teamSize?: number;
      duration?: string;
      location?: string;
    }
  ): Promise<C1Response> {
    const prompt = `
Generate an interactive budget calculator for:
${JSON.stringify(requirements)}

Create a calculator that:
1. Allows input of team size, duration, location preferences
2. Shows cost breakdown with visualizations
3. Compares different property types and locations
4. Provides ROI projections
5. Suggests cost-saving alternatives
6. Includes scenario comparison
7. Allows export/sharing of calculations

Make it interactive and educational about office space costs in Bengaluru.
`;

    return this.makeRequest({
      prompt,
      systemPrompt: this.getSystemPrompt('budgetCalculator')
    });
  }

  async generateAmenityExplorer(
    amenities: string[],
    properties: Property[]
  ): Promise<C1Response> {
    const prompt = `
Generate an amenity exploration interface for:

Available amenities: ${amenities.join(', ')}
Properties: ${properties.length} properties to compare

Create an interactive amenity explorer that:
1. Shows amenity availability grid across properties
2. Allows filtering by amenity importance
3. Displays nearby facilities on map
4. Provides location-based insights
5. Shows property scores for different amenities
6. Includes interactive comparison tools

Help users understand which properties best match their amenity requirements.
`;

    return this.makeRequest({
      prompt,
      systemPrompt: this.getSystemPrompt('amenityExplorer')
    });
  }

  // Generic UI generation method (used by useThesysC1 hook)
  async generateUI(
    prompt: string,
    context?: any,
    options?: any
  ): Promise<UISpec> {
    // Determine the use case from context or prompt
    const useCase = this.determineUseCase(prompt, context);
    
    try {
      const response = await this.makeRequest({
        prompt,
        context,
        systemPrompt: this.getSystemPrompt(useCase),
        ...options
      });
      
      return response.uiSpec;
    } catch (error) {
      console.error('UI generation failed:', error);
      throw error;
    }
  }

  private determineUseCase(prompt: string, context?: any): string {
    const promptLower = prompt.toLowerCase();
    
    // Check context first for explicit use case
    if (context?.useCase) {
      return context.useCase;
    }
    
    // Analyze prompt to determine use case
    if (promptLower.includes('search') || promptLower.includes('find') || promptLower.includes('properties')) {
      return 'propertySearch';
    }
    
    if (promptLower.includes('inquiry') || promptLower.includes('form') || promptLower.includes('contact')) {
      return 'inquiryForm';
    }
    
    if (promptLower.includes('compare') || promptLower.includes('comparison') || promptLower.includes('vs')) {
      return 'propertyComparison';
    }
    
    if (promptLower.includes('recommend') || promptLower.includes('suggest')) {
      return 'recommendations';
    }
    
    if (promptLower.includes('budget') || promptLower.includes('calculator') || promptLower.includes('cost')) {
      return 'budgetCalculator';
    }
    
    if (promptLower.includes('amenity') || promptLower.includes('amenities') || promptLower.includes('facilities')) {
      return 'amenityExplorer';
    }
    
    // Default to property search
    return 'propertySearch';
  }

  // Utility methods
  clearCache(): void {
    this.cache.clear();
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const thesysC1Service = new ThesysC1Service();
export default thesysC1Service;