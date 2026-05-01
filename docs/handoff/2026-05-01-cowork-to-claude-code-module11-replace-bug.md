# Cowork → Claude Code 交接：Module 11 dealname replace() bug + HubSpot 資料清理

> **建立時間**：2026-05-01 Cowork session
> **狀態**：⬜ **未動 Make scenario**；等 Claude Code 評估後再執行
> **發送者**：Cowork（Claude 桌面端）
> **接收者**：Claude Code（VS Code IDE）
> **目的**：請 Claude Code 從獨立視角評估「Module 11 dealname 缺 `""` 引數」是否確實是 bug、Cowork 提的 3 個方案是否合理、有沒有 Cowork 沒想到的選項

---

## 1. 一頁摘要

| 項目 | 內容 |
|---|---|
| 發現時點 | 2026-05-01 Cowork 對 4/30 Issue #6 + 5/1 Issue #1 做 review 時 |
| 發現方式 | snapshot diff 找出 IML 形式不一致 → HubSpot search_crm_objects 抽查 production 資料驗證 |
| 確認 bug | ✅ Module 11 dealname IML 兩處 `replace()` 缺 `""` 第三引數，**production 已產出 ≥15 筆錯誤 dealname** |
| 連帶發現 | (a) HubSpot 仍有 9 筆 4/30 T9 慘案的垃圾 Deal、(b) Issue #1 的 T10/T11 驗收沒涵蓋 dealname 視覺檢查 |
| 待決策 | 修補通道（API PATCH vs UI 拖拉）、清理時機與順序、驗收清單擴增 |
| Jackson 立場 | 想先聽 Claude Code 看法，再決定動手方式（避免 Cowork 一個人說了算）|

---

## 2. 背景脈絡（Issue #6 + Issue #1 都已完成）

| Issue | 完成時間 | 修復內容 |
|---|---|---|
| #6 Iterator 勾 N 寫 N | 2026-04-30 PM | Module 8 edge filter 加第三條件 `{{if(5.value; "yes"; "no")}} text:equal "yes"`；五處下游 5.value ref 改用 substring 解析 |
| #1 payment_button_html 動態化 | 2026-05-01 凌晨 | 新增 Module 27 SetVariables 包 HTML 模板；Module 14 改引用 `{{27.payment_button_html}}`；Module 8 mapper.filter b 改 IML |

兩 Issue 的 T 系列驗收都通過：
- T4a/b/c：1/2/3 營隊 → 12/19/26 ops ✅
- T11：2 營隊 → 21 ops、email 2 卡片、營隊名正確 ✅

**但驗收只看 email + Sheets 時間，沒人看 HubSpot Deal 卡片。**

---

## 3. 三個發現

### 3.1 ⚠️ 主要發現：Module 11 dealname `replace()` 缺第三引數

**Snapshot 比對**（從 `docs/snapshots/blueprint_v7_post_issue1_fix.json` 解析）：

| Module | 路徑 | IML 字面字串 | 狀態 |
|---|---|---|---|
| Module 13 row[5] | `flow[id=13].mapper.values["5"]` | `replace(replace(5.label; "孩子要報名哪些營隊？ ("; ""); ")"; "")` | ✅ 含 `""` |
| Module 27 payment_button_html | `flow[id=27].mapper.variables[0].value` | （HTML 內嵌）`replace(replace(5.label; "孩子要報名哪些營隊？ ("; ""); ")"; "")` | ✅ 含 `""` |
| **Module 11 dealname** | `flow[id=11].mapper.properties[0].value` | `replace(replace(5.label; "孩子要報名哪些營隊？ ("; ); ")"; )` | ❌ **缺 `""`** |

形式對照（看 `; "")` vs `; )`）：
```
✅ Module 13: "孩子要報名哪些營隊？ ("; "");  ")"; "")
✅ Module 27: "孩子要報名哪些營隊？ ("; "");  ")"; "")
❌ Module 11: "孩子要報名哪些營隊？ ("; );    ")"; )
```

**Production 真實輸出**（HubSpot search_crm_objects 抽查最近 15 筆 Deal，pipeline = Ecommerce、createdate DESC）：

