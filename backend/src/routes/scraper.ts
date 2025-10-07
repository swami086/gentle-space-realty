/**
 * Scraper Routes
 * 
 * This service builds MagicBricks search URLs from user parameters,
 * then uses Firecrawl to scrape those URLs and extract structured property data.
 * 
 * Flow:
 * 1. User provides search parameters (location, price, etc.) OR direct URL
 * 2. We build MagicBricks search URL using UrlBuilderService
 * 3. We use Firecrawl's /v2/scrape or /v2/crawl to scrape the URL(s)
 * 4. We use Firecrawl's JSON extraction to get structured property data
 * 5. We transform and validate the data
 * 6. User reviews and imports selected properties
 */

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/cloudSqlService';
import { FirecrawlService } from '../services/firecrawlService';
import { UrlBuilderService } from '../services/urlBuilderService';
import { asyncHandler, createApiError } from '../middleware/errorHandler';
import { validate, scraperSchemas } from '../middleware/validationMiddleware';
// import { requireRole } from '../middleware/authMiddleware'; // Unused import
import { createLogger } from '../utils/logger';
import { 
  ScrapeResult, 
  BulkImportRequest, 
  BulkImportResult, 
  SearchPreset 
} from '../types/scraper';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const logger = createLogger('ScraperRoutes');

/**
 * POST /scrape - Main scraping endpoint (no auth required for testing)
 * Accepts either direct URL or search parameters to build URL
 */
router.post('/scrape', 
  validate(scraperSchemas.scrape),
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = uuidv4();
    logger.info('Scraping request started', { 
      requestId, 
      body: req.body,
      userId: (req as any).user?.id || 'anonymous'
    });

    try {
      const { directUrl, searchParams, useCrawl, maxPages, waitFor, includeTags, excludeTags } = req.body;
      let result: ScrapeResult;

      // Build Firecrawl config from request parameters
      const firecrawlOptions = {
        waitFor,
        includeTags,
        excludeTags
      };

      if (searchParams) {
        // Use search parameters to build URL and scrape
        logger.info('Scraping with search parameters', { requestId, searchParams });
        
        // Validate search parameters
        const validationErrors = UrlBuilderService.validateSearchParams(searchParams);
        if (validationErrors.length > 0) {
          throw createApiError(
            `Invalid search parameters: ${validationErrors.join(', ')}`, 
            400, 
            'INVALID_SEARCH_PARAMS',
            { validationErrors }
          );
        }

        result = await FirecrawlService.scrapeWithSearchParams(searchParams, {
          useCrawl: useCrawl || false,
          maxPages: maxPages || 1,
          firecrawlOptions
        });

      } else if (directUrl) {
        // Use direct URL for scraping
        logger.info('Scraping with direct URL', { requestId, directUrl });

        if (useCrawl && maxPages && maxPages > 1) {
          // Use crawl for multiple pages
          const firecrawlResponse = await FirecrawlService.crawlPropertyPages(directUrl, maxPages, { 
            scrapeOptions: firecrawlOptions // Pass options under scrapeOptions key
          } as any);
          const scrapedProperties = await FirecrawlService.transformFirecrawlData(firecrawlResponse, directUrl);
          
          result = {
            success: true,
            data: scrapedProperties.map(property => ({
              ...property,
              validationErrors: FirecrawlService.validateScrapedProperty(property)
            })),
            metadata: {
              url: directUrl,
              scrapedAt: new Date().toISOString(),
              totalFound: scrapedProperties.length,
              firecrawlJobId: firecrawlResponse.id
            }
          };
        } else {
          // Use single page scrape - RETURN ALL RAW DATA
          const firecrawlResponse = await FirecrawlService.scrapePropertyUrl(directUrl, firecrawlOptions);
          
          logger.info('Raw Firecrawl response received', {
            requestId,
            hasRawData: !!firecrawlResponse.rawFirecrawlData,
            responseKeys: Object.keys(firecrawlResponse),
            dataKeys: Object.keys(firecrawlResponse.data || {})
          });
          
          result = {
            success: true,
            data: firecrawlResponse.data || firecrawlResponse.rawFirecrawlData || [], // Return raw data directly
            rawFirecrawlData: firecrawlResponse.rawFirecrawlData, // Include complete raw response
            metadata: {
              url: directUrl,
              scrapedAt: new Date().toISOString(),
              totalFound: 1, // Single page scrape
              rawDataMode: true,
              firecrawlFormats: firecrawlResponse.rawFirecrawlData ? Object.keys(firecrawlResponse.rawFirecrawlData) : []
            }
          };
        }

      } else {
        // This should not happen due to validation, but just in case
        throw createApiError(
          'Either directUrl or searchParams must be provided', 
          400, 
          'MISSING_REQUIRED_PARAMS'
        );
      }

      logger.info('Scraping request completed successfully', { 
        requestId, 
        totalFound: result.metadata.totalFound,
        success: result.success 
      });

      res.json({
        success: result.success,
        data: result.data,
        rawFirecrawlData: (result as any).rawFirecrawlData, // Include raw Firecrawl data
        metadata: result.metadata,
        requestId
      });

    } catch (error: any) {
      logger.error('Scraping request failed', { 
        requestId, 
        error: error.message, 
        stack: error.stack 
      });

      if (error.statusCode) {
        throw error; // Re-throw API errors
      }

      throw createApiError(
        'Scraping failed: ' + error.message,
        500,
        'SCRAPING_ERROR',
        { requestId, originalError: error.message }
      );
    }
  })
);

