const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveKey: (key) => ipcRenderer.invoke('saveKey', key),
  getKeys: () => ipcRenderer.invoke('getKeys'),
  getKey: (name) => ipcRenderer.invoke('getKey', name),
  openKeysFolder: () => ipcRenderer.invoke('openKeysFolder')
});