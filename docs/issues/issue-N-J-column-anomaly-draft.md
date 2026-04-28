# [Bug] 報名追蹤表 J 欄無表頭卻有資料、內容含未解析 IML 與英文 period 文字

## 問題描述

報名追蹤表（Google Sheets）J 欄出現以下異常：

1. **J 欄無表頭** — 第 1 列表頭僅至 I 欄（備註），但 J 欄持續被 Make Module 13 寫入資料
2. **J 欄內容格式混亂**：
   - 部分列：`<UUID> | early_bird | 單價:10900` — period 顯示英文 `early_bird`/`normal`，預期應為中文「早鳥優惠」/「正常期」
   - 部分列：`<UUID> | if(2026-04-28T00:...` — `if(...)` IML 表達式**完全未解析**，原樣輸出為文字
   - 第一個欄位（UUID）出現的位置不確定是預期的 `10.group_size`，看似錯接到其他變數

## 重現環境

- Spreadsheet ID: `1FGksYo2ghgeDLuH4VhwyT8wQM7QDBer7ieuQbjcFNqY`
- Make scenario: `sigellabs-camp-registration` Phase 5 v5.1
- Module 13 (Google Sheets: Add a Row) — `mapper.values.9`

## 目前 Make Module 13 mapper.values.9 設計（依 blueprint）

```
"{{10.group_size}} | {{if(9.period = "early_bird"; "早鳥優惠"; "正常期")}} | 單價:{{10.selected_price}} | Deal:{{11.id}}"
```

## 實際觀察的 J 欄內容（取樣）

| 列號 | J 欄內容 | 異常點 |
|---|---|---|
| 170-172 | `1043a048-...| normal | 單價:8...` | period 為英文 `normal` |
| 173 | `1043a048-...| if(2026-04-28T00:...` | **IF 表達式未解析** |
| 174-184 | `1043a048-...| early_bird | 單價:1...` | period 為英文 `early_bird` |
| 191 | `49603e64-...| early_bird | 單價:10900` | 同上 |

## 預期行為

A. **J 欄不應該被寫入**（如果原始設計是 9 欄）—— Make Module 13 mapper.values.9 應移除
   或

B. **J 欄表頭加上「備註詳情」之類的描述**，且內容須符合 mapper 設計：
   - period 顯示中文（早鳥優惠 / 正常期）
   - IF 表達式必定解析
   - 第一欄為正確的 group_size 值

## 待調查項目

1. Module 10 的 `group_size` 與 `period` 變數實際輸出為何？是否 Module 10 SetVariables 設計改變導致 mapper 引用錯誤
2. `if(9.period = "early_bird"; ...)` 為何在某些列無法解析？是否 9.period 為 null/undefined 觸發 IML 異常
3. 此 J 欄資料是否有業務用途（debug 紀錄）？若有，應規範化；若無，應移除

## 影響範圍

- 報名追蹤表所有列（自團報系統上線）
- 不影響核心 deal/付款邏輯，但污染追蹤表可讀性

## 建議優先級

🟢 P3 — 不影響核心功能，但需釐清設計意圖再決定是否清理

## 標籤

`bug`, `make-scenario`, `data-quality`, `P3`