/**
 * POST /preview - Preview endpoint (no auth required for testing)
 * Shows what URL would be built and provides preview without full scraping
 */
router.post('/preview',
  validate(scraperSchemas.preview),
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = uuidv4();
    logger.info('Preview request started', { requestId, body: req.body });

    try {
      const { directUrl, searchParams } = req.body;

      if (searchParams) {
        // Build URL from search parameters and return preview
        const validationErrors = UrlBuilderService.validateSearchParams(searchParams);
        if (validationErrors.length > 0) {
          throw createApiError(
            `Invalid search parameters: ${validationErrors.join(', ')}`, 
            400, 
            'INVALID_SEARCH_PARAMS',
            { validationErrors }
          );
        }

        const constructedUrl = UrlBuilderService.buildMagicBricksSearchUrl(searchParams);
        
        res.json({
          success: true,
          data: {
            constructedUrl,
            searchParams,
            estimatedResults: 'Unknown (depends on actual listings)',
            previewNote: 'This URL will be scraped by Firecrawl when you run the full scrape'
          },
          requestId
        });

      } else if (directUrl) {
        // Return preview for direct URL
        res.json({
          success: true,
          data: {
            providedUrl: directUrl,
            previewNote: 'This URL will be scraped by Firecrawl when you run the full scrape'
          },
          requestId
        });

      } else {
        throw createApiError(
          'Either directUrl or searchParams must be provided', 
          400, 
          'MISSING_REQUIRED_PARAMS'
        );
      }

      logger.info('Preview request completed successfully', { requestId });

    } catch (error: any) {
      logger.error('Preview request failed', { 
        requestId, 
        error: error.message 
      });

      if (error.statusCode) {
        throw error;
      }

      throw createApiError(
        'Preview failed: ' + error.message,
        500,
        'PREVIEW_ERROR',
        { requestId }
      );
    }
  })
);

/**
 * POST /import - Bulk import endpoint (no auth required for testing)
 * Imports scraped properties into the database, including C1-processed properties
 */
