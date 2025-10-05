#!/bin/bash

# Auto-deploy script for Replit to GitHub to Railway
echo "🚀 Starting deployment from Replit..."

# Add all changes
git add .

# Commit with timestamp
git commit -m "Auto-deploy from Replit - $(date '+%Y-%m-%d %H:%M:%S')"

# Push to GitHub (this will trigger Railway deployment)
git push origin main

echo "✅ Deployment complete!"
echo "📱 Check Railway dashboard in 2-3 minutes for live deployment"
echo "🌐 Your app will be updated at your Railway URL"