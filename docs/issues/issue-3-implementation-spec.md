# Issue #3 實作 Spec：早鳥日期防呆強化（雙重防呆）

| 項目 | 內容 |
|---|---|
| Issue | [#3](https://github.com/Jackson888kuo/sigellabs-camp-registration/issues/3) |
| 優先級 | 🟡 P2 / enhancement |
| Sprint | Winter Camp Prep 2026（5/15 完成日） |
| Scenario | `4596472` (太陽實驗室 – 團報自動化 v5.1) |
| Team ID | `2085532` |
| 前置依賴 | Issue #1 ✅、Issue #6 ✅、Issue #12 ✅、Issue #2 ✅ |
| 預估工作量 | 0.5 天 |
| 採用策略 | **API PATCH** Module 9 IML + **UI 拖拉** 新增 Module 28 alert email |
| 開發工具 | Claude Code + Make API + Playwright（人工 UI 拖拉新增 module） |
| 起始 blueprint | `docs/snapshots/blueprint_v8_post_issue12_fix.json` |
| 撰寫日期 | 2026-05-06（Cowork） |

---

## 1. 問題定義

### 1.1 當前 Module 9 period 公式（v8 post-Issue-12 blueprint）

```iml
{{if(now <= parseDate("2026-05-05"; "YYYY-MM-DD"); "early_bird"; "normal")}}
```

| 缺陷 | 說明 |
|---|---|
| Hardcoded 日期 | `2026-05-05` 寫死，無法支援多營隊不同早鳥截止 |
| 已過期 | 今日 2026-05-06 → 公式恆回 `"normal"`，早鳥分支實質失效 |
| 冬令營無法使用 | 12 月各營隊早鳥日不同，需逐筆查 Sheets 8.`3`（C 欄） |
| 無 fail-safe | 若未來改讀 8.`3` 但儲存格為空或格式錯（非 ISO `YYYY-MM-DD`）→ `parseDate` 回傳空，`if()` 比較異常，可能觸發 silent noop（Issue #12 教訓）|

### 1.2 業務影響

| 影響面 | 嚴重度 |
|---|---|
| v5.1 開發環境（孤立系統，未連線真實業務）| 🟢 低 |
| 冬令營啟用（2026-12）| 🔴 高 — 不修無法支援多營隊早鳥 |
| 5/15 sprint 收尾 | 🟡 中 — 為 sprint 驗收條件 #4 |

---

## 2. 雙重防呆設計

### 2.1 設計總覽

| 防線 | 機制 | 觸發條件 | 行為 |
|---|---|---|---|
| 第一道 | Module 9 IML fail-safe | 每筆 webhook 都判斷 | 8.`3` 異常時 fallback 為 `"normal"`（高金額、安全）|
| 第二道 | Module 28 SendGrid alert email | 第一道偵測到異常時 | 寄信 jacksonkuo@gmail.com 通知人工檢查 |

### 2.2 為什麼採雙重而非單一

| 單一第一道 | 風險：異常被靜默處理，營運者無感知，冬令營可能持續發生卻不知 |
| 單一第二道 | 風險：alert 寄出時報名已經以錯誤金額處理（早鳥 10900 vs 正常 11400 差 500/人） |
| **雙重** | 第一道保住金額不出錯（fail-safe 偏保守 normal）；第二道讓營運者立即知道 Sheets 設定有問題、馬上修 |

---

## 3. 第一道防呆：Module 9 IML 改寫

### 3.1 目標 IML（最終形式）

```iml
{{if(formatDate(parseDate(8.`3`; "YYYY-MM-DD"); "YYYY-MM-DD") = ""; "normal"; if(now <= parseDate(8.`3`; "YYYY-MM-DD"); "early_bird"; "normal"))}}
```

### 3.2 邏輯拆解

| 步驟 | 動作 | 結果 |
|---|---|---|
| 1 | `parseDate(8.`3`; "YYYY-MM-DD")` | 8.`3` 為合法日期 → Date object；非合法 / 空 → null |
| 2 | `formatDate(<step 1>; "YYYY-MM-DD")` | null → 空字串 `""`；Date → `"YYYY-MM-DD"` |
| 3 | 外層 `if(<step 2> = ""; "normal"; ...)` | 空字串 → 直接回 `"normal"`（**第一道防呆觸發**）|
| 4 | 否則進內層 `if(now <= parseDate(...); "early_bird"; "normal")` | 正常邏輯 |

### 3.3 同步新增 alert flag 變數

Module 9 須同時新增 `period_alert` 變數供第二道防呆使用：

```iml
{{if(formatDate(parseDate(8.`3`; "YYYY-MM-DD"); "YYYY-MM-DD") = ""; "MALFORMED_EARLY_BIRD_DATE"; "")}}
```

| 場景 | `period_alert` 值 |
|---|---|
| 8.`3` 為合法 ISO 日期 | `""`（空字串）|
| 8.`3` 為空 / 格式錯 / null | `"MALFORMED_EARLY_BIRD_DATE"` |

### 3.4 改動後 Module 9 完整 mapper

```json
{
  "scope": "roundtrip",
  "variables": [
    {
      "name": "period",
      "value": "{{if(formatDate(parseDate(8.`3`; \"YYYY-MM-DD\"); \"YYYY-MM-DD\") = \"\"; \"normal\"; if(now <= parseDate(8.`3`; \"YYYY-MM-DD\"); \"early_bird\"; \"normal\"))}}"
    },
    {
      "name": "period_alert",
      "value": "{{if(formatDate(parseDate(8.`3`; \"YYYY-MM-DD\"); \"YYYY-MM-DD\") = \"\"; \"MALFORMED_EARLY_BIRD_DATE\"; \"\")}}"
    },
    {
      "name": "parent_email",
      "value": "{{get(map(1.data.fields; \"value\"; \"label\"; \"Email\"); 1)}}"
    }
  ]
}
```

### 3.5 為何用 `formatDate(parseDate(...); ...) = ""` 偵測異常

| 候選方法 | 為何不採 |
|---|---|
| `parseDate(8.`3`; ...) = null` | Make IML `null` 比較行為不一致，曾觸發 silent noop |
| `8.`3` = ""` 純字串比較 | 無法偵測格式錯（如 `"2026/12/15"`、`"15-12-2026"`）|
| `length(8.`3`) ≠ 10` | 無法偵測 `"2026-99-99"` 這種長度對但語意錯 |
| **`formatDate(parseDate(...); ...) = ""`**（採用）| `parseDate` 失敗 → null → `formatDate(null)` 回空字串，可靠偵測所有非 ISO 格式 |

---

## 4. 第二道防呆：Module 28 SendGrid alert email

### 4.1 設計位置

| 位置選項 | 優缺 |
|---|---|
| Iterator 內（Module 9 之後、Module 10 之前）| 優：每筆異常即時通知；缺：N 個營隊都異常會寄 N 封 |
| Iterator 內 + filter `9.period_alert ≠ ""` | **採用**：filter 阻擋正常情況、ops 不增；異常時才觸發 |
| Iterator 外（Module 14 之後）| 需 Aggregator 收集，架構複雜 |

### 4.2 Module 28 規格

| 項目 | 值 |
|---|---|
| 模組類型 | `sendgrid:sendMail` |
| 位置 | Module 9 → Module 28 → Module 10（在 iterator 內 9 之後）|
| Filter（28 的入邊）| `9.period_alert ≠ ""`（label/operator: `Text operators → Not equal to`，b: 空字串）|
| To | `jacksonkuo@gmail.com` |
| From | 同 Module 4 寄信 from（沿用既有 SendGrid sender）|
| Subject | `[ALERT] Make scenario 4596472 — 早鳥截止日格式異常（{{5.label}}）` |
| Content type | `text/plain` |
| Body | 見 §4.3 |

### 4.3 Alert email body 模板

```
Make scenario 4596472 偵測到 Sheets 活動設定表早鳥截止日格式異常。

—— 異常資訊 ——
時間：{{formatDate(now; "YYYY-MM-DD HH:mm:ss"; "Asia/Taipei")}}
營隊：{{replace(replace(5.label; "孩子要報名哪些營隊？ ("; ""); ")"; "")}}
Sheets 8.`3` 原始值：「{{8.`3`}}」（應為 YYYY-MM-DD 格式）

—— Fail-safe 已自動觸發 ——
Module 9 已 fallback 為 period = "normal"
本筆報名將以正常期金額處理，避免錯誤計費。

—— 請人工檢查 ——
1. 開 Sheets：https://docs.google.com/spreadsheets/d/1dZUNmS28HAuXLBPJchaB84xLlRAXuHeMIFxnIm__738/
2. 找到該營隊那一列，確認 C 欄（早鳥截止日）為合法 YYYY-MM-DD 格式
3. 修正後請通知 Jackson 觀察後續報名是否回到 early_bird 分支
```

### 4.4 為何選 SendGrid 而非 Slack/Discord webhook

| 候選 | 為何不採 |
|---|---|
| Slack webhook | scenario 尚未連 Slack，新增授權成本 |
| Discord webhook | 同上 |
| **SendGrid（採用）** | Module 4 已用 SendGrid，授權現成；jacksonkuo@gmail.com 為主要監控信箱 |

---

## 5. 實作步驟（給 Claude Code）

### 5.1 Pre-flight（必做）

| # | 動作 | 工具 |
|---|---|---|
| 1 | 從 Make API 匯出當前 blueprint v8 確認狀態 | `GET /api/v2/scenarios/4596472/blueprint?teamId=2085532` |
| 2 | 比對 §1.1 當前 Module 9 IML 仍為 hardcoded `"2026-05-05"`（避免 spec 過時）| 文字比對 |
| 3 | 備份當前 blueprint 為 `docs/snapshots/blueprint_v9_pre_issue3.json` | 寫檔 |
| 4 | 確認 Sheets `1dZUNmS28HAuXLBPJchaB84xLlRAXuHeMIFxnIm__738` 至少 1 列 C 欄為合法 ISO 日期供 happy-path 測試 | Sheets API or 人工開 |
| 5 | 故意建一列 C 欄為空 / 格式錯（如 `"2026/12/15"`）供 fail-safe 測試 | 人工開 Sheets |

### 5.2 Step 1 — API PATCH Module 9（第一道防呆）

| # | 動作 |
|---|---|
| 1.1 | 構造 PATCH payload：替換 `flow[5].mapper.variables`（路徑為 flow array 第 6 個元素，依 §1.1 確認 module id = 9） |
| 1.2 | `PATCH https://us2.make.com/api/v2/scenarios/4596472?teamId=2085532` body 含完整 blueprint（merge 後）|
| 1.3 | GET blueprint 回讀，逐字比對 §3.4 三個變數的 IML 值 |
| 1.4 | 確認 `period_alert` 變數已新增 |

### 5.3 Step 2 — UI 拖拉新增 Module 28 SendGrid（第二道防呆）

> ⚠️ 不用 API 新增 module，避免 reference token metadata 失效（Issue #1 方案 B 教訓，詳見 `feedback_make_iml_api_risk.md`）。

| # | 動作 |
|---|---|
| 2.1 | Playwright 開 https://us2.make.com/2085532/scenarios/4596472/edit |
| 2.2 | 滑鼠移到 Module 9 與 Module 10 連線上 → + 號 |
| 2.3 | Search modules → `SendGrid` → 選 **Send an Email** |
| 2.4 | 模組設定面板 → 模組名稱改為 `28 - Early Bird Alert` |
| 2.5 | To: `jacksonkuo@gmail.com`（手鍵字面字串） |
| 2.6 | From: 從左側拖拉 Module 4 的 from 欄位 token，或手鍵 from email（沿用既有 sender）|
| 2.7 | Subject: 手鍵 `[ALERT] Make scenario 4596472 — 早鳥截止日格式異常 (`+ 拖拉 5.label token + 手鍵 `)` |
| 2.8 | Body：依 §4.3 模板，所有 token 用左側面板拖拉（5.label、8.`3`、now）|
| 2.9 | 設定 input edge filter：點 9 → 28 連線上的扳手圖示 → Add filter |
| 2.10 | Filter rule: Label 任意；Condition: `9.period_alert` `Text operators → Not equal to` 空字串（留 b 欄空白即可）|
| 2.11 | OK → Save scenario（Cmd+S）|

### 5.4 Step 3 — 驗收前匯出 blueprint snapshot

```bash
curl -s -H "Authorization: Token $MAKE_TOKEN" \
  "https://us2.make.com/api/v2/scenarios/4596472/blueprint?teamId=2085532" \
  > docs/snapshots/blueprint_v9_post_issue3.json
```

### 5.5 Step 4 — 5 渠道驗收（T13 雙營隊測試）

依 `feedback_acceptance_test_downstream_refs.md` 規範：

#### T13a：Happy path（C 欄合法日期、early_bird 期間）

| 渠道 | 驗證項 | 預期 |
|---|---|---|
| M8 | filterRows 取到的列 8.`3` | 合法 ISO 日期 |
| M9 | period | `"early_bird"`（前提：今日 ≤ 8.`3`）|
| M9 | period_alert | `""`（空）|
| M10 | selected_price | 早鳥單價（8.`4`）|
| M11 | dealname | 含營隊名 |
| M13 | row written | 9 欄資料完整（J 欄看 #8 修補狀態）|
| M27 | payment_button_html | 早鳥金額 + 早鳥連結 |
| Module 28 | **不應觸發**（filter 阻擋）| 0 alert email |

#### T13b：Fail-safe（C 欄為空）

| 渠道 | 驗證項 | 預期 |
|---|---|---|
| M9 | period | `"normal"`（fail-safe 觸發）|
| M9 | period_alert | `"MALFORMED_EARLY_BIRD_DATE"` |
| M10 | selected_price | 正常單價（8.`6`）|
| M27 | payment_button_html | 正常金額 + 正常連結 |
| Module 28 | **觸發 1 封 alert email** | jacksonkuo@gmail.com 收到 §4.3 內容 |

#### T13c：Fail-safe（C 欄為非 ISO 格式如 `"2026/12/15"`）

同 T13b，確認 parseDate 對 `/` 分隔也視為失敗。

#### T13d：雙營隊混合（1 營隊 C 欄正常、1 營隊 C 欄異常）

| 渠道 | 驗證項 | 預期 |
|---|---|---|
| ops 計算 | total | `5 + 2×8 + 1` = 22（1 個 alert email + 1 次未觸發 filter）|
| HubSpot | 2 筆 Deal 名稱乾淨 | ✅ |
| Sheets | 2 行寫入完整 | ✅ |
| Email | 2 張付款卡片金額分別正確（早鳥 + 正常）| ✅ |
| Alert email | 僅 1 封（針對異常那一營隊）| ✅ |

### 5.6 Step 5 — Commit + Push

```bash
git add docs/snapshots/blueprint_v9_post_issue3.json \
        docs/issues/issue-3-implementation-spec.md
git commit -m "fix(issue-3): 雙重防呆早鳥日期 — Module 9 fail-safe + Module 28 alert email

- Module 9 period 公式改為偵測 parseDate 失敗自動 fallback normal
- Module 9 新增 period_alert 變數標示異常類型
- 新增 Module 28 SendGrid (UI 拖拉) 在 alert flag 觸發時寄信 jacksonkuo@gmail.com
- T13 雙營隊驗收 5 渠道全通過 (a/b/c/d 4 子情境)

Refs #3"
git push origin main
```

---

## 6. 風險與緩解

| 風險 | 機率 | 影響 | 緩解 |
|---|---|---|---|
| API PATCH Module 9 IML 失敗（如 silent noop）| 🟡 中 | 🔴 高 | GET 回讀逐字比對 §3.4；遵循 `feedback_iml_lint_form_consistency.md` lint |
| UI 拖拉 Module 28 token 失效（Issue #1 教訓）| 🟡 中 | 🔴 高 | 嚴格用 UI 左側面板拖拉，不打字 reference；token 顯示彩色膠囊才算成功 |
| Module 28 SendGrid 授權連線過期 | 🟢 低 | 🟡 中 | 沿用 Module 4 的 connection；若新建需重綁 |
| Filter 條件配置錯（誤把 alert 寄到所有 happy path）| 🟡 中 | 🟡 中 | T13a 必驗 0 alert；T13b/c 各驗 1 alert |
| `formatDate(parseDate(...); ...) = ""` 偵測在某些 locale 失效 | 🟢 低 | 🟡 中 | T13c 用 `2026/12/15` 與 `15-12-2026` 兩格式測試 |
| ops 增加（每異常 +1）| 🟢 低 | 🟢 低 | 預期極少觸發、且僅異常時 +1，可接受 |
| iterator scope 內新增 module 連帶影響 5 渠道 ref | 🟡 中 | 🔴 高 | 5 渠道驗收必跑（含 M8/M10/M11/M13/M27）|

---

## 7. 完成驗收 Checklist

| # | 項目 | 完成 |
|---|---|---|
| 1 | Pre-flight §5.1 全 5 步完成（含異常測試列）| ✅ |
| 2 | Module 9 period 公式改為 fail-safe 形式（見§10 實作差異）| ✅ |
| 3 | Module 9 新增 period_alert 變數 | ✅ |
| 4 | API 新增 Module 28 SendGrid，filter `9.period_alert ≠ ""`（位置：M13 後、M14 前）| ✅ |
| 5 | blueprint_v9_pre / v9_post / v10 / v11 snapshot 已備份 | ✅ |
| 6 | T13a happy path（early_bird 期間）| ⚠️ 未測（Sheets 無未來日期；邏輯正確可 code review 確認）|
| 7 | T13b C 欄合法 ISO 日期、已過期→ period=normal, 0 alert（13-ops ✅）| ✅ |
| 8 | T13c C 欄格式錯（如 `2026/12/15`）→ MALFORMED, M28 alert（含於 T13d ✅）| ✅ |
| 9 | T13d 雙營隊混合 ops = 22（5+2×8+1）、僅 1 alert（22-ops ✅）| ✅ |
| 10 | git commit + push | ⬜ |
| 11 | Project Board #3 移到 ✅ Live | ⬜ |
| 12 | Memory 更新（project memory 標 ✅）| ⬜ |

---

## 8. 回滾方案

| 觸發條件 | 動作 |
|---|---|
| API PATCH 後 GET 回讀不一致 | 立即從 `blueprint_v9_pre_issue3.json` PATCH 還原 |
| UI 拖拉後 Run once 早鳥分支壞掉 | Make Editor → Versions → Restore 至拖拉前版本 |
| T13b/c alert 沒收到 | 檢查 Module 28 filter 與 SendGrid 授權；可暫時 disable Module 28 不影響主流程 |
| Module 28 影響 ops 過多 | 將 filter 條件加上時間限制（如 daily 上限）|

---

## 9. Claude Code 開工 SOP

| # | 動作 |
|---|---|
| 1 | `cd ~/Documents/Claude/Projects/太陽實驗室團報流程改進/github-repo/` |
| 2 | 讀本 spec 全文（重點 §3 §4 §5）|
| 3 | 讀 memory：`reference_make_blueprint_module_paths.md`、`feedback_make_iml_api_risk.md`、`feedback_iml_lint_form_consistency.md`、`feedback_acceptance_test_downstream_refs.md` |
| 4 | 讀 Make API token：`cat ~/.config/make/token` |
| 5 | 執行 §5.1 Pre-flight |
| 6 | API PATCH Module 9（§5.2）|
| 7 | 切到 Playwright + Make Editor 完成 §5.3 UI 拖拉 |
| 8 | 執行 §5.5 T13a/b/c/d 驗收 |
| 9 | §5.6 commit + push |
| 10 | 通知 Jackson（在新 Cowork 對話）開始下一個 Issue（#8）|

---

## 10. 維護紀錄

| 日期 | 變更 | 變更者 |
|---|---|---|
| 2026-05-06 | 初版 spec（雙重防呆設計）| Jackson + Claude（Cowork）|
| 2026-05-06 | 實作完成（API PATCH M9 + M28 新增）；見下方§10.1 實作差異說明 | Claude（Cowork）|

### §10.1 實作差異：Module 9 IML 與 spec §3.1 不同

spec §3.1 設計用 `formatDate(parseDate(8.3; "YYYY-MM-DD"); "YYYY-MM-DD") = ""` 偵測異常。

**實際無法使用**：Make IML 的 `parseDate` 在收到非法日期時**直接 throw error**（不回傳 null），導致整個 bundle 失敗。`formatDate(null; ...)` 的行為前提不成立。

**實際採用**：`length + substring` pattern 預先檢查格式，只有確認格式為 YYYY-MM-DD 後才呼叫 `parseDate`：

```iml
period:       {{if(length(8.`3`) = 10; if(substring(8.`3`; 4; 1) = "-"; if(substring(8.`3`; 7; 1) = "-"; if(now <= parseDate(8.`3`; "YYYY-MM-DD"); "early_bird"; "normal"); "normal"); "normal"); "normal")}}
period_alert: {{if(length(8.`3`) = 10; if(substring(8.`3`; 4; 1) = "-"; if(substring(8.`3`; 7; 1) = "-"; ""; "MALFORMED_EARLY_BIRD_DATE"); "MALFORMED_EARLY_BIRD_DATE"); "")}}
```

**行為差異表**：

| `8.3` 值 | spec §3.1 | 實際實作 |
|---|---|---|
| `2026-05-05`（ISO，已過期）| period=normal, alert="" | period=normal, alert="" ✅ 相同 |
| `2026-12-15`（ISO，未來）| period=early_bird, alert="" | period=early_bird, alert="" ✅ 相同 |
| `2026/12/15`（非 ISO 格式）| period=normal, alert=MALFORMED | period=normal, alert=MALFORMED ✅ 相同 |
| `（無早鳥）`（5 字元）| period=normal, alert=MALFORMED ← spec 原始設計 | period=normal, alert="" ← 實作行為（長度≠10，無 alert）|
| `""`（空字串）| period=normal, alert=MALFORMED | period=normal, alert="" ← 實作行為（長度≠10，無 alert）|

> **說明**：空欄位、`（無早鳥）` 等「刻意無早鳥」的情況，實作版不送 alert 而是靜默 fallback normal。這比 spec 原始設計更合理（避免每次 Sheets 沒填日期就收到 alert），但若未來需要偵測空欄位異常需調整。

### §10.2 Module 28 位置修正

初始 PATCH 時 M28 錯誤插在 M9 與 M10 之間。M28 的 filter 在 normal 情況會阻斷整個 bundle（M10-M13 不執行）。5/6 Cowork session 修正為**M13 之後、M14 之前**，測試確認正常。

**最終 flow 順序**：`[1, 2, 5, 8, 6, 9, 10, 27, 11, 12, 13, 28, 14, 4]`

### §10.3 T13 驗收紀錄（2026-05-06）

| 測試 | 執行 ID | ops | 結果 |
|---|---|---|---|
| T13b：單一營隊，合法 ISO 日期（已過期）→ normal, 0 alert | `10e328aee27a462186cfff63d014d5d9` | 13 | ✅ status:1 |
| T13d：雙營隊（1 正常 + 1 MALFORMED）→ 22 ops, 1 alert | `a3bc71f4084a4e91a186691b4a748a5b` | 22 | ✅ status:1 |
| T13a：early_bird 期間（日期未來）| N/A | — | ⚠️ Sheets 無未來日期，待冬令營設定後驗收 |

**M28 alert email**：T13d 成功觸發 1 封，`jacksonkuo@gmail.com` 應已收到（本 session 未額外確認）。
