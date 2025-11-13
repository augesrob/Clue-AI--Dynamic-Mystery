const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow, controlWindow, commandsWindow, detectiveWindow, logWindow;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1360, height: 860, title: "Clue AI: Dynamic Mystery",
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWindow.loadFile('index.html');
  mainWindow.on('closed', () => app.quit());
}

function createControlWindow() {
  controlWindow = new BrowserWindow({
    width: 620,
    height: 740,
    title: "Streamer Control Panel",
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  controlWindow.loadFile('control.html');
  controlWindow.on('closed', () => { controlWindow = null; });
}


function createCommandsWindow() {
  commandsWindow = new BrowserWindow({
    width: 440, height: 560, title: "TikTok Command Reference",
    alwaysOnTop: true,
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });
  commandsWindow.loadFile('commands.html');
  commandsWindow.on('closed', () => { commandsWindow = null; });
}

function createDetectiveWindow() {
  detectiveWindow = new BrowserWindow({
    width: 400, height: 740,
    title: "Detective Sheet",
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  detectiveWindow.loadFile('detective.html');
}

function createLogWindow() {
  logWindow = new BrowserWindow({
    width: 560,
    height: 800,
    title: "Clue AI Logs",
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  logWindow.loadFile('log.html');
}


app.whenReady().then(() => {
  createMainWindow();
  createControlWindow();
  createCommandsWindow();
  createDetectiveWindow();
  createLogWindow();
});

// ────── IPC: Cross-window communication ──────

// Control → Main
ipcMain.on('control:sendCommand', (_e, text) => {
  console.log('[Main] Forwarding command:', text);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('tiktok:message', text);
  }
});


// Volume
ipcMain.on('volume:set', (_e, d) => {
  if (mainWindow && !mainWindow.isDestroyed())
    mainWindow.webContents.send('volume:set', d);
});

// ─── Detective sheet updates ───
ipcMain.on('detective:update', (_e, data) => {
  if (detectiveWindow && !detectiveWindow.isDestroyed()) {
    detectiveWindow.webContents.send('detective:update', data);
  }
});

// ─── Round & Debug logs ───
ipcMain.on('log:round', (_e, msg) => {
  if (logWindow && !logWindow.isDestroyed()) {
    logWindow.webContents.send('log:round', msg);
  }
});

ipcMain.on('log:debug', (_e, msg) => {
  if (logWindow && !logWindow.isDestroyed()) {
    logWindow.webContents.send('log:debug', msg);
  }
});

