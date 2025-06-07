const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Default to regular uploads, we'll move stickers later
    cb(null, './uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/public', express.static('public'));

const messages = [];
const users = [];
const stickerPacks = {
  default: {
    name: 'Default Emojis',
    stickers: ['😀', '😂', '😍', '🤔', '😎', '😭', '🔥', '❤️', '👍', '👎', '🎉', '💯', '🚀', '⭐', '💝', '🎈']
  },
  custom: {
    name: 'Custom Stickers',
    stickers: []
  }
};

app.post('/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const isSticker = req.body.type === 'sticker';
    let imageUrl;
    
    if (isSticker) {
      // Move file to stickers folder
      const oldPath = req.file.path;
      const newPath = path.join('./uploads/stickers/', req.file.filename);
      
      // Ensure stickers directory exists
      if (!fs.existsSync('./uploads/stickers/')) {
        fs.mkdirSync('./uploads/stickers/', { recursive: true });
      }
      
      // Move the file
      fs.renameSync(oldPath, newPath);
      
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      imageUrl = `${baseUrl}/uploads/stickers/${req.file.filename}`;
      
      const packId = req.body.packId || 'custom';
      if (stickerPacks[packId]) {
        stickerPacks[packId].stickers.push({
          id: Date.now().toString(),
          url: imageUrl,
          name: req.body.name || req.file.originalname,
          emoji: req.body.emoji || '🖼️'
        });
      }
    } else {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      imageUrl = `${baseUrl}/uploads/${req.file.filename}`;
    }
    
    res.json({ imageUrl, isSticker });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.get('/sticker-packs', (req, res) => {
  res.json(stickerPacks);
});

app.post('/sticker-pack', (req, res) => {
  const { name } = req.body;
  const packId = `pack_${Date.now()}`;
  
  stickerPacks[packId] = {
    name: name,
    stickers: []
  };
  
  res.json({ packId, pack: stickerPacks[packId] });
});

app.delete('/sticker/:packId/:stickerId', (req, res) => {
  const { packId, stickerId } = req.params;
  
  if (stickerPacks[packId]) {
    stickerPacks[packId].stickers = stickerPacks[packId].stickers.filter(
      sticker => sticker.id !== stickerId
    );
    res.json({ success: true });
  } else {
    res.status(404).json({ error: 'Pack not found' });
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join', (username) => {
    const user = { id: socket.id, username };
    users.push(user);
    socket.username = username;
    
    socket.emit('messages', messages);
    io.emit('users', users);
    
    socket.broadcast.emit('message', {
      id: Date.now(),
      username: 'System',
      text: `${username} joined the chat`,
      timestamp: new Date()
    });
  });

  socket.on('message', (data) => {
    const message = {
      id: Date.now(),
      username: socket.username,
      text: data.text,
      type: data.type || 'text',
      imageUrl: data.imageUrl || null,
      sticker: data.sticker || null,
      encrypted: data.encrypted || false,
      timestamp: new Date()
    };
    
    messages.push(message);
    io.emit('message', message);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    const userIndex = users.findIndex(user => user.id === socket.id);
    if (userIndex !== -1) {
      const user = users[userIndex];
      users.splice(userIndex, 1);
      
      socket.broadcast.emit('message', {
        id: Date.now(),
        username: 'System',
        text: `${user.username} left the chat`,
        timestamp: new Date()
      });
      
      io.emit('users', users);
    }
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});