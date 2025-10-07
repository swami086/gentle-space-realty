# Backend Implementation Plan - Gentle Space Realty

## Executive Summary

This document outlines the comprehensive backend implementation plan for the Gentle Space Realty platform, a React-based real estate application for office spaces in Bengaluru. The backend will provide RESTful APIs to support property management, customer inquiries, admin dashboard analytics, file management, and notification systems.

**Key Requirements Identified:**
- User authentication and role-based authorization
- Property CRUD operations with image management
- Customer inquiry system with notifications
- Admin dashboard with analytics and reporting
- Search and filtering capabilities
- File upload and management system
- Email and WhatsApp notification services

## Architecture Overview

### Technology Stack Recommendations

**Backend Framework:** Node.js with Express.js
- Rapid development and deployment
- Strong TypeScript support
- Rich ecosystem for integrations
- Excellent performance for I/O operations

**Database:** PostgreSQL with Redis for caching
- ACID compliance for transactional data
- Advanced querying capabilities
- JSON support for flexible data structures
- Redis for session management and caching

**File Storage:** AWS S3 or CloudFlare R2
- Scalable image storage
- CDN integration
- Cost-effective storage solutions

**Authentication:** JWT with refresh tokens
- Stateless authentication
- Role-based access control
- Secure token management

**Notification Services:**
- SendGrid/AWS SES for email notifications
- Twilio or WhatsApp Business API for messaging

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │   Express API   │    │   PostgreSQL    │
│                 │◄──►│                 │◄──►│    Database     │
│  - Property UI  │    │  - REST APIs    │    │                 │
│  - Admin Panel  │    │  - Auth Layer   │    │  - Properties   │
│  - Search       │    │  - Validation   │    │  - Inquiries    │
└─────────────────┘    └─────────────────┘    │  - Users        │
                              │                │  - Analytics    │
                              │                └─────────────────┘
                              ▼
                       ┌─────────────────┐
                       │   External APIs │
                       │                 │
                       │  - File Storage │
                       │  - Email Service│
                       │  - WhatsApp API │
                       └─────────────────┘
```

## Database Design

### Core Entities Schema

```sql
-- Users table for authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Properties table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  location VARCHAR(50) NOT NULL CHECK (location IN ('mg-road', 'indiranagar', 'koramangala', 'hsr-layout', 'whitefield', 'electronic-city', 'jp-nagar', 'btm-layout', 'marathahalli', 'sarjapur-road')),
  area INTEGER NOT NULL, -- in sq ft
  price DECIMAL(12,2) NOT NULL, -- monthly rent
  property_type VARCHAR(50) NOT NULL CHECK (property_type IN ('fully-furnished-offices', 'custom-built-workspaces', 'co-working-spaces', 'private-office-cabins', 'enterprise-offices', 'virtual-offices', 'meeting-conference-rooms')),
  amenities JSONB DEFAULT '[]'::jsonb,
  availability_status VARCHAR(50) DEFAULT 'available' CHECK (availability_status IN ('available', 'occupied', 'under_maintenance')),
  floor_number INTEGER,
  total_floors INTEGER,
  parking_spaces INTEGER DEFAULT 0,
  furnishing_status VARCHAR(50) DEFAULT 'unfurnished' CHECK (furnishing_status IN ('furnished', 'semi_furnished', 'unfurnished')),
  security_deposit DECIMAL(12,2),
  maintenance_charge DECIMAL(12,2),
  -- images field removed - handled through property_images table
  contact_person VARCHAR(255),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  address TEXT,
  pincode VARCHAR(10),
  city VARCHAR(100) DEFAULT 'Bengaluru',
  state VARCHAR(100) DEFAULT 'Karnataka',
  country VARCHAR(100) DEFAULT 'India',
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID REFERENCES users(id)
);

