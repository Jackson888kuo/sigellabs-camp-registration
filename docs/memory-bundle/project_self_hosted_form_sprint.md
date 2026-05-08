---
name: Issue #13 Self-Hosted Form Sprint（W20-W22）— Phase 0 提前啟動
description: 自建報名表單取代 Tally；2026-05-08 提前 8 天啟動 Phase 0 Payload 相容性驗證；mock generator + 3 個預設 JSON + 驗收 runbook 已備齊；Phase 1 form.js 須沿用同一 schema invariant
type: project
originSessionId: 2026-05-08-cowork-staging-t13-and-issue13-phase0
---

## Sprint 範圍

| 項目 | 內容 |
|---|---|
| GitHub Issue # | **13**（內部 spec/sprint 檔案命名仍用 #9 — 命名歷史殘留）|
| Sprint | Self-Hosted Form Sprint（W20-W22）|
| 期間 | 2026-05-16 ~ 2026-06-01（17 天）|
| 上線日 | 2026-06-01（自建表單取代 Tally）|
| 對應 Spec | `docs/issues/issue-9-self-hosted-form-spec.md` |
| 對應 Sprint Plan | `docs/sprints/2026-W20-W22-self-hosted-form-sprint.md` |
| 採用策略 | Apps Script Web App + UI 對齊 Tally + 直接換（無 A/B 並行）|
| 主要風險 | **Phase 0 Payload 相容性**（go/no-go gate）|

## 5/8 提前啟動 Phase 0 的決策（Cowork）

### 為何提前 8 天

| 動機 | 說明 |
|---|---|
| 風險前置 | Phase 0 是整個 sprint 的 go/no-go gate；越早暴露 schema 不相容問題、越有時間 pivot 到 Google Forms 替代路線 |
| 不衝突當前 sprint | 用 staging（已就緒）、production 隔離；與 W18-W20 收尾、T13a-d 驗收、5/12-5/14 整合測試互不衝突 |
| 工作量可控 | Cowork 端 0.5 天即可產出 mock + runbook；Jackson 端執行 30-45 分鐘 |
| Phase 1 可接力 | Phase 0 通過後，5/16 之前 Claude Code 即可開始 Phase 1（form.js 可參考已驗證的 mock schema）|

### 5/8 已交付的 Phase 0 執行包

| 檔案 | 路徑 | 用途 |
|---|---|---|
| Mock 生成器 | `docs/forms/mocks/generate_mock_payload.py` | 模擬自建表單 JSON；可參數化家長/Email/營隊；可 `--all-presets` 一鍵產出三情境 |
| 預設 mock — 單營隊 | `docs/forms/mocks/phase0_single_camp.json` | 13 ops、`STEAM_TEST_NORMAL_FUTURE` |
| 預設 mock — 雙營隊（**主要 gate**）| `docs/forms/mocks/phase0_dual_camp.json` | **21 ops**、NORMAL_FUTURE + NORMAL_PAST |
| 預設 mock — 三營隊 | `docs/forms/mocks/phase0_triple_camp.json` | 29 ops |
| 驗收 runbook | `docs/runbooks/phase0-payload-compatibility-2026-05-08.md` | 含 invariant 表 + curl 指令 + 5 渠道檢核表 + go/no-go 判準 + 執行記錄欄位 |

## 8 個 Tally Schema Invariants（Phase 1 form.js 必須沿用）

⚠️ **這 8 點是 Phase 0 mock 與 Phase 1 form.js 共同的設計合約**。任一違反 → Make scenario 必出錯。

| # | Invariant | 為何重要 | 5/7 smoke test 失敗原因 |
|---|---|---|---|
| 1 | 頂層 `createdAt` 必須存在 | M13 Sheets A 欄用 `1.createdAt` | ❌ 漏帶 → A 欄空白 |
| 2 | `data.fields[]` 為陣列 | M5 Iterator `mapper.array = {{1.data.fields}}` | ✅ |
| 3 | `fields[2]` 必為 Email | M4 SendGrid `send_to.email = {{1.data.fields[2].value}}` 用 positional access | ❌ 位置錯 → BundleValidationError |
| 4 | label 字串完全一致 | M9/M13 用 label-based `get(map(...; "label"; "Email"); 1)` | ❌ 用 `孩子姓名（中文）` 找不到 |
| 5 | CHECKBOXES label 含括號 + 半形空格 | M8/M11/M13/M27 用 `replace(replace(5.label; "孩子要報名哪些營隊？ ("; ""); ")"; "")` 解析營隊名 | （5/7 未驗）|
| 6 | CHECKBOXES `value` 勾選時為 truthy | M5→8 edge filter `if(5.value; "yes"; "no")` 真值判斷 | （5/7 未驗）|
| 7 | 多營隊 = 多個 CHECKBOXES fields | M5 Iterator 每勾 1 營隊跑 1 次（不是單一 array value）| ✅ |
| 8 | `eventType: "FORM_RESPONSE"` | 與 Tally 一致；保險起見保留 | ✅ |

## Phase 0-6 工作分解（Sprint 原計畫）

