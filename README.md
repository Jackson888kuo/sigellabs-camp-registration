# 太陽實驗室 Sigel Labs｜團報自動化系統

> 太陽實驗室（**Sigel Labs**）營隊「團報多營隊報名」自動化流程的開發紀錄、規格、SOP 與維運資料。
> 整合 **Tally / Make.com / HubSpot / Google Sheets / SendGrid**，採無程式碼（no-code）架構實作。

| 項目 | 狀態 |
|---|---|
| 規格書版本 | **v1.4** |
| Make Scenario 版本 | **v5.1**（Scenario `4596472`） |
| 當前 Sprint | **Winter Camp Prep 2026（W18–W20）** |
| 開發完成目標 | **2026-05-15**（冬令營版） |
| 測試期 | 2026-05-16 ~ 2026-05-31 |
| 實際啟用 | 2026 冬令營（12 月） |
| Repo 建立 | 2026-04-28 |
| 最後更新 | **2026-04-30** |

---

## 目錄

1. [專案定位](#-專案定位)
2. [系統架構](#-系統架構)
3. [當前 Sprint 焦點](#-當前-sprint-焦點)
4. [文件導覽](#-文件導覽)
5. [Issue 追蹤](#-issue-追蹤)
6. [重要踩雷與設計決策](#-重要踩雷與設計決策)
7. [AI 協作工作流](#-ai-協作工作流)
8. [版本演進與 Roadmap](#-版本演進與-roadmap)
9. [敏感資料管理](#-敏感資料管理)

---

## 🎯 專案定位

| 項目 | 說明 |
|---|---|
| **業務目標** | 將 Sigel Labs 多營隊團報流程從「人工處理」轉為「自動化系統」，降低營運成本、提升客戶體驗 |
| **核心場景** | 一張表單同時報多個營隊（含團報優惠折扣自動計算） |
| **當前狀態** | Make scenario `4596472` 為**獨立開發中的孤立系統**，與真實業務尚未連線；夏令營招生仍為人工流程 |
| **首次上線** | 2026 冬令營（12 月）為實際啟用節點 |

---

## 🗺 系統架構

```
Tally Form（含 6 個獨立 CHECKBOXES：每個營隊一題）
    ↓
Make.com Webhook（Scenario 4596472, v5.1）
    ↓
HubSpot Contact（Create / Update）
    ↓
Iterator（依勾選展開為多筆營隊資料）
    ↓
Google Sheets Search Rows（抓 Phase 5 活動設定表，13 欄）
    ↓
Tools – Set Variables（period / price / payment_link）
    ↓
HubSpot Deal + Association（一營隊 = 一筆 Deal）
    ↓
Google Sheets Add Row（追蹤表）
    ↓
Array Aggregator + SendGrid（確認信，含動態付款連結）
```

| 元件 | 角色 | 備註 |
|---|---|---|
| **Tally** | 報名表單入口 | 多營隊以 6 個獨立 CHECKBOXES 呈現，非單一 multi-select |
| **Make.com** | 編排引擎 | Scenario `4596472`，採 Iterator 架構（一營隊 = 一筆 Deal） |
| **HubSpot** | CRM | Contact / Deal / Association；Deal 屬性對應營隊 |
| **Google Sheets** | 設定表 + 追蹤表 | Phase 5 活動設定表共 13 欄，含 4 種單價 + 4 個付款連結 |
| **SendGrid** | 確認信寄送 | 動態 payment_button_html（Issue #1 動態化進行中） |
| **WooCommerce** | 付款連結來源 | API 唯讀讀取（開發測試用，非真實連結） |

詳細流程圖請見 [docs/團報流程圖.html](docs/團報流程圖.html)。

---

## 🚀 當前 Sprint 焦點

**Winter Camp Prep 2026**（2026-04-30 ~ 2026-05-15，共 16 天）

### Sprint Backlog（依執行順序）

| # | Issue | 優先級 | 工作量 | 排程 | 狀態 |
|---|---|---|---|---|---|
| #6 | 多營隊 Iterator：勾 2 寫 6（Tally CHECKBOXES 結構修正） | **P1** | 1.5 天 | 4/30–5/2 | 🔄 進行中 |
| #2 | 多營隊報名情境驗收測試 | P2 | 0.5 天 | 5/2 | ⬜ 待 #6 完成 |
| #1 | Module 10 payment_button_html 動態化 | **P1** | 1 天 | 5/3 | ⬜ Spec v3 已備 |
| #3 | 早鳥日期防呆強化 | enhancement | 0.5 天 | 5/4 | ⬜ 待 #1 完成 |
| #8 | J 欄無表頭 + IML 未解析 | P3 | 1 天 | 5/6–5/8 | ⬜ |

### 排除本 Sprint 的 Issues

| # | 標題 | 原因 |
|---|---|---|
| #7 | HubSpot 統計儀表板 | enhancement，冬令營後再評估 |

完整 Sprint 計畫：[docs/sprints/2026-W18-W20-winter-camp-prep.md](docs/sprints/2026-W18-W20-winter-camp-prep.md)

---

## 📚 文件導覽

### 規格與企劃

| 類別 | 檔案 | 內容 |
|---|---|---|
| 📋 企劃書 | [docs/團報多營隊報名系統改善企劃書.md](docs/團報多營隊報名系統改善企劃書.md) | 系統設計、Phase 5+ 實作執行紀錄、IML 隱藏 syntax 知識 |
| 📐 規格書（最新） | [docs/規格書_v1.4.md](docs/規格書_v1.4.md) | 當前生效版本 |
| 📐 規格書（增量） | [docs/規格書_v1.3_新增內容.md](docs/規格書_v1.3_新增內容.md) | v1.3 增量內容（歷史參考） |
| 🗺 流程圖 | [docs/團報流程圖.html](docs/團報流程圖.html) | 視覺化流程圖 |
| 📜 法務文件 | [docs/太陽實驗室課程契約書.pdf](docs/太陽實驗室課程契約書.pdf) | 課程契約書 |

### Sprint 與 Issue 規格

| 類別 | 檔案 | 內容 |
|---|---|---|
| 🏃 Sprint 計畫 | [docs/sprints/2026-W18-W20-winter-camp-prep.md](docs/sprints/2026-W18-W20-winter-camp-prep.md) | 冬令營版開發 Sprint Backlog |
| ⚙️ Issue #1 規格 | [docs/issues/issue-1-implementation-spec.md](docs/issues/issue-1-implementation-spec.md) | Module 10 payment_button_html 動態化 spec v3 |
| ⚙️ Issue #1 紀錄 | [docs/issues/issue-1-comment-2026-04-28.md](docs/issues/issue-1-comment-2026-04-28.md) | Issue #1 討論紀錄 |
| ⚙️ Issue #5 實作 | [docs/issues/issue-5-implementation.md](docs/issues/issue-5-implementation.md) | 時間欄位處理（Sheets timezone + Make formatDate） |
| ⚙️ Issue #5 補資料 | [docs/issues/issue-5-backfill.gs](docs/issues/issue-5-backfill.gs) | Apps Script backfill |
| ⚙️ Issue #6 規格 | [docs/issues/issue-6-implementation-spec.md](docs/issues/issue-6-implementation-spec.md) | Tally CHECKBOXES 結構修正 spec |
| ⚙️ Issue #6 操作卡 | [docs/issues/issue-6-v2-morning-operation-card.md](docs/issues/issue-6-v2-morning-operation-card.md) | 早晨操作卡片 |
| ⚙️ Issue #6 排錯 | [docs/issues/issue-6-v2-token-drag-troubleshooting.md](docs/issues/issue-6-v2-token-drag-troubleshooting.md) | IML token UI 拖拉踩雷紀錄 |
| ⚙️ Issue #N 草稿 | [docs/issues/issue-N-J-column-anomaly-draft.md](docs/issues/issue-N-J-column-anomaly-draft.md) | J 欄異常草稿 |

### Bug 追蹤與交接

| 類別 | 檔案 | 內容 |
|---|---|---|
| 🐛 Bug 紀錄 | [docs/bugs/2026-04-28_multi_camp_registration_iterator_bug.md](docs/bugs/2026-04-28_multi_camp_registration_iterator_bug.md) | 多營隊 Iterator bug 完整紀錄 |
| 🤝 Handoff | [docs/handoff/2026-04-30-cowork-to-claude-code-issue-6.md](docs/handoff/2026-04-30-cowork-to-claude-code-issue-6.md) | Cowork ↔ Claude Code 交接（Issue #6） |
| 📦 Snapshots | [docs/snapshots/](docs/snapshots/) | Make blueprint 版本快照（回滾依據） |

### SOP 與 模板

| 類別 | 檔案 | 內容 |
|---|---|---|
| 📘 SOP | [sop/活動設定表維護SOP_v1.docx](sop/活動設定表維護SOP_v1.docx) | 活動設定表維護流程 |
| 📘 SOP | [sop/Phase5_匯入SOP_v1.docx](sop/Phase5_匯入SOP_v1.docx) | Phase 5 匯入流程 |
| 📘 SOP | [docs/SOP_夥伴使用Gemini建Issue.md](docs/SOP_夥伴使用Gemini建Issue.md) | 非技術夥伴透過 Gemini 提交 Issue 流程 |
| 📘 設定 | [docs/PROJECT_BOARD_SETUP.md](docs/PROJECT_BOARD_SETUP.md) | GitHub Project Board 初始化 |
| ✉️ Email 模板 | [templates/sendgrid_email_v2.html](templates/sendgrid_email_v2.html) | 確認信 v2 |
| ✉️ Email 模板 | [templates/confirmation_email_fixed.html](templates/confirmation_email_fixed.html) | 確認信修正版 |

### 協作與 Memory

| 類別 | 檔案 | 內容 |
|---|---|---|
| 🤝 AI 協作 | [docs/AI協作工作流.md](docs/AI協作工作流.md) | Cowork / Claude Code / GitHub Issues / `gh` CLI 分工與啟動模板 |
| 🤝 Gemini 設定 | [docs/gemini_gem_設定.md](docs/gemini_gem_設定.md) | 夥伴用 Gemini Gem 設定 |
| 🧠 Memory Bundle | [docs/memory-bundle/INDEX.md](docs/memory-bundle/INDEX.md) | 跨對話載入的關鍵上下文（IML 風險、Tally 結構、Sprint 等） |

---

## 🐛 Issue 追蹤

待修正項目、新功能需求、文件更新請開 [Issue](../../issues/new/choose)，使用對應模板：

| 模板 | 適用情境 |
|---|---|
| 🐛 Bug 報告（`bug_report.yml`） | 系統異常、邏輯錯誤、Email 渲染問題 |
| ✨ 功能增強（`feature_request.yml`） | 新功能、邏輯升級、流程改善 |
| 📝 文件改進（`docs_update.md`） | 企劃書、規格書、SOP 補充或更新 |
| ⚙️ 設定變更（`config_change.md`） | 活動設定表新增 row、HubSpot 欄位調整、Tally 表單修改 |

優先級體系（P0–P4）詳見 Memory Bundle 中的優先級 Label 說明。

---

## ⚠️ 重要踩雷與設計決策

以下是專案進行中累積的關鍵教訓，**強烈建議**所有協作者（含 AI）開工前先讀過。

| # | 主題 | 教訓 | 應對方式 |
|---|---|---|---|
| 1 | **公司名稱拼字** | 必須拼為 **Sigel Labs**，非 SIGE Labs / SIGEL Labs | 所有文件、Email、模板統一使用 Sigel Labs |
| 2 | **Make IML reference token** | 純 API 寫入長度看似正確，但執行時 resolve 失敗 | Reference token 必須在 Make UI 拖拉建立，**不可純 API 寫入** |
| 3 | **Tally 多選結構** | scenario 4596472 的 Tally 多選實為 **6 個獨立 CHECKBOXES**，每題 label 含營隊名 | 不可套用舊 `map(...; options; ...)` pattern；參考 [Issue #6 spec](docs/issues/issue-6-implementation-spec.md) |
| 4 | **Sheets 時間欄位** | 整欄 cell format 與 Make `formatDate` 必須**雙管齊下**，缺一不可 | Sheets 設定 cell format + Make 端再 format 一次（Issue #5 經驗） |
| 5 | **早鳥日期判斷** | 依賴 Sheets column D 為 ISO 格式 | 維護時注意格式一致性；Issue #3 規劃防呆強化 |
| 6 | **架構選擇：方案 B** | 一營隊 = 一筆 Deal（Iterator 展開），非合併單一 Deal | 可正確產生 HubSpot Association 與獨立追蹤 |

---

## 🤝 AI 協作工作流

本專案採用三方 AI 協作架構：

| 角色 | 工具 | 用途 |
|---|---|---|
| **規劃 / 討論** | Claude Cowork | 方向討論、規格產出、Issue 起草 |
| **大量編碼 / 重構** | Claude Code（VS Code） | SendGrid HTML、複雜重構、Make blueprint 操作指令 |
| **夥伴提 Issue** | Gemini Gem | 非技術夥伴透過 Gemini 結構化提交 Issue |
| **動作執行** | `gh` / `git` CLI（人工） | push / 建 issue / close issue 等動作型指令 |

完整流程與啟動模板：[docs/AI協作工作流.md](docs/AI協作工作流.md)

---

## 📈 版本演進與 Roadmap

### 規格書版本

| 版本 | 重點 |
|---|---|
| v1.1 | 初始規格 |
| v1.3 | 增量內容（歷史） |
| **v1.4** | 當前生效版本 |

### Make Scenario 版本

| 版本 | 重點 |
|---|---|
| v5.0 | Iterator 架構落地 |
| **v5.1** | IML 修正、Module 5/8/10/11/13 mapper 路徑精確化（M11「×→x」修正） |

### Roadmap

| 階段 | 目標 | 時間 |
|---|---|---|
| **冬令營版（v5.1）** | Issue #6 / #2 / #1 / #3 / #8 完成；冬令營實際啟用 | 2026-05-15 開發完成 → 12 月啟用 |
| 春季營版 | 整合真實業務流程；Staging → Production 切換 | 待冬令營驗收後規劃 |
| 統計儀表板（Issue #7） | HubSpot 報表與儀表板 | 冬令營後再評估 |

---

## 🔒 敏感資料管理

以下檔案**故意未上傳**（位於本機 workspace），請勿 push：

| 檔案類型 | 範例 | 風險 |
|---|---|---|
| Google OAuth 憑證 | `client_secret_*.json` | 帳號接管 |
| Make Blueprint（完整） | `make_blueprint*.json` | 含 WooCommerce ck_/cs_ + HubSpot connection ID |
| 測試 payload | `test_payloads_*.json` | 含個資 |
| 活動設定表（含 token） | `活動設定表_Phase5*.xlsx` | 含付款 token |

> ⚠️ 更動 Make.com scenario 請直接於 **Make Editor** 操作，本 repo 僅作為**規格與紀錄**用途。
> ⚠️ Make IML reference token 必須透過 UI 拖拉建立（純 API 寫入會失敗）。

---

## 📞 聯絡與維護

| 項目 | 資訊 |
|---|---|
| 專案維護 | Jackson（Sigel Labs 營運管理） |
| GitHub Repo | `Jackson888kuo/sigellabs-camp-registration` |
| Issue 提交 | [開新 Issue](../../issues/new/choose) |
| Project Board | [Sigel Labs 報名系統開發看板](../../projects) |

---

*Repo 建立：2026-04-28　|　最後更新：2026-04-30*
