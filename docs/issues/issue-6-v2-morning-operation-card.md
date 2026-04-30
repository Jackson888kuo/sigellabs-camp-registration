# Issue #6 v2 — 5/1 早晨 30 分鐘操作卡

> **使用方式**：照本卡片由上而下逐步操作，每完成一個 Step 在 checkbox 打 ✅。整套預估 30 分鐘（不含測試）。
> 每個 Step 都附「驗證檢查」，沒過驗證**先停手**，看附帶的「失敗處理」欄。
>
> **配套文件**：
> - `docs/issues/issue-6-implementation-spec.md` — 完整 v2 spec（376 行）
> - `docs/issues/issue-6-v2-token-drag-troubleshooting.md` — 拖拉失敗故障排除卡
> - `scripts/issue-6-precheck.sh` — 預檢一鍵腳本

---

## 0. 開工前 5 分鐘預檢

| # | 動作 | 驗證 | ✅ |
|---|---|---|---|
| 0.1 | `cd ~/Documents/Claude/Projects/太陽實驗室團報流程改進/github-repo/` | pwd 顯示正確路徑 | ⬜ |
| 0.2 | `bash scripts/issue-6-precheck.sh` | 終端最後一行顯示「🎯 預檢全部通過」 | ⬜ |
| 0.3 | 開 Make Editor：`https://us2.make.com/2085532/scenarios/4596472/edit` | 看到 12 個 modules，連線完整 | ⬜ |
| 0.4 | 確認登入身份正確（team 2085532）| 右上角頭像下拉確認 | ⬜ |
| 0.5 | 點 Module 5 看 Array 欄位 = 一長串 `map(get(map(...; "options"; "key"; "question_bkOj1Z"); 1); "text"; "id"; ...)` | 公式存在且為彩色 token | ⬜ |

**任一項目未過 → 立即停手。** 動作：Make Editor → 右下角 Versions → Restore 4/28 23:19 → Save，再重跑 0.2。

---

## 1. Step 1 — 改 Module 5 Array 為 `{{1.data.fields}}`

### 1.1 操作步驟

| # | 動作 | 預期畫面 | ✅ |
|---|---|---|---|
| 1.1.1 | 點 Module 5（Iterator，圓形 icon）| 右側展開 Edit Iterator 面板 | ⬜ |
| 1.1.2 | Array 欄位內按一下進入編輯模式 | 灰色背景變白、顯示 `{x}` 編輯器 | ⬜ |
| 1.1.3 | Cmd+A 全選舊內容 → Backspace 刪光 | Array 欄位變空白 | ⬜ |
| 1.1.4 | 左側資料面板（左欄滾到上方）找 **「1. Custom webhook」** 條目 | 看到 `Webhook` 章節，可展開 | ⬜ |
| 1.1.5 | 展開「1. Custom webhook」→ 找 **`data`** 物件 → 展開 → 找 **`fields[]`** array | `fields[]` 顯示為陣列圖示 `[ ]` | ⬜ |
| 1.1.6 | **滑鼠按住 `fields[]` 整個 array**（不要展開後拖個別 element）→ **拖到 Array 欄位放開** | Array 欄位顯示彩色膠囊 `1. data.fields` | ⬜ |
| 1.1.7 | 點面板下方 **OK** 儲存 dialog | dialog 關閉、Module 5 icon 旁出現紅點 | ⬜ |

### 1.2 驗證檢查

| 檢查 | 通過條件 |
|---|---|
| Array 欄位顯示為**彩色膠囊**（橘色或紫色背景）| 是 ✅ → 繼續 1.3；否 ⚠️ → 看故障排除卡 #1 |
| Hover 該膠囊，顯示 `1. data.fields` | 是 ✅ ；否 ⚠️ |
| 點 toolbar **Run once** → 送 Tally testing payload → 看 Module 5 OUTPUT | 應有 **15 個 bundles**（不是 6、不是 0）| 

### 1.3 失敗處理

| 症狀 | 動作 |
|---|---|
| 無法拖拉 fields[]（拖不動）| 把面板捲到 fields[] 看到「藍色 [ ] 圖示」再試一次 |
| 拖完顯示為「白底純文字 1.data.fields」 | 立即按 Backspace 刪除，不要 OK！再試一次（非彩色膠囊 = metadata 失敗）|
| 完全做不出來 | Versions → Restore 4/28 23:19 → Save，本日跳過 Step 1，明日當面 Cowork |

---

