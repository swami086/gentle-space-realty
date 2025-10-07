# Gentle Space Realty - Documentation

## 📋 Overview

Gentle Space Realty is a modern real estate platform built with **direct Supabase integration** for maximum performance and simplicity. The application uses a pure frontend-to-Supabase architecture without API routes or serverless functions.

## 🏗️ Architecture

### Direct Frontend-to-Supabase Architecture

```
Frontend (React/TypeScript)
         ↓
    Supabase Client
         ↓
┌─────────────────────────────────┐
│         Supabase Cloud          │
├─────────────────────────────────┤
│ • PostgreSQL Database           │
│ • Row Level Security (RLS)      │
│ • Real-time Subscriptions       │
│ • Storage (Images/Files)        │
│ • Authentication                │
└─────────────────────────────────┘
```

### Key Benefits

✅ **Simplified Architecture**: No backend API, direct database access  
✅ **Real-time Updates**: Live property and inquiry updates  
✅ **Enhanced Security**: RLS policies enforce data access  
✅ **Better Performance**: Reduced latency, fewer hops  
✅ **Easier Maintenance**: Single codebase, fewer moving parts  
✅ **Cost Effective**: No server costs, pay-per-use pricing  

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- Vercel account (optional, for deployment)

### Installation

```bash
# Clone repository
git clone https://gitlab.com/gl-demo-ultimate-sragupathi/gentle_spaces.git
cd gentle_spaces

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.production
# Edit .env.production with your Supabase credentials

# Run validation
npm run validate:supabase

# Start development
npm run dev
```

### Environment Setup

```bash
# .env.production
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key # Optional for admin functions
```

## 📚 Documentation Structure

- [**Architecture Guide**](./architecture.md) - Technical architecture and design decisions
- [**API Reference**](./api-reference.md) - Frontend API layer documentation
- [**Database Schema**](./database-schema.md) - Supabase database structure
- [**Deployment Guide**](./deployment.md) - Production deployment instructions
- [**Testing Guide**](./testing.md) - Testing strategies and validation
- [**Troubleshooting**](./troubleshooting.md) - Common issues and solutions

## 🔧 Available Scripts

```bash
# Development
npm run dev                    # Start development server
npm run build                  # Build for production
npm run preview                # Preview production build

# Testing & Validation
npm run validate:supabase      # Validate Supabase integration
npm run validate:comprehensive # Run full test suite
npm run validate:all           # Complete validation pipeline
npm run test                   # Run Jest tests
npm run test:integration       # Integration tests only

# Code Quality
npm run lint                   # ESLint checking
npm run typecheck              # TypeScript validation

# Deployment
npm run deploy:check           # Pre-deployment validation
npm run vercel:deploy          # Deploy to Vercel
npm run health:check           # Health check validation
```

## 📦 Project Structure

```
src/
├── components/           # React components
│   ├── ui/              # Reusable UI components
│   ├── forms/           # Form components
│   └── layout/          # Layout components
├── hooks/               # Custom React hooks
│   ├── useSupabaseAuth.ts
│   └── useSupabaseRealtime.ts
├── lib/                 # Core libraries
│   ├── api.ts           # API layer
│   ├── supabaseClient.ts # Supabase configuration
│   └── utils.ts         # Utility functions
├── services/            # Business logic
│   ├── supabaseService.ts
│   └── uploadService.ts
├── types/               # TypeScript definitions
└── pages/               # Route components

scripts/                 # Validation and utility scripts
├── validate-supabase-integration.js
├── run-comprehensive-tests.js
└── validate-env.js

tests/                   # Test files
├── integration/         # Integration tests
└── unit/               # Unit tests

docs/                    # Documentation
```

## 🗄️ Database Tables

| Table | Purpose | Key Features |
|-------|---------|--------------|
| `users` | User management | RLS, admin roles |
| `properties` | Property listings | Full-text search, categories |
| `property_images` | Property photos | Storage bucket integration |
| `inquiries` | Customer inquiries | Status tracking, assignment |
| `analytics_events` | Usage analytics | Performance metrics |

## 🔒 Security Features

- **Row Level Security (RLS)**: Database-level access control
- **Environment Variables**: Secure credential management
- **HTTPS Only**: Secure data transmission
- **Input Validation**: Zod schema validation
- **Error Handling**: Comprehensive error boundaries

## 📊 Performance Metrics

- **Bundle Size**: < 1MB JavaScript, < 100KB CSS
- **Load Time**: < 3s on 3G networks
- **Database Response**: < 200ms average
- **Real-time Latency**: < 100ms for updates

## 🎯 Key Features

### Property Management
- Create, read, update, delete properties
- Image upload with optimization
- Real-time updates
- Advanced search and filtering

### Inquiry Management  
- Customer inquiry handling
- Agent assignment
- Status tracking
- Email notifications

### Real-time Updates
- Live property updates
- Instant inquiry notifications
- Connection health monitoring
- Automatic reconnection

### Analytics
- Property view tracking
- User behavior analytics
- Performance monitoring
- Usage statistics

## 🚀 Deployment

The application is deployed on Vercel with automatic deployments from the GitLab repository:

- **Production**: https://gentle-space-realty.vercel.app
- **Repository**: https://gitlab.com/gl-demo-ultimate-sragupathi/gentle_spaces.git

## 📞 Support

For issues and questions:
- GitLab Issues: https://gitlab.com/gl-demo-ultimate-sragupathi/gentle_spaces/-/issues
- Documentation: [docs/](./docs/)
- Health Check: `npm run health:check`

---

*Built with ❤️ using React, TypeScript, Supabase, and Vercel*