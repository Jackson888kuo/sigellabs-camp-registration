---
title: Issue #13 (Self-Hosted Form) Phase 0 — Payload 相容性驗證（2026-05-08）
description: 提前啟動 Issue #13 Self-Hosted Form Sprint 的 go/no-go gate；驗證自建表單 mock JSON 能否讓 Make scenario v12 完全不動就跑通 5 渠道
---

# Phase 0 — Payload 相容性驗證

| 項目 | 內容 |
|---|---|
| 對應 Issue | [#13 自建報名表單取代 Tally](../issues/issue-9-self-hosted-form-spec.md)（內部 spec 稱 Issue #9）|
| Phase | 0 — go/no-go gate（Issue #9 spec §3） |
| 執行環境 | Staging scenario `4975229`（不影響 production） |
| 執行人員 | Jackson（執行 curl + 觀察）｜Claude Cowork（已產出 mock + 文件）|
| 預估執行時間 | 30-45 分鐘（含 3 個情境的 webhook + 5 渠道檢核） |
| 撰寫日期 | 2026-05-08（提前 8 天啟動）|

---

## 0. 執行前提

### 0.1 為何提前 8 天

依原規劃，Issue #13 Sprint 5/16 才啟動；Phase 0 是 go/no-go gate（若 mock payload 無法讓 Make 跑通則整個 sprint 需 pivot）。提前完成可：

| 效益 | 說明 |
|---|---|
| 風險前置 | 萬一 mock 不相容、有 1 週時間評估 Google Forms 替代路線 |
| 不衝突當前 sprint | 用 staging、不影響 production；T13a-d 與整合測試獨立進行 |
| 資源利用 | Cowork 工作量 0.5 天、與 Jackson 自身整合測試準備可平行 |

### 0.2 已備齊的交付物（Cowork 已完成）

| 交付物 | 路徑 |
|---|---|
| Mock 生成器 Python script | `docs/forms/mocks/generate_mock_payload.py` |
| 預設 mock — 單營隊（預期 13 ops）| `docs/forms/mocks/phase0_single_camp.json` |
| 預設 mock — 雙營隊（預期 21 ops，**Phase 0 主要 gate**）| `docs/forms/mocks/phase0_dual_camp.json` |
| 預設 mock — 三營隊（預期 29 ops）| `docs/forms/mocks/phase0_triple_camp.json` |
| 本驗收記錄表 | `docs/runbooks/phase0-payload-compatibility-2026-05-08.md`（即本檔）|

---

## 1. Mock Payload 設計總覽

### 1.1 對齊 Tally schema 的 invariant 清單

依 [issue-9-self-hosted-form-spec.md §3.4](../issues/issue-9-self-hosted-form-spec.md#34-自建表單-mock-payload-必須對齊的-invariant)：

| # | Invariant | 為何重要 | 本 mock 對齊狀況 |
|---|---|---|---|
| 1 | 頂層 `createdAt` 存在 | M13 Sheets A 欄用 `1.createdAt`（5/7 smoke test 漏帶造成 A 欄空白）| ✅ 頂層 + `data.createdAt` 雙保留 |
| 2 | `data.fields[]` 為陣列 | M5 Iterator `mapper.array = {{1.data.fields}}` | ✅ |
| 3 | `fields[2]` 為 Email | M4 SendGrid `send_to.email = {{1.data.fields[2].value}}` 用 positional access | ✅ index 2 = INPUT_EMAIL |
| 4 | label 字串完全一致 | M9/M13 用 label-based `get(map(...; "label"; "Email"); 1)` 找欄位 | ✅ `家長姓名` / `Email` / `電話` / `孩子姓名`（無括號後綴）|
| 5 | CHECKBOXES label 含括號 + 空格 | M8/M11/M13/M27 用 `replace(replace(5.label; "孩子要報名哪些營隊？ ("; ""); ")"; "")` | ✅ `孩子要報名哪些營隊？ ([XXX])`（`？` 後半形空格）|
| 6 | CHECKBOXES `value` 勾選時為 truthy | M5→8 edge filter `if(5.value; "yes"; "no")` 真值判斷 | ✅ `"true"` 字串（truthy）|
| 7 | 多營隊 = 多個 CHECKBOXES fields | M5 Iterator 每勾 1 營隊跑 1 次 | ✅ N 個營隊 → N 個 CHECKBOXES |
| 8 | `eventType: "FORM_RESPONSE"` | 與 Tally 一致（Make 是否依此尚未確認、保險起見保留）| ✅ |

### 1.2 Mock 結構與 Tally / 5/7 smoke test payload 比對

| 面向 | 真實 Tally webhook | 5/7 staging smoke test payload | **本 Phase 0 mock** |
|---|---|---|---|
| 頂層 `createdAt` | ✅ | ❌（漏帶）| ✅ |
| `data.fields[]` schema | ✅ | ⚠️ 簡化版（label 不一致）| ✅ 對齊 |
| `fields[2].value` 為 Email | ✅ | ❌（位置錯）| ✅ |
| 家長姓名 label | `家長姓名` | `家長姓名` | `家長姓名` |
| 孩子姓名 label | `孩子姓名` | ❌ `孩子姓名（中文）` | `孩子姓名` |
| CHECKBOXES label | `孩子要報名哪些營隊？ (XXX)` | （5/7 simplified、未驗）| 完全對齊 |
| M4 SendGrid 預期結果 | ✅ 寄達 | ❌ BundleValidationError | **Phase 0 預期 ✅ 寄達** |

---

## 2. 執行步驟

### 2.1 前置：取得 staging webhook URL

從本機 git-ignored 檔案讀取（不在 GitHub repo）：

```bash
grep "Webhook URL" "/Users/jacksonkuo/Documents/Claude/Projects/太陽實驗室團報流程改進/github-repo/docs/runbooks/staging-credentials.md"
# 預期輸出：| Staging Webhook URL | https://hook.us2.make.com/<TOKEN> |
```

> 預期值：`https://hook.us2.make.com/ez2f65ux82gc71wkrlbgaalaxp4u6xmu`

### 2.2 確認 staging 環境就緒

| # | 檢核項 | 通過條件 |
|---|---|---|
| 2.2.1 | staging scenario `4975229` 啟用 | Make Editor 右下角綠燈 |
| 2.2.2 | 6 connection 全綠勾 | M2/M8/M11/M12/M13/M28（HubSpot + Sheets + SendGrid）|
| 2.2.3 | staging 活動設定表第 1、2 列就緒 | `STEAM_TEST_NORMAL_FUTURE`（C 欄 `2026-12-31`）+ `STEAM_TEST_NORMAL_PAST`（C 欄 `2026-04-01`）|
| 2.2.4 | staging 追蹤表表頭 A-I 完整、J 已移除 | 開 sheet 確認 |

### 2.3 執行 3 個情境的 curl POST

> ⚠️ 每個情境執行前先點 Make Editor **Run once**，scenario 進入 waiting webhook 狀態。

#### 情境 A — 單營隊（預期 13 ops）

```bash
cd "/Users/jacksonkuo/Documents/Claude/Projects/太陽實驗室團報流程改進/github-repo"

# 取出 staging webhook URL（從 git-ignored 檔案讀，不會洩漏）
STAGING_WEBHOOK=$(grep "Staging Webhook URL" docs/runbooks/staging-credentials.md | awk -F'`' '{print $2}')

curl -X POST "$STAGING_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d @docs/forms/mocks/phase0_single_camp.json
```

#### 情境 B — 雙營隊（預期 21 ops、**Phase 0 主要 gate**）

```bash
# 先點 Make Editor Run once
curl -X POST "$STAGING_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d @docs/forms/mocks/phase0_dual_camp.json
```

#### 情境 C — 三營隊（預期 29 ops）

```bash
# 先點 Make Editor Run once
curl -X POST "$STAGING_WEBHOOK" \
  -H "Content-Type: application/json" \
  -d @docs/forms/mocks/phase0_triple_camp.json
```

### 2.4 重新生成 mock（如需自訂家長/Email/營隊）

```bash
cd docs/forms/mocks
python3 generate_mock_payload.py \
  --camps STEAM_TEST_NORMAL_FUTURE STEAM_TEST_NORMAL_PAST \
  --parent "Phase0自訂家長" \
  --email jacksonkuo@gmail.com \
  --output custom_dual.json
```

---

## 3. 5 渠道驗收檢核（依 Issue #9 spec §3.5）

每個情境送出後 10 分鐘內檢核：

### 3.1 情境 A（單營隊、`STEAM_TEST_NORMAL_FUTURE`）

| 渠道 / 模組 | 預期 | 實際 | ✅ / ❌ |
|---|---|---|---|
| ops 計數 | 13 | _____ | ⬜ |
| M1 Webhook OUTPUT | 含 `data.fields[]`（共 8 個 fields）| _____ | ⬜ |
| M5 Iterator 展開 | 1 次（僅 1 個 CHECKBOXES）| _____ | ⬜ |
| M8 filterRows | 取到 `STEAM_TEST_NORMAL_FUTURE` 那一列 | _____ | ⬜ |
| M9 period | `early_bird`（C 欄合法 ISO、未過期）| _____ | ⬜ |
| M9 period_alert | `""`（空字串）| _____ | ⬜ |
| M10 selected_price | 早鳥單價 | _____ | ⬜ |
| M11 dealname | `Phase0_1camp_家長 x STEAM_TEST_NORMAL_FUTURE` | _____ | ⬜ |
| M13 staging 追蹤表 | 新增 1 行、A-I 完整（A 欄非空、E 欄孩子姓名非空）| _____ | ⬜ |
| M27 payment_button_html | 含早鳥金額 + 連結 | _____ | ⬜ |
| **M4 SendGrid 確認信** | jacksonkuo@gmail.com 收到 1 封含 1 卡片 | _____ | ⬜ |
| **M28 alert** | **不應觸發**（period_alert = ""）| 0 封 | ⬜ |

### 3.2 情境 B（雙營隊、Phase 0 主要 gate）

| 渠道 / 模組 | 預期 | 實際 | ✅ / ❌ |
|---|---|---|---|
| ops 計數 | **21** | _____ | ⬜ |
| M5 Iterator 展開 | 2 次 | _____ | ⬜ |
| M8 filterRows × 2 | 分別取到 NORMAL_FUTURE 與 NORMAL_PAST | _____ | ⬜ |
| M9 period × 2 | `early_bird` + `normal` | _____ | ⬜ |
| M9 period_alert × 2 | 兩個皆 `""` | _____ | ⬜ |
| M10 selected_price × 2 | 早鳥單價 + 正常單價 | _____ | ⬜ |
| M11 HubSpot Deals | 新增 2 筆（dealname 含營隊名）| _____ | ⬜ |
| M12 Deal-Contact 關聯 | 2 筆關聯 | _____ | ⬜ |
| M13 staging 追蹤表 | 新增 2 行、皆 A-I 完整 | _____ | ⬜ |
| M27 payment_button_html × 2 | 早鳥卡片 + 正常卡片 | _____ | ⬜ |
| **M4 SendGrid 確認信** | 1 封含 **2 張**卡片（金額正確）| _____ | ⬜ |
| **M28 alert** | **不應觸發** | 0 封 | ⬜ |

### 3.3 情境 C（三營隊）

| 渠道 / 模組 | 預期 | 實際 | ✅ / ❌ |
|---|---|---|---|
| ops 計數 | 29 | _____ | ⬜ |
| M5 Iterator 展開 | 3 次 | _____ | ⬜ |
| M11 HubSpot Deals | 3 筆 | _____ | ⬜ |
| M13 staging 追蹤表 | 3 行 | _____ | ⬜ |
| M4 SendGrid 確認信 | 1 封含 3 張卡片 | _____ | ⬜ |
| M28 alert | 不觸發 | 0 封 | ⬜ |

> 💡 三營隊預設 mock 使用「STEAM_TEST_NORMAL_FUTURE × 2 + STEAM_TEST_NORMAL_PAST × 1」， M11 dealname 會出現 2 筆相同 dealname（同學名同營隊）— 此非 Phase 0 重點，僅驗 ops + iterator 展開即可。

---

## 4. Go / No-Go 判準

### 4.1 全綠 → ✅ Phase 0 通過、進入 Phase 1（form.js 核心邏輯）

| 必要條件 | 通過 |
|---|---|
| 情境 B（雙營隊）ops = 21 | ⬜ |
| 情境 B M11 建立 2 筆 Deal、dealname 乾淨 | ⬜ |
| 情境 B M13 寫入 2 行 | ⬜ |
| 情境 B M4 寄達 1 封含 2 卡片 | ⬜ |
| 情境 A 與 C 皆無異常 | ⬜ |

→ 如全部 ⬜ 變 ✅ ：Issue #13 Sprint 可如期 5/16 進入 Phase 1。

### 4.2 部分失敗 → ⚠️ 條件性通過

| 失敗類型 | 處理 |
|---|---|
| M4 BundleValidationError 重演 | 對比 5/7 smoke test、檢查 `fields[2].value` 是否為合法 email 格式 |
| M13 Sheets A 欄空白 | 檢查 mock 頂層 `createdAt` 是否成功傳到 `1.createdAt`、必要時改 mock 結構 |
| M13 Sheets E 欄空白 | 檢查 fields 中 `孩子姓名` label 是否完全一致（無括號後綴） |
| M8 filterRows 空 | 檢查 staging 活動設定表是否有對應營隊列、且 A 欄文字完全一致 |
| M5 Iterator 跑 0 次 | 檢查 CHECKBOXES label 前綴是否完全 `孩子要報名哪些營隊？ (`（`？` 後有半形空格） |

→ 修補 mock 後重跑、若 1 週內可解決 → 進 Phase 1；超過 1 週 → 觸發 §4.3。

### 4.3 完全失敗 → ❌ Phase 0 not pass

| 觸發條件 | 替代路線 |
|---|---|
| 連續 3 次嘗試後 5 渠道仍未全綠 | 評估 **Google Forms** 替代路線（時程仍可在 6/1 上線前完成） |
| 真實 Tally payload schema 與本 mock 差距大、且差距難以模擬 | 從 Make 真實 production execution 抓 1 筆完整 payload 重做 mock |
| Make 內部行為依賴 hidden field（如 metadata、formId 必須對齊真實 Tally formId） | 評估保留 Tally + 加層中間轉換服務（Cloudflare Worker） |

---

## 5. 執行記錄（請於執行後填寫）

| 項目 | 值 |
|---|---|
| 執行日期 | _____ |
| 執行者 | _____ |
| 情境 A 執行 ID | _____（從 Make Editor execution detail URL 取得）|
| 情境 B 執行 ID | _____ |
| 情境 C 執行 ID | _____ |
| 整體 Go / No-Go 結論 | ⬜ 通過 / ⬜ 條件通過 / ⬜ 不通過 |
| 後續動作 | _____ |

### 5.1 異常清單（若有）

| # | 情境 | 模組 | 異常描述 | 處置 |
|---|---|---|---|---|
| 1 | _____ | _____ | _____ | _____ |

---

## 6. 風險登記

| 風險 | 機率 | 影響 | 緩解 |
|---|---|---|---|
| Mock CHECKBOXES `value` 真值判斷失敗 | 🟢 低 | 🔴 高 | 已使用 `"true"` 字串、與 5/6 production T13d 同模式 |
| 真實 Tally payload 含 hidden metadata 本 mock 未模擬 | 🟡 中 | 🟡 中 | 若失敗、§4.2 第 5 行：從真實 execution 抓完整 payload 重做 |
| Sheets staging 測試列被改動 | 🟡 中 | 🔴 高 | §2.2.3 執行前確認 |
| HubSpot staging contact 累積污染 | 🟡 中 | 🟢 低 | 驗收後手動刪除 ≤ 6 筆 Deal、清空 contact 標籤 |
| Production 隔離失敗 | 🟢 低 | 🔴 高 | 全程使用 staging webhook、執行後檢查 production 追蹤表無新增 |
| SendGrid 短時間多封觸發速率限制 | 🟢 低 | 🟡 中 | 3 個情境間隔 ≥ 5 分鐘 |

---

## 7. 後續對接

| 階段 | 動作 |
|---|---|
| Phase 0 通過（同日）| 更新 sprint plan 標 Phase 0 ✅；Phase 1 可提前到 5/16 之前啟動 |
| Phase 0 條件通過 | 修補 mock generator + 補測 1 輪 |
| Phase 0 不通過 | 評估 Google Forms 替代路線（5/12-5/15 期間決策）|
| 5/16 Sprint kickoff | Phase 1 form.js 核心邏輯（無 UI、僅 submit 邏輯）|

---

## 8. 維護紀錄

| 日期 | 變更 | 變更者 |
|---|---|---|
| 2026-05-08 | 初版（提前 8 天啟動 Phase 0；產出 mock generator + 3 個預設情境檔）| Jackson + Claude（Cowork）|
