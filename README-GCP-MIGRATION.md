# GCP Migration Guide - Gentle Space Realty

## Overview

This guide covers the complete migration of Gentle Space Realty from Vercel's serverless functions to Google Cloud Platform (GCP) Compute Engine using a unified Express.js server approach.

### Migration Strategy

**From**: Vercel serverless functions + static hosting  
**To**: GCP Compute Engine VM with Express.js server + Nginx reverse proxy

**Benefits**:
- Cost predictability with fixed VM pricing
- Full control over server environment
- Simplified deployment and debugging
- Better performance for sustained workloads
- Enhanced monitoring and logging capabilities

## Architecture Overview

```
User Request → Nginx (Port 80/443) → Express Server (Port 4000) → Supabase Database
                 ↓
            Static Files (React SPA)
```

## Prerequisites

### GCP Account Setup
1. **GCP Project**: Create or select existing project
2. **Billing Account**: Ensure billing is enabled
3. **APIs**: Enable Compute Engine API
4. **Service Account**: Configure with necessary permissions
5. **Domain**: Have your custom domain ready
6. **DNS Access**: Ability to modify DNS records

### Local Development
1. **Node.js 20+**: Latest LTS version
2. **GCP CLI**: `gcloud` command installed and authenticated
3. **Git**: Repository access
4. **Environment Variables**: Production values ready

## Step-by-Step Migration Process

### Phase 1: Preparation

#### 1. Install Dependencies
```bash
# Install new GCP dependencies
npm install express helmet cors compression morgan pm2 multer express-rate-limit express-validator

# Install development dependencies  
npm install -D @types/express @types/cors @types/compression @types/morgan @types/multer nodemon concurrently
```

#### 2. Environment Configuration
```bash
# Copy GCP environment template
cp .env.production.gcp .env.production

# Edit with your actual values
nano .env.production
```

**Required Environment Variables**:
```env
# Database Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Server Configuration
NODE_ENV=production
PORT=4000
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Security Configuration
JWT_SECRET=your_jwt_secret_key
BCRYPT_ROUNDS=12
SESSION_SECRET=your_session_secret

# External Services
REDIS_URL=redis://localhost:6379
STORAGE_BUCKET=your_storage_bucket_name
```

### Phase 2: Local Testing

#### 1. Test Express Server
```bash
# Start development server
npm run dev:server

# Test health endpoint
curl http://localhost:4000/health

# Test API endpoints
curl http://localhost:4000/api/v1/properties
```

#### 2. Build Frontend
```bash
# Build React application
npm run build

# Verify dist/ directory created
ls -la dist/
```

### Phase 3: GCP Deployment

#### 1. Configure GCP Authentication
```bash
# Authenticate with GCP
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID

# Create service account (if needed)
gcloud iam service-accounts create gentle-space-realty-sa
```

#### 2. Deploy to Compute Engine
```bash
# Make deployment script executable
chmod +x deploy-gcp.sh

# Run deployment
./deploy-gcp.sh production gentle-space-realty-vm

# Monitor deployment logs
gcloud compute ssh gentle-space-realty-vm --command="sudo journalctl -u nginx -f"
```

#### 3. Configure Firewall
```bash
# Allow HTTP/HTTPS traffic
gcloud compute firewall-rules create allow-http-https \
  --allow tcp:80,tcp:443 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow HTTP and HTTPS traffic"
```

### Phase 4: DNS & SSL Configuration

#### 1. DNS Setup
Update your domain's DNS records:
```
Type: A
Name: @
Value: YOUR_VM_EXTERNAL_IP
TTL: 300

Type: A  
Name: www
Value: YOUR_VM_EXTERNAL_IP
TTL: 300
```

#### 2. SSL Certificate
```bash
# SSH into VM
gcloud compute ssh gentle-space-realty-vm

# Install SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

### Phase 5: Verification

#### 1. Health Checks
```bash
# Application health
curl https://yourdomain.com/health

# Detailed health check
curl https://yourdomain.com/api/v1/health/detailed

# PM2 status
ssh into VM: pm2 status
```

#### 2. Performance Testing
```bash
# Load testing (if available)
npm run test:load

