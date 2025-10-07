/**
 * URL Builder Service
 * 
 * Builds MagicBricks search URLs from search parameters.
 * This is OUR custom logic for constructing search URLs - not Firecrawl functionality.
 * 
 * Flow:
 * 1. User provides search parameters (location, price, type, etc.)
 * 2. We build MagicBricks search URL using their URL structure
 * 3. Firecrawl scrapes those URLs and extracts structured property data
 * 
 * Note: This is based on MagicBricks URL structure analysis.
 */

import { SearchParameters } from '../types/scraper';
import { createLogger } from '../utils/logger';

const logger = createLogger('UrlBuilderService');

// MagicBricks URL structure constants
const MAGICBRICKS_BASE_URL = 'https://www.magicbricks.com';
const COMMERCIAL_SEARCH_PATH = '/property-for-rent/commercial';

// Property type mappings for MagicBricks URLs
const PROPERTY_TYPE_MAP: Record<string, string> = {
  office: 'office-space',
  coworking: 'co-working-space',
  retail: 'retail-showroom',
  warehouse: 'warehouse-godown',
  land: 'industrial-land'
};

// Sort parameter mappings
const SORT_MAP: Record<string, string> = {
  'relevance': '',
  'price-low-to-high': 'price-asc',
  'price-high-to-low': 'price-desc',
  'newest': 'date-desc'
};

// Availability mappings
const AVAILABILITY_MAP: Record<string, string> = {
  'immediate': 'immediate',
  'within-15-days': '15days',
  'within-30-days': '30days',
  'after-30-days': '30plus'
};

/**
 * Build MagicBricks search URL from search parameters
 */
export function buildMagicBricksSearchUrl(searchParams: SearchParameters): string {
  try {
    logger.info('Building MagicBricks search URL', { searchParams });

    // Validate required parameters
    const validationErrors = validateSearchParams(searchParams);
    if (validationErrors.length > 0) {
      throw new Error(`Invalid search parameters: ${validationErrors.join(', ')}`);
    }

    // Build base URL with location and property type
    let url = `${MAGICBRICKS_BASE_URL}${COMMERCIAL_SEARCH_PATH}`;
    
    // Add location to URL path
    if (searchParams.location) {
      const locationSlug = searchParams.location.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      url += `/${locationSlug}`;
    }

    // Add property type to URL path
    if (searchParams.propertyType && PROPERTY_TYPE_MAP[searchParams.propertyType]) {
      url += `/${PROPERTY_TYPE_MAP[searchParams.propertyType]}`;
    }

    // Build query parameters
    const queryParams = new URLSearchParams();

    // Price range
    if (searchParams.minPrice) {
      queryParams.set('budget-min', searchParams.minPrice.toString());
    }
    if (searchParams.maxPrice) {
      queryParams.set('budget-max', searchParams.maxPrice.toString());
    }

    // Area range
    if (searchParams.minArea) {
      queryParams.set('carpet-min', searchParams.minArea.toString());
    }
    if (searchParams.maxArea) {
      queryParams.set('carpet-max', searchParams.maxArea.toString());
    }

    // Furnished status
    if (searchParams.furnished) {
      queryParams.set('furnishing', searchParams.furnished);
    }

    // Availability
    if (searchParams.availability && AVAILABILITY_MAP[searchParams.availability]) {
      const availabilityValue = AVAILABILITY_MAP[searchParams.availability];
      if (availabilityValue) {
        queryParams.set('availability', availabilityValue);
      }
    }

    // Amenities (as comma-separated values)
    if (searchParams.amenities && searchParams.amenities.length > 0) {
      queryParams.set('amenities', searchParams.amenities.join(','));
    }

    // Sort order
    if (searchParams.sortBy && SORT_MAP[searchParams.sortBy]) {
      const sortValue = SORT_MAP[searchParams.sortBy];
      if (sortValue) {
        queryParams.set('sort', sortValue);
      }
    }

    // Page number
    if (searchParams.page && searchParams.page > 1) {
      queryParams.set('page', searchParams.page.toString());
    }

    // Append query parameters to URL
    const queryString = queryParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    logger.info('Built MagicBricks search URL', { url, searchParams });
    return url;

  } catch (error: any) {
    logger.error('Error building MagicBricks search URL', { error: error.message, searchParams });
    throw error;
  }
}

/**
 * Build pagination URLs from base search URL
 */
export function buildPaginationUrls(searchParams: SearchParameters, maxPages: number): string[] {
  const urls: string[] = [];
  
  for (let page = 1; page <= maxPages; page++) {
    const pageParams = { ...searchParams, page };
    const url = buildMagicBricksSearchUrl(pageParams);
    urls.push(url);
  }
  
  logger.info('Built pagination URLs', { count: urls.length, maxPages });
  return urls;
}

/**
 * Parse search parameters from MagicBricks URL (reverse operation)
 */
