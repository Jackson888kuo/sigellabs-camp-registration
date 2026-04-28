# AI 協作工作流

太陽實驗室團報自動化專案的 **Claude AI 協作標準流程**。本文件記錄 Cowork、Claude Code、GitHub Issues、`gh` CLI 之間的分工與啟動模板，便於專案維護者快速接續開發、回報 Bug、規劃新階段。

---

## 1. 核心原則

| 原則 | 說明 |
|---|---|
| **以 GitHub Issue 為錨** | 所有開發任務、Bug 修復、改善需求皆綁定 Issue 編號。溝通時引用編號即可，無需重複描述背景 |
| **Memory 自動載入** | Cowork 開新對話時，Claude 會自動讀取 `MEMORY.md` 索引，掌握專案狀態、Make 進度、過往決策 |
| **Cowork 規劃 / Claude Code 執行** | 在 Cowork 對話與 Claude 討論方向、產出計畫；實際大量改 code（如 SendGrid HTML、複雜重構）開新對話到 Claude Code |
| **動作型工具用 `gh` CLI** | claude.ai 內建的 GitHub Integration 僅提供讀取與附加檔案，不提供 push / 建 issue 等動作工具。Cowork 中由 Claude 起草指令，使用者在 Terminal 用 `gh` / `git` 執行 |

---

## 2. 任務情境與溝通模板

### 情境 A：處理已知 Issue（最常用）

| 步驟 | 對話範例 | Claude 預期動作 |
|---|---|---|
| 1 | 「請開始處理 issue #N」 | 用 `gh issue view N` 讀完 issue + 相關 memory + 企劃書章節，回報理解 |
| 2 | 「給我建議方案」 | 列出 2-3 個實作方向（含優缺點表格） |
| 3 | 「採用方案 X，請給我可貼上的指令」 | 產出 Terminal / Make 可直接套用的步驟 |
| 4 | （使用者執行後回報結果） | 驗收 / 除錯 / 進入下一步 |
| 5 | 「請更新 issue 並關閉」 | 起草 issue comment + 提供 `gh issue close` 指令 |

### 情境 B：發現新 Bug（從零建單）

| 步驟 | 對話範例 | Claude 預期動作 |
|---|---|---|
| 1 | 「Module 9 在多營隊情境下 Iterator 沒展開，請幫我建 issue」 | 詢問必要細節（重現步驟、Run ID、預期 vs 實際）；若 memory 已有上下文則先帶入 |
| 2 | 「直接幫我寫好內容」 | 起草 issue body 含模板格式 |
| 3 | （使用者 review 後）「OK 建立」 | 給 `gh issue create ...` 完整指令 |
| 4 | 「現在開始修」 | 進入情境 A 的流程 |

### 情境 C：新功能 / 階段性升級

| 步驟 | 對話範例 | Claude 預期動作 |
|---|---|---|
| 1 | 「我想啟動 Phase 6，目標是 [...]」 | 詢問範圍 / 目標 / 截止日 / 已知限制 |
| 2 | 「請幫我規劃」 | 產出 Phase 規劃書（scope、milestones、風險） |
| 3 | 「拆解為 Issues」 | 為每個 milestone 產出對應 GitHub Issue 草稿 + 建立指令 |
| 4 | 「更新企劃書」 | 在本機 `docs/` 加新章節，commit + push |

### 情境 D：快速詢問 / 不需建 Issue

| 對話範例 | 適用場景 |
|---|---|
| 「Make IML if 表達式怎麼處理 null 值？」 | 純技術問題，從 memory 已知背景秒答 |
| 「我忘了活動設定表 column D 是什麼欄位」 | 查 memory 即可 |
| 「我們 Phase 5 完成什麼了？」 | 從 memory 與 `git log` 查 |

---

## 3. 跨對話啟動最佳實踐

每次 Cowork 開新對話會重置上下文（但 memory 自動帶入）。以下是不同情境的「最佳開場白」：

| 情境 | 建議開場白 | 為什麼有效 |
|---|---|---|
| **延續上次未完成工作** | 「請先讀 MEMORY.md 與 [相關 memory file]，告訴我目前狀態，然後我們繼續處理 [X]」 | 強制 Claude 先 sync context，避免遺漏 |
| **針對特定 Issue 開工** | 「處理 issue #N」 | Claude 會自動 `gh issue view N` 取得最新內容 |
| **不確定該先做什麼** | 「列出目前所有 open issues + memory 中的待辦，建議我接下來該優先處理什麼」 | 讓 Claude 做優先級評估 |
| **臨時起意要查資料** | 「[直接問問題]」 | Memory 已載入，可直接答 |

