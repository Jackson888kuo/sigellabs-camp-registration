---
name: Make scenario 驗收必須涵蓋所有下游 ref 渠道（不只 email + Sheets）
description: scenario 4596472 有 5 處下游 ref（M8/M10/M11/M13/M27），驗收清單必須對每個渠道做視覺檢查 — 否則 Module 11 dealname bug 這種會漏掉
type: feedback
originSessionId: 6c7cda79-b439-450e-bcd5-e6a31bf6b8f4
---
**規則**：Make scenario 4596472 任何涉及修改下游 ref 的 Issue（#6/#1/#12/#2 等），**驗收清單必須對每個下游渠道做視覺檢查**，不能只看 ops 數 + email + Sheets 時間。

**5 個下游渠道**：

| Module | 渠道 | 驗收方法 |
|---|---|---|
| Module 8 mapper.filter | 內部查表（Sheets 活動設定表）| 看 Module 8 OUTPUT bundle 是否取到正確列；金額 / 連結是否非空 |
| Module 10 SetVariables | 變數計算（selected_price、payment_link）| 看 Module 10 OUTPUT 變數值是否正確 |
| **Module 11 createDeal** | **HubSpot Deal name** | **進 HubSpot UI 抽查最近 Deal 的 dealname 欄位** ⚠️ 易漏 |
| Module 13 addRow | Sheets 報名追蹤表 | 開 Sheets 看新增列的 F 欄營隊名 + A 欄時間 |
| Module 27 SetVariables | Email 付款卡片 HTML | 收 email 看卡片內容（營隊名、金額、連結）|

**Why**：4/30 Issue #6 + 5/1 Issue #1 兩次驗收均「通過」，但 5/1 Cowork review 時抽查 HubSpot 才發現 Module 11 dealname 一直壞掉（replace 缺 `""` silent noop，已用 Issue #12 追蹤）。原因：

- T4a/b/c 只驗 ops 數（12/19/26）
- T10/T11 只看 email 卡片（用 Module 27，formula 是好的）+ Sheets 時間
- **沒人去 HubSpot 看 Deal 卡片本體**

5 個渠道用同一 IML 模板（`replace(replace(5.label; "孩子要報名哪些營隊？ ("; ""); ")"; "")`），但腳本 / spec 撰寫時 Module 11 漏帶 `""`，其他 4 個正確 — 只看部分渠道驗收一定會漏。

**How to apply**：
1. **每個 Issue 的 §8 驗證計畫**必須列出 5 個渠道、每個都要至少一個檢查項
2. T 系列測試清單必加「進 HubSpot 抽查最近 Deal」—不能假設「有 5 處 ref 共用同一 IML，所以驗一個就等於驗全部」
3. 寫 snapshot 一致性檢查腳本：比對 5 個 ref 在 blueprint 內的 IML 字面字串是否完全相同（diff 抓出意外不一致）
4. Issue #2 多營隊驗收測試一定要含此清單

**歷史教訓**：「腳本化批次 PATCH」的速度優勢造成「批次內形式一致」的錯覺；實際上批次內仍可能有單獨某個 module 的疏忽（這次是 Module 11）。**形式一致性**必須由腳本 / 工具自動檢查，不能仰賴肉眼。
