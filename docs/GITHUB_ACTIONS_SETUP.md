# 🤖 GitHub Actions 自動化設定指南

本指南帶您 5 分鐘完成 Actions 所需的 PAT 設定。

---

## 為什麼需要額外的 Token？

| Token 類型 | 預設權限 | 能操作 Project |
|------------|----------|----------------|
| `GITHUB_TOKEN`（Action 自動提供）| 僅限該 Repo | ❌ **不能跨到 User Project** |
| **PAT (Personal Access Token)** | 您手動設定 scope | ✅ 含 `project` scope 即可 |

由於 GitHub Project v2 是 User-level 資源（不是 Repo 內），Action 內建 token 不夠，需要 PAT。

---

## 📝 設定步驟（一次完成，永久有效）

### 步驟 1：建立 PAT（2 分鐘）

| 順序 | 動作 |
|------|------|
| 1 | 前往 https://github.com/settings/personal-access-tokens/new |
| 2 | Token name：`Sigel Labs Project Automation` |
| 3 | Expiration：選 `Custom...` → 設定 1 年後（避免太頻繁更新）|
| 4 | Repository access：選 `Only select repositories` → 勾 `sigellabs-camp-registration` |
| 5 | Repository permissions：`Issues` → **Read and write**、`Pull requests` → **Read and write** |
| 6 | Account permissions：`Projects` → **Read and write** |
| 7 | 拉到最下面點 **Generate token** |
| 8 | **立即複製出現的 token**（只顯示一次！）|

### 步驟 2：將 PAT 加入 Repo Secrets（1 分鐘）

| 順序 | 動作 |
|------|------|
| 1 | 前往 https://github.com/Jackson888kuo/sigellabs-camp-registration/settings/secrets/actions |
| 2 | 點 **New repository secret** |
| 3 | Name：**`PROJECT_TOKEN`**（必須完全一致，YAML 內引用此名）|
| 4 | Secret：貼上剛複製的 PAT |
| 5 | 點 **Add secret** |

### 步驟 3：驗證 Action 運作（自動測試）

合併本 PR 後，建立一個測試 Issue：

```bash
gh issue create \
  --repo Jackson888kuo/sigellabs-camp-registration \
  --title "[TEST] 驗證 Actions 自動加入 Project" \
  --body "如本 Issue 出現在 Project Board 的 Backlog 欄位，代表 Actions 設定成功"
```

到 https://github.com/users/Jackson888kuo/projects/2 確認該 Issue 已自動出現。

---

## 🔧 已建立的 3 個 Actions Workflow

| 檔案 | 觸發條件 | 行為 |
|------|----------|------|
| `auto-add-to-project.yml` | 新 Issue/PR 建立 | 自動加入 Project（會自動進 Backlog 欄）|
| `label-to-status.yml` | Issue 加上/移除 label | 依 label 自動移動到對應欄位 |
| `blocker-notify.yml` | Issue 加上 `blocker` label | 自動留言 @Jackson 通知 |

---

## 📋 Label → 欄位對照表（label-to-status.yml）

| Label 動作 | 自動移到欄位 |
|-----------|--------------|
| 加上 `ready-to-test` | 🧪 Ready to Test |
| 移除 `ready-to-test` | 🔨 Building（回去修改）|
| 加上 `blocker` | 🐞 Needs Fix |
| 移除 `blocker` | 💡 Backlog（待重新評估）|
| 加上 `needs-info` | 💡 Backlog（等資訊補齊）|
| 移除 `needs-info` | 🎯 Next Up（資訊已齊）|

---

## ⚠️ 注意事項

| 項目 | 說明 |
|------|------|
| **PAT 過期** | 設定 1 年後過期。到期前 Actions 會失敗，記得更新 Secret |
| **與 UI Workflow 衝突** | 「Auto-add to project」UI workflow **不要啟用**，避免雙重觸發 |
| **GITHUB_TOKEN vs PROJECT_TOKEN** | Comment 用內建 token，Project 操作用 PROJECT_TOKEN |
| **執行時間消耗** | 每次 Action 約 5-10 秒，每月可用額度 2,000 分鐘（足夠）|

---

## 🔍 除錯：Actions 失敗時怎麼辦

| 症狀 | 原因 | 解決方式 |
|------|------|----------|
| Resource not accessible | PAT 權限不足 | 確認 PAT 含 Projects: Read and write |
| Bad credentials | PAT 已過期或誤刪 | 重新建立 PAT 並更新 Secret |
| Could not resolve to a node | Project ID 錯誤 | 比對 YAML 內的 PVT_xxx ID |
| Action 沒有觸發 | 觸發條件不符 | 查看 Repo → Actions 頁面的 log |

---

## 🚀 後續可加的 Actions（您未來想擴充時）

| 自動化 | 用途 |
|--------|------|
| **Stale Issue 提醒** | 30 天無回應的 Issue 自動加 `stale` label |
| **PR 合併後關閉相關 Issue** | PR 描述含 `Closes #N` 時自動關閉 |
| **每週進度週報** | 每週五自動 post 到 Discussions |
| **測試成員指派輪替** | 新 Issue 建立時自動隨機指派測試者 |

需要任何項目時請告訴我，我可以為您加上。
