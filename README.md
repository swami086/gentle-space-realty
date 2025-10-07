# Gentle Space Realty - AI-Powered Premium Office Space Rental Platform

A next-generation real estate platform for premium office space rentals in Bengaluru, built with React, TypeScript, Supabase, and powered by advanced AI technology. Features include AI-powered property recommendations, intelligent search, budget calculators, Google Maps integration, custom property tagging, admin management, and a "contact for pricing" business model.

## 🚀 Features

### 🤖 AI-Powered Features
- **AI Property Assistant**: Conversational property search with natural language understanding
- **Personalized Recommendations**: ML-powered property suggestions based on user preferences
- **Smart Budget Calculator**: Intelligent cost analysis with ROI projections and insights
- **Property Comparison Tool**: AI-driven side-by-side property analysis with scoring
- **Amenity Explorer**: Intelligent amenity-based property discovery
- **Smart Inquiry Forms**: Context-aware forms that adapt to user intent
- **Dynamic UI Generation**: AI-generated interfaces using Thesys C1 SDK
- **Predictive Analytics**: Property scoring and market insights

### Core Features
- **Property Listings**: Browse premium office spaces with detailed information
- **Google Maps Integration**: Interactive and static maps with location privacy
- **Custom Tagging System**: Flexible property categorization with colored tags
- **Contact for Pricing**: Professional inquiry-based pricing model
- **Advanced Search & Filtering**: Filter by location, category, availability, and tags
- **Admin Dashboard**: Complete property and tag management system
- **Responsive Design**: Mobile-first approach with modern UI/UX
- **Real-time Data**: Powered by Supabase for instant updates

### Technical Features
- **TypeScript**: Full type safety throughout the application
- **AI Integration**: Powered by Thesys C1 SDK and Anthropic Claude
- **Supabase Integration**: Real-time database with Row Level Security
- **Google Maps JavaScript API**: Dynamic maps with geocoding and static previews
- **Zustand State Management**: Lightweight and efficient state management with AI store
- **Tailwind CSS**: Utility-first CSS framework for consistent design
- **React Router**: Client-side routing with protected admin routes
- **Media Management**: Image and video uploads with storage integration
- **Generative UI**: Dynamic interface generation based on AI analysis
- **Intelligent Caching**: Smart caching strategies for AI responses and property data

## 🗺️ Google Maps Setup

This application integrates Google Maps for location visualization and property mapping. Follow these steps to set up Google Maps integration:

### 1. Google Cloud Platform Setup

1. **Create a Google Cloud Project**:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Note down your project ID

2. **Enable Required APIs**:
   ```bash
   # Enable Maps JavaScript API
   gcloud services enable maps-backend.googleapis.com
   
   # Enable Geocoding API (for address lookups)
   gcloud services enable geocoding-backend.googleapis.com
   
   # Enable Static Maps API (for static map previews)
   gcloud services enable static-maps-backend.googleapis.com
   ```

3. **Create API Credentials**:
   - Go to **APIs & Credentials** > **Credentials**
   - Click **Create Credentials** > **API Key**
   - Copy the generated API key
   - **Restrict the API Key** (recommended for security):
     - Go to API Key settings
     - Under **Application restrictions**, select **HTTP referrers**
     - Add your domain(s): `localhost:5174/*`, `yourdomain.com/*`
     - Under **API restrictions**, select **Restrict key**
     - Choose: **Maps JavaScript API**, **Geocoding API**, **Maps Static API**

### 2. Environment Configuration

**Quick Setup (Recommended)**:
```bash
# Interactive environment setup
npm run setup:env

# Validate configuration
npm run validate:env
```

**Manual Setup**:
1. **Copy the environment template**:
   ```bash
   cp .env.example .env
   ```

2. **Configure your environment variables**:
   ```env
   # Required variables
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
   VITE_API_BASE_URL=http://localhost:3001/api
   
   # AI Configuration
   VITE_THESYS_C1_API_KEY=your-thesys-c1-api-key
   VITE_ANTHROPIC_API_KEY=your-anthropic-api-key
   VITE_AI_ENABLED=true
   
   # Backend variables
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   SUPABASE_JWT_SECRET=your-jwt-secret
   CORS_ORIGIN=http://localhost:5173
   ```

3. **Verify setup**:
   ```bash
   npm run validate:env
   ```

