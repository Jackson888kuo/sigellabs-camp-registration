---
name: Tally form MeYEJ8「一個營隊」vs「兩個以上」走不同欄位 — 測試多營隊邏輯必須選 ≥ 2
description: scenario 4596472 Module 5 iterator 只處理 CHECKBOXES（哪些營隊）路徑；單選（哪個營隊）不觸發 iterator；測試多營隊必須勾 ≥ 2
type: reference
originSessionId: 6c7cda79-b439-450e-bcd5-e6a31bf6b8f4
---
Tally form `MeYEJ8`（2026 太陽實驗室夏令營 團報報名）有兩個分支問題：

| 分支問題 | type | 觸發條件 | 對應 Make Module 5 行為 |
|---|---|---|---|
| 「您要報哪個營隊？」（單選）| `MULTIPLE_CHOICE` 或 `DROPDOWN` | 「您這次要報名幾個營隊？」= 1 | 不觸發 iterator（fields[] 內無 CHECKBOXES）|
| 「孩子要報名哪些營隊？」（多選）| 6 個獨立 `CHECKBOXES` | 「您這次要報名幾個營隊？」≥ 2 | 觸發 iterator；每勾選 1 營隊 → 1 次迭代 |

**Why**：Module 5 (BasicFeeder) 的 `array = {{1.data.fields}}` + Module 5→8 edge filter（label contains `孩子要報名哪些營隊？ (`）只匹配 CHECKBOXES 路徑的 fields。單選分支送出的 field label 是「您要報哪個營隊？」不含「哪些」，filter 不通過、iterator 跑空 → Sheets 不寫、HubSpot Deal 不建。

**How to apply**：
1. 測試多營隊邏輯（Issue #2 驗收 / 任何 iterator 相關）→ Tally 第一頁「您這次要報名幾個營隊？」必須選 **≥ 2**
2. 若選 1 → 測試會通過 webhook 但 iterator 路徑完全沒走，**錯認為「無 bug」**
3. ops 公式（5/1 Issue #1 後）：`5 + N × 8`，N 為勾選營隊數（N ≥ 2）
4. 若要驗證單選分支邏輯（不在當前 sprint 範圍）→ 另行規劃

**測試案例對應 ops 數**：

| 測試 | 勾選營隊數 | 預期 ops |
|---|---|---|
| T4a | 1（誤勾，測 Iterator 路徑邊界）| 12 |
| T4b | 2 | 19 |
| T4c | 3 | 26 |
| T11 | 2（Issue #1 後）| 21 |

注：T4 系列為 Issue #6 期、ops = `5 + N×7`；T11 為 Issue #1 後（新增 Module 27）、ops = `5 + N×8`。

**重要連結**：Form ID `MeYEJ8`、public URL `https://tally.so/r/MeYEJ8`、edit URL `https://tally.so/forms/MeYEJ8/edit`。
