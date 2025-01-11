const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  importAnnotations: (folderPath, outputPath) => ipcRenderer.invoke('import-annotations', folderPath, outputPath)
});