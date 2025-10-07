/**
 * SearchParametersForm Component
 * 
 * Form component for defining search parameters for property scraping.
 * Allows users to specify location, property type, price range, amenities, etc.
 * to build MagicBricks search URLs for scraping.
 */

import React, { useState, useEffect } from 'react';
import { Search, MapPin, Building, DollarSign, Home, Calendar, Package, ArrowUpDown, Plus, X, Eye, Link, Settings } from 'lucide-react';
import {
  SearchParameters,
  SearchParametersFormData,
  SearchParametersFormErrors,
  PROPERTY_TYPES,
  FURNISHED_OPTIONS,
  AVAILABILITY_OPTIONS,
  SORT_OPTIONS,
  COMMON_AMENITIES,
  DEFAULT_SEARCH_PARAMS
} from '../../types/scraper';
import { ScraperValidation } from '../../services/scraperService';

interface SearchParametersFormProps {
  onSubmit: (searchParams: SearchParameters) => void;
  onPreview?: (searchParams: SearchParameters) => void;
  isLoading?: boolean;
  initialValues?: SearchParameters;
  showPreview?: boolean;
  className?: string;
}

export const SearchParametersForm: React.FC<SearchParametersFormProps> = ({
  onSubmit,
  onPreview,
  isLoading = false,
  initialValues,
  showPreview = true,
  className = ''
}) => {
  // Form mode state
  const [inputMode, setInputMode] = useState<'search' | 'url'>('search');
  const [directUrl, setDirectUrl] = useState('');
  const [urlError, setUrlError] = useState<string>('');

  // Initialize form data
  const [formData, setFormData] = useState<SearchParametersFormData>(() => {
    if (initialValues) {
      return ScraperValidation.searchParamsToFormData(initialValues);
    }
    return {
      location: '',
      propertyType: DEFAULT_SEARCH_PARAMS.propertyType || '',
      minPrice: '',
      maxPrice: '',
      minArea: '',
      maxArea: '',
      furnished: DEFAULT_SEARCH_PARAMS.furnished || '',
      availability: DEFAULT_SEARCH_PARAMS.availability || '',
      amenities: [],
      sortBy: DEFAULT_SEARCH_PARAMS.sortBy || ''
    };
  });

  const [errors, setErrors] = useState<SearchParametersFormErrors>({});
  const [customAmenity, setCustomAmenity] = useState('');

  // Update form when initial values change
  useEffect(() => {
    if (initialValues) {
      setFormData(ScraperValidation.searchParamsToFormData(initialValues));
    }
  }, [initialValues]);

  /**
   * Handle form field changes
   */
  const handleChange = (field: keyof SearchParametersFormData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Add amenity to the list
   */
  const addAmenity = (amenity: string) => {
    if (amenity && !formData.amenities.includes(amenity)) {
      handleChange('amenities', [...formData.amenities, amenity]);
    }
  };

  /**
   * Remove amenity from the list
   */
  const removeAmenity = (amenity: string) => {
    handleChange('amenities', formData.amenities.filter(a => a !== amenity));
  };

  /**
   * Add custom amenity
   */
  const addCustomAmenity = () => {
    if (customAmenity.trim()) {
      addAmenity(customAmenity.trim().toLowerCase());
      setCustomAmenity('');
    }
  };

  /**
   * Validate URL format
   */
  const validateUrl = (url: string): string => {
    if (!url.trim()) {
      return 'URL is required';
    }
    
    try {
      const urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return 'URL must use HTTP or HTTPS protocol';
      }
      return '';
    } catch {
      return 'Please enter a valid URL (e.g., https://example.com)';
    }
  };

  /**
   * Handle URL input change
   */
  const handleUrlChange = (url: string) => {
    setDirectUrl(url);
    setUrlError(validateUrl(url));
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (inputMode === 'url') {
      // Validate and submit direct URL
      const urlValidationError = validateUrl(directUrl);
      if (urlValidationError) {
        setUrlError(urlValidationError);
        return;
      }
      
      // Submit with directUrl - the parent component should handle this
      (onSubmit as any)({ directUrl });
    } else {
      // Validate and submit search parameters
      const validation = ScraperValidation.validateSearchForm(formData);
      
      if (!validation.isValid) {
        setErrors(validation.errors);
        return;
      }

      if (validation.searchParams) {
        onSubmit(validation.searchParams);
      }
    }
  };

  /**
   * Handle preview
   */
  const handlePreview = () => {
    if (inputMode === 'url') {
      // Preview direct URL
      const urlValidationError = validateUrl(directUrl);
      if (urlValidationError) {
        setUrlError(urlValidationError);
        return;
      }
      
      if (onPreview) {
        (onPreview as any)({ directUrl });
      }
    } else {
      // Preview search parameters
      const validation = ScraperValidation.validateSearchForm(formData);
      
      if (!validation.isValid) {
        setErrors(validation.errors);
        return;
      }

      if (validation.searchParams && onPreview) {
        onPreview(validation.searchParams);
      }
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <Search className="h-5 w-5 text-blue-600" />
          Property Scraper
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          Find properties using search parameters or scrape a specific URL
        </p>
      </div>

      {/* Input Mode Toggle */}
      <div className="mb-6">
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => {
              setInputMode('search');
              setUrlError('');
              setErrors({});
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              inputMode === 'search'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Settings className="h-4 w-4" />
            Search Parameters
          </button>
          <button
            type="button"
            onClick={() => {
              setInputMode('url');
              setErrors({});
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              inputMode === 'url'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            <Link className="h-4 w-4" />
            Direct URL
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {inputMode === 'url' ? (
          /* Direct URL Input */
          <div className="space-y-4">
            <div>
              <label htmlFor="directUrl" className="block text-sm font-medium text-gray-700 mb-2">
                <Link className="h-4 w-4 inline mr-1" />
                Property URL
              </label>
              <input
                type="url"
                id="directUrl"
                value={directUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://www.magicbricks.com/property/..."
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  urlError ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {urlError && (
                <p className="mt-1 text-sm text-red-600">{urlError}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Enter any property listing URL to scrape it directly. Works with MagicBricks, 99acres, and other real estate sites.
              </p>
            </div>

            {/* URL scraping options */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3 text-sm">Scraping Options</h4>
              <div className="text-xs text-gray-600 space-y-1">
                <p>• Single page scraping extracts property details from the URL</p>
                <p>• Multi-page crawling follows pagination links automatically</p>
                <p>• Uses AI extraction to get structured property data</p>
              </div>
            </div>
          </div>
        ) : (
          /* Search Parameters Form */
          <div className="space-y-6">
        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="h-4 w-4 inline mr-1" />
            Location
          </label>
          <input
            type="text"
            id="location"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
            placeholder="e.g., Bangalore, Mumbai, Delhi..."
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.location ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.location && (
            <p className="mt-1 text-sm text-red-600">{errors.location}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Optional but recommended for better search results
          </p>
        </div>

        {/* Property Type */}
        <div>
          <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-2">
            <Building className="h-4 w-4 inline mr-1" />
            Property Type
          </label>
          <select
            id="propertyType"
            value={formData.propertyType}
            onChange={(e) => handleChange('propertyType', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.propertyType ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Select property type...</option>
            {PROPERTY_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.propertyType && (
            <p className="mt-1 text-sm text-red-600">{errors.propertyType}</p>
          )}
        </div>

        {/* Price Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="minPrice" className="block text-sm font-medium text-gray-700 mb-2">
              <DollarSign className="h-4 w-4 inline mr-1" />
              Min Price (INR)
            </label>
            <input
              type="number"
              id="minPrice"
              value={formData.minPrice}
              onChange={(e) => handleChange('minPrice', e.target.value)}
              placeholder="e.g., 50000"
              min="0"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.minPrice ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.minPrice && (
              <p className="mt-1 text-sm text-red-600">{errors.minPrice}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-2">
              Max Price (INR)
            </label>
            <input
              type="number"
              id="maxPrice"
              value={formData.maxPrice}
              onChange={(e) => handleChange('maxPrice', e.target.value)}
              placeholder="e.g., 500000"
              min="0"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.maxPrice ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.maxPrice && (
              <p className="mt-1 text-sm text-red-600">{errors.maxPrice}</p>
            )}
          </div>
        </div>

        {/* Area Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="minArea" className="block text-sm font-medium text-gray-700 mb-2">
              Min Area (sq ft)
            </label>
            <input
              type="number"
              id="minArea"
              value={formData.minArea}
              onChange={(e) => handleChange('minArea', e.target.value)}
              placeholder="e.g., 500"
              min="0"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.minArea ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.minArea && (
              <p className="mt-1 text-sm text-red-600">{errors.minArea}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="maxArea" className="block text-sm font-medium text-gray-700 mb-2">
              Max Area (sq ft)
            </label>
            <input
              type="number"
              id="maxArea"
              value={formData.maxArea}
              onChange={(e) => handleChange('maxArea', e.target.value)}
              placeholder="e.g., 5000"
              min="0"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.maxArea ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.maxArea && (
              <p className="mt-1 text-sm text-red-600">{errors.maxArea}</p>
            )}
          </div>
        </div>

        {/* Furnished Status */}
        <div>
          <label htmlFor="furnished" className="block text-sm font-medium text-gray-700 mb-2">
            <Home className="h-4 w-4 inline mr-1" />
            Furnished Status
          </label>
          <select
            id="furnished"
            value={formData.furnished}
            onChange={(e) => handleChange('furnished', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.furnished ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Any furnished status...</option>
            {FURNISHED_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.furnished && (
            <p className="mt-1 text-sm text-red-600">{errors.furnished}</p>
          )}
        </div>

        {/* Availability */}
        <div>
          <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="h-4 w-4 inline mr-1" />
            Availability
          </label>
          <select
            id="availability"
            value={formData.availability}
            onChange={(e) => handleChange('availability', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
              errors.availability ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            <option value="">Any availability...</option>
            {AVAILABILITY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.availability && (
            <p className="mt-1 text-sm text-red-600">{errors.availability}</p>
          )}
        </div>

        {/* Amenities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Package className="h-4 w-4 inline mr-1" />
            Amenities
          </label>
          
          {/* Common amenities */}
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-2">Common amenities:</p>
            <div className="flex flex-wrap gap-2">
              {COMMON_AMENITIES.map(amenity => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => addAmenity(amenity)}
                  disabled={formData.amenities.includes(amenity)}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    formData.amenities.includes(amenity)
                      ? 'bg-blue-100 text-blue-800 border-blue-200 cursor-not-allowed'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {amenity.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Custom amenity input */}
          <div className="mb-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={customAmenity}
                onChange={(e) => setCustomAmenity(e.target.value)}
                placeholder="Add custom amenity..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomAmenity();
                  }
                }}
              />
              <button
                type="button"
                onClick={addCustomAmenity}
                disabled={!customAmenity.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Selected amenities */}
          {formData.amenities.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Selected amenities:</p>
              <div className="flex flex-wrap gap-2">
                {formData.amenities.map(amenity => (
                  <span
                    key={amenity}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full flex items-center gap-1"
                  >
                    {amenity.replace('-', ' ')}
                    <button
                      type="button"
                      onClick={() => removeAmenity(amenity)}
                      className="hover:text-blue-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {errors.amenities && (
            <p className="mt-1 text-sm text-red-600">{errors.amenities}</p>
          )}
        </div>

            {/* Sort By */}
            <div>
              <label htmlFor="sortBy" className="block text-sm font-medium text-gray-700 mb-2">
                <ArrowUpDown className="h-4 w-4 inline mr-1" />
                Sort Results By
              </label>
              <select
                id="sortBy"
                value={formData.sortBy}
                onChange={(e) => handleChange('sortBy', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.sortBy ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.sortBy && (
                <p className="mt-1 text-sm text-red-600">{errors.sortBy}</p>
              )}
            </div>
          </div>
        )}

        {/* General error */}
        {(errors.general || urlError) && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{errors.general || urlError}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {showPreview && onPreview && (
            <button
              type="button"
              onClick={handlePreview}
              disabled={isLoading || (inputMode === 'url' && !directUrl.trim()) || (inputMode === 'search' && !formData.location)}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className="h-4 w-4" />
              {inputMode === 'url' ? 'Preview URL' : 'Preview Search'}
            </button>
          )}
          
          <button
            type="submit"
            disabled={isLoading || (inputMode === 'url' && (!directUrl.trim() || !!urlError))}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
          >
            <Search className="h-4 w-4" />
            {isLoading ? (inputMode === 'url' ? 'Scraping URL...' : 'Searching...') : 'Start Scraping'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SearchParametersForm;