export function parseSearchParamsFromUrl(url: string): SearchParameters {
  try {
    const urlObj = new URL(url);
    const searchParams: SearchParameters = {};

    // Extract location from URL path
    const pathParts = urlObj.pathname.split('/').filter(part => part.length > 0);
    if (pathParts.length >= 4) {
      // Expected format: /property-for-rent/commercial/{location}/{property-type}
      const locationSlug = pathParts[3];
      if (locationSlug) {
        searchParams.location = locationSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
    }

    // Extract property type from URL path
    if (pathParts.length >= 5) {
      const propertyTypeSlug = pathParts[4];
      for (const [key, value] of Object.entries(PROPERTY_TYPE_MAP)) {
        if (value === propertyTypeSlug) {
          searchParams.propertyType = key as any;
          break;
        }
      }
    }

    // Parse query parameters
    const params = urlObj.searchParams;

    // Price range
    const minPrice = params.get('budget-min');
    if (minPrice) searchParams.minPrice = parseInt(minPrice, 10);
    
    const maxPrice = params.get('budget-max');
    if (maxPrice) searchParams.maxPrice = parseInt(maxPrice, 10);

    // Area range
    const minArea = params.get('carpet-min');
    if (minArea) searchParams.minArea = parseInt(minArea, 10);
    
    const maxArea = params.get('carpet-max');
    if (maxArea) searchParams.maxArea = parseInt(maxArea, 10);

    // Furnished status
    const furnished = params.get('furnishing');
    if (furnished) searchParams.furnished = furnished as any;

    // Availability
    const availability = params.get('availability');
    if (availability) {
      for (const [key, value] of Object.entries(AVAILABILITY_MAP)) {
        if (value === availability) {
          searchParams.availability = key as any;
          break;
        }
      }
    }

    // Amenities
    const amenities = params.get('amenities');
    if (amenities) {
      searchParams.amenities = amenities.split(',');
    }

    // Sort order
    const sort = params.get('sort');
    if (sort) {
      for (const [key, value] of Object.entries(SORT_MAP)) {
        if (value === sort) {
          searchParams.sortBy = key as any;
          break;
        }
      }
    }

    // Page number
    const page = params.get('page');
    if (page) searchParams.page = parseInt(page, 10);

    logger.info('Parsed search parameters from URL', { url, searchParams });
    return searchParams;

  } catch (error: any) {
    logger.error('Error parsing search parameters from URL', { error: error.message, url });
    return {};
  }
}

/**
 * Validate search parameters
 */
export function validateSearchParams(searchParams: SearchParameters): string[] {
  const errors: string[] = [];

  // Location is recommended but not required
  if (!searchParams.location) {
    logger.warn('No location provided - search may return generic results');
  }

  // Validate price range
  if (searchParams.minPrice && searchParams.maxPrice) {
    if (searchParams.minPrice >= searchParams.maxPrice) {
      errors.push('Minimum price must be less than maximum price');
    }
  }

  // Validate area range
  if (searchParams.minArea && searchParams.maxArea) {
    if (searchParams.minArea >= searchParams.maxArea) {
      errors.push('Minimum area must be less than maximum area');
    }
  }

  // Validate enum values
  if (searchParams.propertyType && !PROPERTY_TYPE_MAP[searchParams.propertyType]) {
    errors.push(`Invalid property type: ${searchParams.propertyType}`);
  }

  if (searchParams.furnished && !['furnished', 'semi-furnished', 'unfurnished'].includes(searchParams.furnished)) {
    errors.push(`Invalid furnished status: ${searchParams.furnished}`);
  }

  if (searchParams.availability && !AVAILABILITY_MAP[searchParams.availability]) {
    errors.push(`Invalid availability: ${searchParams.availability}`);
  }

  if (searchParams.sortBy && !SORT_MAP[searchParams.sortBy]) {
    errors.push(`Invalid sort order: ${searchParams.sortBy}`);
  }

  // Validate page number
  if (searchParams.page && (searchParams.page < 1 || searchParams.page > 100)) {
    errors.push('Page number must be between 1 and 100');
  }

  // Validate numeric values
  if (searchParams.minPrice && searchParams.minPrice < 0) {
    errors.push('Minimum price cannot be negative');
  }
  if (searchParams.maxPrice && searchParams.maxPrice < 0) {
    errors.push('Maximum price cannot be negative');
  }
  if (searchParams.minArea && searchParams.minArea < 0) {
    errors.push('Minimum area cannot be negative');
  }
  if (searchParams.maxArea && searchParams.maxArea < 0) {
    errors.push('Maximum area cannot be negative');
  }

  return errors;
}

/**
 * Get example search preset configurations
 */
export function getSearchPresetExamples(): Array<{ name: string; description: string; searchParams: SearchParameters }> {
  return [
    {
      name: 'Bangalore Furnished Offices',
      description: 'Furnished office spaces in Bangalore',
      searchParams: {
        location: 'Bangalore',
        propertyType: 'office',
        furnished: 'furnished',
        amenities: ['parking', 'wifi', 'ac'],
        sortBy: 'price-low-to-high'
      }
    },
    {
      name: 'Mumbai Coworking Spaces',
      description: 'Coworking spaces in Mumbai for small teams',
      searchParams: {
        location: 'Mumbai',
        propertyType: 'coworking',
        maxPrice: 5000000, // 50L
        amenities: ['wifi', 'cafeteria', 'parking'],
        availability: 'immediate'
      }
    },
    {
      name: 'Delhi Retail Shops Under 1Cr',
      description: 'Retail shops and showrooms in Delhi under 1 crore',
      searchParams: {
        location: 'Delhi',
        propertyType: 'retail',
        maxPrice: 10000000, // 1Cr
        minArea: 500,
        sortBy: 'price-low-to-high'
      }
    },
    {
      name: 'Pune Warehouses Above 10000 sqft',
      description: 'Large warehouse spaces in Pune',
      searchParams: {
        location: 'Pune',
        propertyType: 'warehouse',
        minArea: 10000,
        amenities: ['security', 'power-backup'],
        availability: 'within-30-days'
      }
    }
  ];
}

// Export the service
export const UrlBuilderService = {
  buildMagicBricksSearchUrl,
  buildPaginationUrls,
  parseSearchParamsFromUrl,
  validateSearchParams,
  getSearchPresetExamples
};

export default UrlBuilderService;