# Issue #6 實作 Spec：多營隊 Iterator「勾 2 寫 6」修復（**v2**）

| 項目 | 內容 |
|---|---|
| Issue | [#6](https://github.com/Jackson888kuo/sigellabs-camp-registration/issues/6) |
| Bug 報告 | [`docs/bugs/2026-04-28_multi_camp_registration_iterator_bug.md`](../bugs/2026-04-28_multi_camp_registration_iterator_bug.md) |
| 優先級 | 🟠 P1（依 Sprint W18-W20 調整後） |
| Sprint | [Winter Camp Prep 2026](../sprints/2026-W18-W20-winter-camp-prep.md) |
| 排程 | 2026-04-30 ~ 2026-05-02（W18，1.5 天） |
| Scenario | `4596472`（太陽實驗室 — 團報自動化 v5.1） |
| Team ID | `2085532` |
| 採用方案 | **方案 A v2：Iterator 改 iterate 全 fields[] + 兩 AND Filter（CHECKBOXES 模式）** |
| Spec 版本 | **v2（4/30 重寫）**；v1 已 deprecated（方向錯誤，假設 Tally 為單一 MULTIPLE_CHOICE） |
| 還原狀態 | ✅ 4/29 PM 改動已從 Make Versions 4/28 23:19 還原；當前 scenario = v6 production 乾淨狀態 |
| 目前狀態 | ⬜ 待 Jackson 在新對話依 §5 步驟在 Make Editor UI 操作 |

---

## 0. 變更摘要（v1 → v2）

| 面向 | v1（4/29 失敗方向） | v2（4/30 重寫，基於真實 webhook payload） |
|---|---|---|
| Tally 結構假設 | 單一 MULTIPLE_CHOICE 欄位含 `options[]` 集合 | **6 個獨立 CHECKBOXES fields**（每營隊一個） |
| Iterator 來源 | `{{get(map(1.data.fields; "options"; "label"; "報名營隊"); 1)}}` | **`{{1.data.fields}}`**（iterate 全 15 fields） |
| 過濾方式 | Filter `contains(...)` IML hack | **Filter 兩個 AND rules**（純 UI Operator） |
| 5.value 結構 | `{id, text}` object | `{key, label, type, value}` field object |
| 下游取營隊名 | `{{5.value.text}}` | **`{{replace(replace(5.value.label; "孩子要報名哪些營隊？("; ""); ")"; "")}}`** |
| 影響範圍 | 4 處下游 ref（label-based） | 4 處下游 ref（**改用 substring 解析**） |

**為何 v1 失敗**：v1 假設 Tally `MeYEJ8` 表單把多選做成「單一欄位 with `options[]` 子陣列」，實際 4/29 PM testing0944_T1 webhook 證實該 Tally 把多選拆成 **6 個獨立 CHECKBOXES**（label = `孩子要報名哪些營隊？(營隊全名)`、value = empty 或 option ID）。詳見 [`memory/feedback_make_iml_tally_label_vs_key.md`](../../) 與 [`memory/reference_tally_form_checkboxes_structure.md`](../../)。

---

## 1. 背景與症狀回顧

### 1.1 問題描述

當家長在 Tally 勾選「兩個以上營隊」分支、實際勾選 N 個營隊（1 < N < 6）時，Make scenario 會將該家長寫入 **6 筆** 報名追蹤表 + 寄出 **6 張** 繳費卡片，包含未勾選的營隊。

### 1.2 證據（2026-04-28 testing0944 案例）

| 預期 | 實際 |
|---|---|
| 2 筆（電學營、Game Designer） | 6 筆（含 4 個未勾選營隊） |
| 2 張繳費卡片 | 6+ 張繳費卡片 |

詳見：[Bug 報告](../bugs/2026-04-28_multi_camp_registration_iterator_bug.md)。

---

## 2. v1 失敗回顧（4/29 PM 教訓）

| 時段 | 動作 | 結果 |
|---|---|---|
| 4/29 12:37 UTC（20:37 Taipei）| 拉 v6 production blueprint snapshot | ✅ `docs/snapshots/blueprint_v6_pre_issue6.json` |
| 4/29 21:00 ~ 22:36 | 依 v1 spec 改 Module 5 Array IML 為 `get(map(...; "options"; "label"; "報名營隊"); 1)` 並加 Filter | ⚠️ 改完所有 fields lookups 都失敗 |
| 4/29 22:51:23 | Tally testing0944_T1 提交 | ⚠️ Module 5 OUTPUT 空、Filter 永遠 false |
| 4/29 22:55 | 從 webhook OUTPUT 分析發現 Tally 是 6 CHECKBOXES，不是單一 MULTIPLE_CHOICE | 🚨 v1 spec 整套方向錯誤 |
| 4/30 AM | 從 Make Versions UI Restore 4/28 23:19 版本 + Save | ✅ scenario 回到 v6 production 乾淨狀態 |
| 4/30 AM | 重寫為 v2 spec（本文件）| ⬜ 待主操作 |

**關鍵教訓**：

1. **動 IML 前一定先看真實 webhook payload**，不要假設結構（v1 預設 Tally 多選 = `MULTIPLE_CHOICE with options[]` 是錯的）
2. **不能用 v6 production blueprint 的 IML 當參考**（`question_bkOj1Z` 是失效的、連單選都不會運作）
3. **不能用舊 Phase 5 blueprint 的 IML 當參考**（label `"報名營隊"` 與當前 form 不符）
4. **API 純文字 PATCH reference token IML 有風險**（feedback_make_iml_api_risk）—v2 主操作仍要用 UI 拖拉

---

## 3. v2 根因分析（基於真實 webhook payload）

### 3.1 Tally form `MeYEJ8` 真實結構（2026-04-29 22:51:23 testing0944_T1 確認）

```json
{
  "data": {
    "fields": [
      ... // fields 1-11 (基本資料、團報人數、營隊數量等)
      {
        "key": "question_PE01L1_a199674a-5a77-49c3-8c58-22e0260e70f8",
        "label": "孩子要報名哪些營隊？([運算思維] Game Designer！小小遊戲設計師營隊)",
        "type": "CHECKBOXES",
        "value": "empty"  // 沒勾選；勾選時為 option ID 字串
      },
      ... // 共 6 個營隊各 1 field（key 前綴 question_PE01L1_）
    ]
  }
}
```

| 屬性 | 值 / 模式 |
|---|---|
| Total `fields[]` 數量 | **15**（不只 8 — 含每個 conditional 分支的問題）|
| 多選營隊 fields 數量 | 6（每營隊一個 CHECKBOXES）|
| key 共用前綴 | `question_PE01L1_` 後接每營隊獨立 UUID |
| label 格式 | `孩子要報名哪些營隊？([營隊全名])` |
| type | `CHECKBOXES`（不是 `MULTIPLE_CHOICE`）|
| value 勾選時 | option ID 字串（e.g. `"a199674a..."`） |
| value 未勾選時 | 字串 `"empty"`（注意：不是 null、不是空字串）|
| **沒有** options[] / 單一 value[] array | ❌ |

### 3.2 為何 v6 production 仍踩到 bug

v6 production Module 5 Array IML：

```iml
{{map(get(map(1.data.fields; "options"; "key"; "question_bkOj1Z"); 1); "text"; "id"; get(get(map(1.data.fields; "value"; "key"; "question_bkOj1Z"); 1); 1))}}
```

兩層 `map(...; "key"; "question_bkOj1Z")` 找不到任何欄位（因為實際 fields 沒有這個 key 也沒有 options 屬性）→ `get(...; 1)` 取 null → 外層 `map(...; "text"; "id"; null)` Make IML fallback 為「不過濾、回傳全部 mapped」。但因 inner array 也是 null，最終結果 fallback 為「枚舉所有 fields 的 text 屬性」— 約等於 6 cycles，但內容是錯的。**症狀完全符合**「勾 2 寫 6」。

### 3.3 v2 設計核心思路

| 原則 | 做法 |
|---|---|
| 不再假設 Tally 結構 | Iterator 直接 iterate 全 `1.data.fields[]`（15 個 field objects） |
| 過濾交給 Filter | Filter on connection 用兩個 AND rules：①label contains「孩子要報名哪些營隊？」（鎖定 6 個 CHECKBOXES）②value not equal `"empty"`（鎖定被勾選的） |
| 下游解析營隊名 | 從 `5.value.label` 用 `replace()` 砍前綴 + 後綴 `)`，得 `[運算思維] Game Designer！...`（與 Phase 5 活動設定表 A 欄相符） |

---

## 4. 修復方案

### 4.1 採用：方案 A v2

**理由**：

- 不動 Tally 表單（已上線、無需重新發佈）
- 純 Make-side 改動，每步驟可獨立還原
- 不依賴 Tally `key` 或某固定 `label`，**對 Tally form 結構變化容忍度高**
- 與 scenario 其他 11 處 `label`-based field lookup 一致
- Filter 用標準 UI Operator（不需 IML hack）

### 4.2 v2 與三個方案再對照

| # | 方案 | 為何不選 |
|---|---|---|
| **A v2** | **iterate 全 fields + 兩 AND Filter + label 解析** | ✅ 採用 |
| B | Tally 表單新增「勾選營隊文字」hidden formula field | 動 Tally form 需重新發佈、跨系統耦合 |
| C | 在 Module 5 前新增 SetVariables 預先計算 | 多一個模組、不見得簡化 |

---

## 5. 實作步驟（方案 A v2，全 UI 拖拉）

### 5.1 修改前檢查清單

| # | 動作 | 完成 |
|---|---|---|
| 1 | 確認登入 Make us2.make.com `team 2085532` | ⬜ |
| 2 | 進入 scenario 4596472 → **匯出 blueprint snapshot 備份**（檔名建議：`blueprint_v6_pre_issue6_v2attempt.json`） | ⬜ |
| 3 | 確認當前 Module 5 Array IML 為 v6 production key-based 長公式（4/30 已還原狀態）| ⬜ |
| 4 | 確認 Module 5 → Module 8 連線**無 Filter** | ⬜ |
| 5 | 確認 Tally 測試表單可送出（用 testing0944 系列 payload） | ⬜ |

### 5.2 主操作步驟

#### Step 1：修改 Module 5（Iterator）的 Array 來源

| 步驟 | 動作 |
|---|---|
| 1.1 | 進入 Make Editor：`https://us2.make.com/2085532/scenarios/4596472/edit` |
| 1.2 | 點 Module 5（Iterator）開啟設定面板 |
| 1.3 | 把 **Array** 欄位內容**整段刪除** |
| 1.4 | **從左側資料面板拖拉** Webhook → `data` → `fields[]`（整個 array）進入 Array 欄位 |
| 1.5 | 結果應為 `{{1.data.fields}}` 的彩色 token，**不要鍵盤手打** |
| 1.6 | 點 OK 儲存（dialog 級） |

#### Step 2：在 Module 5 → Module 8 連線上新增 Filter（兩個 AND Rules）

| 步驟 | 動作 |
|---|---|
| 2.1 | 滑鼠移到 Module 5 與 Module 8 之間的連線 |
| 2.2 | 出現「扳手」圖示 → 點選 → **Set up a filter** |
| 2.3 | Filter label：`勾選營隊 only` |
| 2.4 | **Condition Rule 1**：左側拖拉 Module 5 → `value.label`；Operator = **Text operators → Contains**；Value = `孩子要報名哪些營隊？` |
| 2.5 | 點 Rule 1 右下「+ AND」加第二條規則 |
| 2.6 | **Condition Rule 2**：左側拖拉 Module 5 → `value.value`；Operator = **Text operators → Not equal to**；Value = `empty` |
| 2.7 | 確認兩條規則為 **AND** 關係（垂直排列、無「OR」標籤） |
| 2.8 | 點 OK 儲存 |

#### Step 3：依序修改 4 處下游 5.value reference

> ⚠️ **每處都用 UI 左側面板拖拉新 token**（顯示為彩色膠囊），**禁止鍵盤直接打字 `5.value.label`** — 純文字 reference 在 IML 執行階段會 resolve 失敗（[`memory/feedback_make_iml_api_risk.md`](../../)）。
> 可以打字的部分僅限 IML 函式名（`replace(`、`)`、`;`、字面字串 `"孩子要報名哪些營隊？("`、`")"`）。

| 序 | 模組 | 欄位 | 改動前 | 改動後 |
|---|---|---|---|---|
| 3.1 | Module 8（Sheets filterRows） | `filter[0][0].b` | `{{5.value}}` | `{{replace(replace(5.value.label; "孩子要報名哪些營隊？("; ""); ")"; "")}}` |
| 3.2 | Module 10（SetVariables）`payment_button_html` | `🏕️{{5.value}}` | `🏕️{{5.value}}` | `🏕️{{replace(replace(5.value.label; "孩子要報名哪些營隊？("; ""); ")"; "")}}` |
| 3.3 | Module 11（HubSpot createDeal） | `dealname`（含 `× {{5.value}}`） | `× {{5.value}}` | `× {{replace(replace(5.value.label; "孩子要報名哪些營隊？("; ""); ")"; "")}}` |
| 3.4 | Module 13（Sheets addRow） | `values["5"]` | `{{5.value}}` | `{{replace(replace(5.value.label; "孩子要報名哪些營隊？("; ""); ")"; "")}}` |

**操作建議**：每處都用「先拖拉 5.value.label 進空欄位 → 在外圍包 replace(replace(...; "孩子要報名哪些營隊？("; ""); ")"; "")」的方式構建。

#### Step 4：儲存 Scenario

點底部 toolbar 的 💾 **Save**（或按 ⌘S），等待紅點消失。

#### Step 5：Run once 觸發測試

點 Make Editor 上方的 **Run once** 按鈕，等待 webhook waiting，再執行 §7 測試。

---

## 6. IML 公式集（複製貼用）

### 6.1 Module 5 Array

```iml
{{1.data.fields}}
```

> ⚠️ 必須 UI 拖拉產生，不能手打文字。

### 6.2 Filter「勾選營隊 only」

| Rule | 左值（拖拉）| Operator | 右值（手打） |
|---|---|---|---|
| 1 | `5.value.label` | Text operators → Contains | `孩子要報名哪些營隊？` |
| 2 (AND) | `5.value.value` | Text operators → Not equal to | `empty` |

### 6.3 下游 4 處 ref（替換 `5.value`）

```iml
{{replace(replace(5.value.label; "孩子要報名哪些營隊？("; ""); ")"; "")}}
```

> 解析範例：
> `孩子要報名哪些營隊？([運算思維] Game Designer！小小遊戲設計師營隊)`
> → `[運算思維] Game Designer！小小遊戲設計師營隊`

**注意**：此 IML 假設**營隊名稱中不含 `)`**。若未來新增的營隊名含 `)`，要改用 substring 法（見 §6.4）。

### 6.4 備援：substring 法（營隊名含 `)` 時用）

```iml
{{substring(5.value.label; 11; sub(length(5.value.label); 1))}}
```

說明：前綴 `孩子要報名哪些營隊？(` = 11 字元；尾端 `)` 共 1 字元；所以 startIndex=11、endIndex=length-1。

---

## 7. 影響範圍清單（4 處下游 ref）

| 模組 | 路徑 | 改動前 | 改動後 | UI 拖拉位置 |
|---|---|---|---|---|
| Module 5 | `mapper.array` | v6 production key-based 長公式 | `{{1.data.fields}}` | Module 5 Array 欄位 |
| 5→8 連線 | filter | （無）| 兩個 AND rules（§6.2） | 連線扳手 |
| Module 8 | `filter[0][0].b` | `{{5.value}}` | §6.3 IML | Module 8 → Filter Row → A 欄條件 |
| Module 10 | `variables[4].value` 內 `🏕️{{5.value}}` 該段 | `🏕️{{5.value}}` | `🏕️` + §6.3 IML | Module 10 → variables[4] payment_button_html |
| Module 11 | `properties[0].value` 內 `× {{5.value}}` 該段 | `× {{5.value}}` | `× ` + §6.3 IML | Module 11 → properties[0] dealname |
| Module 13 | `values["5"]` | `{{5.value}}` | §6.3 IML | Module 13 → 第 6 欄（index 5）|
| Module 14 | feeder reference | `feeder: 5` | 不變 | — |

---

## 8. 驗證計畫

### 8.1 三組測試案例

| # | 案例 | Tally 勾選 | 預期 Module 5 OUTPUT cycles | Filter 後 cycles | 預期 Sheets 列數 | 預期 email 卡片數 |
|---|---|---|---|---|---|---|
| T1 | 單一營隊 | 電學營（1 個） | 15（全 fields） | 1 | 1 | 1 |
| T2 | 兩個營隊 | 電學營 + Game Designer（2 個） | 15 | 2 | 2 | 2 |
| T3 | 三個營隊 | 電學營 + Game Designer + 影像營（3 個） | 15 | 3 | 3 | 3 |

每組測試流程：

| 步驟 | 動作 | 預期 |
|---|---|---|
| 8.1.1 | Make Editor 點 Run once | webhook 待機 |
| 8.1.2 | Tally 表單送出對應勾選的測試 payload | scenario 觸發 |
| 8.1.3 | 看 Module 5 OUTPUT bubbles | bubbles 數 = 15（全 fields，**非錯誤**）|
| 8.1.4 | 看 Filter 後 cycles | 通過 cycles 數 = 勾選數 |
| 8.1.5 | 看 Module 8/10/11/13 各自 OUTPUT | 收到的營隊名 = 解析後的中文營隊全名（不含括號、不含「孩子要報名哪些營隊？」前綴）|
| 8.1.6 | 看 Module 13 OUTPUT | row append 次數 = 勾選數 |
| 8.1.7 | 開 Google Sheets「報名追蹤表」 | 新增列數 = 勾選數，營隊欄為對應名稱 |
| 8.1.8 | 開 Gmail（jacksonkuo@gmail.com） | 卡片數 = 勾選數，每張對應正確金額/連結 |

### 8.2 Regression 檢查

| # | 既有功能 | 預期保持 |
|---|---|---|
| R1 | 單營隊報名（與 T1 同） | 維持 v6 既有行為 |
| R2 | 早鳥/正常期切換（Module 9 period） | 不受影響（Module 9 不引用 5.value）|
| R3 | payment_button_html 渲染（Issue #1 修復後）| 不受影響 — `replace()` 解析後字串可正確注入 |
| R4 | HubSpot Deal 建立（每營隊一筆 Deal） | 數量正確、associations 正確 |

### 8.3 Edge Case

| 情境 | 預期 |
|---|---|
| Tally 勾選 6 個營隊 | 6 列、6 卡片（並非 bug）|
| Tally 勾選 0 個營隊（被 Tally required 擋下） | 不應觸發 webhook |
| Tally 勾選後該營隊不在活動設定表 | Module 8 filterRows 回傳 0 列 → Module 9–13 處理 nullable 邏輯（Sprint #8 處理）|
| 解析後營隊名不含括號 | ✅ replace() 砍前綴「孩子要報名哪些營隊？(」+ 尾端「)」後正確 |
| 營隊名中含 `)` | ⚠️ replace() 會誤砍；改用 §6.4 substring 法 |

---

## 9. 風險與緩解

| # | 風險 | 機率 | 影響 | 緩解 |
|---|---|---|---|---|
| 1 | UI 拖拉時手鍵 reference 名稱導致 IML resolve 失敗 | 🟡 中 | 🔴 高 | 嚴格用左側面板拖拉，僅 IML 函式名與字面字串可手鍵 |
| 2 | 4 處 ref 漏改造成下游模組顯示原始 label（含「孩子要報名哪些營隊？(」前綴） | 🟡 中 | 🟡 中 | §7 表格逐項勾選；T1 看 Module 13 OUTPUT 確認營隊名乾淨 |
| 3 | Filter 條件 IML 寫錯導致全擋或全放 | 🟡 中 | 🔴 高 | T1/T2/T3 三組 Run once 看 cycles 數；若 cycles=15 → Filter 全放；cycles=0 → Filter 全擋 |
| 4 | 營隊名含 `)` 導致 replace() 誤砍 | 🟢 低 | 🟡 中 | §6.4 提供 substring 備援；上線前看活動設定表 A 欄確認 6 營隊名格式 |
| 5 | Make blueprint 版本衝突 | 🟢 低 | 🟢 低 | Step 0 先匯出 snapshot；任何時候出錯可從 Make Versions UI 還原 |
| 6 | v2 主操作中又踩到非預期 Tally 結構 | 🟢 低 | 🔴 高 | Step 5.1 驗證流程嚴格進行；遇到結構不符立即停手、檢視 webhook OUTPUT |

---

## 10. 完成驗收 Checklist

| # | 項目 | 完成 |
|---|---|---|
| 1 | blueprint snapshot 已匯出備份 `blueprint_v6_pre_issue6_v2attempt.json` | ⬜ |
| 2 | Module 5 Array IML 已改為 `{{1.data.fields}}` | ⬜ |
| 3 | Module 5 → Module 8 連線已加 Filter「勾選營隊 only」（兩 AND rules） | ⬜ |
| 4 | Module 8 `filter[0][0].b` 已改為 §6.3 IML | ⬜ |
| 5 | Module 10 `payment_button_html` 內 `🏕️` 後 ref 已改 | ⬜ |
| 6 | Module 11 `dealname` 內 `× ` 後 ref 已改 | ⬜ |
| 7 | Module 13 `values["5"]` 已改 | ⬜ |
| 8 | Scenario 已 Save | ⬜ |
| 9 | T1 單營隊測試 pass（Module 5 cycles=15、Filter 後=1）| ⬜ |
| 10 | T2 雙營隊測試 pass（Filter 後=2）| ⬜ |
| 11 | T3 三營隊測試 pass（Filter 後=3）| ⬜ |
| 12 | Regression R1–R4 通過 | ⬜ |
| 13 | Module 13 OUTPUT 確認營隊名無「孩子要報名哪些營隊？(」前綴與尾端「)」| ⬜ |
| 14 | 關閉 Issue #6、更新 memory `project_group_registration_v2.md` | ⬜ |

---

## 11. 1.5 天執行時間表（v2 修訂）

| 日期 | 階段 | 動作 | 完成 |
|---|---|---|---|
| 2026-04-30（四）AM | 預檢 | §5.1 檢查清單；snapshot 備份；確認還原狀態 | ✅（4/30 AM Cowork 已完成還原）|
| 2026-04-30（四）PM | 主操作（前半） | Step 1 改 Module 5 Array `{{1.data.fields}}`；Step 2 加 Filter（兩 AND）| ⬜ |
| 2026-05-01（五）AM | 主操作（後半） | Step 3 改 4 處 ref；Step 4 Save | ⬜ |
| 2026-05-01（五）PM | 驗證 T1 + T2 | T1 單營隊、T2 雙營隊 Run once + Tally 測試 | ⬜ |
| 2026-05-02（六）AM | 驗證 T3 + Regression | T3 三營隊；Regression R1–R4 | ⬜ |
| 2026-05-02（六）PM | 收尾 | 更新 Issue #6 comment + memory；Project Board → ✅ Done；接 Issue #2 驗收 | ⬜ |

> 💡 若任一驗證失敗：立即從 Make Versions UI Restore 4/28 23:19 還原，將 Issue 移回 🔨 Building，於 Sprint buffer 日（5/14）再排修。

---

## 12. 與 Sprint 其他 Issue 的關聯

| Issue | 關聯 | 處理 |
|---|---|---|
| #2 多營隊驗收測試 | Issue #6 完成後即進行 | T1/T2/T3 同時涵蓋 #2 驗收 |
| #1 Module 10 payment_button_html 動態化 | #6 改 5.value 為 §6.3 IML，#1 spec 內 Module 10b token 拖拉時須用新版 | #1 在 §3.5 token 1 拖拉時改成 §6.3 IML |
| #3 早鳥日期防呆 | 無直接關聯 | 獨立進行 |
| #8 J 欄無表頭 + IML 未解析 | 無直接關聯（Sheets 寫入欄位不同） | 獨立進行 |

---

## 13. 維護紀錄

| 日期 | 變更 | 變更者 |
|---|---|---|
| 2026-04-29 AM | v1 初版建立（依 Sprint W18-W20 規劃；以舊 phase5 blueprint 為基礎） | Jackson + Claude（Cowork） |
| 2026-04-29 PM | v1 修正：對比 v6 production blueprint 後重大修正 §2、§4.3、§4.4、§5、Module 13 索引 | Jackson + Claude（Cowork） |
| 2026-04-29 22:51 | testing0944_T1 Tally 提交，從 webhook OUTPUT 確認 Tally 為 6 CHECKBOXES，v1 spec 整套方向錯誤 | Jackson + Claude |
| 2026-04-30 AM | 從 Make Versions UI Restore 4/28 23:19；scenario 還原至動工前乾淨狀態 | Jackson + Claude（Cowork） |
| 2026-04-30 AM | **v2 重寫**：Iterator 來源改為 `{{1.data.fields}}`；Filter 改兩個 AND rules；下游 4 處 ref 改用 `replace()` 解析 label 取營隊名 | Jackson + Claude（Cowork） |

---

*文件建立日期：2026-04-29　v2 重寫日期：2026-04-30　Sprint：Winter Camp Prep 2026　目標完成日：2026-05-02*
