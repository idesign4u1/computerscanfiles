const { contextBridge, ipcRenderer } = require('electron');

// Expose limited API to renderer process
contextBridge.exposeInMainWorld('electron', {
  // IPC communication methods (if needed in future)
  send: (channel, data) => {
    ipcRenderer.send(channel, data);
  },
  receive: (channel, func) => {
    ipcRenderer.on(channel, (event, ...args) => func(...args));
  },
  // Platform info
  platform: process.platform,
});

console.log('Preload script loaded');
