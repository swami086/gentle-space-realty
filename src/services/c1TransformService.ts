/**
 * C1 Transform Service
 * 
 * Frontend service for C1-powered data transformation.
 * Provides API for sending raw Firecrawl data to C1 for intelligent processing.
 */

import { SearchParameters, ScrapedPropertyData } from '../types/scraper';

// C1 Transform Request payload
export interface C1TransformRequest {
  rawFirecrawlData: any;
  sourceUrl: string;
  searchParams?: SearchParameters;
  extractionHints?: string;
}

// C1 Transform Response
export interface C1TransformResponse {
  success: boolean;
  properties: ScrapedPropertyData[];
  metadata: C1TransformMetadata;
  error?: string;
  details?: string;
}

// Transformation metadata from C1
export interface C1TransformMetadata {
  propertiesExtracted: number;
  confidenceScores?: Record<string, number>;
  warnings: string[];
  processingTime: number;
  model: string;
  tokensUsed: number;
  extractionMethod: 'markdown' | 'html' | 'json' | 'mixed';
}

// Progress tracking for transformation operations
export interface TransformationProgress {
  stage: 'validating' | 'extracting' | 'parsing' | 'enriching' | 'completed' | 'error';
  progress: number; // 0-100
  message: string;
  estimatedTimeRemaining?: number;
}

// Event emitter for progress tracking
type ProgressCallback = (progress: TransformationProgress) => void;
type ErrorCallback = (error: Error) => void;

export class C1TransformService {
  private static readonly API_ENDPOINT = '/api/v1/c1/transform-scrape';
  private static readonly TIMEOUT_MS = parseInt(import.meta.env?.REACT_APP_C1_EXTRACTION_TIMEOUT || '60000');
  
  private abortController: AbortController | null = null;

