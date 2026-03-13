const { ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  windowDrag: (deltaX, deltaY) => ipcRenderer.send('window-drag', { deltaX, deltaY })
});