---

## 4. Cowork 與 Claude Code 分工原則

| 工作類型 | 使用工具 | 原因 |
|---|---|---|
| **規劃 Phase / 寫 issue / 更新文件 / 起草 SOP** | Cowork | 偏向討論與內容產出，需要 memory 與多輪對話 |
| **改 Make scenario blueprint** | 直接在 Make Editor，討論先在 Cowork | Make 沒有 MCP，無法 API 化操作 |
| **改 SendGrid Email HTML / 寫程式 / 大量重構** | Claude Code（新對話） | 程式碼編輯能力更強，可直接操作 repo |
| **執行 `gh` / `git` 指令** | 使用者在 Terminal，Claude（Cowork）給指令 | Terminal 在 Cowork 是 click-only tier，由 Claude 給指令使用者貼上 |
| **建立 / 關閉 issues、補 comments** | Cowork（Claude 給指令使用者執行） | 仍透過 `gh` CLI |
| **PR review / 追 commit 歷史** | Claude Code（如有需要） | 程式 diff 較大時更適合 |

---

## 5. 實用 Tips

| Tip | 說明 |
|---|---|
| **Issue 完成時請 Claude 同步 memory** | 「Issue #N 已關閉，請更新 memory」可避免下次接手時資訊過時 |
| **重大決策請 Claude 寫成 ADR** | 「這次決定 X 而非 Y，請把理由寫成 memory」可保留決策脈絡 |
| **截止日期務必明確** | Make scenario 影響線上家長報名，截止日期會被列為 P0 並反覆提醒 |
| **目標精準描述** | 「修一下 Module 10」太模糊；「Module 10 5/5 後切換動態 if 判斷」夠精確 |
| **不同意建議直接說** | 「不要 A 方案，我想 B」Claude 會立即調整，不會糾結 |

---

## 6. 立即可用對話範本

### 範本 1：開工處理 Issue

```
請處理 issue #N。先讀 issue 內容 + 企劃書相關章節 + memory，
報告你的理解，然後給我 2-3 個實作方案的優缺點比較。
```

### 範本 2：新 Bug 建單

```
我發現一個問題：[簡述症狀]
影響的 Module / 模組：[填]
重現步驟：[簡述]
請幫我擬好 issue body 並給建立指令。
```

### 範本 3：跨對話接手

```
請先讀 MEMORY.md 摘要當前狀態，列出：
1. 目前 open issues
2. 進行中或待辦事項
3. 你建議優先處理什麼
```

### 範本 4：規劃新 Phase

```
我想規劃 Phase N，目標是 [...]
已知限制 / 截止日：[...]
請幫我產出 scope、milestones、風險評估，並拆解為 GitHub Issues。
```

---

## 7. 工具速查

### `gh` CLI 常用指令

| 用途 | 指令 |
|---|---|
| 進 repo 目錄 | `cd ~/Documents/Claude/Projects/太陽實驗室團報流程改進/github-repo/` |
| 列 open issues | `gh issue list --repo Jackson888kuo/sigellabs-camp-registration` |
| 看單一 issue | `gh issue view N --repo Jackson888kuo/sigellabs-camp-registration` |
| 看 repo metadata | `gh repo view Jackson888kuo/sigellabs-camp-registration` |
| 建新 issue | `gh issue create --repo Jackson888kuo/sigellabs-camp-registration --title "..." --label "bug" --body "..."` |
| 在 issue 下留言 | `gh issue comment N --body "..."` |
| 關閉 issue | `gh issue close N` |
| 重新打開 issue | `gh issue reopen N` |

### `git` 常用指令

| 用途 | 指令 |
|---|---|
| 查狀態 | `git status` |
| 加入變更 | `git add .` |
| 提交 | `git commit -m "..."` |
| 推送 | `git push origin main` |
| 看歷史 | `git log --oneline` |
| 看 remote | `git remote -v` |

---

## 8. 環境前置條件（首次設定）

| 工具 | 安裝 | 驗證 |
|---|---|---|
| **Homebrew** | `/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"` | `which brew` |
| **GitHub CLI** | `brew install gh` | `gh --version` |
| **gh 認證** | `gh auth login`（選 GitHub.com → HTTPS → Web browser） | `gh auth status` |
| **Git credential helper** | `gh auth setup-git` | `git push` 不再要求輸入密碼 |

---

## 9. 維護紀錄

| 日期 | 變更 | 變更者 |
|---|---|---|
| 2026-04-28 | 初版建立 | Jackson + Claude（Cowork） |

---

*本文件為活文件，未來工作流調整時持續維護更新。*
