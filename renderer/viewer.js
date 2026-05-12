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
// Image Loading
// ══════════════════════════════════════════════

/**
 * 載入指定路徑的圖片，並以當前 mode 顯示。
 * 職責：設定 img.src、等待載入完成、記錄原始尺寸。
 * @param {string} filePath
 */
function loadImage(filePath) {
  imgEl.src = window.api.toFileUrl(filePath);

  imgEl.onload = () => {
    applyDisplayMode();
    showInfoBar();
  };

  imgEl.onerror = () => {
    console.error('Failed to load image:', filePath);
  };
}

// ══════════════════════════════════════════════
// Display Mode
// ══════════════════════════════════════════════

/**
 * 根據目前的 mode 計算 scale / translate，並套用。
 * 職責：決定「怎麼顯示」，不管「顯示哪張」。
 */
function applyDisplayMode() {
  if (mode === 'fit') {
    setFitMode();
  } else if (mode === 'actual') {
    setActualMode();
  } else if (mode === 'scroll') {
    setScrollMode();
  }
  applyTransform();
}

/** Fit Window：縮放至剛好填滿視窗，圖片置中 */
function setFitMode() {
  const { viewW, viewH, imgW, imgH } = getDimensions();
  scale      = Math.min(viewW / imgW, viewH / imgH);
  translateX = 0;
  translateY = 0;
}

/** Actual Size：100% 原始像素，圖片置中 */
function setActualMode() {
  scale      = 1;
  translateX = 0;
  translateY = 0;
}

/** 長條漫畫模式：寬度填滿視窗，頂部對齊，垂直捲動 */
function setScrollMode() {
  const { viewW, imgW } = getDimensions();
  scale      = viewW / imgW;
  translateX = 0;
  translateY = 0;
  viewport.classList.add('scroll-mode');
}

// ══════════════════════════════════════════════
// Transform
// ══════════════════════════════════════════════

/**
 * 將 scale / translateX / translateY 套用到 img 元素。
 * 所有視覺更新都必須經過這個函式，禁止在其他地方直接操作 style.transform。
 */
function applyTransform() {
  if (mode === 'scroll') {
    // scroll mode：寬度撐滿視窗，垂直靠 CSS overflow 捲動
    imgEl.style.transformOrigin = 'top center';
    imgEl.style.transform       = `scale(${scale})`;
    imgEl.style.width           = `${imgEl.naturalWidth}px`;
    imgEl.style.height          = 'auto';
    imgEl.style.margin          = '0';
  } else {
    // fit / actual：置中交給 viewport flexbox，
    // transform 只負責縮放 + 使用者拖曳的平移
    imgEl.style.transformOrigin = 'center center';
    imgEl.style.transform       = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    imgEl.style.width           = `${imgEl.naturalWidth}px`;
    imgEl.style.height          = `${imgEl.naturalHeight}px`;
    imgEl.style.margin          = '';
  }

  updateInfoScale();
}

// ══════════════════════════════════════════════
// Info Bar
// ══════════════════════════════════════════════

/** 顯示 info bar，並在 INFO_HIDE_DELAY ms 後自動隱藏 */
function showInfoBar(message) {
  // 更新內容
  if (images.length > 0) {
    infoName.textContent  = window.api.basename(images[index]);
    infoIndex.textContent = `${index + 1} / ${images.length}`;
  }
  // 若有額外提示訊息（如長條漫畫模式說明），顯示在 name 欄位
  if (message) {
    infoName.textContent = message;
  }

  infoBar.classList.remove('hidden');

  clearTimeout(infoTimer);
  infoTimer = setTimeout(() => {
    infoBar.classList.add('hidden');
  }, INFO_HIDE_DELAY);
}

/** 更新縮放比例顯示 */
function updateInfoScale() {
  infoScale.textContent = `${Math.round(scale * 100)}%`;
}

// ══════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════

/**
 * 取得視窗與圖片的原始尺寸（未縮放）。
 * @returns {{ viewW, viewH, imgW, imgH }}
 */
function getDimensions() {
  return {
    viewW: viewport.clientWidth,
    viewH: viewport.clientHeight,
    imgW:  imgEl.naturalWidth  || imgEl.clientWidth,
    imgH:  imgEl.naturalHeight || imgEl.clientHeight,
  };
}

// ══════════════════════════════════════════════
// Event Binding
// ══════════════════════════════════════════════
function bindEvents() {
  // ── 快捷鍵彈窗 ──
  shortcutBtn.addEventListener('click', () => {
    shortcutPop.hidden = !shortcutPop.hidden;
  });

  document.addEventListener('click', (e) => {
    if (!shortcutPop.hidden && !shortcutPop.contains(e.target) && e.target !== shortcutBtn) {
      shortcutPop.hidden = true;
    }
  });

  // ── 鍵盤 ──
  document.addEventListener('keydown', onKeyDown);

  // ── 視窗縮放時重新計算 fit ──
  window.addEventListener('resize', () => {
    if (imgEl.src) applyDisplayMode();
  });
}

function onKeyDown(e) {
  // 忽略輸入框焦點（目前沒有，但保留防禦）
  if (e.target.tagName === 'INPUT') return;

  switch (e.key.toUpperCase()) {
    case 'O':
      openFile();
      break;
    case 'W':
      if (!imgEl.src) break;
      mode = 'fit';
      viewport.classList.remove('scroll-mode');
      applyDisplayMode();
      showInfoBar();
      break;
    case 'A':
      if (!imgEl.src) break;
      mode = 'actual';
      viewport.classList.remove('scroll-mode');
      applyDisplayMode();
      showInfoBar();
      break;
    case 'ARROWLEFT':
      navigatePrev();
      break;
    case 'ARROWRIGHT':
      navigateNext();
      break;
    case 'HOME':
      navigateFirst();
      break;
    case 'END':
      navigateLast();
      break;
  }
}

// ══════════════════════════════════════════════
// File Open
// ══════════════════════════════════════════════

async function openFile() {
  const filePath = await window.api.openImageDialog();
  if (!filePath) return;

  images = window.api.getFolderImages(filePath);
  index  = images.indexOf(filePath);
  if (index === -1) { images = [filePath]; index = 0; }

  mode = 'fit';
  viewport.classList.remove('scroll-mode');
  loadImage(images[index]);
}

// ══════════════════════════════════════════════
// Navigation
// ══════════════════════════════════════════════

/** 跳到指定索引的圖片（自動邊界保護） */
function navigateTo(newIndex) {
  if (images.length === 0) return;
  index = Math.max(0, Math.min(newIndex, images.length - 1));
  loadImage(images[index]);
}

function navigatePrev() { navigateTo(index - 1); }
function navigateNext() { navigateTo(index + 1); }
function navigateFirst() { navigateTo(0); }
function navigateLast()  { navigateTo(images.length - 1); }
