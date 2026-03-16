const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } = require('electron');
const fs = require('fs');
const path = require('path');

const STARTUP_FLAG = '--launch-at-login';
const EDGE_OVERHANG = 24;
const ALWAYS_ON_TOP_LEVEL = 'screen-saver';
const CODEX_ACTIVITY_WINDOW_SECONDS = 180;
const INT32_MIN = -2147483648;
const INT32_MAX = 2147483647;
const MASCOT_WINDOW_CONFIGS = [
  {
    id: 'cat',
    windowWidth: 140,
    windowHeight: 140,
    startOffsetX: 32
  },
  {
    id: 'penguin',
    windowWidth: 108,
    windowHeight: 108,
    startOffsetX: 136
  }
];

const mascotWindows = new Map();

let backgroundWindow = null;
let tray = null;
let isBackgroundVisible = false;
let currentMode = 'running';
const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
}

function getCodexStateDatabasePath() {
  const codexHome = process.env.CODEX_HOME || path.join(app.getPath('home'), '.codex');
  return path.join(codexHome, 'state_5.sqlite');
}

function getCodexTaskStatus() {
  const sampledAt = Date.now();
  const databasePath = getCodexStateDatabasePath();

  if (!fs.existsSync(databasePath)) {
    return {
      available: false,
      taskCount: 0,
      sampledAt,
      activityWindowSeconds: CODEX_ACTIVITY_WINDOW_SECONDS
    };
  }

  let database = null;

  try {
    const { DatabaseSync } = require('node:sqlite');
    database = new DatabaseSync(databasePath, { readonly: true });

    const cutoff = Math.floor(sampledAt / 1000) - CODEX_ACTIVITY_WINDOW_SECONDS;
    const row = database
      .prepare(`
        SELECT COUNT(*) AS taskCount
        FROM threads
        WHERE archived = 0
          AND updated_at >= ?
      `)
      .get(cutoff);

    return {
      available: true,
      taskCount: Number(row?.taskCount ?? 0),
      sampledAt,
      activityWindowSeconds: CODEX_ACTIVITY_WINDOW_SECONDS
    };
  } catch (error) {
    console.error('Failed to read Codex activity from .codex/state_5.sqlite', error);

    return {
      available: false,
      taskCount: 0,
      sampledAt,
      activityWindowSeconds: CODEX_ACTIVITY_WINDOW_SECONDS
    };
  } finally {
    database?.close();
  }
}

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

function getWindowDisplay(targetWindow) {
  if (!targetWindow || targetWindow.isDestroyed()) {
    return screen.getPrimaryDisplay();
  }

  const [windowX, windowY] = targetWindow.getPosition();
  const [windowWidth, windowHeight] = targetWindow.getSize();

  return screen.getDisplayNearestPoint({
    x: Math.round(windowX + windowWidth / 2),
    y: Math.round(windowY + windowHeight / 2)
  });
}

function getMascotWindows() {
  return MASCOT_WINDOW_CONFIGS
    .map((config) => mascotWindows.get(config.id))
    .filter((targetWindow) => targetWindow && !targetWindow.isDestroyed());
}

function getInitialMascotPosition(config, display = screen.getPrimaryDisplay()) {
  return {
    x: display.bounds.x + config.startOffsetX,
    y: display.bounds.y + display.bounds.height - config.windowHeight + EDGE_OVERHANG
  };
}

function applyMascotWindowBehavior(targetWindow) {
  if (!targetWindow || targetWindow.isDestroyed()) {
    return;
  }

  targetWindow.setAlwaysOnTop(true, ALWAYS_ON_TOP_LEVEL);
  targetWindow.setIgnoreMouseEvents(true, { forward: true });
  targetWindow.setFocusable(false);
}

function toFiniteInteger(value) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return null;
  }

  const roundedValue = Math.round(numericValue);

  if (!Number.isSafeInteger(roundedValue)) {
    return null;
  }

  if (roundedValue === 0) {
    return 0;
  }

  return Math.min(INT32_MAX, Math.max(INT32_MIN, roundedValue));
}

function clamp(value, min, max) {
  const lowerBound = Math.min(min, max);
  const upperBound = Math.max(min, max);
  return Math.min(Math.max(value, lowerBound), upperBound);
}

function getWindowPositionPayload(payload, y) {
  if (payload && typeof payload === 'object') {
    return {
      x: payload.x,
      y: payload.y
    };
  }

  return {
    x: payload,
    y
  };
}

function getVirtualDisplayBounds() {
  const displays = screen.getAllDisplays();

  if (displays.length === 0) {
    return screen.getPrimaryDisplay().bounds;
  }

  const left = Math.min(...displays.map((display) => display.bounds.x));
  const top = Math.min(...displays.map((display) => display.bounds.y));
  const right = Math.max(...displays.map((display) => display.bounds.x + display.bounds.width));
  const bottom = Math.max(...displays.map((display) => display.bounds.y + display.bounds.height));

  return {
    x: left,
    y: top,
    width: Math.max(1, right - left),
    height: Math.max(1, bottom - top)
  };
}

function getSafeMascotWindowPosition(targetWindow, x, y) {
  const [windowWidth, windowHeight] = targetWindow.getSize();
  const virtualBounds = getVirtualDisplayBounds();
  const minX = virtualBounds.x - EDGE_OVERHANG;
  const minY = virtualBounds.y - EDGE_OVERHANG;
  const maxX = virtualBounds.x + virtualBounds.width - windowWidth + EDGE_OVERHANG;
  const maxY = virtualBounds.y + virtualBounds.height - windowHeight + EDGE_OVERHANG;

  return {
    x: clamp(x, minX, maxX),
    y: clamp(y, minY, maxY)
  };
}