| Deal ID | createdate | dealname | 預期 | 實際 |
|---|---|---|---|---|
| 323336663763 | 2026-04-30 16:59:29 UTC | `test1259 x 孩子要報名哪些營隊？ ([設計思考] 未來家園由我打造！水上方舟規劃師營隊)` | `test1259 x [設計思考]...` | ❌ 完整 label |
| 323424253630 | 2026-04-30 16:59:26 UTC | `test1259 x 孩子要報名哪些營隊？ ([STEAM] Attack...)` | `test1259 x [STEAM]...` | ❌ |
| 323429601980 | 2026-04-30 16:50:49 UTC | `測試孩子T11 x 孩子要報名哪些營隊？ ([運算思維] Game Designer！...)` | `測試孩子T11 x [運算思維]...` | ❌ |
| 323310327534 | 2026-04-30 16:50:44 UTC | `測試孩子T11 x 孩子要報名哪些營隊？ ([STEAM] Attack...)` | `測試孩子T11 x [STEAM]...` | ❌ |
| 323336642275 | 2026-04-30 16:31:50 UTC | `測試孩子T10 x 孩子要報名哪些營隊？ ([STEAM] Attack...)` | `測試孩子T10 x [STEAM]...` | ❌ |

**結論**：Make IML `replace(string; search; )` 缺第三引數時 **silent noop（不報錯、不替換）**，所以 `5.label` 整段原樣輸出。完全證實 §3.1 是 production bug。

### 3.2 連帶發現：HubSpot 仍有 9 筆 4/30 T9 慘案垃圾 Deal

回顧 `docs/handoff/2026-05-01-claude-code-issue1-done.md` 提到 Issue #1 修復過程曾因 Edge filter 被 Python 腳本誤 patch（路徑 `flow[i].filter` vs `flow[i].mapper.filter` 混淆），導致 15 個 Tally fields 全進 iterator → 77 ops + 9 筆垃圾追蹤行。

Sheets 端的 9 筆垃圾行已於 4/30 17:00–17:11 清理（rows 243–251 截圖：`rows_243.png`、`rows_selected.png`、`rows_deleted.png`）。

**但 HubSpot 端 9 筆對應垃圾 Deal 沒清**：

| dealname pattern | createdate | Deal ID |
|---|---|---|
| `測試孩子T9 x 孩子要報名哪些營隊？` | 4/30 16:26:50 | 323424221923 |
| `測試孩子T9 x 您這次要報名幾個營隊？` | 4/30 16:26:47 | 323433183937 |
| `測試孩子T9 x 團報人數` | 4/30 16:26:44 | 323336640213 |
| `測試孩子T9 x 孩子出生年月日` | 4/30 16:26:41 | 323426011861 |
| `測試孩子T9 x 孩子姓名` | 4/30 16:26:38 | 323426011860 |
| `測試孩子T9 x 電話` | 4/30 16:26:35 | 323408012005 |
| `測試孩子T9 x Email` | 4/30 16:26:32 | 323406211803 |
| `測試孩子T9 x 家長姓名` | 4/30 16:26:28 | 323415189190 |
| `測試孩子T9 x 孩子要報名哪些營隊？ ([STEAM] Attack...)` | 4/30 16:26:53 | 323409818347 |

加上 T8 / T10 / T11 / test1259 等正常測試 Deal 也應一併清理（避免 Issue #2 驗收時干擾）。

### 3.3 驗收方法論問題

| 渠道 | 對應 Module | 用的 IML | 驗收涵蓋？ |
|---|---|---|---|
| Email 卡片內容 | Module 27 | `replace(...; ""); ""; "")` | ✅ T11 視覺檢查 |
| Sheets row[5] 營隊欄 | Module 13 | `replace(...; ""); ""; "")` | ⚠️ 未明確檢查（但邏輯上正常）|
| **HubSpot dealname** | **Module 11** | `replace(...; ); ; )` ❌ | ❌ **沒人看** |
| Module 8 filterRows 查設定表 | Module 8 mapper.b | `replace(...; ""); ""; "")` | ✅ T10/T11 透過金額正確證明 |

「全程正常」是 base on email + Sheets 時間正確，**HubSpot dealname 視覺檢查在 Issue #6 + Issue #1 兩次驗收都缺席**。這是踩雷地圖第 8、9 條（已記入 Cowork review 文件 `/Users/jacksonkuo/Documents/Claude/Projects/太陽實驗室團報流程改進/2026-05-01_Issue6_Issue1_Review.md` §10）。

---

## 4. Cowork 的初步判斷（請 Claude Code 評估）

### 4.1 為何 Module 11 跟 13/27 形式不一致？

兩個假設（Cowork 沒驗證，請 Claude Code 給看法）：

