---
name: 工作流程慣例
description: Jackson 的開發工作流程：Cowork 討論功能方向與規格，確認後開新對話進行實際開發
type: feedback
originSessionId: f3cdc579-7b4c-4eb6-b60b-e8c7c8209bc4
copiedFrom: Cowork session memory 2026-04-30
---
Jackson 的工作流程分兩個階段：

1. **討論階段（Cowork）**：在 Cowork 討論新功能方向、比較方案優缺點、確認規格設計
2. **開發階段（新對話）**：確認方向後，開新對話進行實際的 Make.com、HubSpot、Google Sheets 等系統設定

**Why:** 這樣可以讓討論與執行分開，不會混在一起，也讓每次開發對話有明確的任務範圍。

**How to apply:** 在 Cowork 對話中，聚焦在規格討論與決策；不需要急著給出實作步驟，先把方向確認清楚。開發對話開始時，直接切入已確認的規格執行。

**企劃書更新規則：** 每當有新功能確認或完成時，在 Google Drive 建立新版本的企劃書（如 v1.4、v1.5），不修改舊版。目前最新版為 v1.3（文件 ID：15nq2gQmlh2cRkn9VWk-8aQLSoB5QQjQJsSZLGEbps2w）。

## 2026-04-30 工作流升級：開發階段改用 Claude Code + Playwright MCP

| 階段 | 工具 | 備註 |
|---|---|---|
| 討論 / 規格 | Cowork（Claude 桌面端）| 不變 |
| 開發 / 執行 | **Claude Code（VS Code IDE）+ Playwright MCP server** | 4/30 起替代「Cowork + Chrome MCP」做瀏覽器自動化 |

**Why（4/30 從 Cowork 切到 Claude Code 的原因）：**
- IDE 環境對 repo 操作（git、檔案編輯、終端機）更方便
- Playwright MCP 提供 browser automation 能力，比 Chrome MCP 更接近 dev 工具鏈
- 但 Playwright 對 React DnD HTML5 backend 的合成事件支援不確定（Make Editor 等 React 應用可能拖拉失敗）

**How to apply（Claude Code session 啟動時）：**

1. **每個新開發對話的第一動作**：請 Claude Code 讀對應的「交接文件」（位於 `docs/handoff/YYYY-MM-DD-<context>.md`）以承接前一階段成果
2. **Make Editor token drag 操作守則**：
   - 第一次拖拉先在最簡單場景試 Playwright `dragTo()`
   - 拖拉後**必須雙重驗證**：(a) DOM 截圖確認彩色膠囊 (b) Run Once 看 Module OUTPUT
   - 若失敗 → 改請 Jackson 手動拖那一個 token、Claude Code 只做截圖與 Run Once
3. **不再嘗試 API PATCH IML reference token**（4/28 方案 B 慘案教訓）
4. **每個 Step 完成立即驗證**，不累積到最後一起驗
5. **遇到結構性問題（不是執行小 bug）→ 停手回 Cowork 討論**，而非硬撐

## 2026-04-30 Memory bundle 機制（Cowork → Claude Code）

Cowork 的 memory 系統與 Claude Code 不互通。從 Cowork 切到 Claude Code 時：

1. Cowork session 將 6 個關鍵 memory 副本至 `docs/memory-bundle/`
2. Claude Code 用 Read 工具讀取 bundle（不依賴 Anthropic memory subsystem）
3. Bundle 為**單向快照** — Claude Code 修改後不會自動同步回 Cowork memory
4. 需在 Cowork 對話中手動 sync：請 Cowork 重讀 bundle 並更新 memory

**何時更新 bundle：**
- 每個 Sprint 重大里程碑後（Issue 完成、spec 重寫等）
- Cowork 對話結束、即將切到 Claude Code 前
- Claude Code 對話結束、回到 Cowork 討論前
