import React, { useState } from 'react';
import { useThesysC1 } from '@/hooks/useThesysC1';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { ThemeProvider, C1Component } from '@thesysai/genui-sdk';

export function C1APITest() {
  const [testPrompt, setTestPrompt] = useState('Generate a property search interface for office spaces in Koramangala');
  const [showRawJSON, setShowRawJSON] = useState(false);
  const { 
    uiSpec, 
    loading, 
    error, 
    generateUI, 
    reset,
    isGenerating,
    canRegenerate 
  } = useThesysC1({ 
    debug: true,
    autoRetry: true,
    maxRetries: 2
  });

  const handleTest = async () => {
    if (!testPrompt.trim()) return;
    
    try {
      await generateUI(testPrompt, {
        useCase: 'propertySearch',
        properties: [
          { id: '1', title: 'Modern Office Space', location: 'Koramangala', size: 1200 },
          { id: '2', title: 'Co-working Hub', location: 'Koramangala', size: 800 }
        ]
      });
    } catch (err) {
      console.error('C1 API test failed:', err);
    }
  };

  const getStatusIcon = () => {
    if (isGenerating) return <Loader2 className="animate-spin h-4 w-4" />;
    if (error) return <XCircle className="h-4 w-4 text-red-500" />;
    if (uiSpec) return <CheckCircle className="h-4 w-4 text-green-500" />;
    return <AlertCircle className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (isGenerating) return 'Testing C1 API...';
    if (error) return 'API Test Failed';
    if (uiSpec) return 'API Test Successful';
    return 'Ready to Test';
  };

  const getConfigStatus = () => {
    const backendUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
    const endpoint = import.meta.env.VITE_THESYS_C1_ENDPOINT;
    const model = import.meta.env.VITE_ANTHROPIC_MODEL;

    return {
      apiKey: 'Backend Proxy', // API key is securely stored on backend
      endpoint: endpoint || 'Using backend default',
      model: model || 'Using backend default',
      isReady: true // Always ready since we use backend proxy
    };
  };

  const config = getConfigStatus();

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            C1 API Connection Test
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configuration Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div>
              <Label className="text-sm font-medium">API Key</Label>
              <p className={`text-sm ${config.apiKey === 'Configured' ? 'text-green-600' : 'text-red-600'}`}>
                {config.apiKey}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Endpoint</Label>
              <p className="text-sm text-gray-600">{config.endpoint}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Model</Label>
              <p className="text-sm text-gray-600">{config.model}</p>
            </div>
          </div>

          {/* Status Alert */}
          <Alert className={`${
            error ? 'border-red-200 bg-red-50' : 
            uiSpec ? 'border-green-200 bg-green-50' : 
            'border-yellow-200 bg-yellow-50'
          }`}>
            <AlertDescription className="flex items-center gap-2">
              {getStatusIcon()}
              <span>{getStatusText()}</span>
            </AlertDescription>
          </Alert>

          {/* Test Controls */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="test-prompt">Test Prompt</Label>
              <Input
                id="test-prompt"
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
                placeholder="Enter a test prompt for the C1 API..."
                className="mt-1"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleTest}
                disabled={isGenerating || !testPrompt.trim()}
                className="min-w-32"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test API'
                )}
              </Button>
              
              <Button 
                variant="outline"
                onClick={reset}
                disabled={isGenerating}
              >
                Reset
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Error:</strong> {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Success Display */}
          {uiSpec && (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Success!</strong> C1 API returned a valid UI specification. Rendered below:
                </AlertDescription>
              </Alert>

              {/* Rendered UI Component */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Rendered UI Component</CardTitle>
                </CardHeader>
                <CardContent>
                  <ThemeProvider>
                    <C1Component 
                      c1Response={JSON.stringify(uiSpec)}
                      onAction={(action, data) => {
                        console.log('UI Action:', action, data);
                      }}
                    />
                  </ThemeProvider>
                </CardContent>
              </Card>

              {/* Collapsible Raw JSON */}
              <Card className="bg-gray-50">
                <CardHeader 
                  className="cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setShowRawJSON(!showRawJSON)}
                >
                  <CardTitle className="text-lg flex items-center justify-between">
                    View Raw JSON
                    {showRawJSON ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </CardTitle>
                </CardHeader>
                {showRawJSON && (
                  <CardContent>
                    <pre className="text-xs bg-white p-4 rounded border overflow-auto max-h-96">
                      {JSON.stringify(uiSpec, null, 2)}
                    </pre>
                  </CardContent>
                )}
              </Card>
            </div>
          )}

          {/* Debug Info */}
          {import.meta.env.VITE_DEBUG_C1 && (
            <details className="text-sm">
              <summary className="cursor-pointer font-medium mb-2">Debug Information</summary>
              <div className="bg-gray-50 p-4 rounded space-y-2">
                <div><strong>Environment:</strong> {import.meta.env.VITE_APP_ENV}</div>
                <div><strong>Debug Mode:</strong> {import.meta.env.VITE_DEBUG_MODE ? 'Enabled' : 'Disabled'}</div>
                <div><strong>C1 Debug:</strong> {import.meta.env.VITE_DEBUG_C1 ? 'Enabled' : 'Disabled'}</div>
                <div><strong>Can Regenerate:</strong> {canRegenerate ? 'Yes' : 'No'}</div>
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default C1APITest;