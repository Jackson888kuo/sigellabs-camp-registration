# 🧪 測試指南｜給測試團隊看的單頁說明

歡迎加入 Sigel Labs 夏令營報名系統的測試團隊！這份文件用 5 分鐘讓您上手所有需要知道的事。

---

## 📋 一、看板在哪裡？

所有開發進度都在這個看板上：

👉 **[GitHub Project Board](https://github.com/users/Jackson888kuo/projects)**（點進去後選擇本專案的看板）

看板分成 6 欄：

| 欄位 | 意義 | 您要做什麼 |
|------|------|----------|
| 💡 Ideas / Backlog | 待開發的點子清單 | 可瀏覽未來功能、提建議 |
| 🎯 Next Up | 下一個準備開發的 | 知道接下來會看到什麼 |
| 🔨 Building | Jackson 正在開發 | 不需動作，純粹透明 |
| 🧪 Ready to Test | **可以測試了！** | **您的主戰場** |
| 🐞 Needs Fix | 測試發現問題、待修復 | 等待 Jackson 修復 |
| 🚀 Live | 已上線 | 已交付清單 |

---

## ✅ 二、如何知道有東西可以測？

有兩種方式（任選一種習慣即可）：

| 方式 | 操作 |
|------|------|
| **被動接收** | Jackson 會在 PR 或 Issue 中 `@` 您，您會收到 GitHub 通知 |
| **主動查看** | 每天打開看板的 `🧪 Ready to Test` 欄位，看是否有新項目 |

> 💡 建議在 GitHub 設定中開啟 Email 通知，避免漏看。

---

## 📝 三、測試完怎麼回報？

請直接在該 Issue 下方留言，使用以下兩種格式之一：

### ✅ 測試通過

```
✅ 測試通過

- 測試環境：iPhone 14 / Safari
- 測試時間：2026-04-29 14:30
- 備註：流程順暢，無發現問題
```

### ❌ 發現問題

```
❌ 測試未通過

- 測試環境：MacBook Pro / Chrome
- 問題描述：點擊「儲存」後沒有反應
- 重現步驟：
  1. 進入訂單頁
  2. 修改地址
  3. 點儲存
- 截圖：（拖曳檔案到此處）
```

---

## 🐛 四、發現新 Bug 怎麼辦？

不在現有 Issue 範圍內的問題，請建立新 Issue：

1. 進入 [Issues 頁面](https://github.com/Jackson888kuo/sigellabs-camp-registration/issues)
2. 點 **New Issue** 按鈕
3. 選擇 **🐞 Bug 回報** 模板
4. 依表單填寫（用您熟悉的語言即可，不需要技術術語）

---

## 💡 五、想到新功能想提議？

歡迎隨時提出！

1. 進入 [Issues 頁面](https://github.com/Jackson888kuo/sigellabs-camp-registration/issues)
2. 點 **New Issue**
3. 選擇 **💡 新功能需求** 模板
4. 描述您的想法

---

## 🏷️ 六、Label 顏色代表什麼意思？

當您看到 Issue 上有以下標籤時：

| Label | 顏色 | 意思 |
|-------|------|------|
| 🟢 `ready-to-test` | 綠色 | **可以測試了！** |
| 🔴 `blocker` | 紅色 | 嚴重問題，會阻擋上線 |
| 🟡 `needs-info` | 黃色 | Jackson 需要您補充資訊 |
| 🔵 `user-feedback` | 藍色 | 來自實際使用者的回饋 |
| ⚪ `later` | 灰色 | 暫不處理，未來再考慮 |

---

## 🚨 七、緊急狀況怎麼辦？

| 情境 | 聯絡方式 |
|------|----------|
| 系統當機、無法使用 | LINE / iMessage 直接聯絡 Jackson |
| 一般 Bug、功能建議 | GitHub Issue（依本文件流程） |
| 流程疑問、想討論 | GitHub Discussions |

---

## 📅 八、固定節奏

| 頻率 | 事件 |
|------|------|
| **每日** | Jackson 推進開發、您測試 Ready to Test 項目 |
| **每週五** | Jackson 在 Discussions 發布「本週上線了什麼 / 下週做什麼」 |
| **每月** | 全員回顧本月使用情況、調整優先順序 |

---

## 🙋 常見問題

<details>
<summary>Q1：我看不懂 GitHub，要學新工具嗎？</summary>

不需要學任何技術知識。您只需要會：
- 點開連結看看板
- 在 Issue 下方留言（就像 Facebook 留言一樣）
- 拖曳截圖（就像傳 LINE 一樣）

如有任何疑問，請直接問 Jackson。
</details>

<details>
<summary>Q2：我可以同時測試多個項目嗎？</summary>

可以，但建議一次專心測一個，比較不會漏掉細節。
</details>

<details>
<summary>Q3：測試很久沒測完會被催嗎？</summary>

不會。但如果某項目超過 3 天沒回應，Jackson 可能會在 Issue 中 `@` 您確認狀況。
</details>

<details>
<summary>Q4：我不確定這算不算 Bug？</summary>

任何「看起來怪怪的」都歡迎回報。寧可多報，不要漏報。
</details>

---

> 📌 本文件由 Jackson 維護，如有不清楚之處請直接告知，我們會持續優化流程。