📖 **Detailed Setup Guide**: See [docs/ENVIRONMENT_SETUP.md](./docs/ENVIRONMENT_SETUP.md) for comprehensive configuration instructions.

### 3. Google Maps Features Implementation

The application includes several Google Maps features:

#### Interactive Maps (`MapView.tsx`)
- **Dynamic map rendering** with zoom and pan controls
- **Custom markers** for property locations
- **Radius circles** for approximate locations (privacy protection)
- **Geocoding fallback** for address-based locations
- **Click interactions** and info windows

#### Static Map Previews (`StaticMapView.tsx`)
- **Static map images** for fast loading previews
- **Customizable markers** and styling
- **Click-to-expand** functionality to full interactive maps
- **Bandwidth optimization** with cached images

#### Mini-Maps (`MiniMap.tsx`) - NEW
- **Embedded mini-maps** in property cards for quick location reference
- **1km radius circles** showing approximate location areas
- **Google Static Maps API** integration for fast loading
- **Fallback UI** when maps are unavailable
- **Click to open in Google Maps** functionality
- **Responsive design** with multiple size variants

#### Location Privacy Features
- **Approximate locations** with configurable radius
- **Landmark-based descriptions** instead of exact addresses
- **Coordinate precision control** for sensitive properties
- **Privacy-first mapping** with user consent

### 4. Map Configuration Options

You can customize map behavior in the components:

```typescript
// MapView configuration
<MapView
  coordinates={{ lat: 12.9716, lng: 77.5946 }}
  approximateLocation={{
    area: "Koramangala 5th Block",
    radius: "1km",
    landmarks: ["Forum Mall", "Sony Signal"]
  }}
  zoom={15}
  height="400px"
  showRadius={true}
  interactive={true}
/>

// StaticMapView configuration  
<StaticMapView
  coordinates={{ lat: 12.9716, lng: 77.5946 }}
  width={500}
  height={300}
  zoom={15}
  mapType="roadmap"
  onClick={() => setShowFullMap(true)}
/>
```

### 5. Troubleshooting Google Maps

**Common Issues and Solutions**:

1. **Maps not loading**:
   - Check API key in browser developer tools
   - Verify API key restrictions (domain/IP)
   - Confirm APIs are enabled in Google Cloud Console
   - Check browser console for specific error messages

2. **"This page can't load Google Maps correctly"**:
   - API key is missing or invalid
   - Billing not enabled on Google Cloud Project
   - Domain not added to API key restrictions

3. **Geocoding not working**:
   - Enable Geocoding API in Google Cloud Console
   - Check API key has Geocoding API access
   - Verify address format and location exists

4. **Static maps not loading**:
   - Enable Maps Static API
   - Check image URLs in network tab
   - Verify API key restrictions allow Static Maps API

5. **API Quota Exceeded**:
   - Check usage in Google Cloud Console
   - Consider implementing request caching
   - Optimize map loads (lazy loading, static previews)

**Security Best Practices**:
- Always restrict API keys by domain and API
- Use environment variables, never commit API keys to code
- Use client-side security best practices for API key management
- Monitor API usage and set up billing alerts
- Regularly rotate API keys

## 🛠️ Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/en/) (v16 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- Google Cloud Platform account (for Maps API)
- Supabase account (for database)

### Local Development Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd gentle_space_realty_i1aw6b
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Configuration**:
   ```bash
   # Use the interactive setup (recommended)
   npm run setup:env
   
   # Or copy template manually
   cp .env.example .env
   ```
   
   **Environment Management Scripts**:
   - `npm run setup:env` - Interactive environment setup
   - `npm run validate:env` - Validate environment configuration
   
   See [docs/ENVIRONMENT_SETUP.md](./docs/ENVIRONMENT_SETUP.md) for detailed configuration guide.

4. **Supabase Setup**:
   - Create your tables in Supabase Studio dashboard
   - Configure Row Level Security (RLS) policies
   - Upload sample data via Supabase Studio (optional)

5. **Start development server**:
   ```bash
   npm run dev
   ```

