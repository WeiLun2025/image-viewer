// preload/preload.js

'use strict';

const { contextBridge, ipcRenderer } = require('electron');
const fs   = require('fs');
const path = require('path');

// ──────────────────────────────────────────────
// 支援的圖片副檔名
// ──────────────────────────────────────────────
const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|avif)$/i;

// ──────────────────────────────────────────────
// 暴露給 renderer 的安全 API（掛在 window.api）
// ──────────────────────────────────────────────
contextBridge.exposeInMainWorld('api', {
  /**
   * 讀取指定圖片所在資料夾，回傳同資料夾內所有圖片的絕對路徑陣列（自然排序）。
   * @param {string} imagePath - 任一張圖片的絕對路徑
   * @returns {string[]}
   */
  getFolderImages(imagePath) {
    const dir = path.dirname(imagePath);
    let files;
    try {
      files = fs.readdirSync(dir);
    } catch {
      return [];
    }
    return files
      .filter(f => IMAGE_EXT_RE.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
      .map(f => path.join(dir, f));
  },

  /**
   * 開啟系統檔案選擇對話框，回傳使用者選擇的圖片路徑，取消則回傳 null。
   * @returns {Promise<string|null>}
   */
  openImageDialog() {
    return ipcRenderer.invoke('open-image-dialog');
  },

  /**
   * 取得路徑的檔案名稱部分（含副檔名）。
   * @param {string} filePath
   * @returns {string}
   */
  basename(filePath) {
    return path.basename(filePath);
  },

  /**
   * 將檔案路徑轉換為可在 <img src> 使用的 file:// URL。
   * @param {string} filePath
   * @returns {string}
   */
  toFileUrl(filePath) {
    // Windows 路徑需將反斜線轉為正斜線
    return 'file:///' + filePath.replace(/\\/g, '/');
  },
});
