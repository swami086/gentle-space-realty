import React, { useState } from 'react';

/**
 * Simple C1 API test to isolate streaming issues
 */
const SimpleC1Test: React.FC = () => {
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const testC1 = async () => {
    setIsLoading(true);
    setResponse('');
    setError('');
    
    try {
      console.log('🚀 Starting C1 test...');
      
      const res = await fetch('/api/v1/c1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Hello world test',
          context: {},
          systemPrompt: 'Be helpful and concise.'
        }),
      });

      console.log('📥 Response received:', res.status, res.statusText);

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      // Simple text response (not streaming)
      const text = await res.text();
      console.log('📄 Response text:', text.slice(0, 200));
      setResponse(text);

    } catch (err) {
      console.error('❌ Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <h3 className="font-bold text-lg mb-3">Simple C1 API Test</h3>
      
      <button
        onClick={testC1}
        disabled={isLoading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 mb-4"
      >
        {isLoading ? 'Testing...' : 'Test C1 API'}
      </button>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-800">
          <strong>Error:</strong> {error}
        </div>
      )}

      {response && (
        <div className="p-3 bg-green-50 border border-green-200 rounded">
          <h4 className="font-medium mb-2">Response:</h4>
          <pre className="text-sm whitespace-pre-wrap">{response}</pre>
        </div>
      )}
    </div>
  );
};

export default SimpleC1Test;