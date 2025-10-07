# 🔔 Notification System Documentation

## Overview

The Gentle Space Realty notification system provides comprehensive email and WhatsApp notification capabilities for the real estate platform. It includes automated inquiry notifications, customer communications, delivery tracking, and admin management features.

## ✨ Features

### Core Capabilities
- **Multi-Channel Notifications**: Email and WhatsApp support
- **Template System**: Pre-built and customizable email templates
- **Queue Management**: Reliable delivery with retry mechanisms
- **Delivery Tracking**: Real-time status monitoring
- **Admin Dashboard**: Settings management and analytics
- **Bulk Notifications**: Send notifications to multiple recipients
- **Priority Handling**: Urgent notifications get priority processing

### Email Features
- **Nodemailer Integration**: Production-ready email delivery
- **Rich HTML Templates**: Professional email designs
- **Attachment Support**: Send documents and media
- **Development Mode**: Uses Ethereal Email for testing
- **Template Variables**: Dynamic content insertion

### WhatsApp Features
- **Business API Integration**: WhatsApp Business API support
- **Simulation Mode**: Development testing without API costs
- **Message Templates**: Structured message formats
- **Phone Number Validation**: Automatic formatting and validation
- **Delivery Status**: Track message delivery and read receipts

## 🚀 Quick Start

### 1. Environment Setup

Copy the environment template:
```bash
cp .env.example .env
```

Configure your environment variables:
```env
# Server Configuration
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Email Configuration (Production)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@gentlespacerealty.com

# Admin Configuration
ADMIN_EMAIL=admin@gentlespacerealty.com
ADMIN_WHATSAPP=+1234567890

# WhatsApp Business API (Optional)
WHATSAPP_ENABLED=true
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-id
```

### 2. Start the Server

```bash
# Development mode
npm run server:dev

# Production mode
npm run server:prod
```

### 3. Test the System

```bash
# Test email configuration
curl http://localhost:3001/api/notifications/test/email

# Test WhatsApp configuration
curl "http://localhost:3001/api/notifications/test/whatsapp?phone=+1234567890"
```

## 📚 API Reference

### Email Notifications

#### Send Email
```http
POST /api/notifications/email
Content-Type: application/json

{
  "to": "customer@example.com",
  "subject": "Welcome to Gentle Space Realty",
  "template": "welcomeEmail",
  "data": {
    "name": "John Doe",
    "preferredContact": "email"
  },
  "priority": "normal"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email notification queued successfully",
  "notificationId": "notif_1234567890_abc123",
  "status": "queued"
}
```

### WhatsApp Notifications

#### Send WhatsApp Message
```http
POST /api/notifications/whatsapp
Content-Type: application/json

{
  "to": "+1234567890",
  "message": "Welcome to Gentle Space Realty! We're excited to help you find your perfect property.",
  "type": "text",
  "priority": "normal"
}
```

### Inquiry Processing

#### Submit Inquiry (Auto-notifications)
```http
POST /api/inquiries
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "+1987654321",
  "message": "I'm interested in the downtown apartment listing.",
  "propertyId": "prop-123",
  "propertyName": "Downtown Apartment",
  "inquiryType": "viewing",
  "budgetRange": "$2000-3000",
  "timeline": "immediate"
}
```

**Automatic Notifications Triggered:**
- ✅ Admin email notification (high priority)
- ✅ Admin WhatsApp alert (if configured)
- ✅ Customer confirmation email
- ✅ Customer welcome email
- ✅ Customer WhatsApp welcome (if phone provided)

### Bulk Notifications

#### Send Bulk Messages
```http
POST /api/notifications/bulk
Content-Type: application/json

{
  "notifications": [
    {
      "type": "email",
      "emailData": {
        "to": "customer1@example.com",
        "subject": "Property Match Alert",
        "template": "propertyMatch",
        "data": {
          "name": "Customer 1",
          "properties": [...]
        }
      }
    },
    {
      "type": "whatsapp",
      "whatsappData": {
        "to": "+1234567890",
        "message": "New properties matching your criteria are available!",
        "type": "text"
      }
    }
  ],
  "priority": "normal"
}
```

### Delivery Tracking

#### Check Notification Status
```http
GET /api/notifications/status/{notificationId}
```

