'use strict';

// ══════════════════════════════════════════════
// Constants
// ══════════════════════════════════════════════
const SCALE_MAX        = 10;
const SCALE_MIN_FACTOR = 0.1;   // fit scale 的最小允許倍率
const SCALE_STEP       = 0.1;   // 滾輪每格縮放量
const INFO_HIDE_DELAY  = 1200;  // ms，info bar 自動消失延遲

// ══════════════════════════════════════════════
// State
// ══════════════════════════════════════════════
let images  = [];   // 同資料夾圖片路徑陣列
let index   = 0;    // 目前圖片索引
let mode    = 'fit'; // 'fit' | 'actual' | 'scroll'

let scale      = 1;
let translateX = 0;
let translateY = 0;

let isDragging  = false;
let dragStartX  = 0;
let dragStartY  = 0;
let dragOriginX = 0;
let dragOriginY = 0;

let infoTimer = null;

// ══════════════════════════════════════════════
// DOM References
// ══════════════════════════════════════════════
const viewport     = document.getElementById('viewport');
const imgEl        = document.getElementById('image');
const infoBar      = document.getElementById('info-bar');
const infoName     = document.getElementById('info-name');
const infoIndex    = document.getElementById('info-index');
const infoScale    = document.getElementById('info-scale');
const shortcutBtn  = document.getElementById('shortcut-btn');
const shortcutPop  = document.getElementById('shortcut-popup');

// ══════════════════════════════════════════════
// Entry Point
// ══════════════════════════════════════════════
(function init() {
  bindEvents();
})();

// ══════════════════════════════════════════════
// Event Binding
// ══════════════════════════════════════════════
function bindEvents() {
  // 快捷鍵彈窗
  shortcutBtn.addEventListener('click', () => {
    shortcutPop.hidden = !shortcutPop.hidden;
  });

  // 點擊其他地方關閉彈窗
  document.addEventListener('click', (e) => {
    if (!shortcutPop.hidden && !shortcutPop.contains(e.target) && e.target !== shortcutBtn) {
      shortcutPop.hidden = true;
    }
  });

  // Placeholder: 其他事件將在後續 commit 加入
}
