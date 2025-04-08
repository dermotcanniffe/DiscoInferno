const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadFile('dist/index.html');
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

ipcMain.handle('save-data', async (event, json) => {
  const { filePath } = await dialog.showSaveDialog({
    filters: [{ name: 'JSON Files', extensions: ['json'] }],
    defaultPath: 'example-map.json'
  });
  if (filePath) fs.writeFileSync(filePath, json);
});
