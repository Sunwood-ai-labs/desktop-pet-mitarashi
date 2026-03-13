const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const sharp = require('sharp');

let mainWindow;
let backgroundWindow = null;
let tray = null;
let isBackgroundVisible = false;
let currentMode = 'running';

function createWindow() {
  const workArea = screen.getPrimaryDisplay().workArea;
  // workArea: {x, y, width, height} - タスクバーを除いた作業領域
  // 作業領域の下端 = workArea.y + workArea.height

  mainWindow = new BrowserWindow({
    width: 130,
    height: 110,
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
  // タスクバーのすぐ上に配置（作業領域の下端からウィンドウ高さを引く）
  mainWindow.setPosition(workArea.x + 10, workArea.y + workArea.height - 110);

  // ウィンドウを閉じる際、トレイに最小化（終了しない）
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createBackgroundWindow() {
  const workArea = screen.getPrimaryDisplay().workArea;
  // 画像アスペクト比: 1360x436 → 約3.12:1
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
  // タスクバーのすぐ上に配置
  backgroundWindow.setPosition(workArea.x, workArea.y + workArea.height - windowHeight);

  // クリックを透過
  backgroundWindow.setIgnoreMouseEvents(true);

  // 初期状態は非表示
  backgroundWindow.hide();

  backgroundWindow.on('closed', () => {
    backgroundWindow = null;
  });
}

async function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'fav.svg');

  // SVGをPNGに変換してトレイアイコンに設定
  const iconBuffer = await sharp(iconPath)
    .resize(16, 16, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  const trayIcon = nativeImage.createFromBuffer(iconBuffer);
  tray = new Tray(trayIcon);
  tray.setToolTip('みたらし - Desktop Pet');

  // 初期メニューを設定
  updateTrayMenu();

  // ダブルクリックでウィンドウ表示
  tray.on('double-click', () => {
    mainWindow.show();
    mainWindow.focus();
  });
}

app.whenReady().then(async () => {
  await createTray();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// トレイ常駐アプリのため、ウィンドウが閉じても終了しない
app.on('window-all-closed', (event) => {
  event.preventDefault();
});

// ドラッグ移動用
ipcMain.on('window-drag', (event, { deltaX, deltaY }) => {
  const [currentX, currentY] = mainWindow.getPosition();
  mainWindow.setPosition(currentX + deltaX, currentY + deltaY);
});

// ウィンドウ位置設定用
ipcMain.on('set-window-position', (event, { x, y }) => {
  mainWindow.setPosition(Math.round(x), Math.round(y));
});

// ウィンドウ位置取得用
ipcMain.handle('get-window-position', () => {
  const [x, y] = mainWindow.getPosition();
  return { x, y };
});

// 作業領域取得用（タスクバーを除いた領域）
ipcMain.handle('get-work-area', () => {
  const workArea = screen.getPrimaryDisplay().workArea;
  return workArea;  // {x, y, width, height}
});

// 最前面設定
ipcMain.on('set-always-on-top', (event, value) => {
  mainWindow.setAlwaysOnTop(value, 'floating');
});

// 背景ウィンドウの表示/非表示
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

  // メニューを更新
  updateTrayMenu();
}

// トレイメニューを更新
function updateTrayMenu() {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: '表示',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    { type: 'separator' },
    {
      label: '走行モード',
      type: 'radio',
      checked: currentMode === 'running',
      click: () => {
        currentMode = 'running';
        mainWindow.webContents.send('set-mode', 'running');
        mainWindow.show();
      }
    },
    {
      label: '待機モード',
      type: 'radio',
      checked: currentMode === 'idle',
      click: () => {
        currentMode = 'idle';
        mainWindow.webContents.send('set-mode', 'idle');
        mainWindow.show();
      }
    },
    {
      label: 'ランダムモード',
      type: 'radio',
      checked: currentMode === 'random',
      click: () => {
        currentMode = 'random';
        mainWindow.webContents.send('set-mode', 'random');
        mainWindow.show();
      }
    },
    { type: 'separator' },
    {
      label: '速度: 速い',
      click: () => {
        mainWindow.webContents.send('set-speed', 8);
      }
    },
    {
      label: '速度: 普通',
      click: () => {
        mainWindow.webContents.send('set-speed', 5);
      }
    },
    {
      label: '速度: 遅い',
      click: () => {
        mainWindow.webContents.send('set-speed', 2);
      }
    },
    { type: 'separator' },
    {
      label: '背景表示',
      type: 'checkbox',
      checked: isBackgroundVisible,
      click: () => {
        toggleBackground();
      }
    },
    { type: 'separator' },
    {
      label: '終了',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}
