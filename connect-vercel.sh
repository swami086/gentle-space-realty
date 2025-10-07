#!/bin/bash

# Vercel Project Connection Script
# Project: https://vercel.com/swamis-projects-c596d1fd/gentle_spaces

echo "🚀 Connecting to Vercel Project: gentle_spaces"
echo "=============================================="

# Check if authenticated
if ! vercel whoami &>/dev/null; then
    echo "❌ Not authenticated with Vercel"
    echo "Please run: vercel login"
    exit 1
fi

echo "✅ Vercel authentication confirmed"

# Link to existing project
echo "🔗 Linking to existing project..."
vercel link --yes --scope swamis-projects-c596d1fd --project gentle_spaces

# Confirm project connection
if [ -f .vercel/project.json ]; then
    echo "✅ Project linked successfully!"
    echo "📋 Project details:"
    cat .vercel/project.json | jq '.'
    
    echo ""
    echo "🌟 Available commands:"
    echo "  vercel          - Deploy to preview"
    echo "  vercel --prod   - Deploy to production" 
    echo "  vercel env ls   - List environment variables"
    echo "  vercel logs     - View deployment logs"
    
    echo ""
    echo "🔧 Next steps:"
    echo "1. Set environment variables: vercel env add"
    echo "2. Deploy: vercel --prod"
    echo "3. View project: https://vercel.com/swamis-projects-c596d1fd/gentle_spaces"
    
else
    echo "❌ Project linking failed"
    echo "Please check the project name and scope"
fi