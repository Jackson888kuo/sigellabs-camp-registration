---
name: 5/15 冬令營版開發 Sprint（W18–W20）
description: 2026-04-30 ~ 2026-05-15 Sprint，含 Issues #1, #2, #3, #6, #8 與 staging 環境設置；目標冬令營啟用
type: project
originSessionId: f72c2e4b-03ea-4d3a-a083-ec38f48399e3
---
## Sprint 範圍

| 項目 | 內容 |
|---|---|
| Sprint | Winter Camp Prep 2026 |
| 期間 | 2026-04-30 ~ 2026-05-15 |
| 開發完成日 | 2026-05-15 |
| 測試期 | 2026-05-16 ~ 2026-05-31 |
| 啟用 | 2026 冬令營（12 月） |
| 規劃文件 | `docs/sprints/2026-W18-W20-winter-camp-prep.md` |

## Sprint Backlog（6 個 Issues — 5/1 新增 #12）

| 順序 | # | 標題 | Label | 工作量 | 排程 | 狀態 |
|---|---|---|---|---|---|---|
| 1 | #6 | Iterator 勾 N 寫 N bug | bug / **P1** | 1.5 天 | 4/30 | ✅ 4/30 PM 完成（commit 3f23745、5000b63）|
| 2 | #1 | Module 10 payment_button_html 動態化 | bug / **P1** | 1 天 | 5/1 凌晨 | ✅ 5/1 01:08 完成（commit 65aa256；新增 Module 27）|
| 3 | #12 | Module 11 dealname replace() 缺 `""` 引數 | bug / P1 | 0.5 天 | 5/1 | ✅ **5/1 完成**（API PATCH 補 `""`；修補前清 9 筆 T9 垃圾 Deal；T12 production 驗證乾淨）|
| 4 | #2 | 多營隊驗收測試 | bug / P2 | 0.5 天 | 5/1 | ✅ **5/1 完成**（T12 雙營隊：21 ops、HubSpot 雙 Deal 名稱乾淨、Sheets 雙行 F 欄正確、Email 1 封 2 卡片；首次 5 渠道全覆蓋）|
| **5** | **#3** | **早鳥日期防呆** | **enhancement** | **0.5 天** | **5/2 ~** | 🔲 **下一個** |
| 6 | #8 | J 欄無表頭 + IML 未解析 | bug / P3 | 1 天 | 5/6–5/8 | 🔲 待排 |

**排除：** #7 HubSpot 儀表板（冬令營後再評估）

**5/1 收尾**：sprint 已大幅領先計畫 — 原訂 5/15 完成，實際 5/1 結束時已完成 4/6 issues（含 review 才浮現的 #12）。剩 #3 + #8，預估 1.5 天工作量，5/3 ~ 5/4 即可全 sprint 收尾、提早 11 天進入測試期。

## 關鍵決策（2026-04-29 Cowork）

1. **#6 必須在 #1 之前修**：Iterator 拿錯資料，#1 動態化在錯誤資料上沒意義
2. **#1 緊急度降為 P1**：v5.1 不影響真實業務，5/5 不再是 deadline
3. **#6 緊急度從 P2 升為 P1**：Iterator 邏輯錯為冬令營上線致命阻礙
4. **5/5 不需應急方案**：v5.1 為孤立系統（見 `project_v51_dev_isolation.md`）
5. **5/5 變成驗證機會**：觀察 Module 9 period 公式自動切換 early_bird → normal
6. **Staging 環境**：clone scenario + clone Sheets，5/9 設置完成
7. **Issue #1 驗證法**：採 Sheets 8.D 暫改法（spec §4.2），不採 IML hardcode 法

## How to apply