## 2. Step 2 — 在 5→8 連線新增 Filter「勾選營隊 only」

### 2.1 操作步驟

| # | 動作 | 預期畫面 | ✅ |
|---|---|---|---|
| 2.1.1 | 滑鼠移到 Module 5 與 Module 8 之間的**連線線條**上 | 中間出現灰色「扳手 🔧」icon | ⬜ |
| 2.1.2 | 點扳手 icon | 跳出「Set up a filter」dialog | ⬜ |
| 2.1.3 | Filter Label 欄填：`勾選營隊 only` | 上方標籤確認 | ⬜ |
| 2.1.4 | **Condition Rule 1 左值**：左側資料面板找 「**5. Iterator → value → label**」→ 拖到左值欄 | 左值顯示彩色膠囊 `5. value.label` | ⬜ |
| 2.1.5 | **Operator 下拉**：找 **Text operators** → 選 **Contains** | Operator 顯示「Contains」| ⬜ |
| 2.1.6 | **Right value 欄手打**：`孩子要報名哪些營隊？`（可直接複製貼上，含問號）| 右值欄顯示中文字（不必是膠囊）| ⬜ |
| 2.1.7 | 點 Rule 1 右下角 **+ AND** 按鈕（不要點 + OR）| 出現第二條規則欄 | ⬜ |
| 2.1.8 | **Condition Rule 2 左值**：拖「**5. Iterator → value → value**」（注意是 value 物件下的 value 屬性）到左值欄 | 左值顯示彩色膠囊 `5. value.value` | ⬜ |
| 2.1.9 | **Operator**：Text operators → **Not equal to** | Operator 顯示「Not equal to」| ⬜ |
| 2.1.10 | **Right value 欄手打**：`empty`（純小寫 5 字元，無引號、無空白）| 右值欄顯示 `empty` | ⬜ |
| 2.1.11 | **確認兩規則為 AND 關係**（垂直排列、規則間顯示「AND」字樣，無「OR」標籤）| 是 ✅ | ⬜ |
| 2.1.12 | 點 OK | dialog 關閉、5→8 連線出現過濾器圖示（漏斗）| ⬜ |

### 2.2 驗證檢查

點 Run once → 送 Tally testing 「勾 1 營隊」payload → 看 Filter 後 cycles：

| 預期 | 通過 |
|---|---|
| Module 5 OUTPUT = 15 bundles（全 fields）| ✅ |
| Filter 後通過 cycles = **1**（你勾的那 1 個）| ✅ |
| Module 8 input = 1 bundle | ✅ |

### 2.3 失敗處理

| 症狀 | 可能原因 | 動作 |
|---|---|---|
| Filter 後 cycles = 0（全擋）| Rule 2 右值打成 `"empty"`（含引號）| 改成純 `empty` 5 字元 |
| Filter 後 cycles = 15（全放）| Rule 1 左值不是膠囊（純文字打的）| 重拖 `5. value.label` |
| Filter 後 cycles = 6（六個 CHECKBOXES 全過）| Rule 2 左值錯成 `5.value.label`，應為 `5.value.value` | 重拖正確的 value 屬性 |

---

## 3. Step 3 — 改 4 處下游 `{{5.value}}` 為 §6.3 IML

> ⚠️ **核心守則**：每處的「`5.value.label` token」必須左側面板**拖拉**產生（彩色膠囊）。
> `replace(`、`)`、`;`、空白、字面字串 `"孩子要報名哪些營隊？("` 與 `")"` 可手打。

**§6.3 IML 範本（請熟記）**：

```iml
{{replace(replace(5.value.label; "孩子要報名哪些營隊？("; ""); ")"; "")}}
```

**建構順序建議**（每處都這樣做）：
1. 在欄位先打 `replace(replace(`（手鍵）
2. 從左面板拖 `5. value.label` 進來（彩色膠囊）
3. 接著手打 `; "孩子要報名哪些營隊？("; ""); ")"; "")`
4. 在最外圍補 `{{` `}}`（若欄位需要 — 看下方各 Module 說明）

### 3.1 Module 8 — Sheets filterRows

| # | 動作 | ✅ |
|---|---|---|
| 3.1.1 | 點 Module 8（Search Rows）| ⬜ |
| 3.1.2 | 找 **Filter** 區塊 → 第 1 條 rule 的右值欄 | ⬜ |
| 3.1.3 | 當前內容是 `{{5.value}}` 彩色膠囊 → 整個刪除 | ⬜ |
| 3.1.4 | 用「§6.3 建構順序」重新填入 | ⬜ |
| 3.1.5 | 確認顯示為**橘色膠囊外殼 + 內部 5. value.label 為紫色子膠囊** | ⬜ |
| 3.1.6 | OK 儲存 | ⬜ |

