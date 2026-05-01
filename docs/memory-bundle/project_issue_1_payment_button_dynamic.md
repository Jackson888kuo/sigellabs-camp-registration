---
name: Issue #1 - Module 10 payment_button_html 動態化（✅ 5/1 完成）
description: 已於 2026-05-01 凌晨完成（commit 65aa256）；採方案 A（API PATCH 新增 Module 27）非原預定方案 D（UI 拖拉）；Module 27 新增 + Module 14 改引用 + Module 8 mapper.filter 改 IML
type: project
originSessionId: c7030d75-b37c-40aa-bb15-e244f4a1070b
---
## 狀態：✅ 已完成（2026-05-01 01:08）

| 項目 | 內容 |
|---|---|
| Issue | https://github.com/Jackson888kuo/sigellabs-camp-registration/issues/1 |
| 完成 commit | `65aa256` |
| 完成 snapshot | `docs/snapshots/blueprint_v7_post_issue1_fix.json` |
| 完成 handoff | `docs/handoff/2026-05-01-claude-code-issue1-done.md` |
| 採用方案 | **A：API PATCH**（非原預定方案 D）— 5/1 Issue #1 + #12 共同經驗證明 API PATCH 對 iterator output / 同模組 reference 安全（詳見 `feedback_make_iml_api_risk.md`）|
| 驗證 | T10 1 營隊 13 ops、T11 雙營隊 21 ops、Jackson 手動測試 ✅ |

## 實際修補內容

### 三個獨立根因（複合型 bug）

| # | 根因 | 影響 |
|---|---|---|
| A | Module 14 仍引用已刪除的 `{{10.payment_button_html}}` | email 付款區塊空白 |
| B | Module 8 `mapper.filter[0][0].b` 為**靜態字串**而非 IML | filterRows 永遠 0 列，金額 / 連結都拿不到 |
| C | Edge filter 被 Python 腳本錯路徑誤 patch（`flow[i].filter` vs `flow[i].mapper.filter` 混淆）| 15 個 Tally fields 全進 iterator → 9 次迭代、77 ops、9 筆垃圾追蹤行（HubSpot 9 筆 T9 Deal 待 Issue #12 清理時一併清掉）|

### 修補措施

| Module | 改動 |
|---|---|
| 新增 Module 27（SetVariables）| 建立 `payment_button_html`，HTML 模板含 `replace(replace(5.label;...; ""))` + `{{10.selected_price}}` + `{{10.payment_link}}` |
| Module 14 BasicAggregator | `payment_button_html` 改引 `{{27.payment_button_html}}` |
| Module 8 edge filter | 還原為三條件 AND（含 Issue #6 final fix 的 `if(5.value; "yes"; "no")`）|
| Module 8 mapper.filter b | 從靜態字串改為 IML `replace(replace(5.label;...; ""))` |

## 連帶發現的 production bug（5/1 Cowork review）

⚠️ Module 11 dealname 從 Issue #6 (4/30) 起就缺 `""` 引數，5 處下游 ref 中只有 Module 11 沒被 Module 27 / 14 / 8 的修補一併修到。詳見 Issue #12（`[Bug][P1] Module 11 dealname replace() 缺 "" 引數`）。

## 關鍵教訓（已寫入個別 feedback memory）

- 4/28 方案 B 失敗的真正原因是「跨模組 token 拼接」，**非所有 reference 都不能 API**（詳見 `feedback_make_iml_api_risk.md` 細化版）
- edge filter 與 mapper filter 路徑完全不同（詳見 `feedback_make_blueprint_filter_paths.md`）
- HTML 字串內嵌 IML 不加 `&` 不加引號（詳見 `feedback_make_iml_html_embedding.md`）
- 驗收必須涵蓋 5 處下游渠道（詳見 `feedback_acceptance_test_downstream_refs.md`）