- 開發對話開始時，先讀 `docs/sprints/2026-W18-W20-winter-camp-prep.md` + 最新 handoff 文件（位於 `docs/handoff/YYYY-MM-DD-*.md`）
- 順序：**#6 ✅ → #1 ✅ → #12 ✅ → #2 ✅ → #3 → #8**
- 每步操作前匯出 blueprint snapshot 備份
- 5/15 後進入測試期，6/1 起冷凍直到冬令營啟用
- 任何新 issue 動 IML → 驗收必涵蓋 5 渠道（M8/M10/M11/M13/M27），詳見 `feedback_acceptance_test_downstream_refs.md`

## 2026-04-29 PM 進度紀錄（晚間 22:55）

| 項目 | 狀態 |
|---|---|
| 預檢 §4.1（blueprint snapshot 備份）| ✅ `docs/snapshots/blueprint_v6_pre_issue6.json` |
| 嘗試 Issue #6 spec v1 主操作 | ⚠️ Module 5 Array IML 已改、Filter 已加，但**整套方向錯誤** |
| Tally Run once 測試 | ✅ 跑成功，OUTPUT 結構分析完整 |
| 重大發現 | 🚨 Tally 多選實為 **6 個獨立 CHECKBOXES**，舊 spec map(...; options; ...) pattern 完全不適用 |

## 2026-04-30 AM Cowork 進度（已完成）

| 項目 | 狀態 |
|---|---|
| Make Versions UI Restore 4/28 23:19 | ✅ Module 5 Array IML 還原為 v6 production key-based 公式；Filter「勾選營隊 only」已移除 |
| Scenario Save 持久化 | ✅ Cmd+S 已 Save，當前 scenario = v6 production 乾淨狀態 |
| v2 spec 全文撰寫 | ✅ `docs/issues/issue-6-implementation-spec.md` 已重寫為 v2（376 行，含 §6 IML 公式集）|
| Git commit (bbd76cf) | ✅ Local commit 完成 |
| Git push to origin | ⬜ 待 Jackson 本機執行 `git push origin main`（sandbox 無 GitHub credentials） |

## 2026-04-30 PM Cowork 進度（00:22-01:00 夜間預檢產出）

> Jackson 因 4/29 整天耗損疲憊，於凌晨要求「找我可以做的事讓他先睡」。產出全部為「準備明早順利執行」的低風險文件 / 腳本，未動 Make scenario。

| 項目 | 狀態 | 備註 |
|---|---|---|
| Make API token 取得 | ✅ Token label `claude-cowork-issue6` 已存於本機 `~/.config/make/token` (chmod 600) | 用完務必撤銷 |
| Sandbox API 連線測試 | ❌ Sandbox proxy 擋 us2.make.com / api.github.com / sheets.googleapis.com | 改路：寫 precheck 腳本由 Jackson 本機執行 |
| 預檢一鍵腳本 | ✅ `scripts/issue-6-precheck.sh`（chmod +x）30 秒完成 §5.1 #2/#3/#4：snapshot 匯出 + Module 5 IML 比對 + 5→8 Filter 檢查 + 4 處 ref 路徑列印 | bash + python 語法已驗 |
| 4/29 本機 snapshot 結構分析 | ✅ 確認 5 處目標位置精確 mapper path | 詳見下方「精確路徑表」|
| Module 11 dealname 隱藏錯誤 | 🚨 **發現 spec 寫的 `× {{5.value}}` 實際為 ` x {{5.value}}`**（ASCII 小寫 x，非乘號）| 操作卡已更正、需回頭改 spec §3.3 §7 |
| 11 個營隊名 ASCII `)` 檢查 | ✅ 0 個營隊名含 ASCII `)`；R14/R15 的「（台北）（台中）」為全形 | §6.3 replace() 公式安全；§6.4 substring 備援不需動用 |
| 30 分鐘操作卡 | ✅ `docs/issues/issue-6-v2-morning-operation-card.md`（8 章節、20+ checkbox、含預檢/Step 1-4/T1/緊急回退）| 明早照表逐步打勾 |
| Token 拖拉故障排除卡 | ✅ `docs/issues/issue-6-v2-token-drag-troubleshooting.md`（8 章節、5 大失敗徵兆、token 顏色辨識、4/28 方案 B 教訓回顧）| 拖拉當下對照判讀 |
| Memory 更新 | ✅ 本檔更新 + 「Module 11 lowercase x」事實已記錄 | — |
| Git commit + push | ⬜ 待 commit；push 同樣需 Jackson 本機（sandbox proxy 擋 api.github.com） | — |