# Manual testing
curl -w "@curl-format.txt" https://yourdomain.com/api/v1/properties
```

## Environment Configuration Details

### Production Environment (.env.production)
```env
# Core Application
NODE_ENV=production
PORT=4000
HOST=0.0.0.0

# Database & External Services
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
DATABASE_URL=postgresql://user:pass@host:port/db

# Security & Authentication
JWT_SECRET=your-256-bit-secret-key
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret-key
CORS_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# File Storage
STORAGE_PROVIDER=supabase
STORAGE_BUCKET=gentle-space-realty-uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp,application/pdf

# Performance & Caching
REDIS_URL=redis://localhost:6379
CACHE_TTL=3600
ENABLE_COMPRESSION=true
ENABLE_RATE_LIMITING=true

# Monitoring & Logging
LOG_LEVEL=info
ENABLE_METRICS=true
SENTRY_DSN=your_sentry_dsn
```

### Development Overrides (.env.local)
```env
NODE_ENV=development
PORT=4000
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
LOG_LEVEL=debug
ENABLE_METRICS=false
```

## Monitoring and Maintenance

### Application Monitoring
```bash
# PM2 process status
pm2 status

# View logs
pm2 logs gentle-space-realty

# Monitor resources
pm2 monit

# Restart application
pm2 restart ecosystem.config.js
```

### System Monitoring
```bash
# Nginx status
sudo systemctl status nginx

# Check disk space
df -h

# Monitor system resources
htop

# View system logs
sudo journalctl -f
```

### Health Check Endpoints
- `GET /health` - Basic health check
- `GET /api/v1/health/detailed` - Comprehensive health metrics
- `GET /api/v1/health/ready` - Kubernetes-style readiness probe
- `GET /api/v1/health/live` - Kubernetes-style liveness probe

### Log Locations
```
Application Logs: ~/.pm2/logs/
Nginx Access: /var/log/nginx/access.log
Nginx Error: /var/log/nginx/error.log
System Logs: /var/log/syslog
```

## Troubleshooting

### Common Issues

#### 1. Application Won't Start
```bash
# Check PM2 logs
pm2 logs --lines 50

# Verify environment variables
pm2 env 0

# Check port availability
sudo netstat -tlnp | grep :4000

# Test manual start
node server/index.js
```

#### 2. Database Connection Issues
```bash
# Test Supabase connection
curl -H "apikey: YOUR_ANON_KEY" https://your-project.supabase.co/rest/v1/

# Check environment variables
printenv | grep SUPABASE

# Verify service role permissions
```

#### 3. Nginx Configuration Problems
```bash
# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

#### 4. SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test SSL configuration
curl -I https://yourdomain.com
```

#### 5. Performance Issues
```bash
# Check system resources
htop
free -h
df -h

# Monitor application performance
pm2 monit

# Analyze slow queries
# Check Supabase performance insights
```

### Debug Commands
```bash
# Application debugging
NODE_ENV=development npm run dev:server

# Database debugging
npm run db:validate

# Health check debugging
npm run health:gcp

# Comprehensive testing
npm run validate:all
```

## Rollback Procedures

### Emergency Rollback to Vercel

#### 1. Immediate DNS Rollback
```bash
# Update DNS records back to Vercel
# Change A records to point back to Vercel's IP ranges
# This provides immediate rollback capability
```

#### 2. Application-Level Rollback
```bash
# Stop GCP services
pm2 stop all
sudo systemctl stop nginx

# Update DNS or use traffic routing
# Vercel deployment remains active during migration
```

#### 3. Gradual Migration Back
```bash
# Re-enable Vercel deployment
npm run deploy:vercel:production

# Verify Vercel health
npm run vercel:health

