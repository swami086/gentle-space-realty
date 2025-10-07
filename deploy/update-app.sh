#!/bin/bash

# Quick update script for Gentle Space Realty on GCP
set -e

# Configuration
PROJECT_ID="aqueous-impact-269911"
INSTANCE_NAME="gentle-space-realty-vm"
ZONE="asia-south1-a"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Updating Gentle Space Realty on GCP (Mumbai)${NC}"

# Set up environment
export GOOGLE_APPLICATION_CREDENTIALS="/Users/swaminathan/Downloads/gentle_space_realty_i1aw6b/Keys/aqueous-impact-269911-8c1c766d0dcb.json"
gcloud config set project $PROJECT_ID

# Check if instance exists and is running
if ! gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE >/dev/null 2>&1; then
    echo -e "${RED}❌ Instance $INSTANCE_NAME does not exist. Please run deploy-to-gcp.sh first.${NC}"
    exit 1
fi

# Get instance status
STATUS=$(gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --format='get(status)')
if [ "$STATUS" != "RUNNING" ]; then
    echo -e "${YELLOW}⚠️  Instance is not running. Starting it now...${NC}"
    gcloud compute instances start $INSTANCE_NAME --zone=$ZONE
    echo -e "${GREEN}⏳ Waiting for instance to start...${NC}"
    sleep 30
fi

# Prepare deployment package
echo -e "${GREEN}📁 Preparing updated application package...${NC}"
cd /Users/swaminathan/Downloads/gentle_space_realty_i1aw6b

# Build frontend if needed
echo -e "${GREEN}🏗️  Building frontend...${NC}"
npm run build

# Build backend if needed
echo -e "${GREEN}🏗️  Building backend...${NC}"
cd backend && npm run build && cd ..

# Create deployment package
tar --exclude=node_modules --exclude=backend/node_modules --exclude=.git -czf update-package.tar.gz . 

echo -e "${GREEN}📤 Uploading updated code to VM...${NC}"
gcloud compute scp update-package.tar.gz $INSTANCE_NAME:/tmp/ --zone=$ZONE

# Deploy the update
echo -e "${GREEN}🚀 Applying updates on VM...${NC}"
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command="
    set -e
    cd /opt/gentle-space-realty
    
    echo '🛑 Stopping application...'
    sudo docker-compose down || true
    
    echo '📦 Extracting updated code...'
    sudo tar -xzf /tmp/update-package.tar.gz
    sudo chown -R root:root .
    
    echo '🏗️  Rebuilding containers...'
    sudo docker-compose build --no-cache
    
    echo '🚀 Starting updated application...'
    sudo docker-compose up -d
    
    echo '⏳ Waiting for services to be ready...'
    sleep 15
    
    echo '🔍 Checking application health...'
    if curl -f http://localhost:3001/api/v1/health >/dev/null 2>&1; then
        echo '✅ Backend is healthy!'
    else
        echo '❌ Backend health check failed!'
        exit 1
    fi
    
    if curl -f http://localhost/health >/dev/null 2>&1; then
        echo '✅ Frontend is healthy!'
    else
        echo '❌ Frontend health check failed!'
        exit 1
    fi
    
    echo '✅ Update completed successfully!'
"

# Get external IP
EXTERNAL_IP=$(gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo -e "${GREEN}✅ Update completed!${NC}"
echo -e "${GREEN}🌍 Your updated application is available at:${NC}"
echo -e "${GREEN}   Frontend: http://$EXTERNAL_IP${NC}"
echo -e "${GREEN}   API: http://$EXTERNAL_IP:3001/api/v1${NC}"
echo -e "${GREEN}   Health Check: http://$EXTERNAL_IP:3001/api/v1/health${NC}"

# Clean up
rm -f update-package.tar.gz

echo -e "${GREEN}🎉 Gentle Space Realty has been updated on GCP Mumbai!${NC}"