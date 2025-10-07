# 🏡 Gentle Space Realty - Notification System

A comprehensive email and WhatsApp notification system for real estate inquiries and customer communication.

## ✨ Features

- **📧 Email Notifications**: Professional email templates with Nodemailer integration
- **📱 WhatsApp Messaging**: Business API integration with simulation mode
- **🔔 Auto Notifications**: Automatic notifications for new inquiries
- **📊 Delivery Tracking**: Real-time status monitoring and queue statistics
- **⚙️ Admin Management**: Notification settings and template management
- **🚀 Production Ready**: Secure, scalable architecture with error handling

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
# Server starts on http://localhost:3001 (or PORT from environment)
```

### 3. Test the System
```bash
# Health check
curl http://localhost:3002/health

# Send test email
curl -X POST http://localhost:3002/api/notifications/test/email

# Send test WhatsApp
curl "http://localhost:3002/api/notifications/test/whatsapp?phone=+1234567890"
```

### 4. Submit Test Inquiry (Triggers Auto Notifications)
```bash
curl -X POST http://localhost:3002/api/inquiries \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com", 
    "phone": "+1234567890",
    "message": "Interested in downtown apartment"
  }'
```

## 🎯 API Endpoints

### Core Notification Endpoints
- `POST /api/notifications/email` - Send email notification
- `POST /api/notifications/whatsapp` - Send WhatsApp message
- `POST /api/inquiries` - Submit inquiry (auto-triggers notifications)

### Status & Monitoring
- `GET /api/notifications/status/:id` - Check notification status
- `GET /api/notifications/queue/stats` - Queue statistics
- `GET /health` - System health check

### Testing Endpoints  
- `GET /api/notifications/test/email` - Test email configuration
- `GET /api/notifications/test/whatsapp?phone=+1234567890` - Test WhatsApp

## 📧 Automatic Inquiry Processing

When an inquiry is submitted to `/api/inquiries`, the system automatically sends:

**Admin Notifications:**
- ✅ Email alert with inquiry details
- ✅ WhatsApp alert (if configured)

**Customer Notifications:**
- ✅ Email confirmation receipt
- ✅ Welcome email with next steps
- ✅ WhatsApp welcome message (if phone provided)

## 🎬 Demo

Run the interactive demo to see all features:
```bash
npm run demo
```

Or use the automated demo script:
```bash
./start-demo.sh
```

## 📚 Full Documentation

For complete documentation, see [NOTIFICATION_SYSTEM.md](NOTIFICATION_SYSTEM.md)

---

**The notification system is now ready for use!** 🚀