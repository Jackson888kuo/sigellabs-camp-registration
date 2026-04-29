# Issue #6 實作 Spec：多營隊 Iterator「勾 2 寫 6」修復

| 項目 | 內容 |
|---|---|
| Issue | [#6](https://github.com/Jackson888kuo/sigellabs-camp-registration/issues/6) |
| Bug 報告 | [`docs/bugs/2026-04-28_multi_camp_registration_iterator_bug.md`](../bugs/2026-04-28_multi_camp_registration_iterator_bug.md) |
| 優先級 | 🟠 P1（依 Sprint W18-W20 調整後） |
| Sprint | [Winter Camp Prep 2026](../sprints/2026-W18-W20-winter-camp-prep.md) |
| 排程 | 2026-04-30 ~ 2026-05-02（W18，1.5 天） |
| Scenario | `4596472`（太陽實驗室 — 團報自動化 v5.1） |
| Team ID | `2085532` |
| 採用方案 | **方案 A：Iterator 改 iterate options[] + 新增 Filter**（完全 UI 拖拉） |
| 目前狀態 | ⬜ 待 Jackson 在 Make Editor UI 操作 |

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

## 2. 根因分析（2026-04-29 v6 blueprint 對比後修正版）

### 2.1 Module 5（Iterator/BasicFeeder）v6 production 實際 IML

```iml
{{map(get(map(1.data.fields; "options"; "key"; "question_bkOj1Z"); 1); "text"; "id"; get(get(map(1.data.fields; "value"; "key"; "question_bkOj1Z"); 1); 1))}}
```

> ⚠️ **此 IML 與舊 phase5 blueprint 不同** — 舊版用 `"label"; "報名營隊"`，現行 v6 改用 `"key"; "question_bkOj1Z"`，並多了一層 `get(...; 1)` 取第一個元素。

### 2.2 重大發現：Module 5 是整個 scenario 唯一用 key-based 的模組

對 v6 blueprint 全文掃描 `1.data.fields` 的引用方式：

| 引用方式 | 出現次數 | 模組 |
|---|---|---|
| `label`-based | **11 處** | Module 2, 9, 10（多處）, 11, 13 |
| `key`-based | **1 處** | **Module 5（唯一）** |

**關鍵對照**：Module 10 的 `group_size_text` 用了**和 Module 5 完全相同的 IML pattern**（`map(...) → get → map(options; text; id; selected) → get`），但用 `"label"; "團報人數"` → 運作正常。

### 2.3 根因確定

| 假設 | 結論 |
|---|---|
| **H5：`question_bkOj1Z` 不是有效的 Tally 欄位 key** | ✅ 確認 — 兩層 `map(...; "key"; "question_bkOj1Z")` 皆回傳空 → `get(...)` 取出 `null` → 外層 `map(...; "text"; "id"; null)` Make IML fallback 為「不過濾、回傳全部 mapped」→ 6 個營隊全寫入，完全符合症狀 |
| H1（舊版假設）：Iterator 來源錯誤 | 🟡 部分對 — 結果是錯的，但機制不是 array filter 失效，而是 key 不存在導致 fallback |
| H2（舊版假設）：缺少 Filter 過濾 | ✅ 仍然成立 — 即使 key 修對，沒 Filter 也擋不住「全選」場景 |
| H3：Tally 多選 parse 失敗 | ❌ 否決 — Tally 沒問題，是 IML 用了壞 key |
| H4：分支 regression | ❌ 否決 |

### 2.4 為何單選分支沒踩到此 bug

Make IML 的 4-arg `map()` 在 `filterValue` 為 `null` 時，fallback 為「不過濾」回傳全部。但**單選**情境下這個 fallback 也會吐 6 個營隊文字 — 然後 Iterator 跑 6 cycles，每 cycle 在 Module 8 filterRows 用 `{{5.value}}` 去比對活動設定表 → 6 個都比中（因為 6 列都是有效營隊名）→ 6 列追蹤表寫入。

**所以單選情境其實也踩到 bug，只是症狀沒被注意到** — 因為大部分人單選一個營隊就不會檢查為什麼追蹤表多了 5 列其他營隊。

> 📌 對照 H5 之後再驗證一次：testing0944 那筆 bug 報告（4/28）已是 v6 IML 上線後的紀錄，confirms key-based IML 從 v6 開始就壞掉了。

### 2.5 新發現：v6 與舊 phase5 blueprint 的其他差異（不影響本次修法但要知道）

| 項目 | 舊 phase5 | v6 production |
|---|---|---|
| Module 13 營隊欄索引 | `values["6"]` | `values["5"]` |
| Module 14 Aggregator | 單一 value 欄 | `parent_email` + `payment_button_html` 兩欄 |
| Module 9 period 公式 | 含 `isEmpty` fallback | 簡化版（移除 fallback）|
| Module 11 自訂欄位 | 含 `child_1_deal_course` 等 | 已移除，僅保留 5 個基本欄位 |

---

## 3. 修復方案比較

### 3.1 三方案對照

| # | 方案 | 改動範圍 | 優點 | 缺點 | 風險 |
|---|---|---|---|---|---|
| **A** | **Iterator 改 iterate `options[]` + 新增 Filter 過濾未勾選 ID** | Module 5 IML + 新增 Filter on connection + 5 處 `5.value` ref 改成 `5.value.text` | 純 Make-side、可逆、不動 Tally form、語意清楚 | 5 處 ref 需 UI 重新拖拉、Filter 條件 IML 較長 | 🟢 低（每步驟可獨立驗證） |
| B | Tally 表單新增「勾選營隊文字」hidden formula field | Tally 表單 + Module 5 IML 簡化 | IML 大幅簡化、Module 5 直接 `split()` | 動 Tally form 需重新發佈、跨系統耦合 | 🟡 中 |
| C | 在 Module 5 前新增 SetVariables 預先計算 selected_texts | 新增模組 + Module 5 IML 改 ref | 集中邏輯 | 仍受 IML 4-arg map 限制、可能無解 | 🔴 高（核心邏輯仍卡） |

### 3.2 採用：方案 A

**理由**：
- 不動 Tally 表單（已上線、無需重新發佈）
- 純 Make-side 改動，每步驟可獨立還原
- 利用 Make 既有 Filter 機制（標準功能，非 IML hack）
- 可重現性高，未來若再遇 multi-select 多選都可套用此 pattern

---

## 4. 實作步驟（方案 A，全 UI 拖拉）

### 4.1 修改前檢查清單

| # | 動作 | 完成 |
|---|---|---|
| 1 | 確認登入 Make us2.make.com `team 2085532` | ⬜ |
| 2 | 進入 scenario 4596472 → **匯出 blueprint snapshot 備份**（檔名建議：`blueprint_v??_pre_issue6.json`） | ⬜ |
| 3 | 確認目前 blueprint 版本（Make UI 右上版本號）並記錄到本 spec §8 | ⬜ |
| 4 | 確認目前 Module 5 IML 與本 spec §2.1 一致 | ⬜ |
| 5 | 確認 Tally 測試表單可送出（用 `testing0944` payload） | ⬜ |

### 4.2 主操作步驟

#### Step 1：修改 Module 5（Iterator）的 array 來源

| 步驟 | 動作 |
|---|---|
| 1.1 | 進入 Make Editor：`https://us2.make.com/2085532/scenarios/4596472/edit` |
| 1.2 | 點 Module 5（Iterator）開啟設定面板 |
| 1.3 | 把 **Array** 欄位內容**整段刪除** |
| 1.4 | 重新組合新 IML（見下方 §4.3） |
| 1.5 | 點 OK 儲存 |

#### Step 2：在 Module 5 → Module 8 連線上新增 Filter

| 步驟 | 動作 |
|---|---|
| 2.1 | 滑鼠移到 Module 5 與 Module 8 之間的連線 |
| 2.2 | 連線會出現「扳手」圖示 → 點選 → **Set up a filter** |
| 2.3 | Filter label 填：`勾選營隊 only` |
| 2.4 | Condition 設定如下（見 §4.4）|
| 2.5 | 點 OK 儲存 |

#### Step 3：依序修改 4 處 `5.value` reference 為 `5.value.text`

> ⚠️ **依 v6 blueprint 實際掃描，只有 4 處**（原 spec 寫 5 處有誤；Module 11 在 v6 已移除 `child_1_deal_course`）

| 序 | 模組 | 欄位 | 改動前 | 改動後 |
|---|---|---|---|---|
| 3.1 | Module 8（Sheets filterRows） | filter conditions[0][0].b | `{{5.value}}` | 刪除 → 從左側面板拖拉 Module 5 的 `value.text` 進入 |
| 3.2 | Module 10（SetVariables）| `payment_button_html` 變數中 `🏕️{{5.value}}` 那段 | `{{5.value}}` | 同上 |
| 3.3 | Module 11（HubSpot createDeal）| `dealname` 中 `× {{5.value}}` | `{{5.value}}` | 同上 |
| 3.4 | Module 13（Sheets addRow）| **`values["5"]`**（v6 索引；舊 phase5 是 6）| `{{5.value}}` | 同上 |

> ⚠️ **關鍵**：每處都用 UI 左側面板拖拉新 token（顯示為彩色膠囊），**禁止鍵盤直接打字 `5.value.text`** — 純文字 reference 在 IML 執行階段會 resolve 失敗（已在 Issue #1 方案 B 踩過此陷阱，詳見 [`feedback_make_iml_api_risk.md`](../../memory/feedback_make_iml_api_risk.md)）。

#### Step 4：儲存 Scenario

點右下角 💾 **Save**，等顯示「Scenario saved」。

#### Step 5：Run once 觸發測試

點 Make Editor 上方的 **Run once** 按鈕，等待 webhook waiting，再執行 §6 測試。

---

### 4.3 Module 5 新 Array IML（複製到 Make UI 多行 textarea）

```iml
{{get(map(1.data.fields; "options"; "label"; "報名營隊"); 1)}}
```

**改動說明**：
- 原 IML（v6 production）：用了 key `question_bkOj1Z`（無效），且巢狀 map 結構複雜
- 新 IML：**改回 label-based**，與 scenario 內其他 11 處引用一致；只取 options 陣列，**不過濾**
- 過濾邏輯改由 Step 2 的 Filter 處理，職責分離

**Iterator 輸出結構變更**：

| 改動前 | 改動後 |
|---|---|
| `5.value` = string（營隊名文字，但因 fallback 是錯的全集）| `5.value` = object `{id, text}` |
| 在下游用 `{{5.value}}` 直接取營隊名 | 改用 `{{5.value.text}}` 取營隊名 |

---

### 4.4 Filter 條件設定（Step 2）

| 欄位 | 值 | 說明 |
|---|---|---|
| Label | `勾選營隊 only` | UI 顯示用 |
| Condition 1 → Item 1 | （見下方 IML） | 此 option 是否在勾選 IDs 中 |
| Operator | **Equal to**（Text operators → Equal to） | 純粹比對 true |
| Value | `true` | 字串 true |

**Condition Item 1 IML**（用拖拉與手鍵組合）：

```iml
{{contains(get(map(1.data.fields; "value"; "label"; "報名營隊"); 1); 5.value.id)}}
```

> 💡 建議組合方式：在輸入欄位先打 `{{contains(}}`，再從左側面板拖拉「Webhook → 1 → data → fields」之類路徑，最後加上 `; 5.value.id)`。可惜 Tally `value` 屬性需要先做 `map`+`get`，這段必須手鍵 — 接受此風險，因為**過濾邏輯無 reference 失敗風險**（不像 HTML 拼接會 truncate）。

> 📌 **重要**：與 Module 5 Array IML 一樣，這裡用 `"label"; "報名營隊"`（與整個 scenario 其他 11 處引用一致），**不要用 `"key"; "question_bkOj1Z"`**（那個 key 是失效的，正是原 bug 來源）。

**Make `contains()` 行為確認**：
- `contains(array; element)` → 若 array 包含 element 回傳 `true`，否則 `false`
- 此處 array = 勾選 ID 陣列；element = 當前 iteration 的 option ID

---

## 5. 影響範圍清單（依 v6 blueprint 實際掃描）

| 模組 | 欄位 | 改動前（v6 production）| 改動後 |
|---|---|---|---|
| Module 5 | Array | key-based 巢狀 IML（用 `question_bkOj1Z`，無效）| `{{get(map(1.data.fields; "options"; "label"; "報名營隊"); 1)}}` |
| 5→8 連線 | Filter | 無 | `contains(selected_ids; 5.value.id) = true` |
| Module 8 | `filter[0][0].b` | `{{5.value}}` | `{{5.value.text}}` |
| Module 10 | `variables[4].value`（payment_button_html）| `{{5.value}}` | `{{5.value.text}}` |
| Module 11 | `properties[0].value`（dealname）| `{{5.value}}` | `{{5.value.text}}` |
| Module 13 | `values["5"]` | `{{5.value}}` | `{{5.value.text}}` |
| Module 14 | feeder reference | `feeder: 5` | 不變 |

> 📌 v6 中 Module 11 已沒有 `child_1_deal_course` 欄位（與舊 phase5 不同），因此不需處理。

---

## 6. 驗證計畫

### 6.1 三組測試案例（依 Sprint §4 驗收條件）

| # | 案例 | Tally 勾選 | 預期 Sheets 列數 | 預期 email 卡片數 |
|---|---|---|---|---|
| T1 | 單一營隊 | 電學營（1 個） | 1 | 1 |
| T2 | 兩個營隊 | 電學營 + Game Designer（2 個） | 2 | 2 |
| T3 | 三個營隊 | 電學營 + Game Designer + 影像營（3 個） | 3 | 3 |

每組測試流程：

| 步驟 | 動作 | 預期 |
|---|---|---|
| 6.1.1 | Make Editor 點 Run once | webhook 待機 |
| 6.1.2 | Tally 表單送出對應勾選的測試 payload | scenario 觸發 |
| 6.1.3 | 看 Module 5 OUTPUT（每 cycle 一個 bubble） | bubble 數 = 勾選數（不是 6） |
| 6.1.4 | 看 Filter 後 cycles | 通過數 = 勾選數 |
| 6.1.5 | 看 Module 13 OUTPUT | row append 次數 = 勾選數 |
| 6.1.6 | 開 Google Sheets「報名追蹤表」 | 新增列數 = 勾選數，營隊欄為對應名稱 |
| 6.1.7 | 開 Gmail（jacksonkuo@gmail.com） | 卡片數 = 勾選數，每張對應正確金額/連結 |

### 6.2 Regression 檢查

| # | 既有功能 | 預期保持 |
|---|---|---|
| R1 | 單營隊報名（與 T1 同） | 維持 v5.1 既有行為 |
| R2 | 早鳥/正常期切換（Module 9 period） | 不受影響 |
| R3 | payment_button_html 渲染（Issue #1 修復後）| 不受影響 — 5.value.text 仍可正確注入 |
| R4 | HubSpot Deal 建立（每營隊一筆 Deal） | 數量正確、associations 正確 |

### 6.3 Edge Case

| 情境 | 預期 |
|---|---|
| Tally 勾選 6 個營隊 | 6 列、6 卡片（並非 bug） |
| Tally 勾選 0 個營隊（被 Tally required 擋下） | 不應觸發 webhook |
| Tally 勾選後該營隊不在活動設定表 | Module 8 filterRows 回傳 0 列 → Module 9–13 處理 nullable 邏輯（Sprint #8 處理） |

---

## 7. 風險與緩解

| # | 風險 | 機率 | 影響 | 緩解 |
|---|---|---|---|---|
| 1 | UI 拖拉時手鍵 reference 名稱導致 IML resolve 失敗 | 🟡 中 | 🔴 高 | 嚴格用左側面板拖拉，不打字（除非 `contains()` 內必要的 `5.value.id`） |
| 2 | 5 處 ref 漏改造成下游模組顯示空字串 | 🟡 中 | 🟡 中 | §5 表格逐項勾選；測試時看 Module 13 OUTPUT 確認營隊名非空 |
| 3 | 改動波及 Issue #1 的 Module 10b（若已實作） | 🟢 低 | 🟡 中 | Issue #6 排在 Issue #1 之前，先做 #6 較安全 |
| 4 | Make blueprint 版本衝突 | 🟢 低 | 🟢 低 | Step 0 先匯出 snapshot；任何時候出錯可 PATCH 還原 |
| 5 | Filter 條件 IML 寫錯導致全擋或全放 | 🟡 中 | 🔴 高 | T1/T2/T3 三組測試中用 Run once 看 cycles 數即可發現 |

---

## 8. 完成驗收 Checklist

| # | 項目 | 完成 |
|---|---|---|
| 1 | blueprint snapshot 已匯出備份（記錄版本：v____） | ⬜ |
| 2 | Module 5 Array IML 已改為新版 | ⬜ |
| 3 | Module 5 → Module 8 連線已加 Filter「勾選營隊 only」 | ⬜ |
| 4 | Module 8 filter A 已改 ref 至 `5.value.text` | ⬜ |
| 5 | Module 10 payment_button_html 內 `5.value.text` 已 UI 拖拉 | ⬜ |
| 6 | Module 11 dealname、child_1_deal_course 已改 | ⬜ |
| 7 | Module 13 values["6"] 已改 | ⬜ |
| 8 | Scenario 已 Save | ⬜ |
| 9 | T1 單營隊測試 pass | ⬜ |
| 10 | T2 雙營隊測試 pass（**Issue #6 核心驗收**） | ⬜ |
| 11 | T3 三營隊測試 pass | ⬜ |
| 12 | Regression R1–R4 通過 | ⬜ |
| 13 | 關閉 Issue #6、更新 memory `project_group_registration_v2.md` | ⬜ |

---

## 9. 1.5 天執行時間表

| 日期 | 階段 | 動作 | 完成 |
|---|---|---|---|
| 2026-04-30（四）AM | Pre-flight | §4.1 檢查清單；blueprint snapshot 備份；對齊 spec | ⬜ |
| 2026-04-30（四）PM | 主操作（前半） | Step 1 改 Module 5 Array；Step 2 加 Filter | ⬜ |
| 2026-05-01（五）AM | 主操作（後半） | Step 3 改 5 處 ref；Step 4 Save | ⬜ |
| 2026-05-01（五）PM | 驗證 T1 + T2 | T1 單營隊、T2 雙營隊 Run once + Tally 測試 | ⬜ |
| 2026-05-02（六）AM | 驗證 T3 + Regression | T3 三營隊；Regression R1–R4 | ⬜ |
| 2026-05-02（六）PM | 收尾 | 更新 Issue #6 comment + memory；Project Board → ✅ Done；接 Issue #2 驗收 | ⬜ |

> 💡 若任一驗證失敗：立即 PATCH 還原 blueprint snapshot，將 Issue 移回 🔨 Building，於 Sprint buffer 日（5/14）再排修。

---

## 10. 與 Sprint 其他 Issue 的關聯

| Issue | 關聯 | 處理 |
|---|---|---|
| #2 多營隊驗收測試 | Issue #6 完成後即進行 | T1/T2/T3 同時涵蓋 #2 驗收 |
| #1 Module 10 payment_button_html 動態化 | #6 改 5.value 為 5.value.text，#1 spec 內 Module 10b token 拖拉時須用新版 | #1 在 §3.5 token 1 拖拉時改成 `5.value.text` |
| #3 早鳥日期防呆 | 無直接關聯 | 獨立進行 |
| #8 J 欄無表頭 + IML 未解析 | 無直接關聯（Sheets 寫入欄位不同） | 獨立進行 |

---

## 11. 維護紀錄

| 日期 | 變更 | 變更者 |
|---|---|---|
| 2026-04-29 AM | 初版建立（依 Sprint W18-W20 規劃；以舊 phase5 blueprint 為基礎） | Jackson + Claude（Cowork） |
| 2026-04-29 PM | 對比 v6 production blueprint 後重大修正：<br>• §2 根因從「array filter 失效」改為「無效 key + fallback 不過濾」<br>• §4.3 IML 改回 label-based（與其他 11 處引用一致）<br>• §4.4 Filter IML 改用 label<br>• §5 待修 5 → 4 處（Module 11 child_1_deal_course 在 v6 已移除）<br>• Module 13 索引從 `values["6"]` 改 `values["5"]` | Jackson + Claude（Cowork） |

---

*文件建立日期：2026-04-29　Sprint：Winter Camp Prep 2026　目標完成日：2026-05-02*
