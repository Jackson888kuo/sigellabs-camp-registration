---
name: Make scenario 4596472 模組精確 mapper 路徑（v12 post-Issue-8）
description: scenario 4596472 v12 blueprint（Issue #8 完成後）Module 5/8/9/10/11/13/14/27/28 的精確 mapper.* 路徑與當前 IML 值；Module 13 mapper.values 現為 7 個 key（已移除 J 欄 "9"）
type: reference
originSessionId: 67676285-33e0-4f19-acbf-6fe2f171f546
---
從 `docs/snapshots/blueprint_v12_post_issue8.json`（5/6 匯出）解析得到。後續若改動 IML 可參照此表確認下手點。

## 14 個 Module 完整列表（Issue #3 新增 Module 28）

| ID | type | 用途 |
|---|---|---|
| 1 | gateway:CustomWebHook | Tally webhook 觸發 |
| 2 | hubspotcrm:CreateOrUpdateContact | HubSpot 家長 contact |
| 5 | builtin:BasicFeeder | Iterator（多營隊展開）|
| 8 | google-sheets:filterRows | 活動設定表查詢（依營隊名）|
| 6 | http:ActionSendData | 不確定（位於 5 之後但需確認）|
| 9 | util:SetVariables | period 公式（早鳥/正常）|
| 10 | util:SetVariables | group_size、selected_price、payment_link 變數 |
| **27** | **util:SetVariables** | **payment_button_html（Issue #1 新增；HTML 模板含 replace + selected_price + payment_link）** |
| 11 | hubspotcrm:createDeal | 一營隊一 Deal |
| 12 | hubspotcrm:CreateAssociation | Deal ↔ Contact 關聯 |
| 13 | google-sheets:addRow | 寫入報名追蹤表 |
| **28** | **sendgrid:sendMail** | **早鳥截止日格式異常 alert email（Issue #3 新增）；位置 M13 後 M14 前；filter: `9.period_alert ≠ ""`** |
| 14 | builtin:BasicAggregator | 收尾合併（payment_button_html 引用 27.x）|
| 4 | sendgrid:sendMail | 寄繳費卡片 email |

## Module 9 IML（v11 post-Issue-3）

| 變數 | IML |
|---|---|
| `period` | `{{if(length(8.\`3\`) = 10; if(substring(8.\`3\`; 4; 1) = "-"; if(substring(8.\`3\`; 7; 1) = "-"; if(now <= parseDate(8.\`3\`; "YYYY-MM-DD"); "early_bird"; "normal"); "normal"); "normal"); "normal")}}` |
| `period_alert` | `{{if(length(8.\`3\`) = 10; if(substring(8.\`3\`; 4; 1) = "-"; if(substring(8.\`3\`; 7; 1) = "-"; ""; "MALFORMED_EARLY_BIRD_DATE"); "MALFORMED_EARLY_BIRD_DATE"); "")}}` |
| `parent_email` | `{{get(map(1.data.fields; "value"; "label"; "Email"); 1)}}` |

> ⚠️ `parseDate` 在 Make IML 對非法日期 **throw error**（非 null），故必須用 length+substring 預先驗證格式再呼叫。詳見 memory `feedback_make_iml_parsedate_throws.md`。

## 6 處 5.label / iterator-output reference 精確位置（v11 post-Issue-3）

| Module | mapper 路徑 | 當前值（v7）| 狀態 |
|---|---|---|---|
| 5 | `mapper.array` | `{{1.data.fields}}` | ✅ Issue #6 完成 |
| 5→8 edge | `flow[id=8].filter`（外層 filter，非 mapper.filter）| 三條件 AND（label contains, value notequal "empty", `if(value)` truthy）| ✅ Issue #6 final fix |
| 8 | `mapper.filter[0][0].b` | `{{replace(replace(5.label; "孩子要報名哪些營隊？ ("; ""); ")"; "")}}` | ✅ Issue #1 完成（原為靜態字串）|
| 10 | `mapper.variables[2].value`、`variables[3].value` | `selected_price`、`payment_link`（用 8.4/8.6/8.8/8.10）| ✅ |
| **27** | `mapper.variables[0].value` | HTML 內含 `🏕️{{replace(replace(5.label; "孩子要報名哪些營隊？ ("; ""); ")"; "")}}` + `{{10.selected_price}}` + `{{10.payment_link}}` | ✅ Issue #1 新增 |
| 11 | `mapper.properties[0].value` (dealname) | `{{get(...孩子姓名...); 1)}} x {{replace(replace(5.label; "孩子要報名哪些營隊？ ("; ""); ")"; "")}}` | ✅ Issue #12 已修補（5/1）|
| 13 | `mapper.values["5"]` | `{{replace(replace(5.label; "孩子要報名哪些營隊？ ("; ""); ")"; "")}}` | ✅ Issue #6 完成 |
| 14 | `mapper.payment_button_html` | `{{27.payment_button_html}}` | ✅ Issue #1 完成（原引用已刪除的 10.payment_button_html）|

