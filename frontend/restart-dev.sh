#!/bin/bash

# Restart Frontend Development Server with Production Domain Support
echo "🔄 Restarting frontend development server..."

# Kill any existing processes on port 3000
echo "🛑 Stopping existing processes on port 3000..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true

# Wait a moment
sleep 2

# Start the development server
echo "🚀 Starting frontend development server..."
echo "   - Host: 0.0.0.0 (accessible from external IPs)"
echo "   - Port: 3000"
echo "   - Allowed hosts: localhost, 127.0.0.1, 46.101.244.203, www.doggodaiily.com, doggodaiily.com"
echo "   - API URL: https://www.doggodaiily.com/api"
echo ""

npm run dev
