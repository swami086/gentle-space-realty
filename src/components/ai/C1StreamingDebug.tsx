import React, { useState } from 'react';
import SimpleC1Test from './SimpleC1Test';
import StreamTestComponent from './StreamTestComponent';

/**
 * Debug component to test C1 API streaming response processing
 * This helps identify issues with the streaming implementation
 */
const C1StreamingDebug: React.FC = () => {
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');

  const addLog = (message: string) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    setDebugLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const testStream = async () => {
    setIsLoading(true);
    setDebugLogs([]);
    setResponse('');
    addLog('🚀 Starting C1 streaming test...');

    try {
      const backendApiUrl = 'http://localhost:3001/api';
      
      addLog('📤 Making request to C1 API...');
      const requestResponse = await fetch(`${backendApiUrl}/v1/c1/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: "Hello, test streaming response",
          context: {},
          systemPrompt: "You are a helpful assistant. Please provide a simple response."
        }),
      });

      addLog(`📥 Response status: ${requestResponse.status} ${requestResponse.statusText}`);

      if (!requestResponse.ok) {
        const errorText = await requestResponse.text();
        throw new Error(`API error: ${requestResponse.status} ${requestResponse.statusText}\n${errorText}`);
      }

      addLog('🔄 Starting to read stream...');
      const decoder = new TextDecoder();
      const stream = requestResponse.body?.getReader();

      if (!stream) {
        throw new Error("Response body stream not found");
      }

      let streamResponse = "";
      let chunkCount = 0;

      while (true) {
        addLog(`📊 Reading chunk ${chunkCount + 1}...`);
        
        const { done, value } = await stream.read();
        
        if (done) {
          addLog('✅ Stream reading completed');
          break;
        }

        chunkCount++;
        const chunk = decoder.decode(value, { stream: true });
        addLog(`📦 Chunk ${chunkCount} size: ${chunk.length} characters`);
        
        // Log first 100 characters of chunk for debugging
        const previewChunk = chunk.length > 100 ? chunk.slice(0, 100) + '...' : chunk;
        addLog(`📖 Chunk ${chunkCount} preview: "${previewChunk}"`);

        const lines = chunk.split('\n');
        addLog(`📋 Chunk ${chunkCount} has ${lines.length} lines`);

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.startsWith('data: ') && line !== 'data: [DONE]') {
            try {
              const jsonStr = line.slice(6);
              if (jsonStr.trim()) {
                addLog(`🔍 Processing data line: "${jsonStr.slice(0, 50)}..."`);
                const parsed = JSON.parse(jsonStr);
                const content = parsed.choices?.[0]?.delta?.content || '';
                if (content) {
                  streamResponse += content;
                  addLog(`✏️ Added content: "${content.slice(0, 30)}..."`);
                  setResponse(streamResponse);
                }
              }
            } catch (parseError) {
              addLog(`❌ Parse error on line ${i}: ${parseError}`);
            }
          } else if (line.trim()) {
            addLog(`ℹ️ Non-data line: "${line.slice(0, 50)}..."`);
          }
        }
      }

      addLog(`🎉 Final response length: ${streamResponse.length} characters`);

    } catch (error) {
      addLog(`💥 Error: ${error}`);
      console.error("Streaming test error:", error);
    } finally {
      setIsLoading(false);
      addLog('🏁 Test completed');
    }
  };

  const clearLogs = () => {
    setDebugLogs([]);
    setResponse('');
  };

  return (
    <div className="space-y-6">
      <StreamTestComponent />
      <SimpleC1Test />
      
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-bold text-lg mb-3">C1 Streaming Response Debug Tool</h3>
      
        <div className="flex gap-2 mb-4">
          <button
            onClick={testStream}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isLoading ? 'Testing...' : 'Test C1 Streaming'}
          </button>
          <button
            onClick={clearLogs}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Clear Logs
          </button>
        </div>

        {/* Response Display */}
        {response && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded">
            <h4 className="font-medium mb-2">Accumulated Response:</h4>
            <pre className="text-sm whitespace-pre-wrap">{response}</pre>
          </div>
        )}

        {/* Debug Logs */}
        <div className="bg-black text-green-400 p-3 rounded font-mono text-sm max-h-96 overflow-y-auto">
          <div className="mb-2 font-bold">Debug Console:</div>
          {debugLogs.length === 0 ? (
            <div className="text-gray-500">No logs yet. Click 'Test C1 Streaming' to start.</div>
          ) : (
            debugLogs.map((log, index) => (
              <div key={index}>{log}</div>
            ))
          )}
          {isLoading && (
            <div className="text-yellow-400 animate-pulse">● Processing...</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default C1StreamingDebug;