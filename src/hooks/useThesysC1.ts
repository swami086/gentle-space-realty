import { useState, useCallback, useRef } from 'react';
import { thesysC1Service } from '@/services/thesysC1Service';
import { UISpec, GenerationOptions, Message } from '@/types/thesys';

interface UseThesysC1Return {
  // State
  uiSpec: UISpec | null;
  loading: boolean;
  error: string | null;
  history: Message[];
  
  // Actions  
  generateUI: (prompt: string, context?: any, options?: GenerationOptions) => Promise<UISpec | null>;
  regenerate: (options?: GenerationOptions) => Promise<UISpec | null>;
  refine: (feedback: string, options?: GenerationOptions) => Promise<UISpec | null>;
  reset: () => void;
  
  // Conversation
  addMessage: (message: Message) => void;
  clearHistory: () => void;
  
  // Utilities
  isGenerating: boolean;
  canRegenerate: boolean;
}

interface UseThesysC1Options {
  // Auto-retry failed generations
  autoRetry?: boolean;
  maxRetries?: number;
  
  // Cache generated UI specs
  enableCache?: boolean;
  
  // Automatically clear errors after timeout
  clearErrorTimeout?: number;
  
  // Debug mode for development
  debug?: boolean;
}

export function useThesysC1(options: UseThesysC1Options = {}): UseThesysC1Return {
  const {
    autoRetry = true,
    maxRetries = 2,
    enableCache = true,
    clearErrorTimeout = 5000,
    debug = false
  } = options;

  // State
  const [uiSpec, setUiSpec] = useState<UISpec | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Message[]>([]);

  // Refs for tracking state
  const lastPrompt = useRef<string>('');
  const lastContext = useRef<any>(null);
  const lastOptions = useRef<GenerationOptions | undefined>(undefined);
  const retryCount = useRef(0);
  const cache = useRef<Map<string, UISpec>>(new Map());
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear error after timeout
  const clearError = useCallback(() => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
    
    if (clearErrorTimeout > 0) {
      errorTimeoutRef.current = setTimeout(() => {
        setError(null);
      }, clearErrorTimeout);
    }
  }, [clearErrorTimeout]);

  // Generate cache key for caching
  const getCacheKey = useCallback((prompt: string, context?: any): string => {
    const contextStr = context ? JSON.stringify(context) : '';
    return `${prompt}:${contextStr}`;
  }, []);

  // Add message to conversation history
  const addMessage = useCallback((message: Message) => {
    setHistory(prev => [...prev, message]);
    
    if (debug) {
      console.log('[useThesysC1] Added message:', message);
    }
  }, [debug]);

  // Clear conversation history
  const clearHistory = useCallback(() => {
    setHistory([]);
    
    if (debug) {
      console.log('[useThesysC1] Cleared history');
    }
  }, [debug]);

  // Generate UI from prompt and context
  const generateUI = useCallback(async (
    prompt: string,
    context?: any,
    options?: GenerationOptions
  ): Promise<UISpec | null> => {
    // Validate inputs
    if (!prompt.trim()) {
      const errorMsg = 'Prompt cannot be empty';
      setError(errorMsg);
      clearError();
      return null;
    }

    // Check cache first
    if (enableCache) {
      const cacheKey = getCacheKey(prompt, context);
      const cached = cache.current.get(cacheKey);
      if (cached) {
        if (debug) {
          console.log('[useThesysC1] Using cached result for:', prompt);
        }
        setUiSpec(cached);
        return cached;
      }
    }

    // Store current generation params for regeneration
    lastPrompt.current = prompt;
    lastContext.current = context;
    lastOptions.current = options;
    retryCount.current = 0;

    setLoading(true);
    setError(null);

    // Add user message to history
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt,
      timestamp: new Date()
    };
    addMessage(userMessage);

    try {
      if (debug) {
        console.log('[useThesysC1] Generating UI for prompt:', prompt);
        console.log('[useThesysC1] Context:', context);
        console.log('[useThesysC1] Options:', options);
      }

      const result = await thesysC1Service.generateUI(prompt, context, options);
      
      if (!result) {
        throw new Error('No UI specification generated');
      }

      // Validate the generated UI spec
      if (!result.components || !Array.isArray(result.components)) {
        throw new Error('Invalid UI specification: missing or invalid components');
      }

      setUiSpec(result);
      
      // Cache the result
      if (enableCache) {
        const cacheKey = getCacheKey(prompt, context);
        cache.current.set(cacheKey, result);
      }

      // Add AI response to history
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Generated UI with ${result.components.length} components`,
        timestamp: new Date(),
        metadata: {
          uiSpecId: result.id,
          componentCount: result.components.length
        }
      };
      addMessage(aiMessage);

      if (debug) {
        console.log('[useThesysC1] Generated UI spec:', result);
      }

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      
      if (debug) {
        console.error('[useThesysC1] Generation failed:', err);
      }

      // Auto-retry logic
      if (autoRetry && retryCount.current < maxRetries) {
        retryCount.current++;
        
        if (debug) {
          console.log(`[useThesysC1] Retrying (${retryCount.current}/${maxRetries})...`);
        }

        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Recursive retry
        return generateUI(prompt, context, options);
      }

      // Set error state
      setError(`Generation failed: ${errorMessage}`);
      clearError();
      
      // Add error message to history
      const errorMessage2: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `Error: ${errorMessage}`,
        timestamp: new Date(),
        metadata: {
          error: true,
          errorType: 'generation_failed'
        }
      };
      addMessage(errorMessage2);

      return null;
    } finally {
      setLoading(false);
    }
  }, [enableCache, getCacheKey, addMessage, autoRetry, maxRetries, debug, clearError]);

  // Regenerate UI with same parameters
  const regenerate = useCallback(async (options?: GenerationOptions): Promise<UISpec | null> => {
    if (!lastPrompt.current) {
      const errorMsg = 'No previous generation to regenerate';
      setError(errorMsg);
      clearError();
      return null;
    }

    if (debug) {
      console.log('[useThesysC1] Regenerating UI with same parameters');
    }

    // Clear cache for this generation to force fresh result
    if (enableCache) {
      const cacheKey = getCacheKey(lastPrompt.current, lastContext.current);
      cache.current.delete(cacheKey);
    }

    return generateUI(
      lastPrompt.current, 
      lastContext.current, 
      { ...lastOptions.current, ...options }
    );
  }, [generateUI, getCacheKey, enableCache, debug, clearError]);

  // Refine existing UI with feedback
  const refine = useCallback(async (
    feedback: string,
    options?: GenerationOptions
  ): Promise<UISpec | null> => {
    if (!uiSpec) {
      const errorMsg = 'No UI specification to refine';
      setError(errorMsg);
      clearError();
      return null;
    }

    if (!feedback.trim()) {
      const errorMsg = 'Feedback cannot be empty';
      setError(errorMsg);
      clearError();
      return null;
    }

    const refinementPrompt = `${lastPrompt.current}\n\nRefinement feedback: ${feedback}`;
    const refinementContext = {
      ...lastContext.current,
      previousUiSpec: uiSpec,
      refinementFeedback: feedback
    };

    if (debug) {
      console.log('[useThesysC1] Refining UI with feedback:', feedback);
    }

    return generateUI(refinementPrompt, refinementContext, options);
  }, [uiSpec, generateUI, debug, clearError]);

  // Reset all state
  const reset = useCallback(() => {
    setUiSpec(null);
    setLoading(false);
    setError(null);
    setHistory([]);
    
    // Reset refs
    lastPrompt.current = '';
    lastContext.current = null;
    lastOptions.current = undefined;
    retryCount.current = 0;
    
    // Clear cache
    cache.current.clear();
    
    // Clear error timeout
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }

    if (debug) {
      console.log('[useThesysC1] Reset all state');
    }
  }, [debug]);

  // Computed properties
  const isGenerating = loading;
  const canRegenerate = !loading && !!lastPrompt.current;

  return {
    // State
    uiSpec,
    loading,
    error,
    history,
    
    // Actions
    generateUI,
    regenerate,
    refine,
    reset,
    
    // Conversation
    addMessage,
    clearHistory,
    
    // Utilities
    isGenerating,
    canRegenerate
  };
}