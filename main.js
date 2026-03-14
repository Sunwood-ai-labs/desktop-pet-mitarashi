const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } = require('electron');
const path = require('path');

const STARTUP_FLAG = '--launch-at-login';

let mainWindow = null;
let backgroundWindow = null;
let tray = null;
let isBackgroundVisible = false;
let currentMode = 'running';

function supportsLaunchAtLogin() {
  return process.platform === 'win32' || process.platform === 'darwin';
}

function getStartupExecutablePath() {
  if (process.platform === 'win32' && process.env.PORTABLE_EXECUTABLE_FILE) {
    return process.env.PORTABLE_EXECUTABLE_FILE;
  }

  return process.execPath;
}

function getStartupRegistrationArgs() {
  if (process.platform !== 'win32') {
    return [];
  }

  if (app.isPackaged) {
    return [STARTUP_FLAG];
  }

  return [path.resolve(app.getAppPath()), STARTUP_FLAG];
}

function getLaunchAtLoginSettings() {
  if (!supportsLaunchAtLogin()) {
    return { openAtLogin: false };
  }

  if (process.platform === 'win32') {
    return app.getLoginItemSettings({
      path: getStartupExecutablePath(),
      args: getStartupRegistrationArgs()
    });
  }

  return app.getLoginItemSettings();
}

function isLaunchAtLoginEnabled() {
  return Boolean(getLaunchAtLoginSettings().openAtLogin);
}

function setLaunchAtLogin(enabled) {
  if (!supportsLaunchAtLogin()) {
    return;
  }

  const settings = { openAtLogin: enabled };

  if (process.platform === 'darwin') {
    settings.openAsHidden = true;
  } else if (process.platform === 'win32') {
    settings.path = getStartupExecutablePath();
    settings.args = getStartupRegistrationArgs();
  }

  app.setLoginItemSettings(settings);
}

function shouldStartHidden() {
  if (process.platform === 'darwin') {
    return Boolean(app.getLoginItemSettings().wasOpenedAsHidden);
  }

  return process.argv.includes(STARTUP_FLAG);
}

function createWindow({ show = true } = {}) {
  const workArea = screen.getPrimaryDisplay().workArea;

  mainWindow = new BrowserWindow({
    width: 130,
    height: 110,
    show,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.setPosition(workArea.x + 10, workArea.y + workArea.height - 110);

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function ensureMainWindow({ show = true, focus = false } = {}) {
  if (!mainWindow) {
    createWindow({ show });
  } else if (show) {
    mainWindow.show();
  }

  if (focus && mainWindow) {
    mainWindow.focus();
  }

  return mainWindow;
}

function showMainWindow() {
  ensureMainWindow({ show: true, focus: true });
}

function sendToMainWindow(channel, payload) {
  ensureMainWindow({ show: false });

  const dispatch = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(channel, payload);
    }
  };

  if (mainWindow.webContents.isLoadingMainFrame()) {
    mainWindow.webContents.once('did-finish-load', dispatch);
    return;
  }

  dispatch();
}

function createBackgroundWindow() {
  const workArea = screen.getPrimaryDisplay().workArea;
  const imageAspectRatio = 1360 / 436;
  const windowHeight = Math.round(workArea.width / imageAspectRatio);

  backgroundWindow = new BrowserWindow({
    width: workArea.width,
    height: windowHeight,
    transparent: true,
    frame: false,
    alwaysOnTop: false,
    resizable: false,
    skipTaskbar: true,
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  backgroundWindow.loadFile('background.html');
  backgroundWindow.setPosition(workArea.x, workArea.y + workArea.height - windowHeight);
  backgroundWindow.setIgnoreMouseEvents(true);
  backgroundWindow.hide();

  backgroundWindow.on('closed', () => {
    backgroundWindow = null;
  });
}

async function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'fav.png');
  const trayIcon = nativeImage.createFromPath(iconPath);
  tray = new Tray(trayIcon);
  tray.setToolTip('Mitarashi Desktop Pet');

  updateTrayMenu();

  tray.on('double-click', () => {
    showMainWindow();
  });
}

function toggleBackground() {
  if (!backgroundWindow) {
    createBackgroundWindow();
  }

  isBackgroundVisible = !isBackgroundVisible;

  if (isBackgroundVisible) {
    backgroundWindow.show();
  } else {
    backgroundWindow.hide();
  }

  updateTrayMenu();
}

function updateTrayMenu() {
  const contextMenuTemplate = [
    {
      label: 'Show',
      click: () => {
        showMainWindow();
      }
    },
    { type: 'separator' }
  ];

  if (supportsLaunchAtLogin()) {
    contextMenuTemplate.push(
      {
        label: process.platform === 'win32' ? 'Start with Windows' : 'Start at Login',
        type: 'checkbox',
        checked: isLaunchAtLoginEnabled(),
        click: (menuItem) => {
          setLaunchAtLogin(menuItem.checked);
          updateTrayMenu();
        }
      },
      { type: 'separator' }
    );
  }

  contextMenuTemplate.push(
    {
      label: 'Running Mode',
      type: 'radio',
      checked: currentMode === 'running',
      click: () => {
        currentMode = 'running';
        showMainWindow();
        sendToMainWindow('set-mode', 'running');
      }
    },
    {
      label: 'Idle Mode',
      type: 'radio',
      checked: currentMode === 'idle',
      click: () => {
        currentMode = 'idle';
        showMainWindow();
        sendToMainWindow('set-mode', 'idle');
      }
    },
    {
      label: 'Random Mode',
      type: 'radio',
      checked: currentMode === 'random',
      click: () => {
        currentMode = 'random';
        showMainWindow();
        sendToMainWindow('set-mode', 'random');
      }
    },
    { type: 'separator' },
    {
      label: 'Speed: Fast',
      click: () => {
        sendToMainWindow('set-speed', 8);
      }
    },
    {
      label: 'Speed: Medium',
      click: () => {
        sendToMainWindow('set-speed', 5);
      }
    },
    {
      label: 'Speed: Slow',
      click: () => {
        sendToMainWindow('set-speed', 2);
      }
    },
    { type: 'separator' },
    {
      label: 'Show Background',
      type: 'checkbox',
      checked: isBackgroundVisible,
      click: () => {
        toggleBackground();
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  );

  tray.setContextMenu(Menu.buildFromTemplate(contextMenuTemplate));
}

app.whenReady().then(async () => {
  const startHidden = shouldStartHidden();

  await createTray();
  ensureMainWindow({ show: !startHidden });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      return;
    }

    showMainWindow();
  });
});

app.on('window-all-closed', (event) => {
  event.preventDefault();
});

ipcMain.on('window-drag', (event, { deltaX, deltaY }) => {
  const [currentX, currentY] = mainWindow.getPosition();
  mainWindow.setPosition(currentX + deltaX, currentY + deltaY);
});

ipcMain.on('set-window-position', (event, { x, y }) => {
  mainWindow.setPosition(Math.round(x), Math.round(y));
});

ipcMain.handle('get-window-position', () => {
  const [x, y] = mainWindow.getPosition();
  return { x, y };
});

ipcMain.handle('get-work-area', () => {
  return screen.getPrimaryDisplay().workArea;
});

ipcMain.on('set-always-on-top', (event, value) => {
  mainWindow.setAlwaysOnTop(value, 'floating');
});
