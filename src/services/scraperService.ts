/**
 * Frontend Scraper Service
 * 
 * Handles API calls to the backend scraper endpoints for property scraping functionality.
 * 
 * Features:
 * - Dynamic search parameter validation
 * - MagicBricks URL preview generation
 * - Property scraping with Firecrawl integration
 * - Bulk property import with progress tracking
 * - Search preset management
 * - Scraping history retrieval
 */

import {
  SearchParameters,
  ScrapeRequest,
  ScrapeResponse,
  PreviewRequest,
  PreviewResponse,
  ImportRequest,
  ImportResponse,
  HistoryResponse,
  SavePresetRequest,
  SavePresetResponse,
  GetPresetsResponse,
  GetExamplesResponse,
  SearchParametersFormData,
  SearchParametersFormErrors,
  ScrapedPropertyData,
  ScraperConfig,
  isValidPropertyType,
  isValidFurnishedStatus,
  isValidAvailability,
  isValidSortBy
} from '../types/scraper';

const API_BASE = '/api/v1/scraper';

/**
 * Validation utilities
 */
export class ScraperValidation {
  /**
   * Validate search parameters form data
   */
  static validateSearchForm(formData: SearchParametersFormData): {
    isValid: boolean;
    errors: SearchParametersFormErrors;
    searchParams?: SearchParameters;
  } {
    const errors: SearchParametersFormErrors = {};

    // Location validation (optional but recommended)
    if (formData.location && formData.location.trim().length < 2) {
      errors.location = 'Location must be at least 2 characters';
    }

    // Property type validation
    if (formData.propertyType && !isValidPropertyType(formData.propertyType)) {
      errors.propertyType = 'Invalid property type selected';
    }

    // Price range validation
    const minPrice = formData.minPrice ? parseFloat(formData.minPrice) : null;
    const maxPrice = formData.maxPrice ? parseFloat(formData.maxPrice) : null;

    if (formData.minPrice && (isNaN(minPrice!) || minPrice! < 0)) {
      errors.minPrice = 'Minimum price must be a positive number';
    }
    if (formData.maxPrice && (isNaN(maxPrice!) || maxPrice! < 0)) {
      errors.maxPrice = 'Maximum price must be a positive number';
    }
    if (minPrice && maxPrice && minPrice >= maxPrice) {
      errors.maxPrice = 'Maximum price must be greater than minimum price';
    }

    // Area range validation
    const minArea = formData.minArea ? parseFloat(formData.minArea) : null;
    const maxArea = formData.maxArea ? parseFloat(formData.maxArea) : null;

    if (formData.minArea && (isNaN(minArea!) || minArea! < 0)) {
      errors.minArea = 'Minimum area must be a positive number';
    }
    if (formData.maxArea && (isNaN(maxArea!) || maxArea! < 0)) {
      errors.maxArea = 'Maximum area must be a positive number';
    }
    if (minArea && maxArea && minArea >= maxArea) {
      errors.maxArea = 'Maximum area must be greater than minimum area';
    }

    // Furnished status validation
    if (formData.furnished && !isValidFurnishedStatus(formData.furnished)) {
      errors.furnished = 'Invalid furnished status selected';
    }

    // Availability validation
    if (formData.availability && !isValidAvailability(formData.availability)) {
      errors.availability = 'Invalid availability option selected';
    }

    // Sort by validation
    if (formData.sortBy && !isValidSortBy(formData.sortBy)) {
      errors.sortBy = 'Invalid sort option selected';
    }

    const isValid = Object.keys(errors).length === 0;

    let searchParams: SearchParameters | undefined;
    if (isValid) {
      searchParams = this.formDataToSearchParams(formData);
    }

    return {
      isValid,
      errors,
      searchParams
    };
  }

