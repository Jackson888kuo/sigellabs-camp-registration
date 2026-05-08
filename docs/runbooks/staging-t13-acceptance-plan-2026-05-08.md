---
title: Staging T13a-d 驗收計畫 + Email 渠道補測 + M28 Alert 觸發測試（2026-05-08）
description: 接續 5/7 staging smoke test，補完 Issue #3 fail-safe 四子情境驗收、SendGrid M4 渠道驗證與 Module 28 alert email 觸發測試
---

# Staging T13a-d 驗收計畫 + Email 渠道補測 + M28 Alert 觸發測試

| 項目 | 內容 |
|---|---|
| 文件目的 | 將 5/6 production 已實作之 Issue #3 雙重防呆，於 staging 環境完成 T13a-d 四子情境驗收，並補回 5/7 smoke test 因 BundleValidationError 缺漏的 Email 渠道驗證、新增 Module 28 alert email 觸發測試 |
| 對應 Issue | [#3 早鳥日期防呆強化](../issues/issue-3-implementation-spec.md) |
| 執行環境 | Staging scenario `4975229`（v1 = production v12 一致） |
| 前置依賴 | 5/6 Issue #3 production 已實作 ✅、5/6 Issue #8 production 已實作 ✅、5/7 staging smoke test S1 ✅ |
| 起始 blueprint | `docs/snapshots/blueprint_staging_v1_initial.json`（與 production v12 bit-for-bit 一致，僅 spreadsheetId 為 staging）|
| 採用策略 | 直接 POST staging webhook（Tally clone 尚未完成）；payload 採真實 Tally schema 結構，避免 5/7 M4 BundleValidationError 重演 |
| 撰寫日期 | 2026-05-08（Cowork） |
| 預估執行時間 | 1.5 小時（含 Sheets 設定 + 4 個 webhook POST + 5 渠道檢核）|

---

## 0. 驗收前提與設計原則

### 0.1 為什麼現在做這件事

| 背景 | 內容 |
|---|---|
| 5/6 Issue #3 已在 production 實作完成 | T13b（已過期早鳥）+ T13d（雙營隊混合）已在 production 跑過 ✅；T13a/T13c 因 Sheets 沒有合適測試列、未在 production 跑 |
| 5/7 staging smoke test S1 通過 | 核心流程 + 隔離驗證皆 ✅；但 M4 SendGrid `BundleValidationError` 導致 Email 渠道未驗證、Module 28 alert 也未在 staging 觸發過 |
| 6/1 進入冷凍前的最後驗收窗口 | 12 月冬令營啟用前必須確保 fail-safe 與 alert 機制在乾淨環境（staging）端對端可運作 |

### 0.2 設計原則

| 原則 | 落實方式 |
|---|---|
| 渠道全綠 | 每個子情境都檢核 5 渠道（M8/M10/M11/M13/M27）+ M4 Email 寄達 + M28 alert（依預期觸發或不觸發） |
| Payload 採 Tally schema | `1.data.fields[]` 結構與真實 Tally webhook 一致，特別是 `1.data.fields[2].value`（M4 收件人 email）必須有效，避免 5/7 BundleValidationError 重演 |
| 觀察值記錄 | 每筆送出後 5 分鐘內紀錄 ops、period、period_alert、selected_price、Sheets 行、Deal 名、信件標題 |
| 隔離驗證 | 每 2 個子情境穿插 1 次 production 端確認（無新資料）|

---

## 1. T13a-d 四子情境設計總覽

| 子情境 | 觸發條件 | 預期 period | 預期 period_alert | 預期 M28 alert | 備註 |
|---|---|---|---|---|---|
| **T13a** | C 欄合法 ISO 日期、且日期 > 今日（早鳥期內）| `early_bird` | `""` | 0 封（filter 阻擋） | 5/6 production 未測（Sheets 無未來日期）|
| **T13b** | C 欄合法 ISO 日期、但日期 ≤ 今日（早鳥已過）| `normal` | `""` | 0 封 | 5/6 production 已驗 ✅ ops=13 |
| **T13c** | C 欄為非 ISO 格式（如 `2026/12/15` 斜線）| `normal`（fail-safe） | `"MALFORMED_EARLY_BIRD_DATE"` | 1 封 | 5/6 含於 T13d |
| **T13d** | 雙營隊混合（1 正常 + 1 異常）| 1 normal、1 normal+alert | 1 個空、1 個 MALFORMED | 1 封（僅異常那筆） | 5/6 production 已驗 ✅ ops=22 |

### 1.1 staging 活動設定表測試列現況

依 `docs/runbooks/staging-credentials.md` 與 setup SOP §3.4，staging 活動設定表已預填 3 組測試列。**本次驗收前需確認/補充**：

| 編號 | 營隊名（A 欄）| C 欄（早鳥截止日）| 對應子情境 | 狀態 |
|---|---|---|---|---|
| 列 1 | `STEAM_TEST_NORMAL_FUTURE` | `2026-12-31` | T13a | ✅ 已存在（5/9 setup）|
| 列 2 | `STEAM_TEST_NORMAL_PAST` | `2026-04-01` | T13b | ✅ 已存在 |
| 列 3 | `STEAM_TEST_MALFORMED` | `2026/12/15`（斜線格式）| T13c | ⚠️ 需確認 — setup §3.4 寫「留空 或填 2026/12/15」，請手動確認非空且為 `2026/12/15`（如為空請改為 `2026/12/15`） |

> ⚠️ 為何不測「C 欄留空」：依 production v12 實作（Issue #3 §10.1），`length(8.3)≠10` 時 alert flag 仍為 `""`（不發 alert），這是已知刻意行為（避免 Sheets 沒填日期就狂發 alert）。本次驗收採 spec §3.5 預期路徑（非 ISO 格式 → MALFORMED → alert），與實作行為一致。

### 1.2 完整測試 payload 結構（Tally-shape，避免 M4 BundleValidationError）

5/7 smoke test 失敗的根因是 payload 把欄位寫在 `data` 物件下層、未提供 M4 所讀取的 `1.data.fields[2].value` 收件人 email。本次採用真實 Tally webhook schema：

```json
{
  "eventId": "t13-acceptance-{{timestamp}}",
  "eventType": "FORM_RESPONSE",
  "createdAt": "2026-05-08T10:00:00.000Z",
  "data": {
    "responseId": "t13a-resp-001",
    "respondentId": "t13a-respond-001",
    "formId": "MeYEJ8-staging",
    "formName": "[STAGING] 太陽實驗室團報報名",
    "createdAt": "2026-05-08T10:00:00.000Z",
    "fields": [
      { "key": "f0_parent_name",     "label": "家長姓名",   "type": "INPUT_TEXT",  "value": "T13驗收家長" },
      { "key": "f1_phone",           "label": "電話",       "type": "INPUT_PHONE", "value": "+886912000099" },
      { "key": "f2_email",           "label": "Email",      "type": "INPUT_EMAIL", "value": "jacksonkuo@gmail.com" },
      { "key": "f3_child_name",      "label": "孩子姓名",   "type": "INPUT_TEXT",  "value": "T13Child" },
      { "key": "f4_child_en",        "label": "孩子姓名（英文）", "type": "INPUT_TEXT", "value": "T13Child" },
      { "key": "f5_count",           "label": "您這次要報名幾個營隊？", "type": "MULTIPLE_CHOICE", "value": "2" },
      { "key": "f6_group_size",      "label": "團報人數",   "type": "MULTIPLE_CHOICE", "value": "3" },
      { "key": "f7_camps_choice_1",  "label": "孩子要報名哪些營隊？ ([STEAM_TEST_NORMAL_FUTURE])", "type": "CHECKBOXES", "value": "true" },
      { "key": "f8_camps_choice_2",  "label": "孩子要報名哪些營隊？ ([STEAM_TEST_MALFORMED])",     "type": "CHECKBOXES", "value": "true" }
    ]
  }
}
```

| 欄位 | 對應 Make 引用 | 為何重要 |
|---|---|---|
| `1.data.fields[2].value` | M4 send_to email | 5/7 失敗點，必須是合法 email |
| `1.data.fields[0].value` | M11 dealname 家長姓名 | 渠道檢核 |
| `1.data.fields[3].value` | Sheets E 欄孩子姓名 | 5/7 為空（label 不一致）→ 本次採無括號 label |
| `1.createdAt`（頂層）| Sheets A 欄提交時間 | 5/7 為空（payload 結構簡化）→ 本次補 |
| `孩子要報名哪些營隊？ (xxx)` 標籤 | Module 5 iterator filter | 觸發多營隊邏輯（測試 N=1 的子情境改為單一 CHECKBOXES）|

> 💡 **單一營隊子情境**（T13a 和 T13b 各自獨立執行時）payload 僅保留 1 個 `孩子要報名哪些營隊？ (...)` 欄位，預期 ops = 13；雙營隊（T13d）保留 2 個，預期 ops = 22。

---

## 2. 各子情境執行步驟

### 2.1 T13a — Happy path（早鳥期內、合法 ISO 日期）

| # | 動作 | 工具 / 位置 |
|---|---|---|
| a.1 | 確認 staging 活動設定表第 1 列 `STEAM_TEST_NORMAL_FUTURE` 的 C 欄為 `2026-12-31`（合法 ISO） | Sheets `1NUG_LTOpwwuw3c5eiUHEz7MLUrLdhbWSWQ_6UWXf-r8` |
| a.2 | 確認 staging scenario `4975229` 啟用（右下角綠燈） | Make Editor |
| a.3 | Make Editor 點 **Run once** | scenario 進入 waiting webhook 狀態 |
| a.4 | POST 單一營隊 payload（僅含 `STEAM_TEST_NORMAL_FUTURE`），參考 §1.2 | `curl -X POST https://hook.us2.make.com/ez2f65ux82gc71wkrlbgaalaxp4u6xmu` |
| a.5 | Make Editor 觀察 execution、紀錄 ops | 預期 13 ops |
| a.6 | 5 渠道 + Email + Alert 檢核（依 §2.5 表格）| — |

#### T13a 預期值

| 渠道 / 模組 | 預期值 | 通過條件 |
|---|---|---|
| ops 計數 | 13 | Make Editor 顯示 `13 operations` |
| M8 filterRows | 取到 `STEAM_TEST_NORMAL_FUTURE` 那一列 | 檢查 8.`3` = `2026-12-31` |
| M9 period | `early_bird` | Module 9 output bundle |
| M9 period_alert | `""`（空字串） | Module 9 output bundle |
| M10 selected_price | 早鳥單價（依 staging Sheets 對應 8.`4` 欄）| Module 10 output |
| M11 dealname | `T13驗收家長 x STEAM_TEST_NORMAL_FUTURE`（或依現行 dealname 規則）| HubSpot Deal 列表 |
| M13 row | staging 追蹤表第 N 列、A-I 完整、J 空 | 開 staging 追蹤表 |
| M27 payment_button_html | 含早鳥金額 + 早鳥連結（橘色卡片）| 信件 HTML 內含 |
| **M4 SendGrid（Email 渠道）** | jacksonkuo@gmail.com 收到 1 封 `【太陽實驗室】您的 2026 夏令營報名已收到` | 5 分鐘內進信箱 |
| **M28 alert** | **不應觸發**（filter `9.period_alert ≠ ""` 阻擋）| 0 封 alert |

---

### 2.2 T13b — 早鳥已過、合法 ISO 日期

| # | 動作 |
|---|---|
| b.1 | 確認 staging 活動設定表第 2 列 `STEAM_TEST_NORMAL_PAST` 的 C 欄為 `2026-04-01`（合法、已過）|
| b.2 | Run once |
| b.3 | POST 單一營隊 payload（將 §1.2 中第 9 個 fields 改為 `STEAM_TEST_NORMAL_PAST`，移除第 8 個 MALFORMED 欄位）|
| b.4 | 紀錄 ops、5 渠道檢核 |

#### T13b 預期值（與 T13a 差異處）

| 項目 | T13a | T13b |
|---|---|---|
| period | `early_bird` | `normal` |
| selected_price | 早鳥單價 | 正常單價 |
| M27 payment_button_html | 早鳥金額 + 連結 | 正常金額 + 連結 |
| 其他項目 | — | 同 T13a 規則（period_alert 仍為空、無 alert）|

> 💡 此情境 5/6 production 已驗（execution `10e328aee27a462186cfff63d014d5d9`、13 ops、status:1），本次主要目的是於 staging 環境驗證行為一致 + 補 Email 渠道。

---

### 2.3 T13c — Fail-safe（C 欄非 ISO 格式 `2026/12/15`）

| # | 動作 |
|---|---|
| c.1 | 確認 staging 活動設定表第 3 列 `STEAM_TEST_MALFORMED` 的 C 欄為 `2026/12/15`（非 ISO）|
| c.2 | Run once |
| c.3 | POST 單一營隊 payload，CHECKBOXES label 指向 `[STEAM_TEST_MALFORMED]` |
| c.4 | 紀錄 ops、5 渠道檢核、**特別檢查 jacksonkuo@gmail.com 收 alert 信** |

#### T13c 預期值

| 項目 | 預期 |
|---|---|
| ops | 14（13 + 1 個 M28 alert 觸發）|
| M9 period | `normal`（fail-safe 觸發）|
| M9 period_alert | `"MALFORMED_EARLY_BIRD_DATE"` |
| M10 selected_price | 正常單價（fail-safe 偏保守）|
| M27 payment_button_html | 正常金額 + 連結 |
| **M28 alert** | jacksonkuo@gmail.com **收到 1 封** alert 信 |
| Alert subject 觀察 | `[ALERT] Make scenario 4596472 — 早鳥截止日格式異常 (...)` ⚠️ 主旨會誤稱 4596472（production scenario ID）— 詳見 §4 staging 瑕疵 |
| Alert body 觀察 | 連結指向 production sheet `1dZUNmS28HAuXLBPJchaB84xLlRAXuHeMIFxnIm__738` ⚠️ 詳見 §4 |

---

### 2.4 T13d — 雙營隊混合（1 正常 + 1 異常）

| # | 動作 |
|---|---|
| d.1 | 確認 staging 活動設定表列 1 + 列 3 兩列皆就緒 |
| d.2 | Run once |
| d.3 | POST §1.2 完整 payload（同時包含 `STEAM_TEST_NORMAL_FUTURE` + `STEAM_TEST_MALFORMED`）|
| d.4 | 紀錄 ops、5 渠道檢核 |

#### T13d 預期值

| 項目 | 預期 |
|---|---|
| ops | 22（5 + 2×8 + 1 alert）|
| HubSpot Deal | 2 筆（normal_future 走 early_bird 金額、malformed 走 normal 金額）|
| Sheets | staging 追蹤表新增 2 行 |
| Email | jacksonkuo@gmail.com **1 封確認信、含 2 張付款卡片**（金額分別正確）|
| **M28 alert** | jacksonkuo@gmail.com 收到 **1 封** alert（僅針對 MALFORMED 那筆）|

> 💡 此情境 5/6 production 已驗（execution `a3bc71f4084a4e91a186691b4a748a5b`、22 ops、status:1）。

---

### 2.5 5 渠道 + Email + Alert 檢核標準表

每個子情境送出後 10 分鐘內逐項勾稽：

| # | 檢核項 | 工具 | 通過條件 |
|---|---|---|---|
| 1 | M8 filterRows | Make Editor → execution detail → Module 8 output | 取到的列 A 欄 = 預期營隊名 |
| 2 | M9 period | Module 9 output bundle | 與預期一致 |
| 3 | M9 period_alert | Module 9 output bundle | 與預期一致 |
| 4 | M10 selected_price | Module 10 output | 與預期一致 |
| 5 | M11 HubSpot Deal | HubSpot Portal → Sales → Deals | dealname 與預期一致、created 時間吻合 |
| 6 | M13 staging 追蹤表 | 開 staging 追蹤表 | 新行 A-I 完整、J 空、E 欄孩子姓名非空 |
| 7 | M27 payment_button_html | M27 output 或最終 Email HTML | 含正確金額 + 連結 |
| 8 | **M4 SendGrid 確認信** | jacksonkuo@gmail.com 信箱 | 5 分內進信箱、主旨正確、卡片渲染正常、無 BundleValidationError |
| 9 | **M28 alert email** | jacksonkuo@gmail.com 信箱 | 依預期觸發或不觸發 |
| 10 | Production 隔離 | 開 production 追蹤表 | 末筆仍為 5/7 T14 之前的紀錄、無新增 |

---

## 3. Email 渠道補測（5/7 缺漏修補）

### 3.1 5/7 失敗根因回顧

| 觀察 | 5/7 行為 | 本次修補 |
|---|---|---|
| M4 BundleValidationError | 測試 payload 沒有 `1.data.fields[2].value` 結構，M4 send_to 取不到 email | §1.2 採真實 Tally schema、`fields[2]` 為合法 email |
| Sheets A 欄空白 | payload 把 `createdAt` 放 `data` 物件內、無頂層 `1.createdAt` | §1.2 同時保留頂層 + `data` 內 createdAt |
| Sheets E 欄空白 | label 用「孩子姓名（中文）」、Make IML 找不到 | §1.2 改為「孩子姓名」（無括號後綴）|

### 3.2 Email 渠道驗收標準

| 子情境 | M4 收件人 | M4 預期主旨 | 內容 |
|---|---|---|---|
| T13a | jacksonkuo@gmail.com | 【太陽實驗室】您的 2026 夏令營報名已收到，請於 7 天內完成繳費 | 1 張早鳥卡片 |
| T13b | 同上 | 同上 | 1 張正常卡片 |
| T13c | 同上 | 同上 | 1 張正常卡片（fail-safe）|
| T13d | 同上 | 同上 | 2 張卡片（早鳥 + 正常）|

> 4 個子情境全部要求 M4 寄達；任何一封缺失 = Email 渠道不合格。

---

## 4. Module 28 Alert 觸發測試（首次於 staging 觸發）

### 4.1 觸發點與預期信件

| 子情境 | M28 是否觸發 | 觸發條件 |
|---|---|---|
| T13a | ❌ | filter `9.period_alert ≠ ""` 阻擋（period_alert = ""）|
| T13b | ❌ | 同上（合法 ISO、僅是過期）|
| T13c | ✅ | period_alert = `"MALFORMED_EARLY_BIRD_DATE"` |
| T13d | ✅（1 封）| 兩個 iterator 迭代中僅 MALFORMED 那筆觸發 |

### 4.2 預期 alert 信件內容（依 staging blueprint v1）

| 欄位 | 線上實際值（staging v1）|
|---|---|
| To | `jacksonkuo@gmail.com`（硬編碼）|
| From | `太陽實驗室客服中心 <hello@sigellabs.com>` |
| Subject | `[ALERT] Make scenario 4596472 — 早鳥截止日格式異常（孩子要報名哪些營隊？ ([STEAM_TEST_MALFORMED])）` |
| Body | 內含 `Make scenario 4596472 偵測到...`、`Sheets 8.\`3\` 原始值：「2026/12/15」`、連結至 `https://docs.google.com/spreadsheets/d/1dZUNmS28HAuXLBPJchaB84xLlRAXuHeMIFxnIm__738/`（**production sheet 連結**）|

### 4.3 ⚠️ Staging blueprint 已知瑕疵（前次比對發現）

| # | 瑕疵 | 證據 | 影響 | 是否阻塞本次驗收 |
|---|---|---|---|---|
| 1 | M28 subject 寫死 `4596472`（production scenario ID） | 上述 §4.2 Subject | staging 觸發時 alert 信件主旨會誤稱 production | ❌ 不阻塞 — 信件可寄達、filter 邏輯仍正確；建議於本次驗收後 PATCH |
| 2 | M28 body 連結指向 production sheet | 上述 §4.2 Body 內 spreadsheet URL | 若營運者依信件連結點開、會看到 production sheet 而非實際 staging 異常源 | ❌ 不阻塞 — 但會造成 troubleshooting 走錯 sheet；建議同 #1 一併修補 |

#### 4.3.1 處理方案表

| 方案 | 動作 | 優點 | 缺點 | 建議 |
|---|---|---|---|---|
| **方案 X**：先驗收、後修補 | 本次驗收照常進行；T13a-d 通過後再開單獨 PR PATCH staging M28 | ✅ 不延誤本次驗收；驗收結果客觀（瑕疵已知）| ⚠️ alert 信主旨/連結誤稱 production，需在驗收紀錄表特別標註 | **首選** — 風險最低 |
| 方案 Y：先修補、後驗收 | 立即 PATCH staging M28 subject 改 `{{scenarioId}}` 或 `4975229`、body 改 staging sheet URL | ✅ 環境純度高 | ⚠️ 增加 1 次 API PATCH + 重 GET snapshot；若 PATCH 觸發 silent noop（Issue #12 教訓）會延誤驗收 | 不建議 — 與本次主要目標無關 |
| 方案 Z：放棄 alert 內容驗證、僅驗 filter 邏輯 | 只驗 alert 是否寄達、不檢查 subject/body | ✅ 最快 | ❌ 失去 alert 內容正確性的驗證、未來維運可能漏抓信件解析錯誤 | 不建議 |

> 採方案 X：本次驗收**接受 staging M28 主旨 + 連結瑕疵**，但於記錄表標註，待驗收完成後另立工單修補。

---

## 5. 執行順序（建議節奏）

| # | 時段 | 動作 | 預估 |
|---|---|---|---|
| 1 | T+0 ~ T+10 min | 確認 staging 活動設定表 3 組測試列就緒（特別是列 3 改為 `2026/12/15`）| 10 min |
| 2 | T+10 ~ T+20 min | 啟用 staging scenario、確認 6 connection 綠勾 | 10 min |
| 3 | T+20 ~ T+30 min | 跑 T13a（early_bird），檢核 5 渠道 + Email | 10 min |
| 4 | T+30 ~ T+40 min | 跑 T13b（normal），檢核 + 確認 production 隔離 | 10 min |
| 5 | T+40 ~ T+55 min | 跑 T13c（malformed 單營隊），**特別等 alert 信** | 15 min |
| 6 | T+55 ~ T+75 min | 跑 T13d（雙營隊混合），檢核 ops=22 + 2 確認信 + 1 alert | 20 min |
| 7 | T+75 ~ T+90 min | 整理紀錄表、撰寫驗收報告草稿、staging 瑕疵單 | 15 min |

> 預留 30 分鐘 buffer 處理意外（如 staging Sheets 測試列被改、SendGrid 速率限制）。

---

## 6. 通過驗收條件 Checklist

| # | 項目 | 通過條件 | 完成 |
|---|---|---|---|
| 1 | 4 子情境全部送出且 ops 數正確 | T13a=13、T13b=13、T13c=14、T13d=22 | ⬜ |
| 2 | M9 period / period_alert 4 子情境皆與預期一致 | 見 §1 表格 | ⬜ |
| 3 | M10 selected_price 4 子情境皆與預期一致 | 早鳥/正常單價分別正確 | ⬜ |
| 4 | M11 HubSpot Deal 共建立 5 筆（T13a/b/c 各 1、T13d 2）| 全 5 筆 dealname 含對應營隊名 | ⬜ |
| 5 | M13 staging 追蹤表新增 5 行（A-I 完整、J 空）| 開表確認 | ⬜ |
| 6 | M4 SendGrid 確認信 4 封全部寄達 jacksonkuo@gmail.com | 主旨、卡片渲染正常、無 BundleValidationError | ⬜ |
| 7 | M28 alert 信 2 封寄達（T13c 1 封 + T13d 1 封）| filter 邏輯正確 | ⬜ |
| 8 | T13a/T13b 不觸發 M28 alert | 信箱無多餘 alert | ⬜ |
| 9 | Production 隔離 | production 追蹤表 + Deal 全程無新增 | ⬜ |
| 10 | 驗收報告撰寫 | `docs/runbooks/staging-t13-acceptance-report-2026-05-08.md` 完成 | ⬜ |
| 11 | Staging M28 瑕疵單開立 | GitHub Issue 標 `bug` + `staging-only` | ⬜ |

---

## 7. 風險與緩解

| 風險 | 機率 | 影響 | 緩解 |
|---|---|---|---|
| Staging 活動設定表測試列被改動（如 C 欄空 vs `2026/12/15`）| 🟡 中 | 🔴 高（T13c 行為改變）| §2.0 第一步先確認、發現異常立即修正 |
| M4 SendGrid 又出 BundleValidationError | 🟢 低 | 🔴 高（Email 渠道不合格）| §1.2 payload 嚴格 Tally-shape、`fields[2].value` 為合法 email |
| M28 alert 進垃圾信匣 | 🟡 中 | 🟡 中（誤判為未觸發）| 信箱搜尋 `[ALERT] Make scenario 4596472`、檢查垃圾信匣 |
| SendGrid 短時間多封觸發速率限制 | 🟢 低 | 🟡 中 | 4 子情境間隔 ≥ 5 分鐘、確認 SendGrid 100/day 內 |
| HubSpot Deal 累積污染 staging contact | 🟡 中 | 🟢 低 | 驗收後手動刪除 5 筆 Deal、清空 contact 標籤 |
| Production 追蹤表意外被寫入 | 🟢 低 | 🔴 高 | 每 2 子情境穿插隔離驗證、發現異常立即停用 staging scenario |
| Staging M28 主旨/連結誤稱 production 造成日後 troubleshooting 走錯 | 🟡 中 | 🟡 中 | §4.3 已記錄為已知瑕疵；驗收完開單修補 |

---

## 8. 後續對接

| 階段 | 動作 |
|---|---|
| 驗收完成（同日）| 撰寫 `staging-t13-acceptance-report-2026-05-08.md` |
| 驗收完成 +1 day | 開 GitHub Issue：staging M28 主旨 + body URL hardcoded production refs |
| 5/12–5/14 | 進入完整整合測試（30 筆樣本、依 `docs/sprints/2026-W18-W20-integration-test-plan.md`）|
| 5/15 | Sprint Retrospective、本驗收報告納入紀錄 |

---

## 9. 附錄：直接 POST staging webhook 的範例 curl

> ⚠️ 收到 webhook URL 屬敏感資訊，本檔案不寫實際 URL，請從 `staging-credentials.md` 取得。

```bash
# T13a — 早鳥期內、單一營隊
curl -X POST "https://hook.us2.make.com/<STAGING_WEBHOOK_TOKEN>" \
  -H "Content-Type: application/json" \
  -d @t13a-payload.json

# T13c — 非 ISO 格式、單一營隊
curl -X POST "https://hook.us2.make.com/<STAGING_WEBHOOK_TOKEN>" \
  -H "Content-Type: application/json" \
  -d @t13c-payload.json

# T13d — 雙營隊混合
curl -X POST "https://hook.us2.make.com/<STAGING_WEBHOOK_TOKEN>" \
  -H "Content-Type: application/json" \
  -d @t13d-payload.json
```

> Payload JSON 範本請依 §1.2 結構，差異僅在 `fields[]` 中 `孩子要報名哪些營隊？ (xxx)` 的 label 與數量。

---

## 10. 維護紀錄

| 日期 | 變更 | 變更者 |
|---|---|---|
| 2026-05-08 | 初版（接續 5/7 smoke test、補 T13a-d + Email + Alert 三項缺漏）| Jackson + Claude（Cowork）|
