# 業務同事使用手冊 3：Alert Email 處理 SOP

| 項目 | 內容 |
|---|---|
| 適用對象 | 監控信箱 `hello@sigellabs.com` 接收者 |
| 不需要懂 | 程式、Make.com、API |
| 需要懂的工具 | Gmail、Google Sheets |
| 預估閱讀時間 | 10 分鐘 |
| 撰寫日期 | 2026-05-06 |
| 維護者 | Jackson（管理員） |

---

## 1. 什麼是 Alert Email？

當系統偵測到 **Sheets 活動設定表 C 欄（早鳥截止日）格式異常**時，會自動寄出一封 alert email 到 `hello@sigellabs.com`，提醒人工檢查。

### 1.1 觸發條件

| 觸發 | 不觸發 |
|---|---|
| C 欄為空白 | C 欄為合法 `YYYY-MM-DD` 格式 |
| C 欄為 `2026/12/15`（用斜線）| 同上 |
| C 欄為 `12-15-2026`（順序錯）| 同上 |
| C 欄為 `Dec 15` | 同上 |
| C 欄為 `2026-13-99`（語意錯）| 同上 |

### 1.2 不觸發但仍重要的情境

| 情境 | 對策 |
|---|---|
| 早鳥期已過了（如今天 5/15、C 欄是 5/10）| 系統正常切到 normal、不需處理 |
| 全部營隊都正常運作 | 沒事 |

---

## 2. 收到 alert email 的 5 步驟 SOP

### 2.1 SOP 流程

| # | 動作 | 估時 |
|---|---|---|
| 1 | 看 email 主旨「`[ALERT] Make scenario 4596472 — 早鳥截止日格式異常（<營隊名>）`」記下營隊名 | 10 秒 |
| 2 | 看 email 內文「Sheets 8.`3` 原始值：「`<該值>`」」對照原始值是什麼 | 30 秒 |
| 3 | 開活動設定表 Sheets：https://docs.google.com/spreadsheets/d/1dZUNmS28HAuXLBPJchaB84xLlRAXuHeMIFxnIm__738/ | 30 秒 |
| 4 | 找到該營隊那一列 → 改 C 欄為合法 `YYYY-MM-DD` 格式 | 1 分鐘 |
| 5 | 通知 Jackson（hello@sigellabs.com 內部信件 / LINE）後續觀察 | 30 秒 |

### 2.2 Email 內文範例

```
主旨：[ALERT] Make scenario 4596472 — 早鳥截止日格式異常（STEAM Attack 用電不要怕）

Make scenario 4596472 偵測到 Sheets 活動設定表早鳥截止日格式異常。

—— 異常資訊 ——
時間：2026-05-12 14:23:45
營隊：STEAM Attack 用電不要怕
Sheets 8.`3` 原始值：「2026/12/15」（應為 YYYY-MM-DD 格式）

—— Fail-safe 已自動觸發 ——
Module 9 已 fallback 為 period = "normal"
本筆報名將以正常期金額處理，避免錯誤計費。

—— 請人工檢查 ——
1. 開 Sheets：https://docs.google.com/spreadsheets/d/1dZUNmS28HAuXLBPJchaB84xLlRAXuHeMIFxnIm__738/
2. 找到該營隊那一列，確認 C 欄（早鳥截止日）為合法 YYYY-MM-DD 格式
3. 修正後請聯繫管理員確認後續報名是否回到 early_bird 分支
```

---

## 3. 修正範例：3 種常見錯誤的對照

| 原值（錯）| 改為（正確）| 邏輯 |
|---|---|---|
| `2026/12/15` | `2026-12-15` | 把 `/` 換成 `-` |
| `12-15-2026` | `2026-12-15` | 順序改為「年-月-日」|
| `2026-12-5` | `2026-12-05` | 月、日不足 2 位數補零 |
| `Dec 15, 2026` | `2026-12-15` | 改用數字格式 |
| `2026年12月15日` | `2026-12-15` | 不要中文 |
| 空白 | 填入該營隊實際的早鳥截止日 | 補資料 |

---

## 4. 系統已自動「fail-safe」是什麼意思？

| 沒有 fail-safe（壞情況）| 有 fail-safe（現況）|
|---|---|
| C 欄格式錯 → 系統判斷不出早鳥/正常 → 整個 scenario 報錯 → 客戶完全收不到 email | C 欄格式錯 → 系統自動 fallback 為「正常期」金額 → 客戶仍收到 email、且金額**較高、安全** |

### 4.1 為什麼 fallback 為「正常期」（高金額）？

設計理由：
1. **客戶不會被錯誤少收**（避免後續向家長追補差額的尷尬）
2. **客戶若覺得金額有疑問可主動詢問**（您可以追溯查證、合理化處理）
3. 若反過來 fallback 為「早鳥期」（低金額），則收到投訴時系統已少收費、損失難以追回

### 4.2 為什麼還是要修 Sheets？