## 重要警示

✅ **Module 11 dealname Issue #12 已於 5/1 修補完成**（API PATCH 補上兩處 `""`、T12 驗證 production dealname 乾淨）。歷史教訓：4/30 PATCH 時 Module 11 與 M13/M27 用了不同腳本字串、漏帶 `""` 兩處，造成 silent noop bug 累積 ≥15 筆錯誤 dealname；經驗已收錄至 `feedback_make_iml_replace_empty_args.md` + `feedback_iml_lint_form_consistency.md`。

⚠️ **Module 11 dealname 分隔符號是 ASCII ` x `（空格 + 0x78 + 空格），不是乘號 `× `**。Issue #6 v2 spec §3.3 / §7 / §11 寫成「× {{5.value}}」是 spec 撰寫時的錯誤。實際 blueprint hex bytes：`7d7d 2078 20`（即 `}}` + 空格 + `x` + 空格）。

⚠️ **edge filter 路徑 `flow[i].filter` 與 mapper filter 路徑 `flow[i].mapper.filter` 完全不同**，極易混淆。詳見 `feedback_make_blueprint_filter_paths.md`。

## Module 13 mapper.values（v12 post-Issue-8）

Issue #8（5/6 完成）移除了 key `"9"`，現在只剩 **7 個 key（"0"–"6"）**：

| key | Sheets 欄 | 內容 |
|---|---|---|
| "0" | A 提交時間 | `{{formatDate(1.createdAt; "YYYY-MM-DD HH:mm:ss"; "Asia/Taipei")}}` |
| "1" | B 家長姓名 | `{{get(map(...; "家長姓名"); 1)}}` |
| "2" | C Email | `{{get(map(...; "Email"); 1)}}` |
| "3" | D 電話 | `{{get(map(...; "電話"); 1)}}` |
| "4" | E 孩子姓名 | `{{get(map(...; "孩子姓名"); 1)}}` |
| "5" | F 報名營隊 | `{{replace(replace(5.label; "孩子要報名哪些營隊？ ("; ""); ")"; "")}}` |
| "6" | G 付款狀態 | `未付款` |

> keys "7"（H 付款時間）、"8"（I 備註）原本就不存在，google-sheets:addRow 自動補空白。key "9"（J debug 欄）已於 Issue #8 刪除。

## ops 公式

`5 + N × 8`（N = Tally 勾選營隊數，N ≥ 2）。Issue #6 完成時為 `5 + N × 7`，Issue #1 新增 Module 27 後 +1 ops/迭代。

Issue #3 新增 Module 28（alert email）但有 filter，正常情況不觸發：
- 正常（8.`3` 格式正確）：`5 + N × 8`（不變）
- M 個營隊格式異常：`5 + N × 8 + M`（M ≤ N）

## How to apply

- 任何要改 5.label 衍生的工作，照此表確認 `mapper.路徑` 後再下手
- Module 13 改 values 時注意 key 是字串 `"5"` 不是整數 `5`
- 改 Module 11 dealname 時保留 ` x ` 字面字串、不要誤改成 `× `；補 `""` 第三引數時其他四處（M8/M10/M13/M27）已正確、不要動
- Issue #2 多營隊驗收測試：5 處下游渠道（M8/M10/M11/M13/M27）必須各別驗證（詳見 `feedback_acceptance_test_downstream_refs.md`）
- Module 9 IML 呼叫 `parseDate` 前必須做格式預檢，不能直接用 `parseDate(8.3; ...)` 因為非法輸入會 throw error（詳見 `feedback_make_iml_parsedate_throws.md`）
- Make IML 無 `and()`/`or()`/`not()` — 多條件必須巢狀 `if()`
