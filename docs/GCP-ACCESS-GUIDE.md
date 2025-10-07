# 🌐 GCP Access Guide - Gentle Space Realty
*Comprehensive access documentation for production GCP deployment*

## 📋 Overview

This guide provides complete access information for the Gentle Space Realty production deployment on Google Cloud Platform (GCP) in Mumbai, India.

## 🔧 GCP Project Configuration

### Project Details
- **Project ID**: `sragupathi-641f4622`
- **Project Name**: Gentle Space Realty India
- **Region**: `asia-south1` (Mumbai, India)
- **Zone**: `asia-south1-a`

### VM Instance Details
- **Instance Name**: `gentle-space-realty-india`
- **Machine Type**: Standard VM instance
- **External IP**: `34.47.225.173`
- **Internal IP**: Dynamic (assigned by GCP)
- **OS**: Ubuntu/Linux (GCP optimized)
- **Zone**: `asia-south1-a`

## 🔐 Authentication & Access

### Service Account Key
**Location**: `/Users/swaminathan/Downloads/gentle_space_realty_i1aw6b/sragupathi-641f4622-91f4318f86d6.json`

```bash
# Set authentication for gcloud CLI
export GOOGLE_APPLICATION_CREDENTIALS="/Users/swaminathan/Downloads/gentle_space_realty_i1aw6b/sragupathi-641f4622-91f4318f86d6.json"

# Authenticate with service account
gcloud auth activate-service-account --key-file="$GOOGLE_APPLICATION_CREDENTIALS"

# Set project
gcloud config set project sragupathi-641f4622
```

### SSH Access Commands

#### Direct SSH Connection
```bash
# SSH using gcloud compute (recommended)
gcloud compute ssh gentle-space-realty-india \
    --zone=asia-south1-a \
    --project=sragupathi-641f4622

# SSH with specific key file
gcloud compute ssh gentle-space-realty-india \
    --zone=asia-south1-a \
    --project=sragupathi-641f4622 \
    --ssh-key-file="$GOOGLE_APPLICATION_CREDENTIALS"
```

#### Alternative SSH Methods
```bash
# Direct SSH (if SSH keys are configured)
ssh username@34.47.225.173

# SSH with port forwarding for development
gcloud compute ssh gentle-space-realty-india \
    --zone=asia-south1-a \
    --project=sragupathi-641f4622 \
    -- -L 3000:localhost:3000
```

## 🌍 Application URLs & Endpoints

### Main Application
- **Live Application**: http://34.47.225.173
- **Health Check**: http://34.47.225.173/health
- **Admin Panel**: http://34.47.225.173/admin

### API Endpoints
- **Base API URL**: http://34.47.225.173/api/
- **Properties API**: http://34.47.225.173/api/properties
- **Inquiries API**: http://34.47.225.173/api/inquiries
- **Auth API**: http://34.47.225.173/api/auth
- **Upload API**: http://34.47.225.173/api/uploads
- **Debug Endpoint**: http://34.47.225.173/api/debug

### Health Monitoring
```bash
# Quick health check
curl -X GET http://34.47.225.173/health

# Detailed API health check
curl -X GET http://34.47.225.173/api/debug

# Check PM2 status on server
curl -X GET "http://34.47.225.173/api/debug?check=pm2"
```

## 🚀 Deployment Commands

### Deploy Local Changes to GCP

#### Method 1: File Transfer with gcloud scp
```bash
# Transfer entire project directory
gcloud compute scp --recurse /Users/swaminathan/Downloads/gentle_space_realty_i1aw6b \
    gentle-space-realty-india:~/gentle-space-realty/ \
    --zone=asia-south1-a \
    --project=sragupathi-641f4622

# Transfer specific files
gcloud compute scp /Users/swaminathan/Downloads/gentle_space_realty_i1aw6b/package.json \
    gentle-space-realty-india:~/gentle-space-realty/ \
    --zone=asia-south1-a \
    --project=sragupathi-641f4622
```

#### Method 2: Git-based Deployment
```bash
# SSH into server and pull changes
gcloud compute ssh gentle-space-realty-india \
    --zone=asia-south1-a \
    --project=sragupathi-641f4622 \
    --command="cd ~/gentle-space-realty && git pull origin main"
```

#### Method 3: Docker Deployment
```bash
# Build and deploy using Docker
docker build -t gentle-space-realty .
docker tag gentle-space-realty gcr.io/sragupathi-641f4622/gentle-space-realty
docker push gcr.io/sragupathi-641f4622/gentle-space-realty

# Deploy on GCP VM
gcloud compute ssh gentle-space-realty-india \
    --zone=asia-south1-a \
    --project=sragupathi-641f4622 \
    --command="docker pull gcr.io/sragupathi-641f4622/gentle-space-realty && docker-compose up -d"
```

