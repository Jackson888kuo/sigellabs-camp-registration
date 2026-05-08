# Apps Script：活動設定表公開讀取端點

## 用途

讓自建報名表單（GitHub Pages）能在家長打開頁面時，從活動設定表自動讀取當期營隊清單，動態渲染勾選項目。

## 部署步驟（Jackson 執行）

| # | 動作 |
|---|---|
| 1 | 開活動設定表 Sheets |
| 2 | 上方選單：**擴充功能 → Apps Script** |
| 3 | 刪除預設的空 `myFunction()` |
| 4 | 貼入 `sheets-public-read.gs` 全文 |
| 5 | 儲存（Ctrl+S）|
| 6 | 右上角 **部署 → 新增部署作業** |
| 7 | 類型選「**網頁應用程式**」|
| 8 | 執行身分：**我（Jackson）**；存取權限：**任何人** |
| 9 | 點「**部署**」→ Google 可能要求授權，點「授予存取權」|
| 10 | 若出現「未驗證的應用程式」警告 → 點「**進階 → 仍要前往**」→ 允許 |
| 11 | 複製顯示的 **Web App URL**（格式：`https://script.google.com/macros/s/<ID>/exec`）|
| 12 | 開啟 `docs/forms/form.js` → 把第 5 行的 `TODO_FILL_IN_PHASE_3` 換成此 URL |

## 冒煙測試（部署後 1 分鐘內執行）

用瀏覽器或 curl 開啟 Web App URL：

```bash
curl "https://script.google.com/macros/s/<YOUR_ID>/exec"
```

預期回傳：

```json
{
  "success": true,
  "data": [
    { "camp_name": "STEAM Attack...", "batch": "第一梯", "early_bird_end": "2026-05-31" },
    ...
  ],
  "count": 6,
  "timestamp": "2026-05-XX..."
}
```

若 `success: false` 或 HTTP 403 → 檢查存取權限是否設為「任何人」。

## 過濾規則

- 早鳥截止日距今**超過 30 天**的梯次不顯示
- 早鳥截止日為空或格式異常的梯次**永遠顯示**（Issue #3 fail-safe）
- 空白列（營隊名稱為空）自動跳過

## 安全考量

回傳欄位僅限 `camp_name`、`batch`、`early_bird_end`，不回傳單價、付款連結等敏感欄位（D-K 欄）。金額由 Make backend 在送出後查詢。

## 日後更新腳本

腳本更新後須重新部署（**管理部署作業 → 編輯 → 版本選「新版本」→ 部署**），URL 不變。
