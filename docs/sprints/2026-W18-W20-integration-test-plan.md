# 整合測試計畫：30 筆樣本 + 6 邊界 case

| 項目 | 內容 |
|---|---|
| 文件目的 | Sprint 收尾前 5/12–5/14 整合測試的完整計畫，含三大情境分配、邊界 case、測試者分工 |
| 執行期間 | 2026-05-12（二）~ 2026-05-14（四）3 天 |
| 執行環境 | Staging（依 `docs/runbooks/staging-environment-setup.md` 已建立）|
| 通過標準 | 30 筆全 pass、5 渠道全綠、邊界 case 6 項皆有對應方案 |
| 失敗處理 | 開 GitHub Issue、6 月內補修 |
| 撰寫日期 | 2026-05-06（Cowork） |

---

## 1. 測試目標

| # | 目標 | 優先級 |
|---|---|---|
| 1 | 確認 v11 blueprint（含 Issue #3 + #8）在 staging 環境 30 筆樣本下 100% pass | 🔴 P0 |
| 2 | 確認 5 渠道（M8/M10/M11/M13/M27）資料一致性無漂移 | 🔴 P0 |
| 3 | 探索 6 項邊界 case，列出未來 v5.2 改善項 | 🟡 P1 |
| 4 | 驗證 Issue #3 fail-safe 與 Module 28 alert 機制 | 🟡 P1 |
| 5 | 驗證 staging 與 production 完全隔離（測試期間 production 無新資料）| 🔴 P0 |

---

## 2. 30 筆樣本分配

### 2.1 三大情境分配

| 情境 | 筆數 | 子情境分布 |
|---|---|---|
| **情境 1：完整單營隊流程** | 12 筆 | 早鳥期 6 筆 + 正常期 6 筆 |
| **情境 2：多營隊報名** | 12 筆 | 2 營隊 6 筆 + 3 營隊 4 筆 + 4 營隊 2 筆 |
| **情境 3：早鳥/正常切換 + fail-safe** | 6 筆 | 切換邊界 2 筆 + fail-safe 觸發 4 筆（覆蓋邊界 case 4-5）|
| 合計 | **30 筆** | — |

### 2.2 情境 1：完整單營隊流程（12 筆）

| # | 營隊（測試列）| 團報人數 | 預期 period | 預期金額 | 預期 ops | 通過條件 |
|---|---|---|---|---|---|---|
| 1-1 | STEAM_TEST_NORMAL_FUTURE | 3 人 | early_bird | 早鳥 3p 單價 | 13 | 5 渠道全綠 |
| 1-2 | STEAM_TEST_NORMAL_FUTURE | 8 人 | early_bird | 早鳥 8p 單價 | 13 | 同上 |
| 1-3 | STEAM_TEST_NORMAL_FUTURE | 3 人 | early_bird | 早鳥 3p 單價 | 13 | 同上 |
| 1-4 | STEAM_TEST_NORMAL_FUTURE | 8 人 | early_bird | 早鳥 8p 單價 | 13 | 同上 |
| 1-5 | STEAM_TEST_NORMAL_FUTURE | 3 人 | early_bird | 早鳥 3p 單價 | 13 | 同上 |
| 1-6 | STEAM_TEST_NORMAL_FUTURE | 8 人 | early_bird | 早鳥 8p 單價 | 13 | 同上 |
| 1-7 | STEAM_TEST_NORMAL_PAST | 3 人 | normal | 正常 3p 單價 | 13 | 同上 |
| 1-8 | STEAM_TEST_NORMAL_PAST | 8 人 | normal | 正常 8p 單價 | 13 | 同上 |
| 1-9 | STEAM_TEST_NORMAL_PAST | 3 人 | normal | 正常 3p 單價 | 13 | 同上 |
| 1-10 | STEAM_TEST_NORMAL_PAST | 8 人 | normal | 正常 8p 單價 | 13 | 同上 |
| 1-11 | STEAM_TEST_NORMAL_PAST | 3 人 | normal | 正常 3p 單價 | 13 | 同上 |
| 1-12 | STEAM_TEST_NORMAL_PAST | 8 人 | normal | 正常 8p 單價 | 13 | 同上 |

### 2.3 情境 2：多營隊報名（12 筆）

