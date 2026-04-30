# Issue #6 v2 — Cowork → Claude Code 交接文件

> **接班對象**：Claude Code（VS Code IDE）+ Playwright MCP server
> **交接時間**：2026-04-30 早上（08:55 後）
> **交接原因**：Jackson 改換 IDE-based 工具鏈以利後續開發；Cowork 桌面端任務告一段落
> **任務狀態**：Issue #6 v2 spec 文件齊備、scenario 已 restore 至 v6 production、待執行主操作 Step 1-4 + T1

---

## 1. 一頁摘要（TL;DR）

| 項目 | 內容 |
|---|---|
| 任務 | 修復 Make scenario 4596472「勾選 N 個營隊卻寫入 6 筆」的 Iterator bug |
| Spec | `docs/issues/issue-6-implementation-spec.md` v2 (376 行) |
| 操作卡 | `docs/issues/issue-6-v2-morning-operation-card.md`（9 章節、20+ checkbox）|
| 故障卡 | `docs/issues/issue-6-v2-token-drag-troubleshooting.md`（5 大失敗徵兆 + 回退決策樹）|
| 預檢腳本 | `scripts/issue-6-precheck.sh`（30 秒自動驗證 scenario 狀態）|
| 啟動腳本 | `scripts/issue-6-morning-startup.sh`（清 stale lock + commit + push + precheck）|
| 待執行 | 操作卡 §1-§4（Step 1-4）+ §5（T1 單營隊測試）|
| 預估時間 | 30 分鐘主操作 + 15 分鐘 T1 |
| Sprint | Winter Camp Prep 2026 (W18-W20)；Issue #6 P1，5/2 截止 |

---

## 2. 4/29 慘痛教訓（必讀）

| 教訓 | 詳情 |
|---|---|
| **不要假設 Tally 結構** | 4/29 v1 spec 整套方向錯誤，因為假設 Tally 多選 = `MULTIPLE_CHOICE with options[]`；實際是 6 個獨立 `CHECKBOXES` |
| **動 IML 前先看真實 webhook payload** | Module 5 OUTPUT 結構為唯一真理 |
| **不能用 v6 production blueprint 的 IML 當參考** | `key=question_bkOj1Z` 是失效值 |
| **Reference token 必須 UI 拖拉，不能 API 純文字寫入** | 4/28 方案 B 慘案：API 寫 IML 字串長度一致，但執行階段 reference 解析全失敗（hidden metadata 缺失）|
| **Module 11 dealname 是 ASCII ' x ' 不是 '× '** | 4/30 PM 發現 spec §3.3 §7 §11 寫錯，操作卡已更正 |

> 詳見 memory：`feedback_make_iml_api_risk.md`、`feedback_make_iml_tally_label_vs_key.md`

---

## 3. 當前 scenario 狀態（4/30 AM Restore 後）

| Module | 路徑 | 當前值 | 改動目標 |
|---|---|---|---|
| 5 | `mapper.array` | `{{map(get(map(1.data.fields; "options"; "key"; "question_bkOj1Z"); 1); ...)}}` （v6 production 失效公式）| `{{1.data.fields}}` |
| 5→8 連線 | `flow[8].filter` | `null`（無 Filter）| 兩個 AND rules（label contains, value not equal）|
| 8 | `mapper.filter[0][0].b` | `{{5.value}}` | §6.3 IML |
| 10 | `variables[4].value` 內 `🏕️{{5.value}}` | `🏕️{{5.value}}` | `🏕️` + §6.3 |
| 11 | `properties[0].value` 內 ` x {{5.value}}`（**ASCII x，非乘號**）| `... x {{5.value}}` | ` x ` + §6.3 |
| 13 | `mapper.values["5"]` | `{{5.value}}` | §6.3 |

**§6.3 IML（共 4 處下游 ref 共用）**：
```iml
{{replace(replace(5.value.label; "孩子要報名哪些營隊？("; ""); ")"; "")}}
```

---

## 4. Playwright MCP 對 Make Editor 的特殊風險

> Cowork 用 Chrome MCP 操作瀏覽器；Claude Code 改用 Playwright MCP。**兩者對 React DnD 的拖拉支援不同**，必須額外驗證。

