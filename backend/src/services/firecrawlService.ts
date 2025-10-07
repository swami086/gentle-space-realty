/**
 * Firecrawl Integration Service
 * 
 * Handles Firecrawl API interactions using strictly Firecrawl v2 capabilities.
 * 
 * Key Architecture:
 * - We build search URLs using UrlBuilderService (our custom logic)
 * - Firecrawl scrapes those URLs using their /v2/scrape or /v2/crawl endpoints
 * - We use Firecrawl's JSON extraction format for structured property data
 * - We transform the extracted data to match our Property schema
 * 
 * Note: Firecrawl does NOT have built-in search functionality for specific sites.
 * We construct the search URLs, Firecrawl scrapes them.
 */

import FirecrawlApp from '@mendable/firecrawl-js';
import { 
  ScraperConfig, 
  ScrapeResult, 
  ScrapedPropertyData, 
  SearchParameters, 
  FirecrawlScrapeConfig, 
  FirecrawlCrawlConfig, 
  PropertyExtractionSchema 
} from '../types/scraper';
import { UrlBuilderService } from './urlBuilderService';
import { getBackendConfig } from '../config/environment';
import { createLogger } from '../utils/logger';

const logger = createLogger('FirecrawlService');
const config = getBackendConfig();

// Singleton Firecrawl client instance
let firecrawlClient: FirecrawlApp | null = null;

/**
 * Initialize Firecrawl client with API key from environment config
 * Uses singleton pattern to reuse the same client instance
 */
function getFirecrawlClient(): FirecrawlApp {
  if (!firecrawlClient) {
    if (!config.FIRECRAWL_API_KEY) {
      throw new Error('Firecrawl API key not configured. Please set FIRECRAWL_API_KEY in environment variables.');
    }

    logger.info('Initializing Firecrawl client');
    firecrawlClient = new FirecrawlApp({ apiKey: config.FIRECRAWL_API_KEY });
    logger.info('Firecrawl client initialized successfully');
  }

  return firecrawlClient;
}

/**
 * JSON extraction schema for property data
 * This schema is used in Firecrawl's JSON format: { type: "json", prompt, schema }
 */
const propertyExtractionSchema: PropertyExtractionSchema = {
  title: {
    type: 'string',
    description: 'Property listing title'
  },
  description: {
    type: 'string',
    description: 'Detailed property description'
  },
  price: {
    type: 'object',
    properties: {
      amount: { type: 'number' },
      currency: { type: 'string' },
      period: { type: 'string' } // monthly, yearly, one-time
    }
  },
  location: {
    type: 'string',
    description: 'Property location/address'
  },
  size: {
    type: 'object',
    properties: {
      area: { type: 'number' },
      unit: { type: 'string' } // sqft, seats, etc.
    }
  },
  amenities: {
    type: 'array',
    items: { type: 'string' },
    description: 'List of available amenities'
  },
  features: {
    type: 'object',
    properties: {
      furnished: { type: 'boolean' },
      parking: { type: 'boolean' },
      wifi: { type: 'boolean' },
      ac: { type: 'boolean' },
      security: { type: 'boolean' },
      cafeteria: { type: 'boolean' }
    }
  },
  contact: {
    type: 'object',
    properties: {
      phone: { type: 'string' },
      email: { type: 'string' }
    }
  },
  images: {
    type: 'array',
    items: { type: 'string' },
    description: 'Array of image URLs'
  },
  availability: {
    type: 'string',
    description: 'Availability status and date'
  }
};

/**
 * Scrape a single property URL using Firecrawl v2 /scrape endpoint
 */
export async function scrapePropertyUrl(
  url: string, 
  config?: Partial<FirecrawlScrapeConfig>
): Promise<any> {
  try {
    logger.info('Starting property URL scrape - RAW DATA MODE', { url, config });

    const firecrawl = getFirecrawlClient();

    // Build Firecrawl scrape request - RETURN ALL DATA
    const scrapeOptions: any = {
      formats: ['markdown', 'html'],
      onlyMainContent: false, // Get ALL content, not just main
      waitFor: config?.waitFor || 5000, // Increased wait time
      timeout: config?.timeout || 120000, // Increased to 2 minutes
      ...config
    };

    logger.info('Calling Firecrawl scrape endpoint', { url, options: scrapeOptions });

    // Call Firecrawl scrape endpoint
    const response = await firecrawl.scrape(url, scrapeOptions) as any;

    // Firecrawl v2 API returns data directly, not wrapped in success structure
    if (!response || (!response.markdown && !response.json)) {
      throw new Error(`Firecrawl scrape failed: No data returned`);
    }

    logger.info('Firecrawl scrape completed successfully - RAW DATA MODE', { 
      url, 
      hasData: !!(response.markdown || response.json),
      formats: Object.keys(response),
      statusCode: response.metadata?.statusCode,
      creditsUsed: response.metadata?.creditsUsed,
      rawDataKeys: Object.keys(response)
    });

    // Return ALL RAW DATA from Firecrawl - no filtering or processing
    return {
      success: true,
      rawFirecrawlData: response, // Complete raw response from Firecrawl
      data: response // Also include in data field for compatibility
    };

  } catch (error: any) {
    logger.error('Error scraping property URL', { 
      error: error.message, 
      url, 
      config,
      stack: error.stack 
    });
    throw error;
  }
}

