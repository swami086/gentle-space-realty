#!/bin/bash

# Deployment fix script for Gentle Spaces Realty
echo "🔧 Fixing Vercel deployment configuration..."

# Check if required files exist
if [ ! -f "vercel.json" ]; then
    echo "❌ vercel.json not found!"
    exit 1
fi

if [ ! -d "api" ]; then
    echo "❌ API directory not found!"
    exit 1
fi

echo "✅ Configuration files found"

# Build the project
echo "🏗️  Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful"

# Test serverless functions locally (if possible)
echo "🧪 Testing serverless functions..."
node -e "
try {
  console.log('Testing API health endpoint...');
  const health = require('./api/health.js');
  console.log('✅ Health endpoint loaded');
  
  const test = require('./api/test.js');
  console.log('✅ Test endpoint loaded');
  
  const properties = require('./api/properties.js');
  console.log('✅ Properties endpoint loaded');
  
  const login = require('./api/login.js');
  console.log('✅ Login endpoint loaded');
  
  console.log('🎉 All serverless functions are ready!');
} catch (error) {
  console.error('❌ Serverless function test failed:', error.message);
  process.exit(1);
}
"

if [ $? -ne 0 ]; then
    echo "❌ Serverless function tests failed!"
    exit 1
fi

echo "✅ All tests passed"

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
if command -v vercel &> /dev/null; then
    vercel --prod
    echo "🎉 Deployment initiated!"
    echo ""
    echo "📋 Next steps:"
    echo "1. Check deployment status in Vercel dashboard"
    echo "2. Disable deployment protection if needed"
    echo "3. Test API endpoints:"
    echo "   - GET /health"
    echo "   - GET /api/test"
    echo "   - GET /api/properties"
    echo "   - POST /api/auth/login"
else
    echo "⚠️  Vercel CLI not found. Please install it:"
    echo "   npm i -g vercel"
    echo "   Then run: vercel --prod"
fi

echo ""
echo "🔍 Troubleshooting tips:"
echo "1. If you see 401 errors, disable deployment protection in Vercel dashboard"
echo "2. Check function logs in Vercel dashboard for any runtime errors"
echo "3. Verify CORS headers are set correctly for your frontend domain"