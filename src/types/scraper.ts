/**
 * Frontend Scraper Types
 * 
 * Property scraping types for the dynamic search feature.
 * 
 * How Dynamic Search Works:
 * 1. User defines search parameters (location, property type, price range, etc.)
 * 2. Frontend sends parameters to backend scraper API
 * 3. Backend builds MagicBricks search URLs using our custom URL building logic
 * 4. Backend uses Firecrawl to scrape those URLs and extract structured property data
 * 5. Extracted properties are transformed and returned for bulk import
 * 
 * Note: Firecrawl does NOT have built-in search functionality for specific sites.
 * We build the search URLs, Firecrawl scrapes them.
 */

// Mirror backend types for consistency

/**
 * Search parameters for building MagicBricks search URLs
 */
export interface SearchParameters {
  location?: string;
  propertyType?: 'office' | 'coworking' | 'retail' | 'warehouse' | 'land';
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  furnished?: 'furnished' | 'semi-furnished' | 'unfurnished';
  availability?: 'immediate' | 'within-15-days' | 'within-30-days' | 'after-30-days';
  amenities?: string[];
  sortBy?: 'relevance' | 'price-low-to-high' | 'price-high-to-low' | 'newest';
  page?: number;
}

/**
 * Configuration for Firecrawl scraping operations
 */
export interface FirecrawlScrapeConfig {
  waitFor?: number;
  timeout?: number;
  includeTags?: string[];
  excludeTags?: string[];
}

/**
 * Configuration for Firecrawl crawling operations (multiple pages)
 */
export interface FirecrawlCrawlConfig extends FirecrawlScrapeConfig {
  limit?: number;
  includePaths?: string[];
  excludePaths?: string[];
  scrapeOptions?: FirecrawlScrapeConfig;
}

/**
 * General scraper configuration
 */
export interface ScraperConfig {
  useCrawl?: boolean;
  maxPages?: number;
  firecrawlOptions?: FirecrawlScrapeConfig;
}

/**
 * Scraped property data structure
 */
export interface ScrapedPropertyData {
  // Required fields
  title: string;
  description: string;
  location: string;

  // Optional fields
  price?: {
    amount: number;
    currency: 'INR' | 'USD' | 'EUR';
    period: 'monthly' | 'yearly' | 'one-time';
  };
  size?: {
    area: number;
    unit: 'sqft' | 'seats';
  };
  amenities?: string[];
  features?: {
    furnished?: boolean;
    parking?: boolean;
    wifi?: boolean;
    ac?: boolean;
    security?: boolean;
    cafeteria?: boolean;
    elevator?: boolean;
    powerBackup?: boolean;
    conferenceRoom?: boolean;
  };
  contact?: {
    phone?: string;
    email?: string;
    contactPerson?: string;
  };
  media?: {
    images?: string[];
    videos?: string[];
  };
  availability?: {
    status: 'available' | 'occupied' | 'coming-soon';
    date?: string;
  };

  // Metadata
  sourceUrl: string;
  scrapedAt: string;
  searchParams?: SearchParameters;
  validationErrors?: string[];
  rawData?: any; // For debugging

  // C1 metadata (optional - present when processed by C1)
  c1Metadata?: {
    extractedBy: 'c1' | 'firecrawl' | 'manual';
    confidence?: number; // 0-1 scale
    extractionWarnings?: string[];
    processedAt: string; // ISO timestamp
    fieldsExtracted: string[]; // List of fields successfully extracted
    fieldsMissing: string[]; // List of fields that couldn't be extracted
  };
}

/**
 * Scrape operation result
 */
export interface ScrapeResult {
  success: boolean;
  data?: ScrapedPropertyData[] | any; // Allow raw data when in raw mode
  rawFirecrawlData?: any; // Raw Firecrawl response data
  error?: string;
  metadata: {
    url: string;
    scrapedAt: string;
    totalFound: number;
    searchParams?: SearchParameters;
    firecrawlJobId?: string;
    rawDataMode?: boolean; // Indicates raw data mode
    firecrawlFormats?: string[]; // Available formats from Firecrawl
  };
}

/**
 * Bulk import request payload
 */
export interface BulkImportRequest {
  properties: ScrapedPropertyData[];
  skipValidation?: boolean;
  overwriteExisting?: boolean;
}

/**
 * Bulk import result
 */
export interface BulkImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{
    index: number;
    error: string;
  }>;
  createdIds: string[];
}

/**
 * Search preset for saving common search configurations
 */
export interface SearchPreset {
  id: string;
  name: string;
  description?: string;
  searchParams: SearchParameters;
  createdAt: string;
  lastUsed?: string;
}

