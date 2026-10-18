const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('heyaDesktop', {
  getPinned: () => ipcRenderer.invoke('pin:get'),
  togglePin: () => ipcRenderer.invoke('pin:toggle'),
  minimize: () => ipcRenderer.send('win:minimize'),
  close: () => ipcRenderer.send('win:close'),
  attention: () => ipcRenderer.send('win:attention'),
});