| Phase | 內容 | 工作量 | 排程 | 主負責 | 5/8 狀態 |
|---|---|---|---|---|---|
| **Phase 0** | Payload 相容性驗證（go/no-go gate）| 0.5 天 | 5/16-5/17 → **提前到 5/8 ~ 5/11** | Claude Cowork（mock 已交付）+ Jackson（執行）| 🟡 待 Jackson 執行 curl |
| **Phase 1** | 表單核心邏輯（form.js submit + validation）| 1 天 | 5/18-5/19 | **Claude Code** | ⬜ 待 Phase 0 通過 |
| **Phase 2a** | UI 對齊 Tally 桌機 | 1.5 天 | 5/20-5/22 | Claude Code | ⬜ |
| **Phase 2b** | UI 對齊 Tally 行動裝置 | 1 天 | 5/23-5/24 | Claude Code | ⬜ |
| **Phase 3** | Apps Script 部署 + Sheets 串接 | 0.5 天 | 5/25 | Claude Code（部署由 Jackson 執行）| ⬜ |
| **Phase 4** | Make webhook 切換 | 0.5 天 | 5/26 | Claude Code | ⬜ |
| **Phase 6** | T15 + T16 端對端驗收 | 1 天 | 5/27-5/28 | Jackson + Claude Code | ⬜ |
| Buffer | 修補 + 微調 | 3 天 | 5/29-5/31 | — | — |
| **6/1** | 自建表單上線 + Tally 加搬遷說明 | — | 6/1 | Jackson | — |

## How to apply（Claude Code 接手指引）

### 場景 A：Phase 0 已通過（Jackson 回報「全綠」）

| 步驟 | 動作 |
|---|---|
| 1 | 讀本 memory + `docs/issues/issue-9-self-hosted-form-spec.md` §4 + Phase 0 驗收記錄表 |
| 2 | 進 Phase 1：建立 `docs/forms/` 三檔（index.html、style.css、form.js）|
| 3 | form.js 必須產出與 `docs/forms/mocks/generate_mock_payload.py` 相同 schema 的 JSON（**8 個 invariants 必須對齊**）|
| 4 | 不需重做 mock — 已驗證的 mock 即為 form.js 的 reference implementation |
| 5 | 開新分支 `feat/self-hosted-form` |

### 場景 B：Phase 0 部分失敗（條件通過）

| 步驟 | 動作 |
|---|---|
| 1 | 讀 Phase 0 runbook §5「異常清單」與 §4.2 故障排除表 |
| 2 | 修補 `generate_mock_payload.py` |
| 3 | Jackson 重跑 curl，直到 5 渠道全綠 |
| 4 | 通過後接場景 A |

### 場景 C：Phase 0 完全失敗（連續 3 次）

| 步驟 | 動作 |
|---|---|
| 1 | 從 Make 真實 Tally execution 抓 1 筆完整 webhook payload（Make UI → Executions → Module 1 OUTPUT → Copy JSON）|
| 2 | 用 `diff` 比對真實 Tally payload vs 本 mock，找出未對齊的 hidden field |
| 3 | 評估 Google Forms 替代路線（Sprint 仍可在 6/1 前完成、但需重排 Phase 1-6）|

## 風險與緩解

| 風險 | 機率 | 影響 | 緩解 |
|---|---|---|---|
| Phase 0 不相容 | 🟡 中 | 🔴 高 | 已備 mock 8 invariants 全對齊；失敗時用 Make 真實 execution 對比 |
| Phase 1 form.js 違反 invariant | 🟡 中 | 🔴 高 | form.js 須直接 port `generate_mock_payload.py` 的 `build_payload()` 函式 |
| Apps Script daily quota | 🟢 低 | 🟡 中 | 預估每天讀取 < 100 次，遠低於 quota |
| Apps Script 部署 OAuth 警告 | 🟡 中 | 🟢 低 | Jackson 一次同意「未驗證 app 仍要前往」即可 |
| 行動裝置 UX 缺陷 | 🟡 中 | 🟡 中 | Phase 2b 預留 1 天、Buffer 可加碼 |
| 業務同事誤碰 Tally（搬遷期）| 🟡 中 | 🟢 低 | Tally 表單描述加紅字「已搬遷至：[新表單 URL]」|

## 與其他工作的關係

| 工作 | 衝突？ | 原因 |
|---|---|---|
| W18-W20 sprint（5/15 收尾）| ❌ 不衝突 | Phase 0 用 staging、不動 production；Cowork 與 Jackson 自身工作可平行 |
| T13a-d 驗收（5/8 計畫已交付）| ❌ 不衝突 | T13 也是 staging、但測 Issue #3 fail-safe；Phase 0 測 webhook payload schema |
| 5/12-5/14 整合測試 | ❌ 不衝突 | 整合測試用 production Tally；Phase 0 用 staging webhook |
| Issue #3 staging M28 硬編碼瑕疵 | ❌ 不衝突 | 該瑕疵已決定延後合併處理（v5.2 改善清單）|

## 維護紀錄

| 日期 | 變更 | 變更者 |
|---|---|---|
| 2026-05-06 | Spec + Sprint Plan 撰寫完成 | Jackson + Claude（Cowork）|
| 2026-05-08 | **Phase 0 提前啟動**：mock generator + 3 預設 JSON + 驗收 runbook 交付；待 Jackson 執行 curl + 5 渠道檢核 | Jackson + Claude（Cowork）|
