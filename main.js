const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 798,
    height: 770,
    resizable: false,
    fullscreenable: false,
    frame: false, // Remove the window frame (title bar, borders)
    titleBarStyle: 'hidden', // Hide title bar on macOS
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  win.loadFile('index.html');
  
  // Optional: Open DevTools in development
  // win.webContents.openDevTools();
}

// Handle saving images
ipcMain.on('save-image', async (event, dataURL) => {
  try {
    // Remove the data URL prefix
    const base64Data = dataURL.replace(/^data:image\/png;base64,/, '');
    
    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `photo-${timestamp}.png`;
    
    // Get user's pictures directory or use app directory
    const { app } = require('electron');
    const userDataPath = app.getPath('pictures');
    const filePath = path.join(userDataPath, 'Kiss&Click', filename);
    
    // Create directory if it doesn't exist
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Save the file
    fs.writeFileSync(filePath, base64Data, 'base64');
    
    console.log('Photo saved to:', filePath);
    
    // Send success message back to renderer
    event.reply('save-image-success', filePath);
    
  } catch (error) {
    console.error('Error saving image:', error);
    event.reply('save-image-error', error.message);
  }
});

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});