| 風險 | 說明 | 緩解 |
|---|---|---|
| **React DnD HTML5 backend 與 Playwright 合成事件** | Make Editor 用 React DnD HTML5 backend，要求真實 native drag events 帶完整 dataTransfer 物件；Playwright 的 `mouse.down/move/up` 與 `locator.dragTo()` 是合成事件，**不一定觸發 React DnD 內部 token metadata 寫入** | 每次拖拉後**雙重驗證**：(a) 視覺截圖看 token 是否為彩色膠囊（非白底文字）(b) Run Once 看 Module OUTPUT 是否解析正確 |
| **拖拉後外觀「形似」但 metadata 失敗** | 4/28 方案 B 慘案的本質：字串長度一致、視覺看起來對，但執行階段失敗 | 不要相信「字串相等」即等於「token 正確」；必須跑 Run Once 看 OUTPUT |
| **Playwright `dragTo()` 對非標準 drop zone 行為不一致** | Make Editor 的 Array 欄位、Filter 規則欄、SetVariables value 欄各自有不同 drop handler | 第一次拖拉先在 Module 5（最簡單的場景）測試；若失敗，**改請 Jackson 手動拖那一個 token**，再用 Playwright 做 Run Once 與其他輔助操作 |
| **JavaScript 注入 dataTransfer 是高階做法** | 透過 `page.evaluate()` 直接操作 React fiber tree 雖可行，但與 Make 的 source code 強耦合，未來版本更新易壞 | **不建議**；UI 拖拉 + 視覺驗證才是正路 |

### 4.1 推薦工作模式

```
1. Playwright 開 Make Editor、截圖、確認當前狀態
2. 對於每個 token 拖拉：
   2a. 先試 Playwright dragTo() — 這是最快路徑
   2b. 拖拉後立即截圖 + 用 page.locator() 檢查目標欄位 DOM
   2c. 若 DOM 顯示為彩色膠囊（特定 className）→ 繼續下一個
   2d. 若顯示為白底文字 → 立即清空，請 Jackson 手動拖那一個
3. 每個 Step 完成 → Playwright 點 Run Once → 自動讀取 Module OUTPUT 驗證
4. 全 4 Step 完成 → Save → 跑 T1（送 Tally 表單可用 Playwright 自動化）
```

### 4.2 視覺驗證 DOM 線索

> ⚠️ **以下 className 為推測，須以實際 inspect 為準**

| 元素類型 | 可能的 DOM 特徵 |
|---|---|
| 彩色 reference token | `<span class="...token...">`、有 `style="background-color: ..."`、含 `data-token-type` 或類似 attr |
| 純白底文字 | 純 text node、無 span 包覆、無 background-color |
| IML 公式 token | 外層 `<span class="...formula...">`，內層仍可包 reference token |

**第一次操作時，請 Playwright 先 inspect Module 5 Array 欄位的當前 token（v6 production 已存在的長公式）作為「正確 token 應有的 DOM」基準**，再用此基準驗證後續拖拉。

---

## 5. 必讀清單（依序）

| # | 檔案 | 重點 | 預估閱讀時間 |
|---|---|---|---|
| 1 | `docs/issues/issue-6-v2-morning-operation-card.md` | 主操作步驟（您的執行 SOP）| 10 分鐘 |
| 2 | `docs/issues/issue-6-v2-token-drag-troubleshooting.md` | 拖拉失敗時的判讀與處理 | 5 分鐘 |
| 3 | `docs/issues/issue-6-implementation-spec.md`（v2）| 完整 spec（含 §6 IML 公式集 + §7 影響範圍 + §8 驗證計畫）| 15 分鐘 |
| 4 | `docs/snapshots/blueprint_v6_pre_issue6.json` | 4/29 v6 production blueprint snapshot；解析後可得各 module 精確 mapper path | 解析用，不必通讀 |
| 5 | `memory/feedback_make_iml_api_risk.md` | 為何不能 API 寫 IML | 3 分鐘 |
| 6 | `memory/feedback_make_iml_tally_label_vs_key.md` | 為何 Tally 結構是 CHECKBOXES 不是 MULTIPLE_CHOICE | 3 分鐘 |
| 7 | `memory/reference_tally_form_checkboxes_structure.md` | 真實 webhook payload 結構（4/29 testing0944_T1 確認）| 3 分鐘 |
| 8 | `memory/reference_make_blueprint_module_paths.md` | 5 處精確 mapper 路徑與當前 IML | 3 分鐘 |
| 9 | `memory/project_winter_camp_sprint.md` | 當前 Sprint backlog、4/30 PM 進度 | 5 分鐘 |

---

## 6. 環境與 Credentials

| 項目 | 值 / 路徑 |
|---|---|
| Repo 本機路徑 | `~/Documents/Claude/Projects/太陽實驗室團報流程改進/github-repo/` |
| Repo URL | https://github.com/Jackson888kuo/sigellabs-camp-registration |
| Default branch | `main` |
| GitHub credentials | 本機 `gh` CLI 已登入（user: `Jackson888kuo`）|
| Make API token | `~/.config/make/token` (chmod 600)；label: `claude-cowork-issue6` |
| Make scenario | `4596472` (team `2085532`、us2 region) |
| Make Editor URL | https://us2.make.com/2085532/scenarios/4596472/edit |
| Tally form | `MeYEJ8`；公開 URL `https://tally.so/r/MeYEJ8` |
| Tally Edit URL | `https://tally.so/forms/MeYEJ8/edit`（不需動，僅參考結構）|
| Google Sheets | 報名追蹤表（驗收用）+ 活動設定表 Phase5 v5 |

