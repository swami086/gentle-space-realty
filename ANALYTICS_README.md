# Gentle Space Realty Analytics Dashboard

A comprehensive admin dashboard and analytics system built for real estate property management.

## Features

### 📊 Dashboard Statistics
- Real-time property and inquiry metrics
- Monthly inquiry trends
- Conversion rate tracking
- Response time analytics
- Live activity monitoring

### 🏠 Property Analytics
- Top viewed properties
- Location-based analytics (Bengaluru focused)
- Category performance metrics
- Price range analysis
- View trends and patterns

### 📝 Inquiry Analytics
- Inquiry conversion funnel
- Response time by priority
- Source attribution
- Geographic insights
- Priority distribution analysis

### 📈 Real-time Tracking
- Active user sessions
- Page view monitoring
- Event tracking system
- Performance metrics

## API Endpoints

### Authentication
```http
POST /api/admin/auth
Content-Type: application/json

{
  "email": "admin@gentlespace.com",
  "password": "admin123"
}
```

### Dashboard Statistics
```http
GET /api/admin/dashboard/stats
Authorization: Bearer <token>
```

### Property Analytics
```http
GET /api/admin/analytics/properties?period=30d&location=koramangala&sortBy=views
Authorization: Bearer <token>
```

### Inquiry Analytics
```http
GET /api/admin/analytics/inquiries?period=30d&status=converted
Authorization: Bearer <token>
```

### Geographic Analytics
```http
GET /api/admin/analytics/geographic?zoom=area&metric=views
Authorization: Bearer <token>
```

### Event Analytics
```http
GET /api/admin/analytics/events?startDate=2024-01-01&endDate=2024-01-31&groupBy=day
Authorization: Bearer <token>
```

### Performance Metrics
```http
GET /api/admin/analytics/performance
Authorization: Bearer <token>
```

## Database Schema

### Core Tables
- **properties**: Property listings with analytics counters
- **inquiries**: Customer inquiries with response tracking
- **admin_users**: Admin authentication and roles
- **analytics_events**: Event tracking for user interactions
- **property_views**: Detailed property view tracking

### Analytics Features
- Automatic view counting with triggers
- Response time calculation
- Geographic data indexing
- Event categorization
- Session tracking

## Installation & Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   - Ensure PostgreSQL is running
   - Set environment variables:
     ```bash
     DB_HOST=localhost
     DB_PORT=5432
     DB_NAME=gentle_space_realty
     DB_USER=postgres
     DB_PASSWORD=password
     ```

3. **Start Server**
   ```bash
   npm start
   ```

4. **Development Mode**
   ```bash
   npm run dev
   ```

The server will automatically:
- Initialize database tables
- Seed sample data (in development)
- Start real-time metrics collection

## Sample Data

The system includes sample data for testing:
- **Admin User**: admin@gentlespace.com / admin123
- **5 Sample Properties** in various Bengaluru locations
- **Sample Inquiries** with different priorities and statuses
- **Analytics Events** for realistic dashboard metrics

## Analytics Features

### Real-time Metrics
- Active user sessions
- Live page views
- Recent inquiries
- Conversion tracking

### Geographic Insights
- Bengaluru area-wise analysis
- District-level metrics
- Location popularity trends
- Price analysis by area

### Performance Monitoring
- API response times
- Database query performance
- Error rates and patterns
- System health metrics

### Event Tracking
- Property views
- Search queries
- Inquiry submissions
- Admin actions
- User navigation patterns

## Key Metrics

### Dashboard KPIs
- Total/Active Properties
- Total/New Inquiries
- Conversion Rate
- Average Response Time
- Monthly Trends

### Property Insights
- Top Performing Properties
- Location Analytics
- Category Performance
- Price Range Analysis
- View Patterns

### Inquiry Analysis
- Conversion Funnel
- Response Time by Priority
- Source Attribution
- Geographic Distribution
- Status Progression

## API Response Examples

### Dashboard Stats Response
```json
{
  "totalProperties": 25,
  "activeProperties": 22,
  "totalInquiries": 45,
  "newInquiries": 12,
  "conversionRate": 23.5,
  "averageResponseTime": 2.3,
  "monthlyInquiries": [10, 15, 12, 18, 22, 25, 20, 15, 18, 24, 26, 30],
  "inquiriesByStatus": {
    "new": 12,
    "contacted": 8,
    "in_progress": 5,
    "converted": 15,
    "closed": 5
  },
  "realtime": {
    "activeUsers": 5,
    "recentInquiries": 3,
    "recentPageViews": [
      { "page": "/properties", "views": 25 },
      { "page": "/property_detail", "views": 18 }
    ]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Property Analytics Response
```json
{
  "topProperties": [
    {
      "id": "uuid-1",
      "title": "Modern Office Space in Koramangala",
      "viewCount": 145,
      "inquiryCount": 8,
      "category": "office",
      "area": "Koramangala",
      "price": 45000
    }
  ],
  "locationAnalytics": [
    {
      "area": "Koramangala",
      "propertyCount": 5,
      "totalViews": 250,
      "avgViews": 50,
      "avgPrice": 42000
    }
  ],
  "categoryAnalytics": [
    {
      "category": "office",
      "propertyCount": 8,
      "totalViews": 420,
      "avgViews": 52.5,
      "availableCount": 7
    }
  ]
}
```

## Environment Variables

```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gentle_space_realty
DB_USER=postgres
DB_PASSWORD=password

# JWT
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=24h

# Server
PORT=3001
NODE_ENV=development
```

## Health Check

```http
GET /api/health
```

Returns system status and basic metrics for monitoring.

## Error Handling

The system includes comprehensive error handling:
- Structured error responses
- Request ID tracking
- Detailed logging
- Graceful failure modes
- Circuit breaker patterns

## Caching Strategy

- **Real-time Metrics**: In-memory store with 30-second refresh
- **Dashboard Stats**: 5-minute cache with automatic refresh
- **Analytics Data**: 5-minute cache for complex queries
- **Session Tracking**: 30-minute active user tracking

## Security Features

- JWT-based authentication
- Rate limiting per endpoint
- Input validation and sanitization
- SQL injection prevention
- CORS configuration
- Helmet security headers
- Failed login attempt tracking
- Account lockout protection

---

Built with Node.js, Express, PostgreSQL, and real-time analytics capabilities.