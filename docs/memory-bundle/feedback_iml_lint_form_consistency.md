---
name: API PATCH 腳本對 IML 字串需做「形式一致性」lint
description: 批次 PATCH 多模組 IML 時，視覺上同批不等於實際同形；必須用腳本 / snapshot diff 自動檢查同類字串模式一致 — Issue #12 教訓
type: feedback
originSessionId: 6c7cda79-b439-450e-bcd5-e6a31bf6b8f4
---
**規則**：用 API PATCH 對多個模組批次寫入「應該長一樣」的 IML 字串時，**必須在 commit 前對所有寫入位置做形式一致性 lint**，不能仰賴「我這次都用同一個模板」的直覺。

**Why（Issue #12 案例）**：2026-04-30 Issue #6 v2 修補批次 PATCH 5 處 IML（Module 5/8/10/13/27 用 `replace(replace(5.label; "孩子要報名哪些營隊？ ("; ""); ")"; "")` 解析營隊名）。視覺檢查腳本程式碼「看起來」批次寫入相同模板，但實際 production blueprint 出現：

```
✅ Module 13 row[5]:                  ...; ""); ")"; "")  ← 正確
✅ Module 27 payment_button_html:     ...; ""); ")"; "")  ← 正確
❌ Module 11 dealname:                ...; );    ")"; )   ← 缺 ""，silent noop
```

連帶後果：production ≥15 筆錯誤 dealname 累積、5/1 review 才發現、需開 Issue #12 補修 + 清理 9 筆 T9 垃圾 Deal + 額外 0.5 天工作量。

根因不是 Make IML 解析器，而是「**腳本化操作的速度優勢造成形式一致性錯覺**」— 寫腳本時對 5 處用了 5 個不同的模板字串組裝路徑，肉眼 review 看不出差異。

**How to apply（建議的 lint 模式）**：

### Lint 規則 1：相同語意位置同字串

PATCH 腳本送出前，對「應該寫一樣」的所有位置抽出實際寫入字串，做 `set()` 去重：

```python
# 範例：5 處 ref 都應該用同一個 replace 模板
expected = '{{replace(replace(5.label; "孩子要報名哪些營隊？ ("; ""); ")"; "")}}'
written = {
    'M8.mapper.filter[0][0].b': bp['flow'][...]['mapper']['filter'][...]['b'],
    'M10.variables[?].value': ...,
    'M11.properties[0].value': ...,  # 這裡若不一致，lint 會抓到
    'M13.values["5"]': ...,
    'M27.variables[0].value': ...,  # HTML 內含此字串
}
mismatches = {k: v for k, v in written.items() if expected not in v}
assert not mismatches, f"Form inconsistency: {mismatches}"
```

### Lint 規則 2：缺引數 regex pattern 抓取

對所有 IML 字串掃 `replace(...;...; )`、`if(...;...; )`、`get(...; )` 等缺引數模式：

```python
import re
LINT_PATTERNS = [
    r'replace\([^;]+;[^;]+;\s*\)',   # replace 缺第三引數
    r'if\([^;]+;[^;]+;\s*\)',        # if 缺第三引數（false 分支）
]
for path, value in all_iml_values:
    for pat in LINT_PATTERNS:
        if re.search(pat, value):
            print(f"WARN: {path}: {value}")
```

### Lint 規則 3：PATCH 後立即 GET 比對

PATCH 完不能直接相信 HTTP 200 — 立即 `GET /blueprint` 把改動位置的字串讀回來、與寫入的字串做 `==` 比對。如有差異就是序列化問題（罕見但需排除）。

### Lint 規則 4：snapshot diff 跨版本對齊

新版 blueprint 與前一版 snapshot 做 diff，**檢查未預期的位置不應出現變動**（防止腳本誤改其他位置 — 如 Issue #1 慘案的 edge filter 路徑混淆，誤改了非預期模組）。

**對應的開發守則**：

| 守則 | 適用時機 |
|---|---|
| API PATCH 多模組 IML 前先建 expected map | 任何「同模式應寫多處」的工作 |
| 寫入後立即 GET + diff | 100% 必做、不能省 |
| 變動範圍 snapshot diff | PATCH 涉及非該 module 自己的位置時必做 |
| 五渠道輸出視覺驗證 | 任何涉及下游 ref 的工作（詳見 `feedback_acceptance_test_downstream_refs.md`）|

**歷史教訓**：4/30 ~ 5/1 兩天累積三次「形式一致性」相關事故 — (1) Issue #6 v2 spec label 空格漏寫、(2) Issue #1 edge filter vs mapper filter 路徑混淆、(3) Issue #12 Module 11 缺 `""` 引數。共通根因都是「腳本可以快速複製貼用，但若不做自動檢查，肉眼會誤判一致性」。本守則為三次事故的綜合對策。
