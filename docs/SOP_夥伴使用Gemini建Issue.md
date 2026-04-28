# 夥伴 SOP：透過 Gemini 建立 GitHub Issue

> **適用對象**：太陽實驗室團報自動化專案協作夥伴
> **預計閱讀時間**：5 分鐘
> **首次設定時間**：約 10 分鐘

歡迎加入太陽實驗室團報專案！本文件說明如何透過 **Workspace Gemini** 協助你建立符合專案規範的 Bug 報告或功能許願，並提交到 GitHub。

---

## 1. 一次性設定（首次使用前）

請依序完成以下三件事：

| # | 項目 | 說明 |
|---|---|---|
| 1 | **接受 GitHub 邀請** | 收到 Jackson 寄來的 collaborator 邀請信後，點 Accept invitation 加入 repo `sigellabs-camp-registration` |
| 2 | **登入 Workspace Gemini** | 用公司 Google 帳號至 [gemini.google.com](https://gemini.google.com) |
| 3 | **取得 Gem 連結** | Jackson 會分享「太陽實驗室 Issue 助手」Gem 的連結給你，點開即可加入「我的 Gems」 |

> 💡 若 Jackson 尚未分享 Gem 連結，請主動詢問。

---

## 2. 日常使用流程（建立一個 Issue 約 5-10 分鐘）

### 流程總覽

```
開 Gemini Gem  →  對話填寫  →  複製產出  →  貼到 GitHub  →  Submit
   (1分鐘)        (3-7分鐘)      (1分鐘)       (1分鐘)        (秒)
```

### Step 1：啟動 Gem
1. 進入 Gemini → 左側「Gems」→ 點選「太陽實驗室 Issue 助手」
2. Gem 會主動詢問你要建立 Bug 還是功能許願

### Step 2：依引導對話
- Gem 會**一次問一題**，請逐題回答
- 答案模糊時 Gem 會追問細節，請耐心補充
- 若有不確定的欄位（如 Run ID、發生時間），可填「未知」或「待補」

### Step 3：確認摘要
- 全部填完後，Gem 會做一次摘要請你確認
- 如有錯誤，回覆「請修改 XX 欄位為 YY」即可
- 確認無誤後回覆「OK」或「確認」

### Step 4：取得三段產出
Gem 會輸出三個區塊：

| 區塊 | 用途 |
|---|---|
| 📋 **GitHub Issue 標題** | 複製到 GitHub Title 欄 |
| 📋 **GitHub Issue Body** | 複製整段到 GitHub Body 欄 |
| 📋 **建議 Label** | 提交時手動在右側加上 |

### Step 5：提交到 GitHub
1. 開瀏覽器到：[https://github.com/Jackson888kuo/sigellabs-camp-registration/issues/new/choose](https://github.com/Jackson888kuo/sigellabs-camp-registration/issues/new/choose)
2. 選擇對應模板：
   - 🐛 **Bug 修復** → 用於 Bug 報告
   - ✨ **功能增強** → 用於功能許願
3. **把 Gem 給的標題貼到 Title 欄**
4. **把 Gem 給的 Body 整段取代範本內容貼到 Body 欄**（GitHub 預設會載入空白模板，請整段選取後直接覆蓋）
5. 在右側 **Labels** 區塊：
   - Bug 預設已有 `bug`，依優先級再加 `P0`（最緊急）/ `P1` / `P2`
   - Feature 預設已有 `enhancement`，依優先級加 priority label
6. 若 Bug 涉及截圖 / Log，**直接拖曳檔案到 Body 欄**任意位置，GitHub 會自動上傳並插入連結
7. 點 **Submit new issue** 完成

---

## 3. 常見情境範例

### 情境 A：發現 Bug
> 👤 你：「Module 10 的付款連結在 Email 裡顯示空白」
>
> 🤖 Gem：「了解，這是 Bug 報告。請描述一下重現步驟，例如：你是在哪一場營隊報名測試時看到的？」
>
> （後續逐題引導完成）

### 情境 B：許願新功能
> 👤 你：「希望追蹤表能自動發週報摘要給家長」
>
> 🤖 Gem：「了解，這是功能許願。請問動機 / 使用情境是什麼？目前家長有反映想看到這個資訊嗎？」
>
> （後續逐題引導完成）

### 情境 C：不確定要不要建 Issue
> 直接問 Gem：「Make scenario 跑了一半就停了，這算 Bug 嗎？」
>
> Gem 會幫你判斷類型並引導後續流程

---

## 4. 撰寫 Issue 的小訣竅

| 訣竅 | 說明 |
|---|---|
| **標題具體** | ❌「報名有問題」 → ✅「Module 10 付款連結 Email 渲染為空字串」 |
| **重現步驟可操作** | 寫到別人照著做也能看到同樣問題 |
| **附 Run ID 最快定位** | 在 Make.com 的 Scenario History 頁面可找到 Run ID |
| **截圖勝過千言** | 直接拖曳到 GitHub Body 欄即可 |
| **不確定就標未知** | 不要捏造資訊，留白比錯誤資訊有用 |

---

## 5. 優先級判斷對照表

### Bug 優先級
| Label | 適用情境 | 處理時效 |
|---|---|---|
| 🔴 **P0** | 阻擋家長報名或收費（線上事故） | 24 小時內 |
| 🟡 **P1** | 功能異常但可手動繞過 | 一週內 |
| 🟢 **P2** | 小瑕疵，不影響主流程 | 視排程 |

### Feature 優先級
| Label | 適用情境 |
|---|---|
| 🔴 **P0** | 有明確截止日（如下次招生季前必須上線）|
| 🟡 **P1** | 重要但非緊急 |
| 🟢 **P2** | Nice to have |

---

## 6. FAQ

| 問題 | 解答 |
|---|---|
| **找不到 Gem 怎麼辦？** | 向 Jackson 索取 Gem 分享連結，或請他重新分享 |
| **不小心送出錯誤 Issue 怎麼辦？** | 進去 Issue 點 Edit 修改 Body，或直接在底下 comment 補充說明，最後請 Jackson 視情況關閉 |
| **可以同時建多個 Issue 嗎？** | 可以，但建議一次一個避免混淆。Gem 處理完一個會問你「需要建立下一個嗎？」 |
| **截圖檔很大上傳失敗？** | GitHub 單檔上限 25 MB。若超過請先壓縮，或上傳到 Google Drive 後在 Body 貼連結 |
| **可以略過某些欄位嗎？** | 必填欄位請勿略過。實在沒有資料可填「未知」或「待補」，比留空更好 |
| **不確定模組是哪一個？** | 直接寫「不確定，可能是 Email 渲染相關」即可，Jackson 會協助分類 |

---

## 7. 取得協助

| 情況 | 聯絡方式 |
|---|---|
| Gem 對話卡住 / 無回應 | 開新對話重試，或截圖傳給 Jackson |
| 不確定 Issue 是否值得建 | 直接 Slack / Email 問 Jackson，毋須事先過濾 |
| 想了解專案脈絡 | 參閱 repo 內 [`docs/規格書_v1.4.md`](./規格書_v1.4.md) 與 [`docs/AI協作工作流.md`](./AI協作工作流.md) |

---

## 8. 維護紀錄

| 日期 | 變更 | 變更者 |
|---|---|---|
| 2026-04-28 | 初版建立 | Jackson + Claude（Cowork） |

---

*感謝你協助讓太陽實驗室的報名系統越來越穩定 🌞*
