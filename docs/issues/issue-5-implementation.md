# Issue #5 — 報名追蹤表「提交時間」UTC → Asia/Taipei 修復實作紀錄

## 基本資訊

| 項目 | 內容 |
|---|---|
| Issue | https://github.com/Jackson888kuo/sigellabs-camp-registration/issues/5 |
| 優先級 | 🟡 P1 |
| 採用方案 | 方案 A（Make `formatDate`）+ Backfill B1（Apps Script 一次性轉換） |
| 處理日期 | 2026-04-28 |
| 負責人 | Jackson + Claude（Cowork） |

---

## 問題重述

報名追蹤表 (Google Sheets) A 欄「提交時間」原樣寫入 Tally webhook 的 `createdAt` ISO 8601 UTC 字串（例：`2026-04-28T01:45:30.375Z`），導致：

- 營運人員需心算 +8 小時，閱讀效率低
- 跨日資料易誤判（例：台北 04-28 09:45 顯示為 04-28 01:45，看起來像凌晨報名）
- 下游若用此欄位做樞紐分析，時區錯誤會擴散

---

## 修復內容

### 1. Make scenario 變更

**Scenario：** sigellabs-camp-registration（Phase 5 版本）
**Module：** Module 13 — Google Sheets: Add a Row

| Field | Before | After |
|---|---|---|
| `Values.0`（A 欄 提交時間） | `{{1.createdAt}}` | `{{formatDate(1.createdAt; "YYYY-MM-DD HH:mm:ss"; "Asia/Taipei")}}` |

**操作方式：** 於 Make Editor UI 親手拖拉建立 reference token，再以 `formatDate()` 函式包裹（避免 IML 純 API 寫入導致 resolve 失敗，詳見 `feedback_make_iml_api_risk.md`）。

### 2. 既有資料 Backfill

- 程式：`docs/issues/issue-5-backfill.gs`（Apps Script）
- 執行範圍：A 欄全部資料列（不含表頭）
- 邏輯：解析 ISO 8601 → `Utilities.formatDate(d, "Asia/Taipei", "yyyy-MM-dd HH:mm:ss")`
- 冪等性：以 regex `/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/` 偵測已轉換列，重複執行安全

---

## 驗收結果

| 測試案例 | 預期 | 實際 | 狀態 |
|---|---|---|---|
| T1 跨日邊界（UTC 22:45 → 台北 06:45） | `2026-04-28 06:45:46` | （待填入） | ⏳ |
| T2 多營隊 Iterator 多列時間一致 | 兩列同 timestamp | （待填入） | ⏳ |
| T3 真實表單即時送出 | A 欄與當下時間一致 | （待填入） | ⏳ |
| T4 Backfill：歷史 ~N 列轉換 | 全部正確格式 | （待填入） | ⏳ |

---

## 後續注意事項（前瞻性）

| 議題 | 說明 |
|---|---|
| **付款時間 I 欄一致性** | Module 13 `values.8` 目前為空字串。未來若新增「付款 webhook → updateRow」流程，務必使用相同 `formatDate(...; "Asia/Taipei")` 包裝 |
| **後續新增時間欄位** | 任何新時間欄位（完課時間、退費時間…）皆採 `formatDate(date; "YYYY-MM-DD HH:mm:ss"; "Asia/Taipei")` 標準格式 |
| **Sheets 欄位格式** | A 欄已設為「純文字」，避免被自動解析回日期物件 |

---

## 變更檔案

- `docs/issues/issue-5-implementation.md`（本文件）
- `docs/issues/issue-5-backfill.gs`（Apps Script 程式碼）
- Make Editor：scenario「sigellabs-camp-registration」Module 13（無法 commit，僅紀錄變更內容）

---

## 維護紀錄

| 日期 | 變更 | 變更者 |
|---|---|---|
| 2026-04-28 | 初版建立、方案決議、Apps Script 完成 | Jackson + Claude |
