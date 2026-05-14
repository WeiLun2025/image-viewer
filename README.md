# Image Viewer

以 Electron 打造的個人圖片瀏覽器，專為解決 Windows 內建檢視器的兩個痛點而生：

1. **WebP 動態圖片**：Windows 內建檢視器只顯示第一幀，無法播放動態 WebP
2. **長條漫畫閱讀**：內建檢視器會將整張圖縮到塞進視窗，導致圖片過小無法閱讀

---

## 功能

- WebP 動態圖片播放（Chromium 原生支援）
- 自動讀取同資料夾圖片，支援自然排序切換
- 三種顯示模式：Fit Window、Actual Size、長條漫畫模式
- 滾輪縮放（以游標位置為基準）
- 拖曳平移（含邊界限制）
- 長條漫畫模式：切換圖片時自動對齊頂部或底部
- 滑鼠側鍵切換圖片
- 快捷鍵說明彈窗

---

## 技術棧

| 項目 | 內容 |
|------|------|
| 框架 | Electron |
| 語言 | HTML / CSS / JavaScript（CommonJS） |
| 打包 | electron-builder（輸出 Windows NSIS 安裝檔） |

---

## 安全架構

採用 Electron 建議的安全設定：

- `nodeIntegration: false`、`contextIsolation: true`
- 透過 `preload.js` 的 `contextBridge` 僅暴露必要的 API 給 renderer
- CSP header 限制資源只能從本地載入

---

## 安裝與執行

```bash
# 安裝依賴
npm install

# 開發模式
npm start

# 打包（輸出 Windows 安裝檔，建議以系統管理員身份執行）
npm run dist
```

---

## 支援格式

`PNG` `JPG / JPEG` `GIF` `WebP`（含動態） `AVIF`

---

## 快捷鍵

| 按鍵 | 功能 |
|------|------|
| `O` | 開啟圖片 |
| `W` | Fit Window（填滿視窗） |
| `A` | Actual Size（100%） |
| `S` | 切換長條漫畫模式 |
| `← / →` | 上一張 / 下一張 |
| `Home / End` | 第一張 / 最後一張 |
| 滾輪 | 縮放（一般模式）／ 捲動（長條漫畫模式） |
| `Ctrl` + 滾輪 | 縮放（長條漫畫模式） |
| 雙擊 | Fit Window ↔ Actual Size |
| 側鍵 | 上一張 / 下一張 |

---

## 專案結構

```
image-viewer/
├── build/
│   └── icon.ico
├── main/
│   └── main.js        # 主程序、視窗建立、IPC 處理
├── preload/
│   └── preload.js     # contextBridge，安全暴露 API 給 renderer
├── renderer/
│   ├── index.html
│   ├── viewer.css
│   └── viewer.js      # 所有互動邏輯
└── package.json
```