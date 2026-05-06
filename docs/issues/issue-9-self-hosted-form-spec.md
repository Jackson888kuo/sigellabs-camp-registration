# Issue #9 實作 Spec：自建報名表單取代 Tally（Single Source of Truth）

| 項目 | 內容 |
|---|---|
| Issue | [#9](https://github.com/Jackson888kuo/sigellabs-camp-registration/issues/9)（待建立）|
| 優先級 | 🔴 P1 / enhancement（架構級重構）|
| Sprint | **Self-Hosted Form Sprint（W20-W22）** |
| 期間 | 2026-05-16 ~ 2026-06-01（17 天，含 5/16-5/31 與整合測試並行）|
| Scenario | `4596472` (太陽實驗室 – 團報自動化 v5.1) |
| Team ID | `2085532` |
| 前置依賴 | Sprint Winter Camp Prep ✅、Staging 環境 ✅、整合測試完成 ✅ |
| 預估工作量 | 4-5.5 天 |
| 採用策略 | **Apps Script Web App** + **UI 對齊 Tally** + **直接換**（無 A/B 並行）|
| 開發工具 | Claude Code（HTML/CSS/JS）+ Apps Script + Make API |
| 撰寫日期 | 2026-05-06（Cowork） |

---

## 1. 問題背景

### 1.1 Tally 紅線是根本問題

| 紅線 | 一動就壞的原因 |
|---|---|
| 題目「孩子要報名哪些營隊？」一字不能改 | Make Module 13、M27、M11 用 `replace(replace(5.label; "孩子要報名哪些營隊？ ("; ""); ")"; "")` 解析營隊名 |
| Checkboxes 結構不能換 | Make Module 5 Iterator 依賴 `1.data.fields[].options[]` 結構 |
| 6 個 Label 名稱不能改 | Make 多處用 `get(map(1.data.fields; "value"; "label"; "<label>"); 1)` 找欄位 |

業務同事改錯任一條 → Make 找不到 Sheets 對應行 → 輕則 silent failure、重則整個 bundle 崩潰。

### 1.2 Claude Code 提出的根本解：自建表單 + Sheets 為唯一資料源

| 現況 | 提案後 |
|---|---|
| Sheets ←→ Tally（人工同步、紅線多）→ Make → 下游 | Sheets → 自建表單（自動讀）→ Make → 下游 |
| 業務同事每次新增營隊：改 Sheets + 改 Tally + 跑測試 + 通知 Jackson | 業務同事每次新增營隊：**只改 Sheets**（表單下次有人開時自動讀新選項）|

### 1.3 為何現在做（5/16 起）

| 原因 | 說明 |
|---|---|
| **v5.1 仍未上線**（孤立開發系統）| 沒有真實家長使用 Tally → 無歷史包袱、可直接換 |
| **真實夏令營仍手動處理** | 不影響業務 |
| **冬令營 12 月才首次正式啟用** | 第一次正式對外時就是新表單 |
| **5/16-5/31 業務測試期 Claude Code 無事可做** | 雙線並行不衝突 |
| **6 月起冷凍期可繼續優化** | 有充足緩衝 |

---

## 2. 架構決策（5/6 Cowork 確認）

### 2.1 4 個關鍵決策

| 決策 | 選擇 | 理由 |
|---|---|---|
| **Sheets 讀取方式** | Apps Script Web App | 免 OAuth、繞 CORS、Sheets 仍私有；依 Issue #5 既有經驗 |
| **UI 標準** | 對齊 Tally 視覺品質 | 跳過 MVP 階段、避免後續重工；冬令營啟用前完整版 |
| **移轉方式** | 直接換（無 A/B 並行）| v5.1 為孤立系統、無歷史 Tally 連結需相容 |
| **負責人** | Claude Code 寫前端、Jackson 提供 Sheets 結構與業務需求 | 沿用既有工作流慣例 |

### 2.2 系統架構圖

```
┌─────────────────────────────────────────────────┐
│  業務同事在活動設定表 Sheets 改營隊              │
│  （只動 A-K 欄、不再碰任何外部表單服務）          │
└─────────────────┬───────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────┐
│  Apps Script Web App                             │
│  GET /exec → 回 JSON（過濾過期梯次）              │
└─────────────────┬───────────────────────────────┘
                  ↓ (家長打開報名表單時)
┌─────────────────────────────────────────────────┐
│  自建報名表單 (GitHub Pages)                      │
│  https://jackson888kuo.github.io/sigellabs-      │
│  camp-registration/forms/                        │
│  - 從 Apps Script 讀取最新營隊清單                │
│  - 動態渲染 CHECKBOXES                            │
│  - 對齊 Tally UI 品質（含行動裝置）                │
└─────────────────┬───────────────────────────────┘
                  ↓ (家長 submit)
┌─────────────────────────────────────────────────┐
│  POST 到 Make webhook                            │
│  Payload 模擬 Tally JSON 格式                    │
│  → Make scenario 4596472 完全不動               │
└─────────────────┬───────────────────────────────┘
                  ↓
        現有 Make → HubSpot / Sheets / Email
```

### 2.3 Make scenario 改動清單

| 模組 | 改動 |
|---|---|
| Module 1 (Webhook) | **不改**（仍用同一 webhook URL，自建表單 POST 過去）|
| Module 2-28 | **完全不改**（IML 邏輯保留）|

→ 風險集中在「Payload 相容性」單一點。

---

## 3. Phase 0：Payload 相容性驗證（0.5 天，5/16 必做）

### 3.1 為什麼是最關鍵的一步

整個專案的成敗取決於：自建表單送出的 JSON **必須讓 Make 現有 IML 完全讀得懂**。若這一關不過，後續所有 UI 工作白做。

### 3.2 驗證流程

| 步驟 | 動作 | 工具 |
|---|---|---|
| 3.2.1 | 從 Make staging scenario 4596472-staging 執行歷史抓 1 筆完整 Tally webhook payload | Make UI → Executions → 點某筆 → Module 1 OUTPUT → Copy JSON |
| 3.2.2 | 解析 Tally payload 結構 | 文字編輯器 |
| 3.2.3 | 寫一個 Python script 構造 mock JSON（模擬自建表單會送的格式）| Python |
| 3.2.4 | 用 curl 把 mock JSON POST 到 staging webhook URL | curl |
| 3.2.5 | 觀察 Make staging scenario 是否能完整跑完 21 ops（雙營隊情境）| Make UI |
| 3.2.6 | 比對 5 渠道輸出（M8/M10/M11/M13/M27）| 5 渠道驗收 |

### 3.3 Tally Payload 結構（從現有真實 webhook 抓）

```json
{
  "eventId": "...",
  "eventType": "FORM_RESPONSE",
  "createdAt": "2026-05-12T14:23:45.123Z",
  "data": {
    "responseId": "...",
    "submissionId": "...",
    "respondentId": "...",
    "formId": "...",
    "formName": "...",
    "createdAt": "2026-05-12T14:23:45.123Z",
    "fields": [
      {
        "key": "question_<random>",
        "label": "家長姓名",
        "type": "INPUT_TEXT",
        "value": "王小明"
      },
      {
        "key": "question_<random>",
        "label": "Email",
        "type": "INPUT_EMAIL",
        "value": "test@example.com"
      },
      {
        "key": "question_<random>",
        "label": "電話",
        "type": "INPUT_PHONE_NUMBER",
        "value": "0912345678"
      },
      {
        "key": "question_<random>",
        "label": "孩子姓名",
        "type": "INPUT_TEXT",
        "value": "王小寶"
      },
      {
        "key": "question_<random>",
        "label": "孩子要報名哪些營隊？ (STEAM Attack 用電不要怕)",
        "type": "CHECKBOXES",
        "value": [...]
      },
      ... (其他 5 個 CHECKBOXES，每營隊一題)
      {
        "key": "question_<random>",
        "label": "團報人數",
        "type": "MULTIPLE_CHOICE",
        "value": ["3"],
        "options": [
          {"id": "3", "text": "3 人團報"},
          {"id": "8", "text": "8 人團報"}
        ]
      }
    ]
  }
}
```

### 3.4 自建表單 mock payload 必須對齊的 invariant

| 項目 | 必須 | 為何 |
|---|---|---|
| 頂層 `data.fields[]` 結構 | 維持 | Make Module 5 Iterator 依此 |
| `fields[i].label` 文字 | 含「孩子要報名哪些營隊？ (XXX)」前後綴 | Make Module 8 用 `replace()` 剝前後綴 |
| `fields[i].type` | `CHECKBOXES` | Make 用 `if(5.value)` 判斷真值 |
| `fields[i].value` | 勾選時為非空陣列、未勾選為 null | Make Iterator filter 依此 |
| `fields[i].key` | 任意字串（Make 不依此）| 可隨意 |
| 「團報人數」`fields[i].value` | 陣列，含 1 個字串元素 `"3"` 或 `"8"` | Make Module 10 用 `get(get(...; 1); 1)` |
| 「家長姓名/Email/電話/孩子姓名」`value` | 字串 | Make 用 `get(map(...); 1)` |
| `eventType: "FORM_RESPONSE"` | 維持 | 待確認 Make 是否依此 |

### 3.5 Phase 0 通過條件

| 條件 | 通過 |
|---|---|
| Mock JSON POST 到 staging webhook 後，Module 1 顯示 OUTPUT | ✅ |
| Module 5 Iterator 正確展開為 N 個營隊 | ✅ |
| Module 8 filterRows 找到對應 Sheets 列 | ✅ |
| Module 11 dealname 正確（含營隊名）| ✅ |
| Module 13 Sheets 寫入正確 | ✅ |
| Module 27 + Module 4 寄出 email 含正確金額 + 連結 | ✅ |
| 5 渠道全綠才能進 Phase 1 | ✅ |

> 🚨 若 Phase 0 失敗 → 回頭對 Tally payload 細部結構（如 hidden fields、metadata），重做 mock；連續 3 次失敗 → 重新評估是否走 Google Forms 替代路線。

---

## 4. Phase 1-2：自建表單技術設計（2-3 天）

### 4.1 檔案結構

```
docs/forms/
├── index.html          # 報名表單主頁面
├── style.css           # 樣式（對齊 Tally 視覺）
├── form.js             # 主邏輯（讀 Apps Script、渲染、submit）
├── README.md           # 使用說明
└── _config.yml         # Jekyll 不處理本資料夾（避免 Markdown 渲染干擾）
```

### 4.2 form.js 核心邏輯

| 功能 | 實作 |
|---|---|
| 1. 載入時呼叫 Apps Script | `fetch(APPS_SCRIPT_URL).then(...)` |
| 2. 從 JSON 渲染營隊 CHECKBOXES | 對每個營隊 `<input type="checkbox" name="camp_<id>">` |
| 3. 表單驗證 | 至少勾 1 營隊、Email 格式、電話格式、所有必填 |
| 4. submit 時構造 Tally 相容 JSON | 依 §3.4 invariant |
| 5. POST 到 Make webhook | `fetch(WEBHOOK_URL, { method: 'POST', body: JSON })` |
| 6. 提交成功顯示確認頁 | 「已收到報名、5 分鐘內 email 寄達付款連結」|
| 7. 提交失敗 fallback | 「系統暫時忙碌、請稍後再試或聯繫 hello@sigellabs.com」 |

### 4.3 UI 對齊 Tally（核心要點）

| 元素 | Tally 風格參考 |
|---|---|
| 字型 | Inter / Noto Sans TC |
| 主色 | 太陽橘 `#FF6A00`（沿用付款卡片色系）|
| 表單寬度 | 桌機 640px / 平板 100% / 手機 100% |
| Input padding | 12px、border-radius 8px |
| Checkboxes | 大方框 24x24px、勾選時填入主色 |
| 按鈕 | 大圓角 8px、陰影、hover 動畫 |
| 步驟感 | 一頁式（沿用 Tally 簡潔風格、不分頁）|
| 行動裝置 | 全寬、字體 16px+ 避免 iOS 自動縮放 |
| 無障礙 | 所有 input 含 label、tabindex 順序合理、ARIA 標籤 |

### 4.4 表單欄位（與 Tally 一對一對應）

| 順序 | 欄位 | 類型 | 必填 |
|---|---|---|---|
| 1 | 家長姓名 | text | ✅ |
| 2 | Email | email | ✅ |
| 3 | 電話 | tel | ✅ |
| 4 | 孩子姓名 | text | ✅ |
| 5 | 孩子要報名哪些營隊？ | checkboxes（動態從 Sheets 讀）| ✅（至少 1 個）|
| 6 | 團報人數 | radio（3 / 8）| ✅ |

---

## 5. Phase 3：Apps Script Web App 完整範本

### 5.1 部署步驟

| # | 動作 |
|---|---|
| 1 | 開活動設定表 Sheets → 擴充功能 → Apps Script |
| 2 | 在 `Code.gs` 貼入 §5.2 範本 |
| 3 | 部署 → 新增部署作業 → 類型：網頁應用程式 |
| 4 | 執行身分：我（Jackson）；存取權限：**任何人** |
| 5 | 點部署 → 取得 Web App URL（形式 `https://script.google.com/macros/s/<ID>/exec`）|
| 6 | 把 URL 寫入 `form.js` 的 `APPS_SCRIPT_URL` 常數 |

### 5.2 Apps Script 完整範本

```javascript
/**
 * docs/apps-script/sheets-public-read.gs
 *
 * 提供自建報名表單讀取活動設定表的公開端點。
 * 部署為 Web App，存取權限：任何人。
 *
 * GET /exec → JSON 含當期營隊清單（過濾過期梯次）
 */

const SHEETS_ID = '1dZUNmS28HAuXLBPJchaB84xLlRAXuHeMIFxnIm__738';
const SHEET_NAME = '活動設定表';

// 過濾規則：早鳥截止日 < 今日 - 1 個月 → 該梯次已結束、不顯示
const PAST_GRACE_PERIOD_DAYS = 30;

function doGet(e) {
  try {
    const sheet = SpreadsheetApp.openById(SHEETS_ID).getSheetByName(SHEET_NAME);
    if (!sheet) {
      return _jsonResponse({ success: false, error: 'Sheet not found' });
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];  // A-M 表頭
    const rows = data.slice(1).map(row => {
      return Object.fromEntries(headers.map((h, i) => [h, row[i]]));
    });

    // 過濾過期梯次
    const today = new Date();
    const cutoff = new Date(today.getFullYear(), today.getMonth(), today.getDate() - PAST_GRACE_PERIOD_DAYS);
    const filtered = rows.filter(r => {
      const earlyBirdEndStr = r['早鳥截止日'];
      if (!earlyBirdEndStr) return true;  // 無早鳥日期的梯次永遠顯示
      const earlyBirdEnd = new Date(earlyBirdEndStr);
      if (isNaN(earlyBirdEnd.getTime())) return true;  // 格式異常仍顯示（讓 Issue #3 fail-safe 處理）
      return earlyBirdEnd >= cutoff;
    });

    // 只回前端需要的欄位（不外洩單價、付款連結等敏感資訊）
    const publicData = filtered.map(r => ({
      camp_name: r['營隊名稱'],
      batch: r['梯次'],
      early_bird_end: r['早鳥截止日'],
      // 不含 D-K 欄（單價、連結）— 由 Make 在 backend 查
    }));

    return _jsonResponse({
      success: true,
      data: publicData,
      timestamp: new Date().toISOString(),
      count: publicData.length
    });
  } catch (err) {
    return _jsonResponse({ success: false, error: err.toString() });
  }
}

function _jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### 5.3 為何不直接回單價、付款連結？

| 理由 | 說明 |
|---|---|
| 安全 | 單價、藍新付款連結屬於後端資料、不應被前端 JS 讀取（爬蟲、競品分析）|
| Make backend 仍會查 | Module 8 filterRows 在 webhook 觸發後查 Sheets，前端只需顯示營隊選項 |
| 簡化 schema | 前端只關心「有哪些營隊可選」，金額由 Make 計算後寄到家長 email |

---

## 6. Phase 4：Make webhook 切換（0.5 天）

### 6.1 切換步驟

| # | 動作 |
|---|---|
| 1 | 確認 Phase 0 + Phase 1-3 全通過 |
| 2 | 把自建表單部署到 GitHub Pages（`docs/forms/`）|
| 3 | 取得自建表單 URL：`https://jackson888kuo.github.io/sigellabs-camp-registration/forms/` |
| 4 | 不改 Make scenario（Module 1 webhook URL 維持原樣）|
| 5 | Tally 表單描述加置頂說明：「**本表單已搬遷，新網址：[新表單連結]**」 |
| 6 | 觀察 7 天，舊 Tally 流量歸零 |
| 7 | （冬令營啟用後）關閉 Tally 表單 |

### 6.2 Make 端不需動原因

| 元件 | 不動 |
|---|---|
| Module 1 webhook URL | 自建表單 POST 過去即可 |
| Module 1 expected payload schema | Phase 0 已驗證 mock 相容 |
| Module 2-28 IML | 全保留 |

---

## 7. Phase 6：T15 / T16 端對端驗收（0.5-1 天）

### 7.1 T15：基礎功能（5 渠道）

| 情境 | 驗收項 |
|---|---|
| 單營隊報名 | ops 13、5 渠道全綠、HubSpot 1 Deal、Sheets 1 行、Email 1 卡片 |
| 雙營隊報名 | ops 21、5 渠道全綠、HubSpot 2 Deal、Sheets 2 行、Email 1 封 2 卡片 |
| 三營隊報名 | ops 29、同上 |
| 早鳥期 + 正常期混合 | period 自動切換（Issue #3 仍生效）|

### 7.2 T16：跨平台 + 行動裝置 + 邊界

| 情境 | 平台 | 通過條件 |
|---|---|---|
| Chrome 桌機 | macOS | UI 完整、submit 成功 |
| Safari 桌機 | macOS | 同上 |
| Chrome 行動 | Android | 同上、字體不被自動縮放 |
| Safari 行動 | iOS | 同上、Email keyboard 正確跳出 |
| 慢速網路 | Chrome devtools throttling 3G | 載入提示明顯、不卡死 |
| Apps Script 回應慢 | mock 5 秒延遲 | 顯示 loading、不報錯 |
| Sheets 修改後 5 秒內 | 用業務同事帳號改 Sheets | 重新整理表單看到新選項 |
| 同學名雙報名 | 兩位「王小明」分別送 | 兩 Deal 各別建立 |
| 特殊字元 | 「李・小明」、「Anna ♥ Lin」 | 正確顯示、不亂碼 |

---

## 8. 風險登記

| 風險 | 機率 | 影響 | 緩解 |
|---|---|---|---|
| **Payload 不相容**（Phase 0 失敗）| 🟡 中 | 🔴 高 | Phase 0 為 go/no-go gate；失敗則重做 mock 或評估 Google Forms |
| Apps Script daily quota（6 小時/天免費版）| 🟢 低 | 🟡 中 | 預估每天讀取 < 100 次、總計 < 1 分鐘；遠低於 quota |
| Apps Script Web App 部署 OAuth 顯示警告 | 🟡 中 | 🟢 低 | 部署時 Google 會顯示「未驗證 app」警告，需點「進階 → 仍要前往」一次 |
| GitHub Pages 部署延遲 | 🟢 低 | 🟢 低 | 已啟用 Pages，每次 push 1-3 分鐘部署 |
| Sheets 結構變動（如業務同事誤刪 A 欄）| 🟡 中 | 🔴 高 | Apps Script 加 schema 驗證（headers 必須含「營隊名稱」「早鳥截止日」），缺少時回 fallback |
| 自建表單 UI 與 Tally 差距大、家長體驗下降 | 🟡 中 | 🟡 中 | UI 對齊 Tally 為 Phase 2 重點；測試期收家長回饋 |
| 行動裝置 UX 缺陷 | 🟡 中 | 🟡 中 | T16 必跑 Android + iOS 真機測試 |
| Make webhook DDoS（爬蟲、垃圾報名）| 🟡 中 | 🟡 中 | Apps Script 加 rate limit、表單加 honeypot 欄位、考慮 Cloudflare Turnstile（v5.3）|

---

## 9. Phase 0-6 工作分解 + 時程

| Phase | 內容 | 工作量 | 日期 | 主負責 |
|---|---|---|---|---|
| **Phase 0** | Payload 相容性驗證（mock JSON → staging Make）| 0.5 天 | 5/16-5/17 | Claude Code |
| Phase 0 通過 gate | T15 5 渠道全綠 | — | 5/17 | Jackson 驗收 |
| **Phase 1** | 表單核心邏輯（form.js 主流程）| 1 天 | 5/18-5/19 | Claude Code |
| **Phase 2a** | UI 對齊 Tally 桌機版 | 1.5 天 | 5/20-5/22 | Claude Code |
| **Phase 2b** | UI 對齊 Tally 行動裝置版 | 1 天 | 5/23-5/24 | Claude Code |
| **Phase 3** | Apps Script 部署 + Sheets 串接 | 0.5 天 | 5/25 | Claude Code |
| **Phase 4** | Make webhook 切換 | 0.5 天 | 5/26 | Claude Code |
| **Phase 6** | T15 + T16 端對端驗收 | 1 天 | 5/27-5/28 | Jackson + Claude Code |
| Buffer | 修補 + 微調 | 2 天 | 5/29-5/31 | — |
| **6/1** | **自建表單上線、Tally 表單描述加搬遷說明** | — | 6/1 | Jackson |

合計：4-5.5 天工作 + 2 天 buffer = 6.5-7.5 天歷期；於 5/31 前完成。

---

## 10. Claude Code 開工 SOP

| # | 動作 |
|---|---|
| 1 | `cd ~/Documents/Claude/Projects/太陽實驗室團報流程改進/github-repo/` |
| 2 | 讀本 spec 全文（重點 §3 §4 §5 §7）|
| 3 | 讀 memory：`project_self_hosted_form.md`、`feedback_make_iml_*.md`、`reference_make_blueprint_module_paths.md` |
| 4 | 讀 staging-credentials.md 取 staging webhook URL（不 push）|
| 5 | 開新分支：`git checkout -b feat/self-hosted-form` |
| 6 | Phase 0：從 staging Make 抓真實 Tally payload、寫 mock、curl 送、驗 5 渠道 |
| 7 | **Phase 0 通過後**才進 Phase 1（go/no-go gate）|
| 8 | Phase 1-2：寫 `docs/forms/` 三檔（index.html、style.css、form.js）|
| 9 | Phase 3：寫 `docs/apps-script/sheets-public-read.gs`（部署由 Jackson 執行）|
| 10 | Phase 4：把 form.js 的 webhook URL 改為 production Module 1 URL |
| 11 | Phase 6：T15 + T16 跨平台跨裝置驗收 |
| 12 | git commit + PR + Jackson review + merge |
| 13 | Jackson 6/1 切換 Tally 描述加搬遷說明 |

---

## 11. 完成驗收 Checklist

| # | 項目 | 完成 |
|---|---|---|
| 1 | Phase 0 Payload 相容性驗證通過 | ⬜ |
| 2 | docs/forms/ 三檔開發完成 | ⬜ |
| 3 | UI 對齊 Tally 桌機 + 行動裝置 | ⬜ |
| 4 | Apps Script 部署 + Sheets 串接成功 | ⬜ |
| 5 | T15 5 渠道全綠 | ⬜ |
| 6 | T16 跨平台 + 邊界 case 全通過 | ⬜ |
| 7 | GitHub Pages 部署 forms/ 路徑可訪問 | ⬜ |
| 8 | Tally 表單加搬遷說明 | ⬜ |
| 9 | Memory + sprint plan 更新 | ⬜ |
| 10 | git push + PR merge | ⬜ |

---

## 12. 維護紀錄

| 日期 | 變更 | 變更者 |
|---|---|---|
| 2026-05-06 | 初版（基於 5/6 Cowork 4 決策、Claude Code 提案）| Jackson + Claude（Cowork） |
