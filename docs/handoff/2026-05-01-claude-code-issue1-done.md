# 交接文件：2026-05-01 Issue #1 完成

## 1. 本次工作範圍

| Issue | 狀態 |
|---|---|
| #6 Iterator 勾 N 寫 N | ✅ 已於 4/30 完成（接續前次）|
| #1 payment_button_html 動態化 | ✅ 今日完成 |
| 追蹤表 T9 垃圾行清除（rows 243-251）| ✅ 今日完成 |

---

## 2. Issue #1 修復摘要

### 問題根因（複合型）

| # | 根因 | 影響 |
|---|---|---|
| A | Module 14 引用已刪除變數 `{{10.payment_button_html}}` | email 付款區塊完全空白 |
| B | Module 8 mapper filter `b` 為靜態字串（非 IML）| Module 8 永遠回傳 0 列，無法取得金額/連結 |
| C | Edge filter 被誤 patch（Python 腳本用錯路徑）| 15 個 Tally fields 全部進入 iterator → 9 次迭代 |

### 修復措施（全部 via Make API PATCH）

| Module | 改動 |
|---|---|
| Module 27（新增 SetVariables）| 建立 `payment_button_html` 變數，HTML 模板含 `{{replace(replace(5.label;...)}}` 動態取營隊名、`{{10.selected_price}}` 取金額、`{{10.payment_link}}` 取連結 |
| Module 14 BasicAggregator | `payment_button_html` 改引用 `{{27.payment_button_html}}` |
| Module 8 edge filter | 還原為：`{{5.label}}` contains `孩子要報名哪些營隊？ (` |
| Module 8 mapper filter `b` | 改為 IML：`{{replace(replace(5.label; "孩子要報名哪些營隊？ ("; ""); ")"; "")}}` |
| Module 27（debug 行）| T11 驗證後移除 debug `<p>` 段落 |

### 驗證結果

| 測試 | ops | 結果 |
|---|---|---|
| T10（Attack 1 camp）| 13 | email 1 張卡片，NT$ 1元，營隊名正確 ✅ |
| T11（Attack + Game Designer）| 21 | email 2 張卡片，各 NT$ 1元，兩個營隊名正確 ✅ |
| 今日 Jackson 手動測試 | — | 全程正常，A欄時間也正確 ✅ |

---

## 3. 當前 Make Scenario 4596472 關鍵模組狀態

### Module 27 payment_button_html（production 版，無 debug）

```
<div style='border:1px solid #f8d7b8;border-radius:8px;padding:15px;margin:10px 0;background:#fff8f0;'>
  <p><strong>🏕️{{replace(replace(5.label; "孩子要報名哪些營隊？ ("; ""); ")"; "")}}</strong></p>
  <p style='margin:8px 0;'>金額：<strong>NT$ {{10.selected_price}}元</strong></p>
  <a href='{{10.payment_link}}' style='display:inline-block;padding:10px 24px;background:#ff6a00;color:#fff;border-radius:5px;text-decoration:none;font-weight:bold;margin-top:8px;'>前往繳費</a>
</div>
```

### Module 8 edge filter（正確狀態）

```json
{"a": "{{5.label}}", "b": "孩子要報名哪些營隊？ (", "o": "text:contain"}
```

### Module 8 mapper filter（正確狀態）

```json
{"a": "A", "b": "{{replace(replace(5.label; \"孩子要報名哪些營隊？ (\"; \"\"); \")\"; \"\")}}", "o": "text:contain"}
```

---

## 4. Blueprint Snapshot

- `docs/snapshots/blueprint_v7_post_issue1_fix.json`（2026-05-01 匯出）

---

## 5. 下次開發對話待辦

| 順序 | Issue | 說明 |
|---|---|---|
| 1 | #2 | 多營隊驗收測試（1/2/3 個營隊各送 1 筆，確認追蹤表 + email）|
| 2 | #3 | 早鳥日期防呆（Sheets 8.D 非 ISO 格式的 fail-safe）|
| 3 | #8 | J 欄無表頭 + IML 未解析 |

### Make API Token
- Token `9af66a66-a62f-4f05-87fb-d1603adf3d89` 位於 `~/.config/make/token`
- **未撤銷** — 明天繼續使用，用完後務必撤銷

---

## 6. 今日關鍵學習

### Edge filter vs Mapper filter 的 mapper 路徑差異

在 blueprint JSON 中，兩種 filter 路徑完全不同，非常容易混淆：

| 類型 | JSON 路徑 | 說明 |
|---|---|---|
| Edge filter（連線上的篩選）| `flow[i].filter` | 在 `flow` array 每個 module 項目的頂層 `filter` key |
| Mapper filter（filterRows 模組內部設定）| `flow[i].mapper.filter` | 在 module 的 `mapper` 物件內的 `filter` key |

**慘案重現**：Python 腳本用 `item.get('filter')` 改到了 edge filter，而非 `item['mapper']['filter']`，導致 15 個 Tally fields 全進 iterator，跑出 77 ops + 9 筆垃圾追蹤行。

**未來守則**：修改 filterRows 內部 filter 時，路徑必須是 `mapper.filter`，不是頂層 `filter`。

### Make IML 嵌入格式（HTML 字串內）

Module 27 的 HTML 字串直接用 `{{expression}}` 嵌入，**不加外層引號也不用 `&` 串接**，整段 HTML 就是 value 字串。之前在 Cowork session 曾嘗試用 `&` 串接和字串引號，導致公式變成字面字串。

### ops 計算公式

`ops = 5 + (8 × 勾選營隊數)`
- 5 ops = 基礎（webhook + contact + iterator 空跑）
- 每個營隊 +8 ops（filterRows + SetVariables×2 + HubSpot Deal + Association + addRow + Aggregator）

### Tally 「一個營隊」vs「兩個以上」路徑

Make 的 Module 5 filter 只處理 CHECKBOXES 欄位（「哪些」分支）。若填表選「一個營隊」（單選，「哪個」問題），Tally 送出的是不同 field label，Make 的 Iterator 不會觸發任何迭代。測試時必須選「兩個以上營隊」才能走 CHECKBOXES 路徑。
