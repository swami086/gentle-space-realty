# GCP Deployment Workflow Guide

## 🚀 Complete Guide to Deploying Changes to GCP Production

This document outlines the complete workflow for deploying changes from your localhost development environment to the production GCP instance.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Local Development Workflow](#local-development-workflow)
4. [GitLab CI/CD Pipeline](#gitlab-cicd-pipeline)
5. [Manual Deployment Methods](#manual-deployment-methods)
6. [Troubleshooting](#troubleshooting)
7. [Monitoring & Health Checks](#monitoring--health-checks)
8. [Rollback Procedures](#rollback-procedures)

---

## Overview

### Infrastructure Architecture
- **Local Development**: http://localhost:5174 (Frontend) + http://localhost:3001 (Backend)
- **Production GCP**: http://35.200.252.186/ (Mumbai region: asia-south1-a)
- **GitLab Repository**: https://gitlab.com/gl-demo-ultimate-sragupathi/gentle_spaces
- **Production Branch**: `production` (separate from main)

### Tech Stack
- **Frontend**: React + Vite + TypeScript
- **Backend**: Node.js + Express + TypeScript
- **Database**: Supabase PostgreSQL
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **CI/CD**: GitLab CI/CD Pipeline
- **Cloud**: Google Cloud Platform (Compute Engine)

---

## Prerequisites

### Required Tools
- Git configured with GitLab access
- Google Cloud SDK (`gcloud`) configured
- Docker and Docker Compose
- Node.js 18+ and npm

### Authentication Setup
```bash
# GitLab Authentication (already configured)
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# GCP Authentication (already configured)
gcloud auth login
gcloud config set project sragupathi-641f4622
```

### Environment Files
- `.env` (development - localhost API URLs)
- `deploy/.env.production` (production - relative API URLs)

---

## Local Development Workflow

### 1. Start Development Environment

```bash
# Navigate to project directory
cd /Users/swaminathan/Downloads/gentle_space_realty_i1aw6b

# Start frontend (Terminal 1)
npm run dev

# Start backend (Terminal 2) 
cd backend && NODE_ENV=development npm run dev
```

**Access URLs:**
- Frontend: http://localhost:5174/
- Backend API: http://localhost:3001/
- Health Check: http://localhost:3001/api/health

### 2. Make Your Changes

Make changes to any files in:
- `src/` - Frontend React components
- `backend/src/` - Backend Express API
- `public/` - Static assets
- `deploy/` - Docker configuration

### 3. Test Changes Locally

```bash
# Test frontend
curl -s http://localhost:5174/ | grep -o '<title>.*</title>'

# Test backend API
curl -s http://localhost:3001/api/health | jq .
curl -s http://localhost:3001/api/v1/properties | jq 'length'
```

### 4. Commit Changes to Production Branch

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "feat: add new property filtering feature"

# Push to production branch (triggers CI/CD)
git push origin production
```

---

## GitLab CI/CD Pipeline

### Automatic Pipeline (Recommended)

The GitLab CI/CD pipeline automatically triggers when you push to the `production` branch.

**Pipeline Stages:**
1. **Build** - Compiles frontend and backend
2. **Test** - Runs unit tests (if configured)  
3. **Deploy** - Deploys to GCP instance

**Pipeline Configuration:** `.gitlab-ci.yml`
```yaml
workflow:
  rules:
    - if: $CI_COMMIT_BRANCH == "production"

stages:
  - build
  - test  
  - deploy
```

**Monitoring Pipeline:**
- View pipeline status: https://gitlab.com/gl-demo-ultimate-sragupathi/gentle_spaces/-/pipelines
- Check deployment logs in GitLab CI/CD interface

### Pipeline Variables (Pre-configured)
- `GCP_PROJECT_ID`: sragupathi-641f4622
- `GCP_ZONE`: asia-south1-a  
- `GCP_INSTANCE_NAME`: gentle-space-realty-vm
- `GCP_SERVICE_ACCOUNT_KEY`: (Base64 encoded service account)

---

## Manual Deployment Methods

### Method 1: Quick Deploy Command (Recommended)

```bash
# Deploy latest from GitLab production branch
deploy-from-gitlab
```

This command:
- Pulls latest code from GitLab production branch
- Updates application files on GCP instance
- Rebuilds and restarts Docker containers
- Performs health checks
- Provides rollback on failure

### Method 2: Direct GCP Deployment

```bash
# SSH into GCP instance and deploy
gcloud compute ssh gentle-space-realty-vm --zone=asia-south1-a --command="
  cd /opt && sudo ./gitlab-webhook.sh
"
```

### Method 3: Manual File Upload

```bash
# Create deployment package
tar -czf deployment.tar.gz --exclude='.git' --exclude='node_modules' .

# Upload to GCP instance  
gcloud compute scp deployment.tar.gz gentle-space-realty-vm:~ --zone=asia-south1-a

# Execute deployment
gcloud compute ssh gentle-space-realty-vm --zone=asia-south1-a --command="
  tar -xzf deployment.tar.gz &&
  sudo rsync -av --exclude='.git' --exclude='node_modules' ./ /opt/gentle-space-realty/ &&
  cd /opt/gentle-space-realty &&
  sudo docker-compose -f deploy/docker-compose.yml down &&
  sudo docker-compose -f deploy/docker-compose.yml up -d --build
"
```

---

## Deployment Process Details

### What Happens During Deployment

1. **Backup Creation**
   ```bash
   sudo cp -r /opt/gentle-space-realty /opt/gentle-space-realty-backup
   ```

2. **Code Update**
   ```bash
   cd /opt/gentle-space-realty
   sudo git pull origin production
   ```

3. **Dependency Installation**
   ```bash
   npm ci --production
   npm run build
   ```

4. **Container Rebuild**
   ```bash
   sudo docker-compose -f deploy/docker-compose.yml down --remove-orphans
   sudo docker-compose -f deploy/docker-compose.yml up -d --build
   ```

5. **Health Verification**
   ```bash
   curl -f http://localhost/api/health
   curl -s http://localhost/api/v1/properties | jq 'length'
   ```

6. **Cleanup**
   ```bash
   sudo rm -rf /opt/gentle-space-realty-backup  # On success
   ```

### Container Architecture

**Docker Compose Services:**
- `frontend`: Nginx serving React build (port 80)
- `backend`: Node.js Express API (port 3001)  
- `nginx`: Reverse proxy routing `/api/` to backend

**Port Mapping:**
- External: 80 (HTTP) → Internal: 80 (Nginx)
- Internal: Nginx → Backend (3001)
- Backend → Supabase (external)

---

## Environment Configurations

### Development (.env)
```bash
VITE_API_BASE_URL=http://localhost:3001/api
VITE_SUPABASE_URL=https://nfryqqpfprupwqayirnc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_DEBUG_STARTUP=false
```

### Production (deploy/.env.production)
```bash
VITE_APP_ENV=production
VITE_API_BASE_URL=/api  # Relative URL for nginx proxy
VITE_SUPABASE_URL=https://nfryqqpfprupwqayirnc.supabase.co
VITE_DEBUG_MODE=false
```

---

## Monitoring & Health Checks

### Production Health Checks

```bash
# Overall application health
curl -s http://35.200.252.186/api/health | jq .

# Properties API
curl -s http://35.200.252.186/api/v1/properties | jq 'length'

# Frontend accessibility  
curl -s http://35.200.252.186/ | grep -o '<title>.*</title>'
```

### Container Status Monitoring

```bash
# Check running containers
gcloud compute ssh gentle-space-realty-vm --zone=asia-south1-a --command="
  sudo docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
"

# Check container logs
gcloud compute ssh gentle-space-realty-vm --zone=asia-south1-a --command="
  sudo docker-compose -f /opt/gentle-space-realty/deploy/docker-compose.yml logs --tail=50
"
```

### Performance Monitoring

```bash
# Server resource usage
gcloud compute ssh gentle-space-realty-vm --zone=asia-south1-a --command="
  top -bn1 | head -20 &&
  df -h &&
  free -m
"
```

---

## Troubleshooting

### Common Issues & Solutions

#### 1. Deployment Fails

**Symptoms:** Pipeline fails, health check errors
```bash
# Check deployment logs  
gcloud compute ssh gentle-space-realty-vm --zone=asia-south1-a --command="
  sudo docker-compose -f /opt/gentle-space-realty/deploy/docker-compose.yml logs
"

# Manual container restart
gcloud compute ssh gentle-space-realty-vm --zone=asia-south1-a --command="
  cd /opt/gentle-space-realty &&
  sudo docker-compose -f deploy/docker-compose.yml restart
"
```

#### 2. Properties Not Loading

**Symptoms:** Frontend loads but no properties displayed
```bash
# Check API connectivity
curl -v http://35.200.252.186/api/v1/properties

# Check backend logs
gcloud compute ssh gentle-space-realty-vm --zone=asia-south1-a --command="
  sudo docker logs deploy-backend
"
```

#### 3. Environment Variable Issues

**Symptoms:** API calls going to wrong endpoints
```bash
# Verify frontend build environment
gcloud compute ssh gentle-space-realty-vm --zone=asia-south1-a --command="
  grep -r 'localhost' /opt/gentle-space-realty/dist/ || echo 'No localhost references found'
"

# Rebuild with correct environment
gcloud compute ssh gentle-space-realty-vm --zone=asia-south1-a --command="
  cd /opt/gentle-space-realty &&
  sudo docker-compose -f deploy/docker-compose.yml build --no-cache frontend
"
```

#### 4. GitLab CI/CD Pipeline Issues

**Check Pipeline Status:**
- Visit: https://gitlab.com/gl-demo-ultimate-sragupathi/gentle_spaces/-/pipelines
- Look for failed stages and error logs

**Common Fixes:**
```bash
# Retry failed pipeline
# (Use GitLab web interface to retry)

# Check GitLab CI/CD variables
# Ensure GCP_SERVICE_ACCOUNT_KEY is properly set
```

#### 5. GCP Instance Access Issues

```bash
# Test GCP connectivity
gcloud compute instances list --filter="name:gentle-space-realty-vm"

# Reset SSH connection
gcloud compute config-ssh

# Check firewall rules
gcloud compute firewall-rules list --filter="direction:INGRESS AND allowed.ports:80"
```

---

## Rollback Procedures

### Automatic Rollback

The deployment script includes automatic rollback on health check failure:
- If health checks fail, backup is automatically restored
- Containers are restarted with previous version

### Manual Rollback

#### Method 1: Git Rollback
```bash
# Rollback to previous commit
git log --oneline -5  # Find commit hash
git revert <commit-hash>
git push origin production
```

#### Method 2: Direct Container Rollback  
```bash
gcloud compute ssh gentle-space-realty-vm --zone=asia-south1-a --command="
  cd /opt/gentle-space-realty &&
  git checkout HEAD~1 &&
  sudo docker-compose -f deploy/docker-compose.yml down &&
  sudo docker-compose -f deploy/docker-compose.yml up -d --build
"
```

#### Method 3: Backup Restoration
```bash
gcloud compute ssh gentle-space-realty-vm --zone=asia-south1-a --command="
  if [ -d '/opt/gentle-space-realty-backup' ]; then
    sudo rm -rf /opt/gentle-space-realty
    sudo mv /opt/gentle-space-realty-backup /opt/gentle-space-realty
    cd /opt/gentle-space-realty
    sudo docker-compose -f deploy/docker-compose.yml up -d
  fi
"
```

---

## Advanced Deployment Scenarios

### Blue-Green Deployment (Future Enhancement)

For zero-downtime deployments:
1. Create new GCP instance
2. Deploy to new instance
3. Switch load balancer traffic
4. Terminate old instance

### Database Migrations

```bash
# Run Supabase migrations (if needed)
cd /opt/gentle-space-realty
npx supabase db push --db-url $DATABASE_URL
```

### Environment-Specific Configurations

```bash
# Deploy with custom environment
gcloud compute ssh gentle-space-realty-vm --zone=asia-south1-a --command="
  cd /opt/gentle-space-realty &&
  sudo docker-compose -f deploy/docker-compose.yml \
    -f deploy/docker-compose.staging.yml \
    up -d --build
"
```

---

## Security Best Practices

### 1. Secure Deployments
- Never commit secrets to Git
- Use environment variables for sensitive data
- Regularly rotate service account keys

### 2. Access Control
```bash
# Limit GCP instance access
gcloud compute instances add-access-config gentle-space-realty-vm \
  --zone=asia-south1-a \
  --access-config-name="External NAT" \
  --address="35.200.252.186"
```

### 3. SSL/HTTPS Setup (Future Enhancement)
```bash
# Install Certbot for SSL certificates
sudo apt update && sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## Performance Optimization

### 1. Docker Image Optimization
- Use multi-stage builds (already implemented)
- Minimize image layers
- Use .dockerignore effectively

### 2. Application Performance
```bash
# Monitor application performance
curl -w "@curl-format.txt" -s -o /dev/null http://35.200.252.186/

# Enable gzip compression in nginx
# (Already configured in deploy/nginx.conf)
```

### 3. Database Optimization
- Use Supabase connection pooling
- Implement database indexing
- Monitor query performance

---

## Quick Reference Commands

### Essential Commands
```bash
# Deploy changes
deploy-from-gitlab

# Check production health
curl -s http://35.200.252.186/api/health | jq .

# View container logs
gcloud compute ssh gentle-space-realty-vm --zone=asia-south1-a \
  --command="sudo docker-compose -f /opt/gentle-space-realty/deploy/docker-compose.yml logs -f"

# Restart containers
gcloud compute ssh gentle-space-realty-vm --zone=asia-south1-a \
  --command="cd /opt/gentle-space-realty && sudo docker-compose -f deploy/docker-compose.yml restart"
```

### Git Workflow
```bash
# Standard deployment workflow
git add .
git commit -m "description of changes"
git push origin production
deploy-from-gitlab
```

---

## Support & Maintenance

### Regular Maintenance Tasks

1. **Weekly:**
   - Check application health
   - Review error logs
   - Monitor resource usage

2. **Monthly:**
   - Update dependencies
   - Review security vulnerabilities
   - Backup critical data

3. **Quarterly:**
   - Review and optimize Docker images
   - Update base system packages
   - Performance analysis

### Getting Help

**Resources:**
- GitLab Repository Issues: https://gitlab.com/gl-demo-ultimate-sragupathi/gentle_spaces/-/issues
- GCP Documentation: https://cloud.google.com/compute/docs
- Docker Documentation: https://docs.docker.com/

**Emergency Contacts:**
- System Administrator: [Your Contact Info]
- DevOps Team: [Team Contact Info]

---

## Conclusion

This workflow provides a robust, automated deployment system with:
- ✅ **GitLab CI/CD Integration** - Automated builds and deployments
- ✅ **Health Monitoring** - Automatic rollback on failures  
- ✅ **Manual Override Options** - Multiple deployment methods
- ✅ **Production Safety** - Backup and recovery procedures
- ✅ **Comprehensive Monitoring** - Health checks and logging

The system is designed to be developer-friendly while maintaining production stability and reliability.

---

*Last Updated: September 28, 2025*
*Version: 1.0.0*