### 5 處精確 mapper 路徑表（4/29 snapshot 確認）

| Module | 路徑 | 當前值（v6 production）| 改動目標（§6.3 IML） |
|---|---|---|---|
| 5 | `mapper.array` | `{{map(get(map(1.data.fields; "options"; "key"; "question_bkOj1Z"); 1); ...)}}` | `{{1.data.fields}}` |
| 5→8 連線 | `flow[8].filter` | `null` | 兩個 AND rules（§6.2）|
| 8 | `mapper.filter[0][0].b` | `{{5.value}}` | `{{replace(replace(5.value.label; "孩子要報名哪些營隊？("; ""); ")"; "")}}` |
| 10 | `mapper.variables[4].value` 內 `🏕️{{5.value}}` 該段 | `🏕️{{5.value}}` | `🏕️` + §6.3 |
| 11 | `mapper.properties[0].value` 內 ` x {{5.value}}` 該段 | `... x {{5.value}}` | ` x ` + §6.3 |
| 13 | `mapper.values["5"]` | `{{5.value}}` | §6.3 |

### 5/1 早上開工 SOP（Jackson 醒來後）

1. `cd ~/Documents/Claude/Projects/太陽實驗室團報流程改進/github-repo/`
2. `bash scripts/issue-6-precheck.sh` （30 秒、零風險、自動 snapshot + 驗證）
3. 開 `docs/issues/issue-6-v2-morning-operation-card.md`，照表 Step 1-4 + T1（30+15 分鐘）
4. 拖拉時一旦察覺異常 → 對照 `docs/issues/issue-6-v2-token-drag-troubleshooting.md`
5. T1 通過 → 立即 commit + push、撤銷 Make token、通知下次 Cowork 對話

### 下次開發對話啟動

依 v2 spec §5 + 操作卡執行；操作卡是 v2 spec 的「執行版」，spec 是「設計版」，互相對照。

## 2026-05-01 完整進度紀錄

### AM/PM 早段：Cowork review + Issue #12 開立

| 項目 | 狀態 |
|---|---|
| Issue #6 4/30 PM 主操作 | ✅ commit 3f23745、5000b63；T4a/b/c 12/19/26 ops 通過；最終 fix 加第三 filter 條件 `if(5.value; "yes"; "no")` 真值判斷擋 null |
| Issue #1 5/1 凌晨完成 | ✅ commit 65aa256；新增 Module 27 SetVariables；Module 14 改引 27.payment_button_html；Module 8 mapper.filter b 改 IML；T11 雙營隊 21 ops 通過 |
| Cowork 5/1 AM review | ✅ 9 條踩雷地圖；HubSpot 抽查發現 Module 11 ≥15 筆錯誤 dealname（replace 缺 `""` silent noop、H2 確定）|
| Cowork → Claude Code 交接 | ✅ `docs/handoff/2026-05-01-cowork-to-claude-code-module11-replace-bug.md` |
| Claude Code 開立 Issue #12 | ✅ `[Bug][P1] Module 11 dealname replace() 缺 "" 引數` |
| Memory 系統 5/1 AM 更新 | ✅ 5 新增 + 4 更新 + bundle push commit `aa41799` |

### PM 晚段：Issue #12 + #2 修補與驗收