router.post('/import',
  validate(scraperSchemas.bulkImport),
  asyncHandler(async (req: Request, res: Response) => {
    const requestId = uuidv4();
    logger.info('Bulk import request started', { 
      requestId, 
      propertyCount: req.body.properties?.length,
      userId: (req as any).user?.id 
    });

    try {
      const { properties, skipValidation }: BulkImportRequest = req.body;
      const userId = (req as any).user?.id || null; // Allow anonymous imports for testing
      
      const result: BulkImportResult = {
        success: true,
        imported: 0,
        failed: 0,
        errors: [],
        createdIds: []
      };

      for (let i = 0; i < properties.length; i++) {
        const property = properties[i];
        
        if (!property) {
          result.errors.push({ 
            index: i, 
            error: 'Property data is undefined' 
          });
          result.failed++;
          continue;
        }

        try {
          // Validate property if not skipped
          if (!skipValidation) {
            const validationErrors = FirecrawlService.validateScrapedProperty(property);
            if (validationErrors.length > 0) {
              result.errors.push({ 
                index: i, 
                error: `Validation failed: ${validationErrors.join(', ')}` 
              });
              result.failed++;
              continue;
            }
          }

          // Transform scraped property to database property format
          const isC1Processed = property.c1Metadata?.extractedBy === 'c1';
          
          const dbProperty = {
            title: property.title,
            description: property.description,
            location: property.location,
            price: property.price?.amount || null,
            currency: property.price?.currency || 'INR',
            price_period: property.price?.period || 'monthly',
            area_sqft: property.size?.area || null,
            area_unit: property.size?.unit || 'sqft',
            property_type: 'commercial', // All scraped properties are commercial
            amenities: property.amenities || [],
            features: {
              furnished: property.features?.furnished,
              parking: property.features?.parking,
              wifi: property.features?.wifi,
              ac: property.features?.ac,
              security: property.features?.security,
              cafeteria: property.features?.cafeteria,
              elevator: property.features?.elevator,
              power_backup: property.features?.powerBackup,
              conference_room: property.features?.conferenceRoom
            },
            contact_info: {
              phone: property.contact?.phone,
              email: property.contact?.email,
              contact_person: property.contact?.contactPerson
            },
            media: {
              images: property.media?.images || [],
              videos: property.media?.videos || []
            },
            availability: {
              status: property.availability?.status || 'available',
              available_from: property.availability?.date || null
            },
            source_url: property.sourceUrl,
            scraped_at: property.scrapedAt || new Date().toISOString(),
            search_params: property.searchParams || null,
            created_by: userId || null, // Allow anonymous imports for testing
            status: 'draft', // Import as draft for review
            tags: [
              'imported', 
              'scraped',
              ...(isC1Processed ? ['c1-processed'] : []),
              ...(isC1Processed && property.c1Metadata?.confidence && property.c1Metadata.confidence >= 0.8 ? ['high-confidence'] : [])
            ],
            // Add C1 metadata to the database record if present
            extraction_metadata: isC1Processed && property.c1Metadata ? {
              extractedBy: property.c1Metadata!.extractedBy,
              confidence: property.c1Metadata!.confidence,
              extractionWarnings: property.c1Metadata!.extractionWarnings,
              processedAt: property.c1Metadata!.processedAt,
              fieldsExtracted: property.c1Metadata!.fieldsExtracted,
              fieldsMissing: property.c1Metadata!.fieldsMissing
            } : null
          };

          // Create property in database
          const createdProperty = await DatabaseService.properties.create(dbProperty);
          if (createdProperty?.data?.id) {
            result.createdIds.push(createdProperty.data.id);
            result.imported++;
          } else {
            throw new Error('Failed to create property - no ID returned');
          }

          logger.debug('Property imported successfully', { 
            requestId, 
            index: i, 
            propertyId: createdProperty?.data?.id,
            title: property?.title 
          });

        } catch (propertyError: any) {
          logger.error('Failed to import individual property', { 
            requestId, 
            index: i, 
            error: propertyError.message,
            property: { title: property?.title, sourceUrl: property?.sourceUrl }
          });

          result.errors.push({ 
            index: i, 
            error: propertyError.message 
          });
          result.failed++;
        }
      }

      // Update overall success status
      result.success = result.imported > 0;

      logger.info('Bulk import request completed', { 
        requestId, 
        imported: result.imported, 
        failed: result.failed,
        totalAttempted: properties.length 
      });

      res.json({
        ...result,
        requestId
      });

    } catch (error: any) {
      logger.error('Bulk import request failed', { 
        requestId, 
        error: error.message, 
        stack: error.stack 
      });

      throw createApiError(
        'Bulk import failed: ' + error.message,
        500,
        'BULK_IMPORT_ERROR',
        { requestId }
      );
    }
  })
);

