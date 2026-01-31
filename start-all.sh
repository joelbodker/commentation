#!/bin/bash

# Start script for Commentation project
# Starts the landing page (with intro animation) and optionally the frontend embed

set -e

echo "🚀 Starting Commentation..."

# Check if landing node_modules exists
if [ ! -d "landing/node_modules" ]; then
  echo "📦 Installing landing page dependencies..."
  npm install --prefix landing
fi

echo "✨ Starting landing page dev server..."
echo "🌐 Landing page will be available at http://localhost:5174"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start the landing page dev server
npm run dev --prefix landing
