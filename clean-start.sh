#!/bin/bash

echo "🧹 Cleaning all data for fresh screenshots..."

# Stop any running servers
pkill -f "node index.js" 2>/dev/null
pkill -f "react-scripts" 2>/dev/null

echo "✅ Stopped all servers"

# Clean uploads directory
rm -rf server/uploads/*
mkdir -p server/uploads/stickers

# Recreate gitkeep files
echo "# This directory is for uploaded images" > server/uploads/.gitkeep
echo "# Files in this directory are not tracked by Git" >> server/uploads/.gitkeep

echo "# This directory is for uploaded stickers" > server/uploads/stickers/.gitkeep
echo "# Files in this directory are not tracked by Git" >> server/uploads/stickers/.gitkeep

echo "✅ Cleaned uploads directory"

# Wait a moment
sleep 2

echo "🚀 Starting clean servers..."

# Start backend
cd /Users/sam/telegram-clone/server && npm start &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
cd /Users/sam/telegram-clone/client && npm start &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "✅ Clean servers started!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:5001"
echo ""
echo "🎬 Ready for screenshots!"
echo "📝 Note: Clear browser cache/storage for completely clean state"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to press Ctrl+C
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait