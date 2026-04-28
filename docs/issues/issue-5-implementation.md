# Issue #5 — 報名追蹤表時區/顯示格式修復實作紀錄

## 基本資訊

| 項目 | 內容 |
|---|---|
| Issue | https://github.com/Jackson888kuo/sigellabs-camp-registration/issues/5 |
| 優先級 | 🟡 P1 |
| 最終採用方案 | **C：Sheets 儲存格數字格式 + 試算表時區設定** |
| 處理日期 | 2026-04-28 |
| 負責人 | Jackson + Claude（Cowork） |

---

## 問題重述

報名追蹤表 (Google Sheets) A 欄「提交時間」原樣寫入 Tally webhook 的 `createdAt` ISO 8601 UTC 字串（例：`2026-04-28T01:45:30.375Z`），導致：

- 營運人員需心算 +8 小時，閱讀效率低
- 跨日資料易誤判
- H 欄「付款時間」也有相同顯示問題

---

## 方案演進與最終決策

| 版本 | 方法 | 結果 |
|---|---|---|
| v1 | Apps Script `setValues` 寫入 `yyyy-MM-dd HH:mm:ss` 純文字 | ❌ 被 Sheets `USER_ENTERED` 行為解析回 Date 物件，顯示為 `yyyy/mm/dd hh:mm:ss` |
| v2 | 改用 apostrophe (`'`) 前綴強制純文字 | ❌ Apps Script `setValues` 不識別 apostrophe，仍被解析為 Date |
| **v3.1** | **不動 Date 物件，改用 `setNumberFormat('yyyy-mm-dd hh:mm:ss')` 控制顯示** | ✅ **成功** |

**v3.1 採用理由：**
- 順應 Apps Script `setValues` 強制 `USER_ENTERED` 的行為，不對抗
- Date 物件保留可排序、可計算（如 `DATEDIF`）的特性
- 套用一次永久生效，新進資料列自動套用相同格式
- Make 寫入無論為 ISO 字串或 formatDate 字串，都會自動以正確時區/格式顯示

---

## 修復內容

### 1. Sheets 側（已完成）

**Apps Script 函式：** `applyDateFormat`（位於 `BackfillTimezone.gs`，bound 至報名追蹤表）

執行結果：
```
格式套用完成 (v3.1)
時區: Asia/Taipei
套用範圍: A2:A1183 & H2:H1183
當前資料列數: 183
```

驗證：
- A 欄：`2026/04/03 15:45:32` → `2026-04-03 15:45:32` ✅
- H 欄：`2026/04/04 11:03:39` → `2026-04-04 11:03:39` ✅

### 2. Make 側（選用，建議實施以增強健壯性）

**Scenario：** sigellabs-camp-registration（Phase 5 版本）
**Module：** Module 13 — Google Sheets: Add a Row

| Field | Before | After（建議） |
|---|---|---|
| `Values.0`（A 欄 提交時間） | `{{1.createdAt}}` | `{{formatDate(1.createdAt; "YYYY-MM-DD HH:mm:ss"; "Asia/Taipei")}}` |

**Why 建議仍做：** Sheets 端的 cell format 已能正確顯示，但 Make 端統一格式可避免：
- 未來 cell format 被誤改
- 手動 Run once 時 raw UTC ISO 字串混入
- 提供 data pipeline 的「形式即內容」清晰度

**Why 可不做：** 純從顯示角度，cell format 已解決。若覺得 Make Editor UI 操作有風險（IML reference token 問題），可先暫緩。

---

## 驗收結果

| 測試案例 | 預期 | 實際 | 狀態 |
|---|---|---|---|
| T1 既有 183 列 A 欄顯示 | `YYYY-MM-DD HH:mm:ss` | `2026-04-03 15:45:32` | ✅ |
| T2 既有 H 欄付款時間顯示 | `YYYY-MM-DD HH:mm:ss` | `2026-04-04 11:03:39` | ✅ |
| T3 試算表時區 | Asia/Taipei | Asia/Taipei | ✅ |
| T4 新報名（待測） | A 欄 + H 欄正確顯示 | （待真實表單測試） | ⏳ |

---

## 後續注意事項（前瞻性）

| 議題 | 說明 |
|---|---|
| **未來新欄位** | 任何新時間欄位（完課時間、退費時間…）皆建議套用 `yyyy-mm-dd hh:mm:ss` cell format |
| **試算表時區變更風險** | 若有人手動把 試算表時區從 Asia/Taipei 改成其他，顯示會偏移。建議 SOP 中註明 |
| **欄位異動敏感度** | 若 Sheet 增刪欄位，A=提交時間、H=付款時間 的欄位假設可能失效。Apps Script 中改用 header name lookup 會更穩健（後續優化） |

---

## 變更檔案

- `docs/issues/issue-5-implementation.md`（本文件）
- `docs/issues/issue-5-backfill.gs`（v3.1 程式碼，部署於報名追蹤表 Apps Script）
- Make Editor：scenario「sigellabs-camp-registration」Module 13（**選用**，未變更則記為 deferred）

---

## 維護紀錄

| 日期 | 變更 | 變更者 |
|---|---|---|
| 2026-04-28 | 初版建立、方案決議、Apps Script 完成（v1 → v3.1）| Jackson + Claude |