/**
 * Crawl multiple property pages using Firecrawl v2 /crawl endpoint
 */
export async function crawlPropertyPages(
  startUrl: string, 
  maxPages: number, 
  config?: Partial<FirecrawlCrawlConfig>
): Promise<any> {
  try {
    logger.info('Starting property pages crawl', { startUrl, maxPages, config });

    const firecrawl = getFirecrawlClient();

    // Build default scrape options with JSON extraction schema
    const defaultScrapeOptions = {
      formats: [
        'markdown',
        {
          type: 'json',
          prompt: 'Extract commercial property listing details including title, price, location, size, amenities, features, contact info, and images',
          schema: propertyExtractionSchema
        }
      ],
      actions: [
        { type: 'wait', milliseconds: 2000 },
        { type: 'scroll', direction: 'down' }
      ],
      onlyMainContent: true,
      waitFor: 2000,
      timeout: 30000
    };

    // Build Firecrawl crawl request, merging any provided scrape options
    const crawlOptions: any = {
      limit: maxPages,
      includePaths: ['.*page=[0-9]+.*', '.*p=[0-9]+.*'], // Match pagination patterns
      scrapeOptions: {
        ...defaultScrapeOptions,
        ...config?.scrapeOptions // Merge provided options, preserving JSON schema
      },
      ...config
    };

    logger.info('Calling Firecrawl crawl endpoint', { startUrl, options: crawlOptions });

    // Start crawl job
    const crawlResponse = await firecrawl.crawl(startUrl, crawlOptions) as any;

    if (!crawlResponse.success) {
      throw new Error(`Firecrawl crawl failed to start: ${crawlResponse.error || 'Unknown error'}`);
    }

    const jobId = crawlResponse.id;
    logger.info('Firecrawl crawl started', { jobId, startUrl });

    // Poll job status until complete
    let jobStatus;
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max wait time (5s intervals)

    do {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      attempts++;

      try {
        jobStatus = await firecrawl.getCrawlStatus(jobId);
        logger.info('Crawl job status update', { 
          jobId, 
          status: jobStatus.status, 
          completed: jobStatus.completed || 0, 
          total: jobStatus.total || 0,
          attempts 
        });

        if (jobStatus?.status === 'failed') {
          throw new Error(`Crawl job failed: ${(jobStatus as any)?.error || 'Unknown error'}`);
        }

      } catch (statusError: any) {
        logger.warn('Error checking crawl status', { jobId, error: statusError.message, attempts });
        
        if (attempts >= maxAttempts) {
          throw new Error(`Crawl job status check timeout after ${maxAttempts} attempts`);
        }
        continue;
      }

    } while (jobStatus?.status === 'scraping' && attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new Error(`Crawl job timeout after ${maxAttempts * 5} seconds`);
    }

    if (jobStatus?.status !== 'completed') {
      throw new Error(`Crawl job ended with status: ${jobStatus?.status}`);
    }

    logger.info('Firecrawl crawl completed successfully', { 
      jobId, 
      totalPages: (jobStatus as any)?.data?.length || 0,
      startUrl 
    });

    return {
      success: true,
      id: jobId,
      data: (jobStatus as any)?.data || [],
      metadata: {
        completed: (jobStatus as any)?.completed,
        total: (jobStatus as any)?.total,
        creditsUsed: (jobStatus as any)?.creditsUsed
      }
    };

  } catch (error: any) {
    logger.error('Error crawling property pages', { 
      error: error.message, 
      startUrl, 
      maxPages, 
      config,
      stack: error.stack 
    });
    throw error;
  }
}

/**
 * Scrape properties using search parameters (builds URL first, then scrapes)
 */