| # | 營隊組合 | 團報人數 | 預期 ops | 預期 HubSpot Deal | 預期 Sheets 行 | 預期 Email 卡片 |
|---|---|---|---|---|---|---|
| 2-1 | NORMAL_FUTURE + NORMAL_PAST | 3 人 | 21 | 2 筆 | 2 行 | 1 封 2 卡片 |
| 2-2 | NORMAL_FUTURE + NORMAL_PAST | 8 人 | 21 | 2 筆 | 2 行 | 1 封 2 卡片 |
| 2-3 | NORMAL_FUTURE + NORMAL_PAST | 3 人 | 21 | 2 筆 | 2 行 | 1 封 2 卡片 |
| 2-4 | NORMAL_FUTURE + NORMAL_PAST | 8 人 | 21 | 2 筆 | 2 行 | 1 封 2 卡片 |
| 2-5 | NORMAL_FUTURE + NORMAL_PAST | 3 人 | 21 | 2 筆 | 2 行 | 1 封 2 卡片 |
| 2-6 | NORMAL_FUTURE + NORMAL_PAST | 8 人 | 21 | 2 筆 | 2 行 | 1 封 2 卡片 |
| 2-7 | NORMAL_FUTURE + NORMAL_PAST + 第 3 營隊 | 3 人 | 29 | 3 筆 | 3 行 | 1 封 3 卡片 |
| 2-8 | NORMAL_FUTURE + NORMAL_PAST + 第 3 營隊 | 8 人 | 29 | 3 筆 | 3 行 | 1 封 3 卡片 |
| 2-9 | NORMAL_FUTURE + NORMAL_PAST + 第 3 營隊 | 3 人 | 29 | 3 筆 | 3 行 | 1 封 3 卡片 |
| 2-10 | NORMAL_FUTURE + NORMAL_PAST + 第 3 營隊 | 8 人 | 29 | 3 筆 | 3 行 | 1 封 3 卡片 |
| 2-11 | 4 營隊組合 | 3 人 | 37 | 4 筆 | 4 行 | 1 封 4 卡片 |
| 2-12 | 4 營隊組合 | 8 人 | 37 | 4 筆 | 4 行 | 1 封 4 卡片 |

> 💡 ops 公式：`5 + N × 8` → 1 營隊=13、2 營隊=21、3 營隊=29、4 營隊=37（驗證計數仍精準）

### 2.4 情境 3：早鳥/正常切換 + fail-safe（6 筆）

| # | 測試列設定 | 預期 period | 預期 alert | 通過條件 |
|---|---|---|---|---|
| 3-1 | C 欄 = 今日（測試日）| early_bird（邊界）| 0 | 即時切換驗證 |
| 3-2 | C 欄 = 今日 - 1 日 | normal（已過期）| 0 | 同上 |
| 3-3 | C 欄 = 空白 | normal（fail-safe）| 1 封 | 邊界 case 4 |
| 3-4 | C 欄 = `2026/12/15`（斜線格式）| normal（fail-safe）| 1 封 | 邊界 case 5 |
| 3-5 | C 欄 = `2026-13-99`（語意錯）| normal（fail-safe）| 1 封 | parseDate throw 不該炸 scenario |
| 3-6 | C 欄 = 雙營隊混合（1 正常 + 1 異常）| 1 normal、1 normal+alert | 1 封 | 5/1 T13d 驗證複現 |

---

## 3. 6 項邊界 case（每筆獨立記錄）

| # | 邊界 case | 構造方式 | 預期 | 通過條件 |
|---|---|---|---|---|
| 1 | **同學名雙報名**（兩位「王小明」報同梯次）| 兩位家長分別送 Tally，孩子姓名都填「王小明」 | HubSpot 兩 Deal 各別建立、不合併 contact | Deal 名稱 `王小明 x <營隊>`、Contact email 不同則建兩筆 |
| 2 | **特殊字元**（如「李・小明」、「Anna ♥ Lin」）| Tally 孩子姓名填特殊字元 | dealname 與 Sheets F 欄正確顯示原字元 | Sheets 顯示無亂碼、HubSpot dealname 完整 |
| 3 | **超長營隊名**（>30 字）| Sheets A 欄與 Tally 選項加超長字串 | Email 卡片排版不破版 | 開 Email、卡片仍維持 1 行 1 卡片結構 |
| 4 | **C 欄空白**（觸發 fail-safe）| Sheets C 欄留空 | period=normal、無 alert（period_alert 漏洞已知）| Email 用正常單價、無 alert email |
| 5 | **C 欄非 ISO 格式**（如 `2026/12/15`）| Sheets C 欄填斜線格式 | period=normal、Module 28 寄 alert | Email 用正常單價、jacksonkuo@gmail.com 收到 alert |
| 6 | **退費 / 重複報名**（Tally 重複送出同一報名）| 同一筆內容送 2 次 Tally | HubSpot Deal duplicate ？需確認 | 紀錄結果（是否合併、是否各建一筆）|