雖然 fail-safe 守住了金額不出錯，**但持續觸發代表 Sheets 設定一直有問題**：
- 後續所有該營隊報名都會以 normal 處理（即使現在還在早鳥期）
- 客戶錯失早鳥優惠 → 報名意願降低
- 您每次報名都會收到一封 alert email → 信箱被淹沒

**所以收到 alert email 的當下盡快修，是給客戶最好的服務**。

---

## 5. 連續收到多封 alert 怎麼辦？

### 5.1 同一營隊連續多封

| 觀察 | 意義 | 對策 |
|---|---|---|
| 同一營隊在 5 分鐘內 3 封 | Sheets 沒改好或您改完又改錯 | 檢查 §3 對照表、用 §6 工具確認格式 |
| 同一營隊改好後仍持續 | 可能 Sheets 未存檔 | Cmd+S 強制存檔、重整網頁確認 |

### 5.2 多營隊都觸發 alert

| 觀察 | 可能原因 | 對策 |
|---|---|---|
| 半天內 5+ 不同營隊都 alert | 整份 Sheets 模板有系統性錯誤（如複製貼上時格式被改）| 立刻通知 Jackson、暫停報名 |
| 新增的梯次都 alert | 新增時 C 欄格式沒注意 | 對照業務手冊 2 §3 重做 |

> 🚨 **多營隊集體 alert 是嚴重訊號**。立刻通知 Jackson、考慮暫時關閉 Tally 表單到查清為止。

---

## 6. 進階：如何快速檢查整份 Sheets 的 C 欄

在 Sheets 任一空白格輸入：

```
=ARRAYFORMULA(IF(C2:C="";"";IF(ISDATE(C2:C);"✅";"❌格式錯")))
```

整列 C 欄會在旁邊顯示 ✅（正確）或 ❌（錯誤），一目了然。

> 💡 建議在每次大幅更新 Sheets 後跑一次此檢查。

---

## 7. 誤觸發 alert 怎麼判斷？

| 場景 | 判斷 | 動作 |
|---|---|---|
| C 欄看起來是 `2026-12-15` 但仍 alert | 可能有看不見的空白字元 | 把該格清空、重打 |
| C 欄是 `2026-12-15` 且一切正常 alert 仍進來 | 可能是 Make 系統 bug 或 token issue | 通知 Jackson |
| Email 中「Sheets 8.`3` 原始值」與您看到的 Sheets 不同 | 系統與 Sheets 同步延遲 | 重整 Sheets、等 1 分鐘再看 |

---

## 8. FAQ

### Q1：alert email 寄到哪？

A：`hello@sigellabs.com`（管理員監控信箱）。

### Q2：每筆異常報名都會寄一封 alert 嗎？

A：是的。一筆報名觸發 1 封 alert，5 個家長都報名同一個格式錯的營隊就會收到 5 封。

### Q3：alert 會影響家長嗎？

A：完全不會。fail-safe 已守住金額，家長收到的是正常期金額的 email，全程無感知。

### Q4：alert 寄到後，我如果一週沒看，會怎樣？

A：那一週的所有相關營隊報名都以 normal 處理。除了客戶失去早鳥優惠，沒有資料損壞。

### Q5：alert email 主旨可以加 filter 自動分類嗎？

A：可以。Gmail filter 規則建議：
- From: 含 SendGrid sender 信箱
- Subject 含 `[ALERT] Make scenario 4596472`
- 套標籤：「Make Alert」+「未讀提醒」

### Q6：可以把 alert 改寄到 Slack 嗎？

A：技術上可以（換 Module 28 的 webhook 為 Slack webhook），但需要 Jackson 修系統。建議目前先用 email。

### Q7：什麼時候不需要修 Sheets？

A：當該營隊**已過早鳥期且不會再有早鳥優惠**時，C 欄填空白其實也合理（系統會 fallback 為 normal）。但仍建議填入歷史日期（如該營隊真實的早鳥截止日），避免每筆報名都觸發 alert。

---

## 9. 升級路徑：未來若 alert 太多怎麼辦？

| 改善方向 | 預計效果 | 工作量 |
|---|---|---|
| Slack webhook 取代 email | 集中通知不淹沒信箱 | 0.5 天 |
| 每日聚合一次（每天最多 1 封）| 大幅降低噪音 | 1 天 |
| 在 Sheets 加 Google Apps Script 預檢 C 欄 | 改 Sheets 時即時提示格式錯 | 1 天 |

> 💡 視冬令營實際運作狀況再決定是否升級。

---

## 10. 其他資源

| 資源 | 連結 |
|---|---|
| 業務手冊 1：Tally 表單維護 | [01-tally-form-maintenance.md](./01-tally-form-maintenance.md) |
| 業務手冊 2：Sheets 維護 | [02-sheets-maintenance.md](./02-sheets-maintenance.md) |
| 緊急聯絡 | Jackson（內部聯絡方式）|

---

## 11. 維護紀錄

| 日期 | 變更 | 變更者 |
|---|---|---|
| 2026-05-06 | 初版（alert 收件人為 hello@sigellabs.com）| Jackson + Claude（Cowork） |
