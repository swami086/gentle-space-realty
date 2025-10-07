/**
 * C1 UI Specification Workflow Test Component
 * 
 * Complete end-to-end test of the C1 UI specification workflow
 * from property data scraping to UI component rendering.
 */

import React, { useState } from 'react';
import { C1UISpecRenderer } from './scraper/C1UISpecRenderer';
import { Loader, RefreshCw, AlertCircle, CheckCircle, Play } from 'lucide-react';

export const C1UISpecWorkflowTest: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [c1Response, setC1Response] = useState<any>(null);
  const [step, setStep] = useState<string>('');

  // Sample property data to test with
  const samplePropertyData = {
    markdown: `# Premium Co-working Space in Indiranagar

**Location:** 100 Feet Road, Indiranagar, Bangalore
**Area:** 5000 sqft | 50 seats
**Type:** Flexible Co-working Space
**Rent:** ₹15,000/seat/month

## Premium Amenities
- Ultra-fast 1Gbps WiFi
- Dedicated parking for 20 vehicles  
- 24/7 Security with CCTV
- Backup power with UPS
- 3 Conference rooms (5, 10, 15 capacity)
- Fully equipped cafeteria
- Rooftop terrace
- Gaming zone with PS5
- Library and quiet zones
- Event space for 100 people

## Facilities
- Reception and mail handling
- Cleaning service
- Printing and scanning
- Phone booth for calls
- Locker facility
- Air conditioning throughout

## Contact Details
**Manager:** Rajesh Kumar
**Phone:** +91 9876543210
**Email:** hello@indiranagar-coworking.com
**WhatsApp:** +91 9876543210

## Membership Plans
- **Hot Desk:** ₹12,000/month
- **Dedicated Desk:** ₹18,000/month  
- **Private Office (2-person):** ₹45,000/month
- **Private Office (5-person):** ₹95,000/month

**Move-in Special:** First month 50% off for new members!
**Available:** Immediate occupancy available`,
    
    html: `<div class="property-listing">
      <h1>Premium Co-working Space in Indiranagar</h1>
      <div class="property-details">
        <p><strong>Location:</strong> 100 Feet Road, Indiranagar, Bangalore</p>
        <p><strong>Total Area:</strong> 5000 sqft</p>
        <p><strong>Capacity:</strong> 50 workstations</p>
        <p><strong>Type:</strong> Flexible Co-working Space</p>
      </div>
    </div>`
  };

  const testC1UISpecWorkflow = async () => {
    setIsLoading(true);
    setError(null);
    setC1Response(null);
    setStep('Initializing C1 transformation...');

    try {
      // Step 1: Call C1 transform-scrape endpoint
      setStep('Processing property data with C1 AI...');
      const c1Response = await fetch('/api/v1/c1/transform-scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rawFirecrawlData: samplePropertyData,
          sourceUrl: 'https://test-coworking-space.com/indiranagar',
          searchParams: {
            location: 'Indiranagar',
            propertyType: 'coworking'
          },
          extractionHints: 'This is a premium co-working space with multiple membership tiers. Generate comprehensive UI components for display with pricing comparison and amenities showcase.'
        }),
      });

      setStep('Parsing C1 response...');
      if (!c1Response.ok) {
        throw new Error(`C1 API failed: ${c1Response.status} ${c1Response.statusText}`);
      }

      const c1Data = await c1Response.json();
      console.log('C1 Transform Response:', c1Data);

      if (!c1Data.success) {
        throw new Error(c1Data.error || 'C1 transformation failed');
      }

      setStep('C1 transformation completed successfully!');
      setC1Response(c1Data);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      setStep('');
      console.error('C1 workflow test failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePropertyExtract = (properties: any[]) => {
    console.log('Properties extracted from C1 UI spec:', properties);
    alert(`Successfully extracted ${properties.length} properties from C1 UI specification! Check console for details.`);
  };

  const handleClose = () => {
    setC1Response(null);
    setStep('');
  };

  const resetTest = () => {
    setC1Response(null);
    setError(null);
    setStep('');
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold mb-2">
          C1 UI Specification Workflow Test
        </h1>
        <p className="text-purple-100">
          Complete end-to-end test of the C1 AI-powered property data extraction 
          and UI component generation workflow.
        </p>
      </div>

      {/* Test Controls */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Workflow Test</h2>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Test Data Preview</h3>
            <p className="text-sm text-gray-600 mb-3">
              This test uses sample co-working space data with comprehensive amenities and pricing tiers.
            </p>
            <details className="text-sm">
              <summary className="cursor-pointer text-blue-600 hover:text-blue-800">View sample data</summary>
              <pre className="mt-2 p-3 bg-white rounded border text-xs overflow-auto max-h-32">
                {samplePropertyData.markdown.substring(0, 400) + '...'}
              </pre>
            </details>
          </div>

          <button
            onClick={testC1UISpecWorkflow}
            disabled={isLoading}
            className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-3 text-lg font-medium"
          >
            {isLoading ? (
              <RefreshCw className="h-5 w-5 animate-spin" />
            ) : (
              <Play className="h-5 w-5" />
            )}
            {isLoading ? 'Processing with C1 AI...' : 'Start C1 UI Workflow Test'}
          </button>

          {c1Response && (
            <button
              onClick={resetTest}
              className="ml-4 px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Reset Test
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-4">
            <Loader className="h-8 w-8 text-blue-600 animate-spin" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 text-lg">Processing Property Data</h3>
              <p className="text-blue-700 mt-1">{step}</p>
              <div className="mt-3 bg-blue-200 rounded-full h-2">
                <div className="bg-blue-600 rounded-full h-2 animate-pulse" style={{ width: '60%' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-900">Workflow Test Failed</h3>
              <p className="text-red-700 mt-1">{error}</p>
              <button
                onClick={resetTest}
                className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
              >
                Retry Test
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success and Results */}
      {c1Response && !isLoading && (
        <div className="space-y-6">
          {/* Success Banner */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <div>
                <h3 className="font-semibold text-green-900">C1 Workflow Completed Successfully!</h3>
                <p className="text-green-700 mt-1">
                  {c1Response.uiSpec ? 'Generated UI components for interactive display' : 'Extracted structured property data'}
                </p>
              </div>
            </div>
          </div>

          {/* Workflow Results */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">C1 Generated Results</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>Processing Time: {c1Response.metadata?.processingTime}ms</span>
                <span>Model: {c1Response.metadata?.model?.split('/').pop()}</span>
                <span>Tokens: {c1Response.metadata?.tokensUsed}</span>
              </div>
            </div>

            {/* Render C1 UI Specification */}
            {c1Response.uiSpec ? (
              <C1UISpecRenderer
                c1Response={{
                  success: true,
                  uiSpec: c1Response.uiSpec,
                  properties: c1Response.properties || [],
                  metadata: {
                    ...c1Response.metadata,
                    confidence: 0.95,
                    extractionMode: 'ui-generation'
                  }
                }}
                sourceUrl="https://test-coworking-space.com/indiranagar"
                onPropertyExtract={handlePropertyExtract}
                onClose={handleClose}
                className="border-t pt-6"
              />
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <div>
                    <h3 className="font-medium text-yellow-900">No UI Specification Generated</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      C1 returned traditional property extraction instead of UI components.
                    </p>
                    {c1Response.properties && c1Response.properties.length > 0 && (
                      <p className="text-sm text-yellow-700 mt-2">
                        Found {c1Response.properties.length} extracted properties - would display in property review interface.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Debug Information */}
          <details className="bg-gray-50 rounded-lg p-4">
            <summary className="font-medium text-gray-900 cursor-pointer mb-4">
              📊 Debug Information & Raw Response
            </summary>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Workflow Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-white p-3 rounded">
                    <span className="text-gray-500">Success:</span>
                    <span className="ml-2 font-medium">{c1Response.success ? '✅ Yes' : '❌ No'}</span>
                  </div>
                  <div className="bg-white p-3 rounded">
                    <span className="text-gray-500">UI Spec:</span>
                    <span className="ml-2 font-medium">{c1Response.uiSpec ? '✅ Generated' : '❌ None'}</span>
                  </div>
                  <div className="bg-white p-3 rounded">
                    <span className="text-gray-500">Properties:</span>
                    <span className="ml-2 font-medium">{c1Response.properties?.length || 0}</span>
                  </div>
                  <div className="bg-white p-3 rounded">
                    <span className="text-gray-500">Extraction Method:</span>
                    <span className="ml-2 font-medium">{c1Response.metadata?.extractionMethod}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Full C1 Response</h4>
                <pre className="text-xs bg-white p-4 rounded border overflow-auto max-h-64">
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

export default C1UISpecWorkflowTest;