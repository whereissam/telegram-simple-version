import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import CryptoJS from 'crypto-js';
import config from './config';
import './App.css';

const socket = io(config.SOCKET_URL);

function App() {
  const [username, setUsername] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [showStickers, setShowStickers] = useState(false);
  const [encryptionEnabled, setEncryptionEnabled] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [stickerPacks, setStickerPacks] = useState({});
  const [currentPack, setCurrentPack] = useState('default');
  const [showStickerManager, setShowStickerManager] = useState(false);
  const [newPackName, setNewPackName] = useState('');
  const [stickerManagerCollapsed, setStickerManagerCollapsed] = useState(true);

  useEffect(() => {
    socket.on('messages', (initialMessages) => {
      setMessages(initialMessages);
    });

    socket.on('message', (newMessage) => {
      console.log('Received message:', newMessage);
      setMessages(prev => [...prev, newMessage]);
    });

    socket.on('users', (userList) => {
      setUsers(userList);
    });

    loadStickerPacks();

    return () => {
      socket.off('messages');
      socket.off('message');
      socket.off('users');
    };
  }, []);

  const loadStickerPacks = async () => {
    try {
      console.log('Loading sticker packs...');
      const response = await fetch(`${config.API_BASE_URL}/sticker-packs`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const packs = await response.json();
      console.log('Loaded packs:', packs);
      setStickerPacks(packs);
    } catch (error) {
      console.error('Failed to load sticker packs:', error);
    }
  };

  const joinChat = (e) => {
    e.preventDefault();
    if (username.trim()) {
      socket.emit('join', username);
      setIsJoined(true);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (message.trim() || message.length > 0) {
      const messageToSend = encryptMessage(message);
      socket.emit('message', { 
        text: messageToSend, 
        type: 'text',
        encrypted: encryptionEnabled
      });
      setMessage('');
    }
  };

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      setUploading(true);
      const response = await fetch(`${config.API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (data.imageUrl) {
        socket.emit('message', { 
          text: '', 
          type: 'image', 
          imageUrl: data.imageUrl 
        });
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      uploadImage(file);
    }
  };

  const sendSticker = (stickerData) => {
    console.log('Sending sticker:', stickerData);
    
    // Check if it's a URL (custom sticker) or emoji
    if (typeof stickerData === 'string' && stickerData.startsWith('http')) {
      // It's a custom image sticker - send immediately
      console.log('Sending custom image sticker');
      socket.emit('message', { 
        text: '', 
        type: 'sticker', 
        sticker: stickerData,
        encrypted: false
      });
      setShowStickers(false);
    } else {
      // It's an emoji - add to text
      console.log('Adding emoji to text');
      const currentText = message;
      const finalText = currentText ? `${currentText} ${stickerData}` : stickerData;
      setMessage(finalText);
      setShowStickers(false);
    }
  };

  const encryptMessage = (text) => {
    if (!encryptionEnabled || !text) return text;
    const secretKey = 'telegram-clone-secret-2024';
    return CryptoJS.AES.encrypt(text, secretKey).toString();
  };

  const decryptMessage = (encryptedText) => {
    if (!encryptedText) return '';
    try {
      const secretKey = 'telegram-clone-secret-2024';
      const bytes = CryptoJS.AES.decrypt(encryptedText, secretKey);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      return encryptedText;
    }
  };

  const uploadCustomSticker = async (file, name, emoji) => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('type', 'sticker');
    formData.append('name', name || file.name);
    formData.append('packId', currentPack);
    formData.append('emoji', emoji || '🖼️');
    
    try {
      setUploading(true);
      const response = await fetch(`${config.API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (data.imageUrl) {
        await loadStickerPacks();
        console.log(`Sticker uploaded to pack: ${currentPack}`);
      }
    } catch (error) {
      console.error('Sticker upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const createNewPack = async () => {
    if (!newPackName.trim()) {
      alert('Please enter a pack name');
      return;
    }
    
    try {
      console.log('Creating pack:', newPackName);
      const response = await fetch(`${config.API_BASE_URL}/sticker-pack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPackName })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Pack created:', data);
      
      if (data.packId) {
        await loadStickerPacks();
        setCurrentPack(data.packId);
        setNewPackName('');
        setShowStickerManager(false);
        alert(`Pack "${data.pack.name}" created successfully!`);
      }
    } catch (error) {
      console.error('Failed to create pack:', error);
      alert('Failed to create pack. Please try again.');
    }
  };

  const handleStickerUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (currentPack === 'default') {
        alert('Cannot upload to Default Emojis pack. Please select or create a custom pack.');
        return;
      }
      
      const name = prompt('Enter sticker name:') || file.name;
      if (!name) return;
      
      const emoji = prompt('Enter an emoji to represent this sticker (e.g., 😂, 🔥, 💯):') || '🖼️';
      uploadCustomSticker(file, name, emoji);
    }
  };

  const renderSticker = (sticker, index) => {
    if (typeof sticker === 'string') {
      return (
        <button key={index} className="sticker-btn" onClick={() => sendSticker(sticker)}>
          {sticker}
        </button>
      );
    } else {
      return (
        <button key={sticker.id} className="sticker-btn custom-sticker" onClick={() => sendSticker(sticker.url)} title={sticker.name}>
          <div className="sticker-with-emoji">
            <img src={sticker.url} alt={sticker.name} />
            <span className="sticker-emoji-overlay">{sticker.emoji || '🖼️'}</span>
          </div>
        </button>
      );
    }
  };

  if (!isJoined) {
    return (
      <div className="login-container">
        <div className="login-form">
          <h2>Join Telegram Clone</h2>
          <form onSubmit={joinChat}>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <button type="submit">Join Chat</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="sidebar">
        <h3>Online Users ({users.length})</h3>
        <ul className="users-list">
          {users.map((user) => (
            <li key={user.id} className="user-item">
              {user.username}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="chat-container">
        <div className="chat-header">
          <h2>Telegram Clone</h2>
          <div className="header-controls">
            <label className="encryption-toggle">
              <input
                type="checkbox"
                checked={encryptionEnabled}
                onChange={(e) => setEncryptionEnabled(e.target.checked)}
              />
              🔒 Encryption {encryptionEnabled ? 'ON' : 'OFF'}
            </label>
            <span>Welcome, {username}!</span>
          </div>
        </div>
        
        <div className="messages-container">
          {messages.map((msg) => (
            <div key={msg.id} className={`message ${msg.username === username ? 'own-message' : ''}`}>
              <div className="message-header">
                <span className="message-username">{msg.username}</span>
                <span className="message-time">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="message-content">
                {msg.type === 'text' && (
                  <div className="message-text">
                    {msg.encrypted ? decryptMessage(msg.text) : msg.text}
                    {msg.encrypted && <span className="encrypted-indicator">🔒</span>}
                  </div>
                )}
                {msg.type === 'image' && (
                  <div className="message-image">
                    <img src={msg.imageUrl} alt="Uploaded" />
                  </div>
                )}
                {msg.type === 'sticker' && (
                  <div className="message-sticker">
                    {msg.sticker && msg.sticker.startsWith && msg.sticker.startsWith('http') ? (
                      <img src={msg.sticker} alt="Custom sticker" />
                    ) : (
                      <span className="sticker-emoji">{msg.sticker}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="input-container">
          {showStickers && (
            <div className="stickers-panel">
              <div className="sticker-pack-tabs">
                {Object.keys(stickerPacks).map(packId => (
                  <button
                    key={packId}
                    className={`pack-tab ${currentPack === packId ? 'active' : ''}`}
                    onClick={() => setCurrentPack(packId)}
                  >
                    {stickerPacks[packId]?.name}
                  </button>
                ))}
                <button 
                  className="pack-tab manage-btn"
                  onClick={() => setShowStickerManager(!showStickerManager)}
                >
                  {showStickerManager ? '➖' : '⚙️'}
                </button>
              </div>
              
              {showStickerManager && (
                <div className="sticker-manager">
                  <div className="manager-row">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleStickerUpload}
                      style={{ display: 'none' }}
                      id="sticker-upload"
                    />
                    <label htmlFor="sticker-upload" className="upload-btn">
                      📤 Upload Sticker
                    </label>
                  </div>
                  
                  <div className="manager-row">
                    <input
                      type="text"
                      placeholder="New pack name"
                      value={newPackName}
                      onChange={(e) => setNewPackName(e.target.value)}
                      className="pack-name-input"
                    />
                    <button onClick={createNewPack} className="create-pack-btn">
                      ➕ Create Pack
                    </button>
                  </div>
                </div>
              )}
              
              <div className="stickers-grid">
                {stickerPacks[currentPack]?.stickers?.map((sticker, index) => 
                  renderSticker(sticker, index)
                )}
              </div>
            </div>
          )}
          
          <form className="message-form" onSubmit={sendMessage}>
            <div className="input-actions">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
                id="file-input"
              />
              <label htmlFor="file-input" className="action-btn">
                📷
              </label>
              <button
                type="button"
                className="action-btn"
                onClick={() => setShowStickers(!showStickers)}
                title={showStickers ? 'Hide stickers' : 'Show stickers'}
              >
                {showStickers ? '❌' : '😊'}
              </button>
            </div>
            
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={uploading}
            />
            
            <button type="submit" disabled={uploading}>
              {uploading ? '⏳' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;
