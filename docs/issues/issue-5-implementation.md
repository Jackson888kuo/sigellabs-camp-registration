# Issue #5 — 報名追蹤表時區/顯示格式修復實作紀錄

## 基本資訊

| 項目 | 內容 |
|---|---|
| Issue | https://github.com/Jackson888kuo/sigellabs-camp-registration/issues/5 |
| 優先級 | 🟡 P1 |
| 最終採用方案 | **Sheets 整欄 cell format + Make Module 13 formatDate 雙管齊下** |
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
| v3.1 | `setNumberFormat('yyyy-mm-dd hh:mm:ss')` 控制顯示，row range 套用 | ❌ Make INSERT_ROWS 新插入列繼承上方列格式，未繼承到日期格式 |
| **v4** | **整欄級別 `getRange('A:A')` + `getRange('H:H')` setNumberFormat** | ✅ **成功** |

並搭配 **Make Module 13** mapper.values.0 改為 `formatDate(1.createdAt; "YYYY-MM-DD HH:mm:ss"; "Asia/Taipei")`。

---

## 為何兩個改動都需要

| 改動 | 為什麼必要 |
|---|---|
| **Sheets 整欄 cell format** | Sheets `USER_ENTERED` 解析時，會 override pre-set 的 cell format。整欄級別會作為「欄位預設」，新插入列繼承 |
| **Make formatDate** | Sheets 不認得 ISO 8601 含毫秒+Z 後綴（`2026-04-28T14:00:06.018Z`），會存為純文字。轉成 `YYYY-MM-DD HH:mm:ss` 才能被 Sheets 解析為 Date 物件 |

---

## 修復內容

### 1. Sheets 側

**Apps Script 函式：** `applyDateFormat`（位於 BackfillTimezone.gs，bound 至報名追蹤表）

關鍵程式碼：
```js
sheet.getRange('A:A').setNumberFormat('yyyy-mm-dd hh:mm:ss');
sheet.getRange('H:H').setNumberFormat('yyyy-mm-dd hh:mm:ss');
```

執行結果：
```
格式套用完成 (v4)
時區: Asia/Taipei
套用範圍: A:A & H:H (整欄)
當前資料列數: 192
```

### 2. Make 側

**Scenario：** sigellabs-camp-registration（Phase 5 v5.1）
**Module：** Module 13 — Google Sheets: Add a Row

| Field | Before | After |
|---|---|---|
| `Values.0`（A 欄 提交時間） | `{{1.createdAt}}` | `{{formatDate(1.createdAt; "YYYY-MM-DD HH:mm:ss"; "Asia/Taipei")}}` |

**操作方式：** Make Editor UI 親手拖拉（避免 IML reference token API 寫入問題）。

---

## 驗收結果

| 列號 | A 欄顯示 | 解讀 |
|---|---|---|
| 1-184 | `2026-04-28 06:45:46` | ✅ v3.1 backfill 後成 Date 物件 + cell format |
| **192-193**（最新測試） | `2026-04-28 23:03:05`、`2026-04-28 23:22:46` | ✅ **Make 改後正確** |
| 185-191 | `2026-04-28T14:00:06.018Z`（純文字） | ⚠️ Issue #6 多營隊測試殘留，**保留作證據** |

| 欄位 | 修復前 | 修復後 | 狀態 |
|---|---|---|---|
| A 欄（提交時間，新列） | `46140.96047` 或 `2026-04-28T...` | `2026-04-28 23:03:05` | ✅ |
| H 欄（付款時間） | `2026/04/04 11:03:39` | `2026-04-04 11:03:39` | ✅ |
| 試算表時區 | Asia/Taipei | Asia/Taipei | ✅ |

---

## 後續注意事項（前瞻性）

| 議題 | 說明 |
|---|---|
| **未來新欄位** | 任何新時間欄位皆建議整欄套用 `yyyy-mm-dd hh:mm:ss`，並在 Make 端用 `formatDate(...; "Asia/Taipei")` 包裹 |
| **試算表時區變更風險** | 若有人手動改試算表時區，顯示會偏移。建議 SOP 中註明 |
| **欄位異動敏感度** | 若 Sheet 增刪欄位，A=提交時間、H=付款時間 的假設可能失效。Apps Script 中改用 header name lookup 會更穩健 |
| **連帶發現** | J 欄無表頭卻有資料、IF 表達式偶爾未解析 → **將另開 Issue 追蹤** |

---

## 變更檔案

- `docs/issues/issue-5-implementation.md`（本文件）
- `docs/issues/issue-5-backfill.gs`（v4 程式碼，部署於報名追蹤表 Apps Script）
- Make Editor：scenario「sigellabs-camp-registration」Module 13（已修改完成）

---

## 維護紀錄

| 日期 | 變更 | 變更者 |
|---|---|---|
| 2026-04-28 | 初版建立、方案決議、v1→v4 完整修復 | Jackson + Claude |
