#!/bin/bash

# =============================================================================
# GCP Cloud Run Deployment Script for Gentle Space Realty
# Firebase Authentication Integration
# =============================================================================

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-gentle-space-realty}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="${GCP_SERVICE_NAME:-gentle-space-realty-api}"
DOCKERFILE="${DOCKERFILE:-Dockerfile}"
PORT="${PORT:-8080}"

# Firebase Configuration
FIREBASE_PROJECT_ID="${VITE_FIREBASE_PROJECT_ID}"
FIREBASE_SERVICE_ACCOUNT_KEY="${FIREBASE_SERVICE_ACCOUNT_KEY_PATH}"

# Supabase Configuration
SUPABASE_URL="${SUPABASE_URL}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check for gcloud CLI
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed. Please install it from: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    # Check for docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker Desktop or Docker Engine."
        exit 1
    fi
    
    # Check for npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install Node.js and npm."
        exit 1
    fi
    
    print_success "All prerequisites are installed"
}

# Function to validate environment variables
validate_environment() {
    print_status "Validating environment variables..."
    
    local missing_vars=()
    
    # Required GCP variables
    if [[ -z "$PROJECT_ID" ]]; then
        missing_vars+=("GCP_PROJECT_ID")
    fi
    
    # Required Firebase variables
    if [[ -z "$FIREBASE_PROJECT_ID" ]]; then
        missing_vars+=("VITE_FIREBASE_PROJECT_ID")
    fi
    
    if [[ -z "$FIREBASE_SERVICE_ACCOUNT_KEY" ]]; then
        missing_vars+=("FIREBASE_SERVICE_ACCOUNT_KEY_PATH")
    fi
    
    # Required Supabase variables
    if [[ -z "$SUPABASE_URL" ]]; then
        missing_vars+=("SUPABASE_URL")
    fi
    
    if [[ -z "$SUPABASE_SERVICE_ROLE_KEY" ]]; then
        missing_vars+=("SUPABASE_SERVICE_ROLE_KEY")
    fi
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        print_error "Missing required environment variables:"
        printf '  - %s\n' "${missing_vars[@]}"
        print_error "Please set these variables and try again."
        exit 1
    fi
    
    # Validate Firebase service account key file exists
    if [[ ! -f "$FIREBASE_SERVICE_ACCOUNT_KEY" ]]; then
        print_error "Firebase service account key file not found: $FIREBASE_SERVICE_ACCOUNT_KEY"
        exit 1
    fi
    
    print_success "Environment validation passed"
}

# Function to authenticate with GCP
authenticate_gcp() {
    print_status "Authenticating with Google Cloud Platform..."
    
    # Check if already authenticated
    if gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        print_success "Already authenticated with GCP"
        
        # Set the project
        gcloud config set project "$PROJECT_ID"
        print_success "Set project to: $PROJECT_ID"
    else
        print_status "Please authenticate with GCP..."
        gcloud auth login
        gcloud config set project "$PROJECT_ID"
    fi
    
    # Enable required APIs
    print_status "Enabling required GCP APIs..."
    gcloud services enable cloudbuild.googleapis.com
    gcloud services enable run.googleapis.com
    gcloud services enable containerregistry.googleapis.com
    gcloud services enable artifactregistry.googleapis.com
    
    print_success "GCP authentication and setup complete"
}

# Function to build the application
build_application() {
    print_status "Building the application..."
    
    # Install dependencies
    print_status "Installing Node.js dependencies..."
    npm ci --production=false
    
    # Build frontend
    print_status "Building frontend application..."
    npm run build
    
    # Verify build output
    if [[ ! -d "dist" ]]; then
        print_error "Frontend build failed - dist directory not found"
        exit 1
    fi
    
    print_success "Application build completed"
}

# Function to create Dockerfile if it doesn't exist
create_dockerfile() {
    if [[ ! -f "$DOCKERFILE" ]]; then
        print_status "Creating Dockerfile..."
        
        cat > "$DOCKERFILE" << 'EOF'
# Multi-stage build for Gentle Space Realty
# Stage 1: Build the React frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code and build
COPY . .
RUN npm run build

# Stage 2: Production server
FROM node:18-alpine AS production

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built frontend
COPY --from=frontend-builder /app/dist ./dist

# Copy server files
COPY server/ ./server/
COPY src/lib/firebaseAdmin.ts ./src/lib/firebaseAdmin.ts

# Create Firebase service account directory
RUN mkdir -p /app/secrets

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => process.exit(1));"

# Expose port
EXPOSE 8080

# Start the server
CMD ["node", "server/index.js"]
EOF
        
        print_success "Dockerfile created"
    else
        print_status "Using existing Dockerfile"
    fi
}

