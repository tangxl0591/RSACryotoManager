const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: '#0f172a'
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers

// Helper to get storage path relative to the executable
const getKeysDir = () => {
  // If packaged (production), use the directory containing the .exe
  if (app.isPackaged) {
    return path.join(path.dirname(app.getPath('exe')), 'RSA-Keys');
  }
  // In development, use the project root
  return path.join(__dirname, 'RSA-Keys');
};

ipcMain.handle('saveKey', async (event, key) => {
  try {
    const keysDir = getKeysDir();
    const keyDir = path.join(keysDir, key.name);
    
    if (!fs.existsSync(keyDir)) {
      fs.mkdirSync(keyDir, { recursive: true });
    }

    fs.writeFileSync(path.join(keyDir, 'public.pem'), key.publicKey);
    fs.writeFileSync(path.join(keyDir, 'private.pem'), key.privateKey);
    
    const metadata = {
      id: key.id,
      name: key.name,
      size: key.size,
      algorithm: key.algorithm, // Added algorithm field
      createdAt: key.createdAt
    };
    
    fs.writeFileSync(path.join(keyDir, 'metadata.json'), JSON.stringify(metadata, null, 2));

    return { success: true, path: keyDir };
  } catch (error) {
    console.error("Error saving key:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('getKeys', async () => {
  try {
    const keysDir = getKeysDir();
    if (!fs.existsSync(keysDir)) return [];

    const items = fs.readdirSync(keysDir, { withFileTypes: true });
    const keys = [];

    for (const item of items) {
      if (item.isDirectory()) {
        const metaPath = path.join(keysDir, item.name, 'metadata.json');
        if (fs.existsSync(metaPath)) {
          try {
            const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
            keys.push(meta);
          } catch (e) {
            console.warn(`Failed to parse metadata for ${item.name}`);
          }
        }
      }
    }
    
    return keys.sort((a, b) => b.createdAt - a.createdAt);
  } catch (error) {
    console.error("Error getting keys:", error);
    return [];
  }
});

ipcMain.handle('getKey', async (event, name) => {
  try {
    const keyDir = path.join(getKeysDir(), name);
    if (!fs.existsSync(keyDir)) return undefined;

    const metaPath = path.join(keyDir, 'metadata.json');
    const pubPath = path.join(keyDir, 'public.pem');
    const privPath = path.join(keyDir, 'private.pem');

    if (!fs.existsSync(metaPath) || !fs.existsSync(pubPath) || !fs.existsSync(privPath)) {
      return undefined;
    }

    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
    const publicKey = fs.readFileSync(pubPath, 'utf8');
    const privateKey = fs.readFileSync(privPath, 'utf8');

    return {
      ...meta,
      publicKey,
      privateKey
    };
  } catch (error) {
    console.error(`Error fetching key ${name}:`, error);
    return undefined;
  }
});

ipcMain.handle('openKeysFolder', async () => {
  const dir = getKeysDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  await shell.openPath(dir);
});