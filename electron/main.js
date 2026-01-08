const { app, BrowserWindow, shell, Tray, Menu } = require('electron');
const path = require('path');

const IS_DEV = process.argv.includes('--dev');
const APP_URL = IS_DEV
    ? 'http://localhost:3000'
    : 'https://reception-1h728qey2-michael-watkins-projects-6087af1b.vercel.app';

let mainWindow;
let tray;
let isQuitting = false;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        titleBarStyle: 'hiddenInset',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: path.join(__dirname, 'icon.png')
    });

    mainWindow.loadURL(APP_URL);

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (url.startsWith('https://accounts.google.com') || url.startsWith('mailto:')) {
            shell.openExternal(url);
            return { action: 'deny' };
        }
        return { action: 'allow' };
    });

    mainWindow.setMenuBarVisibility(false);

    // Prevent app from quitting when window is closed
    mainWindow.on('close', (event) => {
        if (!isQuitting) {
            event.preventDefault();
            mainWindow.hide();
        }
        return false;
    });
}

function createTray() {
    const iconPath = path.join(__dirname, 'icon.png');
    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show Reception AI',
            click: () => {
                mainWindow.show();
            }
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('Reception AI - Background Monitor');
    tray.setContextMenu(contextMenu);

    tray.on('double-click', () => {
        mainWindow.show();
    });
}

app.whenReady().then(() => {
    createWindow();
    createTray();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        } else {
            mainWindow.show();
        }
    });
});

// For Windows/Linux, we handle session end specifically if needed
app.on('before-quit', () => {
    isQuitting = true;
});

app.on('window-all-closed', () => {
    // Overriding the previous quit behavior to stay alive
    if (process.platform !== 'darwin' && !isQuitting) {
        // Do nothing, stay in tray
    } else if (isQuitting) {
        app.quit();
    }
});
