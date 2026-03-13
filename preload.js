const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  windowDrag: (deltaX, deltaY) => ipcRenderer.send('window-drag', { deltaX, deltaY }),
  setWindowPosition: (x, y) => ipcRenderer.send('set-window-position', { x, y }),
  getWindowPosition: () => ipcRenderer.invoke('get-window-position'),
  getWorkArea: () => ipcRenderer.invoke('get-work-area'),
  setAlwaysOnTop: (value) => ipcRenderer.send('set-always-on-top', value),

  // トレイからのメッセージ受信
  onSetMode: (callback) => ipcRenderer.on('set-mode', (event, mode) => callback(mode)),
  onSetSpeed: (callback) => ipcRenderer.on('set-speed', (event, speed) => callback(speed)),
});