| 假設 | 推論 | 證據 |
|---|---|---|
| H1：Make API PATCH 序列化時把 `""` 折疊掉 | Issue #6 4/30 PM 透過 API 寫入 5 處 IML，序列化時 `""` 在 `replace()` 第三引數位置被某種 JSON 處理移除 | 弱 — 但 13/27 用同一通道寫入卻保留了 `""`，邏輯不通 |
| H2：寫入時就缺 `""` | Issue #6 5000b63 commit 透過 API PATCH 5 處時，撰寫腳本對 Module 11 用了不同模板字串、漏帶 `""` | 強 — 與 13/27 形式差異 100% 一致只在 Module 11 |

Cowork 傾向 H2，因為 13 與 27 是**晚於 Module 11** 寫入的（Module 27 是 5/1 凌晨 Issue #1 才新增），如果是序列化問題，27 應該也缺。

### 4.2 三個修補方案

| # | 方案 | 操作 | 風險 | 可重現性 | 留 git trail | 推薦 |
|---|---|---|---|---|---|---|
| A | **Make API PATCH** Module 11 補 `""` | 寫 Python 腳本 → 讀 blueprint → 改字串 → PATCH 回去 | 低（與 Issue #1 同模式已驗證可行；不涉跨 Module reference token，純字面字串補完）| 高（腳本可保存到 `scripts/`）| ✅ commit 腳本 + new snapshot | ⭐ |
| B | **UI 手動拖拉** Module 11 dealname token 重設 | 在 Make Editor 開 Module 11、移除整段 ` x {{...}}` 重拖拉 | 中（4/28 拖拉一直是脆弱點；React DnD + Playwright/Chrome 不可靠）| 低（拖拉操作難寫腳本）| 部分（snapshot 但無腳本）| |
| C | **Make Editor 公式編輯器手打 IML** | 在 Module 11 dealname 欄位的 IML mode 直接打字補 `""` | 低（純文字編輯，不涉拖拉）| 低（手動操作）| 部分 | |

**Cowork 推薦：A**。理由：
1. Issue #1 已證實 API PATCH 純字面字串 IML 在 Make 上 OK（與 4/28 失敗案例不同：那次是跨 Module reference 拼接）
2. 這次是補兩個 `""`、不是新增 reference token
3. 腳本化後未來碰到類似問題（例如 Issue #8 J 欄）可重用

### 4.3 清理 HubSpot 垃圾 Deal 的時機

| 時機 | 優點 | 缺點 |
|---|---|---|
| **修 Module 11 之前清** | 抽查時不會被舊資料干擾 | 風險低但少了一份「修補前 vs 修補後」的對照 |
| **修 Module 11 之後清** | 可保留一筆對照（修補前 dealname vs 修補後 dealname）| 抽查時要過濾 |
| **永遠不清，加標籤區隔** | 保留歷史完整 | HubSpot 列表會雜亂 |

Cowork 傾向「修補後清」，且**清理由 Jackson 親自在 HubSpot UI 操作**（Cowork policy：破壞性操作不代為執行）。

---

## 5. 給 Claude Code 的具體問題

請從獨立視角評估以下，**特別歡迎 push back**：

### 5.1 技術問題
1. §4.1 的 H1 vs H2 兩個假設，您怎麼看？有沒有第三種可能（例如 IML 字串中某種特殊字元觸發序列化異常）？
2. §4.2 方案 A 用 API PATCH 補 `""`，您是否擔心會踩到類似 4/28 方案 B 的 reference token 慘案？理由？
3. 補完後**怎麼驗證**才算夠？Cowork 想到的是「送 1 筆 Tally → 看 HubSpot Deal name」，您有沒有更穩健的驗證法？
4. 若 §4.1 的假設是 API 序列化會折疊 `""`，那方案 A 改完之後，下次再讀 blueprint 是不是又會變成 `; )`？這是不是一個 round-trip 風險？

### 5.2 流程問題
5. Issue #2 驗收清單應該怎麼設計，才能確保下次不會再漏掉某個下游渠道（HubSpot dealname 這次就是被漏掉的）？
6. 是否值得寫一個「snapshot 一致性檢查腳本」（比對 5 處 ref 的 IML 形式是否相同），加進預檢 SOP？
7. 4/30 PM 跑 Issue #6 時，您（Claude Code）有沒有在 production 看過任何一筆 Deal、發現 dealname 有問題？還是當時也只看 email + ops 數？

### 5.3 範圍問題
8. 修 Module 11 應該獨立成一個新 Issue、還是併入 Issue #2 驗收測試的修補項目？
9. 9 筆 T9 + 6 筆其他測試 Deal 是否真的需要清？保留是否會干擾 Issue #2？

---

## 6. 不要做的事

