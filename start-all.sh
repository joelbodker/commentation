#!/bin/bash

# Start script for Commentation project
# Starts the frontend dev server (backend not needed - uses in-memory store)

set -e

echo "🚀 Starting Commentation..."

# Check if node_modules exists in root
if [ ! -d "node_modules" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Check if frontend node_modules exists
if [ ! -d "frontend/node_modules" ]; then
  echo "📦 Installing frontend dependencies..."
  npm install --prefix frontend
fi

echo "✨ Starting frontend dev server..."
echo "🌐 Frontend will be available at http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start the frontend dev server
npm run dev:frontend
