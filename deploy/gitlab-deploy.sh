#!/bin/bash

# GitLab CI/CD deployment script for GCP
# This script runs on the GCP instance to update from GitLab

set -e

echo "🚀 Starting GitLab deployment process..."

# Configuration
REPO_URL="https://gitlab.com/gl-demo-ultimate-sragupathi/gentle_spaces.git"
APP_DIR="/opt/gentle-space-realty"
BACKUP_DIR="/opt/gentle-space-realty-backup"
BRANCH="production"

# Create backup of current deployment
echo "💾 Creating backup of current deployment..."
if [ -d "$APP_DIR" ]; then
    sudo rm -rf "$BACKUP_DIR"
    sudo cp -r "$APP_DIR" "$BACKUP_DIR"
    echo "✅ Backup created at $BACKUP_DIR"
fi

# Clone or pull latest from GitLab production branch
echo "📥 Updating from GitLab repository..."
if [ -d "$APP_DIR/.git" ]; then
    echo "🔄 Pulling latest changes..."
    cd "$APP_DIR"
    sudo git fetch origin
    sudo git checkout $BRANCH
    sudo git pull origin $BRANCH
else
    echo "📥 Cloning repository..."
    sudo rm -rf "$APP_DIR"
    sudo git clone -b $BRANCH "$REPO_URL" "$APP_DIR"
fi

# Set proper permissions
echo "🔐 Setting proper permissions..."
sudo chown -R swaminathan:swaminathan "$APP_DIR"

# Navigate to app directory
cd "$APP_DIR"

echo "✅ Repository updated successfully!"

# Install dependencies and build
echo "📦 Installing dependencies..."
npm ci --production

echo "🏗️ Building application..."
npm run build

# Update containers
echo "🐳 Updating Docker containers..."
cd "$APP_DIR"
sudo docker-compose -f deploy/docker-compose.yml down --remove-orphans
sudo docker-compose -f deploy/docker-compose.yml up -d --build

# Wait for services to start
echo "⏱️ Waiting for services to start..."
sleep 20

# Health check
echo "🏥 Performing health check..."
if curl -f http://localhost/api/health > /dev/null 2>&1; then
    echo "✅ Health check passed!"
    
    # Test properties API
    PROPERTY_COUNT=$(curl -s http://localhost/api/v1/properties | jq 'length' 2>/dev/null || echo "unknown")
    echo "📊 Properties available: $PROPERTY_COUNT"
    
    echo "🎉 Deployment completed successfully!"
    echo "🌐 Application is live at: http://35.200.252.186/"
    
    # Remove backup on successful deployment
    sudo rm -rf "$BACKUP_DIR"
    echo "🗑️ Backup removed after successful deployment"
    
else
    echo "❌ Health check failed! Rolling back..."
    
    # Rollback to backup
    if [ -d "$BACKUP_DIR" ]; then
        sudo rm -rf "$APP_DIR"
        sudo mv "$BACKUP_DIR" "$APP_DIR"
        cd "$APP_DIR"
        sudo docker-compose -f deploy/docker-compose.yml up -d
        echo "⏪ Rollback completed"
    fi
    
    exit 1
fi

echo "✅ GitLab deployment process completed!"