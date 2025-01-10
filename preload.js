const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  importAnnotations: (folderPath) => ipcRenderer.invoke('import-annotations', folderPath)
});