### 3.2 Module 10 — SetVariables (`payment_button_html`)

當前 value 開頭：

```html
<div style='border:1px solid #f8d7b8;…'><p><strong>🏕️{{5.value}}</strong></p>…
                                                ^^^^^^^^^
                                                這段要替換
```

| # | 動作 | ✅ |
|---|---|---|
| 3.2.1 | 點 Module 10 → 找 variables 區塊 → variables[4] 名稱為 `payment_button_html` | ⬜ |
| 3.2.2 | 滑鼠定位到 value 欄位內，找到 `🏕️{{5.value}}` 的 `{{5.value}}` 膠囊 | ⬜ |
| 3.2.3 | **只刪掉這個膠囊**（不要碰前面的 🏕️ 與後面的 `</strong>`）| ⬜ |
| 3.2.4 | 用「§6.3 建構順序」重新填入該位置 | ⬜ |
| 3.2.5 | 確認最終結果顯示為 `🏕️[橘色膠囊]</strong>...`| ⬜ |
| 3.2.6 | OK | ⬜ |

### 3.3 Module 11 — HubSpot createDeal (`dealname`)

⚠️ **重要更正**：spec §3.3 / §7 寫的是 `× {{5.value}}`（乘號 ×），但實際 blueprint 是 ` x {{5.value}}`（**ASCII 小寫 x，前後各一空格**）。當前完整字串：

```
{{get(map(1.data.fields; "value"; "label"; "孩子姓名"); 1)}} x {{5.value}}
                                                          ^^^^^^^^^^^^^^^
                                                          這段要替換
```

| # | 動作 | ✅ |
|---|---|---|
| 3.3.1 | 點 Module 11 → properties → properties[0] dealname | ⬜ |
| 3.3.2 | 找到末尾的 `{{5.value}}` 膠囊（第二個 IML，不是孩子姓名那個！）| ⬜ |
| 3.3.3 | **只刪掉 `{{5.value}}` 膠囊**（保留 `孩子姓名` IML 與 ` x ` 字串）| ⬜ |
| 3.3.4 | 用「§6.3 建構順序」重新填入 | ⬜ |
| 3.3.5 | 確認最終結果：`[紫色 孩子姓名 膠囊] x [橘色 §6.3 膠囊]`| ⬜ |
| 3.3.6 | OK | ⬜ |

### 3.4 Module 13 — Sheets addRow (`values["5"]`）

| # | 動作 | ✅ |
|---|---|---|
| 3.4.1 | 點 Module 13 → 找第 6 個欄位（key="5"，視覺上是欄位列表第 6 個）| ⬜ |
| 3.4.2 | 該欄位當前是 `{{5.value}}` 彩色膠囊 → 整個刪除 | ⬜ |
| 3.4.3 | 用「§6.3 建構順序」重新填入 | ⬜ |
| 3.4.4 | 確認顯示為橘色膠囊 | ⬜ |
| 3.4.5 | OK | ⬜ |

### 3.5 Step 3 整體驗證

四處改完後，**先不 Save**。從 Make Editor 上方按 Run once → 送 Tally testing「勾 1 營隊」payload。看：

