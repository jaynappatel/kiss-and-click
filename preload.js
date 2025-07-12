const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    saveImage: (dataURL) => ipcRenderer.send('save-image', dataURL)
});
