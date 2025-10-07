import React from 'react';
import { C1Chat, ThemeProvider } from '@thesysai/genui-sdk';
import '@crayonai/react-ui/styles/index.css';

interface C1ChatComponentProps {
  initialContext?: {
    properties?: Array<{
      id: string;
      title: string;
      location: string;
      size: number;
      [key: string]: any;
    }>;
    userPreferences?: any;
  };
  onPropertySelect?: (propertyId: string) => void;
}

/**
 * C1ChatComponent demonstrates the C1Chat component for conversational property search.
 * This is a "batteries-included" solution that manages its own state, data fetching, and conversation history.
 */
export const C1ChatComponent: React.FC<C1ChatComponentProps> = ({
  initialContext,
  onPropertySelect
}) => {
  // C1Chat endpoint that accepts messages[] for conversational flows
  const apiUrl = import.meta.env.VITE_API_BASE_URL 
    ? `${import.meta.env.VITE_API_BASE_URL}/v1/c1/chat`
    : '/api/v1/c1/chat';

  // Initial messages to provide context about Gentle Space Realty
  const initialMessages = [
    {
      role: 'system' as const,
      content: `You are an AI assistant for Gentle Space Realty, specializing in commercial real estate in Bangalore. 
      Help users find office spaces, meeting rooms, and co-working facilities that match their requirements.
      Available locations include Koramangala, HSR Layout, Whitefield, Electronic City, and MG Road.
      Focus on understanding their space requirements, budget, preferred location, and amenities needed.`
    },
    {
      role: 'assistant' as const,
      content: `Welcome to Gentle Space Realty! 🏢 I'm here to help you find the perfect commercial space in Bangalore. 
      Whether you're looking for office space, meeting rooms, or co-working facilities, I can assist you with:
      
      • Finding spaces that match your requirements
      • Comparing different properties
      • Scheduling viewings
      • Understanding pricing and amenities
      
      What kind of space are you looking for today?`
    }
  ];

  // Add initial context if provided
  if (initialContext?.properties) {
    initialMessages.push({
      role: 'system' as const,
      content: `Available properties context: ${JSON.stringify(initialContext.properties, null, 2)}`
    });
  }

  const examplePrompts = [
    "Show me office spaces in Koramangala under ₹50,000/month",
    "I need a meeting room for tomorrow in HSR Layout",
    "Compare co-working spaces with high-speed internet",
    "Find a 2000 sq ft office space with parking",
    "What amenities are available in Whitefield locations?"
  ];

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          AI Property Search Assistant
        </h1>
        <p className="text-gray-600">
          Powered by C1Chat - Ask me anything about commercial real estate in Bangalore
        </p>
      </div>

      {/* Example Prompts */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Try asking me:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {examplePrompts.map((prompt, index) => (
            <div key={index} className="text-sm text-blue-700 bg-white rounded px-3 py-2 border border-blue-100">
              "_{prompt}_"
            </div>
          ))}
        </div>
      </div>

      {/* Chat Interface */}
      <div className="bg-white rounded-lg border shadow-sm" style={{ minHeight: '600px' }}>
        <ThemeProvider>
          <C1Chat
            apiUrl={apiUrl}
            initialMessages={initialMessages}
            onAction={(action: any, data: any) => {
              console.log('C1Chat Action:', action, data);
              
              // Handle property selection
              if (action === 'selectProperty' && data?.propertyId && onPropertySelect) {
                onPropertySelect(data.propertyId);
              }
              
              // Handle other custom actions
              if (action === 'scheduleViewing') {
                console.log('Schedule viewing requested:', data);
                // Could integrate with calendar/booking system
              }
              
              if (action === 'requestCallback') {
                console.log('Callback requested:', data);
                // Could integrate with CRM or notification system
              }
            }}
            style={{
              height: '600px',
              width: '100%'
            }}
            placeholder="Ask me about commercial properties in Bangalore..."
          />
        </ThemeProvider>
      </div>

      {/* Help Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">How to use this chat:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Ask about specific locations, sizes, or budgets</li>
          <li>• Request comparisons between different properties</li>
          <li>• Ask for recommendations based on your needs</li>
          <li>• Get information about amenities and facilities</li>
          <li>• Schedule property viewings</li>
        </ul>
      </div>
    </div>
  );
};

export default C1ChatComponent;