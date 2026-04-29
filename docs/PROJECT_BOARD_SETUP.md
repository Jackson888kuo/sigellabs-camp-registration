# 📊 GitHub Project Board 設定指南

本文件協助 Jackson 在約 15 分鐘內完成看板建立與自動化規則設定。

---

## 🎯 第一步：建立 Project（2 分鐘）

1. 打開 https://github.com/users/Jackson888kuo/projects
2. 右上角點 **New project** 綠色按鈕
3. 選 **Board** 視圖（看板模式）
4. Project name 輸入：`SIGE Labs 報名系統開發看板`
5. 點 **Create project**

---

## 🗂️ 第二步：設定 6 個欄位（5 分鐘）

預設只會有 Todo / In Progress / Done 三欄，請依下表調整：

| 順序 | 欄位名稱 | 顏色建議 | 操作 |
|------|----------|----------|------|
| 1 | 💡 Ideas / Backlog | Gray | 將 Todo 改名 |
| 2 | 🎯 Next Up | Blue | 點 + 新增欄位 |
| 3 | 🔨 Building | Yellow | 將 In Progress 改名 |
| 4 | 🧪 Ready to Test | Purple | 點 + 新增欄位 |
| 5 | 🐞 Needs Fix | Red | 點 + 新增欄位 |
| 6 | 🚀 Live | Green | 將 Done 改名 |

**改名步驟**：點欄位標題右側的 `...` → Edit details → 修改名稱與顏色

**新增欄位步驟**：在最右邊點 `+` 按鈕

---

## 🔗 第三步：連結 Repository（1 分鐘）

1. Project 頁面右上角點 `...` → **Settings**
2. 左側選單點 **Manage access**
3. 點 **Add repository** → 搜尋 `sigellabs-camp-registration` → 加入

> 這樣 Project 才能讀取到該 Repo 的 Issues。

---

## ⚙️ 第四步：設定自動化規則（5 分鐘）

在 Project Settings 左側點 **Workflows**，啟用以下四條：

### Workflow 1：Issue 建立 → 進 Backlog
- 啟用 **Item added to project**
- When: `Issue` is `added`
- Set: `Status` = `💡 Ideas / Backlog`

### Workflow 2：Issue 被指派 → 進 Building
- 啟用 **Auto-add to project**（若可用）
- 或手動規則：When `Issue` `assigned` → Set `Status` = `🔨 Building`
- 注意：GitHub Projects v2 部分自動化需用 Workflow YAML，可後續加裝

### Workflow 3：PR 合併 → 進 Live
- 啟用 **Pull request merged**
- When: `PR` is `merged`
- Set: `Status` = `🚀 Live`

### Workflow 4：Issue 關閉 → 進 Live
- 啟用 **Item closed**
- When: `Issue` is `closed`
- Set: `Status` = `🚀 Live`

> 💡 GitHub Projects v2 的內建 Workflow 已可滿足大部分需求。若需要更複雜的自動化（例如「加上 ready-to-test label 自動移到 Ready to Test 欄」），需用 GitHub Actions 配合 GraphQL API。可後續再加。

---

## 👥 第五步：邀請測試成員（2 分鐘）

由於 Repo 是 Private，測試成員需被邀請才能看到看板。

```bash
# 將以下 username 替換為實際測試成員的 GitHub 帳號
gh api -X PUT repos/Jackson888kuo/sigellabs-camp-registration/collaborators/USERNAME \
  -f permission=triage
```

| 權限等級 | 適用對象 | 可做什麼 |
|----------|----------|----------|
| `read` | 純查看者 | 只能讀，不能留言 |
| `triage` | **測試者（推薦）** | 可留言、加標籤、不能改程式 |
| `write` | 共同開發者 | 可推程式、合併 PR |

---

## 🏠 第六步：在 Repo 首頁顯示 Project 連結（選用，1 分鐘）

編輯 Repo 的 README.md，在最頂端加上：

```markdown
> 📊 **目前開發進度**：[查看看板](https://github.com/users/Jackson888kuo/projects/PROJECT_ID)
> 🧪 **測試指南**：[TESTING.md](./TESTING.md)
```

將 `PROJECT_ID` 換成實際的 Project ID（看板網址末段數字）。

---

## ✅ 完成檢查清單

- [ ] Project 已建立並命名
- [ ] 6 個欄位設定完成（顏色與名稱）
- [ ] Repository 已連結到 Project
- [ ] 至少 4 條 Workflow 已啟用
- [ ] 測試成員已邀請（permission=triage）
- [ ] README.md 已加上 Project 連結
- [ ] 在 Discussions 公告新流程啟用

---

## 🚀 後續優化（之後再做）

| 優化項目 | 說明 | 時機 |
|----------|------|------|
| 加入 `Priority` 自訂欄位 | High / Medium / Low 排序 | 第二週 |
| 加入 `Estimated Days` 欄位 | 估計開發天數 | 第三週 |
| GitHub Actions 自動化 Label → 欄位移動 | 例如加 `ready-to-test` 自動移到該欄 | 流程穩定後 |
| 切換 Roadmap 視圖 | 月度時程規劃 | 累積 30+ Issues 後 |

---

> 📌 任何設定問題，可在 Discussions 開啟新討論詢問。
