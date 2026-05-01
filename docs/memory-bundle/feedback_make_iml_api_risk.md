---
name: Make IML API 寫入風險（5/1 細化版）
description: API PATCH IML 安全性取決於內容類型 — 純函式 / iterator output reference 安全；跨模組 token 拼接仍須 UI 拖拉
type: feedback
originSessionId: c7030d75-b37c-40aa-bb15-e244f4a1070b
---
**規則（2026-05-01 細化版）**：Make.com 透過 API PATCH IML 的風險**取決於 IML 內容類型**，不是一刀切。

| 內容類型 | API PATCH 安全嗎 | 範例 |
|---|---|---|
| 純 IML 函式、無 reference token | ✅ 安全 | Module 9 period 公式 `{{if(now <= parseDate(8.\`3\`; "YYYY-MM-DD"); "early_bird"; "normal")}}` |
| 字面字串 + 同模組 / iterator-output reference（如 `{{5.label}}`、`{{10.selected_price}}`）| ✅ 安全（5/1 Issue #1 已驗證）| Module 27 HTML 模板含 `{{replace(replace(5.label; ...; ""))}} + {{10.selected_price}} + {{10.payment_link}}` |
| 補完既有 IML 字串（如缺 `""` 引數）| ✅ 安全 | Issue #12 補 Module 11 dealname `""` |
| **跨模組「token 拼接」**（用某 module 的變數 + 字串 + 另一 module 的變數，兩個都是引用其他 SetVariables 的命名變數）| ❌ **仍須 UI 拖拉** | 4/28 慘案：Module 15 SetVariables 用 `<div>` + `{{14.x}}` + `<style>` + `{{14.y}}` |

**Why H2 確定（5/1 Issue #12 review）**：原本「API 寫 reference token 必失敗」的判斷被 Issue #1 (Module 27 用 API PATCH 成功) 與 Issue #12（H2 確定）證明過於保守。差別在於：

- 4/28 慘案的 reference 是「**已存在於另一個 SetVariables 模組**」的 token（cross-module token assembly）
- Issue #1 / Issue #12 的 reference 是「**iterator output 的欄位**」（`{{5.label}}`）或「**同模組產生的變數**」（`{{10.selected_price}}`）

後者 Make 的執行階段 reference resolution 不依賴 UI 拖拉的 hidden metadata；前者似乎依賴。

**How to apply（細化規則）**：
1. **可放心 API PATCH 的情境**：
   - 純 IML 函式 / 字面字串
   - `{{moduleId.fieldName}}` 形式的 iterator output 引用（如 `5.label`、`5.value`）
   - 同 module 內 SetVariables 之間的 reference（Issue #1 Module 10 → Module 27 的 `{{10.selected_price}}` 屬此類，已驗證 OK）
2. **仍須 UI 拖拉**：跨多個 SetVariables 模組的「token 拼接」式 reference（極少見、需具體判斷）
3. **保險做法**：API PATCH 後務必（a）GET 一次 blueprint 確認字串完整、（b）Run Once + 看下游 production 真實輸出（不是只看 ops 數）— 詳見 `feedback_acceptance_test_downstream_refs.md`
4. **緊急回退** `/api/v2/scenarios/{id}/blueprints?blueprintId=<n>` 可抓任何歷史版本 PATCH 還原
5. **Lint 規則**：API PATCH 腳本對 IML 字串組裝時 lint `replace(...;...;)`、`if(...;...; )` 等缺引數模式（詳見 `feedback_make_iml_replace_empty_args.md`）