# Function to create .dockerignore if it doesn't exist
create_dockerignore() {
    if [[ ! -f ".dockerignore" ]]; then
        print_status "Creating .dockerignore..."
        
        cat > ".dockerignore" << 'EOF'
# Development files
node_modules
npm-debug.log*
.npm
.env.local
.env.development
.env.test

# Build artifacts
.vite
dist/assets/*.map

# Git
.git
.gitignore
.gitattributes

# Documentation
README.md
docs/
*.md

# Testing
tests/
coverage/
*.test.js
*.spec.js

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed

# Deployment scripts
deploy*.sh
.gcloudignore
EOF
        
        print_success ".dockerignore created"
    else
        print_status "Using existing .dockerignore"
    fi
}

# Function to create Cloud Build configuration
create_cloudbuild_config() {
    if [[ ! -f "cloudbuild.yaml" ]]; then
        print_status "Creating Cloud Build configuration..."
        
        cat > "cloudbuild.yaml" << EOF
steps:
  # Build the Docker image
  - name: 'gcr.io/cloud-builders/docker'
    args: [
      'build',
      '-t', 'gcr.io/\$PROJECT_ID/${SERVICE_NAME}:\$BUILD_ID',
      '-t', 'gcr.io/\$PROJECT_ID/${SERVICE_NAME}:latest',
      '.'
    ]
    
  # Push the Docker image to Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/\$PROJECT_ID/${SERVICE_NAME}:\$BUILD_ID']
    
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/\$PROJECT_ID/${SERVICE_NAME}:latest']
    
  # Deploy to Cloud Run
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    args: [
      'run', 'deploy', '${SERVICE_NAME}',
      '--image', 'gcr.io/\$PROJECT_ID/${SERVICE_NAME}:\$BUILD_ID',
      '--region', '${REGION}',
      '--platform', 'managed',
      '--allow-unauthenticated',
      '--port', '${PORT}',
      '--memory', '1Gi',
      '--cpu', '1',
      '--max-instances', '10',
      '--set-env-vars',
      'NODE_ENV=production,PORT=${PORT},SUPABASE_URL=${SUPABASE_URL},SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY},VITE_FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}'
    ]

timeout: '1200s'
options:
  logging: CLOUD_LOGGING_ONLY
  machineType: 'E2_HIGHCPU_8'

images:
  - 'gcr.io/\$PROJECT_ID/${SERVICE_NAME}:\$BUILD_ID'
  - 'gcr.io/\$PROJECT_ID/${SERVICE_NAME}:latest'
EOF
        
        print_success "Cloud Build configuration created"
    else
        print_status "Using existing Cloud Build configuration"
    fi
}

# Function to upload Firebase service account key
upload_service_account_key() {
    print_status "Managing Firebase service account key..."
    
    # Create secret in Google Secret Manager
    if gcloud secrets describe firebase-service-account-key --project="$PROJECT_ID" &>/dev/null; then
        print_status "Firebase service account secret already exists, updating..."
        gcloud secrets versions add firebase-service-account-key \
            --data-file="$FIREBASE_SERVICE_ACCOUNT_KEY" \
            --project="$PROJECT_ID"
    else
        print_status "Creating Firebase service account secret..."
        gcloud secrets create firebase-service-account-key \
            --data-file="$FIREBASE_SERVICE_ACCOUNT_KEY" \
            --project="$PROJECT_ID"
    fi
    
    print_success "Firebase service account key uploaded to Secret Manager"
}

# Function to deploy using Cloud Build
deploy_with_cloudbuild() {
    print_status "Deploying with Cloud Build..."
    
    # Submit the build
    gcloud builds submit \
        --config=cloudbuild.yaml \
        --project="$PROJECT_ID" \
        --region="$REGION" \
        .
    
    # Wait for deployment to complete and get service URL
    SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
        --platform=managed \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --format="value(status.url)")
    
    print_success "Deployment completed successfully!"
    print_success "Service URL: $SERVICE_URL"
}

# Function to deploy directly with Cloud Run
deploy_with_cloudrun() {
    print_status "Building and deploying with Cloud Run..."
    
    # Build and deploy in one command
    gcloud run deploy "$SERVICE_NAME" \
        --source . \
        --platform managed \
        --region "$REGION" \
        --project "$PROJECT_ID" \
        --allow-unauthenticated \
        --port "$PORT" \
        --memory 1Gi \
        --cpu 1 \
        --max-instances 10 \
        --set-env-vars "NODE_ENV=production,PORT=$PORT,SUPABASE_URL=$SUPABASE_URL,SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY,VITE_FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID,FIREBASE_SERVICE_ACCOUNT_KEY_PATH=/secrets/firebase-service-account-key.json" \
        --quiet
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" \
        --platform=managed \
        --region="$REGION" \
        --project="$PROJECT_ID" \
        --format="value(status.url)")
    
    print_success "Deployment completed successfully!"
    print_success "Service URL: $SERVICE_URL"
}

# Function to run post-deployment tests
run_post_deployment_tests() {
    print_status "Running post-deployment health checks..."
    
    if [[ -n "$SERVICE_URL" ]]; then
        # Test health endpoint
        print_status "Testing health endpoint..."
        if curl -f -s "$SERVICE_URL/health" > /dev/null; then
            print_success "Health check passed"
        else
            print_warning "Health check failed - service may still be starting up"
        fi
        
        # Test auth endpoint
        print_status "Testing auth service..."
        if curl -f -s "$SERVICE_URL/auth" > /dev/null; then
            print_success "Auth service check passed"
        else
            print_warning "Auth service check failed - verify Firebase configuration"
        fi
    else
        print_warning "Service URL not available - skipping tests"
    fi
}

# Function to configure domain mapping (optional)
configure_domain() {
    if [[ -n "$CUSTOM_DOMAIN" ]]; then
        print_status "Configuring custom domain: $CUSTOM_DOMAIN"
        
        # Map domain to service
        gcloud run domain-mappings create \
            --service="$SERVICE_NAME" \
            --domain="$CUSTOM_DOMAIN" \
            --region="$REGION" \
            --project="$PROJECT_ID" \
            --quiet
        
        print_success "Domain mapping created for: $CUSTOM_DOMAIN"
        print_warning "Don't forget to configure your DNS records!"
    fi
}

# Function to display deployment summary
show_deployment_summary() {
    print_success "=== DEPLOYMENT SUMMARY ==="
    echo -e "${GREEN}Project:${NC} $PROJECT_ID"
    echo -e "${GREEN}Region:${NC} $REGION"
    echo -e "${GREEN}Service:${NC} $SERVICE_NAME"
    echo -e "${GREEN}Service URL:${NC} $SERVICE_URL"
    
    if [[ -n "$CUSTOM_DOMAIN" ]]; then
        echo -e "${GREEN}Custom Domain:${NC} $CUSTOM_DOMAIN"
    fi
    
    echo ""
    print_status "Next Steps:"
    echo "1. Verify the application is running at: $SERVICE_URL"
    echo "2. Test Firebase authentication flow"
    echo "3. Update CORS settings in Firebase Console to include the new domain"
    echo "4. Update your DNS records if using a custom domain"
    echo "5. Monitor logs with: gcloud logs read --service=$SERVICE_NAME --limit=50"
}

# Function to show usage information
show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Deploy Gentle Space Realty to Google Cloud Run with Firebase Auth"
    echo ""
    echo "Options:"
    echo "  -h, --help              Show this help message"
    echo "  -p, --project PROJECT   GCP Project ID (default: gentle-space-realty)"
    echo "  -r, --region REGION     GCP Region (default: us-central1)"
    echo "  -s, --service SERVICE   Cloud Run service name (default: gentle-space-realty-api)"
    echo "  -d, --domain DOMAIN     Custom domain to map to the service"
    echo "  -m, --method METHOD     Deployment method: 'cloudbuild' or 'cloudrun' (default: cloudrun)"
    echo "  --skip-build            Skip the application build step"
    echo "  --skip-tests            Skip post-deployment tests"
    echo ""
    echo "Environment Variables:"
    echo "  GCP_PROJECT_ID                    Google Cloud Project ID"
    echo "  GCP_REGION                        Google Cloud Region"
    echo "  VITE_FIREBASE_PROJECT_ID          Firebase Project ID"
    echo "  FIREBASE_SERVICE_ACCOUNT_KEY_PATH Firebase service account key file path"
    echo "  SUPABASE_URL                      Supabase project URL"
    echo "  SUPABASE_SERVICE_ROLE_KEY         Supabase service role key"
    echo ""
    echo "Examples:"
    echo "  # Basic deployment"
    echo "  $0"
    echo ""
    echo "  # Deploy with custom domain"
    echo "  $0 --domain api.gentlespacerealty.com"
    echo ""
    echo "  # Deploy using Cloud Build"
    echo "  $0 --method cloudbuild"
}

# Main deployment function
main() {
    local deployment_method="cloudrun"
    local skip_build=false
    local skip_tests=false
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -p|--project)
                PROJECT_ID="$2"
                shift 2
                ;;
            -r|--region)
                REGION="$2"
                shift 2
                ;;
            -s|--service)
                SERVICE_NAME="$2"
                shift 2
                ;;
            -d|--domain)
                CUSTOM_DOMAIN="$2"
                shift 2
                ;;
            -m|--method)
                deployment_method="$2"
                shift 2
                ;;
            --skip-build)
                skip_build=true
                shift
                ;;
            --skip-tests)
                skip_tests=true
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    print_success "🚀 Starting deployment of Gentle Space Realty to Google Cloud Run"
    print_status "Project: $PROJECT_ID | Region: $REGION | Service: $SERVICE_NAME"
    echo ""
    
    # Run deployment steps
    check_prerequisites
    validate_environment
    authenticate_gcp
    
    if [[ "$skip_build" != true ]]; then
        build_application
    fi
    
    create_dockerfile
    create_dockerignore
    upload_service_account_key
    
    # Deploy based on chosen method
    case $deployment_method in
        cloudbuild)
            create_cloudbuild_config
            deploy_with_cloudbuild
            ;;
        cloudrun)
            deploy_with_cloudrun
            ;;
        *)
            print_error "Invalid deployment method: $deployment_method"
            print_error "Valid methods are: 'cloudbuild' or 'cloudrun'"
            exit 1
            ;;
    esac
    
    configure_domain
    
    if [[ "$skip_tests" != true ]]; then
        run_post_deployment_tests
    fi
    
    show_deployment_summary
    
    print_success "🎉 Deployment completed successfully!"
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi