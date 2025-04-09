const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveData: (json) => ipcRenderer.invoke('save-data', json)
});
