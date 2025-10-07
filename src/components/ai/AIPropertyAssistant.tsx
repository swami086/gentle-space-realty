import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Sparkles, MessageCircle, RotateCcw, Loader } from 'lucide-react';
import { Property } from '@/types/property';
import { Message, UserPreferences, PropertyFilters } from '@/types/thesys';
import { usePropertyStore } from '@/store/propertyStore';
import { useAIStore } from '@/store/aiStore';
import { useThesysC1 } from '@/hooks/useThesysC1';
import { GenUIRenderer } from './GenUIRenderer';

interface AIPropertyAssistantProps {
  onClose?: () => void;
  initialQuery?: string;
  availableProperties?: Property[];
  onPropertySelect?: (property: Property) => void;
  onPropertyContact?: (property: Property) => void;
  onAddToComparison?: (property: Property) => void;
}

export const AIPropertyAssistant: React.FC<AIPropertyAssistantProps> = ({
  onClose,
  initialQuery = '',
  availableProperties = [],
  onPropertySelect,
  onPropertyContact,
  onAddToComparison
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { properties } = usePropertyStore();
  const { 
    conversationHistory, 
    userPreferences, 
    addToHistory, 
    updateUserPreferences 
  } = useAIStore();
  
  const {
    uiSpec,
    loading,
    error,
    generateUI,
    regenerate,
    reset
  } = useThesysC1();

  const effectiveProperties = availableProperties.length > 0 ? availableProperties : properties;

  useEffect(() => {
    // Load conversation history on mount
    setMessages(conversationHistory);
    
    // Focus input on mount
    inputRef.current?.focus();
  }, [conversationHistory]);

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages, uiSpec]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!query.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date()
    };

    // Add user message to chat
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    addToHistory(userMessage);

    // Clear input
    const currentQuery = query;
    setQuery('');
    setIsTyping(true);

    try {
      // Generate AI response with property search UI
      await generateUI(currentQuery, {
        availableProperties: effectiveProperties,
        userPreferences,
        previousMessages: updatedMessages.slice(-3), // Last 3 messages for context
        query: currentQuery
      });

      // Create assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `I've generated a personalized property search based on your query: "${currentQuery}". Here are the results tailored to your needs:`,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      addToHistory(assistantMessage);

      // Extract preferences from query (simple keyword matching)
      extractPreferencesFromQuery(currentQuery);

    } catch (err) {
      console.error('Failed to generate AI response:', err);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an issue processing your request. Please try again or use our traditional search.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const extractPreferencesFromQuery = (query: string) => {
    const newPreferences: Partial<UserPreferences> = {};
    const lowerQuery = query.toLowerCase();

    // Extract location preferences
    const locations = ['koramangala', 'indiranagar', 'whitefield', 'hsr layout', 'electronic city', 'marathahalli'];
    const mentionedLocation = locations.find(loc => lowerQuery.includes(loc));
    if (mentionedLocation) {
      newPreferences.preferredLocation = mentionedLocation;
    }

    // Extract size preferences
    const sizeMatch = query.match(/(\d+)\s*(?:sqft|sq\.?ft\.?|square\s*feet)/i);
    if (sizeMatch) {
      const size = parseInt(sizeMatch[1]);
      newPreferences.spaceSize = {
        min: Math.max(0, size - 500),
        max: size + 500
      };
    }

    // Extract amenity preferences
    const amenityKeywords = {
      'parking': ['parking', 'park'],
      'meeting rooms': ['meeting', 'conference'],
      'cafeteria': ['cafeteria', 'food', 'cafe'],
      'gym': ['gym', 'fitness'],
      'wifi': ['wifi', 'internet', 'connectivity']
    };

    const mentionedAmenities: string[] = [];
    Object.entries(amenityKeywords).forEach(([amenity, keywords]) => {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        mentionedAmenities.push(amenity);
      }
    });

    if (mentionedAmenities.length > 0) {
      newPreferences.amenities = mentionedAmenities;
    }

    // Update preferences if we found any
    if (Object.keys(newPreferences).length > 0) {
      updateUserPreferences(newPreferences);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleRegenerateLast = async () => {
    if (messages.length > 0) {
      const lastUserMessage = messages.filter(m => m.role === 'user').pop();
      if (lastUserMessage) {
        setQuery(lastUserMessage.content);
        await regenerate();
      }
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    reset();
    inputRef.current?.focus();
  };

  const exampleQueries = [
    "Find me a 1500 sqft office in Koramangala with parking",
    "Show co-working spaces near metro stations under 1000 sqft",
    "I need a meeting room for 15 people next week",
    "Compare offices in Indiranagar vs HSR Layout"
  ];

  const handleExampleClick = (example: string) => {
    setQuery(example);
    inputRef.current?.focus();
  };

  return (
    <Card className="flex flex-col h-full max-h-[80vh] w-full max-w-4xl mx-auto bg-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          <h2 className="text-lg font-semibold text-gray-900">
            AI Property Assistant
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRegenerateLast}
            disabled={loading || messages.length === 0}
            className="text-gray-500 hover:text-gray-700"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearChat}
            className="text-gray-500 hover:text-gray-700"
          >
            Clear
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </Button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Find Your Perfect Office Space
            </h3>
            <p className="text-gray-600 mb-6">
              Describe what you're looking for in natural language, and I'll help you find the best properties.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl mx-auto">
              {exampleQueries.map((example, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleExampleClick(example)}
                  className="text-left text-gray-600 hover:text-gray-900 h-auto p-3 text-wrap"
                >
                  "{example}"
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <span className="text-xs opacity-70 mt-1 block">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            ))}

            {/* Generated UI Results */}
            {uiSpec && (
              <div className="w-full">
                <GenUIRenderer
                  uiSpec={uiSpec}
                  context={{
                    properties: effectiveProperties,
                    userPreferences,
                    messages
                  }}
                  className="border rounded-lg bg-gray-50 p-4"
                />
              </div>
            )}

            {/* Loading indicator */}
            {(loading || isTyping) && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-2 flex items-center gap-2">
                  <Loader className="h-4 w-4 animate-spin" />
                  <span className="text-sm">
                    {loading ? 'Generating personalized results...' : 'Typing...'}
                  </span>
                </div>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">
                  <strong>Error:</strong> {error}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRegenerateLast}
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            )}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Describe your ideal office space... (e.g., 1500 sqft in Koramangala with parking)"
            disabled={loading}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!query.trim() || loading}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send • AI-powered property search with personalized results
        </p>
      </div>
    </Card>
  );
};