# Development Guide

## Quick Start

```bash
# Start both servers
./start.sh

# Or manually:
# Terminal 1
cd server && npm start

# Terminal 2  
cd client && npm start
```

## Project Status

✅ **Completed Features:**
- Real-time messaging with Socket.io
- Custom sticker upload with emoji matching
- Image sharing
- Message encryption (AES)
- Sticker pack management
- Dynamic URL configuration
- Show/hide sticker panels

## Development Commands

```bash
# Backend
cd server
npm start          # Start backend server
npm install        # Install dependencies

# Frontend
cd client
npm start          # Start React dev server
npm run build      # Build for production
npm install        # Install dependencies
```

## File Structure

```
telegram-clone/
├── server/
│   ├── index.js           # Main server file
│   ├── package.json       # Backend dependencies
│   └── uploads/           # User uploads (gitignored)
├── client/
│   ├── src/
│   │   ├── App.js         # Main React component
│   │   ├── App.css        # Styles
│   │   └── config.js      # API configuration
│   └── package.json       # Frontend dependencies
└── start.sh               # Convenience startup script
```

## Environment Variables

Create `.env` files based on `.env.example`:

```bash
# Backend (.env in server/)
PORT=5001

# Frontend (.env in client/)
REACT_APP_API_URL=http://localhost:5001
REACT_APP_SOCKET_URL=http://localhost:5001
```

## Git Workflow

```bash
# Check status
git status

# Add changes
git add .

# Commit
git commit -m "feat: add new feature"

# View history
git log --oneline
```

## Testing Custom Stickers

1. Create a new sticker pack
2. Upload images with emoji assignments
3. Test sending stickers in chat
4. Verify images display properly

## Common Issues

**Port conflicts:**
- Change ports in config.js and .env files

**Images not loading:**
- Check uploads directory permissions
- Verify backend static file serving

**Connection issues:**
- Ensure both servers are running
- Check browser console for errors