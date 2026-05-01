# 2026-05-01 工作紀錄：Issue #12 修補 + Issue #2 驗收

## 概覽

| 項目 | 結果 |
|---|---|
| Issue #12 | ✅ 修補完成（Module 11 dealname replace() 補 `""`）|
| Issue #2 | ✅ 驗收完成（T12 多營隊 2 個完整流程通過）|
| Commits | `909bafa`（#12）、`aa41799`（memory bundle）|

---

## Issue #12：Module 11 dealname replace() 缺 `""` 修補

### 根因（H2 確認）
Issue #6 v2 PATCH 腳本對 Module 11 使用了不同模板字串，導致兩處 `replace()` 缺 `""` 第三引數 → silent noop → dealname 輸出完整 Tally label 原文。

**錯誤 IML（修補前）：**
```
replace(replace(5.label; "孩子要報名哪些營隊？ ("; ); ")"; )
```

**正確 IML（修補後）：**
```
replace(replace(5.label; "孩子要報名哪些營隊？ ("; ""); ")"; "")
```

### 修補方式
API PATCH：腳本 `scripts/issue-12-patch-module11-dealname.py`

**關鍵常數：**
```python
BUGGY_SUFFIX  = '; ); ")"; )}}'
CORRECT_SUFFIX = '; ""); ")"; "")}}'
```

### 執行步驟
1. T9 垃圾 Deal 清理（9 筆 HubSpot Deal，HTTP 204 刪除確認）
2. `python3 scripts/issue-12-patch-module11-dealname.py --dry-run` 確認 diff
3. `python3 scripts/issue-12-patch-module11-dealname.py` 執行修補
4. GET blueprint 回讀驗證：`; ""); ")"; "")}}` ✅
5. T12 Tally 表單送出驗證（詳見 Issue #2 驗收）

### Blueprint Snapshot
- 修補前：`docs/snapshots/blueprint_v7_post_issue1_fix.json`
- 修補後：`docs/snapshots/blueprint_v8_post_issue12_fix.json`

---

## Issue #2：多營隊驗收（T12）

### 測試情境
- **家長**：測試家長T12 / jacksonkuo@gmail.com / +886 900 000 012
- **孩子**：測試孩子T12 / 2018-01-01
- **團報人數**：3人團報
- **選擇 2 個營隊**：
  - [STEAM] Attack用電攻擊！拆解生活中的電學營隊
  - [運算思維] Game Designer！小小遊戲設計師營隊

### 完整驗收矩陣

| 渠道 | 檢查項目 | 結果 |
|---|---|---|
| Make ops | 21 = 5 + 2×8 | ✅ |
| HubSpot Deal（Module 11）| 2 筆，dealname 格式 `[孩子] x [乾淨營隊名]`，無前綴 | ✅ |
| Sheets 追蹤表（Module 13）| Row 248-249，F 欄營隊名正確，無前綴 | ✅ |
| Email 確認信（Module 27）| 1 封信，2 張付款卡片，各營隊名稱正確 | ✅ |

### HubSpot T12 Deal names（驗證）
```
323303670481  測試孩子T12 x [運算思維] Game Designer！小小遊戲設計師營隊
323337150142  測試孩子T12 x [STEAM] Attack用電攻擊！拆解生活中的電學營隊
```

---

## 學到的教訓

### Issue #12 的歷史影響
- T10、T11 共 4 筆 Deal 的 dealname 仍含錯誤前綴（歷史資料，未清理）
- T9×9 筆垃圾 Deal（4/30 路徑混淆事故）已於本次清理

### 驗收覆蓋原則（再次確認）
5 個下游渠道（M8/M10/M11/M13/M27）都必須驗，不能只看 ops 或 email。
本次 T12 驗收首次完整涵蓋全部 5 渠道。

---

## 下一步（Sprint 待辦）

| Issue | 主題 | 狀態 |
|---|---|---|
| #3 | 早鳥日期防護 | 🔲 待開始 |
| #8 | J 欄標題 + IML 未解決 | 🔲 待開始 |

---

*本紀錄由 Claude Code 於 2026-05-01 工作階段結束後整理。*
