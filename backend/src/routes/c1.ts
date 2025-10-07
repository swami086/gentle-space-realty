import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import { z } from 'zod';

const router = Router();

// Initialize OpenAI client for C1 API
const c1Client = new OpenAI({
  apiKey: process.env.THESYS_C1_API_KEY,
  baseURL: process.env.THESYS_C1_ENDPOINT || 'https://api.thesys.dev/v1/embed'
});

// Request validation schema
const C1RequestSchema = z.object({
  prompt: z.string().min(1).max(10000),
  context: z.record(z.any()).optional(),
  model: z.string().optional(),
  stream: z.boolean().optional().default(false),
  systemPrompt: z.string().optional(),
  useCase: z.string().optional()
});

// Request validation schema for conversational chat
const C1ChatRequestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string()
  })).min(1),
  model: z.string().optional(),
  stream: z.boolean().optional().default(true),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().positive().optional()
});

// Request validation schema for C1Chat SDK format
const C1ChatSDKRequestSchema = z.object({
  prompt: z.object({
    id: z.string(),
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string()
  }),
  responseId: z.string(),
  threadId: z.string(),
  model: z.string().optional(),
  stream: z.boolean().optional().default(true),
  temperature: z.number().min(0).max(2).optional(),
  max_tokens: z.number().positive().optional()
});

// Request validation schema for C1 transform scrape endpoint
const C1TransformScrapeRequestSchema = z.object({
  rawFirecrawlData: z.any(),
  sourceUrl: z.string().url(),
  searchParams: z.object({
    location: z.string().optional(),
    propertyType: z.enum(['office', 'coworking', 'retail', 'warehouse', 'land']).optional(),
    minPrice: z.number().optional(),
    maxPrice: z.number().optional(),
    minArea: z.number().optional(),
    maxArea: z.number().optional(),
    furnished: z.enum(['furnished', 'semi-furnished', 'unfurnished']).optional(),
    availability: z.enum(['immediate', 'within-15-days', 'within-30-days', 'after-30-days']).optional(),
    amenities: z.array(z.string()).optional(),
    sortBy: z.enum(['relevance', 'price-low-to-high', 'price-high-to-low', 'newest']).optional(),
    page: z.number().optional()
  }).optional(),
  extractionHints: z.string().optional()
});

// Zod schema for ScrapedPropertyData validation
const ScrapedPropertyDataSchema = z.object({
  // Required fields
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  location: z.string().min(1, "Location is required"),

  // Optional structured fields
  price: z.object({
    amount: z.number().positive("Price amount must be positive"),
    currency: z.enum(['INR', 'USD', 'EUR'], { errorMap: () => ({ message: "Currency must be INR, USD, or EUR" }) }),
    period: z.enum(['monthly', 'yearly', 'one-time'], { errorMap: () => ({ message: "Period must be monthly, yearly, or one-time" }) })
  }).optional(),

  size: z.object({
    area: z.number().positive("Area must be positive"),
    unit: z.enum(['sqft', 'seats'], { errorMap: () => ({ message: "Unit must be sqft or seats" }) })
  }).optional(),

  amenities: z.array(z.string()).optional(),

  features: z.object({
    furnished: z.boolean().optional(),
    parking: z.boolean().optional(),
    wifi: z.boolean().optional(),
    ac: z.boolean().optional(),
    security: z.boolean().optional(),
    cafeteria: z.boolean().optional(),
    elevator: z.boolean().optional(),
    powerBackup: z.boolean().optional(),
    conferenceRoom: z.boolean().optional()
  }).optional(),

  contact: z.object({
    phone: z.string().optional(),
    email: z.string().email("Invalid email format").optional(),
    contactPerson: z.string().optional()
  }).optional(),

  media: z.object({
    images: z.array(z.string().url("Invalid image URL")).optional(),
    videos: z.array(z.string().url("Invalid video URL")).optional()
  }).optional(),

  availability: z.object({
    status: z.enum(['available', 'occupied', 'coming-soon'], { errorMap: () => ({ message: "Status must be available, occupied, or coming-soon" }) }),
    date: z.string().optional()
  }).optional(),

  // Metadata fields
  sourceUrl: z.string().url("Invalid source URL"),
  scrapedAt: z.string().optional(),
  searchParams: z.any().optional(),
  validationErrors: z.array(z.string()).optional(),
  rawData: z.any().optional(),

  // C1 metadata
  c1Metadata: z.object({
    extractedBy: z.enum(['c1', 'firecrawl', 'manual'], { errorMap: () => ({ message: "ExtractedBy must be c1, firecrawl, or manual" }) }),
    confidence: z.number().min(0).max(1, "Confidence must be between 0 and 1").optional(),
    extractionWarnings: z.array(z.string()).optional(),
    processedAt: z.string(),
    fieldsExtracted: z.array(z.string()),
    fieldsMissing: z.array(z.string())
  }).optional()
});

