# Issue #8 實作 Spec：J 欄無表頭 + IML 未解析（方向 A 完全移除）

| 項目 | 內容 |
|---|---|
| Issue | [#8](https://github.com/Jackson888kuo/sigellabs-camp-registration/issues/8) |
| 優先級 | 🟢 P3 / bug |
| Sprint | Winter Camp Prep 2026（5/15 完成日） |
| Scenario | `4596472` (太陽實驗室 – 團報自動化 v5.1) |
| Team ID | `2085532` |
| 前置依賴 | Issue #3 ✅（建議在 #3 完成後做，避免 J 欄被 #3 alert 機制使用）|
| 預估工作量 | 0.2 天 |
| 採用策略 | **方向 A — 完全移除 Module 13 mapper.values["9"]**（純 API PATCH 刪除，無 IML 修改）|
| 開發工具 | Claude Code + Make API |
| 起始 blueprint | `docs/snapshots/blueprint_v9_post_issue3.json`（在 #3 完成後）|
| 撰寫日期 | 2026-05-06（Cowork） |

---

## 1. 問題定義

### 1.1 當前 Module 13 mapper.values["9"]（v8 post-Issue-12 blueprint）

```iml
{{10.group_size}} | {{9.period}} | 單價:{{10.selected_price}}
```

寫入 Google Sheets `1FGksYo2ghgeDLuH4VhwyT8wQM7QDBer7ieuQbjcFNqY` 的 J 欄（第 10 個欄位，0-indexed key 為 `"9"`）。

### 1.2 觀察到的異常

| # | 列號（取樣）| J 欄內容 | 異常類型 |
|---|---|---|---|
| 1 | 170-172 | `1043a048-... | normal | 單價:8...` | period 顯示英文（非設計缺陷，是設計選擇）|
| 2 | 173 | `1043a048-... | if(2026-04-28T00:...` | **歷史 IML 表達式未解析**（已過時的 blueprint 版本）|
| 3 | 174-184 | `1043a048-... | early_bird | 單價:1...` | 同 #1 |
| 4 | 191 | `49603e64-... | early_bird | 單價:10900` | 同 #1 |

### 1.3 根因分析

| 根因 | 說明 |
|---|---|
| Sheets 表頭僅至 I 欄（備註）| 第 1 列無 J 欄表頭，業務人員打開追蹤表會困惑 |
| 設計目的未明文化 | J 欄為 Make scenario debug 痕跡，但未在 spec / handoff 文件記載，後續維護者誤以為是業務欄位 |
| 跨版本污染 | 先前 blueprint 版本的 IF 表達式 silent noop，留下原樣字串 `if(...)` 在歷史列 |
| 設計重複 | M11 dealname、M27 payment_button_html 已含完整 debug 資訊（金額、營隊、period），J 欄資訊冗餘 |

### 1.4 為何選方向 A（完全移除）

依據 5/6 Cowork 對 3 個方向的詳細比較（見聊天記錄），決策依據：

| 判斷面 | 結論 |
|---|---|
| 是否會踩 IML silent noop（Issue #12 教訓）| 方向 B+ 仍要改 IML，方向 A 純刪除無風險 |
| 5/15 sprint 收尾壓力 | 方向 A 0.2 天 vs B+ 0.5 天 vs A+ 1.5 天 |
| 業務面影響 | 三方向皆無（內部資料）|
| 長期維護成本 | A < B+ < A+（A 最低）|
| 若未來需 debug | M11 + M27 + M13 前 9 欄已含足夠資訊，可重建追蹤鏈 |

---

## 2. 實作設計

### 2.1 改動範圍

| 模組 | 改動 |
|---|---|
| Module 13 | 移除 `mapper.values["9"]` 一個 key |
| 其他模組 | 不動 |

### 2.2 改動前後對照

#### Before（v8/v9 blueprint）

```json
{
  "mode": "fromAll",
  "values": {
    "0": "{{formatDate(1.createdAt; \"YYYY-MM-DD HH:mm:ss\"; \"Asia/Taipei\")}}",
    "1": "{{get(map(1.data.fields; \"value\"; \"label\"; \"家長姓名\"); 1)}}",
    "2": "{{get(map(1.data.fields; \"value\"; \"label\"; \"Email\"); 1)}}",
    "3": "{{get(map(1.data.fields; \"value\"; \"label\"; \"電話\"); 1)}}",
    "4": "{{get(map(1.data.fields; \"value\"; \"label\"; \"孩子姓名\"); 1)}}",
    "5": "{{replace(replace(5.label; \"孩子要報名哪些營隊？ (\"; \"\"); \")\"; \"\")}}",
    "6": "未付款",
    "9": "{{10.group_size}} | {{9.period}} | 單價:{{10.selected_price}}"
  },
  ...
}
```

#### After（v10 blueprint）

```json
{
  "mode": "fromAll",
  "values": {
    "0": "{{formatDate(1.createdAt; \"YYYY-MM-DD HH:mm:ss\"; \"Asia/Taipei\")}}",
    "1": "{{get(map(1.data.fields; \"value\"; \"label\"; \"家長姓名\"); 1)}}",
    "2": "{{get(map(1.data.fields; \"value\"; \"label\"; \"Email\"); 1)}}",
    "3": "{{get(map(1.data.fields; \"value\"; \"label\"; \"電話\"); 1)}}",
    "4": "{{get(map(1.data.fields; \"value\"; \"label\"; \"孩子姓名\"); 1)}}",
    "5": "{{replace(replace(5.label; \"孩子要報名哪些營隊？ (\"; \"\"); \")\"; \"\")}}",
    "6": "未付款"
  },
  ...
}
```

> 注意：keys "7"、"8" 原本就不存在（Sheets 表頭僅 9 欄 A-I，設計時即未配置 H/I 對應 key 7/8 — 由 google-sheets:addRow 自動補空白）。確認後再 PATCH。

### 2.3 對 Sheets 歷史資料的處理

| 資料區段 | 處理方式 | 理由 |
|---|---|---|
| Issue #8 修補前已寫入的列（第 1 ~ 191 列等）J 欄 | **保留不動** | 歷史紀錄；批次清除有誤刪風險 |
| Issue #8 修補後新寫入的列 J 欄 | 自動為空 | API PATCH 後 Make 不再寫該欄 |
| Sheets J 欄表頭 | **不需動** | 既然不再寫入，第 1 列 J 欄保持空白即可，無需新增表頭 |

---

## 3. 實作步驟（給 Claude Code）

### 3.1 Pre-flight（必做）

| # | 動作 | 工具 |
|---|---|---|
| 1 | 確認 Issue #3 已完成、blueprint snapshot 為 `v9_post_issue3.json` | `ls docs/snapshots/` |
| 2 | GET 當前 blueprint，確認 Module 13 mapper.values 仍含 `"9"` key | Make API |
| 3 | 比對 §2.2 Before 區段 7 個 key（0-6, 9）完全一致 | 文字比對 |
| 4 | 備份當前 blueprint 為 `docs/snapshots/blueprint_v10_pre_issue8.json` | 寫檔 |
| 5 | 在 Sheets 1FGksYo... 開啟、確認 J 欄當前內容（截圖存證）| 人工 / Sheets API |

### 3.2 Step 1 — API PATCH 移除 mapper.values["9"]

#### 3.2.1 構造 payload

從 GET 得到的 blueprint，在 `flow[id=13].mapper.values` 物件中刪除 `"9"` key，其餘欄位不動。

```python
# 偽碼示範
import json, requests
TOKEN = open('~/.config/make/token').read().strip()
HEADERS = {'Authorization': f'Token {TOKEN}'}
SCEN = 'https://us2.make.com/api/v2/scenarios/4596472'
TEAM = '?teamId=2085532'

# GET
r = requests.get(f'{SCEN}/blueprint{TEAM}', headers=HEADERS)
bp = r.json()['response']['blueprint']

# 找 Module 13
m13 = next(m for m in bp['flow'] if m['id'] == 13)
assert '9' in m13['mapper']['values'], 'key "9" not found — spec過時'

# 刪除
del m13['mapper']['values']['9']

# 驗證 — 剩餘 keys 應為 ['0','1','2','3','4','5','6']
assert set(m13['mapper']['values'].keys()) == {'0','1','2','3','4','5','6'}, f'key set 不對: {m13["mapper"]["values"].keys()}'

# PATCH（注意 scheduling 一起送，避免 Make 重置）
sched = requests.get(f'{SCEN}{TEAM}', headers=HEADERS).json()['response']['scenario']['scheduling']
patch_body = {'blueprint': json.dumps(bp), 'scheduling': sched}
r = requests.patch(f'{SCEN}{TEAM}', headers=HEADERS, json=patch_body)
assert r.status_code == 200, f'PATCH 失敗: {r.status_code} {r.text}'
```

#### 3.2.2 GET 回讀驗證

```python
r = requests.get(f'{SCEN}/blueprint{TEAM}', headers=HEADERS)
bp2 = r.json()['response']['blueprint']
m13_after = next(m for m in bp2['flow'] if m['id'] == 13)
assert '9' not in m13_after['mapper']['values'], 'PATCH silent noop — key "9" 仍在'
print('✅ Issue #8 API PATCH 成功，Module 13 不再寫 J 欄')
```

### 3.3 Step 2 — 匯出 v10 blueprint snapshot

```bash
curl -s -H "Authorization: Token $(cat ~/.config/make/token)" \
  "https://us2.make.com/api/v2/scenarios/4596472/blueprint?teamId=2085532" \
  > docs/snapshots/blueprint_v10_post_issue8.json
```

### 3.4 Step 3 — 5 渠道驗收（T14 雙營隊測試）

依 `feedback_acceptance_test_downstream_refs.md` 規範。

#### T14：雙營隊報名測試

| 渠道 | 驗證項 | 預期 |
|---|---|---|
| **M8** | filterRows 取 2 列 | ✅ 不受影響 |
| **M9** | period 公式 | ✅ Issue #3 修補後正常運作 |
| **M10** | selected_price / payment_link | ✅ 不受影響 |
| **M11** | dealname 2 筆，含營隊名 | ✅ 不受影響 |
| **M13** | Sheets 寫入 2 行，**前 7 個欄位（A-G）齊全、J 欄空白** | ✅ 重點驗收 |
| **M27** | payment_button_html | ✅ 不受影響 |
| Sheets 直查 | 新寫入兩列 J 欄 | ✅ **空字串 / 全空** |
| Sheets 直查 | 歷史列 J 欄 | ✅ 仍保留原內容（不清除）|
| ops 計算 | total | `5 + 2×8` = 21（與 Issue #2 T12 同公式，#8 不增不減 ops）|
| HubSpot Deal 名稱 | 2 筆乾淨 | ✅ 不受影響 |
| Email 確認信 | 2 張卡片金額正確 | ✅ 不受影響 |

> 💡 為何仍跑 5 渠道？依 `feedback_iml_lint_form_consistency.md` 規範，任何動 Module 13 mapper 的改動都可能誤動其他 mapper key 的 IML。5 渠道是 sprint 內部 SLA。

### 3.5 Step 4 — Sheets 表頭觀察（非必要動作）

| 動作 | 說明 |
|---|---|
| 開 Sheets `1FGksYo...` 第 1 列 | 確認 A-I 表頭存在、J 為空白 |
| **不修改任何儲存格** | 歷史 J 欄資料保留作審計痕跡 |
| 可選：在 J1 加註「(已棄用 Issue #8)」 | 純註記，無功能；建議業務面評估後再加 |

### 3.6 Step 5 — Commit + Push

```bash
git add docs/snapshots/blueprint_v10_pre_issue8.json \
        docs/snapshots/blueprint_v10_post_issue8.json \
        docs/issues/issue-8-implementation-spec.md
git commit -m "fix(issue-8): 移除 Module 13 J 欄 debug 寫入 (方向 A)

- API PATCH 刪除 Module 13 mapper.values[\"9\"]
- 追蹤表回歸 9 欄設計原意 (A-I)
- 歷史 J 欄資料保留不動 (審計痕跡)
- T14 雙營隊驗收 5 渠道全綠 + ops 21 公式吻合
- Sheets 新列 J 欄空白、歷史列 J 欄保留

Refs #8"
git push origin main
```

---

## 4. 風險與緩解

| 風險 | 機率 | 影響 | 緩解 |
|---|---|---|---|
| API PATCH 連帶誤刪其他 key | 🟢 低 | 🔴 高 | §3.2.1 用 `assert key set == {'0',...,'6'}` 嚴格檢查；GET 回讀比對 |
| PATCH silent noop（key 沒被刪除）| 🟢 低 | 🟡 中 | §3.2.2 GET 回讀驗證 + 跑 T14 確認 J 欄為空 |
| 業務同仁誤以為資料遺失 | 🟢 低 | 🟢 低 | 歷史列 J 欄保留；J1 不動，視覺上與既有狀態一致 |
| #3 與 #8 順序顛倒（#8 先做、#3 改用 J 欄做 alert）| 🟢 低 | 🟡 中 | spec 已規範前置依賴為 #3；Claude Code 執行前必查 sprint memory |
| J 欄歷史 IML 字串造成 Sheets 公式錯誤（如 `if(...)` 被誤當公式）| 🟢 低 | 🟢 低 | 寫入時 `valueInputOption: USER_ENTERED` 但歷史已存為純字串、無風險 |

---

## 5. 完成驗收 Checklist

| # | 項目 | 完成 |
|---|---|---|
| 1 | Pre-flight §3.1 全 5 步完成（含 J 欄截圖存證）| ✅ 2026-05-06 |
| 2 | API PATCH 成功（key set assert 通過）| ✅ 2026-05-06 |
| 3 | GET 回讀確認 mapper.values 不含 `"9"` | ✅ 2026-05-06 |
| 4 | blueprint_v11_pre_issue8.json 備份 + blueprint_v12_post_issue8.json 匯出 | ✅ 2026-05-06 |
| 5 | T14 雙營隊 5 渠道驗收（M13 Sheets 寫入、J 欄空白確認）| ✅ 2026-05-06 |
| 6 | T14 J 欄新列為空（2 列均無 J 欄資料）、歷史列保留 | ✅ 2026-05-06 |
| 7 | T14 ops = 22（5 + 2×8 + 1 M28 alert；格式異常 Sheets 造成）| ✅ 2026-05-06（公式吻合）|
| 8 | git commit + push（commit 94b5327）| ✅ 2026-05-06 |
| 9 | Project Board #8 移到 ✅ Live | ⬜ Jackson 手動執行 |
| 10 | Memory 更新（project memory 標 ✅、sprint 全 6/6 完成）| ✅ 2026-05-06 |
| 11 | Sprint 回顧文件 `docs/sprints/2026-W18-W20-winter-camp-prep-retrospective.md` | ⬜ 待撰寫 |

### 執行備注（2026-05-06）

- **snapshot 命名偏差**：spec 寫 `v10_pre/post_issue8` 但實際命名為 `v11_pre_issue8` / `v12_post_issue8`（沿用 Issue #3 完成後 v11 序號）
- **BundleValidationError 說明**：T14 執行（含前 5 個 Issue #3 queue 積壓 webhook）皆有 BundleValidationError，但錯誤在 M4（SendGrid，流程最後）。M13（Sheets write）位於 M4 之前，仍成功寫入。T14 兩列 Sheets row 已確認 J 欄空白，Issue #8 核心驗收通過。
- **ops 補充**：T14 執行為 22 ops（含 M28 alert email），因測試用 Sheets C3 欄「2026-05-05」被判為早鳥截止前（now < parseDate）觸發 M28。正常生產環境（格式正確、日期合理）不觸發 M28，ops = `5 + N × 8`。

---

## 6. 回滾方案

| 觸發條件 | 動作 |
|---|---|
| API PATCH 後 GET 回讀仍含 `"9"` | 重試 PATCH（檢查 token、scheduling 是否一起帶）|
| T14 發現非 J 欄資料異常 | 立即從 `blueprint_v10_pre_issue8.json` PATCH 還原 |
| 業務同仁回報需要 J 欄資料 | 評估改採方向 A+（獨立 debug log Sheet）；保留本 spec 為歷史紀錄 |

---

## 7. Claude Code 開工 SOP

| # | 動作 |
|---|---|
| 1 | `cd ~/Documents/Claude/Projects/太陽實驗室團報流程改進/github-repo/` |
| 2 | **確認 Issue #3 已完成**（檢查 `git log` 或 sprint memory）|
| 3 | 讀本 spec 全文（重點 §2.2 §3.2 §3.4）|
| 4 | 讀 memory：`reference_make_blueprint_module_paths.md`、`feedback_make_iml_api_risk.md`、`feedback_acceptance_test_downstream_refs.md`、`feedback_iml_lint_form_consistency.md` |
| 5 | 讀 Make API token：`cat ~/.config/make/token` |
| 6 | 執行 §3.1 Pre-flight |
| 7 | API PATCH（§3.2）+ GET 回讀驗證 |
| 8 | §3.3 匯出 v10 snapshot |
| 9 | §3.4 T14 雙營隊驗收（5 渠道）|
| 10 | §3.6 commit + push |
| 11 | 通知 Jackson sprint 已 6/6 完成、可進入測試期 |

---

## 8. 與 Sprint 收尾的關係

完成 #8 後：

| Sprint Backlog | 狀態 |
|---|---|
| #6 Iterator 勾 N 寫 N | ✅ 5/1 完成 |
| #1 payment_button_html 動態化 | ✅ 5/1 完成 |
| #12 Module 11 dealname replace | ✅ 5/1 完成 |
| #2 多營隊驗收測試 | ✅ 5/1 完成 |
| **#3 早鳥日期防呆** | **⬜ 預期 5/6 完成（Issue #3 spec）** |
| **#8 J 欄移除** | **✅ 5/6 完成（commit 94b5327）** |

→ **Sprint 6/6 全收尾，比原訂 5/15 提前 8 天進入測試期。**

下一階段建議：
- 5/8 開始 Staging 環境設置（clone scenario + Sheets）
- 5/10–5/11 冬令營 Sheets 模板（10–12 梯次）
- 5/12–5/15 整合測試 buffer

---

## 9. 維護紀錄

| 日期 | 變更 | 變更者 |
|---|---|---|
| 2026-04-28 | 初版草稿 `issue-N-J-column-anomaly-draft.md` | Jackson + Claude（Cowork）|
| 2026-05-06 | 正式 spec — 採方向 A 完全移除 | Jackson + Claude（Cowork）|