  /**
   * Convert form data to search parameters
   */
  static formDataToSearchParams(formData: SearchParametersFormData): SearchParameters {
    const searchParams: SearchParameters = {};

    // String fields
    if (formData.location?.trim()) {
      searchParams.location = formData.location.trim();
    }
    if (formData.propertyType && isValidPropertyType(formData.propertyType)) {
      searchParams.propertyType = formData.propertyType;
    }
    if (formData.furnished && isValidFurnishedStatus(formData.furnished)) {
      searchParams.furnished = formData.furnished;
    }
    if (formData.availability && isValidAvailability(formData.availability)) {
      searchParams.availability = formData.availability;
    }
    if (formData.sortBy && isValidSortBy(formData.sortBy)) {
      searchParams.sortBy = formData.sortBy;
    }

    // Numeric fields
    if (formData.minPrice) {
      const minPrice = parseFloat(formData.minPrice);
      if (!isNaN(minPrice) && minPrice > 0) {
        searchParams.minPrice = minPrice;
      }
    }
    if (formData.maxPrice) {
      const maxPrice = parseFloat(formData.maxPrice);
      if (!isNaN(maxPrice) && maxPrice > 0) {
        searchParams.maxPrice = maxPrice;
      }
    }
    if (formData.minArea) {
      const minArea = parseFloat(formData.minArea);
      if (!isNaN(minArea) && minArea > 0) {
        searchParams.minArea = minArea;
      }
    }
    if (formData.maxArea) {
      const maxArea = parseFloat(formData.maxArea);
      if (!isNaN(maxArea) && maxArea > 0) {
        searchParams.maxArea = maxArea;
      }
    }

    // Amenities array
    if (formData.amenities && formData.amenities.length > 0) {
      searchParams.amenities = formData.amenities.filter(a => a.trim().length > 0);
    }

    return searchParams;
  }

  /**
   * Convert search parameters to form data
   */
  static searchParamsToFormData(searchParams: SearchParameters): SearchParametersFormData {
    return {
      location: searchParams.location || '',
      propertyType: searchParams.propertyType || '',
      minPrice: searchParams.minPrice ? searchParams.minPrice.toString() : '',
      maxPrice: searchParams.maxPrice ? searchParams.maxPrice.toString() : '',
      minArea: searchParams.minArea ? searchParams.minArea.toString() : '',
      maxArea: searchParams.maxArea ? searchParams.maxArea.toString() : '',
      furnished: searchParams.furnished || '',
      availability: searchParams.availability || '',
      amenities: searchParams.amenities || [],
      sortBy: searchParams.sortBy || ''
    };
  }
}

/**
 * Main scraper service class
 */
export class ScraperService {
  /**
   * Preview a search URL without scraping
   */
  static async previewSearch(request: PreviewRequest): Promise<PreviewResponse> {
    try {
      const response = await fetch(`${API_BASE}/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Preview search failed:', error);
      throw error;
    }
  }

  /**
   * Scrape properties using search parameters or direct URL
   */
  static async scrapeProperties(request: ScrapeRequest): Promise<ScrapeResponse> {
    try {
      // Create AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 150000); // 2.5 minutes timeout

      const response = await fetch(`${API_BASE}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Property scraping failed:', error);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Scraping request timeout - the operation took too long to complete');
        }
      }
      