// System prompts for different use cases
const getSystemPrompt = (useCase: string = 'propertySearch'): string => {
  const baseContext = `
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
`;

  const systemPrompts = {
    propertySearch: `${baseContext}

Use Case: Property Search UI Generation
Generate dynamic, responsive UI components for property search results based on user queries.

Guidelines:
1. Create property cards highlighting relevant features mentioned in the query
2. Include filtering options that match user intent
3. Generate comparison tables when multiple properties are requested
4. Show map integration for location-based queries
5. Highlight matching amenities and features
6. Include clear CTAs for inquiries and property visits

Output format: Generate React component specifications that can be rendered using our existing PropertyCard components and UI library.`,

    inquiryForm: `${baseContext}

Use Case: Contextual Inquiry Form Generation
Create adaptive inquiry forms based on property type, user intent, and conversation context.

Guidelines:
1. Generate relevant form fields based on property type (office, co-working, meeting room)
2. Pre-fill information from conversation context
3. Include validation rules appropriate for the property
4. Add helpful suggestions and next steps
5. Integrate WhatsApp contact option
6. Show estimated response time

Output format: Generate form specifications with proper validation and user experience elements.`,

    propertyComparison: `${baseContext}

Use Case: Property Comparison UI Generation
Create intelligent comparison interfaces highlighting key differences and insights.

Guidelines:
1. Generate comparison tables with relevant metrics
2. Create visual charts for size, amenities, and location scores
3. Provide AI insights on pros/cons for each property
4. Highlight best matches based on stated requirements
5. Include actionable next steps (contact, visit, etc.)
6. Show location comparison on maps

Output format: Generate comparison UI specifications with tables, charts, and insight cards.`
  };

  return systemPrompts[useCase as keyof typeof systemPrompts] || systemPrompts.propertySearch;
};

