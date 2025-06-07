# Clean State for Screenshots

## Quick Clean & Start

```bash
./clean-start.sh
```

## Manual Browser Reset

For completely clean screenshots, also clear browser data:

### Chrome/Brave:
1. Open DevTools (F12)
2. Right-click refresh button → "Empty Cache and Hard Reload"
3. Or go to: Settings → Privacy → Clear browsing data
4. Select: Cookies, Cache, Local storage
5. Clear for "localhost"

### Firefox:
1. F12 → Storage tab → Clear all storage
2. Or Settings → Privacy → Clear Data
3. Select: Cookies, Cache, Site Data

### Safari:
1. Develop → Empty Caches
2. Or Settings → Privacy → Manage Website Data
3. Remove "localhost" entries

## Clean State Features

✅ **No messages** - Chat starts empty  
✅ **No users** - User list is empty  
✅ **No uploads** - No uploaded images/stickers  
✅ **Default stickers only** - Only emoji stickers available  
✅ **Fresh UI** - All panels closed, clean interface  

## Screenshot Scenarios

### 1. Login Screen
- Open http://localhost:3000
- Shows clean login form

### 2. Empty Chat
- Login with any username
- Shows empty chat with sidebar

### 3. Sticker Panel
- Click emoji button (😊)
- Shows default emoji stickers

### 4. Upload Features
- Click camera button (📷) for image upload
- Click gear icon (⚙️) for sticker management

### 5. Encryption Toggle
- Shows encryption ON/OFF toggle in header

## Reset Between Screenshots

To reset state between different screenshots:

```bash
# Stop servers
Ctrl+C

# Clean and restart
./clean-start.sh

# Clear browser storage (see above)
```

This ensures each screenshot shows the feature in a clean, professional state.