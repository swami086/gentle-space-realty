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
  id?: string;
  type?: 'component' | 'layout' | 'form' | 'table' | 'chart';
  title?: string;
  description?: string;
  components: UIComponent[];
  layout?: LayoutConfig;
  styling?: StyleConfig;
  actions?: UIAction[];
}

export interface UIComponent {
  id?: string;
  type: ComponentType | string;
  properties?: Record<string, any>;
  props?: Record<string, any>; // Alternative naming
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

// AI Store types
export interface AIState {
  // User preferences
  searchMode: 'traditional' | 'ai';
  conversationHistory: Message[];
  savedQueries: SavedQuery[];
  userPreferences: UserPreferences;

  // Comparison state
  comparisonProperties: Property[];
  comparisonCriteria: string[];
  savedComparisons: SavedComparison[];

  // Recommendation state
  browsingHistory: PropertyInteraction[];
  recommendationCache: RecommendationCache;
  
  // Calculator state
  savedCalculations: Calculation[];

  // AI session state
  activeConversations: Map<string, Conversation>;
  uiSpecCache: Map<string, UISpec>;
  errorStates: Map<string, AIError>;
}

export interface SavedQuery {
  id: string;
  query: string;
  timestamp: Date;
  results: Property[];
}

export interface SavedComparison {
  id: string;
  properties: Property[];
  criteria: string[];
  timestamp: Date;
  insights: string[];
}

export interface PropertyInteraction {
  propertyId: string;
  action: 'view' | 'click' | 'save' | 'contact' | 'compare';
  timestamp: Date;
  timeSpent?: number;
  context?: string;
}

export interface RecommendationCache {
  recommendations: PropertyRecommendation[];
  lastUpdated: Date;
  userFeedback: Map<string, 'like' | 'dislike'>;
}

export interface PropertyRecommendation {
  property: Property;
  score: number;
  reasoning: string[];
  confidence: number;
}

export interface Calculation {
  id: string;
  type: 'budget' | 'roi' | 'comparison';
  parameters: Record<string, any>;
  results: CalculationResult;
  timestamp: Date;
}

export interface CalculationResult {
  totalCost: number;
  breakdown: { [key: string]: number };
  projections: { [period: string]: number };
  insights: string[];
}

export interface Conversation {
  id: string;
  messages: Message[];
  context: Record<string, any>;
  lastActive: Date;
}

export interface AIError {
  code: string;
  message: string;
  timestamp: Date;
  retryCount: number;
}

// Hook return types
export interface UseThesysC1Return {
  uiSpec: UISpec | null;
  loading: boolean;
  error: string | null;
  generateUI: (prompt: string, context?: Record<string, any>) => Promise<void>;
  regenerate: () => Promise<void>;
  refine: (feedback: string) => Promise<void>;
  reset: () => void;
}

// Event types for UI interactions
export interface UIEvent {
  type: string;
  componentId: string;
  payload?: Record<string, any>;
  timestamp: Date;
}

// Feature flags and configuration
export interface AIConfig {
  enablePropertySearch: boolean;
  enableSmartInquiry: boolean;
  enableComparison: boolean;
  enableRecommendations: boolean;
  enableBudgetCalculator: boolean;
  enableAmenityExplorer: boolean;
  fallbackToStatic: boolean;
  cacheEnabled: boolean;
  maxCacheSize: number;
  requestTimeout: number;
}

// Analytics and telemetry
export interface AIAnalytics {
  featureUsage: Map<string, number>;
  userSatisfaction: Map<string, number>;
  errorRates: Map<string, number>;
  conversionRates: Map<string, number>;
  performanceMetrics: PerformanceMetrics;
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  cacheHitRate: number;
  errorRate: number;
  userEngagement: number;
}

// Missing types used by AI components

// Generation options for AI requests
export interface GenerationOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  timeout?: number;
  retryAttempts?: number;
}

// UI Action types for interactive components
export interface UIAction {
  type: string;
  label?: string;
  payload?: Record<string, any>;
  callback?: () => void;
}

// Chart data structure for visualizations
export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'progress' | 'metric';
  data: number[] | string[] | any[];
  labels?: string[];
  colors?: string[];
  title?: string;
  options?: Record<string, any>;
}

// Recommendation data structure
export interface Recommendation {
  id: string;
  propertyId: string;
  userId?: string;
  score: number;
  confidence: number;
  reasoning: string[];
  type: 'property' | 'search' | 'budget' | 'amenity';
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

// Property comparison results
export interface ComparisonResult {
  id: string;
  properties: string[]; // Property IDs
  criteria: string[];
  scores: Record<string, number>; // Property ID -> score
  insights: string[];
  winner?: string; // Property ID of best match
  createdAt: Date;
  metadata?: Record<string, any>;
}

// User preference for AI personalization
export interface UserPreference {
  id: string;
  type: 'location' | 'budget' | 'size' | 'amenity' | 'style' | 'other';
  category?: string;
  value: string | number | boolean;
  weight: number; // 0-1, importance weight
  source: 'explicit' | 'inferred' | 'behavior';
  createdAt: Date;
  updatedAt: Date;
  active: boolean;
}

// Search context for AI-powered search
export interface SearchContext {
  id: string;
  query: string;
  intent: 'browse' | 'search' | 'compare' | 'calculate' | 'inquire';
  filters: PropertyFilters;
  results?: Property[];
  userPreferences?: UserPreference[];
  timestamp: Date;
  sessionId?: string;
  previousQueries?: string[];
}

// Amenity filtering for property discovery
export interface AmenityFilter {
  id: string;
  name: string;
  category: 'workspace' | 'facility' | 'location' | 'service' | 'technology';
  importance: 'low' | 'medium' | 'high' | 'required';
  selected: boolean;
  description?: string;
  icon?: string;
}