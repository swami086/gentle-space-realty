# Property Scraper Feature Documentation

## Overview

The Property Scraper feature enables administrators to dynamically scrape commercial properties from MagicBricks using customizable search parameters. This system integrates with Firecrawl v2 API to extract structured property data and bulk import it into the application database.

## Architecture

### Key Components

1. **URL Builder Service** - Constructs MagicBricks search URLs from user parameters
2. **Firecrawl Integration** - Uses Firecrawl v2 API to scrape and extract structured data
3. **Dynamic Search Parameters** - Flexible search configuration for different property types
4. **Bulk Import System** - Validates and imports scraped properties with conflict resolution
5. **Admin Interface** - User-friendly interface for search configuration and property management

### Important Architectural Notes

- **Firecrawl does NOT have built-in search functionality** - We build search URLs using custom logic, then Firecrawl scrapes those URLs using their `/v2/scrape` or `/v2/crawl` endpoints
- The system uses JSON schema extraction to get structured data from scraped pages
- All scraping operations are admin-only with role-based access control

## Backend Implementation

### Dependencies

```json
{
  "@mendable/firecrawl-js": "^4.3.4"
}
```

### Environment Configuration

```bash
# Firecrawl API Configuration
# Get from: https://firecrawl.dev/app/api-keys
FIRECRAWL_API_KEY=fc-your-firecrawl-api-key-here
```

### Core Services

#### URL Builder Service (`backend/src/services/urlBuilderService.ts`)

Constructs MagicBricks search URLs from search parameters:

```typescript
export function buildMagicBricksSearchUrl(searchParams: SearchParameters): string {
  // Builds URL with location, property type, and query parameters
  // Handles property type mappings (office, coworking, retail, etc.)
  // Applies price ranges, area filters, amenities, and sorting
}
```

**Features:**
- Property type mappings (office, coworking, retail, warehouse, land)
- Price and area range filtering
- Amenities selection
- Sort options (relevance, price, area, date)
- URL encoding and parameter validation

#### Firecrawl Service (`backend/src/services/firecrawlService.ts`)

Integrates with Firecrawl v2 API for web scraping:

```typescript
export async function scrapePropertyUrl(url: string): Promise<any>
export async function transformFirecrawlData(firecrawlResponse: any): Promise<ScrapedPropertyData[]>
```

**Features:**
- Firecrawl v2 API integration (`/v2/scrape` endpoint)
- JSON schema extraction for structured data
- Error handling and timeout management
- Data transformation and validation
- Singleton pattern for client management

### API Routes (`backend/src/routes/scraper.ts`)

RESTful API endpoints for scraper functionality:

```typescript
POST /api/v1/scraper/preview    // Preview search URL
POST /api/v1/scraper/scrape     // Execute property scraping
POST /api/v1/scraper/import     // Bulk import properties
GET  /api/v1/scraper/history    // Get scraping history
GET  /api/v1/scraper/examples   // Get search examples
POST /api/v1/scraper/presets    // Save search preset
GET  /api/v1/scraper/presets    // Get saved presets
```

All routes require admin role authentication and include comprehensive validation.

### Validation Schemas

Joi validation schemas for all endpoints with custom validation logic:

```typescript
export const scraperSchemas = {
  scrape: Joi.object({
    // Either searchParams or directUrl required (custom validation)
    searchParams: searchParametersSchema.optional(),
    directUrl: Joi.string().uri().optional(),
    useCrawl: Joi.boolean().default(false),
    maxPages: Joi.number().integer().min(1).max(10).default(1)
  }).custom((value, helpers) => {
    // Custom validation requiring either searchParams or directUrl
  }),
  
  import: Joi.object({
    properties: Joi.array().items(scrapedPropertySchema).min(1).max(50).required()
  })
};
```

### Type Definitions (`backend/src/types/scraper.ts`)

Comprehensive TypeScript interfaces:

```typescript
export interface SearchParameters {
  location?: string;
  propertyType?: 'office' | 'coworking' | 'retail' | 'warehouse' | 'land';
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  furnished?: 'furnished' | 'semi-furnished' | 'unfurnished';
  availability?: 'immediate' | 'within-15-days' | 'within-30-days' | 'after-3-months';
  amenities?: string[];
  sortBy?: 'relevance' | 'price-low-to-high' | 'price-high-to-low' | 'area-low-to-high' | 'area-high-to-low' | 'newest';
}

export interface ScrapedPropertyData {
  title: string;
  description: string;
  location: string;
  price?: PropertyPrice;
  size?: PropertySize;
  images?: string[];
  amenities?: string[];
  sourceUrl: string;
  scrapedAt: Date;
  validationErrors?: string[];
}
```

