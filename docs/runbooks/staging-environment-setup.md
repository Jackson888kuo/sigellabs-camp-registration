# Staging 環境建立 SOP

| 項目 | 內容 |
|---|---|
| 文件目的 | 把 production 系統 clone 為 staging 副本，所有測試與後續開發在 staging 進行，production 進入冷凍狀態 |
| 預估時程 | 1 ~ 1.5 天（5/9 ~ 5/9 PM）|
| 執行者 | Jackson（人工 UI 操作為主，因涉及 OAuth 重綁）|
| 前置條件 | Issue #3 ✅、Issue #8 ✅、sprint 6/6 全綠 |
| 撰寫日期 | 2026-05-06（Cowork） |

---

## 0. 環境清單（執行前必看）

### Production 環境（即將冷凍）

| 元件 | ID / URL | 角色 |
|---|---|---|
| Make scenario | `4596472` | 主流程（v11 post-Issue-3）|
| Make Team | `2085532` | 帳號 |
| 活動設定表 Sheets | `1dZUNmS28HAuXLBPJchaB84xLlRAXuHeMIFxnIm__738` | 13 欄營隊配置 |
| 報名追蹤表 Sheets | `1FGksYo2ghgeDLuH4VhwyT8wQM7QDBer7ieuQbjcFNqY` | Module 13 寫入目標 |
| Tally 表單 | （production webhook URL 填入 Make Module 1）| 報名問卷 |
| HubSpot Portal | （與 Make connection 綁定）| Contact + Deal |
| SendGrid Sender | `hello@sigellabs.com` | Email 寄信 |

### Staging 環境（即將建立）

| 元件 | 預期 ID / URL | 命名規則 |
|---|---|---|
| Make scenario | `4596472-staging`（顯示名）；Make 自動配新 ID | scenario name 加 `-staging` 後綴 |
| 活動設定表 Sheets | 新 ID（待生成）| Sheets 標題加 `_staging` 後綴 |
| 報名追蹤表 Sheets | 新 ID（待生成）| 同上 |
| Tally 表單 | 新 ID（待生成）| 表單標題加 `[STAGING]` 前綴 |
| HubSpot connection | 同 production（不另開 portal，加 deal 標籤區隔）| Deal 加自訂屬性 `environment=staging` |
| SendGrid connection | 同 production（沿用 hello@sigellabs.com 寄出，但收件人改 jacksonkuo@gmail.com）| 寄信主旨加 `[STAGING]` 前綴 |

---

## 1. Step 1 — Clone Make scenario（30 分鐘）

### 1.1 操作步驟

| # | 動作 | 預期結果 |
|---|---|---|
| 1.1 | Make Editor → Scenarios 列表 → 找到 `太陽實驗室 – 團報自動化 v5.1` | 顯示 scenario card |
| 1.2 | 滑鼠移到該 scenario card → 右上角 ⋯ menu → 點 **Clone** | 跳出 confirmation dialog |
| 1.3 | 確認 clone → 重新命名為 `太陽實驗室 – 團報自動化 v5.1-staging` | 新 scenario 出現於列表 |
| 1.4 | 點開 staging scenario → 觀察右下角狀態 | 應為 `OFF`（disabled）|
| 1.5 | **不要** 立即啟用 | 保持 disabled 直到所有 connection 重綁完成 |

### 1.2 預期問題

| 問題 | 處理 |
|---|---|
| Clone 後右下角顯示 connection 紅色驚嘆號 | 預期行為，下個 step 處理 |
| Clone 後 module name 仍顯示舊名（如「Module 28 - Early Bird Alert」）| 不影響功能、不需改名 |
| Clone 後 ops 用量計入新 scenario | 與 production 共用 team ops 額度 |

---

## 2. Step 2 — 重綁 6 個 connection（1 小時）

> ⚠️ **這是 staging 建立的最大風險點**。任一 connection 重綁失敗都會卡關。

### 2.1 Connection 清單

