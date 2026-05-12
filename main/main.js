'use strict';

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

// ──────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────
const WIN_DEFAULT_WIDTH  = 1280;
const WIN_DEFAULT_HEIGHT = 800;
const WIN_MIN_WIDTH      = 400;
const WIN_MIN_HEIGHT     = 300;

const IMAGE_FILTERS = [
  {
    name: 'Images',
    extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif'],
  },
];

// ──────────────────────────────────────────────
// Window
// ──────────────────────────────────────────────
function createWindow() {
  const win = new BrowserWindow({
    width:     WIN_DEFAULT_WIDTH,
    height:    WIN_DEFAULT_HEIGHT,
    minWidth:  WIN_MIN_WIDTH,
    minHeight: WIN_MIN_HEIGHT,
    backgroundColor: '#1a1a1a',
    webPreferences: {
      nodeIntegration:  false,          // 🔒 renderer 不可直接用 Node API
      contextIsolation: true,           // 🔒 隔離 renderer 與 preload 的執行環境
      sandbox:          false,          // preload 需要存取 fs／path，暫不啟用 sandbox
      preload: path.join(__dirname, '../preload/preload.js'),
    },
  });

  win.loadFile(path.join(__dirname, '../renderer/index.html'));
}

// ──────────────────────────────────────────────
// App lifecycle
// ──────────────────────────────────────────────
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  app.quit();
});

// ──────────────────────────────────────────────
// IPC handlers
// ──────────────────────────────────────────────

// renderer 呼叫 window.api.openImageDialog() 時觸發
ipcMain.handle('open-image-dialog', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: IMAGE_FILTERS,
  });
  return canceled ? null : filePaths[0];
});