function revealMascotWindow(targetWindow) {
  if (!targetWindow || targetWindow.isDestroyed()) {
    return;
  }

  if (typeof targetWindow.showInactive === 'function') {
    targetWindow.showInactive();
  } else {
    targetWindow.show();
  }

  applyMascotWindowBehavior(targetWindow);
}

function createMascotWindow(config, { show = true } = {}) {
  const initialDisplay = screen.getPrimaryDisplay();
  const initialPosition = getInitialMascotPosition(config, initialDisplay);

  const targetWindow = new BrowserWindow({
    width: config.windowWidth,
    height: config.windowHeight,
    show: false,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    focusable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  targetWindow.loadFile('index.html', {
    query: {
      mascot: config.id
    }
  });

  targetWindow.setPosition(initialPosition.x, initialPosition.y);
  applyMascotWindowBehavior(targetWindow);

  if (show) {
    revealMascotWindow(targetWindow);
  }

  targetWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      targetWindow.hide();
    }
  });

  targetWindow.on('closed', () => {
    mascotWindows.delete(config.id);
  });

  mascotWindows.set(config.id, targetWindow);
  return targetWindow;
}

function ensureMascotWindows({ show = true } = {}) {
  return MASCOT_WINDOW_CONFIGS.map((config) => {
    let targetWindow = mascotWindows.get(config.id);

    if (!targetWindow || targetWindow.isDestroyed()) {
      targetWindow = createMascotWindow(config, { show });
    } else if (show) {
      revealMascotWindow(targetWindow);
    }

    return targetWindow;
  });
}

function showMascotWindows() {
  ensureMascotWindows({ show: true });
}

function sendToMascotWindows(channel, payload) {
  const windows = ensureMascotWindows({ show: false });

  windows.forEach((targetWindow) => {
    const dispatch = () => {
      if (targetWindow && !targetWindow.isDestroyed()) {
        targetWindow.webContents.send(channel, payload);
      }
    };

    if (targetWindow.webContents.isLoadingMainFrame()) {
      targetWindow.webContents.once('did-finish-load', dispatch);
      return;
    }

    dispatch();
  });
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
    showMascotWindows();
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
        showMascotWindows();
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
        showMascotWindows();
        sendToMascotWindows('set-mode', 'running');
      }
    },
    {
      label: 'Idle Mode',
      type: 'radio',
      checked: currentMode === 'idle',
      click: () => {
        currentMode = 'idle';
        showMascotWindows();
        sendToMascotWindows('set-mode', 'idle');
      }
    },
    {
      label: 'Random Mode',
      type: 'radio',
      checked: currentMode === 'random',
      click: () => {
        currentMode = 'random';
        showMascotWindows();
        sendToMascotWindows('set-mode', 'random');
      }
    },
    {
      label: 'Codex Mode',
      type: 'radio',
      checked: currentMode === 'codex',
      click: () => {
        currentMode = 'codex';
        showMascotWindows();
        sendToMascotWindows('set-mode', 'codex');
      }
    },
    { type: 'separator' },
    {
      label: 'Speed: Fast',
      click: () => {
        sendToMascotWindows('set-speed', 8);
      }
    },
    {
      label: 'Speed: Medium',
      click: () => {
        sendToMascotWindows('set-speed', 5);
      }
    },
    {
      label: 'Speed: Slow',
      click: () => {
        sendToMascotWindows('set-speed', 2);
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
  ensureMascotWindows({ show: !startHidden });

  app.on('activate', () => {
    if (getMascotWindows().length === 0) {
      ensureMascotWindows({ show: true });
      return;
    }

    showMascotWindows();
  });
});

app.on('window-all-closed', (event) => {
  event.preventDefault();
});

app.on('second-instance', (event, commandLine) => {
  event.preventDefault();

  if (commandLine.includes(STARTUP_FLAG)) {
    return;
  }

  if (!app.isReady()) {
    app.whenReady().then(() => {
      showMascotWindows();
    });
    return;
  }

  showMascotWindows();
});

ipcMain.on('set-window-position', (event, payload, y) => {
  let targetWindow = null;
  let positionPayload = null;

  try {
    targetWindow = BrowserWindow.fromWebContents(event.sender);

    if (!targetWindow || targetWindow.isDestroyed()) {
      return;
    }

    positionPayload = getWindowPositionPayload(payload, y);

    const nextX = toFiniteInteger(positionPayload.x);
    const nextY = toFiniteInteger(positionPayload.y);

    if (nextX === null || nextY === null) {
      console.warn('Ignored invalid mascot window position update', {
        mascotId: targetWindow.webContents.getURL(),
        payload: positionPayload
      });
      return;
    }

    const safePosition = getSafeMascotWindowPosition(targetWindow, nextX, nextY);
    targetWindow.setPosition(safePosition.x, safePosition.y);
    applyMascotWindowBehavior(targetWindow);
  } catch (error) {
    console.error('Failed to handle mascot window position update', {
      mascotId: targetWindow && !targetWindow.isDestroyed()
        ? targetWindow.webContents.getURL()
        : null,
      payload: positionPayload ?? getWindowPositionPayload(payload, y),
      error: error?.stack || error?.message || String(error)
    });
  }
});

ipcMain.handle('get-window-position', (event) => {
  const targetWindow = BrowserWindow.fromWebContents(event.sender);

  if (!targetWindow || targetWindow.isDestroyed()) {
    return { x: 0, y: 0 };
  }

  const [x, y] = targetWindow.getPosition();
  return { x, y };
});

ipcMain.handle('get-display-bounds', (event) => {
  const targetWindow = BrowserWindow.fromWebContents(event.sender);
  return getWindowDisplay(targetWindow).bounds;
});

ipcMain.handle('get-codex-task-status', () => {
  return getCodexTaskStatus();
});