| # | Module | Connection 類型 | 重綁方式 | 預估時間 |
|---|---|---|---|---|
| 1 | Module 1 (CustomWebHook) | Webhook URL | 不需重綁、產生新 webhook URL | 5 分鐘 |
| 2 | Module 2 (HubSpot CreateOrUpdateContact) | HubSpot OAuth | 沿用既有 connection | 5 分鐘 |
| 3 | Module 8 (Google Sheets filterRows) | Google OAuth | 沿用既有 connection | 5 分鐘 |
| 4 | Module 11 (HubSpot createDeal) | HubSpot OAuth | 沿用 #2 | 0 分鐘 |
| 5 | Module 12 (HubSpot CreateAssociation) | HubSpot OAuth | 沿用 #2 | 0 分鐘 |
| 6 | Module 13 (Google Sheets addRow) | Google OAuth | 沿用 #3 | 0 分鐘 |
| 7 | Module 27 (SetVariables) | 無 connection | — | — |
| 8 | Module 28 (SendGrid sendMail) | SendGrid API | 沿用既有 connection | 5 分鐘 |
| 9 | Module 4 (SendGrid sendMail) | SendGrid API | 沿用 #8 | 0 分鐘 |
| 10 | Module 9, 10 (SetVariables) | 無 connection | — | — |
| 11 | Module 5 (Iterator) | 無 connection | — | — |
| 12 | Module 6 (HTTP) | URL 固定不需綁 | — | — |

### 2.2 重綁順序

| 順序 | Connection | 動作 |
|---|---|---|
| 1 | Module 1 webhook | 點 Module 1 → 設定面板 → Add hook → 命名 `太陽實驗室團報-staging-webhook` → **複製新 webhook URL（後續貼到 Tally）** |
| 2 | Module 2 HubSpot | 點 Module 2 → 設定面板 → Connection 下拉選既有 → 點旁邊「Verify」確認綠勾 |
| 3 | Module 8 Google Sheets | 點 Module 8 → 設定面板 → Connection 下拉選既有 → spreadsheetId 暫不改（Step 3 處理）|
| 4 | Module 28 SendGrid | 同 #2 模式 |
| 5 | 其他 module | Verify 全綠勾 |

### 2.3 檢核點

| # | 檢查項 | 通過條件 |
|---|---|---|
| 1 | Make Editor 右下角 | 全 module 圓圈無紅色 |
| 2 | 點 Run once | scenario 開始等待 webhook（Tally 還沒設定，正常）|
| 3 | 紀錄 webhook URL | 寫入 `docs/runbooks/staging-credentials.md`（不 push）|

---

## 3. Step 3 — Clone 兩個 Sheets（30 分鐘）

### 3.1 活動設定表

| # | 動作 |
|---|---|
| 3.1 | 開 https://docs.google.com/spreadsheets/d/1dZUNmS28HAuXLBPJchaB84xLlRAXuHeMIFxnIm__738 |
| 3.2 | 檔案 → 製作副本 → 命名 `活動設定表_v5_staging` |
| 3.3 | 副本權限與原件相同（共用同一 Drive 資料夾） |
| 3.4 | 紀錄新 spreadsheetId（從 URL 的 `/d/<ID>/edit` 取得）|
| 3.5 | 確認新 Sheets 第 1 列表頭與原件一致（13 欄 A-M）|

### 3.2 報名追蹤表

| # | 動作 |
|---|---|
| 3.6 | 開 https://docs.google.com/spreadsheets/d/1FGksYo2ghgeDLuH4VhwyT8wQM7QDBer7ieuQbjcFNqY |
| 3.7 | 檔案 → 製作副本 → 命名 `報名追蹤表_v5_staging` |
| 3.8 | **製作副本後手動刪除全部資料列**（保留第 1 列表頭 A-I）— Issue #8 修補後僅 9 欄、不需 J |
| 3.9 | 紀錄新 spreadsheetId |

### 3.3 寫回 Make scenario

| # | 動作 |
|---|---|
| 3.10 | Make Editor → Module 8 → spreadsheetId 改為 §3.1 紀錄的新 ID |
| 3.11 | Module 8 → sheetId 確認為 `活動設定表`（與原一致）|
| 3.12 | Module 13 → spreadsheetId 改為 §3.2 紀錄的新 ID |
| 3.13 | Module 13 → sheetId 確認為 `工作表1` |
| 3.14 | Save scenario（Cmd+S）|

