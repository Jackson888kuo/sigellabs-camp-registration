---
name: Make blueprint edge filter 與 mapper filter 路徑完全不同（極易混淆）
description: 修 filterRows 模組內部 filter 必須走 mapper.filter；改連線上的 filter 才走 flow.filter — Issue #1 慘案教訓
type: feedback
originSessionId: 6c7cda79-b439-450e-bcd5-e6a31bf6b8f4
---
**規則**：Make blueprint JSON 中有兩種 filter，路徑完全不同，必須區分清楚。

| 類型 | JSON 路徑 | 用途 |
|---|---|---|
| **Edge filter**（連線上的篩選） | `flow[i].filter` | 控制資料是否進入下一個 module（含 Iterator → 下游）|
| **Mapper filter**（filterRows 模組內部設定）| `flow[i].mapper.filter` | filterRows 模組對「在 mapper 上配置的查詢條件」（如 Sheets 查表 A 欄 contains XXX）|

**Why**：2026-04-30 Issue #1 修復過程，Python 腳本誤用 `item.get('filter')` 改到 edge filter（位於 module 物件頂層），而非 `item['mapper']['filter']`（位於 module mapper 物件內）。結果：

- 預期：Module 8 mapper.filter 用 IML `replace(...)` 動態取營隊名查表
- 實際：edge filter 被改、mapper filter 未動 → 5→8 連線條件被破壞 → 15 個 Tally fields 全進 iterator → 9 次迭代、77 ops、HubSpot 出現 9 筆垃圾 Deal、Sheets 出現 9 筆垃圾行

清理成本：Sheets rows 243-251 手動刪除（4/30 17:00-17:11）+ HubSpot 9 筆 T9 Deal 待刪除（Issue #12）。

**How to apply**：
1. **修任何 filterRows 模組內部 filter** → 路徑必須是 `flow[i].mapper.filter`（i 是 module ID 對應的 array index，不是 module ID 本身）
2. **修連線上的 filter（Iterator → 下游、條件分支等）** → 路徑是 `flow[i].filter`
3. Python / API patch 腳本撰寫前，**先在 sample blueprint 上 print 兩個路徑的內容對照**確認結構，再動真實 scenario
4. 改完一定 Run Once + 看 ops 數是否符合預期公式（`5 + N × 8`）；ops 暴增 = 邊界 filter 沒做好
5. 此區分對 Issue #2 / #8 同樣適用（任何涉及 filterRows 的工作）

**歷史教訓**：4/30 Issue #1 慘案因路徑混淆造成「77 ops + 9 筆垃圾 Deal/行」，比原本的 bug 嚴重幾倍。腳本化操作的速度優勢必須配合**路徑驗證**才能發揮。
