---
name: Issue #3 Staging T13a-d 驗收（2026-05-08）— 補 Email 渠道 + M28 alert 觸發
description: 5/7 staging smoke test S1 通過但缺漏 Email 渠道 + M28 alert 驗證；5/8 撰寫 T13a-d 完整驗收計畫；發現 staging M28 主旨/連結硬編碼 production refs（決定延後合併處理）
type: project
originSessionId: 2026-05-08-cowork-staging-t13-and-issue13-phase0
---

## 驗收範圍

| 項目 | 內容 |
|---|---|
| 對應 Issue | [#3 早鳥日期防呆強化](../issues/issue-3-implementation-spec.md)（Production 5/6 已實作）|
| 環境 | Staging scenario `4975229`（與 production v12 bit-for-bit 一致，僅 spreadsheetId 為 staging）|
| 驗收 runbook | `docs/runbooks/staging-t13-acceptance-plan-2026-05-08.md` |
| Payload 範本 | `docs/runbooks/payloads/t13{a,b,c,d}-payload.json`（4 個情境檔）|
| 預估執行時間 | 90 分鐘（含 4 個 webhook POST + 5 渠道檢核）|

## 為何補做

| 缺口 | 原因 |
|---|---|
| T13a 從未驗證 | 5/6 production Sheets 沒有未來日期測試列 → 無法跑 early_bird 路徑 |
| T13c 含於 T13d、未獨立驗 | 5/6 production T13d 同時包含 normal + malformed，但 T13c 純 malformed 邏輯未獨立確認 |
| **Email 渠道（M4 SendGrid）** | 5/7 staging smoke test 因 BundleValidationError 失敗、未驗證 |
| **M28 alert email** | 5/7 staging 從未觸發過（payload 用合法日期）|

## 4 子情境設計

| 子情境 | 觸發條件 | 預期 period | 預期 alert | 5/6 production | 5/8 staging |
|---|---|---|---|---|---|
| T13a | C 欄合法 ISO、未過期 | `early_bird` | 0 封 | ⬜ 從未測 | ⬜ 待執行 |
| T13b | C 欄合法 ISO、已過期 | `normal` | 0 封 | ✅ 13 ops | ⬜ 待執行 |
| T13c | C 欄非 ISO（`2026/12/15`）| `normal` (fail-safe) | 1 封 | 含於 T13d | ⬜ 待執行 |
| T13d | 雙營隊（FUTURE + MALFORMED）| 1 normal + 1 alert | 1 封 | ✅ 22 ops | ⬜ 待執行 |

## 5/7 smoke test 失敗修補（已寫入 T13 payload）

| Invariant | 5/7 失敗 | T13 payload 修補 |
|---|---|---|
| 頂層 `createdAt` 存在 | ❌ 漏帶 → A 欄空白 | ✅ 雙保留 |
| `fields[2]` 為 Email | ❌ 位置錯 → BundleValidationError | ✅ index 2 = INPUT_EMAIL |
| 孩子姓名 label | ❌ 用 `孩子姓名（中文）` | ✅ 用 `孩子姓名`（無括號）|
| CHECKBOXES label 含括號 + 半形空格 | （5/7 未驗）| ✅ `孩子要報名哪些營隊？ ([XXX])` |

> ⚠️ 上述 4 點與 Issue #13 Phase 0 mock invariants 重疊；同源於 Tally schema 一致性需求。

## ⚠️ Staging Blueprint 已知瑕疵（5/8 比對發現）

從 staging blueprint v1（5/6 clone production v12）發現 Module 28 內容寫死 production references：

| # | 瑕疵 | 證據 | 影響 |
|---|---|---|---|
| 1 | M28 subject 寫死 `4596472`（production scenario ID）| `[ALERT] Make scenario 4596472 — 早鳥截止日格式異常（{{5.label}}）` | staging 觸發時 alert 信件主旨會誤稱 production |
| 2 | M28 body 連結指向 production sheet | `https://docs.google.com/spreadsheets/d/1dZUNmS28HAuXLBPJchaB84xLlRAXuHeMIFxnIm__738/` | 營運者依信件連結會跑去 production sheet 而非實際 staging 異常源 |

### 處理決策（5/8 Cowork）：方案 X — 先驗收、後修補

| 方案 | 採用 | 理由 |
|---|---|---|
| **X. 延後合併處理** | ✅ | 不影響功能、不阻塞 T13 驗收；列入 v5.2 改善清單、整合測試後批次修補 |
| Y. 立即修補 | ❌ | 增加 1 次 API PATCH（風險：silent noop）+ 重 GET snapshot；與本次驗收主目標無關 |
| Z. 放棄內容驗證 | ❌ | 失去 alert 內容正確性的長期維運保障 |

### 應該回頭重新評估的訊號

| 觸發條件 | 動作 |
|---|---|
| 整合測試發現 ≥ 3 個類似 staging-only 硬編碼瑕疵 | 提前到 5/15 sprint 收尾前批次修補 |
| 業務同事意外取得 staging alert 信件存取權 | 立即修補（避免誤導訊息）|
| 6 月後新增 staging 測試項目、需多人協作 | 修補後再開放協作 |

## How to apply（Claude Code 接手指引）

### 場景 A：T13a-d 驗收已完成（Jackson 回報全綠）

| 步驟 | 動作 |
|---|---|
| 1 | 讀本 memory + `docs/runbooks/staging-t13-acceptance-plan-2026-05-08.md` §6 驗收 checklist |
| 2 | 撰寫驗收報告 `docs/runbooks/staging-t13-acceptance-report-2026-05-08.md` |
| 3 | 開 GitHub Issue：「Staging M28 alert 主旨/連結硬編碼 production refs」、標 `bug` + `staging-only`、列入 v5.2 |
| 4 | 更新 `project_winter_camp_sprint.md` 標 T13a-d ✅ |

### 場景 B：T13a-d 驗收部分失敗

| 步驟 | 動作 |
|---|---|
| 1 | 對照 runbook §7 風險表找出失敗類型 |
| 2 | 若是 payload 結構問題（5/7 BundleValidationError 重演）→ 對照 8 個 invariants 修 payload |
| 3 | 若是 Sheets 測試列偏移 → 確認 staging 活動設定表 3 列就緒 |
| 4 | 若是 staging 隔離失敗（production 有新資料）→ **立即停用 staging scenario**、排查 spreadsheetId |

## 與其他工作的關係

| 工作 | 衝突？ | 原因 |
|---|---|---|
| Issue #13 Phase 0（5/8 同日提前啟動）| ❌ 不衝突 | T13 測 Issue #3 fail-safe；Phase 0 測 payload schema；皆 staging |
| 5/12-5/14 整合測試 | ❌ 不衝突 | 但 T13 應在整合測試前完成、作為 Issue #3 完整驗收 |
| Sprint W18-W20 收尾（5/15）| ✅ 須完成 | T13 是 sprint 驗收條件 #4 的 staging 補強 |

## 交付物清單（Cowork 5/8 已完成）

| 檔案 | 用途 |
|---|---|
| `docs/runbooks/staging-t13-acceptance-plan-2026-05-08.md` | T13 完整驗收計畫主文件 |
| `docs/runbooks/payloads/t13a-payload.json` | T13a 早鳥期內、單營隊 |
| `docs/runbooks/payloads/t13b-payload.json` | T13b 早鳥已過、單營隊 |
| `docs/runbooks/payloads/t13c-payload.json` | T13c 非 ISO、單營隊 |
| `docs/runbooks/payloads/t13d-payload.json` | T13d 雙營隊混合 |

## 維護紀錄

| 日期 | 變更 | 變更者 |
|---|---|---|
| 2026-05-08 | 初版（接續 5/7 smoke test、補 T13a-d + Email + Alert 三項缺漏）| Jackson + Claude（Cowork）|