## Frontend Implementation

### Components

#### SearchParametersForm (`src/components/scraper/SearchParametersForm.tsx`)

Form component for defining search parameters:

**Features:**
- Location input with validation
- Property type selection (dropdown)
- Price range inputs (min/max INR)
- Area range inputs (min/max sq ft)
- Furnished status selection
- Availability timeline selection
- Amenities selection (common + custom)
- Sort options
- URL preview functionality
- Form validation with error display

#### ScraperManagement (`src/components/scraper/ScraperManagement.tsx`)

Main orchestrating component with tabbed interface:

**Features:**
- **Search Tab**: Parameter form and URL preview
- **Results Tab**: Property selection and import settings
- **History Tab**: Scraping history with refresh
- Property selection with checkboxes (select all/none)
- Import settings (skip validation, overwrite existing)
- Progress tracking for async operations
- Error handling and user feedback

### Services

#### ScraperService (`src/services/scraperService.ts`)

Frontend service handling API calls:

```typescript
export class ScraperService {
  static async scrapeProperties(request: ScrapeRequest): Promise<ScrapeResponse>
  static async importProperties(request: ImportRequest): Promise<ImportResponse>
  static async previewSearch(request: PreviewRequest): Promise<PreviewResponse>
  // ... other service methods
}
```

#### Validation Utilities

```typescript
export class ScraperValidation {
  static validateSearchForm(formData: SearchParametersFormData): ValidationResult
  static formDataToSearchParams(formData: SearchParametersFormData): SearchParameters
  static searchParamsToFormData(searchParams: SearchParameters): SearchParametersFormData
}
```

#### Property Utilities

```typescript
export class PropertyUtils {
  static formatPrice(price?: PropertyPrice): string
  static formatArea(size?: PropertySize): string  
  static getStatusColor(status: string): string
  static isValidForImport(property: ScrapedPropertyData): boolean
}
```

### Navigation Integration

The scraper is integrated into the admin interface:

1. **AdminLayout**: Added "Property Scraper" menu item with Globe icon
2. **AdminPage**: Added route handling for `/admin/scraper`
3. **ApiService**: Added scraper API methods for backend integration

## Usage Guide

### Setup Requirements