// System prompt for property data extraction from raw Firecrawl data
const getPropertyExtractionPrompt = (): string => {
  return `You are an AI assistant specialized in extracting structured property data from raw web scraping results.

TASK: Extract property listing information from raw Firecrawl data (markdown, HTML, JSON formats) and convert it to structured JSON matching the ScrapedPropertyData schema.

PROPERTY SCHEMA (ScrapedPropertyData interface):
{
  title: string (required),
  description: string (required),
  price?: {
    amount: number,
    currency: string,
    period: 'monthly' | 'yearly' | 'one-time'
  },
  location: string (required),
  size?: {
    area: number,
    unit: 'sqft' | 'seats'
  },
  amenities?: string[],
  features?: {
    furnished?: boolean,
    parking?: boolean,
    wifi?: boolean,
    ac?: boolean,
    security?: boolean,
    cafeteria?: boolean,
    elevator?: boolean,
    powerBackup?: boolean,
    conferenceRoom?: boolean
  },
  contact?: {
    phone?: string,
    email?: string,
    contactPerson?: string
  },
  media?: {
    images?: string[],
    videos?: string[]
  },
  availability?: {
    status: 'available' | 'occupied' | 'coming-soon',
    date?: string
  }
}

EXTRACTION GUIDELINES:
1. REQUIRED FIELDS: title, description, location must always be present
2. PRICE: Extract amount, determine currency (usually INR), identify period (monthly/yearly)
3. SIZE: Convert to sqft if possible, use "seats" for coworking spaces
4. AMENITIES: List as strings (e.g., ["WiFi", "Parking", "AC", "Cafeteria"])
5. FEATURES: Map to boolean values, infer from descriptions and amenities
6. CONTACT: Extract phone numbers, emails, contact person names
7. MEDIA: Include full URLs for images and videos
8. AVAILABILITY: Determine status and extract availability dates

HANDLING AMBIGUOUS DATA:
- If price is "Contact for pricing" or similar: omit price object
- If size is unclear: try to infer from context or omit
- If location has multiple formats: use most complete address
- If data is missing: omit optional fields rather than guessing
- If multiple properties in data: extract each as separate object

OUTPUT FORMAT:
Return a JSON array of property objects. Each object must follow the ScrapedPropertyData schema exactly.
Include confidence metadata for each extraction:
{
  "properties": [...],
  "metadata": {
    "confidence": 0.8,
    "warnings": ["Price not specified", "Limited contact info"],
    "fieldsExtracted": ["title", "description", "location", "amenities"],
    "fieldsMissing": ["price", "size", "contact"]
  }
}

EXAMPLE OUTPUT:
{
  "properties": [
    {
      "title": "Premium Office Space in Koramangala",
      "description": "Fully furnished 2000 sqft office space with modern amenities",
      "location": "Koramangala, Bangalore",
      "size": { "area": 2000, "unit": "sqft" },
      "amenities": ["WiFi", "Parking", "AC", "Security"],
      "features": {
        "furnished": true,
        "parking": true,
        "wifi": true,
        "ac": true,
        "security": true
      }
    }
  ],
  "metadata": {
    "confidence": 0.85,
    "warnings": [],
    "fieldsExtracted": ["title", "description", "location", "size", "amenities", "features"],
    "fieldsMissing": ["price", "contact", "media"]
  }
}

Be thorough but accurate. Only extract data that is clearly present in the source material.`;
};

