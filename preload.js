const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  setWindowPosition: (x, y) => ipcRenderer.send('set-window-position', { x, y }),
  getWindowPosition: () => ipcRenderer.invoke('get-window-position'),
  getDisplayBounds: () => ipcRenderer.invoke('get-display-bounds'),

  // トレイからのメッセージ受信
  onSetMode: (callback) => ipcRenderer.on('set-mode', (event, mode) => callback(mode)),
  onSetSpeed: (callback) => ipcRenderer.on('set-speed', (event, speed) => callback(speed)),
  onSetBackgroundOpacity: (callback) => ipcRenderer.on('set-background-opacity', (event, opacity) => callback(opacity)),
});
