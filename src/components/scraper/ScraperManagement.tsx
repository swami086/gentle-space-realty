/**
 * ScraperManagement Component
 * 
 * Main component for managing property scraping operations.
 * Orchestrates the complete workflow from search parameter definition to property import.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Download,
  Eye,
  CheckSquare,
  Square,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  History,
  Settings,
  RefreshCw,
  ExternalLink,
  Info,
  Upload
} from 'lucide-react';

import {
  SearchParameters,
  ScrapedPropertyData,
  ScrapeResult,
  ScraperState,
  BulkImportResult,
  SearchPreset,
  C1TransformMetadata,
  isC1ProcessedProperty,
  getConfidenceLevel
} from '../../types/scraper';

import {
  ScraperService,
  PropertyUtils,
  ProgressTracker
} from '../../services/scraperService';

import { C1TransformService } from '../../services/c1TransformService';
import { C1PropertyReview } from './C1PropertyReview';
import { C1UISpecRenderer } from './C1UISpecRenderer';

// Removed SearchParametersForm import - using direct URL input only

// Direct URL Form Component
interface DirectUrlFormProps {
  onSubmit: (directUrl: string) => void;
  onPreview: (directUrl: string) => void;
  isLoading: boolean;
  showPreview: boolean;
}

const DirectUrlForm: React.FC<DirectUrlFormProps> = ({ onSubmit, onPreview, isLoading, showPreview }) => {
  const [directUrl, setDirectUrl] = useState('');
  const [urlError, setUrlError] = useState('');

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

  const handleUrlChange = (url: string) => {
    setDirectUrl(url);
    setUrlError(validateUrl(url));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateUrl(directUrl);
    if (validationError) {
      setUrlError(validationError);
      return;
    }
    onSubmit(directUrl);
  };

  const handlePreview = () => {
    const validationError = validateUrl(directUrl);
    if (validationError) {
      setUrlError(validationError);
      return;
    }
    onPreview(directUrl);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
          <ExternalLink className="h-5 w-5 text-blue-600" />
          Direct URL Scraper
        </h2>
        <p className="text-gray-600 text-sm mt-1">
          Enter any property listing URL to scrape it directly
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="directUrl" className="block text-sm font-medium text-gray-700 mb-2">
            <ExternalLink className="h-4 w-4 inline mr-1" />
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

        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3 text-sm">Scraping Features</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <p>• Single page scraping extracts property details from the URL</p>
            <p>• AI-powered extraction gets structured property data</p>
            <p>• C1 processing available for enhanced data quality</p>
            <p>• Raw data preserved for manual review and processing</p>
          </div>
        </div>

        {urlError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{urlError}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          {showPreview && (
            <button
              type="button"
              onClick={handlePreview}
              disabled={isLoading || !directUrl.trim()}
              className="flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Eye className="h-4 w-4" />
              Preview URL
            </button>
          )}
          
          <button
            type="submit"
            disabled={isLoading || !directUrl.trim() || !!urlError}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex-1 sm:flex-none"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Scraping URL...' : 'Start Scraping'}
          </button>
        </div>
      </form>
    </div>
  );
};

interface ScraperManagementProps {
  className?: string;
}

export const ScraperManagement: React.FC<ScraperManagementProps> = ({
  className = ''
}) => {
  // Main state
  const [state, setState] = useState<ScraperState>({
    isLoading: false,
    error: null,
    scrapeResults: null,
    rawData: null, // Store raw Firecrawl data for display
    selectedProperties: [],
    importProgress: {
      isImporting: false,
      progress: 0,
      status: ''
    },
    history: [],
    presets: [],
    examples: [],
    displayMode: 'processed', // Display mode for data: processed | raw | both | c1-processed
    
    // C1 transformation state
    c1TransformInProgress: false,
    c1ExtractedProperties: null,
    c1TransformError: null,
    showC1Review: false,
    c1TransformMetadata: null,
    
    // C1 UI specification state
    c1UISpecResponse: null,
    showC1UISpec: false
  });

  // C1 Transform Service instance
  const c1Service = new C1TransformService();

  // UI state
  const [activeTab, setActiveTab] = useState<'search' | 'results' | 'history' | 'presets'>('search');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [importSettings, setImportSettings] = useState({
    skipValidation: false,
    overwriteExisting: false
  });

  // Progress tracker
  const progressTracker = new ProgressTracker((progress, status) => {
    setState(prev => ({
      ...prev,
      importProgress: {
        ...prev.importProgress,
        progress,
        status
      }
    }));
  });

  /**
   * Load initial data
   */
  useEffect(() => {
    loadExamples();
    loadPresets();
    loadHistory();
  }, []);

  /**
   * Load search examples
   */
  const loadExamples = async () => {
    try {
      const response = await ScraperService.getExamples();
      setState(prev => ({
        ...prev,
        examples: response.data
      }));
    } catch (error) {
      console.error('Failed to load examples:', error);
    }
  };

  /**
   * Load saved presets
   */
  const loadPresets = async () => {
    try {
      const response = await ScraperService.getPresets();
      setState(prev => ({
        ...prev,
        presets: response.data
      }));
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  };

  /**
   * Load scraping history
   */
  const loadHistory = async () => {
    try {
      const response = await ScraperService.getHistory();
      setState(prev => ({
        ...prev,
        history: response.data
      }));
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  /**
   * Handle URL preview (direct URL only)
   */
  const handlePreview = async (directUrl: string) => {
    setState(prev => ({ ...prev, error: null }));
    
    try {
      const response = await ScraperService.previewSearch({ directUrl });
      if (response.success && response.data?.providedUrl) {
        setPreviewUrl(response.data.providedUrl);
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Preview failed'
      }));
    }
  };

  /**
   * Handle property scraping (direct URL only)
   */
  const handleScrape = async (directUrl: string) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      scrapeResults: null
    }));

    try {
      // Direct URL scraping only
      progressTracker.trackScraping('Preparing to scrape URL', 4, 1);
      progressTracker.trackScraping('Scraping page', 4, 2);
      
      const response = await ScraperService.scrapeProperties({
        directUrl,
        useCrawl: false,
        maxPages: 1
      });

      progressTracker.trackScraping('Extracting data', 4, 3);
      progressTracker.trackScraping('Transforming results', 4, 4);

      if (response.success) {
        setState(prev => ({
          ...prev,
          scrapeResults: {
            success: true,
            data: response.data || [],
            rawFirecrawlData: response.rawFirecrawlData, // Include raw Firecrawl data
            metadata: response.metadata
          },
          rawData: response.rawFirecrawlData, // Store raw data separately for display
          selectedProperties: response.data || [],
          displayMode: response.rawFirecrawlData ? 'both' : 'processed' // Auto-detect display mode
        }));
        
        setActiveTab('results');
        progressTracker.complete(`Found ${response.data?.length || 0} properties`);
      } else {
        throw new Error(response.error || 'Scraping failed');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Scraping failed';
      setState(prev => ({
        ...prev,
        error: errorMessage
      }));
      progressTracker.error(errorMessage);
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  /**
   * Handle property selection for import
   */
  const handlePropertySelection = (property: ScrapedPropertyData, selected: boolean) => {
    setState(prev => ({
      ...prev,
      selectedProperties: selected 
        ? [...prev.selectedProperties, property]
        : prev.selectedProperties.filter(p => p.sourceUrl !== property.sourceUrl)
    }));
  };

  /**
   * Handle select all/none
   */
  const handleSelectAll = (selectAll: boolean) => {
    setState(prev => ({
      ...prev,
      selectedProperties: selectAll ? (prev.scrapeResults?.data || []) : []
    }));
  };

  /**
   * Handle property import
   */
  const handleImport = async () => {
    if (state.selectedProperties.length === 0) {
      setState(prev => ({ ...prev, error: 'No properties selected for import' }));
      return;
    }

    setState(prev => ({
      ...prev,
      importProgress: {
        isImporting: true,
        progress: 0,
        status: 'Starting import...'
      },
      error: null
    }));

    try {
      const response = await ScraperService.importProperties({
        properties: state.selectedProperties,
        skipValidation: importSettings.skipValidation,
        overwriteExisting: importSettings.overwriteExisting
      });

      progressTracker.trackImporting(response.imported, state.selectedProperties.length);

      if (response.success) {
        progressTracker.complete(`Successfully imported ${response.imported} properties`);
        
        // Reload history
        loadHistory();
        
        // Clear results
        setState(prev => ({
          ...prev,
          scrapeResults: null,
          selectedProperties: []
        }));
        
        setActiveTab('history');
      } else {
        throw new Error('Import failed');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Import failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      progressTracker.error(errorMessage);
    } finally {
      setState(prev => ({
        ...prev,
        importProgress: {
          isImporting: false,
          progress: 0,
          status: ''
        }
      }));
    }
  };

  /**
   * Clear current results
   */
  const clearResults = () => {
    setState(prev => ({
      ...prev,
      scrapeResults: null,
      selectedProperties: [],
      error: null,
      // Clear C1 state as well
      c1TransformInProgress: false,
      c1ExtractedProperties: null,
      c1TransformError: null,
      showC1Review: false,
      c1TransformMetadata: null,
      c1UISpecResponse: null,
      showC1UISpec: false
    }));
    setPreviewUrl(null);
    setActiveTab('search');
  };

  /**
   * Handle C1 transformation of raw Firecrawl data
   */
  const handleC1Transform = async () => {
    if (!state.rawData) {
      setState(prev => ({ ...prev, error: 'No raw data available for C1 processing' }));
      return;
    }

    setState(prev => ({
      ...prev,
      c1TransformInProgress: true,
      c1TransformError: null,
      error: null
    }));

    try {
      const response = await c1Service.transformFirecrawlData(
        state.rawData,
        state.scrapeResults?.metadata.url || 'unknown',
        state.scrapeResults?.metadata.searchParams,
        undefined, // extractionHints
        (progress) => {
          // Update progress in state if needed
          setState(prev => ({
            ...prev,
            importProgress: {
              isImporting: false,
              progress: progress.progress,
              status: progress.message
            }
          }));
        }
      );

      if (response.success) {
        // Check if this is a UI specification response or traditional property extraction
        if (response.uiSpec) {
          // Handle UI specification response
          setState(prev => ({
            ...prev,
            c1UISpecResponse: {
              success: true,
              uiSpec: response.uiSpec,
              properties: response.properties || [],
              metadata: response.metadata
            },
            showC1UISpec: true,
            displayMode: 'c1-ui-spec'
          }));
        } else {
          // Handle traditional property extraction
          setState(prev => ({
            ...prev,
            c1ExtractedProperties: response.properties,
            c1TransformMetadata: response.metadata,
            showC1Review: true,
            displayMode: 'c1-processed'
          }));
        }
      } else {
        throw new Error(response.error || 'C1 transformation failed');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'C1 transformation failed';
      setState(prev => ({
        ...prev,
        c1TransformError: errorMessage,
        error: errorMessage
      }));
    } finally {
      setState(prev => ({
        ...prev,
        c1TransformInProgress: false,
        importProgress: {
          isImporting: false,
          progress: 0,
          status: ''
        }
      }));
    }
  };

  /**
   * Handle C1 property approval
   */
  const handleC1Approve = async (approvedProperties: ScrapedPropertyData[]) => {
    setState(prev => ({
      ...prev,
      selectedProperties: approvedProperties,
      showC1Review: false
    }));
    
    // Auto-start import of approved properties
    setState(prev => ({
      ...prev,
      importProgress: {
        isImporting: true,
        progress: 0,
        status: 'Importing C1-processed properties...'
      }
    }));

    try {
      const response = await ScraperService.importProperties({
        properties: approvedProperties,
        skipValidation: importSettings.skipValidation,
        overwriteExisting: importSettings.overwriteExisting
      });

      progressTracker.complete(`Successfully imported ${response.imported} C1-processed properties`);
      
      // Load updated history
      await loadHistory();
      setActiveTab('history');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Import failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      progressTracker.error(errorMessage);
    } finally {
      setState(prev => ({
        ...prev,
        importProgress: {
          isImporting: false,
          progress: 0,
          status: ''
        }
      }));
    }
  };

  /**
   * Handle C1 property rejection
   */
  const handleC1Reject = () => {
    setState(prev => ({
      ...prev,
      showC1Review: false,
      c1ExtractedProperties: null,
      c1TransformMetadata: null,
      displayMode: 'processed' // Return to original display mode
    }));
  };

  /**
   * Handle C1 property editing
   */
  const handleC1Edit = (propertyIndex: number, updatedProperty: ScrapedPropertyData) => {
    setState(prev => {
      if (!prev.c1ExtractedProperties) return prev;
      
      const updatedProperties = [...prev.c1ExtractedProperties];
      updatedProperties[propertyIndex] = updatedProperty;
      
      return {
        ...prev,
        c1ExtractedProperties: updatedProperties
      };
    });
  };

  /**
   * Handle C1 UI specification close
   */
  const handleC1UISpecClose = () => {
    setState(prev => ({
      ...prev,
      showC1UISpec: false,
      c1UISpecResponse: null,
      displayMode: 'processed'
    }));
  };

  /**
   * Handle property extraction from C1 UI specification
   */
  const handleC1UISpecPropertyExtract = (properties: any[]) => {
    if (properties && properties.length > 0) {
      setState(prev => ({
        ...prev,
        selectedProperties: properties,
        showC1UISpec: false,
        c1UISpecResponse: null,
        displayMode: 'processed'
      }));
      setActiveTab('results');
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Property Scraper</h1>
        <p className="text-gray-600">
          Scrape property listings directly from any URL using AI-powered extraction
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('search')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'search'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ExternalLink className="h-4 w-4 inline mr-2" />
              URL Scraper
            </button>
            
            <button
              onClick={() => setActiveTab('results')}
              disabled={!state.scrapeResults}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'results'
                  ? 'border-blue-500 text-blue-600'
                  : state.scrapeResults 
                  ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  : 'border-transparent text-gray-400 cursor-not-allowed'
              }`}
            >
              <Database className="h-4 w-4 inline mr-2" />
              Results ({state.scrapeResults?.data?.length || 0})
            </button>
            
            <button
              onClick={() => setActiveTab('history')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'history'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <History className="h-4 w-4 inline mr-2" />
              History
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Search Tab */}
          {activeTab === 'search' && (
            <div className="space-y-6">
              {/* Direct URL Form */}
              <DirectUrlForm
                onSubmit={handleScrape}
                onPreview={handlePreview}
                isLoading={state.isLoading}
                showPreview={true}
              />

              {/* URL Preview */}
              {previewUrl && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">URL Preview</h4>
                      <p className="text-blue-700 text-sm mt-1">
                        This URL will be scraped by Firecrawl:
                      </p>
                      <div className="mt-2 p-3 bg-white rounded border flex items-center justify-between">
                        <code className="text-sm text-gray-800 break-all mr-3">
                          {previewUrl}
                        </code>
                        <a
                          href={previewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Examples */}
              {state.examples.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Quick Start Examples</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {state.examples.map((example, index) => (
                      <div
                        key={index}
                        className="bg-white p-3 rounded border hover:border-blue-300 cursor-pointer"
                        onClick={() => {
                          // You would implement loading example into form here
                        }}
                      >
                        <h5 className="font-medium text-sm">{example.name}</h5>
                        <p className="text-xs text-gray-600 mt-1">{example.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results Tab */}
          {activeTab === 'results' && state.scrapeResults && (
            <div className="space-y-6">
              {/* Results Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Scraped Properties ({state.scrapeResults.data?.length || 0})
                  </h3>
                  <p className="text-sm text-gray-600">
                    Scraped from: <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                      {state.scrapeResults.metadata.url}
                    </code>
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSelectAll(true)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => handleSelectAll(false)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Select None
                  </button>
                </div>
              </div>

              {/* Display Mode Selector */}
              {state.rawData && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Data Display Mode</h4>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="displayMode"
                        value="processed"
                        checked={state.displayMode === 'processed'}
                        onChange={(e) => setState(prev => ({ ...prev, displayMode: e.target.value as any }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Processed Properties</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="displayMode"
                        value="raw"
                        checked={state.displayMode === 'raw'}
                        onChange={(e) => setState(prev => ({ ...prev, displayMode: e.target.value as any }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Raw Firecrawl Data</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="displayMode"
                        value="both"
                        checked={state.displayMode === 'both'}
                        onChange={(e) => setState(prev => ({ ...prev, displayMode: e.target.value as any }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Both</span>
                    </label>
                    {state.c1UISpecResponse && (
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="displayMode"
                          value="c1-ui-spec"
                          checked={state.displayMode === 'c1-ui-spec'}
                          onChange={(e) => setState(prev => ({ ...prev, displayMode: e.target.value as any }))}
                          className="mr-2"
                        />
                        <span className="text-sm">C1 UI Display</span>
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* C1 UI Specification Display */}
              {state.displayMode === 'c1-ui-spec' && state.c1UISpecResponse && (
                <C1UISpecRenderer
                  c1Response={state.c1UISpecResponse}
                  sourceUrl={state.scrapeResults?.metadata.url}
                  onPropertyExtract={handleC1UISpecPropertyExtract}
                  onClose={handleC1UISpecClose}
                  className="mb-6"
                />
              )}

              {/* Raw Data Display */}
              {(state.displayMode === 'raw' || state.displayMode === 'both') && state.rawData && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Raw Firecrawl Data</h4>
                  <div className="bg-white p-4 rounded border max-h-96 overflow-auto">
                    <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(state.rawData, null, 2)}
                    </pre>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    This is the complete raw response from Firecrawl, including all formats: {
                      state.scrapeResults?.metadata?.firecrawlFormats?.join(', ') || 'N/A'
                    }
                  </p>
                </div>
              )}

              {/* Import Settings */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Import Settings</h4>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={importSettings.skipValidation}
                      onChange={(e) => setImportSettings(prev => ({ 
                        ...prev, 
                        skipValidation: e.target.checked 
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Skip validation checks</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={importSettings.overwriteExisting}
                      onChange={(e) => setImportSettings(prev => ({ 
                        ...prev, 
                        overwriteExisting: e.target.checked 
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Overwrite existing properties</span>
                  </label>
                </div>
              </div>

              {/* Properties List */}
              {(state.displayMode === 'processed' || state.displayMode === 'both') && (
                <div className="space-y-4">
                  {Array.isArray(state.scrapeResults.data) ? (
                    state.scrapeResults.data.map((property, index) => (
                      <div
                        key={`${property.sourceUrl}-${index}`}
                        className="border rounded-lg p-4 hover:border-gray-300"
                      >
                        <div className="flex items-start gap-4">
                          {/* Selection checkbox */}
                          <button
                            onClick={() => handlePropertySelection(
                              property, 
                              !state.selectedProperties.some(p => p.sourceUrl === property.sourceUrl)
                            )}
                            className="mt-1"
                          >
                            {state.selectedProperties.some(p => p.sourceUrl === property.sourceUrl) ? (
                              <CheckSquare className="h-5 w-5 text-blue-600" />
                            ) : (
                              <Square className="h-5 w-5 text-gray-400" />
                            )}
                          </button>

                          {/* Property info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div>
                                <h4 className="font-medium text-gray-900 truncate">
                                  {property.title}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {property.location}
                                </p>
                              </div>
                              
                              <div className="text-right ml-4">
                                {property.price && (
                                  <p className="font-medium text-gray-900">
                                    {PropertyUtils.formatPrice(property.price)}
                                  </p>
                                )}
                                {property.size && (
                                  <p className="text-sm text-gray-600">
                                    {PropertyUtils.formatArea(property.size)}
                                  </p>
                                )}
                              </div>
                            </div>

                            <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                              {property.description}
                            </p>

                            {/* Validation errors */}
                            {property.validationErrors && property.validationErrors.length > 0 && (
                              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                  <span className="text-sm font-medium text-yellow-800">
                                    Validation Issues
                                  </span>
                                </div>
                                <ul className="text-xs text-yellow-700 mt-1 list-disc list-inside">
                                  {property.validationErrors.map((error, idx) => (
                                    <li key={idx}>{error}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Source URL */}
                            <div className="mt-3 flex items-center gap-2">
                              <a
                                href={property.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                View source <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-yellow-800">
                        Raw data mode: No processed properties available. Switch to "Raw Data" view to see the scraped content.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Import Actions */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-600">
                  {state.selectedProperties.length} of {Array.isArray(state.scrapeResults.data) ? state.scrapeResults.data.length : 0} properties selected
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={clearResults}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Clear Results
                  </button>
                  
                  {/* C1 Transform Button - only show if raw data is available */}
                  {state.rawData && (
                    <button
                      onClick={handleC1Transform}
                      disabled={state.c1TransformInProgress}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {state.c1TransformInProgress ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      {state.c1TransformInProgress ? 'Processing with C1...' : 'Process with C1 AI'}
                    </button>
                  )}
                  
                  <button
                    onClick={handleImport}
                    disabled={state.selectedProperties.length === 0 || state.importProgress.isImporting}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {state.importProgress.isImporting ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {state.importProgress.isImporting ? 'Importing...' : 'Import Selected'}
                  </button>
                </div>
              </div>

              {/* Import Progress */}
              {state.importProgress.isImporting && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">
                        {state.importProgress.status}
                      </p>
                      <div className="mt-2 bg-blue-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 rounded-full h-2 transition-all"
                          style={{ width: `${state.importProgress.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Scraping History</h3>
                <button
                  onClick={loadHistory}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
              </div>

              {state.history.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No scraping history found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {state.history.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{item.title}</h4>
                          <p className="text-sm text-gray-600">{item.location}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Scraped: {new Date(item.scraped_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            item.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            ID: {item.id}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* C1 Property Review Modal */}
      {state.showC1Review && state.c1ExtractedProperties && state.c1TransformMetadata && (
        <C1PropertyReview
          extractedProperties={state.c1ExtractedProperties}
          rawFirecrawlData={state.rawData}
          transformMetadata={state.c1TransformMetadata}
          onApprove={handleC1Approve}
          onReject={handleC1Reject}
          onEdit={handleC1Edit}
          onClose={() => setState(prev => ({ ...prev, showC1Review: false }))}
        />
      )}

      {/* Error Display */}
      {state.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <h4 className="font-medium text-red-900">Error</h4>
              <p className="text-sm text-red-700 mt-1">{state.error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScraperManagement;