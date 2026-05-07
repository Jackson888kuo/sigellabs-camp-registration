---
title: 太陽實驗室 Sigel Labs 團報自動化系統
description: 開發紀錄、業務同事使用手冊、SOP、整合測試計畫
---

# 太陽實驗室 Sigel Labs 團報自動化系統

> 太陽實驗室營隊「團報多營隊報名」自動化流程的開發紀錄、規格、SOP 與維運資料。
> 整合 **Tally / Make.com / HubSpot / Google Sheets / SendGrid**，採無程式碼（no-code）架構實作。

| 項目 | 狀態 |
|---|---|
| Make Scenario 版本 | **v5.1**（Scenario `4596472`，已含 Issue #3 + #8）|
| 當前 Sprint | **Winter Camp Prep 2026（W18–W20）** ✅ 6/6 全綠 |
| 預定啟用 | 2026 年冬令營（12 月）|

---

## 📚 業務同事使用手冊（最常用）

| 文件 | 對象 | 預估閱讀時間 |
|---|---|---|
| [Tally 表單維護手冊](./manuals/01-tally-form-maintenance.md) | 業務、營運 | 15 分鐘 |
| [Sheets 維護手冊](./manuals/02-sheets-maintenance.md) | 業務、營運、行政 | 20 分鐘 |
| [Alert email 處理 SOP](./manuals/03-alert-email-sop.md) | 監控信箱接收者 | 10 分鐘 |

> 💡 **第一次接觸**：從 [手冊索引](./manuals/) 開始閱讀。

---

## 🔧 系統文件（技術人員）

| 區塊 | 內容 |
|---|---|
| [Issues](./issues/) | 已修補的 Issue 規格（#1, #3, #6, #8, #12 等）|
| [Sprints](./sprints/) | Sprint 規劃、整合測試計畫、retrospective |
| [Runbooks](./runbooks/) | Staging 環境建立 SOP、冒煙測試報告 |
| [Snapshots](./snapshots/) | Make blueprint 歷史備份（v6 ~ v12）|

---

## 📅 Sprint 進度（2026-W18-W20 Winter Camp Prep）

| # | Issue | 狀態 |
|---|---|---|
| 1 | #6 Iterator 勾 N 寫 N | ✅ 5/1 完成 |
| 2 | #1 Module 10 payment_button_html 動態化 | ✅ 5/1 完成 |
| 3 | #12 Module 11 dealname replace() 修補 | ✅ 5/1 完成 |
| 4 | #2 多營隊驗收測試 | ✅ 5/1 完成 |
| 5 | #3 早鳥日期防呆（雙重防呆）| ✅ 5/6 完成 |
| 6 | #8 J 欄移除 | ✅ 5/6 完成 |

**Sprint 6/6 全綠**，提早原訂 5/15 完成日 9 天。

---

## 🆘 緊急聯絡

| 狀況 | 聯絡方式 |
|---|---|
| 系統異常 | Jackson（hello@sigellabs.com）|
| 業務面操作問題 | 主管 |
| 收到 Alert email | 看 [Alert email 處理 SOP](./manuals/03-alert-email-sop.md) |

---

## 📋 維護紀錄

| 日期 | 變更 |
|---|---|
| 2026-05-06 | Sprint 6/6 全綠完成、業務手冊 + Staging SOP + 整合測試計畫上線 |