-- Property inquiries table
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  company VARCHAR(255),
  team_size INTEGER,
  move_in_date DATE,
  budget_range VARCHAR(100),
  specific_requirements TEXT,
  inquiry_type VARCHAR(50) DEFAULT 'property_inquiry' CHECK (inquiry_type IN ('property_inquiry', 'general_inquiry', 'callback_request')),
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'in_progress', 'converted', 'closed')),
  priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  source VARCHAR(50) DEFAULT 'website', -- website, referral, social_media, etc.
  notes TEXT,
  contacted_at TIMESTAMP,
  scheduled_visit_at TIMESTAMP,
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Property images table (separate for better organization)
CREATE TABLE property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  alt_text VARCHAR(255),
  display_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  file_size INTEGER, -- in bytes
  file_type VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Analytics tracking table
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL, -- property_view, inquiry_submitted, search_performed
  entity_id UUID, -- property_id, inquiry_id, etc.
  entity_type VARCHAR(50), -- property, inquiry, search
  user_ip VARCHAR(45),
  user_agent TEXT,
  session_id VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb, -- flexible data for different event types
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_properties_location ON properties(location);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_area ON properties(area);
CREATE INDEX idx_properties_type ON properties(property_type);
CREATE INDEX idx_properties_status ON properties(availability_status, is_active);
CREATE INDEX idx_properties_created_at ON properties(created_at);
CREATE INDEX idx_properties_featured ON properties(is_featured) WHERE is_featured = true;