### 3.4 預先填入測試列（供整合測試）

於 staging 活動設定表填入至少 **3 組測試列**：

| 測試列 | 營隊名（A 欄）| 早鳥截止日（C 欄）| 用途 |
|---|---|---|---|
| 1 | `STEAM_TEST_NORMAL_FUTURE` | `2026-12-31` | 整合測試 1 happy path（早鳥期內）|
| 2 | `STEAM_TEST_NORMAL_PAST` | `2026-04-01` | 整合測試 3 早鳥已過 |
| 3 | `STEAM_TEST_MALFORMED` | （留空 或填 `2026/12/15`）| Issue #3 fail-safe 觸發測試 |

> 詳細欄位資料填法見 `docs/sprints/2026-W18-W20-integration-test-plan.md` §3.

---

## 4. Step 4 — Clone Tally 表單（30 分鐘）

### 4.1 操作步驟

| # | 動作 |
|---|---|
| 4.1 | 開 Tally → 找到 production 表單 |
| 4.2 | 表單 ⋯ menu → Duplicate → 命名 `[STAGING] 太陽實驗室團報` |
| 4.3 | 開新副本表單 → Settings → Webhooks |
| 4.4 | 移除原 production webhook URL |
| 4.5 | 加入 §2.2 #1 紀錄的 staging webhook URL |
| 4.6 | 點 Save |

### 4.2 重要：保持 schema 一致

| 欄位 | 名稱 | 不可動 |
|---|---|---|
| 家長姓名 | 短文字 | ✅ |
| Email | 短文字 | ✅ |
| 電話 | 短文字 | ✅ |
| 孩子姓名 | 短文字 | ✅ |
| 孩子要報名哪些營隊？ | 6 CHECKBOXES | ✅ **題目文字、選項文字、CHECKBOXES 結構一字不能改**（詳見業務同事使用手冊「Tally 紅線」） |
| 團報人數 | 單選 | ✅ |

### 4.3 staging 專用調整

| 動作 | 目的 |
|---|---|
| 表單標題加 `[STAGING - DO NOT FILL]` | 防止真實家長誤入 staging 表單 |
| 表單描述加紅字「測試用，請勿填寫」 | 同上 |
| Tally 隱私設定改為「需要密碼才能訪問」 | 雙重保險 |

---

## 5. Step 5 — 整體連通驗證（30 分鐘）

### 5.1 端對端冒煙測試（Smoke Test）

| # | 動作 | 預期 |
|---|---|---|
| 5.1 | Make staging scenario 啟用（Right-bottom toggle ON）| 顯示綠燈 |
| 5.2 | Make Editor 點 Run once | 進入等待 webhook 狀態 |
| 5.3 | 用 staging Tally 表單送 1 筆測試報名（任選 §3.4 測試列 1 STEAM_TEST_NORMAL_FUTURE、3 人團報）| Tally 顯示送出成功 |
| 5.4 | Make Editor 觀察 scenario 執行 | 13 ops 完整跑通 |
| 5.5 | 開 staging 報名追蹤表 | 第 2 列出現 1 筆完整資料（J 欄空）|
| 5.6 | 開 HubSpot Portal | 1 筆 Contact + 1 筆 Deal（Deal name 含 STEAM_TEST_NORMAL_FUTURE）|
| 5.7 | 開 jacksonkuo@gmail.com 信箱 | 收到 1 封確認信，內含付款卡片（早鳥金額）|
| 5.8 | 開 production 報名追蹤表 | **完全沒有新增資料** ✅（隔離成功）|

### 5.2 隔離驗證（最重要）

| # | 檢查項 | 通過條件 |
|---|---|---|
| 1 | Production scenario 未動 | Production Make Editor 顯示 enabled、無新 execution |
| 2 | Production 活動設定表未動 | Sheets 內容與 staging 副本完全分離 |
| 3 | Production 報名追蹤表未動 | 不出現 staging 測試資料 |
| 4 | Production Tally 未動 | 表單仍指向 production webhook |

