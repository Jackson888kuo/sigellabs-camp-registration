---
name: Make IML parseDate 對非法日期 throw error（不回 null）
description: Make IML parseDate() 收到無法解析的日期字串時直接拋出 DataError，不回傳 null；formatDate(parseDate(...)) = "" 的偵測設計因此不可行
type: feedback
originSessionId: bee21c61-ed80-41c2-83b7-26dda5b0805f
---

**規則**：在 Make IML 中絕對不能直接呼叫 `parseDate(value; format)` 而不先驗證 `value` 的格式。應先用 `length()` + `substring()` 做格式預檢，只有格式符合才呼叫 `parseDate`。

**Why（Issue #3 案例）**：Issue #3 spec §3.1 設計用 `formatDate(parseDate(8.3; "YYYY-MM-DD"); "YYYY-MM-DD") = ""` 偵測日期格式異常（預設 parseDate 失敗回 null，formatDate(null) 回空字串）。實際執行遇到 `（無早鳥）` 時報錯：

```
DataError: '（無早鳥）' is not a valid date or does not match the date format
```

整個 iteration 失敗（非 silent，整個 bundle 報錯停止）。

**How to apply（安全 pattern）**：

```iml
{{if(length(value) = 10;
  if(substring(value; 4; 1) = "-";
    if(substring(value; 7; 1) = "-";
      parseDate(value; "YYYY-MM-DD");
    null);
  null);
null)}}
```

完整 period 公式（Issue #3 Module 9 最終實作）：

```iml
{{if(length(8.`3`) = 10; if(substring(8.`3`; 4; 1) = "-"; if(substring(8.`3`; 7; 1) = "-"; if(now <= parseDate(8.`3`; "YYYY-MM-DD"); "early_bird"; "normal"); "normal"); "normal"); "normal")}}
```

**注意**：
- `substring()` 在 Make IML 是 **0-indexed**（pos 4 = "-" in "2026-05-05"）
- 空字串 `""` → length=0≠10 → 直接走 false 分支，parseDate 不被呼叫
- `（無早鳥）` → length=5≠10 → 同上
- `2026/12/15` → length=10 但 pos4="/" ≠ "-" → false 分支，parseDate 不被呼叫
- `2026-99-99` → length=10 且兩個 "-" → parseDate 被呼叫（Make 可能接受或報錯，取決於實作）

**副作用**：空欄位、`（無早鳥）` 等非 10 字元情況，period_alert 為 `""` 而非 `"MALFORMED_EARLY_BIRD_DATE"`（不送 alert）。這與 spec 設計不同但行為更合理（避免 Sheets 未填日期就觸發 alert）。
