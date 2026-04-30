# Memory Bundle — Cowork → Claude Code 交接

> **目的**：Cowork session 的 memory 系統與 Claude Code 的 memory 系統不互通。本目錄是 Cowork session 4/30 累積的 6 個關鍵 memory 檔案的副本，讓 Claude Code 可用 Read 工具直接讀取。
>
> **建立時間**：2026-04-30 （Cowork → Claude Code 交接時）
> **來源**：Cowork space `43af2a77-655f-46d1-9ac5-79745c712edf` 的 memory 目錄
> **同步策略**：本 bundle 為**單向快照**。日後若於 Cowork 對話中更新 memory，需手動重新匯出至此 bundle 才會反映。

---

## 6 個檔案分類

### Feedback（必讀規則 / 教訓）

| 檔案 | 重點 | 對 Issue #6 的關聯 |
|---|---|---|
| [feedback_make_iml_api_risk.md](feedback_make_iml_api_risk.md) | Reference token 必須 UI 拖拉，純 API 寫 IML 字串會失敗 | 🔴 核心 — token drag metadata 是 Issue #6 主要風險 |
| [feedback_make_iml_tally_label_vs_key.md](feedback_make_iml_tally_label_vs_key.md) | Tally 多選實為 6 個獨立 CHECKBOXES，舊 map(...; options; ...) pattern 無效 | 🔴 核心 — 4/29 v1 spec 整套錯誤的根因 |
| [feedback_workflow.md](feedback_workflow.md) | 工作流：Cowork 討論 → 開發對話執行；4/30 起改用 Claude Code + Playwright | 🟡 環境理解 |

### Reference（查表 / 設定）

| 檔案 | 重點 | 對 Issue #6 的關聯 |
|---|---|---|
| [reference_tally_form_checkboxes_structure.md](reference_tally_form_checkboxes_structure.md) | Tally form `MeYEJ8` 真實 webhook payload 結構（4/29 testing0944_T1 確認）| 🔴 核心 — v2 spec 設計依據 |
| [reference_make_blueprint_module_paths.md](reference_make_blueprint_module_paths.md) | scenario 4596472 的 12 module + 5 處 5.value reference 精確 mapper 路徑 | 🔴 核心 — 含 Module 11 「× → x」警示 |

### Project（進行中工作狀態）

| 檔案 | 重點 | 對 Issue #6 的關聯 |
|---|---|---|
| [project_winter_camp_sprint.md](project_winter_camp_sprint.md) | Sprint W18-W20 backlog；含 4/29 PM 失敗紀錄 + 4/30 AM Restore + 4/30 PM 預檢產出 | 🟢 完整時間軸與當前狀態 |

---

## 其他 memory（未複製，但供參）

以下 memory 檔案位於 Cowork session 但與 Issue #6 主操作關聯較低，未複製到此 bundle。如需可請 Jackson 從 Cowork 對話再次匯出：

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
- `project_issue_1_payment_button_dynamic.md` — Issue #1 進度

---

## 給 Claude Code 的閱讀順序建議

| 順序 | 檔案 | 為什麼這個順序 |
|---|---|---|
| 1 | `reference_tally_form_checkboxes_structure.md` | 先理解真實 Tally 結構（v1 spec 失敗的根因）|
| 2 | `feedback_make_iml_tally_label_vs_key.md` | 知道哪些 IML pattern 不能用 |
| 3 | `feedback_make_iml_api_risk.md` | 知道為什麼必須 UI 拖拉、不能 API 寫 |
| 4 | `reference_make_blueprint_module_paths.md` | 知道 5 處精確改動位置（含 Module 11 「× → x」警示）|
| 5 | `project_winter_camp_sprint.md` | 了解整體 Sprint 排程與 4/30 PM 進度 |
| 6 | `feedback_workflow.md` | 理解 Cowork → Claude Code 工具鏈升級脈絡 |

讀完 6 份 memory + 4 份主文件（spec / 操作卡 / 故障卡 / 交接文件）= 完整 context。預估閱讀總時間 30-45 分鐘。

---

*本 INDEX 與 6 個 memory 副本由 Cowork session 於 2026-04-30 一次性建立。Claude Code 後續若需更新，可直接編輯 repo 內檔案；但同步回 Cowork memory 系統需 Jackson 手動操作。*
