/**
 * Express.js Backend Server
 * Main entry point for the Gentle Space Realty API
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import dotenv from 'dotenv';
import { validateBackendEnvironment, type BackendConfig } from './config/environment';
import { createLogger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { rateLimitMiddleware } from './middleware/rateLimiter'; // Rate limiting disabled at middleware level
import { authMiddleware } from './middleware/authMiddleware';
// import { validationMiddleware } from './middleware/validationMiddleware';
// Remove unused import

// Import routes
import authRoutes from './routes/auth';
import propertiesRoutes from './routes/properties';
import testimonialsRoutes from './routes/testimonials';
import usersRoutes from './routes/users';
import inquiriesRoutes from './routes/inquiries';
import healthRoutes from './routes/health';
import faqsRoutes from './routes/faqs';
import companiesRoutes from './routes/companies';
import tagsRoutes from './routes/tags';
import c1Routes from './routes/c1';
import scraperRoutes from './routes/scraper';

// Load environment variables from the backend .env file
dotenv.config({ path: '.env' });

// Validate environment configuration
const env: BackendConfig = validateBackendEnvironment(process.env);

// Initialize logger
const logger = createLogger(env.LOG_LEVEL);

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false, // Allow embedding for development
  contentSecurityPolicy: false // Handle CSP in frontend
}));

// CORS configuration
const corsOptions = {
  origin: env.CORS_ORIGINS.split(',').map(origin => origin.trim()),
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type', 
    'Accept', 
    'Authorization',
    'X-Request-ID',
    'X-Client-Version',
    'X-Client-Info'
  ]
};

app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use(rateLimitMiddleware); // Rate limiting disabled at middleware level

// Request logging middleware
app.use((req, _res, next) => {
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.requestId = requestId;
  
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    path: req.path,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });
  
  next();
});

// Simple health check route (no auth required)
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'gentle-space-realty-api'
  });
});

// Detailed health check route (no auth required)
app.use('/api/health', healthRoutes);
app.use('/api/v1/health', healthRoutes);

// API routes with authentication middleware
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/properties', propertiesRoutes); // Public read, auth for write (handled in routes)
app.use('/api/v1/testimonials', testimonialsRoutes); // Public read, auth for write
app.use('/api/v1/users', authMiddleware, usersRoutes);
app.use('/api/v1/inquiries', inquiriesRoutes); // Public submit, auth for management
app.use('/api/v1/faqs', faqsRoutes); // Public read, auth for write
app.use('/api/v1/companies', companiesRoutes); // Public read active, auth for management
app.use('/api/v1/tags', tagsRoutes); // Public read active, auth for management
app.use('/api/c1', c1Routes); // C1 API proxy for frontend
app.use('/api/v1/c1', c1Routes); // C1 API proxy for frontend (backwards compatibility)

// Scraper routes for property data extraction (builds search URLs, uses Firecrawl to scrape) - admin only
app.use('/api/v1/scraper', scraperRoutes);

// Backwards compatibility (redirect old routes)
app.use('/api', (req, res, next) => {
  if (req.path.startsWith('/v1/')) {
    return next();
  }
  // Redirect old API calls to v1
  const newPath = `/api/v1${req.path}`;
  res.redirect(301, newPath);
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = env.PORT;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`, {
    environment: env.NODE_ENV,
    port: PORT,
    corsOrigins: env.CORS_ORIGINS,
    database: env.DB_HOST ? 'GCP Cloud SQL configured' : 'missing',
    firebase: env.FIREBASE_PROJECT_ID ? 'configured' : 'missing'
  });

  // Test GCP Cloud SQL connection
  import('./services/cloudSqlService').then(({ testConnection }) => {
    testConnection().then((connected) => {
      if (!connected) {
        logger.error('GCP Cloud SQL connection failed');
      } else {
        logger.info('✅ GCP Cloud SQL connection established successfully');
      }
    });
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', { error: error.message, stack: error.stack });
  process.exit(1);
});

export default app;

// Extend Express Request interface for TypeScript
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}