# Update DNS gradually
# Test with subset of users first
```

### Planned Maintenance Rollback
1. **Communicate downtime window**
2. **Create database backup**
3. **Stop GCP services gracefully**
4. **Update DNS records**
5. **Verify Vercel functionality**
6. **Monitor application health**

## Performance Considerations

### VM Sizing Recommendations

#### e2-small (1 vCPU, 2GB RAM)
- **Suitable for**: Development, staging, low traffic
- **Cost**: ~$15-20/month
- **Max concurrent users**: 50-100
- **Upgrade triggers**: CPU >80%, RAM >85%

#### e2-medium (1 vCPU, 4GB RAM)
- **Suitable for**: Production, moderate traffic
- **Cost**: ~$30-40/month
- **Max concurrent users**: 200-500
- **Upgrade triggers**: CPU >80%, RAM >90%

#### e2-standard-2 (2 vCPU, 8GB RAM)
- **Suitable for**: High traffic production
- **Cost**: ~$60-80/month
- **Max concurrent users**: 500-1000+
- **Features**: Auto-scaling ready

### Performance Optimizations

#### 1. Application Level
- **PM2 Cluster Mode**: 2 instances minimum
- **Connection Pooling**: Database connections
- **Caching**: Redis for sessions/queries
- **Compression**: Gzip for API responses
- **Static Files**: Nginx caching headers

#### 2. Infrastructure Level
- **CDN**: Cloud CDN for static assets
- **Load Balancer**: For high availability
- **Database**: Supabase connection pooling
- **Monitoring**: Cloud Operations suite

#### 3. Scaling Strategies
```bash
# Vertical scaling (increase VM size)
gcloud compute instances set-machine-type gentle-space-realty-vm \
  --machine-type=e2-medium \
  --zone=us-central1-a

# Horizontal scaling (multiple VMs + Load Balancer)
# Create instance template and managed instance group
```

## Cost Comparison

### Vercel Pricing
```
Pro Plan: $20/month per user
- 100GB bandwidth
- 1,000 GB-hours compute
- Custom domains
- Analytics
```

### GCP Compute Engine Pricing (us-central1)
```
e2-small: ~$15-20/month
- 1 vCPU, 2GB RAM
- 30GB disk included
- Bandwidth: $0.12/GB (after 1GB free)
- No function invocation costs

Additional costs:
- Persistent disk: $0.04/GB/month
- External IP: $2.88/month
- Load Balancer: $18/month (if needed)
- Cloud CDN: $0.08/GB (optional)
```

### Total Cost Analysis
```
Vercel: $20/month (base) + overage fees
GCP: $15-25/month (predictable)

Break-even: Usually favors GCP for sustained workloads
Savings: 20-40% for typical production workloads
```

## Future Improvements

### Infrastructure Enhancements
1. **Container Migration**: Move to Cloud Run for serverless benefits
2. **Kubernetes**: GKE for advanced orchestration
3. **Multi-region**: Global deployment for latency
4. **Auto-scaling**: Instance groups with load balancers

### Application Enhancements
1. **Microservices**: Split into domain services
2. **Database**: Cloud SQL for managed PostgreSQL
3. **Caching**: Memorystore for Redis
4. **Storage**: Cloud Storage for file uploads

### Monitoring & Observability
1. **Cloud Operations**: Full GCP monitoring suite
2. **Error Tracking**: Cloud Error Reporting
3. **Performance**: Application Performance Monitoring
4. **Logging**: Structured logging with Cloud Logging

### CI/CD Pipeline
```bash
# Cloud Build configuration
# Automated testing and deployment
# Blue-green deployment strategy
# Rollback automation
```

## Support and Resources

### Documentation
- [Express.js Documentation](https://expressjs.com/)
- [GCP Compute Engine Guide](https://cloud.google.com/compute/docs)
- [PM2 Process Manager](https://pm2.keymetrics.io/)
- [Nginx Configuration Guide](https://nginx.org/en/docs/)

### Monitoring Dashboards
- **Application**: PM2 Web interface
- **Infrastructure**: GCP Console
- **Performance**: Custom dashboards
- **Logs**: Centralized logging

### Emergency Contacts
- **Development Team**: [contact information]
- **Infrastructure Team**: [contact information]  
- **GCP Support**: Based on support tier
- **Domain Registrar**: For DNS issues

---

**Migration Checklist**:
- [ ] Environment variables configured
- [ ] DNS records updated
- [ ] SSL certificates installed
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backup procedures tested
- [ ] Rollback plan verified
- [ ] Performance benchmarked
- [ ] Team trained on new infrastructure

For additional support or questions, refer to the troubleshooting section or contact the development team.