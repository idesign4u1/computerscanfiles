const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');

let mainWindow;
let pythonProcess;

// Determine if running in development or production
const isDevelopment = isDev;
console.log('Is Development:', isDevelopment);
console.log('App Path:', app.getAppPath());

/**
 * Start Python FastAPI server
 */
function startPythonServer() {
  const pythonScript = path.join(__dirname, '../backend/main.py');
  const pythonPath = process.platform === 'win32' ? 'python' : 'python3';

  console.log('Starting Python server...');
  pythonProcess = spawn(pythonPath, [pythonScript], {
    cwd: path.join(__dirname, '../backend'),
    stdio: 'pipe',
  });

  pythonProcess.stdout.on('data', (data) => {
    console.log(`[Python] ${data.toString()}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`[Python Error] ${data.toString()}`);
  });

  pythonProcess.on('error', (err) => {
    console.error('Failed to start Python server:', err);
  });

  pythonProcess.on('exit', (code) => {
    console.log(`Python server exited with code ${code}`);
  });

  // Give server time to start
  return new Promise((resolve) => {
    setTimeout(resolve, 2000);
  });
}

/**
 * Create the main window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
    },
    icon: path.join(__dirname, 'assets/icon.png'),
  });

  const startUrl = isDevelopment
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../frontend/build/index.html')}`;

  mainWindow.loadURL(startUrl);

  if (isDevelopment) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Create application menu
 */
function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          },
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: 'CmdOrCtrl+Shift+I',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          },
        },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            // TODO: Show about dialog
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * App ready event
 */
app.on('ready', async () => {
  console.log('App starting...');

  // Start Python server first
  await startPythonServer();

  // Create window
  createWindow();
  createMenu();
});

/**
 * Quit when all windows are closed
 */
app.on('window-all-closed', () => {
  // Kill Python server
  if (pythonProcess) {
    console.log('Killing Python server...');
    pythonProcess.kill();
  }

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Re-create window when app is activated (macOS)
 */
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

/**
 * Handle any uncaught exceptions
 */
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});