export async function scrapeWithSearchParams(
  searchParams: SearchParameters,
  config?: Partial<ScraperConfig>
): Promise<ScrapeResult> {
  try {
    logger.info('Starting scrape with search parameters', { searchParams, config });

    // Validate search parameters
    const validationErrors = UrlBuilderService.validateSearchParams(searchParams);
    if (validationErrors.length > 0) {
      throw new Error(`Invalid search parameters: ${validationErrors.join(', ')}`);
    }

    // Build search URL
    const searchUrl = UrlBuilderService.buildMagicBricksSearchUrl(searchParams);
    logger.info('Built search URL', { searchUrl, searchParams });

    let firecrawlResponse;

    // Use crawl for multiple pages, scrape for single page
    if (config?.useCrawl && config?.maxPages && config.maxPages > 1) {
      firecrawlResponse = await crawlPropertyPages(searchUrl, config.maxPages, config.firecrawlOptions);
    } else {
      firecrawlResponse = await scrapePropertyUrl(searchUrl, config?.firecrawlOptions);
    }

    // Transform Firecrawl response to our format
    const scrapedProperties = await transformFirecrawlData(
      firecrawlResponse,
      searchUrl,
      searchParams
    );

    // Validate scraped properties
    const validatedProperties = scrapedProperties.map(property => ({
      ...property,
      validationErrors: validateScrapedProperty(property)
    }));

    const result: ScrapeResult = {
      success: true,
      data: validatedProperties,
      metadata: {
        url: searchUrl,
        scrapedAt: new Date().toISOString(),
        totalFound: validatedProperties.length,
        searchParams,
        firecrawlJobId: firecrawlResponse.id || undefined
      }
    };

    logger.info('Scrape with search parameters completed', { 
      totalFound: result.metadata.totalFound,
      searchParams 
    });

    return result;

  } catch (error: any) {
    logger.error('Error scraping with search parameters', { 
      error: error.message, 
      searchParams, 
      config,
      stack: error.stack 
    });

    return {
      success: false,
      error: error.message,
      metadata: {
        url: '',
        scrapedAt: new Date().toISOString(),
        totalFound: 0,
        searchParams
      }
    };
  }
}

/**
 * Transform Firecrawl data to match our Property schema
 */
export async function transformFirecrawlData(
  firecrawlResponse: any,
  sourceUrl: string,
  searchParams?: SearchParameters
): Promise<ScrapedPropertyData[]> {
  try {
    logger.info('Transforming Firecrawl data', { 
      hasData: !!firecrawlResponse.data,
      sourceUrl 
    });

    const properties: ScrapedPropertyData[] = [];
    const timestamp = new Date().toISOString();

    // Handle both single scrape and crawl responses
    const dataArray = Array.isArray(firecrawlResponse.data) 
      ? firecrawlResponse.data 
      : [firecrawlResponse.data];

    for (const pageData of dataArray) {
      if (!pageData?.json) {
        logger.warn('No JSON data found in Firecrawl response', { pageData: Object.keys(pageData || {}) });
        continue;
      }

      const jsonData = pageData.json;

      // Transform single property or array of properties
      const propertyArray = Array.isArray(jsonData) ? jsonData : [jsonData];

      for (const rawProperty of propertyArray) {
        if (!rawProperty || typeof rawProperty !== 'object') {
          logger.warn('Invalid property data structure', { rawProperty });
          continue;
        }

        try {
          // Build the base property data
          const transformedProperty: ScrapedPropertyData = {
            // Required fields
            title: rawProperty.title || 'Untitled Property',
            description: rawProperty.description || 'No description available',
            location: rawProperty.location || 'Location not specified',

            // Media (images and videos)
            media: {
              images: Array.isArray(rawProperty.images) 
                ? rawProperty.images.filter((img: any) => typeof img === 'string' && img.startsWith('http'))
                : [],
              videos: [] // Videos not typically available in listings
            },

            // Availability status
            availability: rawProperty.availability ? {
              status: rawProperty.availability.includes('available') ? 'available' : 
                     rawProperty.availability.includes('occupied') ? 'occupied' : 'coming-soon'
            } : { status: 'available' },

            // Scraper metadata
            sourceUrl: pageData.url || sourceUrl,
            scrapedAt: timestamp,
            rawData: rawProperty // Store original data for debugging
          };

          // Add optional price information only if present
          if (rawProperty.price) {
            transformedProperty.price = {
              amount: parseFloat(rawProperty.price.amount) || 0,
              currency: rawProperty.price.currency || 'INR',
              period: (rawProperty.price.period === 'monthly' || rawProperty.price.period === 'yearly' 
                ? rawProperty.price.period 
                : 'monthly') as 'monthly' | 'yearly' | 'one-time'
            };
          }

          // Add optional size information only if present
          if (rawProperty.size) {
            transformedProperty.size = {
              area: parseFloat(rawProperty.size.area) || 0,
              unit: rawProperty.size.unit === 'sqft' || rawProperty.size.unit === 'seats' 
                ? rawProperty.size.unit 
                : 'sqft'
            };
          }

          // Add amenities array only if present
          if (Array.isArray(rawProperty.amenities) && rawProperty.amenities.length > 0) {
            transformedProperty.amenities = rawProperty.amenities.filter((a: any) => typeof a === 'string');
          }

          // Add features object only if present
          if (rawProperty.features) {
            transformedProperty.features = {
              furnished: Boolean(rawProperty.features.furnished),
              parking: Boolean(rawProperty.features.parking),
              wifi: Boolean(rawProperty.features.wifi),
              ac: Boolean(rawProperty.features.ac),
              security: Boolean(rawProperty.features.security),
              cafeteria: Boolean(rawProperty.features.cafeteria),
              elevator: Boolean(rawProperty.features.elevator),
              powerBackup: Boolean(rawProperty.features.powerBackup || rawProperty.features.power_backup),
              conferenceRoom: Boolean(rawProperty.features.conferenceRoom || rawProperty.features.conference_room)
            };
          }

          // Add contact information only if present
          if (rawProperty.contact && (rawProperty.contact.phone || rawProperty.contact.email || rawProperty.contact.contactPerson)) {
            transformedProperty.contact = {
              phone: rawProperty.contact.phone || undefined,
              email: rawProperty.contact.email || undefined,
              contactPerson: rawProperty.contact.contactPerson || undefined
            };
          }

          // Add search parameters only if present
          if (searchParams) {
            transformedProperty.searchParams = searchParams;
          }

          properties.push(transformedProperty);
          logger.debug('Transformed property successfully', { 
            title: transformedProperty.title,
            location: transformedProperty.location 
          });

        } catch (transformError: any) {
          logger.error('Error transforming individual property', { 
            error: transformError.message,
            rawProperty: JSON.stringify(rawProperty, null, 2) 
          });
        }
      }
    }

    logger.info('Firecrawl data transformation completed', { 
      totalProperties: properties.length,
      sourceUrl 
    });

    return properties;

  } catch (error: any) {
    logger.error('Error transforming Firecrawl data', { 
      error: error.message,
      sourceUrl,
      hasResponse: !!firecrawlResponse,
      stack: error.stack 
    });
    return [];
  }
}

