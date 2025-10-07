# Gentle Space Realty - Inquiry Management API

## Overview

This API provides comprehensive customer inquiry management system for Gentle Space Realty with features including:
- Public inquiry submission with spam detection
- Admin authentication and authorization  
- CRUD operations for inquiry management
- Real-time analytics and reporting
- Email notifications
- Rate limiting and security features

## Base URL

- **Development**: `http://localhost:3001`
- **Production**: `https://api.gentlespace.com`

## Authentication

Admin endpoints require JWT Bearer token authentication:

```http
Authorization: Bearer <your-jwt-token>
```

## API Endpoints

### Public Endpoints

#### Submit Inquiry
Submit a new customer inquiry.

```http
POST /api/inquiries
```

**Rate Limit**: 5 requests per 15 minutes per IP

**Request Body**:
```json
{
  "name": "John Doe",
  "company": "Tech Solutions Inc",
  "email": "john@techsolutions.com", 
  "phone": "+91-9876543210",
  "requirement": "Looking for 2000 sqft office space in Koramangala",
  "propertyId": "uuid-property-id",
  "propertyTitle": "Premium Office in Koramangala",
  "source": "website"
}
```

**Response (201)**:
```json
{
  "message": "Inquiry submitted successfully",
  "inquiry": {
    "id": "uuid-inquiry-id",
    "name": "John Doe",
    "email": "john@techsolutions.com",
    "status": "new",
    "priority": "medium",
    "createdAt": "2024-01-20T10:30:00Z"
  },
  "meta": {
    "referenceId": "12345678",
    "estimatedResponseTime": "24 hours"
  }
}
```

#### Validate Inquiry
Validate inquiry data without submitting.

```http
POST /api/inquiries/validate
```

#### Get Public Stats
Get public inquiry statistics.

```http
GET /api/inquiries/stats
```

#### Health Check
Check inquiry system health.

```http
GET /api/inquiries/health
```

### Admin Authentication

#### Admin Login
Authenticate admin user and get access tokens.

```http
POST /api/admin/auth/login
```

**Request Body**:
```json
{
  "email": "admin@gentlespace.com",
  "password": "admin123"
}
```

**Response (200)**:
```json
{
  "message": "Login successful",
  "admin": {
    "id": "uuid-admin-id",
    "email": "admin@gentlespace.com",
    "name": "Admin User",
    "role": "admin"
  },
  "tokens": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token"
  }
}
```

#### Refresh Token
Get new access token using refresh token.

```http
POST /api/admin/auth/refresh
```

#### Logout
Logout admin user.

```http
POST /api/admin/auth/logout
```

### Admin Inquiry Management

#### List Inquiries
Get paginated list of inquiries with filtering.

```http
GET /api/admin/inquiries
```

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `search` (string): Search in name, email, company, requirement
- `status` (string): Filter by status (new, contacted, in_progress, converted, closed)
- `priority` (string): Filter by priority (low, medium, high)
- `assignedTo` (string): Filter by assigned admin
- `propertyId` (string): Filter by property ID
- `createdAfter` (string): Filter by creation date (ISO date)
- `createdBefore` (string): Filter by creation date (ISO date)
- `sortBy` (string): Sort field (createdAt, updatedAt, name, status, priority)
- `sortOrder` (string): Sort order (asc, desc)

**Response (200)**:
```json
{
  "inquiries": [
    {
      "id": "uuid-inquiry-id",
      "name": "John Doe", 
      "company": "Tech Solutions Inc",
      "email": "john@techsolutions.com",
      "phone": "+91-9876543210",
      "requirement": "Office space requirement...",
      "propertyId": "uuid-property-id",
      "propertyTitle": "Premium Office Space",
      "status": "new",
      "priority": "high",
      "notes": "Follow up notes...",
      "assignedTo": "admin@gentlespace.com",
      "responseTime": 2.5,
      "source": "website",
      "createdAt": "2024-01-20T10:30:00Z",
      "updatedAt": "2024-01-20T12:45:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPreviousPage": false
  },
  "filters": {
    "status": "new",
    "priority": "high"
  }
}
```

#### Get Inquiry
Get specific inquiry details.

```http
GET /api/admin/inquiries/:id
```

#### Update Inquiry
Update inquiry status, priority, notes, etc.

