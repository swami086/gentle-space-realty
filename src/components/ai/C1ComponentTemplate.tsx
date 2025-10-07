import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeProvider, C1Component } from '@thesysai/genui-sdk';

/**
 * Type definition for the UI state.
 * Contains all the state variables needed for the application's UI.
 */
export type C1UIState = {
  /** The current search query input */
  query: string;
  /** The current response from the C1 API */
  c1Response: string;
  /** Whether an API request is currently in progress */
  isLoading: boolean;
};

/**
 * Type definition for parameters required by the makeApiCall function.
 * This includes both the API request parameters and state management callbacks.
 */
export type C1ApiCallParams = {
  /** The search query to be sent to the API */
  searchQuery: string;
  /** Optional previous response for context in follow-up queries */
  previousC1Response?: string;
  /** Callback to update the response state */
  setC1Response: (response: string) => void;
  /** Callback to update the loading state */
  setIsLoading: (isLoading: boolean) => void;
  /** Current abort controller for cancelling ongoing requests */
  abortController: AbortController | null;
  /** Callback to update the abort controller state */
  setAbortController: (controller: AbortController | null) => void;
};

/**
 * Makes an API call to the C1 endpoint with streaming response handling.
 * Supports request cancellation and manages loading states.
 */
const makeC1ApiCall = async ({
  searchQuery,
  previousC1Response,
  setC1Response,
  setIsLoading,
  abortController,
  setAbortController,
}: C1ApiCallParams) => {
  try {
    // Cancel any ongoing request before starting a new one
    if (abortController) {
      abortController.abort();
    }

    // Create and set up a new abort controller for this request
    const newAbortController = new AbortController();
    setAbortController(newAbortController);
    setIsLoading(true);

    // Use our backend API proxy instead of direct API calls
    const backendApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

    // Make the API request to our backend proxy
    const response = await fetch(`${backendApiUrl}/v1/c1/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: searchQuery,
        previousC1Response: previousC1Response,
      }),
      signal: newAbortController.signal,
    });

    if (!response.ok) {
      throw new Error(`C1 API error: ${response.status} ${response.statusText}`);
    }

    // Set up stream reading utilities
    const decoder = new TextDecoder();
    const stream = response.body?.getReader();

    if (!stream) {
      throw new Error("Response body stream not found");
    }

    // Initialize accumulator for streamed response
    let streamResponse = "";

    // Read the stream chunk by chunk
    while (true) {
      const { done, value } = await stream.read();
      
      if (done) {
        break;
      }

      // Decode the chunk
      const chunk = decoder.decode(value, { stream: true });
      
      // Parse SSE data if needed
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const jsonStr = line.slice(6); // Remove 'data: ' prefix
            if (jsonStr.trim()) {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content || '';
              if (content) {
                streamResponse += content;
                setC1Response(streamResponse);
              }
            }
          } catch (parseError) {
            // Ignore parsing errors for malformed chunks
            console.debug('Chunk parse error:', parseError);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error in C1 API call:", error);
    setC1Response(`Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
  } finally {
    // Clean up: reset loading state and abort controller
    setIsLoading(false);
    setAbortController(null);
  }
};

/**
 * Custom hook for managing the C1 UI state.
 * Provides a centralized way to manage state and API interactions.
 */
const useC1UIState = () => {
  // State for managing the search query input
  const [query, setQuery] = useState("");
  // State for storing the API response
  const [c1Response, setC1Response] = useState("");
  // State for tracking if a request is in progress
  const [isLoading, setIsLoading] = useState(false);
  // State for managing request cancellation
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  /**
   * Wrapper function around makeC1ApiCall that provides necessary state handlers.
   */
  const handleApiCall = async (
    searchQuery: string,
    previousC1Response?: string
  ) => {
    await makeC1ApiCall({
      searchQuery,
      previousC1Response,
      setC1Response,
      setIsLoading,
      abortController,
      setAbortController,
    });
  };

  // Return the state and actions in a structured format
  return {
    state: {
      query,
      c1Response,
      isLoading,
    },
    actions: {
      setQuery,
      setC1Response,
      makeApiCall: handleApiCall,
    },
  };
};

/**
 * Simple Loader component for showing loading state
 */
const Loader: React.FC = () => (
  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

/**
 * C1 Component Template based on the official template
 * This component provides a clean interface for interacting with the C1 API
 */
export const C1ComponentTemplate: React.FC = () => {
  const { state, actions } = useC1UIState();

  return (
    <div className="w-full space-y-6">
      {/* Input Section */}
      <div className="flex gap-4 items-center">
        <input
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300
            bg-white text-gray-900
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            placeholder-gray-500"
          value={state.query}
          placeholder="Enter a prompt for C1 UI generation..."
          onChange={({ target: { value } }) => actions.setQuery(value)}
          onKeyDown={(e) => {
            // Make API call only when response loading is not in progress
            if (e.key === "Enter" && !state.isLoading && state.query.trim()) {
              actions.makeApiCall(state.query);
            }
          }}
        />
        <Button
          onClick={() => actions.makeApiCall(state.query)}
          disabled={state.query.length === 0 || state.isLoading}
          className="flex items-center justify-center min-w-[100px] h-[45px]"
          size="default"
        >
          {state.isLoading ? <Loader /> : "Generate"}
        </Button>
      </div>

      {/* Response Section */}
      {state.c1Response && (
        <div className="w-full">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">C1 Response:</h3>
            <ThemeProvider>
              <C1Component 
                c1Response={state.c1Response}
                isStreaming={state.isLoading}
                updateMessage={(message) => actions.setC1Response(message)}
                onAction={({ llmFriendlyMessage }) => {
                  if (llmFriendlyMessage && !state.isLoading) {
                    actions.makeApiCall(llmFriendlyMessage, state.c1Response);
                  }
                }}
              />
            </ThemeProvider>
            {state.isLoading && (
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <Loader />
                <span className="ml-2">Streaming response...</span>
              </div>
            )}
            {!state.isLoading && (
              <div className="mt-2">
                <Button
                  onClick={() => actions.setC1Response("")}
                  variant="outline"
                  size="sm"
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default C1ComponentTemplate;