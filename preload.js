const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
    // File operations
    saveFile: async (fileName, fileBuffer) => {
        return await ipcRenderer.invoke('save-music-file', fileName, fileBuffer);
    },
    
    loadFile: async (fileName) => {
        return await ipcRenderer.invoke('load-music-file', fileName);
    },
    
    fileExists: async (fileName) => {
        return await ipcRenderer.invoke('file-exists', fileName);
    },
    
    deleteFile: async (fileName) => {
        return await ipcRenderer.invoke('delete-music-file', fileName);
    },
    
    getMusicFolderPath: async () => {
        return await ipcRenderer.invoke('get-music-folder-path');
    },
    
    // App info
    getAppVersion: async () => {
        return await ipcRenderer.invoke('app-version');
    },
    
    // Platform detection
    platform: process.platform,
    
    // Check if running in Electron
    isElectron: true
});