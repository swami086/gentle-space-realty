/**
 * C1 UI Specification Test Component
 * 
 * Test component for demonstrating C1 UI specification rendering
 * functionality with live data from the C1 transform-scrape endpoint.
 */

import React, { useState } from 'react';
import { C1UISpecRenderer } from './scraper/C1UISpecRenderer';
import { Loader, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

export const C1UISpecTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [c1Response, setC1Response] = useState<any>(null);
  const [testUrl, setTestUrl] = useState(
    'https://www.magicbricks.com/propertyDetails/3-BHK-2055-Sq-ft-Multistorey-Apartment-FOR-Sale-Rajarajeshwari-Nagar-in-Bangalore&id=4d423831343438343633'
  );

  const testC1UISpec = async () => {
    setIsLoading(true);
    setError(null);
    setC1Response(null);

    try {
      // First scrape the URL with Firecrawl
      console.log('Scraping URL with Firecrawl:', testUrl);
      const scrapeResponse = await fetch('/api/firecrawl/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: testUrl,
          formats: ['markdown', 'html', 'links'],
          includeTags: ['title', 'meta', 'p', 'div', 'span', 'h1', 'h2', 'h3'],
          onlyMainContent: true
        }),
      });

      if (!scrapeResponse.ok) {
        throw new Error(`Scraping failed: ${scrapeResponse.status}`);
      }

      const scrapeData = await scrapeResponse.json();
      console.log('Firecrawl scrape result:', scrapeData);

      // Then transform with C1
      console.log('Transforming with C1...');
      const c1Response = await fetch('/api/v1/c1/transform-scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rawFirecrawlData: scrapeData.data,
          sourceUrl: testUrl,
          searchParams: {
            location: 'Rajarajeshwari Nagar',
            propertyType: 'office'
          },
          extractionHints: 'This is a commercial office space (3 rooms). Extract price, location, area, amenities, and contact information.'
        }),
      });

      if (!c1Response.ok) {
        throw new Error(`C1 transformation failed: ${c1Response.status}`);
      }

      const c1Data = await c1Response.json();
      console.log('C1 transform result:', c1Data);

      setC1Response(c1Data);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Test failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePropertyExtract = (properties: any[]) => {
    console.log('Properties extracted from UI spec:', properties);
    alert(`Extracted ${properties.length} properties! Check console for details.`);
  };

  const handleClose = () => {
    setC1Response(null);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          C1 UI Specification Test
        </h1>
        <p className="text-gray-600">
          Test the complete C1 UI specification rendering workflow with live property data.
        </p>
      </div>

      {/* Test Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Configuration</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Test URL (MagicBricks Property)
            </label>
            <input
              type="url"
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter MagicBricks property URL"
            />
          </div>

          <button
            onClick={testC1UISpec}
            disabled={isLoading || !testUrl}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            {isLoading ? 'Processing...' : 'Test C1 UI Specification'}
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <Loader className="h-5 w-5 text-blue-600 animate-spin" />
            <div>
              <h3 className="font-medium text-blue-900">Processing Property Data</h3>
              <p className="text-sm text-blue-700">
                Scraping property data and generating C1 UI specification...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <h3 className="font-medium text-red-900">Test Failed</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* C1 UI Specification Result */}
      {c1Response && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">C1 UI Specification Result</h2>
          
          {c1Response.uiSpec ? (
            <C1UISpecRenderer
              c1Response={c1Response}
              sourceUrl={testUrl}
              onPropertyExtract={handlePropertyExtract}
              onClose={handleClose}
            />
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <div>
                  <h3 className="font-medium text-yellow-900">No UI Specification</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    C1 returned a traditional property extraction instead of UI specification.
                  </p>
                  {c1Response.properties && c1Response.properties.length > 0 && (
                    <p className="text-sm text-yellow-700 mt-2">
                      Found {c1Response.properties.length} extracted properties - would normally show in property review interface.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Debug Information */}
          <details className="bg-gray-50 rounded-lg p-4">
            <summary className="font-medium text-gray-900 cursor-pointer">
              Debug Information
            </summary>
            <div className="mt-4 space-y-3">
              <div>
                <h4 className="text-sm font-medium text-gray-700">Response Summary</h4>
                <ul className="text-sm text-gray-600 mt-1 list-disc list-inside">
                  <li>Success: {c1Response.success ? 'Yes' : 'No'}</li>
                  <li>Has UI Spec: {c1Response.uiSpec ? 'Yes' : 'No'}</li>
                  <li>Properties: {c1Response.properties?.length || 0}</li>
                  <li>Processing Time: {c1Response.metadata?.processingTime || 'N/A'}ms</li>
                  <li>Model: {c1Response.metadata?.model || 'N/A'}</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700">Raw Response</h4>
                <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-48">
                  {JSON.stringify(c1Response, null, 2)}
                </pre>
              </div>
            </div>
          </details>
        </div>
      )}
    </div>
  );
};

export default C1UISpecTest;