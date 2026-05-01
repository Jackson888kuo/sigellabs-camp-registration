---
name: Make scenario 4596472 模組精確 mapper 路徑（v7 post-Issue-1）
description: scenario 4596472 v7 blueprint（Issue #6 + #1 完成後）Module 5/8/10/11/13/14/27 的精確 mapper.* 路徑與當前 IML 值
type: reference
originSessionId: 67676285-33e0-4f19-acbf-6fe2f171f546
---
從 `docs/snapshots/blueprint_v7_post_issue1_fix.json`（5/1 凌晨匯出）解析得到。後續若改動 IML 可參照此表確認下手點。

## 13 個 Module 完整列表（Issue #1 新增 Module 27）

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
| 14 | builtin:BasicAggregator | 收尾合併（payment_button_html 引用 27.x）|
| 4 | sendgrid:sendMail | 寄繳費卡片 email |

## 6 處 5.label / iterator-output reference 精確位置（v7 post-Issue-1）

| Module | mapper 路徑 | 當前值（v7）| 狀態 |
|---|---|---|---|
| 5 | `mapper.array` | `{{1.data.fields}}` | ✅ Issue #6 完成 |
| 5→8 edge | `flow[id=8].filter`（外層 filter，非 mapper.filter）| 三條件 AND（label contains, value notequal "empty", `if(value)` truthy）| ✅ Issue #6 final fix |
| 8 | `mapper.filter[0][0].b` | `{{replace(replace(5.label; "孩子要報名哪些營隊？ ("; ""); ")"; "")}}` | ✅ Issue #1 完成（原為靜態字串）|
| 10 | `mapper.variables[2].value`、`variables[3].value` | `selected_price`、`payment_link`（用 8.4/8.6/8.8/8.10）| ✅ |
| **27** | `mapper.variables[0].value` | HTML 內含 `🏕️{{replace(replace(5.label; "孩子要報名哪些營隊？ ("; ""); ")"; "")}}` + `{{10.selected_price}}` + `{{10.payment_link}}` | ✅ Issue #1 新增 |
| **11** | `mapper.properties[0].value` (dealname) | `{{get(...孩子姓名...); 1)}} x {{replace(replace(5.label; "孩子要報名哪些營隊？ ("; **)**; ")"; **)**)}}` | ❌ **缺 `""`、Issue #12 修補中** |
| 13 | `mapper.values["5"]` | `{{replace(replace(5.label; "孩子要報名哪些營隊？ ("; ""); ")"; "")}}` | ✅ Issue #6 完成 |
| 14 | `mapper.payment_button_html` | `{{27.payment_button_html}}` | ✅ Issue #1 完成（原引用已刪除的 10.payment_button_html）|

## 重要警示

⚠️ **Module 11 dealname 兩處 `replace()` 缺 `""` 第三引數**（4/30 PATCH 時遺漏，5/1 review 抽查 HubSpot 才發現）。Production 已產出 ≥15 筆錯誤 dealname（含 `孩子要報名哪些營隊？ (...)` 完整前綴）。Issue #12 追蹤修補。詳見 `feedback_make_iml_replace_empty_args.md`。

⚠️ **Module 11 dealname 分隔符號是 ASCII ` x `（空格 + 0x78 + 空格），不是乘號 `× `**。Issue #6 v2 spec §3.3 / §7 / §11 寫成「× {{5.value}}」是 spec 撰寫時的錯誤。實際 blueprint hex bytes：`7d7d 2078 20`（即 `}}` + 空格 + `x` + 空格）。

⚠️ **edge filter 路徑 `flow[i].filter` 與 mapper filter 路徑 `flow[i].mapper.filter` 完全不同**，極易混淆。詳見 `feedback_make_blueprint_filter_paths.md`。

## ops 公式

`5 + N × 8`（N = Tally 勾選營隊數，N ≥ 2）。Issue #6 完成時為 `5 + N × 7`，Issue #1 新增 Module 27 後 +1 ops/迭代。

## How to apply

- 任何要改 5.label 衍生的工作，照此表確認 `mapper.路徑` 後再下手
- Module 13 改 values 時注意 key 是字串 `"5"` 不是整數 `5`
- 改 Module 11 dealname 時保留 ` x ` 字面字串、不要誤改成 `× `；補 `""` 第三引數時其他四處（M8/M10/M13/M27）已正確、不要動
- Issue #2 多營隊驗收測試：5 處下游渠道（M8/M10/M11/M13/M27）必須各別驗證（詳見 `feedback_acceptance_test_downstream_refs.md`）
