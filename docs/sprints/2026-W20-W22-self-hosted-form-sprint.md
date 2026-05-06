# 2026-W20 ~ W22 Sprint：Self-Hosted Form（自建報名表單）

| 項目 | 內容 |
|---|---|
| Sprint 名稱 | Self-Hosted Form Sprint |
| 期間 | 2026-05-16 ~ 2026-06-01（17 天）|
| 開發完成日 | 2026-05-31 |
| 上線切換日 | 2026-06-01 |
| 主要 Issue | [#9 自建報名表單取代 Tally](../issues/issue-9-self-hosted-form-spec.md) |

---

## 1. Sprint 目標

| 目標 | 通過條件 |
|---|---|
| 1. 解決 Tally 紅線根本問題 | 業務同事 6/1 起只需維護 Sheets、不再碰 Tally |
| 2. 維持 Make scenario 內部邏輯 0 改動 | Module 2-28 IML 完全保留 |
| 3. UI 對齊 Tally 視覺品質 | 桌機 + 行動裝置完整 |
| 4. T15 + T16 端對端驗收全綠 | 5 渠道 + 跨平台 + 邊界 case |
| 5. 與 5/16-5/31 業務測試期並行 | 不衝突業務團隊跑 30 筆 Tally 測試 |

---

## 2. Sprint 範圍

### 2.1 排入 Sprint 的工作

| 階段 | 工作 | 工作量 | 排程 | 主負責 |
|---|---|---|---|---|
| Phase 0 | Payload 相容性驗證 | 0.5 天 | 5/16-5/17 | Claude Code |
| Gate | Phase 0 驗收（go/no-go）| — | 5/17 | Jackson |
| Phase 1 | 表單核心邏輯 | 1 天 | 5/18-5/19 | Claude Code |
| Phase 2a | UI 對齊 Tally 桌機 | 1.5 天 | 5/20-5/22 | Claude Code |
| Phase 2b | UI 對齊 Tally 行動 | 1 天 | 5/23-5/24 | Claude Code |
| Phase 3 | Apps Script 部署 | 0.5 天 | 5/25 | Claude Code |
| Phase 4 | Make webhook 切換 | 0.5 天 | 5/26 | Claude Code |
| Phase 6 | T15 + T16 端對端驗收 | 1 天 | 5/27-5/28 | Jackson + Claude Code |
| Buffer | 修補 + 微調 | 3 天 | 5/29-5/31 | — |

### 2.2 並行進行的工作（不在本 Sprint 但同期進行）

| 工作 | 期間 | 主負責 |
|---|---|---|
| 業務團隊跑 30 筆 Tally 整合測試 | 5/16-5/31 | Jackson + 業務測試者 |
| Issue #3 alert email 收件人變更（jacksonkuo→hello@sigellabs.com）| 整合測試後 | Claude Code |

### 2.3 排除的工作（v5.2 之後）

| # | 標題 | 排除原因 |
|---|---|---|
| Cloudflare Turnstile（防垃圾報名）| 6/1 上線後若有真實 DDoS 才評估 |
| 表單 A/B 測試框架 | 過度工程 |
| Sheets 結構變動自動修復 | 由業務手冊紅線教育覆蓋 |

---

## 3. 時間表

| 日期 | 週 | 工作 | 完成 |
|---|---|---|---|
| 2026-05-15（五）| W19 | Sprint Winter Camp Prep 結束、retrospective | ⬜ |
| 2026-05-16（六）| W20 | Sprint kickoff；Phase 0 Payload 驗證 AM | ⬜ |
| 2026-05-17（日）| W20 | Phase 0 完成、go/no-go 決策 | ⬜ |
| 2026-05-18（一）| W20 | Phase 1 表單核心邏輯（form.js submit + validation） | ⬜ |
| 2026-05-19（二）| W20 | Phase 1 完成 | ⬜ |
| 2026-05-20（三）| W20 | Phase 2a UI 桌機 Day 1（layout、字型、color）| ⬜ |
| 2026-05-21（四）| W20 | Phase 2a UI 桌機 Day 2（互動、動畫）| ⬜ |
| 2026-05-22（五）| W20 | Phase 2a UI 桌機 Day 3（含 Jackson 第一次 review）| ⬜ |
| 2026-05-23（六）| W21 | Phase 2b UI 行動裝置 Day 1 | ⬜ |
| 2026-05-24（日）| W21 | Phase 2b UI 行動裝置 Day 2（真機測試）| ⬜ |
| 2026-05-25（一）| W21 | Phase 3 Apps Script 部署 + Sheets 串接 | ⬜ |
| 2026-05-26（二）| W21 | Phase 4 Make webhook 切換（含 staging 切換驗證）| ⬜ |
| 2026-05-27（三）| W21 | Phase 6 T15 5 渠道驗收 | ⬜ |
| 2026-05-28（四）| W21 | Phase 6 T16 跨平台 + 邊界 case 驗收 | ⬜ |
| 2026-05-29（五）| W21 | Buffer Day 1：修補 T15/T16 發現的 issue | ⬜ |
| 2026-05-30（六）| W22 | Buffer Day 2：UI 微調 + 文件整理 | ⬜ |
| 2026-05-31（日）| W22 | Sprint 收尾、retrospective | ⬜ |
| 2026-06-01（一）| W22 | **自建表單上線** + Tally 表單加搬遷說明 | ⬜ |

---

## 4. 與 5/16-5/31 業務測試期並行排程

| 5/16-5/31 雙線並行 | 業務團隊（線 A）| Claude Code（線 B）|
|---|---|---|
| 主要工作 | 跑 30 筆 Tally 整合測試（依 [test plan](2026-W18-W20-integration-test-plan.md)）| 開發自建表單 Phase 0-6 |
| 衝突點 | 不衝突（業務跑 production Tally / Make；Claude Code 用 staging）| — |
| 同步機制 | 每 3 天 Cowork 1 次同步進度 | — |
| 風險 | 線 A 發現 Make 既有 bug → 可能影響線 B Phase 0 mock 設計 | 線 B 5/26 切 webhook 前需確保線 A 完成 |

---

## 5. 驗收條件

| # | 項目 | 通過 |
|---|---|---|
| 1 | Phase 0 Payload 相容性驗證通過 | ⬜ |
| 2 | docs/forms/ 三檔（index.html、style.css、form.js）開發完成 | ⬜ |
| 3 | docs/apps-script/sheets-public-read.gs 撰寫完成 | ⬜ |
| 4 | Apps Script 部署為 Web App、URL 取得 | ⬜ |
| 5 | UI 對齊 Tally 視覺品質（桌機 + 行動裝置）| ⬜ |
| 6 | T15 5 渠道驗收全綠（單/雙/三營隊 + 早鳥/正常切換）| ⬜ |
| 7 | T16 跨平台驗收全綠（Chrome/Safari/Android/iOS）| ⬜ |
| 8 | T16 邊界 case 全測（同學名、特殊字元、慢速網路、Apps Script 延遲）| ⬜ |
| 9 | GitHub Pages 部署 forms/ 路徑可訪問 | ⬜ |
| 10 | Tally 表單加搬遷說明 + 雙 webhook 觀察期就緒 | ⬜ |
| 11 | Memory + sprint plan + retrospective 更新 | ⬜ |

---

## 6. 風險登記

| # | 風險 | 機率 | 影響 | 緩解 |
|---|---|---|---|---|
| 1 | Phase 0 Payload 不相容 | 🟡 中 | 🔴 高 | 5/17 go/no-go gate；失敗則考慮 Google Forms |
| 2 | Apps Script 部署 Google OAuth 警告 | 🟡 中 | 🟢 低 | Jackson 一次同意「未驗證 app 仍要前往」即可 |
| 3 | UI 對齊 Tally 工作量超估 | 🟡 中 | 🟡 中 | Buffer 3 天可吸收 |
| 4 | 行動裝置真機測試發現問題 | 🟡 中 | 🟡 中 | Phase 2b 預留 1 天、Buffer 可加碼 |
| 5 | 線 A 業務測試發現 Make bug | 🟢 低 | 🟡 中 | 線 B mock 設計需考慮，發現時開新 issue |
| 6 | GitHub Pages 部署延遲 | 🟢 低 | 🟢 低 | 已啟用、平均 1-3 分鐘 |
| 7 | 自建表單 vs Tally UX 落差過大 | 🟡 中 | 🟡 中 | 6/1 上線後密集監控、回饋累積 → 6 月底前微調 |

---

## 7. Sprint 結束後

| 階段 | 期間 | 內容 |
|---|---|---|
| 上線監控 | 6/1-6/14 | 密集觀察前 N 筆真實報名（家長回饋）|
| 美化期 | 6/15-7/31 | UI 細節調整、加 Cloudflare Turnstile 評估 |
| 冷凍期 | 8/1-11/30 | 不動任何代碼 |
| 冬令營啟用 | 12 月 | 正式對外 |
| Tally 關閉 | 2027-01 | 確認冬令營順利後關 |

---

## 8. 對應 GitHub 設定

| 項目 | 設定 |
|---|---|
| Milestone | `Self-Hosted Form Sprint`（due 2026-05-31）|
| Project Board | 既有 Sprint Board |
| Issues | #9 自建表單（單一主 issue、含 Phase 0-6 為子任務）|
| 開發分支 | `feat/self-hosted-form` |

---

## 9. 維護紀錄

| 日期 | 變更 | 變更者 |
|---|---|---|
| 2026-05-06 | 初版（基於 5/6 Cowork 4 決策）| Jackson + Claude（Cowork） |