CREATE INDEX idx_inquiries_property_id ON inquiries(property_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_created_at ON inquiries(created_at);
CREATE INDEX idx_inquiries_assigned_to ON inquiries(assigned_to);

CREATE INDEX idx_property_images_property_id ON property_images(property_id);
CREATE INDEX idx_property_images_primary ON property_images(property_id, is_primary) WHERE is_primary = true;

CREATE INDEX idx_analytics_events_type_date ON analytics_events(event_type, created_at);
CREATE INDEX idx_analytics_events_entity ON analytics_events(entity_type, entity_id);
```

## User Stories

### 1. Authentication & Authorization

#### Story 1.1: Admin Login
**As an admin user, I want to log in to the system so that I can access the admin dashboard.**

**Acceptance Criteria:**
- Admin can log in with email and password
- System returns JWT token upon successful authentication
- Invalid credentials return appropriate error message
- System tracks login attempts and implements rate limiting
- Passwords are hashed and stored securely

**API Endpoints:**
```
POST /api/auth/login
Request: { email: string, password: string }
Response: { token: string, refreshToken: string, user: UserObject, expiresIn: number }

POST /api/auth/refresh
Request: { refreshToken: string }
Response: { token: string, expiresIn: number }

POST /api/auth/logout
Request: { refreshToken: string }
Response: { success: boolean }
```

**Database Changes:**
- Users table with secure password storage
- Optional: refresh_tokens table for token management

**Security Considerations:**
- bcrypt for password hashing
- JWT with short expiration (15 minutes)
- Refresh token rotation
- Rate limiting on login attempts

**Frontend Integration:**
- Token storage: localStorage for tokens, httpOnly cookies for refresh tokens
- Axios interceptors: Automatic token attachment and refresh on 401 responses
- Protected routes: Route guards checking authentication status
- Auto-logout: Clear tokens and redirect to login on authentication failures
- AdminLogin component integration: Direct API calls to POST /api/auth/login

#### Story 1.2: Role-Based Access Control
**As a system, I need to enforce role-based access control so that only authorized users can access specific features.**

**Acceptance Criteria:**
- Different roles have different permissions (admin, super_admin)
- API endpoints are protected based on user roles
- Unauthorized access attempts are logged and blocked

**API Endpoints:**
```
GET /api/auth/me
Response: { user: UserObject, permissions: string[] }
```

### 2. Property Management

#### Story 2.1: Create Property Listing
**As an admin, I want to create new property listings so that customers can find and inquire about office spaces.**

**Acceptance Criteria:**
- Admin can create property with all required fields
- Multiple images can be uploaded and associated with property
- Property data is validated before saving
- System generates unique property ID
- Images are optimized and stored in cloud storage

**API Endpoints:**
```
POST /api/properties
Request: {
  title: string,
  description: string,
  location: string,
  area: number,
  price: number,
  propertyType: string,
  amenities: string[],
  floorNumber?: number,
  totalFloors?: number,
  parkingSpaces?: number,
  furnishingStatus?: string,
  securityDeposit?: number,
  maintenanceCharge?: number,
  contactPerson?: string,
  contactPhone?: string,
  contactEmail?: string,
  address?: string,
  pincode?: string,
  latitude?: number,
  longitude?: number
}
Response: { property: PropertyObject }

POST /api/properties/:id/images
Request: FormData with image files
Response: { images: ImageObject[] }
```

**Database Changes:**
- Properties table with all property fields
- Property_images table for image management

**Data Transformation Layer (DTO Mapping):**
The backend implements DTO (Data Transfer Object) mappers to transform database records into frontend-compatible shapes:

```typescript
// Example Property DTO Mapping
PropertyDTO = {
  id: property.id,
  title: property.title,
  description: property.description,
  category: property.property_type, // Maps to PropertyCategory enum
  location: property.location, // Maps to BengaluruLocation enum
  price: {
    amount: property.price,
    period: 'monthly', // Default for office spaces
    currency: 'INR'
  },
  size: {
    area: property.area,
    unit: 'sqft'
  },
  images: property_images.map(img => img.image_url), // Ordered by display_order
  amenities: property.amenities, // JSON array
  availability: {
    available: property.availability_status === 'available',
    availableFrom: property.available_from
  },
  features: {
    furnished: property.furnishing_status !== 'unfurnished',
    parking: property.parking_spaces > 0,
    // Other features derived from amenities array
  },
  contact: {
    phone: property.contact_phone,
    email: property.contact_email,
    whatsapp: property.contact_whatsapp
  },
  createdAt: property.created_at,
  updatedAt: property.updated_at
}
```

**Testing Requirements:**
- Validate required fields
- Test image upload functionality
- Verify data persistence
- Test validation rules

#### Story 2.2: Update Property Listing
**As an admin, I want to update existing property listings so that information remains current and accurate.**

**Acceptance Criteria:**
- Admin can update any property field
- Image management (add, remove, reorder)
- Changes are tracked with timestamps
- Validation applies to updated data

**API Endpoints:**
```
PUT /api/properties/:id
Request: Partial<PropertyObject>
Response: { property: PropertyObject }

DELETE /api/properties/:id/images/:imageId
Response: { success: boolean }

PUT /api/properties/:id/images/reorder
Request: { imageIds: string[] }
Response: { success: boolean }
```

#### Story 2.3: Property Search and Filtering
**As a customer, I want to search and filter properties so that I can find office spaces that meet my requirements.**

**Acceptance Criteria:**
- Search by location, price range, area, property type
- Filter by amenities, furnishing status, availability
- Sort by price, area, date added
- Pagination for large result sets
- Search analytics tracking

**API Endpoints:**
```
GET /api/properties/search
Query Parameters:
- category?: string (PropertyCategory enum value)
- location?: string (BengaluruLocation enum value)
- minPrice?: number
- maxPrice?: number
- minSize?: number
- maxSize?: number
- amenities[]?: string[]
- availability?: boolean
- sortBy?: 'price' | 'size' | 'location' | 'date'
- sortOrder?: 'asc' | 'desc'
- page?: number
- limit?: number

Response: {
  properties: PropertyObject[], // Each property includes images: string[] array from property_images table
  pagination: {
    total: number,
    page: number,
    limit: number,
    totalPages: number
  },
  filters: AppliedFiltersObject
}

Note: PropertyObject includes images: string[] field derived from property_images.image_url ordered by display_order
```

**Database Changes:**
- Search indexes on commonly filtered fields
- Full-text search capabilities

### 3. Customer Inquiry System

#### Story 3.1: Submit Property Inquiry
**As a customer, I want to submit an inquiry about a property so that I can get more information or schedule a visit.**

**Acceptance Criteria:**
- Customer can submit inquiry with contact details and requirements
- System captures inquiry timestamp and source
- Admin receives immediate notification
- Customer receives confirmation
- Inquiry is associated with specific property

**API Endpoints:**
```
POST /api/inquiries
Request: {
  propertyId?: string,
  name: string,
  email: string,
  phone: string,
  company?: string,
  teamSize?: number,
  moveInDate?: string,
  budgetRange?: string,
  specificRequirements?: string,
  inquiryType: 'property_inquiry' | 'general_inquiry' | 'callback_request'
}
Response: { inquiry: InquiryObject }
```

**Database Changes:**
- Inquiries table with all inquiry fields

**Security Considerations:**
- Rate limiting on inquiry submissions
- Email and phone validation
- Spam protection mechanisms

**Testing Requirements:**
- Validate required fields
- Test notification delivery
- Verify data persistence
- Test rate limiting

#### Story 3.2: Inquiry Management
**As an admin, I want to manage customer inquiries so that I can follow up and convert leads.**

**Acceptance Criteria:**
- Admin can view all inquiries with filtering options
- Status updates and priority management
- Add notes and schedule follow-ups
- Assign inquiries to team members
- Track inquiry lifecycle

**API Endpoints:**
```
GET /api/admin/inquiries
Query Parameters:
- status?: string
- priority?: string
- assignedTo?: string
- dateRange?: string
- propertyId?: string
- page?: number
- limit?: number

Response: {
  inquiries: InquiryObject[],
  pagination: PaginationObject
}

PUT /api/admin/inquiries/:id
Request: {
  status?: string,
  priority?: string,
  notes?: string,
  assignedTo?: string,
  scheduledVisitAt?: string
}
Response: { inquiry: InquiryObject }
```

### 4. Admin Dashboard & Analytics

#### Story 4.1: Dashboard Statistics
**As an admin, I want to view key metrics on the dashboard so that I can monitor business performance.**

**Acceptance Criteria:**
- Display total properties, active listings, inquiries
- Show recent activity and trends
- Monthly/weekly statistics
- Quick access to important actions

**API Endpoints:**
```
GET /api/admin/dashboard/stats
Response: {
  totalProperties: number,
  activeProperties: number,
  totalInquiries: number,
  newInquiries: number,
  conversionRate: number,
  averageResponseTime: number,
  monthlyInquiries: number[], // 12 months of inquiry counts
  inquiriesByStatus: {
    new: number,
    contacted: number,
    in_progress: number,
    converted: number,
    closed: number
  }
}
```

**Database Changes:**
- Analytics_events table for tracking
- Computed columns or views for statistics

#### Story 4.2: Analytics and Reporting
**As an admin, I want to view detailed analytics so that I can make data-driven decisions.**

**Acceptance Criteria:**
- Property view analytics
- Inquiry conversion rates
- Popular search filters
- Geographic analysis
- Time-based trends

**API Endpoints:**
```
GET /api/admin/analytics/properties
Query: { period: string, groupBy: string }
Response: { analytics: AnalyticsObject[] }

GET /api/admin/analytics/inquiries
Query: { period: string, status?: string }
Response: { analytics: InquiryAnalyticsObject[] }
```

### 5. File Management

#### Story 5.1: Image Upload and Management
**As an admin, I want to upload and manage property images so that listings are visually appealing.**

**Acceptance Criteria:**
- Support multiple image formats (JPEG, PNG, WebP)
- Image optimization and resizing
- Set primary image for each property
- Bulk upload capabilities
- Image metadata management

**API Endpoints:**
```
POST /api/upload/images
Request: FormData with files
Response: { images: UploadedImageObject[], success: boolean }

DELETE /api/upload/images/:id
Response: { success: boolean }

PUT /api/properties/:id/images/primary
Request: { imageId: string }
Response: { success: boolean }
```

**Technical Requirements:**
- Image compression and optimization
- Multiple size generation (thumbnail, medium, full)
- CDN integration for fast delivery
- File type and size validation

### 6. Notification System

#### Story 6.1: Email Notifications
**As an admin, I want to receive email notifications for new inquiries so that I can respond promptly.**

**Acceptance Criteria:**
- Immediate email notification for new inquiries
- Email templates for different notification types
- Configurable notification preferences
- Email delivery tracking

**API Endpoints:**
```
POST /api/notifications/email
Request: {
  to: string,
  template: string,
  data: object
}
Response: { success: boolean, messageId: string }

GET /api/admin/notification-settings
Response: { settings: NotificationSettingsObject }

PUT /api/admin/notification-settings
Request: { settings: NotificationSettingsObject }
Response: { success: boolean }
```

#### Story 6.2: WhatsApp Notifications (Optional)
**As an admin, I want to receive WhatsApp notifications for urgent inquiries so that I can respond immediately.**

**Acceptance Criteria:**
- WhatsApp integration for high-priority inquiries
- Template message support
- Delivery status tracking
- Fallback to email if WhatsApp fails

**API Endpoints:**
```
POST /api/notifications/whatsapp
Request: {
  phone: string,
  template: string,
  data: object
}
Response: { success: boolean, messageId: string }
```

## API Specifications

### Base Configuration
```
Base URL: https://api.gentlespacerealty.com
API Version: v1
Content-Type: application/json
Authentication: Bearer JWT Token
```

### Standard Response Format

**Success Responses:**
API endpoints return data directly without a wrapper. Examples:
- `GET /api/properties` → `{ properties: Property[], pagination: {...} }`
- `GET /api/properties/:id` → `{ property: Property }`
- `GET /api/admin/inquiries` → `{ inquiries: Inquiry[] }`
- `POST /api/properties` → `{ property: Property }`

### Error Response Format
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "message": "Invalid email format"
    }
  },
  "timestamp": "2023-12-01T10:00:00Z"
}
```

### Core API Endpoints

#### Authentication Routes
```
POST   /api/auth/login           - Admin login
POST   /api/auth/refresh         - Refresh JWT token
POST   /api/auth/logout          - Logout and invalidate token
GET    /api/auth/me              - Get current user info
```

#### Property Routes
```
GET    /api/properties           - List all properties (public, includes images: string[])
GET    /api/properties/search    - Search and filter properties (includes images: string[])
GET    /api/properties/:id       - Get specific property details (includes images: string[])
POST   /api/properties           - Create new property (admin)
PUT    /api/properties/:id       - Update property (admin)
DELETE /api/properties/:id       - Delete property (admin)
POST   /api/properties/:id/images - Upload property images (admin)
DELETE /api/properties/:id/images/:imageId - Delete property image (admin)
```

#### Reference Data Routes
```
GET    /api/reference/locations  - Get available Bengaluru locations
GET    /api/reference/categories - Get available property categories
```

#### Inquiry Routes
```
POST   /api/inquiries            - Submit customer inquiry
GET    /api/admin/inquiries      - List all inquiries (admin)
GET    /api/admin/inquiries/:id  - Get specific inquiry (admin)
PUT    /api/admin/inquiries/:id  - Update inquiry status (admin)
DELETE /api/admin/inquiries/:id  - Delete inquiry (admin)
```

#### Admin Routes
```
GET    /api/admin/dashboard/stats - Get dashboard statistics
GET    /api/admin/analytics/properties - Property analytics
GET    /api/admin/analytics/inquiries - Inquiry analytics
GET    /api/admin/users          - Manage admin users
```

#### File Management Routes
```
POST   /api/upload/images        - Upload images
DELETE /api/upload/images/:id    - Delete uploaded image
GET    /api/upload/images/:id    - Get image metadata
```

#### Notification Routes
```
POST   /api/notifications/email     - Send email notification
POST   /api/notifications/whatsapp  - Send WhatsApp notification
GET    /api/admin/notification-settings - Get notification preferences
PUT    /api/admin/notification-settings - Update notification preferences
```

## Security Requirements

### Authentication & Authorization
- JWT-based authentication with short expiration times
- Refresh token rotation for session management
- Role-based access control (RBAC)
- Password hashing using bcrypt with appropriate salt rounds
- Rate limiting on authentication endpoints

### Data Protection
- Input validation and sanitization for all endpoints
- SQL injection prevention using parameterized queries
- XSS protection with content security policies
- CORS configuration for allowed origins
- Sensitive data encryption at rest

### API Security
- Request rate limiting per IP and user
- API key authentication for external integrations
- HTTPS enforcement with proper SSL certificates
- Request logging and monitoring
- Error handling without exposing system details

### File Upload Security
- File type validation and sanitization
- File size limits and virus scanning
- Secure file storage with access controls
- Image metadata stripping for privacy

## Performance & Scalability

### Database Optimization
- Proper indexing on frequently queried columns
- Query optimization and performance monitoring
- Database connection pooling
- Read replicas for heavy read operations
- Caching strategy with Redis

### API Performance
- Response caching for frequently accessed data
- Image optimization and CDN delivery
- Pagination for large data sets
- Async processing for heavy operations
- Database query optimization

### Monitoring & Logging
- Application performance monitoring (APM)
- Error tracking and alerting
- Request/response logging
- Database performance monitoring
- Infrastructure monitoring

### Scalability Considerations
- Horizontal scaling capability
- Load balancing configuration
- Microservices architecture potential
- Queue-based processing for async tasks
- CDN integration for static assets

## Deployment & Infrastructure

### Environment Setup
- Development, staging, and production environments
- Environment-specific configuration management
- Secrets management with environment variables
- Database migration scripts
- Automated backup strategies

### CI/CD Pipeline
- Automated testing on code commits
- Code quality checks and linting
- Automated deployment to staging
- Production deployment with approval gates
- Rollback strategies for failed deployments

### Hosting Requirements
- Cloud platform recommendation (AWS, GCP, or Azure)
- Container orchestration with Docker
- Database hosting with managed services
- CDN setup for image delivery
- SSL certificate management

### Monitoring & Alerting
- Application uptime monitoring
- Performance metrics tracking
- Error rate alerting
- Database performance monitoring
- Security incident detection

## Testing Strategy

### Unit Testing
- Test coverage for all business logic
- Mock external dependencies
- Database layer testing with test database
- Validation logic testing
- Error handling testing

### Integration Testing
- API endpoint testing
- Database integration testing
- External service integration testing
- Authentication flow testing
- File upload functionality testing

### API Testing
- Automated API testing with Postman/Newman
- Load testing for performance validation
- Security testing for vulnerabilities
- Edge case and error scenario testing
- Documentation validation testing

### Quality Assurance
- Code review process
- Automated code quality checks
- Security vulnerability scanning
- Performance testing and benchmarking
- User acceptance testing protocols

## Implementation Timeline

### Phase 1: Core Foundation (Weeks 1-2)
- Database setup and initial schema
- Authentication system implementation
- Basic CRUD operations for properties
- Initial API structure and middleware
- Testing framework setup

### Phase 2: Property Management (Weeks 3-4)
- Complete property management APIs
- Image upload and management system
- Property search and filtering
- Admin property management interface
- Basic validation and error handling

### Phase 3: Inquiry System (Weeks 5-6)
- Inquiry submission and management APIs
- Email notification system
- Admin inquiry dashboard
- Status tracking and management
- Customer notification system

### Phase 4: Analytics & Dashboard (Weeks 7-8)
- Dashboard statistics APIs
- Analytics data collection
- Reporting functionality
- Admin dashboard enhancement
- Performance optimization

### Phase 5: Advanced Features (Weeks 9-10)
- WhatsApp notification integration
- Advanced search capabilities
- File management enhancements
- Performance optimization
- Security hardening

### Phase 6: Testing & Deployment (Weeks 11-12)
- Comprehensive testing
- Performance testing and optimization
- Security testing and hardening
- Production deployment setup
- Documentation completion

### Priority Levels
**High Priority:**
- Authentication system
- Property CRUD operations
- Basic inquiry system
- Image upload functionality

**Medium Priority:**
- Advanced search and filtering
- Analytics and reporting
- Email notifications
- Admin dashboard enhancements

**Low Priority:**
- WhatsApp integration
- Advanced analytics
- Performance optimizations
- Additional security features

## Technical Considerations

### Database Design Principles
- Normalized design to reduce redundancy
- Appropriate use of JSON fields for flexible data
- Proper foreign key relationships
- Optimized indexes for query performance
- Data integrity constraints

### API Design Best Practices
- RESTful design principles
- Consistent naming conventions
- Proper HTTP status codes
- Comprehensive error handling
- API versioning strategy

### Code Quality Standards
- TypeScript for type safety
- ESLint and Prettier for code formatting
- Comprehensive error handling
- Logging and monitoring integration
- Documentation and comments

### Security Best Practices
- OWASP Top 10 compliance
- Input validation and sanitization
- Secure authentication implementation
- Rate limiting and abuse prevention
- Regular security audits

## Frontend Integration Roadmap

This section outlines the phased approach for integrating the backend APIs with the existing frontend application.

### Phase 1: API Client & Types (Week 1)
**Objective:** Establish foundation for API communication

**Tasks:**
- Create API client utility with base URL and common headers
- Generate TypeScript interfaces matching backend response schemas
- Set up environment variables for API endpoints
- Add feature flag `USE_BACKEND_API` to switch between mock/real data
- Update frontend types to match backend property categories and locations

**Deliverables:**
- `/src/services/api.ts` - Base API client
- `/src/types/api.ts` - Backend response types
- Environment configuration with `REACT_APP_USE_BACKEND_API=false` (default)

### Phase 2: Authentication & Route Guards (Week 2)
**Objective:** Implement secure authentication flow

**Tasks:**
- Update AdminLogin component to call `POST /api/auth/login`
- Implement token storage (localStorage + httpOnly cookies for refresh)
- Add Axios interceptors for automatic token attachment and refresh
- Create protected route components with authentication checks
- Handle logout and auto-logout on 401 responses
- Update adminStore to use authentication APIs

**Deliverables:**
- Authentication service with token management
- Protected route wrapper components
- Updated AdminLogin with backend integration
- Auto-refresh token mechanism

**Acceptance Criteria:**
- AdminLogin successfully authenticates against backend
- Tokens are securely stored and automatically attached to requests
- Protected routes redirect to login when unauthenticated
- Auto-logout occurs on token expiration or 401 responses

### Phase 3: Properties (List/Detail/CRUD) (Week 3)
**Objective:** Replace mock property data with backend APIs

**Tasks:**
- Update propertyStore to use `GET /api/properties` and `GET /api/properties/search`
- Implement property filtering with backend-compatible parameters
- Update PropertySearch component to use `GET /api/reference/locations` and categories
- Add property detail fetching with `GET /api/properties/:id`
- Implement admin property management (create, update, delete)
- Handle property images through `POST /api/properties/:id/images`

**Deliverables:**
- Updated PropertyStore with backend integration
- Property listing and search functionality
- Admin property management with image upload
- Property detail pages with backend data

**Acceptance Criteria:**
- Property lists load from backend with proper filtering
- Property search works with all frontend filter parameters
- Admin can create, edit, and delete properties
- Image upload and management works correctly

### Phase 4: Inquiries Management (Week 4)
**Objective:** Integrate inquiry submission and management

**Tasks:**
- Update inquiry forms to submit to `POST /api/inquiries`
- Implement admin inquiry management with `GET /api/admin/inquiries`
- Add inquiry status updates and assignment features
- Integrate inquiry filtering and search
- Add notification handling for new inquiries

**Deliverables:**
- Customer inquiry submission integration
- Admin inquiry management dashboard
- Inquiry status tracking and updates
- Notification system integration

**Acceptance Criteria:**
- Customers can submit inquiries through frontend
- Admin can view, update, and manage all inquiries
- Inquiry status updates reflect in real-time
- Proper validation and error handling

### Phase 5: Dashboard Statistics (Week 5)
**Objective:** Replace mock analytics with backend data

**Tasks:**
- Update AdminDashboard to use `GET /api/admin/dashboard/stats`
- Implement analytics charts with backend data
- Add real-time statistics updates
- Integrate inquiry analytics and reporting

**Deliverables:**
- Real-time dashboard statistics
- Analytics visualization with backend data
- Performance metrics and KPIs

**Acceptance Criteria:**
- Dashboard displays real statistics from backend
- Charts and graphs render with accurate data
- Performance metrics update correctly

### Phase 6: File Upload & Advanced Features (Week 6)
**Objective:** Complete integration with file management

**Tasks:**
- Implement file upload utilities for property images
- Add image optimization and preview features
- Integrate notification preferences
- Add advanced search and filtering capabilities
- Performance optimization and caching

**Deliverables:**
- Complete file upload system
- Image management interface
- Advanced search functionality
- Performance optimizations

**Feature Flag Implementation:**
```typescript
// Environment configuration
REACT_APP_USE_BACKEND_API=false // Default to mock data
REACT_APP_API_BASE_URL=https://api.gentlespacerealty.com/api

// Usage in components
const useBackendAPI = process.env.REACT_APP_USE_BACKEND_API === 'true';

// In stores/services
const data = useBackendAPI 
  ? await apiClient.get('/properties')
  : mockPropertyData;
```

**Integration Testing:**
- Each phase includes comprehensive testing of API integration
- Error handling and edge case validation
- Performance testing with real backend data
- User acceptance testing for each integrated feature

This implementation plan provides a comprehensive roadmap for building a robust, scalable backend system that fully supports the Gentle Space Realty frontend application. The plan includes detailed specifications, security considerations, and a structured timeline for successful implementation.