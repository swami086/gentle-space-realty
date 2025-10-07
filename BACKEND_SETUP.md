# Gentle Space Realty - Backend Setup Guide

## 🚀 Customer Inquiry Management System

A comprehensive backend API system for managing customer inquiries with advanced features including spam detection, email notifications, analytics, and admin management.

## 📋 Features Implemented

### 🔐 Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (admin, super_admin)
- Secure password hashing with bcrypt
- Protected admin routes

### 📝 Inquiry Management
- **Public API**: Customer inquiry submission with validation
- **Admin API**: Full CRUD operations for inquiry management
- **Status Tracking**: new → contacted → in_progress → converted/closed
- **Priority Management**: low, medium, high priority levels
- **Assignment System**: Assign inquiries to specific admins
- **Notes System**: Add internal notes and follow-up dates

### 🛡️ Security & Spam Protection
- **Spam Detection**: AI-powered content analysis
- **Rate Limiting**: Configurable limits per endpoint
- **Input Validation**: Comprehensive data validation with Joi
- **Security Headers**: Helmet.js for security best practices
- **CORS Protection**: Configurable cross-origin policies

### 📧 Email Notifications
- **Customer Confirmations**: Automatic inquiry confirmations
- **Admin Alerts**: New inquiry notifications
- **Status Updates**: Customer status change notifications
- **Follow-up Reminders**: Automated reminder system
- **HTML Templates**: Professional email templates

### 📊 Analytics & Reporting
- **Inquiry Statistics**: Comprehensive metrics and KPIs
- **Conversion Funnel**: Track inquiry progression
- **Source Analytics**: Monitor inquiry channels
- **Response Time Tracking**: Measure admin performance
- **Real-time Events**: Track all system interactions

### 🗄️ Database Management
- **PostgreSQL Integration**: Production-ready database
- **Migration System**: Version-controlled schema changes
- **Connection Pooling**: Optimized database connections
- **Soft Deletes**: Data preservation with recovery options
- **Indexes**: Optimized query performance

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ 
- PostgreSQL 13+
- npm or yarn
- Redis (optional, for caching)

### 1. Clone & Install
```bash
cd /Users/swaminathan/Downloads/gentle_space_realty_i1aw6b
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gentle_space_realty
DB_USER=postgres
DB_PASSWORD=your-password

# JWT Configuration  
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=24h

# Email Configuration (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Application Configuration
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000
```

### 3. Database Setup

Create PostgreSQL database:
```sql
CREATE DATABASE gentle_space_realty;
CREATE USER gentle_space_user WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE gentle_space_realty TO gentle_space_user;
```

Run migrations:
```bash
npm run migrate
```

Check migration status:
```bash
npm run migrate:status
```

### 4. Development Server
```bash
npm run start:dev
```

The API will be available at: `http://localhost:3001`

### 5. Production Build
```bash
npm run build:server
npm start
```

## 📁 Project Structure

```
src/
├── server.ts              # Main application entry point
├── config/
│   └── database.ts         # Configuration settings
├── db/
│   ├── connection.ts       # Database connection handling
│   ├── migrate.ts          # Migration runner
│   └── models/
│       └── Inquiry.ts      # Inquiry data model & repository
├── dto/
│   └── inquiry.dto.ts      # Data transfer objects & validation
├── middleware/
│   ├── auth.ts            # Authentication middleware
│   ├── errorHandler.ts    # Global error handling
│   └── requestLogger.ts   # Request logging
├── routes/
│   ├── inquiries.ts       # Public inquiry routes
│   └── admin.ts          # Admin management routes
└── services/
    ├── analytics.ts       # Analytics tracking service
    ├── emailService.ts    # Email notification service
    └── spamDetection.ts   # Spam detection service

database/
└── migrations/
    └── 002_create_inquiries.sql  # Database schema

tests/
├── unit/                  # Unit tests
├── integration/           # Integration tests  
├── load/                  # Load testing
└── security/             # Security tests
```

## 🔌 API Endpoints

### Public Endpoints
- `POST /api/inquiries` - Submit new inquiry
- `POST /api/inquiries/validate` - Validate inquiry data
- `GET /api/inquiries/stats` - Public statistics
- `GET /api/inquiries/health` - Health check

### Admin Authentication
- `POST /api/admin/auth/login` - Admin login
- `POST /api/admin/auth/refresh` - Refresh token
- `POST /api/admin/auth/logout` - Logout

