import React, { useState, useRef } from 'react';

/**
 * Pure streaming test component to isolate streaming issues
 * without GenUI SDK complexity
 */
const StreamTestComponent: React.FC = () => {
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`StreamTest: ${message}`);
  };

  const clearAll = () => {
    setResponse('');
    setLogs([]);
    setError('');
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  const testStreamingSimple = async () => {
    clearAll();
    setIsLoading(true);
    
    try {
      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      addLog('🚀 Starting simple streaming test');
      addLog('📤 Making request to /api/v1/c1/generate');
      
      const response = await fetch('/api/v1/c1/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: 'Say hello and count to 3',
          context: {},
          systemPrompt: 'Be helpful and respond in a simple format.'
        }),
        signal: abortControllerRef.current.signal,
      });

      addLog(`📥 Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      addLog('🔄 Starting to process stream');
      
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No readable stream available');
      }

      const decoder = new TextDecoder();
      let fullResponse = '';
      let chunkNumber = 0;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          addLog('✅ Stream completed');
          break;
        }

        chunkNumber++;
        const chunk = decoder.decode(value, { stream: true });
        addLog(`📦 Chunk ${chunkNumber}: ${chunk.length} bytes`);
        
        // Log first 100 chars of chunk
        const preview = chunk.length > 100 ? chunk.slice(0, 100) + '...' : chunk;
        addLog(`👀 Preview: "${preview}"`);

        // Process lines
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            if (line === 'data: [DONE]') {
              addLog('🏁 Received DONE signal');
              continue;
            }
            
            const jsonStr = line.slice(6).trim();
            if (jsonStr) {
              try {
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullResponse += content;
                  addLog(`✏️ Added: "${content.slice(0, 30)}..."`);
                  setResponse(fullResponse);
                }
              } catch (parseError) {
                addLog(`❌ Parse error: ${parseError}`);
              }
            }
          }
        }
      }

      addLog(`🎉 Final response: ${fullResponse.length} characters`);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      addLog(`💥 Error: ${errorMsg}`);
      setError(errorMsg);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  return (
    <div className="space-y-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <h3 className="font-bold text-lg">🧪 Pure Streaming Test</h3>
      
      <div className="flex gap-2">
        <button
          onClick={testStreamingSimple}
          disabled={isLoading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
        >
          {isLoading ? '⏳ Testing...' : '🚀 Test Streaming'}
        </button>
        
        <button
          onClick={clearAll}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          🧹 Clear All
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800">
          <strong>❌ Error:</strong> {error}
        </div>
      )}

      {response && (
        <div className="p-3 bg-green-50 border border-green-200 rounded">
          <h4 className="font-medium mb-2">📝 Streaming Response:</h4>
          <div className="bg-white p-2 border rounded text-sm font-mono">
            <pre className="whitespace-pre-wrap">{response}</pre>
          </div>
          <p className="text-xs text-gray-600 mt-1">Length: {response.length} characters</p>
        </div>
      )}

      <div className="bg-black text-green-400 p-3 rounded font-mono text-xs max-h-64 overflow-y-auto">
        <div className="mb-2 font-bold text-white">📊 Debug Console:</div>
        {logs.length === 0 ? (
          <div className="text-gray-500">No logs yet. Click 'Test Streaming' to start.</div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-1">{log}</div>
          ))
        )}
        {isLoading && (
          <div className="text-yellow-400 animate-pulse mt-2">🔄 Processing...</div>
        )}
      </div>
    </div>
  );
};

export default StreamTestComponent;