```http
PUT /api/admin/inquiries/:id
```

**Request Body**:
```json
{
  "status": "contacted",
  "priority": "high", 
  "notes": "Called customer, very interested",
  "assignedTo": "sales@gentlespace.com",
  "followUpDate": "2024-01-25T10:00:00Z"
}
```

#### Delete Inquiry
Soft delete inquiry (super admin only).

```http
DELETE /api/admin/inquiries/:id
```

#### Assign Inquiry
Assign inquiry to specific admin.

```http
POST /api/admin/inquiries/:id/assign
```

**Request Body**:
```json
{
  "adminId": "uuid-admin-id",
  "notes": "Assigning to sales specialist"
}
```

#### Get Inquiry History
Get inquiry activity history.

```http
GET /api/admin/inquiries/:id/history
```

### Statistics & Analytics

#### Get Inquiry Stats
Get comprehensive inquiry statistics.

```http
GET /api/admin/inquiries/stats
```

**Response (200)**:
```json
{
  "stats": {
    "total": 450,
    "new": 25,
    "contacted": 150,
    "inProgress": 45,
    "converted": 180,
    "closed": 50,
    "averageResponseTime": 4.2,
    "last30Days": 120,
    "last7Days": 30,
    "conversionRate": 62.5
  },
  "timestamp": "2024-01-20T15:30:00Z"
}
```

#### Get Inquiry Funnel
Get conversion funnel analytics.

```http
GET /api/admin/analytics/inquiries/funnel?from=2024-01-01&to=2024-01-31
```

#### Get Inquiry Sources
Get inquiry source analytics.

```http
GET /api/admin/analytics/inquiries/sources?from=2024-01-01&to=2024-01-31
```

### Admin Profile

#### Get Current Admin
Get current admin profile and permissions.

```http
GET /api/admin/me
```

## Data Models

### Inquiry
```typescript
interface Inquiry {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  requirement: string;
  propertyId?: string;
  propertyTitle?: string;
  status: 'new' | 'contacted' | 'in_progress' | 'converted' | 'closed';
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  assignedTo?: string;
  responseTime?: number; // in hours
  source?: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
}
```

### Admin
```typescript
interface Admin {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
}
```

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "message": "Error description",
    "status": 400,
    "code": "ERROR_CODE",
    "timestamp": "2024-01-20T15:30:00Z",
    "path": "/api/inquiries",
    "method": "POST"
  }
}
```

### Common Error Codes

- `BAD_REQUEST` (400): Invalid request data
- `UNAUTHORIZED` (401): Authentication required
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `CONFLICT` (409): Resource conflict
- `VALIDATION_ERROR` (422): Data validation failed
- `TOO_MANY_REQUESTS` (429): Rate limit exceeded
- `INTERNAL_SERVER_ERROR` (500): Server error

## Rate Limits

### Public Endpoints
- **Inquiry Submission**: 5 requests per 15 minutes per IP
- **Validation**: 20 requests per minute per IP
- **General**: 100 requests per 15 minutes per IP

### Admin Endpoints
- **Admin API**: 1000 requests per 15 minutes per IP

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Comprehensive data validation using Joi
- **Spam Detection**: AI-powered spam detection for inquiries
- **Rate Limiting**: Configurable rate limits per endpoint
- **CORS Protection**: Cross-origin resource sharing controls
- **Helmet Security**: Security headers and protections
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Input sanitization

## Development Setup

1. **Install Dependencies**:
```bash
npm install
```

2. **Environment Setup**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Database Setup**:
```bash
# Run migrations
npm run migrate

# Check migration status
npm run migrate:status
```

4. **Start Development Server**:
```bash
npm run start:dev
```

5. **Run Tests**:
```bash
npm test
```

## Production Deployment

1. **Build Application**:
```bash
npm run build:server
```

2. **Run Migrations**:
```bash
npm run migrate
```

3. **Start Production Server**:
```bash
npm start
```

## Support

For API support, contact: dev@gentlespace.com

## Changelog

### v1.0.0 (2024-01-20)
- Initial release
- Public inquiry submission
- Admin authentication and management
- Comprehensive analytics
- Email notifications
- Spam detection
- Rate limiting

---

*Generated with Claude Code - Backend API Developer*