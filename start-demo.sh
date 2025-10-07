#!/bin/bash

# Gentle Space Realty - Notification System Demo Startup Script

echo "🏡 Gentle Space Realty - Notification System"
echo "=============================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies."
        exit 1
    fi
    echo "✅ Dependencies installed successfully."
    echo ""
fi

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "🔧 Creating environment configuration..."
    cp .env.example .env
    echo "✅ Created .env file from template."
    echo "⚠️  Please review and update .env file with your settings."
    echo ""
fi

# Start the server in background
echo "🚀 Starting notification server..."
npm run server:dev &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Check if server is running
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo "❌ Server failed to start. Check the logs above."
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo "✅ Server started successfully!"
echo ""

# Run the demo
echo "🎬 Starting notification system demo..."
echo "Press Ctrl+C to stop the demo and server."
echo ""

# Run demo and capture exit code
node demo-notifications.js
DEMO_EXIT_CODE=$?

# Cleanup - stop the server
echo ""
echo "🧹 Stopping server..."
kill $SERVER_PID 2>/dev/null
wait $SERVER_PID 2>/dev/null

if [ $DEMO_EXIT_CODE -eq 0 ]; then
    echo "✅ Demo completed successfully!"
else
    echo "❌ Demo ended with errors."
fi

echo ""
echo "📚 Next steps:"
echo "   • Review NOTIFICATION_SYSTEM.md for detailed documentation"
echo "   • Configure .env file for production use"
echo "   • Run 'npm run server:dev' to start the server"
echo "   • Run 'npm run test:integration' to run tests"
echo ""
echo "🎉 Thank you for using Gentle Space Realty Notification System!"

exit $DEMO_EXIT_CODE