# Memory Bundle — Cowork → Claude Code 交接

> **目的**：Cowork session 的 memory 系統與 Claude Code 的 memory 系統不互通。本目錄是 Cowork session 累積的關鍵 memory 檔案副本，讓 Claude Code 可用 Read 工具直接讀取。
>
> **首次建立**：2026-04-30（Issue #6 交接）
> **最近更新**：2026-05-06（Issue #3 完成，新增 2 個 feedback 檔案）
> **來源**：Cowork space + Claude Code session
> **同步策略**：本 bundle 為**單向快照**。日後若於 Cowork 對話中更新 memory，需手動重新匯出至此 bundle 才會反映。

---

## 16 個檔案分類（5/6 版本）

### Feedback（必讀規則 / 教訓）

| 檔案 | 重點 | 狀態 |
|---|---|---|
| [feedback_make_iml_api_risk.md](feedback_make_iml_api_risk.md) | API PATCH IML 風險取決於內容類型；iterator output / 同模組 ref OK，跨模組 token 拼接須 UI | 🟢 不變 |
| [feedback_make_iml_tally_label_vs_key.md](feedback_make_iml_tally_label_vs_key.md) | Tally 多選實為 6 個獨立 CHECKBOXES，舊 map(...; options; ...) pattern 無效 | 🟢 不變 |
| [feedback_workflow.md](feedback_workflow.md) | 工作流：Cowork 討論 → 開發對話執行；4/30 起改用 Claude Code + Playwright/API | 🟢 不變 |
| [feedback_tally_checkbox_null_not_empty.md](feedback_tally_checkbox_null_not_empty.md) | CHECKBOXES 未勾選送 **null** 不是字串 `"empty"`；Filter 必加 `if(5.value)` 真值判斷 | 🟢 不變 |
| [feedback_make_blueprint_filter_paths.md](feedback_make_blueprint_filter_paths.md) | edge filter `flow[i].filter` vs mapper filter `flow[i].mapper.filter` 路徑完全不同 | 🟢 不變 |
| [feedback_make_iml_replace_empty_args.md](feedback_make_iml_replace_empty_args.md) | `replace(s; pat; )` 缺第三引數 silent noop（不報錯不替換）| 🟢 Issue #12 已修補 |
| [feedback_acceptance_test_downstream_refs.md](feedback_acceptance_test_downstream_refs.md) | 驗收必涵蓋 5 處下游 ref（M8/M10/M11/M13/M27）；T12 雙營隊案例 | 🟢 不變 |
| [feedback_make_iml_html_embedding.md](feedback_make_iml_html_embedding.md) | HTML 字串內嵌 IML 直接 `{{expr}}`，不加 `&` 不加引號 | 🟢 不變 |
| [feedback_iml_lint_form_consistency.md](feedback_iml_lint_form_consistency.md) | 批次 PATCH 多模組 IML 必跑 expected map / 缺引數 regex / GET 回讀 / snapshot diff | 🟢 不變 |
| [feedback_make_iml_parsedate_throws.md](feedback_make_iml_parsedate_throws.md) | Make IML `parseDate` 對非法日期直接 **throw error**（非回 null）；必須用 length+substring 預檢格式 | 🆕 **5/6 新增**（Issue #3 教訓）|
| [feedback_make_iml_no_and_or_not.md](feedback_make_iml_no_and_or_not.md) | Make IML **無** `and()`/`or()`/`not()`；多條件必須用巢狀 `if()` | 🆕 **5/6 新增**（Issue #3 教訓）|

### Reference（查表 / 設定）

| 檔案 | 重點 | 狀態 |
|---|---|---|
| [reference_tally_form_checkboxes_structure.md](reference_tally_form_checkboxes_structure.md) | Tally form `MeYEJ8` 真實結構；label `？` 後**有空格**；未勾選 value=**null** | 🟢 不變 |
| [reference_make_blueprint_module_paths.md](reference_make_blueprint_module_paths.md) | scenario 4596472 v11（post-Issue-3）；14 Module（含 M28）+ Module 9 IML + ops 公式 | 🔄 **5/6 更新**（v8→v11，新增 M28、M9 IML 更新）|
| [reference_tally_test_path_branch.md](reference_tally_test_path_branch.md) | 1 個營隊走單選分支不觸發 iterator；測試多營隊必選 ≥ 2；ops = `5 + N × 8` | 🟢 不變 |

### Project（進行中 + 已完成）

| 檔案 | 重點 | 狀態 |
|---|---|---|
| [project_winter_camp_sprint.md](project_winter_camp_sprint.md) | Sprint W18-W20；順序 #6✅→#1✅→#12✅→#2✅→#3✅→#8⬜；Issue #3 5/6 完成 | 🔄 **5/6 更新**（#3 ✅）|
| [project_issue_1_payment_button_dynamic.md](project_issue_1_payment_button_dynamic.md) | Issue #1 ✅ 已完成（commit 65aa256）；新增 Module 27；採方案 A（API PATCH）非原 D | 🟢 不變 |

---

## 5/6 主要變更摘要（Issue #3 完成）

| 維度 | 5/1 PM bundle（v3）| 5/6 bundle（v4）|
|---|---|---|
| 檔案數 | 14 + INDEX | 16 + INDEX |
| 新增 feedback | — | `feedback_make_iml_parsedate_throws.md`、`feedback_make_iml_no_and_or_not.md` |
| Sprint 進度 | #3 ⬜、#8 ⬜ | **#3 ✅**、#8 ⬜ |
| Blueprint 版本 | v8（post-Issue-12）| **v11**（post-Issue-3）|
| Module 數 | 13 | **14**（新增 M28 alert email）|

---

## 仍未複製的 memory（供參）

以下 memory 檔案位於 Cowork session 但仍未複製到此 bundle。如需可請 Jackson 從 Cowork 對話再次匯出：

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

## 給 Claude Code 的閱讀順序建議（Issue #8 場景）

| 順序 | 檔案 | 為什麼 |
|---|---|---|
| 1 | `project_winter_camp_sprint.md` | 當前 sprint 狀態（#8 待開始）|
| 2 | `reference_make_blueprint_module_paths.md` | v11 blueprint 架構、M28 位置、M9 IML |
| 3 | `feedback_iml_lint_form_consistency.md` | 動 IML 前的 lint 守則 |
| 4 | `feedback_acceptance_test_downstream_refs.md` | 驗收方法論 |
| 5 | `feedback_make_iml_api_risk.md` | API PATCH 安全範圍 |
| 6 | `feedback_make_iml_parsedate_throws.md` | Issue #3 教訓：parseDate 行為 |
| 7 | `feedback_make_iml_no_and_or_not.md` | Issue #3 教訓：無 and/or/not |

---

*本 INDEX 由 Claude Code session 於 2026-05-06 更新（Issue #3 完成）。*
