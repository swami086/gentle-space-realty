#!/bin/bash

# Deploy Gentle Space Realty to GCP Compute Engine
set -e

# Configuration
PROJECT_ID="aqueous-impact-269911"
INSTANCE_NAME="gentle-space-realty-vm"
ZONE="asia-south1-a"
MACHINE_TYPE="e2-medium"
IMAGE_FAMILY="ubuntu-2204-lts"
IMAGE_PROJECT="ubuntu-os-cloud"
DISK_SIZE="20GB"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Deploying Gentle Space Realty to GCP Compute Engine${NC}"

# Set up environment
export GOOGLE_APPLICATION_CREDENTIALS="/Users/swaminathan/Downloads/gentle_space_realty_i1aw6b/Keys/aqueous-impact-269911-8c1c766d0dcb.json"
gcloud config set project $PROJECT_ID

# Check if instance exists
if gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Instance $INSTANCE_NAME already exists. Stopping it first...${NC}"
    gcloud compute instances stop $INSTANCE_NAME --zone=$ZONE --quiet || true
    sleep 10
    echo -e "${YELLOW}🗑️  Deleting existing instance...${NC}"
    gcloud compute instances delete $INSTANCE_NAME --zone=$ZONE --quiet || true
    sleep 5
fi

echo -e "${GREEN}📦 Creating new VM instance...${NC}"

# Create the VM instance
gcloud compute instances create $INSTANCE_NAME \
    --zone=$ZONE \
    --machine-type=$MACHINE_TYPE \
    --image-family=$IMAGE_FAMILY \
    --image-project=$IMAGE_PROJECT \
    --boot-disk-size=$DISK_SIZE \
    --boot-disk-type=pd-standard \
    --tags=http-server,https-server \
    --metadata-from-file=startup-script=deploy/startup-script.sh \
    --scopes=https://www.googleapis.com/auth/cloud-platform

echo -e "${GREEN}⏳ Waiting for VM to be ready...${NC}"
sleep 30

# Create firewall rules if they don't exist
echo -e "${GREEN}🔥 Setting up firewall rules...${NC}"
gcloud compute firewall-rules create gentle-space-http --allow tcp:80 --source-ranges 0.0.0.0/0 --description "Allow HTTP traffic for Gentle Space Realty" || echo "HTTP rule already exists"
gcloud compute firewall-rules create gentle-space-api --allow tcp:3001 --source-ranges 0.0.0.0/0 --description "Allow API traffic for Gentle Space Realty" || echo "API rule already exists"

# Get external IP
EXTERNAL_IP=$(gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo -e "${GREEN}🌐 VM created with external IP: $EXTERNAL_IP${NC}"

# Wait for startup script to complete
echo -e "${GREEN}⏳ Waiting for startup script to complete (this may take a few minutes)...${NC}"
sleep 60

# Prepare deployment package
echo -e "${GREEN}📁 Preparing deployment package...${NC}"
cd /Users/swaminathan/Downloads/gentle_space_realty_i1aw6b
tar --exclude=node_modules --exclude=backend/node_modules --exclude=dist --exclude=backend/dist --exclude=.git -czf deploy-package.tar.gz . 

echo -e "${GREEN}📤 Uploading application code to VM...${NC}"
gcloud compute scp deploy-package.tar.gz $INSTANCE_NAME:/tmp/ --zone=$ZONE

# Deploy the application
echo -e "${GREEN}🚀 Deploying application on VM...${NC}"
gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command="
    set -e
    cd /opt/gentle-space-realty
    sudo tar -xzf /tmp/deploy-package.tar.gz
    sudo chown -R root:root .
    sudo docker-compose build --no-cache
    sudo docker-compose up -d
    sudo systemctl start gentle-space-realty
    echo '✅ Application deployed successfully!'
"

echo -e "${GREEN}✅ Deployment completed!${NC}"
echo -e "${GREEN}🌍 Your application is available at:${NC}"
echo -e "${GREEN}   Frontend: http://$EXTERNAL_IP${NC}"
echo -e "${GREEN}   API: http://$EXTERNAL_IP:3001/api/v1${NC}"
echo -e "${GREEN}   Health Check: http://$EXTERNAL_IP:3001/api/v1/health${NC}"

echo -e "${YELLOW}📝 To update your app in the future, run:${NC}"
echo -e "${YELLOW}   ./deploy/update-app.sh${NC}"

# Clean up
rm -f deploy-package.tar.gz

echo -e "${GREEN}🎉 Gentle Space Realty is now live on GCP!${NC}"