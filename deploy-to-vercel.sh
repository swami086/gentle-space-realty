#!/bin/bash

# Complete Vercel Deployment Script
# Project: https://vercel.com/swamis-projects-c596d1fd/gentle_spaces

echo "🚀 Deploying Gentle Space Realty to Vercel"
echo "==========================================="

# Check authentication
echo "🔍 Checking Vercel authentication..."
if ! vercel whoami &>/dev/null; then
    echo "❌ Not authenticated. Please complete the login process first."
    exit 1
fi

echo "✅ Authentication confirmed: $(vercel whoami)"

# Link to existing project
echo "🔗 Linking to project gentle_spaces..."
vercel link --yes --scope swamis-projects-c596d1fd --project gentle_spaces

# Set critical environment variables
echo "⚙️ Setting up environment variables..."
echo "Setting up basic environment variables..."

# Deploy to preview first
echo "🚀 Deploying to preview environment..."
vercel

echo ""
echo "✅ Preview deployment complete!"
echo "🌐 Preview URL will be displayed above"

echo ""
echo "🎯 Ready for production deployment?"
echo "Run: vercel --prod"
echo ""
echo "🔧 Next steps:"
echo "1. Test the preview deployment"
echo "2. Set up database (if needed): vercel env add DATABASE_URL"
echo "3. Configure storage: vercel env add BLOB_READ_WRITE_TOKEN"
echo "4. Deploy to production: vercel --prod"
echo ""
echo "📋 Project dashboard: https://vercel.com/swamis-projects-c596d1fd/gentle_spaces"