// renderer/viewer.js

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

  // ── 雙擊切換 Fit ↔ Actual Size ──
  imgEl.addEventListener('dblclick', () => {
    if (!imgEl.src) return;
    mode = (mode === 'fit') ? 'actual' : 'fit';
    viewport.classList.remove('scroll-mode');
    translateX = 0;
    translateY = 0;
    applyDisplayMode();
    showInfoBar();
  });

  // ── 滾輪：縮放 / 長條漫畫模式捲動 ──
  viewport.addEventListener('wheel', onWheel, { passive: false });

  // ── 拖曳平移 ──
  viewport.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  // ── 滑鼠側鍵切換圖片 ──
  viewport.addEventListener('mousedown', (e) => {
    if (e.button === 3) { e.preventDefault(); navigatePrev(); }
    if (e.button === 4) { e.preventDefault(); navigateNext(); }
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
    case 'S':
      if (!imgEl.src) break;
      if (mode === 'scroll') {
        mode = 'fit';
        viewport.classList.remove('scroll-mode');
        translateX = 0;
        translateY = 0;
      } else {
        mode = 'scroll';
      }
      applyDisplayMode();
      if (mode === 'scroll') {
        showInfoBar('滾輪：捲動　Ctrl + 滾輪：縮放');
      } else {
        showInfoBar();
      }
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

// ══════════════════════════════════════════════
// Wheel
// ══════════════════════════════════════════════

function onWheel(e) {
  e.preventDefault();

  if (mode === 'scroll') {
    if (e.ctrlKey) {
      // Ctrl + 滾輪：縮放
      zoomAtPoint(e);
    } else {
      // 純滾輪：垂直捲動
      viewport.scrollTop += e.deltaY;
    }
    return;
  }

  // 一般模式：縮放
  zoomAtPoint(e);
}

/**
 * 以滑鼠游標位置為基準縮放。
 * @param {WheelEvent} e
 */
function zoomAtPoint(e) {
  const { imgW, imgH } = getDimensions();
  const delta     = e.deltaY < 0 ? 1 : -1;
  const fitScale  = Math.min(viewport.clientWidth / imgW, viewport.clientHeight / imgH);
  const scaleMin  = fitScale * SCALE_MIN_FACTOR;
  const newScale  = Math.min(SCALE_MAX, Math.max(scaleMin, scale + delta * SCALE_STEP));

  if (newScale === scale) return;

  // 游標相對於圖片中心的偏移
  const rect    = imgEl.getBoundingClientRect();
  const cx      = e.clientX - (rect.left + rect.width  / 2);
  const cy      = e.clientY - (rect.top  + rect.height / 2);

  // 縮放後維持游標對應點不動
  const ratio    = newScale / scale;
  translateX     = cx - ratio * (cx - translateX);
  translateY     = cy - ratio * (cy - translateY);
  scale          = newScale;

  applyTransform();
  showInfoBar();
}

// ══════════════════════════════════════════════
// Drag to Pan
// ══════════════════════════════════════════════

function onMouseDown(e) {
  if (e.button !== 0) return;       // 只處理左鍵
  if (mode === 'scroll') return;    // 長條漫畫模式不拖曳
  if (!imgEl.src) return;

  isDragging  = true;
  dragStartX  = e.clientX;
  dragStartY  = e.clientY;
  dragOriginX = translateX;
  dragOriginY = translateY;
  imgEl.classList.add('dragging');
}

function onMouseMove(e) {
  if (!isDragging) return;

  translateX = dragOriginX + (e.clientX - dragStartX);
  translateY = dragOriginY + (e.clientY - dragStartY);
  clampTranslate();
  applyTransform();
}

function onMouseUp() {
  if (!isDragging) return;
  isDragging = false;
  imgEl.classList.remove('dragging');
}

/**
 * 邊界限制：圖片邊緣不能進入視窗範圍內。
 * 圖片比視窗小時，固定在中心（translate 歸零）。
 */
function clampTranslate() {
  const { viewW, viewH, imgW, imgH } = getDimensions();
  const displayW = imgW * scale;
  const displayH = imgH * scale;

  // 水平
  if (displayW <= viewW) {
    translateX = 0;
  } else {
    const maxX = (displayW - viewW) / 2;
    translateX = Math.max(-maxX, Math.min(maxX, translateX));
  }

  // 垂直
  if (displayH <= viewH) {
    translateY = 0;
  } else {
    const maxY = (displayH - viewH) / 2;
    translateY = Math.max(-maxY, Math.min(maxY, translateY));
  }
}