> 🚨 若隔離失敗（任一 production 元件被動到）→ **立即停用 staging scenario**，回頭排查 Step 3 spreadsheetId / Step 4 webhook URL。

---

## 6. Step 6 — 文件化（15 分鐘）

### 6.1 撰寫 staging 環境配置表

於本 repo 建立 `docs/runbooks/staging-credentials.md`（**不 push 到 GitHub**）：

```markdown
# Staging 環境配置（敏感資訊、勿 push）

## Make scenario
- ID: <填入>
- URL: https://us2.make.com/2085532/scenarios/<ID>/edit
- Webhook URL: <填入>

## Sheets
- 活動設定表 staging: https://docs.google.com/spreadsheets/d/<ID>
- 報名追蹤表 staging: https://docs.google.com/spreadsheets/d/<ID>

## Tally
- 表單 ID: <填入>
- 表單 URL: <填入>

## 注意
此檔案含 webhook URL，列入 .gitignore 不上 GitHub。
```

### 6.2 加入 .gitignore

```bash
echo "docs/runbooks/staging-credentials.md" >> .gitignore
git add .gitignore
git commit -m "chore: ignore staging credentials"
git push origin main
```

### 6.3 匯出 staging blueprint snapshot

```bash
curl -s -H "Authorization: Token $(cat ~/.config/make/token)" \
  "https://us2.make.com/api/v2/scenarios/<STAGING-SCENARIO-ID>/blueprint?teamId=2085532" \
  > docs/snapshots/blueprint_staging_v1_initial.json

git add docs/snapshots/blueprint_staging_v1_initial.json
git commit -m "docs(snapshots): staging environment v1 initial snapshot"
git push origin main
```

---

## 7. 完成驗收 Checklist

| # | 項目 | 完成 |
|---|---|---|
| 1 | Staging Make scenario clone 完成 | ⬜ |
| 2 | 6 connection 全 verify 綠勾 | ⬜ |
| 3 | 兩個 staging Sheets 建立、ID 寫回 Module 8/13 | ⬜ |
| 4 | Staging 活動設定表填入 3 組測試列 | ⬜ |
| 5 | Staging Tally 表單建立、webhook URL 設定完成 | ⬜ |
| 6 | 端對端冒煙測試 5.1 全 8 步通過 | ⬜ |
| 7 | 隔離驗證 5.2 全 4 項通過（Production 完全未動）| ⬜ |
| 8 | staging-credentials.md 完成、列入 .gitignore | ⬜ |
| 9 | blueprint_staging_v1_initial.json 上 GitHub | ⬜ |

---

## 8. 風險與緩解

| 風險 | 機率 | 影響 | 緩解 |
|---|---|---|---|
| Clone scenario 後 Make ops 用量爆炸 | 🟢 低 | 🟡 中 | Staging 預設 disabled、僅 Run once 才執行 |
| connection 重綁觸發 Google / HubSpot 限額 | 🟢 低 | 🟡 中 | 沿用既有 connection、不重新 OAuth |
| Tally 表單 schema 一字之差導致 Module 8 filter 找不到列 | 🟡 中 | 🔴 高 | Step 4.2 嚴格保留 schema、整合測試 §5.1 必驗 |
| Production 與 staging Sheets ID 寫錯導致互相污染 | 🟡 中 | 🔴 高 | Step 5.2 隔離驗證必跑、發現異常立即停用 staging |
| staging-credentials.md 誤推上 GitHub | 🟡 中 | 🔴 高 | Step 6.2 必先加 .gitignore、再 git status 確認沒列入 staged |

---

## 9. 後續對接

| 階段 | 動作 |
|---|---|
| 5/10–5/11 | 階段二：冬令營 Sheets 模板（Jackson + 業務）|
| 5/12–5/14 | 階段三：整合測試 30 筆（依 `docs/sprints/2026-W18-W20-integration-test-plan.md`） |
| 5/15 | 階段四：寫業務同事使用手冊（3 份子文件）|

---

## 10. 維護紀錄

| 日期 | 變更 | 變更者 |
|---|---|---|
| 2026-05-06 | 初版 | Jackson + Claude（Cowork） |
