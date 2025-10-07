#!/bin/bash

# Property Scraper Feature Rollback Script
# 
# This script removes all files and changes related to the Property Scraper feature
# that were added for MagicBricks integration with Firecrawl.
#
# Usage: bash scripts/rollback-scraper-feature.sh
#
# WARNING: This will permanently delete all scraper-related files and code changes!

set -e

echo "🗑️  Property Scraper Feature Rollback Script"
echo "============================================="
echo ""
echo "This script will remove all Property Scraper feature files and changes."
echo "This includes:"
echo "  - Backend API routes and services"
echo "  - Frontend components and services" 
echo "  - Type definitions"
echo "  - Configuration changes"
echo "  - Navigation updates"
echo ""

# Confirm rollback
read -p "Are you sure you want to proceed? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Rollback cancelled."
    exit 1
fi

echo ""
echo "🔄 Starting rollback process..."

# Backend file removals
echo ""
echo "🗑️  Removing backend files..."

# Remove scraper service files
if [ -f "backend/src/services/urlBuilderService.ts" ]; then
    rm "backend/src/services/urlBuilderService.ts"
    echo "    ✅ Removed backend/src/services/urlBuilderService.ts"
fi

if [ -f "backend/src/services/firecrawlService.ts" ]; then
    rm "backend/src/services/firecrawlService.ts"
    echo "    ✅ Removed backend/src/services/firecrawlService.ts"
fi

# Remove scraper types
if [ -f "backend/src/types/scraper.ts" ]; then
    rm "backend/src/types/scraper.ts"
    echo "    ✅ Removed backend/src/types/scraper.ts"
fi

# Remove scraper routes
if [ -f "backend/src/routes/scraper.ts" ]; then
    rm "backend/src/routes/scraper.ts"
    echo "    ✅ Removed backend/src/routes/scraper.ts"
fi

# Frontend file removals
echo ""
echo "🗑️  Removing frontend files..."

# Remove scraper components
if [ -d "src/components/scraper" ]; then
    rm -rf "src/components/scraper"
    echo "    ✅ Removed src/components/scraper/ directory"
fi

# Remove scraper types
if [ -f "src/types/scraper.ts" ]; then
    rm "src/types/scraper.ts"
    echo "    ✅ Removed src/types/scraper.ts"
fi

# Remove scraper service
if [ -f "src/services/scraperService.ts" ]; then
    rm "src/services/scraperService.ts"
    echo "    ✅ Removed src/services/scraperService.ts"
fi

# Restore configuration files
echo ""
echo "🔄 Restoring configuration files..."

# Restore backend package.json (remove Firecrawl dependency)
if [ -f "backend/package.json" ]; then
    # Create a backup first
    cp "backend/package.json" "backend/package.json.rollback-backup"
    
    # Remove Firecrawl dependency using sed
    sed -i.bak '/"@mendable\/firecrawl-js":/d' "backend/package.json"
    rm "backend/package.json.bak" 2>/dev/null || true
    echo "    ✅ Removed Firecrawl dependency from backend/package.json"
fi

# Restore backend .env.example (remove Firecrawl config section)
if [ -f "backend/.env.example" ]; then
    # Create a backup first
    cp "backend/.env.example" "backend/.env.example.rollback-backup"
    
    # Remove Firecrawl configuration section
    sed -i.bak '/# Firecrawl API Configuration/,/FIRECRAWL_API_KEY=.*/d' "backend/.env.example"
    rm "backend/.env.example.bak" 2>/dev/null || true
    echo "    ✅ Removed Firecrawl config from backend/.env.example"
fi

# Restore backend environment.ts (remove FIRECRAWL_API_KEY)
if [ -f "backend/src/config/environment.ts" ]; then
    # Create a backup first
    cp "backend/src/config/environment.ts" "backend/src/config/environment.ts.rollback-backup"
    
    # Remove Firecrawl API configuration lines
    sed -i.bak '/\/\/ Firecrawl API Configuration/,/FIRECRAWL_API_KEY: z\.string()\.startsWith.*optional(),/d' "backend/src/config/environment.ts"
    rm "backend/src/config/environment.ts.bak" 2>/dev/null || true
    echo "    ✅ Removed Firecrawl config from backend/src/config/environment.ts"
fi

