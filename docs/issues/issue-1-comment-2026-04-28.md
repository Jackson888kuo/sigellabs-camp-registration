## 2026-04-28 進度更新

### 已嘗試方案 B（Console API + 新增 Module 10b）— 失敗並已回退

| 步驟 | 結果 |
|---|---|
| Console fetch + PATCH 新增 Module 15 | ✅ HTTP 200 |
| 寫回 IML 長度驗證 | ✅ 429 chars 一致（無 truncation） |
| Replay 觸發 | ✅ 13 ops 完成 |
| **Email 實際渲染** | ❌ HTML 卡片只剩字串尾段，前段 div + reference 解析全失 |

### 失敗根因

> API 寫入的 IML reference token（`10.selected_price` 等）雖然字串長度一致，但**缺少 UI 拖拉時產生的 hidden metadata**，執行時 reference 無法正確 resolve，整段 `&` 拼接結果只剩 trailing 部分。

此風險在過往 debug 紀錄中已有警告，本次踩中。

### 緊急回退已完成

- 從 `/api/v2/scenarios/{id}/blueprints?blueprintId=178` 抓回 PATCH 前版本
- PATCH 還原至 v178 → HTTP 200
- Replay 驗證 → Email 渲染恢復正常（早鳥 hardcoded 版本）

### 下一步：方案 D（Make Editor UI 親手拖拉）

完整步驟見 [`docs/issues/issue-1-implementation-spec.md`](../blob/main/docs/issues/issue-1-implementation-spec.md) 第 3 節。

關鍵要點：
- 同樣新增 Module 10b（SetVariables）於 Module 10 之後
- **完全用 UI 拖拉組合 IML**，不用 API
- 順序：先建 10b、再 build IML、最後才動 Module 10 與 Module 14（避免中途 scenario broken）

預計完成：截止 2026-05-05 前。
