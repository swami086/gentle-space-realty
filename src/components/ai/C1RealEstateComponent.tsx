import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Property } from '@/types/property';
import { C1Component, ThemeProvider } from "@thesysai/genui-sdk";

interface C1RealEstateProps {
  /** Available properties to provide as context */
  availableProperties?: Property[];
  /** User preferences for personalization */
  userPreferences?: {
    preferredLocation?: string;
    budgetRange?: { min: number; max: number };
    spaceSize?: { min: number; max: number };
    amenities?: string[];
    workingStyle?: 'private' | 'collaborative' | 'hybrid';
  };
  /** Callback when a property interaction occurs */
  onPropertyAction?: (action: string, propertyId?: string) => void;
}

/**
 * Specialized C1 component for real estate applications
 * Integrates with Gentle Space Realty property data and context
 */
export const C1RealEstateComponent: React.FC<C1RealEstateProps> = ({
  availableProperties = [],
  userPreferences,
  onPropertyAction,
}) => {
  const [query, setQuery] = useState("");
  const [c1Response, setC1Response] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // System prompt for real estate context
  const getSystemPrompt = () => `
You are an AI assistant for Gentle Space Realty, a premium office space rental platform in Bengaluru, India.

Company Context:
- Gentle Space specializes in fully-furnished offices, co-working spaces, and meeting rooms
- Focus on Bengaluru locations (Koramangala, Indiranagar, Whitefield, HSR Layout, etc.)
- Professional, trust-building tone with emphasis on transparency
- Pricing is generally "Contact for pricing" - we don't display exact prices
- Key amenities: parking, WiFi, meeting rooms, cafeteria, 24/7 access, security

Brand Voice:
- Professional but approachable
- Helpful and informative
- Focus on understanding customer needs
- Emphasize quality and trust

Generate UI components and responses that help users:
1. Discover relevant office spaces based on their needs
2. Compare different properties effectively
3. Contact us for more information
4. Understand the features and benefits of each space

Always consider the user's preferences and available properties when responding.
`;

  const makeRealEstateApiCall = async (searchQuery: string, previousResponse?: string) => {
    console.log('🚀 Starting C1 Real Estate API call with query:', searchQuery);
    
    try {
      // Cancel any ongoing request
      if (abortController) {
        console.log('🛑 Cancelling previous request');
        abortController.abort();
      }

      const newAbortController = new AbortController();
      setAbortController(newAbortController);
      setIsLoading(true);
      setC1Response(""); // Clear previous response
      
      console.log('⚙️ Loading state set to true');

      // Use our backend API proxy
      const backendApiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

      // Build context with available properties and user preferences
      const contextData = {
        availableProperties: availableProperties.slice(0, 10), // Limit to prevent token overflow
        userPreferences,
        companyInfo: {
          name: "Gentle Space Realty",
          focus: "Premium office spaces in Bengaluru",
          locations: ["Koramangala", "Indiranagar", "Whitefield", "HSR Layout", "JP Nagar", "Electronic City"],
          services: ["Fully-furnished offices", "Co-working spaces", "Meeting rooms", "Virtual offices"]
        }
      };

      // Prepare system prompt with context
      const systemPrompt = `${getSystemPrompt()}

Available Properties Context:
${JSON.stringify(contextData, null, 2)}

Please generate UI components or provide responses that are specifically tailored to these properties and user preferences.`;

      // Make the API call to our backend proxy
      const response = await fetch(`${backendApiUrl}/v1/c1/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: searchQuery,
          previousC1Response: previousResponse,
          context: contextData,
          systemPrompt: systemPrompt,
          stream: true // Enable streaming to match component's expectation
        }),
        signal: newAbortController.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`C1 API error: ${response.status} ${response.statusText}\n${errorText}`);
      }

      // Handle streaming response with robust error handling
      const decoder = new TextDecoder();
      const reader = response.body?.getReader();

      if (!reader) {
        throw new Error("Response body stream not found");
      }

      let streamResponse = "";
      let chunkCount = 0;

      console.log('🔄 Starting stream processing...');

      try {
        while (true) {
          console.log(`🔍 About to read chunk ${chunkCount + 1}...`);
          
          let readResult;
          try {
            readResult = await reader.read();
            console.log(`📥 Read result:`, { done: readResult.done, valueLength: readResult.value ? readResult.value.length : 0 });
          } catch (readError) {
            console.error(`❌ Error during reader.read():`, readError);
            console.error(`Error details:`, {
              name: readError.name,
              message: readError.message,
              stack: readError.stack
            });
            throw readError;
          }
          
          const { done, value } = readResult;
          
          if (done) {
            console.log('✅ Stream reading completed, total chunks:', chunkCount);
            break;
          }

          chunkCount++;
          const chunk = decoder.decode(value, { stream: true });
          
          console.log(`📦 Chunk ${chunkCount}: ${chunk.length} bytes`);
          console.log(`📝 Chunk content preview:`, JSON.stringify(chunk.substring(0, 200)));

          // Process chunk line by line
          const lines = chunk.split('\n');
          console.log(`📋 Chunk has ${lines.length} lines`);
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              if (line === 'data: [DONE]') {
                console.log('🏁 Received [DONE] marker');
                continue;
              }
              
              try {
                const jsonStr = line.slice(6).trim();
                if (jsonStr) {
                  const parsed = JSON.parse(jsonStr);
                  const content = parsed.choices?.[0]?.delta?.content;
                  
                  if (content && typeof content === 'string') {
                    streamResponse += content;
                    console.log(`✏️ Added content (${content.length} chars), total: ${streamResponse.length}`);
                    
                    // Update response in real-time for GenUI SDK
                    // Only extract content when we have a complete response
                    let responseToSet = streamResponse;
                    
                    // Check if we have complete content tags (both opening and closing)
                    const completeContentMatch = streamResponse.match(/<content>(.*?)<\/content>/s);
                    if (completeContentMatch && completeContentMatch[1]) {
                      // We have complete content, extract and clean it
                      const extractedContent = completeContentMatch[1].trim()
                        .replace(/&quot;/g, '"')
                        .replace(/&lt;/g, '<')
                        .replace(/&gt;/g, '>')
                        .replace(/&amp;/g, '&');
                      
                      responseToSet = extractedContent;
                      console.log('🧹 Complete content found, extracted and cleaned:', extractedContent.substring(0, 200) + '...');
                    } else {
                      // Still streaming or no content tags, use raw response
                      console.log('📝 Streaming in progress, using raw response:', streamResponse.substring(0, 200) + '...');
                    }
                    
                    setC1Response(responseToSet);
                  }
                }
              } catch (parseError) {
                console.warn(`⚠️ JSON parse error in chunk ${chunkCount}:`, parseError);
                continue;
              }
            }
          }
        }
      } finally {
        // Clean up reader
        try {
          reader.releaseLock?.();
        } catch (cleanupError) {
          console.debug('Stream cleanup error (safe to ignore):', cleanupError);
        }
      }

      // Ensure we have some response content
      if (!streamResponse || streamResponse.trim() === '') {
        console.warn('⚠️ No content received from stream');
        throw new Error('No response received from the AI service. Please try again.');
      }

      console.log('✅ Final response length:', streamResponse.length, 'characters');

      // Trigger callback for analytics
      if (onPropertyAction) {
        onPropertyAction('c1_query_completed', undefined);
      }

    } catch (error) {
      console.error("Error in real estate C1 API call:", error);
      
      let errorMessage = 'An error occurred while processing your request.';
      
      if (error instanceof Error) {
        if (error.message.includes('API key')) {
          errorMessage = 'API configuration error. Please check your C1 API settings.';
        } else if (error.message.includes('404')) {
          errorMessage = 'C1 service is currently unavailable. Please try again later.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setC1Response(`Error: ${errorMessage}`);
      
      if (onPropertyAction) {
        onPropertyAction('c1_query_error', undefined);
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  // Predefined query suggestions for real estate
  const querySuggestions = [
    "Show me co-working spaces in Koramangala under 50K budget",
    "I need a private office for 10 people with parking",
    "Find meeting rooms available for half-day bookings",
    "Compare office spaces in Indiranagar vs Whitefield",
    "What are the best amenities for a tech startup?",
    "Show me properties with 24/7 access and cafeteria"
  ];

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    makeRealEstateApiCall(suggestion);
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">AI-Powered Property Search</h2>
        <p className="text-gray-600">Describe what you're looking for and get personalized recommendations</p>
      </div>

      {/* Input Section */}
      <div className="flex gap-4 items-center">
        <input
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300
            bg-white text-gray-900
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
            placeholder-gray-500"
          value={query}
          placeholder="Describe your ideal office space..."
          onChange={({ target: { value } }) => setQuery(value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isLoading && query.trim()) {
              makeRealEstateApiCall(query);
            }
          }}
        />
        <Button
          onClick={() => makeRealEstateApiCall(query)}
          disabled={query.length === 0 || isLoading}
          className="flex items-center justify-center min-w-[120px] h-[48px] bg-blue-600 hover:bg-blue-700"
          size="default"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            "Search Properties"
          )}
        </Button>
      </div>

      {/* Query Suggestions */}
      {!c1Response && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Try these suggestions:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {querySuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-left p-3 text-sm bg-gray-50 hover:bg-gray-100 
                  rounded-lg border border-gray-200 transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Context Display */}
      {availableProperties.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            Available Properties Context: {availableProperties.length} properties
          </h3>
          <div className="text-xs text-blue-600">
            Locations: {[...new Set(availableProperties.map(p => p.location))].join(', ')}
          </div>
        </div>
      )}

      {/* GenUI SDK Response Section - ONLY GenUI SDK */}
      {c1Response && (
        <div className="w-full">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="border-b border-gray-200 px-4 py-3">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-900">AI-Generated Response</h3>
                {isLoading && (
                  <div className="flex items-center text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Generating...
                  </div>
                )}
              </div>
            </div>
            <div className="p-4">
              {/* ONLY GenUI SDK - No Fallbacks */}
              <ThemeProvider>
                {console.log('🔍 Passing to C1Component:', c1Response.substring(0, 200) + '...')}
                <C1Component 
                  c1Response={c1Response}
                  isStreaming={isLoading}
                  updateMessage={(message) => {
                    console.log('📨 C1Component updateMessage called with:', message.substring(0, 100) + '...');
                    setC1Response(message);
                  }}
                  onAction={({ llmFriendlyMessage, ...rest }) => {
                    console.log('C1 Component Action:', { llmFriendlyMessage, ...rest });
                    if (llmFriendlyMessage && !isLoading) {
                      // Handle follow-up conversational queries
                      makeRealEstateApiCall(llmFriendlyMessage, c1Response);
                    } else if (onPropertyAction) {
                      // Handle other actions like property selection
                      onPropertyAction(rest.action || rest, rest.data?.propertyId || rest.propertyId);
                    }
                  }}
                />
              </ThemeProvider>
              
              {isLoading && (
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                  Processing streaming updates...
                </div>
              )}
              
              {!isLoading && c1Response && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => {
                      setC1Response("");
                      setQuery("");
                    }}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear and start new search
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Information */}
      <div className="text-xs text-gray-500 text-center">
        Powered by Thesys C1 AI • Gentle Space Realty
      </div>
    </div>
  );
};

export default C1RealEstateComponent;