> 💡 邊界 case 4 的 alert 漏寄是 Issue #3 驗收時提的 polish 事項，本測試確認漏洞範圍。

---

## 4. 測試者分工（單一測試者版）

依 5/6 PM Cowork 決策，初期測試由 Jackson 一人集中執行；待業務同事使用手冊完成（5/15）後，6 月測試期再由業務團隊接手。

| 測試者 | 樣本範圍 | 預估時間 |
|---|---|---|
| Jackson | 全部 30 筆樣本 + 6 邊界 case | 2.5 ~ 3 天 |

### 4.1 為何採單一測試者（推薦）

| 維度 | 單一測試者 | 多人分工 |
|---|---|---|
| 結果一致性 | ✅ 高（同一人判斷標準）| 🟡 中（不同人對「成功」定義可能歧異）|
| 異常追溯 | ✅ 高（自己改、自己測、自己 debug）| 🟡 中（要重現別人的操作）|
| 5 渠道熟悉度 | ✅ 高（Jackson 對 5 渠道判斷已成肌肉記憶）| 🔴 低（業務同事需培訓）|
| 工作量 | 🟡 中（2.5 ~ 3 天集中工作）| 🟢 低（每人 0.5 天）|
| 業務同事學習 | 🔴 無 | ✅ 順帶熟悉系統 |

由於業務同事學習可延後到 6 月測試期（屆時手冊已完成），現階段集中由 Jackson 跑能確保資料品質。

### 4.2 推薦執行節奏

| 日期 | 時段 | 工作 | 樣本範圍 |
|---|---|---|---|
| 5/12（二）| AM | 情境 1 前半 | 1-1 ~ 1-6（早鳥期 6 筆）|
| 5/12（二）| PM | 情境 1 後半 | 1-7 ~ 1-12（正常期 6 筆）|
| 5/13（三）| AM | 情境 2 雙營隊 | 2-1 ~ 2-6 |
| 5/13（三）| PM | 情境 2 三營隊 + 四營隊 | 2-7 ~ 2-12 |
| 5/14（四）| AM | 情境 3 切換 + fail-safe | 3-1 ~ 3-6 |
| 5/14（四）| PM | 6 邊界 case + 寫測試報告 | 邊界 1-6 |

> 💡 staging Tally 表單標題已加 `[STAGING - DO NOT FILL]`，避免誤填影響 production。

---

## 5. 測試結果記錄表（每筆樣本）

每筆送出後填寫以下記錄表（建議建一份 Google Sheets）：

| 欄位 | 說明 | 範例 |
|---|---|---|
| 樣本編號 | 對應 §2 / §3 編號 | 1-1、2-7、3-3 |
| 測試者 | 誰送的 | Jackson |
| 送出時間 | 精確至分 | 2026-05-12 14:23 |
| 預期 ops | 依 §2 / §3 | 13 |
| 實際 ops | Make Editor 觀察 | 13 |
| M8 結果 | filterRows 取到的列正確？ | ✅ |
| M9 period | 預期值 | early_bird |
| M9 period（實際）| Module Output | early_bird |
| M9 period_alert | 預期值 | "" |
| M10 selected_price | 預期金額 | 10900 |
| M10（實際）| Module Output | 10900 |
| M11 dealname | HubSpot 抽查 | 王小明 x STEAM_TEST_NORMAL_FUTURE |
| M13 Sheets 行 | 開 staging 團報報名追蹤表確認 | 第 5 行、A-I 完整、J 空 |
| M27 payment_button_html | Email 抽查渲染 | 橘色卡片、金額 + 連結正確 |
| Module 28 alert | 是否觸發 + 信件抽查 | 0（happy path）/ 1（fail-safe）|
| 5 渠道綜合 | ✅ / ❌ | ✅ |
| 異常 | 描述 + 截圖（若失敗）| — |

