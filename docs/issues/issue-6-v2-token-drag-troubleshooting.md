# Issue #6 v2 — Token 拖拉故障排除卡

> 拖拉時若出現以下任一徵兆 → **立即停手**，照表處理。Token metadata 失敗一旦 Save 持久化，回頭找原因比預先預防成本高 10 倍。
>
> 配套文件：
> - `docs/issues/issue-6-v2-morning-operation-card.md` — 操作卡主文件
> - `memory/feedback_make_iml_api_risk.md` — 4/28 方案 B 失敗教訓

---

## A. Token 拖拉 5 大失敗徵兆

| # | 徵兆 | 嚴重度 | 即時處理 |
|---|---|---|---|
| 1 | 欄位顯示為「白底純文字」`{{1.data.fields}}` 或 `{{5.value.label}}`（無彩色背景）| 🔴 嚴重 | 立即 Backspace 刪除整段，**不要 OK** ；重新從左面板拖一次 |
| 2 | 拖拉後膠囊顏色錯誤（例如該為紫色變灰色）| 🟠 中度 | 刪除重拖；確認左面板的條目來自正確 module |
| 3 | Hover 膠囊顯示「unknown reference」或無 tooltip | 🟠 中度 | 刪除重拖；可能是孤立 token（來源 module 已被移除）|
| 4 | OK 後 Make 跳出 warning「Some references could not be resolved」| 🔴 嚴重 | 看哪個欄位有問題，回去重做；**不要 Save**|
| 5 | Run once 時 Module OUTPUT 顯示 `[?] reference unresolved` | 🔴 嚴重 | 立即 Versions → Restore，整段重做 |

---

## B. 兩種 token 顏色辨識（Make Editor 慣例）

| 顏色 | 含義 | 範例 |
|---|---|---|
| 🟣 紫色（深）| 從另一 module OUTPUT 拖來的 reference token | `5. value.label`、`8. row_number` |
| 🟠 橘色（淡）| IML 函式包外（如 `{{ replace(...) }}` 整段）| §6.3 整段公式 |
| ⚪ 灰色 | 一般文字、變數名稱 | `payment_button_html`、字面字串 |
| 🔴 紅色框 | reference 解析失敗 | 任何看到紅框 = 立即修 |

> Make Editor 不同主題下顏色可能略有差異，但**「彩色 vs 純白底」** 的對比一定明顯。沒看到背景色的，就是純文字、metadata 失敗。

---

## C. 「IML 預覽」確認法

每一個欄位完成後，可以做一次「視覺預覽」：

| 動作 | 結果應為 |
|---|---|
| 滑鼠停在欄位上方（不點擊）| 出現 tooltip 顯示完整字串 |
| 點欄位旁的「<>」icon（部分 dialog 有）| 切換到「IML 文字模式」|
| IML 文字模式內容 | 應有正常空格、正常換行；無亂碼、無 `[object]`|

**正確範例**（Module 13 values["5"] 欄位 IML 模式）：

```iml
{{replace(replace(5.value.label; "孩子要報名哪些營隊？("; ""); ")"; "")}}
```

**錯誤範例**（metadata 失敗）：

```
{{replace(replace(5.value.label; "孩子要報名哪些營隊？("; ""); ")"; "")}}
```

⚠️ **兩者文字看起來一樣！** 區別在「視覺呈現」：

- 正確版本：`5.value.label` 部分顯示為**紫色膠囊**（在 GUI 模式下）
- 錯誤版本：整段都是**純文字、無膠囊**

→ 用 GUI 模式確認，而非 IML 文字模式。

---

## D. 4/28 方案 B 慘痛經驗（為何要這麼小心）

> 來源：`memory/feedback_make_iml_api_risk.md`

| 項目 | 結果 |
|---|---|
| API PATCH 寫入 IML | HTTP 200，長度 429 字元 ✅ |
| API 讀回比對 | 字串完全一致 ✅ |
| Replay 13 ops | 成功 ✅ |
| 實際 email 渲染 | ❌ 「`'style='...'>前往繳費`」前段 div + reference 全爆 |

**原因**：UI 拖拉產生的 token 帶 hidden metadata（token type、source module ID、bundle index），純文字寫入相同字串「形似但執行階段 reference 無法 resolve」。

**對 Issue #6 的含義**：
- ❌ 不能用 Chrome Console JavaScript 操作 token
- ❌ 不能用 API PATCH blueprint 直接覆蓋 IML
- ❌ 不能複製貼上「整段 IML 字串」（包含拖拉產生的 reference token 的話，貼上後會變純文字）
- ✅ 只能用 Make Editor 左側面板**手動拖拉**

---

## E. 自我檢查表（每 Step 完成前 30 秒掃過）

| # | 檢查項 | 通過條件 |
|---|---|---|
| E1 | 每個 reference token 是**彩色膠囊**而非白底文字 | ✅ |
| E2 | Hover 每個 token，tooltip 顯示完整 reference path | ✅ |
| E3 | 字面字串部分（`"孩子要報名哪些營隊？("`、`")"` 等）是純白底 | ✅ |
| E4 | IML 函式名（`replace`、`map`）也是純白底（普通文字）| ✅ |
| E5 | 整段欄位 hover 後，tooltip 顯示的字串可閱讀、無 `[object]` 或 `null` | ✅ |
| E6 | 點下方 OK，dialog 順利關閉，**無紅色 warning banner** | ✅ |

---

## F. 出錯時的回退決策樹

```
拖拉時發現徵兆 A.1-A.5？
├── Yes → 該欄位範圍：刪掉重做
│   ├── 重做 OK → 繼續
│   └── 重做 3 次仍失敗 → 整 Step 還原（Versions UI Restore Step 開始前版本）
└── No → 繼續下一步

Save 後 Run once 失敗？
├── Module OUTPUT 顯示 unresolved reference
│   → 立即 Versions → Restore Save 前版本 → Save
└── 結果與預期不符（cycles 數錯）
    → 看操作卡 §1.3 / §2.3 / §3.5 對應失敗處理表

完全找不出原因？
→ Versions → Restore 4/28 23:19 → Save → 收工，下次 Cowork 對話續接
```

---

## G. 「我不確定這個 token 對不對」快速判斷法

如果做完一個欄位，但沒把握 token 是否帶 metadata：

| 動作 | 結果 |
|---|---|
| 點該 token（單擊不雙擊）| 應彈出小選單顯示 token 屬性 |
| 試圖將該 token 拖到另一欄位 | 應能拖動（彩色保持），若拖不動 = 純文字 |
| 把 dialog 關掉再打開回看 | 彩色膠囊應保留；若變成白底文字 = metadata 已失效 |

最強驗證 = **Run once 看 OUTPUT 真的有解析正確值**。空想無用。

---

## H. 為什麼自動化（Chrome MCP / Playwright）也不可靠

理論上 Chrome 可以模擬 mouseDown → mouseMove → mouseUp 觸發 React 的 dragstart/dragend 事件。實務上：

| 風險 | 說明 |
|---|---|
| Make Editor 用 React DnD 自定義拖拉 handler | 自動化模擬的 mouseEvent 不一定觸發 React DnD 內部的 drag context |
| Token metadata 在 dragend 時才寫入 dataTransfer | 自動化 dispatchEvent 可能跳過此步驟 |
| 4/28 方案 B 已示範「形似但實質失敗」 | 後續驗證才發現，成本極高 |

→ Issue #6 這種一次性、結構性的改動，**人工拖拉是最便宜的保證**。30 分鐘人工 = 4 小時自動化除錯。

---

*文件建立：2026-04-30 PM Cowork　配套文件：操作卡 + spec v2*
