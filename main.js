const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const sharp = require('sharp');

let mainWindow;
let tray = null;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

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
  mainWindow.setPosition(10, height - 120);

  // ウィンドウを閉じる際、トレイに最小化（終了しない）
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
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

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '表示',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    {
      label: '走行モード',
      click: () => {
        mainWindow.webContents.send('set-mode', 'running');
        mainWindow.show();
      }
    },
    {
      label: '待機モード',
      click: () => {
        mainWindow.webContents.send('set-mode', 'idle');
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
      label: '終了',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

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

// 画面サイズ取得用
ipcMain.handle('get-screen-size', () => {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  return { width, height };
});