---

## 6. 失敗處理流程

| 步驟 | 動作 |
|---|---|
| 1 | 任一筆失敗 → 立刻紀錄 §5 表格的「異常」欄 + 截圖 |
| 2 | 暫停送出後續樣本（避免重複觸發同 bug 浪費 ops）|
| 3 | 開 GitHub Issue、Label `bug` + Priority + Sprint Milestone |
| 4 | Issue 內附 §5 完整紀錄與 Make execution URL |
| 5 | 評估嚴重度：P0/P1 → sprint 內補修；P2/P3 → 6 月內補修 |
| 6 | 修補後重跑該樣本 + 同情境的另外 1 筆，確認 regression 無 |

---

## 7. 通過驗收條件

| # | 項目 | 通過條件 |
|---|---|---|
| 1 | 30 筆樣本 | 100% pass（5 渠道全綠 + ops 公式吻合）|
| 2 | 邊界 case 1-3、6 | 結果文件化（即使是「不支援」也要記錄）|
| 3 | 邊界 case 4-5 | fail-safe 確實觸發（金額正確）|
| 4 | Production 環境隔離 | 測試期間 production Sheets 無新資料、HubSpot 無新 Deal |
| 5 | 整合測試報告 | `docs/sprints/2026-W18-W20-integration-test-report.md` 完成 |
| 6 | Sprint Retrospective | 5/15 完成、含本測試發現的 v5.2 改善項清單 |

---

## 8. 風險與緩解

| 風險 | 機率 | 影響 | 緩解 |
|---|---|---|---|
| 業務測試者誤入 production Tally | 🟡 中 | 🔴 高 | staging Tally 標題加 `[STAGING]` + 描述紅字、分工時 verbal 確認 |
| Make ops 額度耗盡（30 筆 × 平均 21 ops = 630 ops）| 🟢 低 | 🟡 中 | 預留 1000 ops buffer；team 月額度需 > 2000 |
| HubSpot 測試 Deal 累積污染 staging contact | 🟡 中 | 🟢 低 | 測試完手動清除（HubSpot 批次刪除）|
| SendGrid 發信頻率觸 daily limit（30 筆 + N 個 alert）| 🟢 低 | 🟡 中 | 預估 < 50 封、SendGrid free tier 100/day 內 |
| 業務測試者未依 §5 規範記錄 → 重現困難 | 🟡 中 | 🟡 中 | 提供範例已填的記錄表給測試者參考 |
| staging 早鳥日期測試列今日設定錯誤 | 🟡 中 | 🟡 中 | 5/9 staging 建立時已預先填好 3 組測試列、5/12 重新確認 |

---

## 9. 完成 Checklist

| # | 項目 | 完成 |
|---|---|---|
| 1 | Staging 環境就緒（依 staging-environment-setup.md）| ⬜ |
| 2 | 業務測試者分工 + 收到送測說明 | ⬜ |
| 3 | 測試結果記錄表 Google Sheets 建立 | ⬜ |
| 4 | 30 筆樣本送出 + 紀錄完整 | ⬜ |
| 5 | 6 邊界 case 各自獨立紀錄 | ⬜ |
| 6 | 失敗 case 全部開 GitHub Issue | ⬜ |
| 7 | 整合測試報告撰寫 | ⬜ |
| 8 | Sprint Retrospective 完成 | ⬜ |
| 9 | Production 隔離驗證（測試期間 production 無新資料）| ⬜ |

---

## 10. 後續對接

| 階段 | 動作 |
|---|---|
| 5/15 | Sprint 收尾、寫業務同事使用手冊（3 份子文件）|
| 5/16 起 | 業務團隊 30 筆模擬報名 → 進入 2 週測試期 |
| 6/1 起 | 冷凍至 11/30 |
| 12月 | 冬令營正式啟用（切換 production webhook + Sheets）|

---

## 11. 維護紀錄

| 日期 | 變更 | 變更者 |
|---|---|---|
| 2026-05-06 | 初版（30 筆樣本、6 邊界 case、測試者分工）| Jackson + Claude（Cowork） |