      throw error;
    }
  }

  /**
   * Import scraped properties into the database
   */
  static async importProperties(request: ImportRequest): Promise<ImportResponse> {
    try {
      const response = await fetch(`${API_BASE}/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Property import failed:', error);
      throw error;
    }
  }

  /**
   * Get scraping history with pagination
   */
  static async getHistory(page = 1, limit = 20): Promise<HistoryResponse> {
    try {
      const response = await fetch(`${API_BASE}/history?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get scraping history failed:', error);
      throw error;
    }
  }

  /**
   * Save a search preset
   */
  static async savePreset(request: SavePresetRequest): Promise<SavePresetResponse> {
    try {
      const response = await fetch(`${API_BASE}/presets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Save preset failed:', error);
      throw error;
    }
  }

  /**
   * Get saved search presets
   */
  static async getPresets(): Promise<GetPresetsResponse> {
    try {
      const response = await fetch(`${API_BASE}/presets`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get presets failed:', error);
      throw error;
    }
  }

  /**
   * Get search configuration examples
   */
  static async getExamples(): Promise<GetExamplesResponse> {
    try {
      const response = await fetch(`${API_BASE}/examples`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Get examples failed:', error);
      throw error;
    }
  }

  /**
   * Delete a search preset
   */
  static async deletePreset(presetId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${API_BASE}/presets/${presetId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Delete preset failed:', error);
      throw error;
    }
  }
}

/**
 * Utility functions for property data handling
 */
export class PropertyUtils {
  /**
   * Format property price for display
   */
  static formatPrice(price?: { amount: number; currency: string; period: string }): string {
    if (!price || !price.amount) return 'Price not specified';

    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: price.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });

    const formattedAmount = formatter.format(price.amount);
    const period = price.period === 'monthly' ? '/month' : 
                  price.period === 'yearly' ? '/year' : '';

    return `${formattedAmount}${period}`;
  }

  /**
   * Format property area for display
   */
  static formatArea(size?: { area: number; unit: string }): string {
    if (!size || !size.area) return 'Area not specified';

    const formattedArea = new Intl.NumberFormat('en-IN').format(size.area);
    const unit = size.unit === 'sqft' ? 'sq ft' : size.unit;

    return `${formattedArea} ${unit}`;
  }

  /**
   * Get property status color for UI
   */
  static getStatusColor(status: string): string {
    switch (status) {
      case 'available':
        return 'text-green-600 bg-green-100';
      case 'occupied':
        return 'text-red-600 bg-red-100';
      case 'coming-soon':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  /**
   * Extract validation errors for display
   */
  static formatValidationErrors(property: ScrapedPropertyData): string[] {
    return property.validationErrors || [];
  }

  /**
   * Check if property has required data for import
   */
  static isValidForImport(property: ScrapedPropertyData): boolean {
    return !!(
      property.title &&
      property.description &&
      property.location &&
      property.sourceUrl &&
      (!property.validationErrors || property.validationErrors.length === 0)
    );
  }

  /**
   * Generate property summary for preview
   */
  static generateSummary(property: ScrapedPropertyData): string {
    const parts = [];
    
    if (property.title) {
      parts.push(property.title);
    }
    
    if (property.location) {
      parts.push(`in ${property.location}`);
    }
    
    if (property.price) {
      parts.push(`• ${this.formatPrice(property.price)}`);
    }
    
    if (property.size) {
      parts.push(`• ${this.formatArea(property.size)}`);
    }

    return parts.join(' ');
  }
}

/**
 * Progress tracking utilities for bulk operations
 */
export class ProgressTracker {
  private onProgress?: (progress: number, status: string) => void;

  constructor(onProgress?: (progress: number, status: string) => void) {
    this.onProgress = onProgress;
  }

  /**
   * Track scraping progress
   */
  trackScraping(currentStep: string, totalSteps: number, currentStep_num: number) {
    const progress = (currentStep_num / totalSteps) * 100;
    this.onProgress?.(progress, `Scraping: ${currentStep}`);
  }

  /**
   * Track import progress
   */
  trackImporting(imported: number, total: number) {
    const progress = (imported / total) * 100;
    this.onProgress?.(progress, `Importing: ${imported}/${total} properties`);
  }

  /**
   * Set completion status
   */
  complete(message: string) {
    this.onProgress?.(100, message);
  }

  /**
   * Set error status
   */
  error(message: string) {
    this.onProgress?.(0, `Error: ${message}`);
  }
}

// Export everything as default for easy importing
export default {
  ScraperService,
  ScraperValidation,
  PropertyUtils,
  ProgressTracker
};