| Module | OUTPUT 檢查 | 通過 |
|---|---|---|
| Module 5 | 15 bundles | ✅ |
| Module 8 | 收到 b 值 = `[運算思維] Game Designer！...`（無「孩子要報名哪些營隊？(」前綴、無尾端 `)`）| ✅ |
| Module 10 | payment_button_html 顯示 `🏕️[運算思維] Game Designer！...</strong>` 乾淨 | ✅ |
| Module 11 | dealname = `<孩子姓名> x [運算思維] Game Designer！...` | ✅ |
| Module 13 | row 第 6 欄 = `[運算思維] Game Designer！...`（與 Module 8 一致）| ✅ |

**任何一處顯示原始 label（含「孩子要報名哪些營隊？(」前綴或尾端 `)`）→ 立即看故障排除卡 #2**

---

## 4. Step 4 — 儲存 Scenario

| # | 動作 | ✅ |
|---|---|---|
| 4.1 | 確認 Step 1–3 全部完成、Run once 驗證通過 | ⬜ |
| 4.2 | 點 Make Editor 底部 toolbar 💾 **Save** 按鈕（或按 ⌘S）| ⬜ |
| 4.3 | 等右上紅點變綠勾 ✅（持久化完成）| ⬜ |
| 4.4 | Versions UI 會新增一個版本紀錄，記下版本號（後續還原用）| 版本號：______ |

---

## 5. T1 驗收 — 單營隊測試

> **目的**：確認「勾 1 寫 1」（不是「勾 1 寫 6」也不是「勾 1 寫 0」）

| # | 動作 | 預期 | 通過 |
|---|---|---|---|
| 5.1 | Make Editor 點 Run once（webhook 待機）| 上方顯示「Waiting for trigger」| ⬜ |
| 5.2 | 開 Tally 公開連結：https://tally.so/r/MeYEJ8 | 表單載入 | ⬜ |
| 5.3 | 填基本資料（孩子姓名 = `T1_單營隊_<時間>`、家長 = 自己 email = jacksonkuo@gmail.com）| 表單繼續 | ⬜ |
| 5.4 | 「孩子要報名哪些營隊？」**只勾 1 個營隊**（建議：[運算思維] Game Designer）| 表單繼續 | ⬜ |
| 5.5 | 送出 Tally 表單 | Tally 顯示 thank you | ⬜ |
| 5.6 | 回 Make Editor 看執行結果 | scenario 跑完、無紅色 X | ⬜ |
| 5.7 | Module 5 OUTPUT bundles | **15** | ⬜ |
| 5.8 | Filter 後通過 cycles | **1** | ⬜ |
| 5.9 | Module 13 OUTPUT | row append 1 次 | ⬜ |
| 5.10 | 開 Google Sheets「報名追蹤表」| 新增 **1 列**，營隊欄 = `[運算思維] Game Designer！小小遊戲設計師營隊` | ⬜ |
| 5.11 | 開 Gmail（jacksonkuo@gmail.com）| 收到 **1 張**繳費卡片，營隊名乾淨無前綴 | ⬜ |

**T1 通過 → Issue #6 主操作完成 90%。** T2 雙營隊與 T3 三營隊預定 5/1 PM 至 5/2 進行（spec §11 時間表）。

---

## 6. 完成後動作

| # | 動作 | ✅ |
|---|---|---|
| 6.1 | 在 GitHub Issue #6 底下 comment：「v2 Step 1–4 + T1 已完成於 [時間]」貼 Make Versions 版本號 | ⬜ |
| 6.2 | Project Board 把 Issue #6 從「🔨 Building」移到「🧪 Testing」| ⬜ |
| 6.3 | 此操作卡 checkbox 全打勾，存檔 commit | ⬜ |
| 6.4 | **撤銷臨時 Make API token**：Make → Profile → API → 找 `claude-cowork-issue6` → 刪除 | ⬜ |
| 6.5 | 通知下次 Cowork 對話：「Issue #6 v2 主操作完成、T1 過、待 T2/T3」| ⬜ |

---

## 7. 緊急回退指南

任何時候卡住超過 5 分鐘 → **立即停手**：

| 情境 | 動作 |
|---|---|
| Step 1–3 中發現 OUTPUT 結構奇怪 | Make Editor 右下 Versions → Restore 4/28 23:19 → Save → 重跑 `bash scripts/issue-6-precheck.sh` |
| Save 後跑 T1 失敗 | Versions → Restore 你剛才存的 Step 4.4 之前版本 → Save |
| 完全混亂 | 別硬撐，停下來休息，下次 Cowork 對話接力 |

---

## 8. 為什麼這份卡片這麼長？

| 原因 | 說明 |
|---|---|
| 4/29 v1 失敗教訓 | 走錯方向整天，因為沒有「逐步驗證」的卡片 |
| Tally CHECKBOXES 結構非主流 | 容易誤判，每步都得驗證 OUTPUT 才知道對錯 |
| 拖拉 token metadata 風險 | UI 拖拉 vs 手鍵的差別肉眼難辨，需明確警示 |
| 5 處改動互相關聯 | 任一處 metadata 失敗會讓整套失敗，逐個驗證才查得出 |

> 💡 **如果今天累了，明早起床先做預檢腳本（5 分鐘）+ Step 1（5 分鐘），就先收工。Step 2-4 + T1 留下午做。** spec §11 時間表本來就拆兩半。

---

*文件建立：2026-04-30 PM Cowork　目標執行日：2026-05-01　預估時間：30 分鐘（純操作）+ 15 分鐘（測試）*