### Admin Inquiry Management
- `GET /api/admin/inquiries` - List inquiries (with filtering)
- `GET /api/admin/inquiries/:id` - Get specific inquiry
- `PUT /api/admin/inquiries/:id` - Update inquiry
- `DELETE /api/admin/inquiries/:id` - Delete inquiry (super admin)
- `POST /api/admin/inquiries/:id/assign` - Assign inquiry
- `GET /api/admin/inquiries/:id/history` - Get inquiry history

### Analytics & Stats
- `GET /api/admin/inquiries/stats` - Detailed statistics
- `GET /api/admin/analytics/inquiries/funnel` - Conversion funnel
- `GET /api/admin/analytics/inquiries/sources` - Source analytics

For detailed API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 🧪 Testing

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests  
```bash
npm run test:integration
```

### Load Testing
```bash
npm run test:load
```

### Security Testing
```bash
npm run test:security
```

### Test Coverage
```bash
npm run test:coverage
```

## 📊 Database Schema

### Inquiries Table
```sql
CREATE TABLE inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    requirement TEXT NOT NULL,
    property_id UUID,
    property_title VARCHAR(500),
    status VARCHAR(20) DEFAULT 'new',
    priority VARCHAR(10) DEFAULT 'medium',
    notes TEXT,
    assigned_to VARCHAR(255),
    response_time DECIMAL(10,2),
    source VARCHAR(50) DEFAULT 'website',
    follow_up_date TIMESTAMP,
    spam_score INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```

### Admin Users Table
```sql
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```

## 🔧 Configuration Options

### Security Settings
```env
# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
INQUIRY_SUBMISSION_LIMIT=5

# CORS Configuration  
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

### Email Settings
```env
# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email Templates
EMAIL_FROM_NAME=Gentle Space Realty
EMAIL_FROM_ADDRESS=noreply@gentlespace.com
```

### Feature Flags
```env
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_SPAM_DETECTION=true  
ENABLE_ANALYTICS=true
ENABLE_RATE_LIMITING=true
```

## 🚀 Production Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use strong JWT secrets
3. Configure production database
4. Set up SSL certificates
5. Configure reverse proxy (Nginx)
6. Set up monitoring and logging

### Security Checklist
- [ ] Strong JWT secrets configured
- [ ] Database credentials secured
- [ ] HTTPS enabled
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Input validation enabled
- [ ] Logs configured for monitoring

### Performance Optimization
- [ ] Database indexes created
- [ ] Connection pooling configured
- [ ] Caching strategy implemented
- [ ] Email queue for async processing
- [ ] CDN for static assets
- [ ] Load balancing configured

## 🐛 Troubleshooting

### Common Issues

**Database Connection Failed**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection parameters in .env
# Verify user permissions
```

**Migration Errors**
```bash
# Check migration status
npm run migrate:status

# Rollback and retry
npm run migrate:rollback 1
npm run migrate
```

**Email Not Sending**
```bash
# Check SMTP credentials
# Verify Gmail App Passwords (if using Gmail)
# Check firewall settings for SMTP ports
```

**Rate Limit Errors**
```bash
# Check rate limit configuration
# Clear Redis cache if using Redis
# Restart application
```

## 📞 Support

For technical support:
- **Email**: dev@gentlespace.com  
- **Documentation**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Issues**: Create GitHub issue

## 📝 License

MIT License - see LICENSE file for details.

---

**Implementation Status**: ✅ Complete

All user stories implemented:
- ✅ Story 3.1: Submit Property Inquiry
- ✅ Story 3.2: Inquiry Management  

All API endpoints functional:
- ✅ POST /api/inquiries (public)
- ✅ GET /api/admin/inquiries (admin, with filtering)
- ✅ GET /api/admin/inquiries/:id (admin)
- ✅ PUT /api/admin/inquiries/:id (admin)
- ✅ DELETE /api/admin/inquiries/:id (admin)

All features implemented:
- ✅ Public inquiry submission with rate limiting
- ✅ Admin inquiry management with filtering/search
- ✅ Status tracking (new, contacted, in_progress, converted, closed)
- ✅ Priority management (low, medium, high)
- ✅ Assignment to admin users
- ✅ Notes and follow-up scheduling
- ✅ Validation and spam protection
- ✅ Email notifications
- ✅ Analytics tracking

*Generated with Claude Code - Backend API Developer*