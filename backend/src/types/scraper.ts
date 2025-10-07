/**
 * Scraper Types - Backend
 * 
 * TypeScript type definitions for the property scraper feature with dynamic search support.
 * 
 * Key Architecture:
 * - We build MagicBricks search URLs from user parameters (our custom logic)
 * - Firecrawl scrapes those URLs and extracts structured property data
 * - This is NOT using Firecrawl's search capabilities (which search the web, not specific sites)
 */

// Search Parameters for building MagicBricks URLs
export interface SearchParameters {
  location?: string; // City or area (e.g., "Bangalore", "Koramangala")
  propertyType?: 'office' | 'coworking' | 'retail' | 'warehouse' | 'land'; // Type of commercial property
  minPrice?: number; // Minimum price in INR
  maxPrice?: number; // Maximum price in INR
  minArea?: number; // Minimum area in sqft
  maxArea?: number; // Maximum area in sqft
  furnished?: 'furnished' | 'semi-furnished' | 'unfurnished'; // Furnishing status
  availability?: 'immediate' | 'within-15-days' | 'within-30-days' | 'after-30-days'; // Availability timeline
  amenities?: string[]; // Required amenities (parking, wifi, cafeteria, etc.)
  sortBy?: 'relevance' | 'price-low-to-high' | 'price-high-to-low' | 'newest'; // Sort order
  page?: number; // Page number for pagination
}

// Firecrawl v2 API Configuration (aligned with actual Firecrawl capabilities)
export interface FirecrawlScrapeConfig {
  url: string; // The URL to scrape (required)
  formats?: Array<string | object>; // Output formats (markdown, html, links, screenshot, json)
  actions?: Array<object>; // Browser actions (wait, click, scroll, write, press)
  onlyMainContent?: boolean; // Extract only main content (default: true)
  includeTags?: string[]; // HTML tags to include
  excludeTags?: string[]; // HTML tags to exclude
  waitFor?: number; // Milliseconds to wait before scraping
  timeout?: number; // Request timeout in milliseconds
  maxAge?: number; // Cache age in milliseconds
}

// Firecrawl v2 Crawl Configuration (for multi-page scraping)
export interface FirecrawlCrawlConfig {
  url: string; // Starting URL for crawl
  limit?: number; // Maximum pages to crawl
  includePaths?: string[]; // Regex patterns for paths to include
  excludePaths?: string[]; // Regex patterns for paths to exclude
  maxDepth?: number; // Maximum crawl depth
  allowSubdomains?: boolean; // Follow subdomains
  allowExternalLinks?: boolean; // Follow external links
  scrapeOptions?: FirecrawlScrapeConfig; // Options for each scraped page
}

// Our wrapper configuration for scraper requests
export interface ScraperConfig {
  searchParams?: SearchParameters; // Parameters to build search URL
  directUrl?: string; // Direct URL to scrape (alternative to searchParams)
  useCrawl?: boolean; // Use Firecrawl crawl endpoint for pagination (default: false)
  maxPages?: number; // Maximum pages to scrape (1-10)
  firecrawlOptions?: Partial<FirecrawlScrapeConfig>; // Additional Firecrawl options
}

// JSON schema structure for Firecrawl's JSON extraction format
export interface PropertyExtractionSchema {
  title: {
    type: 'string';
    description: 'Property listing title';
  };
  description: {
    type: 'string';
    description: 'Detailed property description';
  };
  price: {
    type: 'object';
    properties: {
      amount: { type: 'number' };
      currency: { type: 'string' };
      period: { type: 'string' }; // monthly, yearly, etc.
    };
  };
  location: {
    type: 'string';
    description: 'Property location/address';
  };
  size: {
    type: 'object';
    properties: {
      area: { type: 'number' };
      unit: { type: 'string' }; // sqft, seats, etc.
    };
  };
  amenities: {
    type: 'array';
    items: { type: 'string' };
    description: 'List of available amenities';
  };
  features: {
    type: 'object';
    properties: {
      furnished: { type: 'boolean' };
      parking: { type: 'boolean' };
      wifi: { type: 'boolean' };
      ac: { type: 'boolean' };
      security: { type: 'boolean' };
      cafeteria: { type: 'boolean' };
    };
  };
  contact: {
    type: 'object';
    properties: {
      phone: { type: 'string' };
      email: { type: 'string' };
    };
  };
  images: {
    type: 'array';
    items: { type: 'string' };
    description: 'Array of image URLs';
  };
  availability: {
    type: 'string';
    description: 'Availability status and date';
  };
}

// Scraped property data (matches Property schema with additional metadata)
export interface ScrapedPropertyData {
  // Core property fields (from Property interface)
  title: string;
  description: string;
  price?: {
    amount: number;
    currency: string;
    period: 'monthly' | 'yearly' | 'one-time';
  };
  location: string;
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
  
  // Scraper-specific metadata
  sourceUrl: string; // URL where the data was scraped from
  scrapedAt: string; // Timestamp when scraped
  searchParams?: SearchParameters; // Search parameters used to find this property
  rawData?: any; // Original Firecrawl response for debugging
  validationErrors?: string[]; // Validation error messages

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

// Result of a scraping operation
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
    firecrawlJobId?: string; // Job ID if crawl was used
    rawDataMode?: boolean; // Indicates raw data mode
    firecrawlFormats?: string[]; // Available formats from Firecrawl
  };
}

// Search preset for saving common searches
export interface SearchPreset {
  id: string;
  name: string; // User-friendly name (e.g., "Bangalore Offices Under 50L")
  description?: string;
  searchParams: SearchParameters;
  createdAt: string;
  lastUsed?: string;
}

// Bulk import request
export interface BulkImportRequest {
  properties: ScrapedPropertyData[];
  skipValidation?: boolean;
  overwriteExisting?: boolean;
}

// Bulk import result
export interface BulkImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{ index: number; error: string }>;
  createdIds: string[];
}