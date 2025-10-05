#!/bin/bash
echo "🚀 Pushing Railway deployment fixes..."

# Add all changes including new files
git add .

# Commit with descriptive message
git commit -m "Fix Railway deployment: import paths and port binding

- Fixed server/db.ts import path: ../shared/schema.js → ../shared/schema
- Fixed server/storage.ts import path: ../shared/schema.js → ../shared/schema  
- Updated server to bind to 0.0.0.0 for Railway compatibility
- Added environment detection and enhanced logging
- All 251,952 questions ready for deployment"

# Push to main branch
git push origin main

echo "✅ Code pushed to GitHub"
echo "🔄 Railway will auto-deploy in 2-3 minutes"
echo "📱 Check Railway dashboard for build progress"