---

## 7. 開工 SOP

```bash
# 1. 預檢（30 秒，從 Cowork 對話確認過 4/30 早上已通過）
cd ~/Documents/Claude/Projects/太陽實驗室團報流程改進/github-repo/
bash scripts/issue-6-precheck.sh

# 2. 確認 git 同步
git status
git pull origin main  # 確認最新

# 3. Playwright 開 Make Editor
# (透過 Playwright MCP 執行)
# Browser: 開新 context → 載入 cookies (若有) → 進 https://us2.make.com/2085532/scenarios/4596472/edit
# 注意：Make 需要登入，第一次 Playwright session 可能要您手動登入

# 4. 依 docs/issues/issue-6-v2-morning-operation-card.md §1-§4 逐步執行
# 5. 依 §5 跑 T1
# 6. 完成後 commit 操作卡 checkbox 已勾、git push
```

---

## 8. 給 Claude Code 的開場 Prompt（複製貼用）

> Jackson 把以下文字當作 Claude Code 第一個對話的開場 prompt：

```
我要繼續 Issue #6 v2 的主操作。請先依序讀以下檔案吸收 context：

1. docs/handoff/2026-04-30-cowork-to-claude-code-issue-6.md (本交接文件)
2. docs/issues/issue-6-v2-morning-operation-card.md (執行 SOP)
3. docs/issues/issue-6-v2-token-drag-troubleshooting.md (故障判讀)
4. docs/issues/issue-6-implementation-spec.md (完整 v2 spec)

並讀以下 memory 檔（在 spaces/.../memory/ 路徑下）：
5. feedback_make_iml_api_risk.md
6. feedback_make_iml_tally_label_vs_key.md
7. reference_tally_form_checkboxes_structure.md
8. reference_make_blueprint_module_paths.md
9. project_winter_camp_sprint.md

讀完後請回報：
- 你對 Issue #6 v2 的理解（一段話）
- 你打算如何用 Playwright 驗證 token drag metadata 是否成功
- 對「Playwright 合成事件 vs React DnD」的處理計畫
- 不確定或想 push back 的地方

我會先確認你的計畫再開始執行。本任務有 4/29 整天走錯方向的歷史，請務必先理解 context、不要急著動手。
```

---

## 9. 不要做的事

| ❌ 禁止 | 原因 |
|---|---|
| 直接 API PATCH blueprint 改 IML（涉及 reference token 的）| 4/28 方案 B 慘案；token metadata 純 API 寫不進去 |
| 用 Chrome Console / page.evaluate 直接改 React state 注入 token | 與 Make source code 強耦合，未來版本壞 |
| 假設 Tally 結構（不論看起來多像 MULTIPLE_CHOICE）| 必須先讀真實 webhook payload 才動手 |
| 未跑 Run Once 驗證就 Save | Save 後才發現失敗 = 必須走 Versions Restore，重做成本高 |
| 一次做完 4 個 Step 才驗證 | 每個 Step 完成立即 Run Once 驗證，問題早發現 |
| 操作不順時硬撐 | 5 分鐘卡住 = 立即停手 + Versions Restore + 報告 Jackson |

---

## 10. 完成定義

| 項目 | 條件 |
|---|---|
| Step 1-4 完成 | 操作卡 §1-§4 所有 checkbox ✅ |
| T1 通過 | 送 1 營隊 → Sheets 1 列 + Email 1 卡片，營隊名乾淨 |
| Scenario 已 Save | Make Versions UI 顯示新版本紀錄 |
| Issue #6 在 GitHub 留 comment | 含 commit hash、Make Versions 版本號、T1 結果截圖（可選）|
| Project Board | Issue #6 從「🔨 Building」移到「🧪 Testing」 |
| Memory 更新 | `project_winter_camp_sprint.md` 加「2026-05-01 Issue #6 v2 主操作完成」段 |
| **Make API token 撤銷** | Profile → API → 刪除 `claude-cowork-issue6` |
| T2/T3 排程 | 5/1 PM 與 5/2 進行（spec §11）|

---

## 11. 緊急聯絡

| 情境 | 動作 |
|---|---|
| Playwright drag 完全失敗（5 處都不行）| 退回手動 — Jackson 親自在 Make Editor 拖拉，Claude Code 只做截圖、Run Once、驗證 |
| Run Once 結果與預期不符 | Versions UI Restore 4/28 23:19 → Save → 重新 precheck |
| 全套混亂 | 停手回 Cowork，Jackson 帶 Claude Code transcript 來討論 |

---

*交接文件建立：2026-04-30 09:00 Cowork　接班：Claude Code + Playwright MCP　目標完成：2026-05-02*