// POST /api/c1/generate - Generate UI using C1 API
router.post('/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request
    const validatedData = C1RequestSchema.parse(req.body);
    const { prompt, context, model, systemPrompt, useCase, stream } = validatedData;

    // Prepare messages for OpenAI Chat Completions format
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: systemPrompt || getSystemPrompt(useCase)
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    // Add context information to user message if provided
    if (context && Object.keys(context).length > 0) {
      const contextString = `\n\nContext: ${JSON.stringify(context, null, 2)}`;
      (messages[1] as any).content += contextString;
    }

    if (stream) {
      // Handle streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const streamCompletion = await c1Client.chat.completions.create({
        model: model || process.env.ANTHROPIC_MODEL || 'c1/anthropic/claude-sonnet-4/v-20250815',
        messages,
        stream: true,
        max_tokens: 4000,
        temperature: 0.7
      });

      // Forward stream to client
      for await (const chunk of streamCompletion) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      // Handle non-streaming response (original behavior)
      const completion = await c1Client.chat.completions.create({
        model: model || process.env.ANTHROPIC_MODEL || 'c1/anthropic/claude-sonnet-4/v-20250815',
        messages,
        stream: false,
        max_tokens: 4000,
        temperature: 0.7
      });

      // Extract response content
      const content = completion.choices[0]?.message?.content;
      if (!content) {
        res.status(500).json({
          error: 'No content received from C1 API',
          details: 'The API response was empty or malformed'
        });
        return;
      }

      // Try to parse the content as structured UI data
      let uiSpec;
      try {
        // First, try to extract content from <content> tags if present
        let extractedContent = content;
        const contentMatch = content.match(/<content>(.*?)<\/content>/s);
        if (contentMatch && contentMatch[1]) {
          extractedContent = contentMatch[1].trim();
          // Decode HTML entities
          extractedContent = extractedContent
            .replace(/&quot;/g, '"')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');
        }

        // Try to parse as JSON
        const parsedContent = JSON.parse(extractedContent);
        
        if (parsedContent.component) {
          // Handle single component format
          uiSpec = {
            type: 'component',
            components: [parsedContent.component]
          };
        } else if (parsedContent.uiSpec || parsedContent.components) {
          // Handle structured UI spec format
          uiSpec = parsedContent.uiSpec || {
            type: 'component',
            components: parsedContent.components || []
          };
        } else {
          // If JSON but not in expected format, return raw content for C1Component to handle
          uiSpec = {
            type: 'component',
            components: [],
            rawContent: extractedContent
          };
        }
      } catch (parseError) {
        console.log('Content parsing failed, using raw content for C1Component:', parseError instanceof Error ? parseError.message : 'Unknown parsing error');
        // If not JSON, let C1Component handle the raw content directly
        uiSpec = {
          type: 'component',
          components: [],
          rawContent: content
        };
      }

      // Return C1-compatible response format
      res.json({
        uiSpec,
        metadata: {
          model: completion.model,
          tokensUsed: completion.usage?.total_tokens || 0,
          latency: 0 // Would need to calculate actual latency
        },
        openaiResponse: {
          id: completion.id,
          created: completion.created,
          usage: completion.usage
        }
      });
    }

  } catch (error) {
    console.error('C1 API Error:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid request format',
        details: error.errors
      });
      return;
    }

    if (error instanceof Error) {
      // OpenAI API errors
      if ('status' in error && 'message' in error) {
        res.status((error as any).status || 500).json({
          error: 'C1 API request failed',
          details: error.message
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/c1/chat - Conversational chat endpoint for C1Chat component
router.post('/chat', async (req: Request, res: Response): Promise<void> => {
  try {
    // C1Chat endpoint - handles both SDK format and OpenAI format
    
    let messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    let model: string | undefined;
    let stream: boolean;
    let temperature: number | undefined;
    let max_tokens: number | undefined;

    // Try to parse as C1Chat SDK format first
    const sdkResult = C1ChatSDKRequestSchema.safeParse(req.body);
    if (sdkResult.success) {
      // Using C1Chat SDK format
      const { prompt, ...options } = sdkResult.data;
      
      // Extract content from XML-like format if needed
      let content = prompt.content;
      const contentMatch = content.match(/<content>(.*?)<\/content>/s);
      if (contentMatch && contentMatch[1]) {
        content = contentMatch[1].trim();
      }
      
      // Convert SDK format to OpenAI messages format
      messages = [
        {
          role: 'system',
          content: getSystemPrompt('propertySearch')
        },
        {
          role: prompt.role,
          content: content
        }
      ];
      
      model = options.model;
      stream = options.stream ?? true;
      temperature = options.temperature;
      max_tokens = options.max_tokens;
    } else {
      // Using standard OpenAI format
      // Fall back to standard OpenAI format
      const standardResult = C1ChatRequestSchema.parse(req.body);
      ({ messages, model, stream, temperature, max_tokens } = standardResult);
    }

    if (stream) {
      // Handle streaming response
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      
      const streamCompletion = await c1Client.chat.completions.create({
        model: model || process.env.ANTHROPIC_MODEL || 'c1/anthropic/claude-sonnet-4/v-20250815',
        messages,
        stream: true,
        max_tokens: max_tokens || 4000,
        temperature: temperature || 0.7
      });

      // Forward stream to client
      for await (const chunk of streamCompletion) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      // Handle non-streaming response
      const completion = await c1Client.chat.completions.create({
        model: model || process.env.ANTHROPIC_MODEL || 'c1/anthropic/claude-sonnet-4/v-20250815',
        messages,
        stream: false,
        max_tokens: max_tokens || 4000,
        temperature: temperature || 0.7
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        res.status(500).json({
          error: 'No content received from C1 API',
          details: 'The API response was empty or malformed'
        });
        return;
      }

      res.json({
        id: completion.id,
        object: 'chat.completion',
        created: completion.created,
        model: completion.model,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: content
          },
          finish_reason: completion.choices[0]?.finish_reason || 'stop'
        }],
        usage: completion.usage
      });
    }

  } catch (error) {
    console.error('C1 Chat API Error:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Invalid request format',
        details: error.errors
      });
      return;
    }

    if (error instanceof Error) {
      // OpenAI API errors
      if ('status' in error && 'message' in error) {
        res.status((error as any).status || 500).json({
          error: 'C1 Chat API request failed',
          details: error.message
        });
        return;
      }
    }

    res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/c1/transform-scrape - Transform raw Firecrawl data to structured properties
router.post('/transform-scrape', async (req: Request, res: Response): Promise<void> => {
  try {
    const startTime = Date.now();
    
    // Validate request
    const validatedData = C1TransformScrapeRequestSchema.parse(req.body);
    const { rawFirecrawlData, sourceUrl, searchParams, extractionHints } = validatedData;

    // Determine extraction method based on raw data structure
    let extractionMethod = 'mixed';
    let dataForExtraction = '';
    
    if (typeof rawFirecrawlData === 'string') {
      dataForExtraction = rawFirecrawlData;
      extractionMethod = rawFirecrawlData.includes('<html') ? 'html' : 'markdown';
    } else if (rawFirecrawlData && typeof rawFirecrawlData === 'object') {
      // Handle structured Firecrawl response
      if (rawFirecrawlData.markdown) {
        dataForExtraction = rawFirecrawlData.markdown;
        extractionMethod = 'markdown';
      } else if (rawFirecrawlData.html) {
        dataForExtraction = rawFirecrawlData.html;
        extractionMethod = 'html';
      } else if (rawFirecrawlData.structuredData || rawFirecrawlData.extractedData) {
        dataForExtraction = JSON.stringify(rawFirecrawlData.structuredData || rawFirecrawlData.extractedData);
        extractionMethod = 'json';
      } else {
        // Try to use the entire raw data
        dataForExtraction = JSON.stringify(rawFirecrawlData);
        extractionMethod = 'mixed';
      }
    } else {
      dataForExtraction = String(rawFirecrawlData);
    }

    // Construct the extraction prompt
    let extractionPrompt = `Extract property data from the following ${extractionMethod} content scraped from: ${sourceUrl}

${extractionHints ? `User hints: ${extractionHints}\n\n` : ''}`;

    if (searchParams) {
      extractionPrompt += `Original search parameters: ${JSON.stringify(searchParams)}\n\n`;
    }

    extractionPrompt += `Raw data to process:
${dataForExtraction}

Please extract all property listings found in this data and format them according to the schema.`;

    // Prepare messages for C1 API
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: getPropertyExtractionPrompt()
      },
      {
        role: 'user',
        content: extractionPrompt
      }
    ];

    // Call C1 API for property extraction
    const completion = await c1Client.chat.completions.create({
      model: process.env.C1_EXTRACTION_MODEL || process.env.ANTHROPIC_MODEL || 'c1/anthropic/claude-sonnet-4/v-20250815',
      messages,
      stream: false,
      max_tokens: parseInt(process.env.C1_EXTRACTION_MAX_TOKENS || '8000'),
      temperature: parseFloat(process.env.C1_EXTRACTION_TEMPERATURE || '0.3')
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      res.status(500).json({
        success: false,
        error: 'No content received from C1 API',
        properties: [],
        metadata: {
          propertiesExtracted: 0,
          processingTime: Date.now() - startTime,
          model: completion.model || 'unknown',
          tokensUsed: completion.usage?.total_tokens || 0,
          extractionMethod,
          warnings: ['Empty response from C1 API']
        }
      });
      return;
    }

    // Parse the C1 response
    let extractedData;
    try {
      // DEBUG: Log the raw C1 response content
      console.log('Raw C1 response content:', JSON.stringify(content.substring(0, 500)) + '...');
      
      // Try to extract JSON from the response
      let jsonContent = content;
      
      // First check if it's wrapped in <content> tags (C1 component format)
      const contentMatch = content.match(/<content>([\s\S]*?)<\/content>/);
      if (contentMatch && contentMatch[1]) {
        jsonContent = contentMatch[1].trim();
        console.log('Found content in <content> tags, length:', jsonContent.length);
        
        // Decode HTML entities
        jsonContent = jsonContent
          .replace(/&quot;/g, '"')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&');
        
        console.log('HTML entities decoded, length:', jsonContent.length);
      } else {
        // Look for JSON within code blocks
        const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          jsonContent = jsonMatch[1];
          console.log('Found JSON in code block, length:', jsonContent.length);
        } else {
          // Try to find JSON-like content
          const objectMatch = content.match(/\{[\s\S]*\}/);
          if (objectMatch) {
            jsonContent = objectMatch[0];
            console.log('Found JSON-like content, length:', jsonContent.length);
          } else {
            console.log('No JSON pattern found, using raw content');
          }
        }
      }
      
      console.log('Attempting to parse JSON content:', JSON.stringify(jsonContent.substring(0, 200)) + '...');
      const parsedContent = JSON.parse(jsonContent);
      
      // Check if this is a component response instead of property extraction
      if (parsedContent.component || parsedContent.components) {
        console.log('Detected component response, returning UI specifications for frontend rendering');
        
        // Return the UI component specifications for frontend rendering
        // This allows the frontend to display C1-generated UI components
        extractedData = {
          properties: [], // No traditional property extraction
          uiSpec: parsedContent, // Include the UI component specification
          metadata: {
            confidence: 0.8, // High confidence for UI generation
            warnings: [],
            fieldsExtracted: ['ui-components', 'structured-display'],
            fieldsMissing: [],
            extractionMode: 'ui-generation', // Indicate this is UI generation mode
            componentType: parsedContent.component?.component || 'unknown'
          }
        };
      } else {
        // Standard property extraction format
        extractedData = parsedContent;
      }
    } catch (parseError) {
      console.error('Failed to parse C1 response as JSON:', parseError);
      res.status(500).json({
        success: false,
        error: 'Failed to parse C1 response as structured data',
        properties: [],
        metadata: {
          propertiesExtracted: 0,
          processingTime: Date.now() - startTime,
          model: completion.model || 'unknown',
          tokensUsed: completion.usage?.total_tokens || 0,
          extractionMethod,
          warnings: ['Invalid JSON response from C1']
        }
      });
      return;
    }

    // Extract properties and metadata from the response
    const properties = extractedData.properties || [];
    const extractionMetadata = extractedData.metadata || {};

    // Add source metadata to each property and validate with Zod
    const enrichedProperties: any[] = [];
    const validationErrors: Array<{ index: number; errors: string[] }> = [];

    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      
      // Add source metadata
      const enrichedProperty = {
        ...property,
        sourceUrl,
        scrapedAt: new Date().toISOString(),
        searchParams: searchParams || undefined,
        c1Metadata: {
          extractedBy: 'c1' as const,
          confidence: extractionMetadata.confidence || 0.5,
          extractionWarnings: extractionMetadata.warnings || [],
          processedAt: new Date().toISOString(),
          fieldsExtracted: extractionMetadata.fieldsExtracted || [],
          fieldsMissing: extractionMetadata.fieldsMissing || []
        }
      };

      // Validate against ScrapedPropertyData schema
      try {
        const validatedProperty = ScrapedPropertyDataSchema.parse(enrichedProperty);
        enrichedProperties.push(validatedProperty);
      } catch (error) {
        if (error instanceof z.ZodError) {
          const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
          validationErrors.push({
            index: i,
            errors: errorMessages
          });
        } else {
          validationErrors.push({
            index: i,
            errors: [`Unknown validation error: ${error instanceof Error ? error.message : 'Unknown error'}`]
          });
        }
      }
    }

    // If there are validation errors, return a structured 422 error
    if (validationErrors.length > 0) {
      res.status(422).json({
        success: false,
        error: 'Property validation failed',
        details: 'One or more extracted properties failed validation',
        validationErrors,
        properties: [], // No properties returned due to validation failures
        metadata: {
          propertiesExtracted: 0,
          propertiesValidated: enrichedProperties.length,
          propertiesFailed: validationErrors.length,
          confidenceScores: {},
          warnings: [
            ...extractionMetadata.warnings || [],
            `${validationErrors.length} properties failed validation`
          ],
          processingTime: Date.now() - startTime,
          model: completion.model || 'unknown',
          tokensUsed: completion.usage?.total_tokens || 0,
          extractionMethod: extractionMethod as 'markdown' | 'html' | 'json' | 'mixed'
        }
      });
      return;
    }

    // Calculate confidence scores if not provided
    const confidenceScores: Record<string, number> = {};
    enrichedProperties.forEach((property: any, index: number) => {
      confidenceScores[index.toString()] = property.c1Metadata?.confidence || 0.5;
    });

    // Generate transformation metadata
    const transformMetadata = {
      propertiesExtracted: enrichedProperties.length,
      confidenceScores,
      warnings: extractionMetadata.warnings || [],
      processingTime: Date.now() - startTime,
      model: completion.model || 'unknown',
      tokensUsed: completion.usage?.total_tokens || 0,
      extractionMethod: extractionMethod as 'markdown' | 'html' | 'json' | 'mixed'
    };

    // Return successful response
    res.json({
      success: true,
      properties: enrichedProperties,
      uiSpec: extractedData.uiSpec, // Include UI specifications if available
      metadata: transformMetadata
    });

  } catch (error) {
    console.error('C1 Transform Scrape Error:', error);
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Invalid request format',
        details: error.errors,
        properties: [],
        metadata: {
          propertiesExtracted: 0,
          warnings: ['Invalid request format'],
          processingTime: 0,
          model: 'unknown',
          tokensUsed: 0,
          extractionMethod: 'unknown'
        }
      });
      return;
    }

    if (error instanceof Error) {
      // OpenAI API errors
      if ('status' in error && 'message' in error) {
        res.status((error as any).status || 500).json({
          success: false,
          error: 'C1 API request failed',
          details: error.message,
          properties: [],
          metadata: {
            propertiesExtracted: 0,
            warnings: [error.message],
            processingTime: 0,
            model: 'unknown',
            tokensUsed: 0,
            extractionMethod: 'unknown'
          }
        });
        return;
      }
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
      properties: [],
      metadata: {
        propertiesExtracted: 0,
        warnings: ['Internal server error'],
        processingTime: 0,
        model: 'unknown',
        tokensUsed: 0,
        extractionMethod: 'unknown'
      }
    });
  }
});

// GET /api/c1/health - Health check endpoint
router.get('/health', async (_req: Request, res: Response) => {
  try {
    // Basic health check - verify API key and endpoint are configured
    const hasApiKey = !!process.env.THESYS_C1_API_KEY;
    const hasEndpoint = !!process.env.THESYS_C1_ENDPOINT;
    
    res.json({
      status: 'healthy',
      configured: {
        apiKey: hasApiKey,
        endpoint: hasEndpoint
      },
      endpoint: process.env.THESYS_C1_ENDPOINT,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;