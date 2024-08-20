import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';
import axios from 'axios';


// Function to create the main application window
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js') // Optional, for secure context
    }
  });

  // Load the React/Vue front-end (if used)
  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000' // Assuming you're using a React/Vue dev server
      : `file://${path.join(__dirname, '../build/index.html')}` // Production build
  );

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

// Event that runs when Electron is ready
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit the app when all windows are closed (except on macOS)
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// Example of handling IPC communication between the front-end and back-end services
ipcMain.handle('fetch-config', async (event) => {
  try {
    const response = await axios.get('http://localhost:4000/config'); // Replace with your config service URL
    return response.data;
  } catch (error) {
    console.error('Error fetching configuration:', error);
    return { error: 'Failed to fetch configuration' };
  }
});

ipcMain.handle('save-config', async (event, config) => {
  try {
    const response = await axios.post('http://localhost:4000/config', config); // Replace with your config service URL
    return response.data;
  } catch (error) {
    console.error('Error saving configuration:', error);
    return { error: 'Failed to save configuration' };
  }
});