1. **Firecrawl API Key**: Get from [firecrawl.dev](https://firecrawl.dev/app/api-keys)
2. **Environment Variable**: Set `FIRECRAWL_API_KEY` in backend `.env`
3. **Admin Access**: Only users with admin role can access scraper

### Basic Workflow

1. **Navigate**: Go to Admin Portal → Property Scraper
2. **Configure Search**: Set location, property type, price/area ranges, amenities
3. **Preview URL**: Click "Preview URL" to see constructed MagicBricks URL
4. **Execute Scraping**: Click "Start Scraping" to extract properties
5. **Review Results**: Select properties to import, configure import settings
6. **Import Properties**: Click "Import Selected" to add to database
7. **View History**: Check History tab for past scraping operations

### Search Parameters

- **Location**: City or area (e.g., "Bangalore", "Mumbai", "Gurgaon")
- **Property Type**: Office, Coworking, Retail, Warehouse, Land
- **Price Range**: Minimum and maximum in INR
- **Area Range**: Minimum and maximum in square feet
- **Furnished Status**: Furnished, Semi-furnished, Unfurnished
- **Availability**: Immediate, Within 15 days, Within 30 days, After 3 months
- **Amenities**: Common amenities + custom tags
- **Sort By**: Relevance, Price, Area, Newest listings

### Import Options

- **Skip Validation**: Bypass property validation checks
- **Overwrite Existing**: Replace properties with matching source URLs
- **Selective Import**: Choose specific properties to import
- **Bulk Processing**: Import up to 50 properties at once

## Error Handling

### Common Issues

1. **Invalid API Key**: Check FIRECRAWL_API_KEY environment variable
2. **Network Timeouts**: Firecrawl API may be slow, increase timeout settings
3. **Validation Failures**: Properties missing required fields (title, location, description)
4. **Rate Limiting**: Firecrawl API has rate limits, implement retry logic
5. **Malformed URLs**: URL construction fails with invalid parameters

### Error Recovery

- Automatic retry with exponential backoff
- Detailed error logging for debugging
- User-friendly error messages
- Fallback to direct URL scraping
- Validation error details for each property

## Security Considerations

### Access Control

- **Admin Only**: All scraper endpoints require admin role
- **Authentication**: Firebase ID token validation
- **Authorization**: Role-based access control middleware

### Data Validation

- **Input Sanitization**: All search parameters validated with Joi schemas
- **URL Validation**: Direct URLs validated for security
- **Property Validation**: Scraped data validated before import
- **Rate Limiting**: Prevent abuse of scraping endpoints

### Privacy & Compliance

- **Source Attribution**: All scraped properties include source URL
- **Terms of Service**: Respect MagicBricks terms and robots.txt
- **Data Retention**: History includes scraping timestamps
- **User Consent**: Admin-only access with clear purpose

## Performance Optimization

### Backend Optimizations

1. **Connection Pooling**: Reuse HTTP connections
2. **Caching**: Cache successful URL constructions
3. **Batch Processing**: Process multiple properties efficiently
4. **Error Handling**: Fast failure for invalid requests
5. **Resource Limits**: Maximum pages, properties per request

### Frontend Optimizations

1. **Progress Tracking**: Real-time progress updates
2. **Lazy Loading**: Load history on demand
3. **Debounced Validation**: Reduce API calls during form input
4. **Optimistic Updates**: Immediate UI feedback
5. **Error Boundaries**: Graceful error handling

## Monitoring & Analytics

### Metrics to Track

1. **Scraping Success Rate**: Successful vs failed scraping attempts
2. **Import Success Rate**: Successfully imported vs rejected properties
3. **Response Times**: API response times and Firecrawl performance
4. **Error Rates**: Types and frequency of errors
5. **Usage Patterns**: Most common search parameters and property types

### Logging

- Structured logging with request IDs
- Performance metrics and timing
- Error details with context
- User actions and admin activities
- Firecrawl API response analysis

## Maintenance

### Regular Tasks

1. **API Key Rotation**: Update Firecrawl API keys periodically
2. **URL Pattern Updates**: Monitor MagicBricks URL structure changes
3. **Schema Updates**: Update property extraction schemas as needed
4. **Performance Review**: Monitor and optimize scraping performance
5. **Error Analysis**: Review error logs and improve error handling

### Troubleshooting

1. **Test URL Construction**: Verify generated URLs work in browser
2. **Check API Connectivity**: Test Firecrawl API endpoints directly
3. **Validate Schemas**: Ensure property extraction schemas are current
4. **Monitor Logs**: Check backend logs for detailed error information
5. **User Feedback**: Collect admin user feedback on scraping quality

## Rollback Procedure

If the feature needs to be removed, use the provided rollback script:

```bash
bash scripts/rollback-scraper-feature.sh
```

This script will:
- Remove all scraper-related files
- Restore original configuration files
- Clean up dependencies
- Remove navigation integration
- Provide cleanup instructions

## Future Enhancements

### Potential Improvements

1. **Multi-Source Support**: Add support for other property websites
2. **Scheduled Scraping**: Automated scraping on schedule
3. **Advanced Filtering**: More sophisticated property filtering options
4. **Data Enrichment**: Enhance scraped data with additional sources
5. **Export Functionality**: Export scraped data to various formats
6. **Duplicate Detection**: Advanced duplicate property detection
7. **Quality Scoring**: Score scraped properties for quality
8. **Notification System**: Alerts for successful imports and errors

### Integration Opportunities

1. **Property Analytics**: Analyze scraped property trends
2. **Market Research**: Use scraped data for market analysis  
3. **Pricing Intelligence**: Compare scraped prices with listings
4. **Lead Generation**: Convert scraped properties to leads
5. **Inventory Management**: Sync scraped properties with inventory

## Support & Documentation

- **API Documentation**: Swagger/OpenAPI specs in `/docs/api`
- **Component Documentation**: Storybook stories for UI components
- **Development Guide**: Setup and development instructions
- **Deployment Guide**: Production deployment checklist
- **Troubleshooting Guide**: Common issues and solutions

---

**Note**: This feature requires a valid Firecrawl API key and should only be used in compliance with MagicBricks terms of service and applicable data protection regulations.