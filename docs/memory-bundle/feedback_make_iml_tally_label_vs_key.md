---
name: 不要直接套用 map(...; options/value; label/key; ...) pattern 抓 Tally 多選欄位
description: scenario 4596472 的 Tally 表單把多選改成獨立 CHECKBOXES，舊 map+options pattern 完全不適用
type: feedback
originSessionId: 71840224-472b-4492-aafd-8461ec24947c
copiedFrom: Cowork session memory 2026-04-30
---
在 scenario 4596472 處理 Tally 多選營隊欄位時，**不要直接複製貼用** `map(1.data.fields; "options"; "label"; "報名營隊")` 這類 pattern — 因為實際 Tally 結構並非單一 MULTIPLE_CHOICE 欄位含 options[]，而是**每營隊一個獨立 CHECKBOXES field**。

**Why**：2026-04-29 22:51 用 testing0944_T1 提交 Tally 後從 Make webhook OUTPUT 確認：
- 「孩子要報名哪些營隊？」拆成 6 個獨立 CHECKBOXES fields（key 前綴 `question_PE01L1_`）
- label 格式：`孩子要報名哪些營隊？([營隊全名])`
- 完全沒有「報名營隊」這個 label，也沒有 options[] 集合
- 詳見 [reference_tally_form_checkboxes_structure.md](reference_tally_form_checkboxes_structure.md)

**How to apply**：
1. 任何處理 Tally 多選欄位的 IML，**先確認 webhook payload 是 MULTIPLE_CHOICE 還是 CHECKBOXES**（看 type 屬性）
2. 若是 CHECKBOXES：用 `iterate over 1.data.fields` + `Filter by label contains "<問題名稱>" AND value not empty`
3. 若是 MULTIPLE_CHOICE：才能用 `map(...; "options"; ...)` pattern
4. **不要用 v6 production blueprint 的 IML 當參考**（key=question_bkOj1Z 是失效值，連單選都不會運作）
5. **不要用舊 phase5 blueprint 的 IML 當參考**（label="報名營隊" 與當前 form 不符）
6. 4/29 嘗試的 spec v1 全部需重做為 v2，基於 CHECKBOXES 結構

**歷史教訓**：
- 4/29 全天試圖修 Issue #6，從 spec v1 走到主操作 Step 1-2 都失敗
- 最後送 Tally 測試發現結構誤判才豁然開朗
- 教訓：**動 IML 前一定先看真實 webhook payload，不要假設結構**
