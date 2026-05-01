# Memory Bundle — Cowork → Claude Code 交接

> **目的**：Cowork session 的 memory 系統與 Claude Code 的 memory 系統不互通。本目錄是 Cowork session 累積的關鍵 memory 檔案副本，讓 Claude Code 可用 Read 工具直接讀取。
>
> **首次建立**：2026-04-30（Issue #6 交接）
> **最近更新**：2026-05-01（Issue #6 + Issue #1 完成 + Issue #12 開立後同步）
> **來源**：Cowork space `43af2a77-655f-46d1-9ac5-79745c712edf` 的 memory 目錄
> **同步策略**：本 bundle 為**單向快照**。日後若於 Cowork 對話中更新 memory，需手動重新匯出至此 bundle 才會反映。

---

## 13 個檔案分類（5/1 更新版）

### Feedback（必讀規則 / 教訓）

| 檔案 | 重點 | 5/1 狀態 |
|---|---|---|
| [feedback_make_iml_api_risk.md](feedback_make_iml_api_risk.md) | API PATCH IML 風險取決於內容類型；iterator output / 同模組 ref OK，跨模組 token 拼接須 UI | 🔄 **5/1 細化**（原一刀切「必須 UI 拖拉」已鬆綁）|
| [feedback_make_iml_tally_label_vs_key.md](feedback_make_iml_tally_label_vs_key.md) | Tally 多選實為 6 個獨立 CHECKBOXES，舊 map(...; options; ...) pattern 無效 | 🟢 不變 |
| [feedback_workflow.md](feedback_workflow.md) | 工作流：Cowork 討論 → 開發對話執行；4/30 起改用 Claude Code + Playwright/API | 🟢 不變 |
| [feedback_tally_checkbox_null_not_empty.md](feedback_tally_checkbox_null_not_empty.md) | CHECKBOXES 未勾選送 **null** 不是字串 `"empty"`；Filter 必加 `if(5.value)` 真值判斷 | 🆕 **5/1 新增**（Issue #6 v2 final fix 教訓）|
| [feedback_make_blueprint_filter_paths.md](feedback_make_blueprint_filter_paths.md) | edge filter `flow[i].filter` vs mapper filter `flow[i].mapper.filter` 路徑完全不同 | 🆕 **5/1 新增**（Issue #1 慘案 77 ops 教訓）|
| [feedback_make_iml_replace_empty_args.md](feedback_make_iml_replace_empty_args.md) | `replace(s; pat; )` 缺第三引數 silent noop（不報錯不替換）| 🆕 **5/1 新增**（Issue #12 核心）|
| [feedback_acceptance_test_downstream_refs.md](feedback_acceptance_test_downstream_refs.md) | 驗收必涵蓋 5 處下游 ref（M8/M10/M11/M13/M27），不能只看 ops + email | 🆕 **5/1 新增** |
| [feedback_make_iml_html_embedding.md](feedback_make_iml_html_embedding.md) | HTML 字串內嵌 IML 直接 `{{expr}}`，不加 `&` 不加引號 | 🆕 **5/1 新增** |

### Reference（查表 / 設定）

| 檔案 | 重點 | 5/1 狀態 |
|---|---|---|
| [reference_tally_form_checkboxes_structure.md](reference_tally_form_checkboxes_structure.md) | Tally form `MeYEJ8` 真實結構；label `？` 後**有空格**；未勾選 value=**null** | 🔄 **5/1 修正**（label 空格 + null）|
| [reference_make_blueprint_module_paths.md](reference_make_blueprint_module_paths.md) | scenario 4596472 v7 post-Issue-1 的 13 個 Module + 6 處 ref 精確路徑；M11 待 #12 修補 | 🔄 **5/1 升級至 v7**（含新 Module 27）|
| [reference_tally_test_path_branch.md](reference_tally_test_path_branch.md) | 1 個營隊走單選分支不觸發 iterator；測試多營隊必選 ≥ 2；ops = `5 + N × 8` | 🆕 **5/1 新增** |

### Project（進行中 + 已完成）