/**
 * Property extraction schema for Firecrawl JSON format
 */
export interface PropertyExtractionSchema {
  [key: string]: {
    type: string;
    description?: string;
    properties?: any;
    items?: any;
  };
}

/**
 * API request types for scraper endpoints
 */

// POST /api/v1/scraper/scrape
export interface ScrapeRequest {
  directUrl?: string;
  searchParams?: SearchParameters;
  useCrawl?: boolean;
  maxPages?: number;
  waitFor?: number;
  includeTags?: string[];
  excludeTags?: string[];
}

export interface ScrapeResponse {
  success: boolean;
  data?: ScrapedPropertyData[] | any; // Allow raw data when in raw mode
  rawFirecrawlData?: any; // Raw Firecrawl response data
  error?: string;
  metadata: ScrapeResult['metadata'];
  requestId: string;
}

// POST /api/v1/scraper/preview
export interface PreviewRequest {
  directUrl?: string;
  searchParams?: SearchParameters;
}

export interface PreviewResponse {
  success: boolean;
  data?: {
    constructedUrl?: string;
    providedUrl?: string;
    searchParams?: SearchParameters;
    estimatedResults?: string;
    previewNote: string;
  };
  error?: string;
  requestId: string;
}

// POST /api/v1/scraper/import
export interface ImportRequest extends BulkImportRequest {}

export interface ImportResponse extends BulkImportResult {
  requestId: string;
}

// GET /api/v1/scraper/history
export interface HistoryResponse {
  success: boolean;
  data: Array<{
    id: string;
    title: string;
    location: string;
    source_url: string;
    scraped_at: string;
    search_params?: SearchParameters;
    created_at: string;
    status: string;
    source: 'c1' | 'firecrawl' | 'manual'; // Added source information
    extraction_metadata?: any; // C1 metadata if available
  }>;
  filters: {
    source: string; // Current filter applied ('all', 'c1', 'firecrawl', 'manual')
    availableFilters: string[]; // Available filter options
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  aggregatedStats: {
    totalScraped: number;
    filteredBy: string; // Description of active filters
  };
}

// POST /api/v1/scraper/presets
export interface SavePresetRequest {
  name: string;
  description?: string;
  searchParams: SearchParameters;
}

export interface SavePresetResponse {
  success: boolean;
  data?: SearchPreset;
  error?: string;
}

// GET /api/v1/scraper/presets
export interface GetPresetsResponse {
  success: boolean;
  data: SearchPreset[];
  message?: string;
}

// GET /api/v1/scraper/examples
export interface GetExamplesResponse {
  success: boolean;
  data: Array<{
    name: string;
    description: string;
    searchParams: SearchParameters;
  }>;
  message: string;
}

/**
 * Form validation types
 */
export interface SearchParametersFormData {
  location: string;
  propertyType: string;
  minPrice: string;
  maxPrice: string;
  minArea: string;
  maxArea: string;
  furnished: string;
  availability: string;
  amenities: string[];
  sortBy: string;
}

export interface SearchParametersFormErrors {
  location?: string;
  propertyType?: string;
  minPrice?: string;
  maxPrice?: string;
  minArea?: string;
  maxArea?: string;
  furnished?: string;
  availability?: string;
  amenities?: string;
  sortBy?: string;
  general?: string;
}

/**
 * C1 Transform Request payload
 */
export interface C1TransformRequest {
  rawFirecrawlData: any;
  sourceUrl: string;
  searchParams?: SearchParameters;
  extractionHints?: string;
}

/**
 * C1 Transform Response
 */
export interface C1TransformResponse {
  success: boolean;
  properties: ScrapedPropertyData[];
  metadata: C1TransformMetadata;
  error?: string;
  details?: string;
}

/**
 * C1 Transform Metadata
 */
export interface C1TransformMetadata {
  propertiesExtracted: number;
  confidenceScores?: Record<string, number>;
  warnings: string[];
  processingTime: number;
  model: string;
  tokensUsed: number;
  extractionMethod: 'markdown' | 'html' | 'json' | 'mixed';
}

/**
 * Component state types
 */
export interface ScraperState {
  isLoading: boolean;
  error: string | null;
  scrapeResults: ScrapeResult | null;
  rawData: any | null; // Store raw Firecrawl data for display
  selectedProperties: ScrapedPropertyData[];
  importProgress: {
    isImporting: boolean;
    progress: number;
    status: string;
  };
  history: HistoryResponse['data'];
  presets: SearchPreset[];
  examples: GetExamplesResponse['data'];
  displayMode: 'processed' | 'raw' | 'both' | 'c1-processed' | 'c1-ui-spec'; // Display mode for data
  