/**
 * Validate scraped property data
 */
export function validateScrapedProperty(property: ScrapedPropertyData): string[] {
  const errors: string[] = [];

  // Check required fields
  if (!property.title || property.title.trim().length < 5) {
    errors.push('Title is too short (minimum 5 characters)');
  }

  if (!property.description || property.description.trim().length < 10) {
    errors.push('Description is too short (minimum 10 characters)');
  }

  if (!property.location || property.location.trim().length < 3) {
    errors.push('Location is required');
  }

  // Check for suspicious data patterns
  if (property.title.toLowerCase().includes('placeholder') || 
      property.title.toLowerCase().includes('lorem ipsum')) {
    errors.push('Title appears to contain placeholder text');
  }

  if (property.description.toLowerCase().includes('lorem ipsum')) {
    errors.push('Description appears to contain placeholder text');
  }

  // Validate price if provided
  if (property.price) {
    if (property.price.amount <= 0) {
      errors.push('Price amount must be greater than 0');
    }
    if (!['INR', 'USD', 'EUR'].includes(property.price.currency)) {
      errors.push('Invalid currency code');
    }
  }

  // Validate size if provided
  if (property.size) {
    if (property.size.area <= 0) {
      errors.push('Area must be greater than 0');
    }
    if (!['sqft', 'seats'].includes(property.size.unit)) {
      errors.push('Invalid size unit');
    }
  }

  // Validate contact information
  if (property.contact?.phone && !property.contact.phone.match(/[\d\s\-\+\(\)]{8,}/)) {
    errors.push('Phone number format appears invalid');
  }

  if (property.contact?.email && !property.contact.email.includes('@')) {
    errors.push('Email address format appears invalid');
  }

  // Validate images
  if (property.media?.images) {
    for (const image of property.media.images) {
      if (!image.startsWith('http')) {
        errors.push('Invalid image URL format');
        break; // Only report once
      }
    }
  }

  return errors;
}

// Export service object
export const FirecrawlService = {
  scrapePropertyUrl,
  crawlPropertyPages,
  scrapeWithSearchParams,
  transformFirecrawlData,
  validateScrapedProperty
};

export default FirecrawlService;