### Complete Deployment Script
```bash
#!/bin/bash
# deploy-to-gcp.sh

echo "🚀 Deploying to GCP..."

# 1. Authenticate
gcloud auth activate-service-account --key-file="$GOOGLE_APPLICATION_CREDENTIALS"
gcloud config set project sragupathi-641f4622

# 2. Build application locally
npm run build

# 3. Transfer files
gcloud compute scp --recurse ./dist \
    gentle-space-realty-india:~/gentle-space-realty/ \
    --zone=asia-south1-a \
    --project=sragupathi-641f4622

# 4. Restart services on server
gcloud compute ssh gentle-space-realty-india \
    --zone=asia-south1-a \
    --project=sragupathi-641f4622 \
    --command="cd ~/gentle-space-realty && pm2 restart all && sudo systemctl reload nginx"

echo "✅ Deployment completed!"
```

## 🔧 Server Management Commands

### PM2 Process Management
```bash
# Connect to server first
gcloud compute ssh gentle-space-realty-india --zone=asia-south1-a --project=sragupathi-641f4622

# Then run PM2 commands on the server
pm2 list                    # List all processes
pm2 restart gentle-space    # Restart main application
pm2 restart all            # Restart all processes
pm2 stop gentle-space      # Stop application
pm2 start gentle-space     # Start application
pm2 logs gentle-space      # View logs
pm2 monit                  # Monitor processes
pm2 reload gentle-space    # Zero-downtime reload
```

### Nginx Management
```bash
# SSH into server first
gcloud compute ssh gentle-space-realty-india --zone=asia-south1-a --project=sragupathi-641f4622

# Nginx commands on server
sudo systemctl status nginx    # Check status
sudo systemctl restart nginx   # Restart Nginx
sudo systemctl reload nginx    # Reload configuration
sudo nginx -t                  # Test configuration
sudo tail -f /var/log/nginx/access.log   # View access logs
sudo tail -f /var/log/nginx/error.log    # View error logs
```

### Database Management
```bash
# SSH into server
gcloud compute ssh gentle-space-realty-india --zone=asia-south1-a --project=sragupathi-641f4622

# SQLite database operations (if using local SQLite)
sqlite3 ~/gentle-space-realty/gentle_space.db ".tables"
sqlite3 ~/gentle-space-realty/gentle_space.db ".schema"

# Or PostgreSQL operations (if using PostgreSQL)
sudo -u postgres psql gentle_space
```

## 📁 Important File Locations on Server

### Application Files
- **Application Root**: `~/gentle-space-realty/`
- **Node.js Application**: `~/gentle-space-realty/server/index.js`
- **Static Files**: `~/gentle-space-realty/dist/`
- **Database**: `~/gentle-space-realty/gentle_space.db`
- **Uploads**: `~/gentle-space-realty/uploads/`

### Configuration Files
- **PM2 Config**: `~/gentle-space-realty/ecosystem.config.cjs`
- **Nginx Config**: `/etc/nginx/sites-available/gentle-space-realty`
- **Environment**: `~/gentle-space-realty/.env.production`

### Log Locations
- **Application Logs**: `~/.pm2/logs/gentle-space-out.log`
- **Error Logs**: `~/.pm2/logs/gentle-space-error.log`
- **Nginx Access**: `/var/log/nginx/access.log`
- **Nginx Error**: `/var/log/nginx/error.log`
- **System Logs**: `/var/log/syslog`

## 🔍 Troubleshooting Guide

### Common Issues & Solutions

#### 1. Application Not Responding
```bash
# Check if PM2 processes are running
gcloud compute ssh gentle-space-realty-india --zone=asia-south1-a --project=sragupathi-641f4622 --command="pm2 list"

# Restart PM2 processes
gcloud compute ssh gentle-space-realty-india --zone=asia-south1-a --project=sragupathi-641f4622 --command="pm2 restart all"

# Check application logs
gcloud compute ssh gentle-space-realty-india --zone=asia-south1-a --project=sragupathi-641f4622 --command="pm2 logs gentle-space --lines 50"
```

#### 2. 502 Bad Gateway (Nginx Issues)
```bash
# Check Nginx status
gcloud compute ssh gentle-space-realty-india --zone=asia-south1-a --project=sragupathi-641f4622 --command="sudo systemctl status nginx"

# Test Nginx configuration
gcloud compute ssh gentle-space-realty-india --zone=asia-south1-a --project=sragupathi-641f4622 --command="sudo nginx -t"

# Restart Nginx
gcloud compute ssh gentle-space-realty-india --zone=asia-south1-a --project=sragupathi-641f4622 --command="sudo systemctl restart nginx"
```

#### 3. Database Connection Issues
```bash
# Check database file permissions
gcloud compute ssh gentle-space-realty-india --zone=asia-south1-a --project=sragupathi-641f4622 --command="ls -la ~/gentle-space-realty/gentle_space.db"

# Check application environment variables
gcloud compute ssh gentle-space-realty-india --zone=asia-south1-a --project=sragupathi-641f4622 --command="cd ~/gentle-space-realty && cat .env.production"
```

#### 4. High Memory Usage
```bash
# Check system resources
gcloud compute ssh gentle-space-realty-india --zone=asia-south1-a --project=sragupathi-641f4622 --command="free -h && df -h"

# Monitor PM2 processes
gcloud compute ssh gentle-space-realty-india --zone=asia-south1-a --project=sragupathi-641f4622 --command="pm2 monit"
```

