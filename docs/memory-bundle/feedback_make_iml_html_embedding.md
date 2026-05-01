---
name: Make IML 在 HTML 字串內嵌 — 直接 {{expr}} 不加 & 不加引號
description: SetVariables 內的 HTML 模板字串 — 整段 HTML 直接是 value，{{expression}} 直接寫在 HTML 內，不要用 & 串接也不要加字串引號
type: feedback
originSessionId: 6c7cda79-b439-450e-bcd5-e6a31bf6b8f4
---
**規則**：Make `util:SetVariables` 模組內，當變數 value 是「HTML 字串夾雜 IML 表達式」時：

```
✅ 正確：<div>...<strong>🏕️{{replace(replace(5.label; "孩子要報名哪些營隊？ ("; ""); ")"; "")}}</strong>...金額：NT$ {{10.selected_price}}元...</div>

❌ 錯誤（曾在 Cowork session 試過）：'<div>...' & {{replace(...)}} & '...金額：NT$ ' & {{10.selected_price}} & '...</div>'
```

**Why**：4/30 Cowork session 嘗試用 `&` 串接 HTML 與 IML 表達式（類比 Excel / Google Sheets 字串串接語法），結果整段公式變字面字串 — `&` 在 Make IML 不是運算子，是字面字元；外層字串引號也沒必要因為整個 value 已經是字串。

5/1 Issue #1 修補時 Module 27 用正確語法（直接 `<div>...{{expr}}...</div>`）即可。

**How to apply**：
1. SetVariables 內 HTML 模板：整段 HTML 直接貼進 value 欄位，IML 表達式用 `{{...}}` 嵌入即可
2. 不要把 HTML 拆成 `'...' & {{...}} & '...'` — 那是 sheet formula 的習慣
3. 字串內若有 `'` 單引號（例如 HTML 屬性值 `style='...'`），不需 escape — Make API JSON 序列化時自動處理
4. 字串內 `"` 雙引號需 escape 為 `\"`（JSON 規則）
5. 模板長度可達數百字元無問題（Module 27 的 HTML 約 410 字元 OK）

**歷史教訓**：跨平台公式語法不能類比直覺套用。Make IML 的串接語意 = 自然字串拼接（HTML 原樣 + `{{}}` 替換），不是運算子串接。
