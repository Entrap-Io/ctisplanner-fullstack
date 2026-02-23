#!/bin/bash

echo "Starting CTIS Planner Full-Stack Application..."
echo ""

# Check if node_modules exists
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing dependencies..."
    cd backend
    npm install
    cd ..
    echo "✓ Dependencies installed"
    echo ""
fi

# Start the server
echo "🌐 Starting server on http://localhost:3000"
cd backend
npm run dev
