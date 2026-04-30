---
name: Make.com IML API 寫入風險
description: 純 API 寫 IML reference 雖長度一致但執行時失敗 — Make 需要 UI 拖拉 token 的 hidden metadata
type: feedback
originSessionId: c7030d75-b37c-40aa-bb15-e244f4a1070b
copiedFrom: Cowork session memory 2026-04-30
---
**規則：Make.com SetVariables / Aggregator 內帶 reference token（如 `5.value`、`10.selected_price`）的 IML 公式，必須用 Make Editor UI 拖拉產生，不能用 Chrome Console / Blueprint API 純文字寫入。**

**Why:** 2026-04-28 嘗試方案 B（API 新增 Module 15 「10b - Build Payment Button HTML」並用 Module 14 cross-ref）：
- API PATCH HTTP 200，IML 長度 429 chars 寫回讀回一致（無 truncation）
- Replay 13 ops 完成（多出 Module 15 的 1 op）
- 但實際 email 渲染 HTML 卡片只剩字串尾段「`'style='...'>前往繳費`」，前段 div + reference 解析全失
- 推測：UI 拖拉的 token 帶 hidden metadata（屬性 token type、source module、bundle index 等），純文字寫入相同字串形似但執行時 reference 無法 resolve

緊急回退：`/api/v2/scenarios/{id}/blueprints?blueprintId=<n>` 可抓任何歷史版本，PATCH 還原。已記錄此 endpoint。

**How to apply:**
- 修改 Make scenario 涉及 reference token 的 IML（特別是 SetVariables 內的長字串拼接）→ 一律用 Make Editor UI 操作
- 純 string / 純 IML 函式（無 reference）的 IML 可用 API（如 Module 9 period 公式 `{{if(now <= parseDate(8.\`3\`; "YYYY-MM-DD"); "early_bird"; "normal")}}` 已驗證 OK）
- 緊急回退用 `?blueprintId=<n>` endpoint，可從 `/blueprints?teamId=...` 列表找到歷史版本號
- 動 IML 前，務必先讀 `project_make_v51_debug_state.md` memory 中的「IML 隱藏 syntax 知識」段落