/**
 * GET /history - Get scraping history with source filtering (no auth required for testing)
 * Returns list of previously scraped properties with metadata
 * Query Parameters:
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 20)
 *   - source: Filter by source type ('c1', 'firecrawl', 'manual')
 */
router.get('/history',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const sourceFilter = req.query.source as string;

      // Build WHERE clause based on source filter
      let whereClause = 'WHERE source_url IS NOT NULL';
      let params: any[] = [limit, offset];
      
      if (sourceFilter) {
        // Validate source filter
        if (!['c1', 'firecrawl', 'manual'].includes(sourceFilter)) {
          res.status(400).json({
            success: false,
            error: 'Invalid source filter',
            details: 'Source must be one of: c1, firecrawl, manual'
          });
          return;
        }

        // Add source-specific filtering logic
        switch (sourceFilter) {
          case 'c1':
            // C1-processed properties have 'c1-processed' tag
            whereClause += ` AND id IN (
              SELECT pta.property_id 
              FROM property_tag_assignments pta 
              JOIN property_tags pt ON pta.tag_id = pt.id 
              WHERE pt.name = 'c1-processed' AND pt.is_active = true
            )`;
            break;
          case 'firecrawl':
            // Firecrawl properties have 'scraped' tag but NOT 'c1-processed' tag
            whereClause += ` AND id IN (
              SELECT pta1.property_id 
              FROM property_tag_assignments pta1 
              JOIN property_tags pt1 ON pta1.tag_id = pt1.id 
              WHERE pt1.name = 'scraped' AND pt1.is_active = true
              AND pta1.property_id NOT IN (
                SELECT pta2.property_id 
                FROM property_tag_assignments pta2 
                JOIN property_tags pt2 ON pta2.tag_id = pt2.id 
                WHERE pt2.name = 'c1-processed' AND pt2.is_active = true
              )
            )`;
            break;
          case 'manual':
            // Manual properties have source_url but no 'scraped' tag
            whereClause += ` AND id NOT IN (
              SELECT pta.property_id 
              FROM property_tag_assignments pta 
              JOIN property_tags pt ON pta.tag_id = pt.id 
              WHERE pt.name = 'scraped' AND pt.is_active = true
            )`;
            break;
        }
      }

      // Query properties with sourceUrl (scraped properties)
      const query = `
        SELECT id, title, location, source_url, scraped_at, search_params, created_at, status,
               extraction_metadata
        FROM properties 
        ${whereClause}
        ORDER BY scraped_at DESC, created_at DESC
        LIMIT $1 OFFSET $2
      `;
      
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM properties 
        ${whereClause.replace('LIMIT $1 OFFSET $2', '')}
      `;

      const [properties, countResult] = await Promise.all([
        DatabaseService.query(query, params),
        DatabaseService.query(countQuery, params.slice(2)) // Remove limit and offset for count
      ]);

      const total = parseInt(countResult.data?.rows?.[0]?.total || '0');
      const totalPages = Math.ceil(total / limit);

      // Add source information to each property based on extraction_metadata
      const enhancedProperties = (properties.data?.rows || []).map((property: any) => ({
        ...property,
        source: property.extraction_metadata?.extractedBy || 'manual'
      }));

      res.json({
        success: true,
        data: enhancedProperties,
        filters: {
          source: sourceFilter || 'all',
          availableFilters: ['all', 'c1', 'firecrawl', 'manual']
        },
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        aggregatedStats: {
          totalScraped: total,
          filteredBy: sourceFilter ? `source: ${sourceFilter}` : 'none'
        }
      });

    } catch (error: any) {
      logger.error('Failed to get scraping history', { error: error.message });
      throw createApiError(
        'Failed to retrieve scraping history: ' + error.message,
        500,
        'HISTORY_ERROR'
      );
    }
  })
);

/**
 * POST /presets - Save search preset (no auth required for testing)
 */
router.post('/presets',
  validate(scraperSchemas.savePreset),
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { name, description, searchParams } = req.body;
      const userId = (req as any).user?.id;

      const preset: SearchPreset = {
        id: uuidv4(),
        name,
        description,
        searchParams,
        createdAt: new Date().toISOString()
      };

      // Store preset in database (would need a search_presets table)
      // For now, we'll return the preset as if it was saved
      // TODO: Implement proper database storage for presets

      logger.info('Search preset saved', { 
        presetId: preset.id, 
        name: preset.name, 
        userId 
      });

      res.status(201).json({
        success: true,
        data: preset
      });

    } catch (error: any) {
      logger.error('Failed to save search preset', { error: error.message });
      throw createApiError(
        'Failed to save search preset: ' + error.message,
        500,
        'PRESET_SAVE_ERROR'
      );
    }
  })
);

/**
 * GET /presets - Get saved search presets (no auth required for testing)
 */
router.get('/presets',
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      // TODO: Implement proper database retrieval for presets
      // For now, return empty array
      
      res.json({
        success: true,
        data: [],
        message: 'Preset storage not yet implemented in database schema'
      });

    } catch (error: any) {
      logger.error('Failed to get search presets', { error: error.message });
      throw createApiError(
        'Failed to retrieve search presets: ' + error.message,
        500,
        'PRESET_GET_ERROR'
      );
    }
  })
);

/**
 * GET /presets/:id - Get specific preset (no auth required for testing)
 */
router.get('/presets/:id',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      // const { id } = req.params;
      
      // TODO: Implement proper database retrieval for specific preset
      
      res.json({
        success: false,
        error: 'Preset not found',
        message: 'Preset storage not yet implemented in database schema'
      });

    } catch (error: any) {
      logger.error('Failed to get search preset', { error: error.message, id: req.params.id });
      throw createApiError(
        'Failed to retrieve search preset: ' + error.message,
        500,
        'PRESET_GET_ERROR'
      );
    }
  })
);

/**
 * DELETE /presets/:id - Delete preset (no auth required for testing)
 */
router.delete('/presets/:id',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      
      // TODO: Implement proper database deletion for preset
      
      res.json({
        success: false,
        error: 'Preset not found',
        message: 'Preset storage not yet implemented in database schema'
      });

    } catch (error: any) {
      logger.error('Failed to delete search preset', { error: error.message, id: req.params.id });
      throw createApiError(
        'Failed to delete search preset: ' + error.message,
        500,
        'PRESET_DELETE_ERROR'
      );
    }
  })
);

/**
 * GET /examples - Get example search configurations (no auth required for testing)
 */
router.get('/examples',
  asyncHandler(async (_req: Request, res: Response) => {
    try {
      const examples = UrlBuilderService.getSearchPresetExamples();
      
      res.json({
        success: true,
        data: examples,
        message: 'Example search configurations for quick start'
      });

    } catch (error: any) {
      logger.error('Failed to get search examples', { error: error.message });
      throw createApiError(
        'Failed to retrieve search examples: ' + error.message,
        500,
        'EXAMPLES_ERROR'
      );
    }
  })
);

export default router;