  // C1 transformation state
  c1TransformInProgress: boolean;
  c1ExtractedProperties: ScrapedPropertyData[] | null;
  c1TransformError: string | null;
  showC1Review: boolean;
  c1TransformMetadata: C1TransformMetadata | null;
  
  // C1 UI specification state
  c1UISpecResponse: {
    success: boolean;
    uiSpec: any;
    properties: any[];
    metadata: any;
  } | null;
  showC1UISpec: boolean;
}

/**
 * Constants and enums
 */
export const PROPERTY_TYPES = [
  { value: 'office', label: 'Office Space' },
  { value: 'coworking', label: 'Co-working Space' },
  { value: 'retail', label: 'Retail/Showroom' },
  { value: 'warehouse', label: 'Warehouse/Godown' },
  { value: 'land', label: 'Industrial Land' }
] as const;

/**
 * C1 Extraction Constants
 */
export const C1_EXTRACTION_CONFIDENCE_THRESHOLD = 0.7;
export const C1_MAX_PROPERTIES_PER_REQUEST = 50;
export const C1_EXTRACTION_TIMEOUT = 60000; // 60 seconds
export const C1_CONFIDENCE_LEVELS = {
  high: { min: 0.8, max: 1.0, label: 'High', color: '#22c55e' },
  medium: { min: 0.5, max: 0.79, label: 'Medium', color: '#f59e0b' },
  low: { min: 0.0, max: 0.49, label: 'Low', color: '#ef4444' }
} as const;

export const FURNISHED_OPTIONS = [
  { value: 'furnished', label: 'Furnished' },
  { value: 'semi-furnished', label: 'Semi-Furnished' },
  { value: 'unfurnished', label: 'Unfurnished' }
] as const;

export const AVAILABILITY_OPTIONS = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'within-15-days', label: 'Within 15 Days' },
  { value: 'within-30-days', label: 'Within 30 Days' },
  { value: 'after-30-days', label: 'After 30 Days' }
] as const;

export const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'price-low-to-high', label: 'Price: Low to High' },
  { value: 'price-high-to-low', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' }
] as const;

export const COMMON_AMENITIES = [
  'parking',
  'wifi',
  'ac',
  'security',
  'cafeteria',
  'elevator',
  'power-backup',
  'conference-room',
  'reception',
  'washroom',
  'water',
  'maintenance'
] as const;

/**
 * Utility type guards
 */
export function isValidPropertyType(type: string): type is SearchParameters['propertyType'] {
  return ['office', 'coworking', 'retail', 'warehouse', 'land'].includes(type);
}

export function isValidFurnishedStatus(status: string): status is SearchParameters['furnished'] {
  return ['furnished', 'semi-furnished', 'unfurnished'].includes(status);
}

export function isValidAvailability(availability: string): availability is SearchParameters['availability'] {
  return ['immediate', 'within-15-days', 'within-30-days', 'after-30-days'].includes(availability);
}

export function isValidSortBy(sortBy: string): sortBy is SearchParameters['sortBy'] {
  return ['relevance', 'price-low-to-high', 'price-high-to-low', 'newest'].includes(sortBy);
}

/**
 * C1 Utility Functions
 */

/**
 * Check if property was processed by C1
 */
export function isC1ProcessedProperty(property: ScrapedPropertyData): boolean {
  return property.c1Metadata?.extractedBy === 'c1';
}

/**
 * Check if property has high confidence score
 */
export function hasHighConfidence(property: ScrapedPropertyData): boolean {
  if (!property.c1Metadata?.confidence) return false;
  return property.c1Metadata.confidence >= C1_CONFIDENCE_LEVELS.high.min;
}

/**
 * Get confidence level for a given score
 */
export function getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
  if (score >= C1_CONFIDENCE_LEVELS.high.min) return 'high';
  if (score >= C1_CONFIDENCE_LEVELS.medium.min) return 'medium';
  return 'low';
}

/**
 * Get confidence level configuration
 */
export function getConfidenceLevelConfig(score: number) {
  const level = getConfidenceLevel(score);
  return C1_CONFIDENCE_LEVELS[level];
}

/**
 * Default values for forms and components
 */
export const DEFAULT_SEARCH_PARAMS: Partial<SearchParameters> = {
  propertyType: 'office',
  furnished: 'furnished',
  availability: 'immediate',
  sortBy: 'relevance',
  page: 1
};

export const DEFAULT_SCRAPER_CONFIG: ScraperConfig = {
  useCrawl: false,
  maxPages: 1,
  firecrawlOptions: {
    waitFor: 2000,
    timeout: 30000
  }
};