---
name: Make scenario 4596472 模組精確 mapper 路徑（v6 production）
description: scenario 4596472 v6 production blueprint 內 Module 5/8/10/11/13 的精確 mapper.* 路徑與當前 IML 值
type: reference
originSessionId: 67676285-33e0-4f19-acbf-6fe2f171f546
copiedFrom: Cowork session memory 2026-04-30
---
從 `docs/snapshots/blueprint_v6_pre_issue6.json`（4/29 12:37 UTC 匯出）解析得到。後續若改動 IML 可參照此表確認下手點。

## 12 個 Module 完整列表

| ID | type | 用途 |
|---|---|---|
| 1 | gateway:CustomWebHook | Tally webhook 觸發 |
| 2 | hubspotcrm:CreateOrUpdateContact | HubSpot 家長 contact |
| 5 | builtin:BasicFeeder | Iterator（多營隊展開）|
| 8 | google-sheets:filterRows | 活動設定表查詢（依營隊名）|
| 6 | http:ActionSendData | 不確定（位於 5 之後但需確認）|
| 9 | util:SetVariables | period 公式（早鳥/正常）|
| 10 | util:SetVariables | 包 payment_button_html 等變數 |
| 11 | hubspotcrm:createDeal | 一營隊一 Deal |
| 12 | hubspotcrm:CreateAssociation | Deal ↔ Contact 關聯 |
| 13 | google-sheets:addRow | 寫入報名追蹤表 |
| 14 | builtin:BasicAggregator | 收尾合併 |
| 4 | sendgrid:sendMail | 寄繳費卡片 email |

## 5 處 5.value reference 精確位置

| Module | mapper 路徑 | 當前值 | 備註 |
|---|---|---|---|
| 5 | `mapper.array` | `{{map(get(map(1.data.fields; "options"; "key"; "question_bkOj1Z"); 1); "text"; "id"; get(get(map(1.data.fields; "value"; "key"; "question_bkOj1Z"); 1); 1))}}` | v6 production 失效公式（key 不存在）|
| 5→8 連線 | `flow[id=8].filter` | `null` | 無 Filter |
| 8 | `mapper.filter[0][0].b` | `{{5.value}}` | A 欄 `text:contain` 比對 |
| 10 | `mapper.variables[4].value` | 含 `🏕️{{5.value}}` 一處 | variable name = `payment_button_html`，HTML 字串內 |
| 11 | `mapper.properties[0].value` | `{{get(map(1.data.fields; "value"; "label"; "孩子姓名"); 1)}} x {{5.value}}` | dealname；**注意是 ASCII 小寫 x，前後各一空格**，非乘號 |
| 13 | `mapper.values["5"]` | `{{5.value}}` | values 是 dict，key 為字串「5」（第 6 欄 zero-indexed）|

## 重要警示

⚠️ **Module 11 dealname 的分隔符號是 ASCII ` x `（空格 + 0x78 + 空格），不是乘號 `× `**。Issue #6 v2 spec §3.3 / §7 / §11 寫成「× {{5.value}}」是 spec 撰寫時的錯誤。實際 blueprint hex bytes：`7d7d 2078 20`（即 `}}` + 空格 + `x` + 空格）。

## How to apply

- 任何要改 5.value 的工作，照此表確認 `mapper.路徑` 後再下手
- Module 13 改 values 時注意 key 是字串 `"5"` 不是整數 `5`
- 改 Module 11 dealname 時保留 ` x ` 字面字串、不要誤改成 `× `