| ❌ 禁止 | 原因 |
|---|---|
| 在沒和 Jackson 確認前 PATCH Module 11 | Jackson 想先聽 Claude Code 看法再決定 |
| 用 UI 拖拉操作 Module 11 dealname token（替換現有的 `5.label` reference）| 那個 reference 可能是 Issue #6 拖出來的好 token；只缺 `""` 不需要動 reference |
| 自己代為刪除 HubSpot Deal | 破壞性操作必須 Jackson 親自在 HubSpot UI 確認 + 執行 |
| 寫一個會改動 Module 13/27/8 的腳本 | 那三個都是好的，只動 Module 11 |
| 假設 IML 缺 `""` 一定是 silent noop | HubSpot 抽查證據強，但 IML 解析行為應再驗證（例如改一個測試模組試錯）|

---

## 7. 環境與資源

| 項目 | 路徑 / 值 |
|---|---|
| Repo 本機路徑 | `~/Documents/Claude/Projects/太陽實驗室團報流程改進/github-repo/` |
| Cowork review 文件 | `/Users/jacksonkuo/Documents/Claude/Projects/太陽實驗室團報流程改進/2026-05-01_Issue6_Issue1_Review.md` |
| 當前 production snapshot | `docs/snapshots/blueprint_v7_post_issue1_fix.json` |
| Make API token | `~/.config/make/token`（label `claude-cowork-issue6`、5/1 凌晨 Issue #1 之後**未撤銷**）|
| Make scenario | `4596472`（team `2085532`、us2）|
| HubSpot Pipeline | `75e28846-ad0d-4be2-a027-5e1da6590b98`（Ecommerce）|
| HubSpot Deal stage（已報名未付款）| `3551665864` |

---

## 8. 推薦的 Claude Code 第一輪動作

1. **獨立驗證 §3.1**：自己用 Make API GET 一次 blueprint、解析 Module 11 dealname 字面字串，確認真的缺 `""`（不要只信 Cowork 的解析結果）
2. **獨立驗證 §3.1 IML 行為**：開 Make Editor，在 Module 11 dealname 欄位用 IML mode 看編輯器顯示是 `; ""` 還是 `; )`（**這條最關鍵**，可能直接顛覆 Cowork 的判斷）
3. **回答 §5 問題**，特別是 §5.1 第 4 條（round-trip 風險）
4. **若同意 Cowork 判斷**，寫修補腳本（不要先執行）給 Jackson 看
5. **不同意**就直接說，並提您的方案

---

## 9. 相關檔案清單（Claude Code 啟動時建議讀取順序）

| # | 檔案 | 用途 | 預估閱讀 |
|---|---|---|---|
| 1 | 本文件 | 任務概覽 | 5 分鐘 |
| 2 | `/Users/jacksonkuo/Documents/Claude/Projects/太陽實驗室團報流程改進/2026-05-01_Issue6_Issue1_Review.md` | Cowork 完整 review（含 §6.1 §10 對照） | 10 分鐘 |
| 3 | `docs/handoff/2026-05-01-claude-code-issue1-done.md` | Issue #1 修復摘要（您自己寫的）| 3 分鐘 |
| 4 | `docs/snapshots/blueprint_v7_post_issue1_fix.json` | 當前 production blueprint | 解析用 |
| 5 | `docs/snapshots/blueprint_v6_post_issue6.json` | Issue #6 完成後 snapshot（Module 11 第一次出現缺 `""` 的時點）| 對比用 |
| 6 | `docs/issues/issue-6-implementation-spec.md` | Issue #6 v2 spec | 補背景 |
| 7 | `docs/handoff/2026-04-30-cowork-to-claude-code-issue-6.md` | Issue #6 第一次 Cowork → Claude Code 交接 | 補背景 |

---

## 10. 給 Claude Code 的開場 Prompt（Jackson 複製貼用）

```
我要請你 review 一個 production bug + 給第二意見。

請先讀以下檔案：
1. docs/handoff/2026-05-01-cowork-to-claude-code-module11-replace-bug.md（本交接文件）
2. /Users/jacksonkuo/Documents/Claude/Projects/太陽實驗室團報流程改進/2026-05-01_Issue6_Issue1_Review.md（Cowork review）

讀完後先做兩件事再給看法：
A. 用 Make API GET blueprint，獨立解析 Module 11 dealname 的 IML，確認真的缺 ""
B. 開 Make Editor 直接看 Module 11 dealname 欄位編輯器顯示

然後回答交接文件 §5 的所有問題。

特別歡迎你 push back Cowork 的判斷。
不要動 scenario，給我看法後再決定方案。
```

---

*交接文件：2026-05-01 Cowork session（Claude desktop）*
*等待回覆：Claude Code（VS Code IDE） + Jackson 確認後執行*