# Restore validation middleware (remove scraper schemas)
if [ -f "backend/src/middleware/validationMiddleware.ts" ]; then
    # Create a backup first
    cp "backend/src/middleware/validationMiddleware.ts" "backend/src/middleware/validationMiddleware.ts.rollback-backup"
    
    # Remove scraper-related validation imports and schemas
    sed -i.bak '/import.*scraperSchemas/d' "backend/src/middleware/validationMiddleware.ts"
    sed -i.bak '/scraperSchemas.*{/,/^}/d' "backend/src/middleware/validationMiddleware.ts"
    sed -i.bak '/export.*scraperSchemas/d' "backend/src/middleware/validationMiddleware.ts"
    rm "backend/src/middleware/validationMiddleware.ts.bak" 2>/dev/null || true
    echo "    ✅ Removed scraper schemas from backend/src/middleware/validationMiddleware.ts"
fi

# Restore server.ts (remove scraper routes)
if [ -f "backend/src/server.ts" ]; then
    # Create a backup first
    cp "backend/src/server.ts" "backend/src/server.ts.rollback-backup"
    
    # Remove scraper routes import and registration
    sed -i.bak '/import.*scraperRoutes.*from.*routes\/scraper/d' "backend/src/server.ts"
    sed -i.bak '/app\.use.*\/api\/v1\/scraper.*scraperRoutes/d' "backend/src/server.ts"
    rm "backend/src/server.ts.bak" 2>/dev/null || true
    echo "    ✅ Removed scraper routes from backend/src/server.ts"
fi

# Restore AdminPage.tsx (remove scraper integration)
if [ -f "src/pages/AdminPage.tsx" ]; then
    # Create a backup first
    cp "src/pages/AdminPage.tsx" "src/pages/AdminPage.tsx.rollback-backup"
    
    # Remove ScraperManagement import
    sed -i.bak '/import ScraperManagement from.*components\/scraper\/ScraperManagement/d' "src/pages/AdminPage.tsx"
    
    # Remove scraper case from getCurrentPageFromUrl function
    sed -i.bak "/if (pathname\.includes('\/admin\/scraper')) return 'scraper';/d" "src/pages/AdminPage.tsx"
    
    # Remove scraper case from renderCurrentPage switch
    sed -i.bak "/case 'scraper':/,/return <ScraperManagement \/>;/d" "src/pages/AdminPage.tsx"
    
    rm "src/pages/AdminPage.tsx.bak" 2>/dev/null || true
    echo "    ✅ Removed scraper integration from src/pages/AdminPage.tsx"
fi

# Restore AdminLayout.tsx (remove scraper menu)
if [ -f "src/components/admin/AdminLayout.tsx" ]; then
    # Create a backup first
    cp "src/components/admin/AdminLayout.tsx" "src/components/admin/AdminLayout.tsx.rollback-backup"
    
    # Remove Globe import
    sed -i.bak '/Globe/d' "src/components/admin/AdminLayout.tsx"
    
    # Remove scraper navigation item (multiline removal)
    sed -i.bak '/{\s*name: '\''Property Scraper'\'',/,/},/d' "src/components/admin/AdminLayout.tsx"
    
    rm "src/components/admin/AdminLayout.tsx.bak" 2>/dev/null || true
    echo "    ✅ Removed scraper menu from src/components/admin/AdminLayout.tsx"
fi

# Restore apiService.ts (remove scraper methods)
if [ -f "src/services/apiService.ts" ]; then
    # Create a backup first
    cp "src/services/apiService.ts" "src/services/apiService.ts.rollback-backup"
    
    # Remove scraper section (multiline removal)
    sed -i.bak '/\/\/ Property Scraper endpoints/,/deletePreset: (id: string) =>/d' "src/services/apiService.ts"
    sed -i.bak '/ApiService\.delete<any>(`\/v1\/scraper\/presets\/\${id}`)/,/}/d' "src/services/apiService.ts"
    
    rm "src/services/apiService.ts.bak" 2>/dev/null || true
    echo "    ✅ Removed scraper methods from src/services/apiService.ts"
fi

echo ""
echo "🧹 Cleaning up backup files..."
find . -name "*.rollback-backup" -delete 2>/dev/null || true

echo ""
echo "✅ Property Scraper feature rollback completed successfully!"
echo ""
echo "📝 Summary of changes:"
echo "  - Removed all scraper-related backend files and services"
echo "  - Removed all scraper-related frontend components and services"
echo "  - Removed Firecrawl dependency from package.json"
echo "  - Restored configuration files to original state"
echo "  - Removed scraper navigation from admin interface"
echo ""
echo "⚠️  Note: You may need to:"
echo "  - Run 'npm install' in the backend directory to update dependencies"
echo "  - Remove any FIRECRAWL_API_KEY from your .env file"
echo "  - Restart your development servers"
echo ""
echo "🎯 Rollback complete! The scraper feature has been fully removed."