# 太陽實驗室 2026 夏令營 團報自動化

太陽實驗室 (SIGEL Labs) 夏令營「團報多營隊報名」自動化流程的開發紀錄、規格與維護資料。

## 系統架構

```
HubSpot Form
    ↓
Make.com Webhook (Scenario 4596472)
    ↓
HubSpot Contact (Create/Update)
    ↓
Iterator (展開多營隊勾選)
    ↓
Google Sheets Search Rows (抓活動設定)
    ↓
Tools - Set Variables (period / price / link)
    ↓
HubSpot Deal + Association
    ↓
Google Sheets Add Row (追蹤表)
    ↓
Array Aggregator + SendGrid (確認信)
```

## 文件導覽

| 類別 | 檔案 | 內容 |
|---|---|---|
| 📋 企劃 | [docs/團報多營隊報名系統改善企劃書.md](docs/團報多營隊報名系統改善企劃書.md) | 系統設計、Phase 5+ 實作執行紀錄、IML 隱藏 syntax 知識 |
| 📐 規格 | [docs/規格書_v1.4.md](docs/規格書_v1.4.md) | 最新規格 v1.4 |
| 📐 規格 | [docs/規格書_v1.3_新增內容.md](docs/規格書_v1.3_新增內容.md) | v1.3 增量內容 |
| 🗺 流程 | [docs/團報流程圖.html](docs/團報流程圖.html) | 視覺化流程圖 |
| 📜 法務 | [docs/太陽實驗室課程契約書.pdf](docs/太陽實驗室課程契約書.pdf) | 課程契約書 |
| 📘 SOP | [sop/活動設定表維護SOP_v1.docx](sop/活動設定表維護SOP_v1.docx) | 活動設定表維護流程 |
| 📘 SOP | [sop/Phase5_匯入SOP_v1.docx](sop/Phase5_匯入SOP_v1.docx) | Phase 5 匯入流程 |
| ✉️ 模板 | [templates/sendgrid_email_v2.html](templates/sendgrid_email_v2.html) | 確認信 v2 |
| ✉️ 模板 | [templates/confirmation_email_fixed.html](templates/confirmation_email_fixed.html) | 確認信修正版 |
| 🤝 協作 | [docs/AI協作工作流.md](docs/AI協作工作流.md) | Claude AI 協作標準流程：Cowork / Claude Code / GitHub Issues / gh CLI 分工與啟動模板 |

## Issue Tracking

待修正項目、新功能需求、文件更新請開 [Issue](../../issues/new/choose)，使用對應模板：

| 模板 | 適用情境 |
|---|---|
| 🐛 Bug 修復 | 系統異常、邏輯錯誤、Email 渲染問題 |
| ✨ 功能增強 | 新功能、邏輯升級（如 5/5 後 period 切換為動態 if）|
| 📝 文件改進 | 企劃書、規格書、SOP 補充或更新 |
| ⚙️ 設定變更 | 活動設定表新增 row、HubSpot 欄位調整、Tally 表單修改 |

## 已知限制（截至 v1.1）

| # | 項目 | 影響 |
|---|---|---|
| 1 | Module 10 payment_button_html 為早鳥 hardcoded 版 | 5/5 後需切換為 if 動態判斷 |
| 2 | 多營隊報名情境尚未實際驗收 | 需用 2-3 營隊真實表單驗證 |
| 3 | 早鳥日期判斷依賴 sheet column D 為 ISO 格式 | 維護需注意格式 |

詳見企劃書「實作執行紀錄」章節。

## 不在此 Repo 的敏感資料

以下檔案**故意未上傳**（位於本機 workspace），請勿 push：

- `client_secret_*.json` — Google OAuth 憑證
- `make_blueprint*.json` — Make.com 完整 blueprint（含 WooCommerce ck_/cs_ + HubSpot connection ID）
- `test_payloads_*.json` — 測試 payload 含個資
- `活動設定表_Phase5*.xlsx` — 含付款 token

更動 Make.com scenario 請直接於 Make Editor 操作，本 repo 僅作為**規格與紀錄**用途。

---

*Repo 建立：2026-04-28*
