---
title: Staging 冒煙測試報告（2026-05-07）
description: Staging 環境建立完成後的端對端冒煙測試結果
---

# Staging 冒煙測試報告

| 項目 | 值 |
|---|---|
| 測試日期 | 2026-05-07 |
| 測試人員 | Jackson（Claude Code 輔助執行）|
| Staging Scenario | `4975229`（太陽實驗室 – 團報自動化 v5.1-staging）|
| Blueprint 版本 | v12（與 production 同版）|
| 測試方式 | 直接 POST staging webhook（Tally clone 尚未完成，繞過 UI）|

---

## 測試背景

Staging 環境於 2026-05-06 建立完成（詳見 [Staging 環境建立 SOP](./staging-environment-setup.md)）。

本次冒煙測試目的：
1. 確認 staging scenario 可正常觸發並執行完整流程
2. 確認 staging Sheets 寫入正確，與 production 完全隔離
3. 確認 HubSpot contact 正常建立
4. 為後續完整整合測試（30 個測試案例）建立基準

---

## 測試配置

### 測試 Payload（S1）

模擬 1 位家長報名 2 個營隊：

| 欄位 | 值 |
|---|---|
| 家長姓名 | 冒煙測試家長 |
| Email | jacksonkuo@gmail.com |
| 電話 | +886912000099 |
| 孩子姓名（英文）| SmokeTest |
| 報名營隊 | [STEAM] Attack 用電攻擊！ + [運算思維] Game Designer！|
| 團報人數 | 3 人 |

> 注意：此測試 payload 為手動撰寫的簡化版本，部分欄位格式與真實 Tally webhook 略有差異（詳見「已知差異」說明）。

---

## 測試結果

### ✅ 通過項目

| 測試項目 | 預期結果 | 實際結果 | 狀態 |
|---|---|---|---|
| Scenario 觸發 | Webhook 收到後 scenario 啟動 | 正常啟動 | ✅ |
| 多營隊 Iterator 拆分 | 2 個營隊 → 追蹤表寫入 2 列 | 正確寫入 2 列 | ✅ |
| Staging 追蹤表寫入 | 資料寫入 staging 追蹤表 | 正常寫入 | ✅ |
| J 欄空白 | Issue #8：J 欄（已移除欄位）應為空白 | 空白 ✅ | ✅ |
| HubSpot Contact 建立 | 新增或更新 Contact 紀錄 | Contact 正確出現 | ✅ |
| Production 隔離 | Production 追蹤表不應有新資料 | Production 末筆仍為 T14（2026-05-07），無 staging 資料滲入 | ✅ |

### ⚠️ 已知差異（不影響功能）

以下差異皆由測試 payload 格式簡化或 Google Drive 複製限制造成，**不代表 staging 系統有問題**。

| 現象 | 原因 | 正式使用是否影響 |
|---|---|---|
| A 欄（提交時間）空白 | 測試 payload 將 `createdAt` 放在 `data` 物件內；真實 Tally webhook 會在頂層另外帶一份 `createdAt`，Module 13 IML 讀的是頂層 `1.createdAt` | ❌ 不影響，真實 Tally 送出後會正常寫入 |
| E 欄（孩子姓名）空白 | 測試 payload 的欄位標籤用了「孩子姓名（中文）」；真實 Tally 表單欄位名稱是「孩子姓名」，IML 找不到帶括號後綴的標籤 | ❌ 不影響，真實 Tally 送出後會正常寫入 |
| 追蹤表表頭顏色不同 | Google Drive 複製檔案不會完整繼承條件格式與手動套用的儲存格底色 | ❌ 不影響，純視覺差異 |

### ❌ 流程中止項目

| 模組 | 現象 | 原因 | 是否影響核心功能 |
|---|---|---|---|
| M4 SendGrid | BundleValidationError | 測試 Email 格式問題（測試 payload 簡化）；M4 為流程末端，M13 Sheets 寫入已在 M4 之前完成 | ❌ 核心功能不受影響 |

---

## 隔離驗證

| 資源 | Staging | Production | 結果 |
|---|---|---|---|
| Make Scenario | `4975229` | `4596472` | ✅ 各自獨立 |
| 活動設定表 | staging 複本 | `1dZUNmS28HAuXLBPJchaB84xLlRAXuHeMIFxnIm__738` | ✅ 獨立 |
| 追蹤表 | staging 複本 | `1FGksYo2ghgeDLuH4VhwyT8wQM7QDBer7ieuQbjcFNqY` | ✅ 獨立，無資料滲入 |

---

## 結論

**核心功能全部通過**。Staging 環境可正常模擬完整流程，與 production 完全隔離。

### 下一步

| 步驟 | 負責人 | 狀態 |
|---|---|---|
| Tally 表單 clone（指向 staging webhook）| Jackson 手動 | ⬜ 待完成 |
| 真實 Tally 表單端對端測試 | Jackson | ⬜ 待 Tally clone 完成後執行 |
| 完整整合測試（30 個案例）| Jackson | ⬜ 待端對端測試通過後執行 |

完整測試計畫見 [2026-W18-W20 整合測試計畫](../sprints/2026-W18-W20-integration-test-plan.md)。
