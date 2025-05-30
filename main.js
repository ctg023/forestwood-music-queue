const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

// Create music-files directory if it doesn't exist
// Use proper path for built app vs development
// Store in user's app data folder
const musicDir = path.join(app.getPath('userData'), 'music-files');
if (!fs.existsSync(musicDir)) {
    fs.mkdirSync(musicDir, { recursive: true });
}

function createWindow() {
    // Create the browser window
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        minWidth: 800,
        minHeight: 600,
        icon: path.join(__dirname, 'build', 'icon.png'), // Add icon if available
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        },
        show: false // Don't show until ready
    });

    // Load the HTML file
    mainWindow.loadFile('index.html');

    // Show window when ready to prevent visual flash
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Open DevTools in development
    if (process.argv.includes('--dev')) {
        mainWindow.webContents.openDevTools();
    }

    // Create application menu
    createMenu();
}

function createMenu() {
    const template = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Open Music Folder',
                    click: () => {
                        const { shell } = require('electron');
                        shell.openPath(musicDir);
                    }
                },
                { type: 'separator' },
                {
                    label: 'Exit',
                    accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
                    click: () => {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                { role: 'reload' },
                { role: 'forceReload' },
                { role: 'toggleDevTools' },
                { type: 'separator' },
                { role: 'resetZoom' },
                { role: 'zoomIn' },
                { role: 'zoomOut' },
                { type: 'separator' },
                { role: 'togglefullscreen' }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'About Music Queue Manager',
                    click: () => {
                        dialog.showMessageBox(mainWindow, {
                            type: 'info',
                            title: 'About',
                            message: 'Music Queue Manager',
                            detail: 'Version 1.2.5\nManage your ice rink music queue with timers and user accounts.'
                        });
                    }
                }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
}

// App event handlers
app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// IPC Handlers for file operations
ipcMain.handle('save-music-file', async (event, fileName, fileBuffer) => {
    try {
        // Create unique filename to avoid conflicts
        const timestamp = Date.now();
        const ext = path.extname(fileName);
        const baseName = path.basename(fileName, ext);
        const uniqueFileName = `${baseName}_${timestamp}${ext}`;
        
        const filePath = path.join(musicDir, uniqueFileName);
        
        // Convert ArrayBuffer to Buffer for Node.js
        const buffer = Buffer.from(fileBuffer);
        fs.writeFileSync(filePath, buffer);
        
        console.log(`File saved: ${filePath}`);
        return uniqueFileName; // Return just the filename for storage
    } catch (error) {
        console.error('Error saving file:', error);
        throw error;
    }
});

ipcMain.handle('load-music-file', async (event, fileName) => {
    try {
        const filePath = path.join(musicDir, fileName);
        
        if (fs.existsSync(filePath)) {
            const buffer = fs.readFileSync(filePath);
            return buffer;
        } else {
            console.log(`File not found: ${filePath}`);
            return null;
        }
    } catch (error) {
        console.error('Error loading file:', error);
        return null;
    }
});

ipcMain.handle('file-exists', async (event, fileName) => {
    try {
        const filePath = path.join(musicDir, fileName);
        return fs.existsSync(filePath);
    } catch (error) {
        console.error('Error checking file existence:', error);
        return false;
    }
});

ipcMain.handle('delete-music-file', async (event, fileName) => {
    try {
        const filePath = path.join(musicDir, fileName);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`File deleted: ${filePath}`);
            return true;
        } else {
            console.log(`File not found for deletion: ${filePath}`);
            return false;
        }
    } catch (error) {
        console.error('Error deleting file:', error);
        return false;
    }
});

ipcMain.handle('get-music-folder-path', async () => {
    return musicDir;
});

// Handle app updates or other features as needed
ipcMain.handle('app-version', async () => {
    return app.getVersion();
});