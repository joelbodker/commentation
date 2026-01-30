#!/bin/bash

# Stop script for Commentation project
# Kills all running dev servers (frontend, backend, landing page)

echo "🛑 Stopping Commentation services..."

# Kill Vite dev servers (frontend and landing page)
pkill -f "vite.*commentation" 2>/dev/null && echo "  ✓ Stopped Vite dev servers" || echo "  - No Vite servers running"

# Kill any node processes in this project directory
pkill -f "node.*commentation/frontend" 2>/dev/null && echo "  ✓ Stopped frontend" || true
pkill -f "node.*commentation/landing" 2>/dev/null && echo "  ✓ Stopped landing page" || true
pkill -f "node.*commentation/backend" 2>/dev/null && echo "  ✓ Stopped backend" || true

# Kill processes on common dev ports
for port in 5173 5174 5175 5176 3001; do
  pid=$(lsof -ti :$port 2>/dev/null)
  if [ -n "$pid" ]; then
    kill $pid 2>/dev/null && echo "  ✓ Killed process on port $port"
  fi
done

echo ""
echo "✅ All services stopped"
