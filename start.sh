#!/bin/bash

echo "Starting Telegram Clone..."

# Kill any existing processes
pkill -f "node index.js" 2>/dev/null
pkill -f "react-scripts" 2>/dev/null

# Wait a moment
sleep 2

# Start backend
echo "Starting backend server on port 5001..."
cd /Users/sam/telegram-clone/server && npm start &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "Starting frontend server on port 3000..."
cd /Users/sam/telegram-clone/client && npm start &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "✅ Servers started!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend: http://localhost:5001"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for user to press Ctrl+C
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT
wait