**Response:**
```json
{
  "success": true,
  "status": {
    "id": "notif_1234567890_abc123",
    "status": "sent",
    "attempts": 1,
    "createdAt": "2023-12-07T10:30:00.000Z",
    "lastAttempt": "2023-12-07T10:30:15.000Z",
    "completedAt": "2023-12-07T10:30:20.000Z"
  }
}
```

#### Queue Statistics
```http
GET /api/notifications/queue/stats
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "total": 150,
    "queued": 5,
    "processing": false,
    "statuses": {
      "sent": 120,
      "failed": 10,
      "queued": 5,
      "processing": 0
    }
  }
}
```

### Admin Management

#### Get Notification Settings
```http
GET /api/admin/notification-settings
```

#### Update Notification Settings
```http
PUT /api/admin/notification-settings
Content-Type: application/json

{
  "email": {
    "enabled": true,
    "address": "admin@gentlespacerealty.com",
    "notifications": {
      "newInquiry": true,
      "dailyReport": true,
      "systemAlerts": true
    }
  },
  "whatsapp": {
    "enabled": true,
    "phoneNumber": "+1234567890",
    "notifications": {
      "newInquiry": true,
      "urgentAlerts": true
    }
  },
  "preferences": {
    "timezone": "America/New_York",
    "quietHours": {
      "enabled": true,
      "start": "22:00",
      "end": "08:00"
    }
  }
}
```

## 🎨 Email Templates

### Available Templates

1. **inquiryNotification** - New inquiry alert for admin
2. **welcomeEmail** - Welcome message for new customers
3. **inquiryConfirmation** - Confirmation for submitted inquiries
4. **propertyMatch** - Property recommendations
5. **adminAlert** - System alerts and notifications

### Template Variables

Each template supports dynamic variables:

```javascript
// inquiryNotification
{
  name: "Customer Name",
  email: "customer@example.com", 
  phone: "+1234567890",
  message: "Inquiry message",
  propertyName: "Property Name",
  propertyId: "prop-123",
  submittedAt: "2023-12-07T10:30:00.000Z"
}

// welcomeEmail
{
  name: "Customer Name",
  preferredContact: "email"
}

// propertyMatch
{
  name: "Customer Name",
  properties: [
    {
      id: "prop-123",
      name: "Beautiful House",
      location: "Downtown",
      price: "$350,000",
      type: "House",
      features: ["3BR", "2BA", "Garden"]
    }
  ]
}
```

## 📊 Delivery Tracking & Analytics

### Status Types
- **queued**: Waiting to be processed
- **processing**: Currently being sent
- **sent**: Successfully delivered
- **failed**: Delivery failed after retries
- **retry_scheduled**: Scheduled for retry

### Analytics Dashboard

Access comprehensive analytics:
```http
GET /api/admin/notifications/dashboard
```

Key metrics include:
- Success rate percentage
- Total notifications processed
- Queue depth and processing time
- Channel performance (email vs WhatsApp)
- Recent notification history

## 🔧 Configuration

### Email Configuration

#### Production (SMTP)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=noreply@gentlespacerealty.com
```

#### Development (Ethereal)
The system automatically uses Ethereal Email for development testing. No configuration needed.

### WhatsApp Configuration

#### Production (Business API)
```env
WHATSAPP_ENABLED=true
WHATSAPP_API_URL=https://graph.facebook.com/v17.0
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-number-id
WHATSAPP_BUSINESS_ID=your-business-id
```

#### Development (Simulation)
```env
WHATSAPP_ENABLED=false
NODE_ENV=development
```

In development mode, WhatsApp messages are simulated and logged without actual delivery.

## 🔄 Queue System

### Retry Logic
- **3 retry attempts** with exponential backoff
- **Delays**: 5s, 15s, 60s
- **Priority support**: urgent, high, normal, low
- **Automatic cleanup** of old records

### Priority Processing
```javascript
// High priority (immediate processing)
await notificationQueue.addPriorityNotification(notification, 'high');

// Normal priority
await notificationQueue.addNotification(notification);
```

## 🧪 Testing

### Run Integration Tests
```bash
npm run test:integration
```

### Test Coverage
- Email delivery and templates
- WhatsApp message sending
- Queue processing and retries
- Admin settings management
- Bulk notification handling
- Error scenarios and validation

### Manual Testing
```bash
# Test email configuration
curl http://localhost:3001/api/notifications/test/email

# Test WhatsApp configuration  
curl "http://localhost:3001/api/notifications/test/whatsapp?phone=+1234567890"

# Test inquiry submission
curl -X POST http://localhost:3001/api/inquiries \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com", 
    "message": "Test inquiry"
  }'
```

## 🚨 Error Handling

### Common Error Scenarios
- **Invalid email format**: Returns 400 with validation errors
- **Invalid phone number**: Returns 400 with phone validation error
- **SMTP connection failure**: Queues for retry with exponential backoff
- **WhatsApp API rate limit**: Implements backoff and retry logic
- **Template not found**: Falls back to default template

### Error Response Format
```json
{
  "success": false,
  "error": "Error description",
  "message": "Detailed error message",
  "details": ["Validation error 1", "Validation error 2"]
}
```

## 📈 Performance

### Optimization Features
- **Asynchronous processing**: Non-blocking queue system
- **Batch operations**: Bulk notification support
- **Connection pooling**: Reuses SMTP connections
- **Caching**: Templates and settings cached in memory
- **Rate limiting**: Prevents API abuse

### Monitoring
- Queue depth monitoring
- Success/failure rates
- Processing times
- Memory usage tracking

## 🔐 Security

### Security Measures
- **Input validation**: All inputs validated and sanitized
- **Rate limiting**: 100 requests per 15 minutes per IP
- **CORS protection**: Configured for frontend domain only
- **Helmet.js**: Security headers enabled
- **Environment variables**: Sensitive data in environment variables

### Data Privacy
- **Email addresses**: Never logged in plain text
- **Phone numbers**: Formatted and validated
- **Message content**: Not stored after delivery
- **Audit trail**: Delivery status tracking only

## 🔄 Integration

### Frontend Integration

```javascript
// Submit inquiry with automatic notifications
const submitInquiry = async (inquiryData) => {
  const response = await fetch('/api/inquiries', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(inquiryData)
  });
  
  return response.json();
};

// Send property match notifications
const notifyPropertyMatch = async (customerData, properties) => {
  const response = await fetch('/api/inquiries/property-match', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customerData,
      properties,
      notificationChannels: ['email', 'whatsapp']
    })
  });
  
  return response.json();
};
```

### Admin Dashboard Integration

```javascript
// Get notification settings
const getNotificationSettings = async () => {
  const response = await fetch('/api/admin/notification-settings');
  return response.json();
};

// Update settings
const updateSettings = async (settings) => {
  const response = await fetch('/api/admin/notification-settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(settings)
  });
  
  return response.json();
};
```

## 🎯 Best Practices

### Email Best Practices
- Use clear, descriptive subject lines
- Include unsubscribe links in production
- Optimize for mobile devices
- Test across email clients
- Monitor deliverability rates

### WhatsApp Best Practices
- Keep messages concise and valuable
- Use emoji sparingly and appropriately
- Respect opt-out requests
- Follow WhatsApp Business policies
- Monitor for spam reports

### Queue Management
- Monitor queue depth regularly
- Set up alerts for failed deliveries
- Clean up old tracking records
- Use priority appropriately
- Implement circuit breakers for external APIs

## 🔮 Future Enhancements

### Planned Features
- **SMS notifications**: Twilio integration
- **Push notifications**: Web push API
- **A/B testing**: Template performance testing
- **Advanced analytics**: Engagement tracking
- **Template builder**: Visual template editor
- **Workflow automation**: Multi-step notification sequences

### Scalability Improvements
- **Redis queue**: Production-ready queue system
- **Database storage**: Persistent notification history
- **Load balancing**: Multiple notification processors
- **Webhook support**: Third-party integrations

## 🆘 Troubleshooting

### Common Issues

#### Email Not Sending
1. Check SMTP credentials in environment variables
2. Verify firewall settings allow SMTP traffic
3. Check email provider rate limits
4. Review server logs for SMTP errors

#### WhatsApp Not Working
1. Verify WhatsApp Business API credentials
2. Check phone number formatting
3. Ensure API rate limits not exceeded
4. Verify webhook configurations

#### Queue Not Processing
1. Check server resources (memory/CPU)
2. Verify no infinite retry loops
3. Monitor for external API timeouts
4. Check queue statistics endpoint

### Support
For technical support or feature requests, please contact the development team or create an issue in the project repository.

---

*Last updated: December 2024*
*Version: 1.0.0*