| 項目 | 狀態 |
|---|---|
| HubSpot 清 9 筆 T9 垃圾 Deal | ✅ Jackson 手動執行；T10/T11 各保留 1 筆作 before 對照（Claude Code push back 採納）|
| Issue #12 API PATCH 修補 | ✅ Module 11 dealname 兩處 `replace()` 補 `""`；GET blueprint 回讀確認；驗證 H2（純字面字串補完、API 安全） |
| Issue #2 T12 多營隊驗收 | ✅ 雙營隊（STEAM Attack + Game Designer）；首次 5 渠道全覆蓋驗收 |
| T12 結果：Make ops | ✅ 21 = `5 + 2×8` 公式吻合 |
| T12 結果：HubSpot Deal name | ✅ 2 筆，格式 `<姓名> x [類別]營隊全名`，無前綴污染 |
| T12 結果：Sheets 追蹤表 | ✅ 2 行，F 欄營隊名乾淨 |
| T12 結果：Email 確認信 | ✅ 1 封 2 張付款卡片，金額 + 連結正確 |

## ops 公式（5/1 Issue #1 後、與 T12 驗證對齊）

`5 + N × 8`，N = Tally 勾選營隊數（N ≥ 2）。Issue #6 完成時為 `5 + N × 7`，新增 Module 27 後 +1 ops/迭代。T12 N=2 → 21 ops 完全吻合。

## 5/1 額外提煉的教訓（已寫入 feedback memory）

| 教訓 | 對應 memory |
|---|---|
| `replace(s; pat; )` 缺第三引數 silent noop | `feedback_make_iml_replace_empty_args.md` |
| 驗收必涵蓋 5 渠道（T12 案例驗證）| `feedback_acceptance_test_downstream_refs.md` |
| API PATCH 安全範圍細化（純字面字串補完、iterator output / 同模組 ref OK）| `feedback_make_iml_api_risk.md` |
| 形式一致性必須由 lint 工具自動檢查 | `feedback_iml_lint_form_consistency.md` |

## 2026-04-30 開工建議流程

1. 先讀 [reference_tally_form_checkboxes_structure.md](reference_tally_form_checkboxes_structure.md) 理解真實 Tally 結構
2. 讀 [feedback_make_iml_tally_label_vs_key.md](feedback_make_iml_tally_label_vs_key.md) 知道為什麼舊 spec 不適用
3. 在 Cowork 重新設計 Issue #6 spec v2（基於 CHECKBOXES 結構）
4. v2 核心思路：
   - Module 5 Array → `{{1.data.fields}}` (iterate over all 15 fields)
   - Filter 條件兩個 AND rules：`label contains "孩子要報名哪些營隊？"` + `value not equal "empty"`
   - 下游 5 處 ref 改為 substring 解析後的營隊名（不是 5.value.text）
5. 還原步驟（如需）：從 `docs/snapshots/blueprint_v6_pre_issue6.json` PATCH API 還原 scenario 至 4/29 開工前狀態
6. 完整 v2 spec 確認後再進主操作（避免又走錯方向）

## 4/29 GitHub 已 push 的內容

- `docs/issues/issue-6-implementation-spec.md`（v1 已標示為錯誤方向，需 v2 重做）
- `docs/issues/issue-6-newebpay-link-checklist.md`（13 條藍新連結建立清單，**結構不變仍適用**）
- `docs/sprints/2026-W18-W20-winter-camp-prep.md`
- `docs/issues/issue-1-implementation-spec.md`（§4 §7 補強）
- `docs/snapshots/blueprint_v6_pre_issue6.json`（disaster recovery 用）

## 4/29 已建立的藍新測試連結（13 條）

已填入 `活動設定表_Phase5_v5` Sheet 的 I/K 欄。詳見 [reference_phase5_sheets.md](reference_phase5_sheets.md)。
- 標準 6 營隊 × 早鳥 3p + 正常 3p = 12 條
- 妖怪營 1 條（雙用 I7=K7）
- 同營隊不同梯次共用群組：G1（影像重返案發）、G2（設計旅程）、G3（運算 Game Designer）
- 測試金額：早鳥 1 元 / 正常 2 元（end-to-end 付款流驗證用）