6. **Access the application**:
   - Application: [http://localhost:5174](http://localhost:5174)
   - Admin Panel: [http://localhost:5174/admin](http://localhost:5174/admin)

## 🤖 AI Integration Setup

### Prerequisites for AI Features
- [Thesys C1 API Key](https://c1.thesys.ai/) - For generative UI and property analysis
- [Anthropic API Key](https://console.anthropic.com/) - For Claude AI assistant

### AI Services Configuration

1. **Thesys C1 Setup**:
   - Sign up at [c1.thesys.ai](https://c1.thesys.ai/)
   - Generate your API key
   - Add `VITE_THESYS_C1_API_KEY` to your environment

2. **Anthropic Claude Setup**:
   - Create account at [console.anthropic.com](https://console.anthropic.com/)
   - Generate API key with appropriate limits
   - Add `VITE_ANTHROPIC_API_KEY` to your environment

3. **AI Feature Toggle**:
   ```env
   VITE_AI_ENABLED=true  # Set to false to disable AI features
   ```

### AI Components Overview

#### Core AI Components (`src/components/ai/`)
- **AIPropertyAssistant**: Conversational property search interface
- **PersonalizedRecommendations**: ML-powered property suggestions
- **BudgetCalculator**: Intelligent cost analysis with insights
- **PropertyComparison**: AI-driven property comparison tool
- **AmenityExplorer**: Smart amenity-based property discovery
- **SmartInquiryForm**: Context-aware inquiry forms
- **GenUIRenderer**: Dynamic UI generation engine

#### AI Services (`src/services/`)
- **thesysC1Service**: Thesys C1 API integration for generative UI
- **aiAnalysisService**: Property analysis and scoring algorithms
- **recommendationEngine**: ML-based recommendation system

#### AI State Management (`src/store/`)
- **aiStore**: Centralized AI state management with persistence
- **Conversation history**: Chat context and user preferences
- **Recommendation cache**: Intelligent caching of AI responses
- **Analytics tracking**: User interaction and AI performance metrics

### AI Features Usage

#### Property Search with AI
```typescript
// Natural language property search
"Find me a 10-person office near Koramangala with parking"
"Show modern offices under ₹1L per month with good WiFi"
"I need a co-working space for my startup team"
```

#### Budget Analysis
```typescript
// AI-powered cost breakdown
- Comprehensive cost analysis including hidden fees
- ROI projections for different lease terms
- Market comparison and optimization suggestions
- Location-based pricing insights
```

#### Property Recommendations
```typescript
// Personalized suggestions based on:
- User search history and preferences
- Budget and team size requirements
- Location and amenity preferences
- Market trends and availability
```

### Monitoring AI Performance

The application includes built-in AI analytics:
- **Response accuracy**: Track recommendation success rates
- **User engagement**: Monitor AI feature usage
- **Performance metrics**: API response times and error rates
- **Cost tracking**: Monitor API usage and costs

## 🎨 C1 Generative UI Integration

The application integrates with Thesys C1 SDK for AI-powered generative user interfaces, transforming natural language prompts into interactive React components.

### Overview

C1 SDK enables dynamic UI generation where property search queries generate functional interfaces rather than static responses. Perfect for creating contextual property discovery tools and interactive data visualization.

### Setup

For detailed implementation guidelines, see [docs/C1_SDK_IMPLEMENTATION_GUIDE.md](./docs/C1_SDK_IMPLEMENTATION_GUIDE.md)

### Testing Routes

Access these routes to test and explore C1 SDK functionality:

- **`/test-c1`** - API connectivity and configuration test
- **`/c1-template`** - Basic C1Component rendering demonstration
- **`/c1-real-estate`** - Full-featured property search with C1 SDK
- **`/c1-chat`** - Conversational interface using C1Chat component

### Environment Variables

C1 SDK requires these environment variables:

```env
# Required - API key from Thesys Console
VITE_THESYS_C1_API_KEY=your_api_key_here

# Optional - Custom endpoint (uses default if not provided)
VITE_THESYS_C1_ENDPOINT=https://api.thesys.ai/v1/chat/completions

# Optional - Model selection (uses default if not provided)
VITE_ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```

### Getting Started

1. **Get API Key**: Visit [Thesys Console](https://chat.thesys.dev/console/keys) to create an API key
2. **Set Environment Variables**: Add your API key to your `.env` file
3. **Test Integration**: Navigate to `/test-c1` to verify connectivity
4. **Explore Examples**: Try `/c1-real-estate` for a full-featured implementation

### Reference Implementation

The template implementation is available in `template-c1-component-next/` directory, showcasing best practices for C1 SDK integration.

## 🔍 C1-Powered Property Extraction

The application includes an advanced property scraping system powered by Thesys C1 AI for intelligent data extraction from real estate websites.

### Overview

The C1 Property Extraction system transforms raw web scraping data into structured property listings using AI-powered analysis. This feature provides a seamless workflow from data scraping to property import with human oversight.

### Key Features

#### Raw Data Processing
- **Multi-format support**: Processes markdown, HTML, JSON, and mixed content from Firecrawl
- **Intelligent extraction**: Uses C1 AI to identify and structure property information
- **Confidence scoring**: Each extracted property receives a confidence score (0-1)
- **Field mapping**: Automatically maps unstructured data to property schema

#### Review Interface
- **Interactive property review**: GenUI-powered review interface for C1 extractions
- **Real-time editing**: Modify extracted properties before import
- **Confidence visualization**: Color-coded confidence levels for quality assessment
- **Bulk selection**: Approve multiple properties simultaneously

#### Quality Assurance
- **Validation pipeline**: Comprehensive property validation before import
- **Warning system**: Alerts for missing or questionable data
- **Manual override**: Human review and correction capabilities
- **Audit trail**: Complete tracking of C1 processing and human decisions

### Setup and Configuration

#### Environment Variables

Add these C1-specific variables to your `.env` file:

```env
# C1 API Configuration
THESYS_C1_API_KEY=your_c1_api_key_here
THESYS_C1_ENDPOINT=https://api.thesys.dev/v1/embed

# C1 Extraction Settings
C1_EXTRACTION_MODEL=c1/anthropic/claude-sonnet-4/v-20250815
C1_EXTRACTION_MAX_TOKENS=8000
C1_EXTRACTION_TEMPERATURE=0.3
C1_EXTRACTION_TIMEOUT=60000

# Frontend C1 Settings
REACT_APP_C1_EXTRACTION_ENABLED=true
REACT_APP_C1_EXTRACTION_TIMEOUT=60000
```

#### Backend Dependencies

The backend C1 integration requires:

```bash
npm install openai zod
```

### Usage Workflow

#### 1. Initial Scraping
Use the property scraper to collect raw data from real estate websites:

```typescript
// Scrape raw property data using Firecrawl
const response = await ScraperService.scrapeProperties({
  directUrl: 'https://example-property-site.com',
  useCrawl: false,
  maxPages: 1
});
```

#### 2. C1 Processing
Transform raw data using C1 AI extraction:

```typescript
// Send raw data to C1 for intelligent processing
const c1Response = await C1TransformService.transformFirecrawlData(
  rawData,
  sourceUrl,
  searchParams,
  extractionHints
);
```

#### 3. Review and Import
Review extracted properties and import approved ones:

```typescript
// Review properties using GenUI interface
<C1PropertyReview
  extractedProperties={c1Response.properties}
  rawFirecrawlData={rawData}
  transformMetadata={c1Response.metadata}
  onApprove={handleApprove}
  onReject={handleReject}
  onEdit={handleEdit}
/>
```

### API Endpoints

#### C1 Transform Endpoint
**POST** `/api/v1/c1/transform-scrape`

Transform raw Firecrawl data into structured properties:

```typescript
interface C1TransformRequest {
  rawFirecrawlData: any;              // Raw scraped data
  sourceUrl: string;                  // Source website URL
  searchParams?: SearchParameters;    // Original search criteria
  extractionHints?: string;          // Additional extraction guidance
}

interface C1TransformResponse {
  success: boolean;
  properties: ScrapedPropertyData[];  // Structured property data
  metadata: C1TransformMetadata;      // Processing metadata
  error?: string;
}
```

### Property Schema

The C1 extraction system maps unstructured data to this schema:

```typescript
interface ScrapedPropertyData {
  // Required fields
  title: string;
  description: string;
  location: string;
  
  // Optional structured fields
  price?: {
    amount: number;
    currency: 'INR' | 'USD' | 'EUR';
    period: 'monthly' | 'yearly' | 'one-time';
  };
  
  size?: {
    area: number;
    unit: 'sqft' | 'seats';
  };
  
  amenities?: string[];
  features?: PropertyFeatures;
  contact?: ContactInfo;
  media?: MediaInfo;
  availability?: AvailabilityInfo;
  
  // C1 metadata
  c1Metadata?: {
    extractedBy: 'c1' | 'firecrawl' | 'manual';
    confidence: number;              // 0-1 confidence score
    extractionWarnings: string[];   // Processing warnings
    processedAt: string;            // ISO timestamp
    fieldsExtracted: string[];      // Successfully extracted fields
    fieldsMissing: string[];        // Missing fields
  };
}
```

### Confidence Scoring

C1 extraction includes intelligent confidence scoring:

- **High Confidence (0.8-1.0)**: Complete data extraction with minimal issues
- **Medium Confidence (0.5-0.79)**: Good extraction with some missing fields
- **Low Confidence (0.0-0.49)**: Partial extraction requiring review

### Error Handling

The system includes comprehensive error handling:

- **Timeout protection**: Operations timeout after 60 seconds by default
- **Validation errors**: Detailed validation feedback for malformed data
- **API errors**: Graceful handling of C1 API issues with fallback options
- **Network errors**: Retry logic and connection failure recovery

### Performance Optimization

- **Progress tracking**: Real-time progress updates during C1 processing
- **Cancellation support**: Ability to cancel long-running extractions
- **Batch processing**: Efficient handling of multiple properties
- **Caching**: Intelligent caching of C1 responses to reduce API calls

### Monitoring and Analytics

Track C1 extraction performance:

- **Processing time**: Monitor extraction duration and API latency
- **Success rates**: Track extraction success vs. failure rates  
- **Quality metrics**: Monitor confidence scores and accuracy
- **Token usage**: Track C1 API token consumption and costs
- **Error patterns**: Identify common extraction issues

### Best Practices

1. **Data Quality**: Always review low-confidence extractions manually
2. **Hint Optimization**: Provide extraction hints for better results
3. **Batch Operations**: Process multiple properties in single requests when possible
4. **Error Recovery**: Implement fallback strategies for API failures
5. **User Feedback**: Collect user feedback on extraction quality

### Troubleshooting

**Common Issues**:

1. **Low confidence scores**: Provide more specific extraction hints or improve raw data quality
2. **Missing fields**: Check if source data contains required information
3. **API timeouts**: Reduce data size or increase timeout settings
4. **Validation errors**: Review property schema compliance

**Debug Mode**:

Enable detailed logging by setting:

```env
NODE_ENV=development
DEBUG=c1-extraction:*
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (buttons, inputs, etc.)
│   ├── admin/          # Admin panel components
│   ├── ai/             # AI-powered components
│   │   ├── AIPropertyAssistant.tsx
│   │   ├── PersonalizedRecommendations.tsx
│   │   ├── BudgetCalculator.tsx
│   │   ├── PropertyComparison.tsx
│   │   ├── AmenityExplorer.tsx
│   │   ├── SmartInquiryForm.tsx
│   │   └── GenUIRenderer.tsx
│   ├── MapView.tsx     # Interactive Google Maps component
│   └── StaticMapView.tsx # Static map preview component
├── data/               # Mock data and constants
│   ├── mockProperties.ts # Sample property data
│   └── mockTags.ts     # Sample tag data
├── hooks/              # Custom React hooks
│   └── useThesysC1.ts  # Thesys C1 integration hook
├── lib/                # Third-party library configurations
├── pages/              # Page components
├── services/           # API and external service integrations
│   ├── supabaseService.ts # Supabase database operations
│   └── thesysC1Service.ts # AI service integration
├── store/              # Zustand state management
│   └── aiStore.ts      # AI-specific state management
├── types/              # TypeScript type definitions
│   ├── property.ts     # Property and tag type definitions
│   ├── admin.ts        # Admin and inquiry type definitions
│   └── thesys.ts       # AI and generative UI type definitions
└── utils/              # Utility functions
```

## 🏗️ Database Schema

### Core Tables
- **properties**: Main property information with map coordinates and AI scores
- **property_tags**: Custom tag definitions with colors
- **property_tag_assignments**: Many-to-many relationship between properties and tags
- **inquiries**: Customer inquiries and contact requests (enhanced with AI context)
- **testimonials**: Customer reviews and feedback
- **users**: Admin user accounts with role-based access
- **user_preferences**: AI-learned user preferences and search patterns
- **ai_recommendations**: Generated property recommendations with confidence scores
- **conversation_history**: AI assistant conversation logs and context
- **property_analytics**: AI-generated property insights and market analysis

### Key Features
- **Row Level Security (RLS)**: Secure data access patterns
- **JSON Fields**: Flexible storage for coordinates and location data
- **Foreign Key Constraints**: Data integrity and relationships
- **Indexes**: Optimized queries for search and filtering

## 🎨 Custom Tagging System

The application includes a flexible tagging system for property categorization:

### Tag Management
- **Color-coded tags** with custom background and text colors
- **Admin-controlled creation** and management
- **Active/inactive status** for tag lifecycle management
- **Bulk assignment** to multiple properties
- **AI-suggested tags** based on property analysis

### Tag Features
- **Visual consistency** with predefined color palettes
- **Search and filtering** by tag combinations  
- **Tag descriptions** for admin reference
- **Usage analytics** and reporting
- **AI tag optimization** for better search and recommendations

## 🤖 AI Features Deep Dive

### AI Property Assistant
Conversational interface for natural language property search:
- **Natural language processing** for search queries
- **Context-aware responses** with property suggestions
- **Follow-up questions** to refine search criteria
- **Memory of conversation** for better recommendations

### Personalized Recommendations
Machine learning-powered property suggestions:
- **Behavioral analysis** of user interactions
- **Preference learning** from search patterns
- **Confidence scoring** for recommendation quality
- **Reason explanations** for each suggestion

### Smart Budget Calculator
Intelligent cost analysis with AI insights:
- **Comprehensive cost breakdown** including hidden fees
- **ROI projections** for different scenarios
- **Market comparison** and optimization tips
- **Location-based pricing** insights

### Property Comparison Tool
AI-driven property analysis and comparison:
- **Multi-criteria scoring** system
- **Pros and cons analysis** for each property
- **Market positioning** and value assessment
- **Decision support** recommendations

### Amenity Explorer
Smart amenity-based property discovery:
- **Intelligent matching** of amenities to requirements
- **Importance weighting** of different features
- **Alternative suggestions** for unavailable amenities
- **Amenity trend analysis** and predictions

## 🔐 Admin Panel Features

### Property Management
- **CRUD operations** for all properties
- **Media upload** with image and video support
- **Location management** with map integration
- **Tag assignment** with visual interface
- **Availability status** control
- **AI scoring** and property analysis
- **Performance metrics** and recommendation insights

### Tag Management
- **Create custom tags** with color schemes
- **Tag lifecycle management** (active/inactive)
- **Usage tracking** and analytics
- **Bulk operations** and tag cleanup

### Analytics Dashboard
- **Property performance** metrics with AI insights
- **Inquiry tracking** and conversion rates
- **Tag usage** statistics and AI optimization
- **User engagement** analytics
- **AI performance metrics** and accuracy tracking
- **Recommendation success** rates and user feedback
- **Search pattern analysis** and trend identification
- **Budget calculator** usage and accuracy metrics

## 🚀 Deployment

### Build for Production
```bash
# Create production build
npm run build

# Preview production build locally
npm run preview
```

### Environment Variables for Production
Ensure all production environment variables are configured:
- Supabase production URLs and keys
- Google Maps API key with production domain restrictions
- Proper CORS settings for your domain

### Recommended Hosting Platforms
- **Vercel**: Zero-config deployment with automatic builds
- **Netlify**: Easy static site deployment with form handling
- **Firebase Hosting**: Google Cloud integration
- **AWS S3 + CloudFront**: Scalable static site hosting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the troubleshooting section in this README
- Review Google Maps API documentation
- Consult Supabase documentation for database issues

## 🔗 Related Resources

### Core Technologies
- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [Supabase Documentation](https://supabase.com/docs)
- [React TypeScript Documentation](https://react-typescript-cheatsheet.netlify.app/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### AI Integration
- [Thesys C1 API Documentation](https://docs.thesys.ai/c1)
- [Anthropic Claude API Documentation](https://docs.anthropic.com/)
- [AI Features Implementation Guide](./docs/AI_FEATURES_GUIDE.md)

### Additional Documentation
- [Environment Setup Guide](./docs/ENVIRONMENT_SETUP.md)
- [AI Features Guide](./docs/AI_FEATURES_GUIDE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [API Reference](./docs/API_REFERENCE.md)

---

**🤖 AI-Enhanced Real Estate Platform** - Powered by Thesys C1 and Anthropic Claude

*Transforming property discovery through intelligent AI assistants, personalized recommendations, and smart analysis tools.*
