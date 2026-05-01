---
name: Tally CHECKBOXES 未勾選 value 是 null 不是字串 "empty"
description: scenario 4596472 Issue #6 v2 final fix 教訓 — Filter 必須加 if(value) 真值判斷才能擋 null，不能只靠 text:notequal "empty"
type: feedback
originSessionId: 6c7cda79-b439-450e-bcd5-e6a31bf6b8f4
---
**規則**：Tally form `MeYEJ8` 的 CHECKBOXES 欄位「未勾選」時 webhook payload 送 **`null`**，不是字串 `"empty"`。

任何在 Make Filter 中要排除「未勾選 CHECKBOXES」的條件，**必須加 `{{if(value; "yes"; "no")}} text:equal "yes"` 真值判斷**，不能只靠 `value text:notequal "empty"`。

**Why**：2026-04-30 Issue #6 v2 spec 假設 value 為字串 `"empty"`，因此 filter 設計為 `value text:notequal "empty"`。實際 production 跑出 6 筆全過 — 因為 `null text:notequal "empty"` 在 Make 求值為 TRUE，6 個 CHECKBOXES（含未勾選的）全部通過 filter。

**最終 fix**（Module 8 edge filter 三條件 AND）：
```
Rule 1: {{5.label}}                         text:contain   孩子要報名哪些營隊？ (
Rule 2: {{5.value}}                         text:notequal  empty
Rule 3: {{if(5.value; "yes"; "no")}}        text:equal     yes   ← 真值判斷，擋 null
```

驗證：T4a/b/c（1/2/3 營隊）→ 12/19/26 ops 全對；無 null 漏勾。

**How to apply**：
1. 動任何 CHECKBOXES filter 之前先送一筆只勾部分項目的 Tally → 從 Make execution OUTPUT 看未勾欄位的 raw value 字面是什麼（null vs "empty" vs 空字串）
2. 預設假設 = `null`（保守安全）
3. Spec / memory 文件曾寫過 `value="empty"` 的版本要視為**未驗證假設**，不可直接套用
4. ops 公式（Issue #6 完成後 + Issue #1 新增 Module 27 後）：`5 + N × 8`（N = 勾選營隊數）

**歷史教訓**：4/30 Issue #6 v2 spec 第二次假設錯誤（v1 假設 MULTIPLE_CHOICE、v2 假設 value="empty"）才修對。「動 IML 前看真實 webhook payload」這條原則必須延伸到「value 字面也要看」。