| 檔案 | 重點 | 5/1 狀態 |
|---|---|---|
| [project_winter_camp_sprint.md](project_winter_camp_sprint.md) | Sprint W18-W20；順序 #6✅→#1✅→#12⬜→#2→#3→#8；含 4/29 失敗 + 4/30 主操作 + 5/1 PM review | 🔄 **5/1 大幅更新**（含 Issue #12 + 5/1 進度）|
| [project_issue_1_payment_button_dynamic.md](project_issue_1_payment_button_dynamic.md) | Issue #1 ✅ 已完成（commit 65aa256）；新增 Module 27；採方案 A（API PATCH）非原 D | 🆕 **5/1 加入 bundle**（從前次未複製改為複製）|

---

## 5/1 主要變更摘要

| 維度 | 4/30 bundle（v1）| 5/1 bundle（v2）|
|---|---|---|
| 檔案數 | 6 + INDEX | 13 + INDEX |
| 主要新增主題 | — | (a) CHECKBOXES null filter / (b) edge vs mapper filter / (c) replace `""` / (d) 驗收覆蓋 / (e) HTML IML 嵌入 / (f) Tally 測試分支 |
| Issue 進度 | #6 待主操作 | #6 ✅、#1 ✅、#12 開立 |
| 規則細化 | API PATCH 一刀切「必須 UI」 | API PATCH 分內容類型；純函式 / iterator output / 同模組 ref OK |

---

## 仍未複製的 memory（供參）

以下 memory 檔案位於 Cowork session 但 5/1 仍未複製到此 bundle。如需可請 Jackson 從 Cowork 對話再次匯出：

- `user_jackson_profile.md` — Jackson 角色與偏好
- `feedback_company_name_spelling.md` — Sigel Labs vs SIGE Labs 拼字規則
- `feedback_sheets_timezone_format.md` — Issue #5 經驗
- `reference_phase5_sheets.md` — Phase 5 活動設定表 13 欄結構
- `reference_priority_labels.md` — P0-P4 SLA 體系
- `reference_make_iml_syntax.md` — Make IML 隱藏 syntax
- `reference_github_repo.md` — Repo URL、本機路徑、gh CLI 指令
- `reference_github_project_board.md` — Project Board IDs
- `project_group_registration_v2.md` — 整體系統 v2 架構
- `project_v51_dev_isolation.md` — v5.1 為孤立開發系統

---

## 給 Claude Code 的閱讀順序建議（Issue #12 場景）

| 順序 | 檔案 | 為什麼 |
|---|---|---|
| 1 | `project_winter_camp_sprint.md` | 先看當前 sprint 狀態與順序（#12 卡在 #2 之前）|
| 2 | `feedback_make_iml_replace_empty_args.md` | Issue #12 的核心教訓 |
| 3 | `reference_make_blueprint_module_paths.md` | 6 處 ref 精確路徑（含 M11 待修補警示）|
| 4 | `reference_tally_form_checkboxes_structure.md` | label / value 結構（修補時要用 replace 對齊）|
| 5 | `feedback_make_iml_api_risk.md` | API PATCH 安全範圍（5/1 細化版）— 知道為何方案 A 安全 |
| 6 | `feedback_acceptance_test_downstream_refs.md` | 修補後驗收必涵蓋 HubSpot dealname |
| 7 | `feedback_make_blueprint_filter_paths.md` | 4/30 慘案警示，避免再踩 |
| 8 | `feedback_tally_checkbox_null_not_empty.md` | Issue #6 v2 final fix 脈絡 |
| 9 | `feedback_make_iml_html_embedding.md` | Module 27 模板語法 |
| 10 | `reference_tally_test_path_branch.md` | 驗證 #12 時 Tally 必選 ≥ 2 營隊 |
| 11 | `project_issue_1_payment_button_dynamic.md` | Issue #1 完成內容 — 含三根因，含 Issue #12 的根因引入時點 |
| 12 | `feedback_make_iml_tally_label_vs_key.md` | 補 Issue #6 v1 失敗背景 |
| 13 | `feedback_workflow.md` | 工具鏈脈絡 |

讀完 13 份 memory + 主交接文件 `docs/handoff/2026-05-01-cowork-to-claude-code-module11-replace-bug.md` = 完整 context。

---

*本 INDEX 與 13 個 memory 副本由 Cowork session 於 2026-05-01 同步更新。Claude Code 後續若需更新，可直接編輯 repo 內檔案；但同步回 Cowork memory 系統需 Jackson 手動操作。*
