---
name: Make IML 沒有 and/or/not 函數
description: Make IML 不支援 and()/or()/not() 邏輯函數；多條件邏輯必須全用巢狀 if() 實現；否則報錯 "Function 'and' not found!"
type: feedback
originSessionId: bee21c61-ed80-41c2-83b7-26dda5b0805f
---

**規則**：Make IML **沒有** `and()`、`or()`、`not()` 函數。撰寫多條件邏輯時**必須全部改用巢狀 `if()`**。

**Why（Issue #3 案例）**：Module 9 IML 需要同時驗證 `length = 10 AND pos4 = "-" AND pos7 = "-"`，第一個 fix 嘗試用 `and(length(8.3) = 10; substring(...) = "-"; ...)` 遭到報錯：

```
DataError: Function 'if' finished with error! Function 'and' not found!
```

**How to apply**：

```
# AND：
and(A; B; C)  →  if(A; if(B; if(C; true_result; false); false); false)

# OR：
or(A; B)  →  if(A; true_result; if(B; true_result; false))

# NOT：
not(A)  →  if(A; false_result; true_result)
```

**完整範例（3 條件 AND）**：

```iml
{{if(length(8.`3`) = 10;
  if(substring(8.`3`; 4; 1) = "-";
    if(substring(8.`3`; 7; 1) = "-";
      "all conditions met";
    "condition 3 fail");
  "condition 2 fail");
"condition 1 fail")}}
```

Make IML 可用的邏輯運算子（非函數）：比較運算子 `=`、`<`、`>`、`<=`、`>=`、`!=`，以及 `if()` 的真值判斷（truthy/falsy）。