#### 5. Port Conflicts
```bash
# Check what's running on ports
gcloud compute ssh gentle-space-realty-india --zone=asia-south1-a --project=sragupathi-641f4622 --command="sudo netstat -tulpn | grep :80"
gcloud compute ssh gentle-space-realty-india --zone=asia-south1-a --project=sragupathi-641f4622 --command="sudo netstat -tulpn | grep :3000"
```

### Service Restart Procedures

#### Emergency Restart (Full System)
```bash
# Restart all services in order
gcloud compute ssh gentle-space-realty-india \
    --zone=asia-south1-a \
    --project=sragupathi-641f4622 \
    --command="pm2 restart all && sudo systemctl restart nginx && sudo systemctl restart postgresql"
```

#### Graceful Restart (Zero Downtime)
```bash
# Zero-downtime application reload
gcloud compute ssh gentle-space-realty-india \
    --zone=asia-south1-a \
    --project=sragupathi-641f4622 \
    --command="pm2 reload gentle-space && sudo systemctl reload nginx"
```

## 📊 Monitoring & Health Checks

### Automated Health Checks
```bash
# Create health check script
cat > health-check.sh << 'EOF'
#!/bin/bash
echo "🔍 Checking GCP deployment health..."

# Check application response
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://34.47.225.173/health)
if [ $HTTP_STATUS -eq 200 ]; then
    echo "✅ Application is responding (HTTP $HTTP_STATUS)"
else
    echo "❌ Application not responding (HTTP $HTTP_STATUS)"
fi

# Check API endpoints
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://34.47.225.173/api/debug)
if [ $API_STATUS -eq 200 ]; then
    echo "✅ API endpoints are working (HTTP $API_STATUS)"
else
    echo "❌ API endpoints not responding (HTTP $API_STATUS)"
fi

# Check database connectivity
DB_CHECK=$(curl -s http://34.47.225.173/api/properties | jq -r 'length')
if [ "$DB_CHECK" != "null" ]; then
    echo "✅ Database is accessible"
else
    echo "❌ Database connection issues"
fi
EOF

chmod +x health-check.sh
./health-check.sh
```

### Performance Monitoring
```bash
# Monitor server performance
gcloud compute ssh gentle-space-realty-india \
    --zone=asia-south1-a \
    --project=sragupathi-641f4622 \
    --command="top -n 1 && free -h && df -h"

# Check application performance
curl -w "Time: %{time_total}s\n" -o /dev/null -s http://34.47.225.173/
```

## 🔒 Security Considerations

### Firewall Rules
```bash
# List current firewall rules
gcloud compute firewall-rules list --project=sragupathi-641f4622

# Create HTTP/HTTPS rules (if needed)
gcloud compute firewall-rules create allow-http \
    --allow tcp:80 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow HTTP traffic"

gcloud compute firewall-rules create allow-https \
    --allow tcp:443 \
    --source-ranges 0.0.0.0/0 \
    --description "Allow HTTPS traffic"
```

### SSL/TLS Setup
```bash
# SSH into server for SSL setup
gcloud compute ssh gentle-space-realty-india --zone=asia-south1-a --project=sragupathi-641f4622

# Install Certbot for Let's Encrypt SSL
sudo apt update
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 📞 Emergency Contacts & Support

### Quick Reference Commands
```bash
# Emergency restart everything
gcloud compute ssh gentle-space-realty-india --zone=asia-south1-a --project=sragupathi-641f4622 --command="sudo reboot"

# Emergency logs check
gcloud compute ssh gentle-space-realty-india --zone=asia-south1-a --project=sragupathi-641f4622 --command="tail -f ~/.pm2/logs/gentle-space-error.log"

# Emergency disk space check
gcloud compute ssh gentle-space-realty-india --zone=asia-south1-a --project=sragupathi-641f4622 --command="df -h"
```

### Support Resources
- **GCP Console**: https://console.cloud.google.com/compute/instances?project=sragupathi-641f4622
- **VM Instance**: https://console.cloud.google.com/compute/instancesDetail/zones/asia-south1-a/instances/gentle-space-realty-india?project=sragupathi-641f4622
- **Project Dashboard**: https://console.cloud.google.com/home/dashboard?project=sragupathi-641f4622

---

## 🎯 Quick Commands Cheat Sheet

```bash
# Connect to server
gcloud compute ssh gentle-space-realty-india --zone=asia-south1-a --project=sragupathi-641f4622

# Transfer files
gcloud compute scp file.txt gentle-space-realty-india:~/ --zone=asia-south1-a --project=sragupathi-641f4622

# Check health
curl http://34.47.225.173/health

# Restart services
pm2 restart all && sudo systemctl reload nginx

# View logs
pm2 logs gentle-space --lines 50

# Check resources
free -h && df -h && pm2 monit
```

---

*Last Updated: September 2024*
*Maintained by: Development Team*
*GCP Project: sragupathi-641f4622*