  /**
   * Transform raw Firecrawl data using C1 AI
   */
  async transformFirecrawlData(
    rawData: any,
    sourceUrl: string,
    searchParams?: SearchParameters,
    extractionHints?: string,
    onProgress?: ProgressCallback
  ): Promise<C1TransformResponse> {
    this.abortController = new AbortController();
    
    try {
      // Emit initial progress
      onProgress?.({
        stage: 'validating',
        progress: 0,
        message: 'Validating request data...'
      });

      // Validate inputs
      if (!rawData) {
        throw new Error('Raw Firecrawl data is required');
      }
      if (!sourceUrl) {
        throw new Error('Source URL is required');
      }

      // Prepare request payload
      const requestPayload: C1TransformRequest = {
        rawFirecrawlData: rawData,
        sourceUrl,
        searchParams,
        extractionHints
      };

      onProgress?.({
        stage: 'extracting',
        progress: 20,
        message: 'Sending data to C1 for processing...',
        estimatedTimeRemaining: 45000
      });

      // Make request to C1 transform endpoint
      const response = await fetch(C1TransformService.API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
        signal: this.abortController.signal,
      });

      onProgress?.({
        stage: 'parsing',
        progress: 70,
        message: 'Parsing C1 response...'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const transformResult: C1TransformResponse = await response.json();

      onProgress?.({
        stage: 'enriching',
        progress: 90,
        message: 'Enriching property data...'
      });

      // Validate the response structure
      const validatedResult = this.validateTransformResponse(transformResult);

      onProgress?.({
        stage: 'completed',
        progress: 100,
        message: `Successfully extracted ${validatedResult.properties.length} properties`
      });

      return validatedResult;

    } catch (error) {
      onProgress?.({
        stage: 'error',
        progress: 0,
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      });

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Transformation was cancelled by user');
      }

      throw error;
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Cancel ongoing transformation
   */
  cancelTransformation(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  /**
   * Validate transformed properties against schema
   */
  validateTransformedProperties(properties: any[]): ScrapedPropertyData[] {
    const validatedProperties: ScrapedPropertyData[] = [];
    const errors: string[] = [];

    properties.forEach((property, index) => {
      try {
        // Basic validation - ensure required fields are present
        if (!property.title || typeof property.title !== 'string') {
          errors.push(`Property ${index + 1}: Missing or invalid title`);
          return;
        }

        if (!property.description || typeof property.description !== 'string') {
          errors.push(`Property ${index + 1}: Missing or invalid description`);
          return;
        }

        if (!property.location || typeof property.location !== 'string') {
          errors.push(`Property ${index + 1}: Missing or invalid location`);
          return;
        }

        // Validate optional price structure
        if (property.price && typeof property.price === 'object') {
          if (typeof property.price.amount !== 'number' || property.price.amount < 0) {
            errors.push(`Property ${index + 1}: Invalid price amount`);
            return;
          }
        }

        // Validate optional size structure
        if (property.size && typeof property.size === 'object') {
          if (typeof property.size.area !== 'number' || property.size.area <= 0) {
            errors.push(`Property ${index + 1}: Invalid size area`);
            return;
          }
        }

        validatedProperties.push(property as ScrapedPropertyData);
      } catch (validationError) {
        errors.push(`Property ${index + 1}: ${validationError instanceof Error ? validationError.message : 'Validation failed'}`);
      }
    });

    if (errors.length > 0) {
      console.warn('Property validation warnings:', errors);
    }

    return validatedProperties;
  }

  /**
   * Enrich property data with additional context
   */
  enrichPropertyData(
    property: ScrapedPropertyData,
    additionalContext?: {
      searchQuery?: string;
      userPreferences?: Record<string, any>;
    }
  ): ScrapedPropertyData {
    const enriched = { ...property };

    // Add extraction context if available
    if (additionalContext?.searchQuery) {
      enriched.searchParams = {
        ...enriched.searchParams,
      };
    }

    // Normalize amenities formatting
    if (enriched.amenities) {
      enriched.amenities = enriched.amenities.map(amenity => 
        typeof amenity === 'string' ? amenity.trim() : String(amenity)
      );
    }

    return enriched;
  }

  /**
   * Format transformation summary for display
   */
  formatTransformationSummary(response: C1TransformResponse): string {
    const { properties, metadata } = response;
    
    if (!response.success) {
      return `Transformation failed: ${response.error || 'Unknown error'}`;
    }

    const summary = [];
    summary.push(`Extracted ${properties.length} properties`);
    summary.push(`Processing time: ${(metadata.processingTime / 1000).toFixed(1)}s`);
    summary.push(`Model: ${metadata.model}`);
    summary.push(`Extraction method: ${metadata.extractionMethod}`);

    if (metadata.confidenceScores) {
      const avgConfidence = Object.values(metadata.confidenceScores).reduce((a, b) => a + b, 0) / properties.length;
      summary.push(`Average confidence: ${(avgConfidence * 100).toFixed(0)}%`);
    }

    if (metadata.warnings.length > 0) {
      summary.push(`Warnings: ${metadata.warnings.length}`);
    }

    return summary.join(' • ');
  }

  /**
   * Compare transformed properties with original raw data
   */
  compareWithOriginal(transformed: ScrapedPropertyData[], original: any): {
    extracted: string[];
    missing: string[];
    confidence: number;
  } {
    // This is a simplified comparison - would need more sophisticated logic
    // to actually analyze the original data structure
    const extractedFields = new Set<string>();
    const missingFields = new Set<string>();

    transformed.forEach(property => {
      Object.keys(property).forEach(key => {
        if (property[key as keyof ScrapedPropertyData] !== undefined) {
          extractedFields.add(key);
        }
      });
    });

    // Basic confidence calculation
    const totalPossibleFields = 12; // Approximate number of schema fields
    const confidence = Math.min(extractedFields.size / totalPossibleFields, 1.0);

    return {
      extracted: Array.from(extractedFields),
      missing: Array.from(missingFields),
      confidence
    };
  }

  /**
   * Convert numeric confidence score to human-readable level
   */
  getConfidenceLevel(score: number): 'high' | 'medium' | 'low' {
    if (score >= 0.8) return 'high';
    if (score >= 0.5) return 'medium';
    return 'low';
  }

  /**
   * Get confidence level color for UI display
   */
  getConfidenceColor(score: number): string {
    const level = this.getConfidenceLevel(score);
    switch (level) {
      case 'high': return '#22c55e'; // green
      case 'medium': return '#f59e0b'; // yellow
      case 'low': return '#ef4444'; // red
      default: return '#6b7280'; // gray
    }
  }

  /**
   * Validate the transform response structure
   */
  private validateTransformResponse(response: any): C1TransformResponse {
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid response format from C1 API');
    }

    if (!response.success && !response.error) {
      throw new Error('Response must include success flag or error message');
    }

    if (response.success && !Array.isArray(response.properties)) {
      throw new Error('Successful response must include properties array');
    }

    if (!response.metadata || typeof response.metadata !== 'object') {
      throw new Error('Response must include metadata object');
    }

    return response as C1TransformResponse;
  }

  /**
   * Check if C1 extraction is enabled via environment
   */
  static isEnabled(): boolean {
    return import.meta.env?.REACT_APP_C1_EXTRACTION_ENABLED !== 'false';
  }

  /**
   * Get extraction timeout from environment
   */
  static getTimeout(): number {
    return C1TransformService.TIMEOUT_MS;
  }
}