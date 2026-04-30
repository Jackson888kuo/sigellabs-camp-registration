---
name: Tally 表單「孩子要報名哪些營隊？」CHECKBOXES 結構
description: Tally form MeYEJ8 把多選營隊拆成每營隊一個獨立 CHECKBOXES field，根本沒有單一 MULTIPLE_CHOICE 欄位
type: reference
originSessionId: 71840224-472b-4492-aafd-8461ec24947c
copiedFrom: Cowork session memory 2026-04-30
---
Tally form `MeYEJ8`（2026 太陽實驗室夏令營 團報報名）的「孩子要報名哪些營隊？」**不是單一 MULTIPLE_CHOICE 欄位**，而是 **6 個獨立的 CHECKBOXES fields**（每個營隊一個）。

**Webhook payload 結構（驗證於 2026-04-29 testing0944_T1 提交）**：

```json
{
  "data": {
    "fields": [
      ... // fields 1-11 (基本資料、團報人數、營隊數量等)
      {
        "key": "question_PE01L1_a199674a-5a77-49c3-8c58-22e0260e70f8",
        "label": "孩子要報名哪些營隊？([運算思維] Game Designer！小小遊戲設計師營隊)",
        "type": "CHECKBOXES",
        "value": "empty"  // 沒勾選；勾選時為 ID
      },
      {
        "key": "question_PE01L1_37277bef-bbb8-4732-824d-d0e85cceccc8",
        "label": "孩子要報名哪些營隊？([設計思考] 我想這樣...)",
        "type": "CHECKBOXES",
        "value": "empty"
      }
      // ... 共 6 個營隊各 1 field
    ]
  }
}
```

**關鍵特徵**：

| 屬性 | 值 / 模式 |
|---|---|
| Total fields[] 數量 | **15**（不只 8 — 含每個 conditional 分支的問題）|
| 多選營隊 fields 數量 | 6（每營隊一個 CHECKBOXES）|
| key prefix 共用 | `question_PE01L1_` 開頭，後接每營隊獨立 UUID |
| label 格式 | `孩子要報名哪些營隊？([營隊全名])` |
| type | `CHECKBOXES`（不是 `MULTIPLE_CHOICE`）|
| value 勾選時 | option ID 字串 |
| value 未勾選時 | 字串 `empty` |
| **沒有** options[] / 單一 value[] array | ❌ |

**對 Make IML 的含義**：

- ❌ 用 `map(1.data.fields; "options"; "label"; "報名營隊")` 抓不到任何欄位
- ❌ 用 `map(1.data.fields; "options"; "key"; "question_bkOj1Z")` 抓不到（這個 key 不存在）
- ✅ 必須改用 **iterate over whole `1.data.fields`** + **Filter by label contains "孩子要報名哪些營隊？" AND value not empty**

**從 label 取出營隊名的方法**：
- label 範例：`孩子要報名哪些營隊？([STEAM] Attack用電攻擊！...)`
- 解析方式：substring 取第一個 `(` 之後到最後一個 `)` 之前
- 或 replace：去除前綴 `孩子要報名哪些營隊？(` 與後綴 `)`

## ⚠️ 2026-04-30 關鍵修正：label 在 `？` 後有空格

從 Google Sheets F210 formula bar hex 確認：`ff1f 20 28` = `？`(U+FF1F) + **空格**(U+0020) + `(`(U+0028)

- **實際格式（正確）**: `孩子要報名哪些營隊？ ([camp_name])` — 問號後有一個空格再接 `(`
- **舊記錄（錯誤）**: `孩子要報名哪些營隊？([camp_name])` — 無空格
- **影響**: filter 條件與 replace 搜尋字串必須使用 `孩子要報名哪些營隊？ (` (含空格)
- **已修正**: 4/30 用 API PATCH，5 處搜尋字串全改為含空格版本

## ⚠️ Tally Cookie 汙染

Tally 用 **cookie** 儲存 CHECKBOXES 狀態（非 localStorage）。測試時需用無痕視窗或不同 profile 才能乾淨送出。

**重要連結**：
- Form ID: MeYEJ8
- Public form URL: https://tally.so/r/MeYEJ8
- Edit URL: https://tally.so/forms/MeYEJ8/edit

**Phase 5 Make scenario 4596472 已實施策略（v2 spec 4/30 驗證）**：
- Module 5 Array：`{{1.data.fields}}` (whole fields[] array)
- Filter on Module 5 → 8：兩個 AND rules
  - `{{5.label}}` contains `孩子要報名哪些營隊？ (` (含空格，含左括號)
  - `{{5.value}}` not equal to `empty`
- 下游 replace 公式（Modules 8/10/11/13）：`replace(replace(5.label; "孩子要報名哪些營隊？ ("; ""); ")"; "")`
- T3 驗證（2026-04-30）：F 欄顯示乾淨營隊名 ✅
