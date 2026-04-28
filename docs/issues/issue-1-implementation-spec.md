# Issue #1 實作 Spec：Module 10 payment_button_html 動態化

| 項目 | 內容 |
|---|---|
| Issue | [#1](https://github.com/Jackson888kuo/sigellabs-camp-registration/issues/1) |
| 優先級 | 🔴 P0 |
| 截止 | 2026-05-05（早鳥優惠結束） |
| Scenario | `4596472` (太陽實驗室 – 團報自動化 v5.1) |
| Team ID | `2085532` |
| 目前採用方案 | **方案 D：Make Editor UI 拖拉**（取代失敗的方案 B）|
| 目前狀態 | 待 Jackson 在 Make Editor UI 操作 |

---

## 1. 背景與目前現狀

| 欄位 | 是否動態 | 公式 |
|---|---|---|
| `Module 10.selected_price` | ✅ 動態 | `{{if(9.period = "early_bird"; 8.``4``; 8.``6``)}}` |
| `Module 10.payment_link` | ✅ 動態 | `{{if(9.period = "early_bird"; 8.``8``; 8.``10``)}}` |
| `Module 10.payment_button_html` | ❌ **早鳥 hardcoded** | UI 拖拉 8.E（10900）+ 8.I（PLvfUn 連結）直接組裝 |

**問題**：5/5 後早鳥結束，但 payment_button_html 仍會輸出早鳥金額/連結。

---

## 2. 方案 B（Console API + 新增 Module 10b）— ⚠️ 已嘗試失敗

### 2.1 嘗試經過（2026-04-28 18:39）

| 步驟 | 結果 |
|---|---|
| 透過 Chrome Console fetch + PATCH API 新增 Module 15 (10b) | ✅ HTTP 200 |
| 寫回 IML 長度驗證 | ✅ 429 chars 一致（無 truncation） |
| Replay 觸發 | ✅ HTTP 202，13 ops 完成（含新 Module 15） |
| **Email 實際渲染** | ❌ **失敗**：HTML 卡片只剩字串尾段「`'style='...'>前往繳費`」，前段 div + reference 解析全失 |

### 2.2 根因

> **「API 直接寫 IML 雖長度對但執行時 truncate / reference 解析失敗」**
>
> Make 的 IML reference token（如 `10.selected_price`）由 UI 拖拉時會帶 hidden metadata，純文字寫入的相同字串雖長度一致，但**執行時 reference 無法 resolve**，整段 `&` 拼接結果只剩 trailing 部分。

此問題在 `project_make_v51_debug_state.md` memory 中已有警告紀錄，本次嘗試證實了該風險的真實性。

### 2.3 已執行的回退

| 動作 | 結果 |
|---|---|
| 從 `/api/v2/scenarios/4596472/blueprints` 取得 v178（PATCH 前版本）| ✅ |
| `?blueprintId=178` 抓回完整 blueprint | ✅ |
| PATCH 還原至 v178 | ✅ HTTP 200 |
| Replay 驗證 | ✅ Email 渲染恢復正常（橘色卡片 + 10900 + PLvfUn）|

---

## 3. 方案 D（建議路線）：Make Editor UI 親手拖拉

### 3.1 核心思路

不在 Module 10 內加 `inline if()`（已知 IML truncation 風險），改採「新增 Module 10b」結構（同方案 B），但**完全用 Make Editor UI 拖拉操作**，確保 reference token 帶 hidden metadata。

### 3.2 步驟

#### Step 1：在 Module 10 之後新增 SetVariables 模組

| 步驟 | 動作 |
|---|---|
| 1.1 | 進入 Make Editor：https://us2.make.com/2085532/scenarios/4596472/edit |
| 1.2 | 滑鼠移到 Module 10 與 Module 11 之間的連線上，會出現 + 號 |
| 1.3 | 點 + 號 → Search modules → 輸入 `Set multiple variables` → 選 **Tools → Set multiple variables** |
| 1.4 | 在新模組設定面板的左下角，把模組名稱改為 `10b - Build Payment Button HTML`（這只影響顯示）|

#### Step 2：在 Module 10 移除原本的 payment_button_html 變數

| 步驟 | 動作 |
|---|---|
| 2.1 | 點 Module 10 開啟設定面板 |
| 2.2 | 找到變數列表中名為 `payment_button_html` 的那一列 |
| 2.3 | 點該列右側的「-」（刪除）按鈕 |
| 2.4 | 點 OK 儲存 |

> 💡 順序提示：先做 Step 1 建立 10b、再 Step 3 在 10b 內建好新 IML、最後才做 Step 2 與 Step 4。這樣中間任何時候線上 scenario 都還能跑。

#### Step 3：在新模組（10b）內建立 payment_button_html

| 步驟 | 動作 |
|---|---|
| 3.1 | 點 10b 開啟設定面板 |
| 3.2 | 點「Add variable」 |
| 3.3 | Name 欄位填：`payment_button_html` |
| 3.4 | Variable lifetime 選：**One cycle**（對應 IML scope=roundtrip） |
| 3.5 | 在 Variable value 欄位（多行 textarea），開始拖拉與手鍵組合 IML |

##### Step 3.5：Variable value 組合（按順序）

> ⚠️ 關鍵：所有 reference 都用 UI 拖拉產生 token（顯示為彩色膠囊），**不要用鍵盤打 `5.value` 等純文字**。

```
{{"<div style='border:1px solid #f8d7b8;border-radius:8px;padding:15px;margin:10px 0;background:#fff8f0;'><p><strong>🏕️ " &
```
↓ **拖拉 token 1**：左側面板 → 找到 Module 5 (Iterator) → 拖入 `Value`（5.value 營隊名）
```
& "</strong></p><p style='margin:8px 0;'>金額：<strong>NT$ " &
```
↓ **拖拉 token 2**：左側面板 → 找到 Module 10 → 拖入 `selected_price`
```
& " 元</strong></p><a href='" &
```
↓ **拖拉 token 3**：左側面板 → 找到 Module 10 → 拖入 `payment_link`
```
& "' style='display:inline-block;padding:10px 24px;background:#ff6a00;color:#fff;border-radius:5px;text-decoration:none;font-weight:bold;margin-top:8px;'>前往繳費</a></div>"}}
```

> 💡 拖拉 token 後可在 token 上按右鍵「Copy」做備份。若 token 不見了（如清空欄位）需重新拖拉，避免手鍵造成 reference 失效。

| 步驟 | 動作 |
|---|---|
| 3.6 | 完成後點 OK 儲存模組 |

#### Step 4：修改 Module 14 的 payment_button_html ref

| 步驟 | 動作 |
|---|---|
| 4.1 | 點 Module 14 (Aggregator) 開啟設定面板 |
| 4.2 | 找到 `payment_button_html` 欄位（已有的舊 token `{{10.payment_button_html}}`）|
| 4.3 | 把舊 token 整段刪除 |
| 4.4 | 從左側面板拖拉新模組 10b 的 `payment_button_html` 進入 |
| 4.5 | 確認顯示為 `{{<10b 模組 ID>.payment_button_html}}`，模組 ID 由 Make 自動分配 |
| 4.6 | 點 OK 儲存 |

#### Step 5：儲存 Scenario

點右下角的 **Save**（💾）按鈕，等出現「Scenario saved」提示。

#### Step 6：驗證

| 步驟 | 動作 | 預期結果 |
|---|---|---|
| 6.1 | Make Editor 上方點 **Run once** 按鈕 | scenario 執行 |
| 6.2 | 在 Tally 表單送出測試報名（單營隊、3人團報）| - |
| 6.3 | 看 Module 10b 的 OUTPUT bubble | `payment_button_html` 含完整 HTML 含 5.value 真值 |
| 6.4 | 開 Gmail (jacksonkuo@gmail.com) | 收到橘色卡片含營隊名 + NT$ 10900 + 早鳥 PLvfUn 連結 |

---

## 4. 5/5 後的驗證計畫

| 項目 | 動作 |
|---|---|
| 早鳥期 → 正常期切換 | 由 Module 9 period 公式自動切換（`{{if(now <= parseDate(8.``3``; "YYYY-MM-DD"); "early_bird"; "normal")}}`） |
| 5/5 當日驗證 | Tally 送出測試表單，確認 email 顯示「正常價」金額（NT$ 11400 等）+ 「正常價」連結 |
| 提前驗證（5/5 前） | 暫時改 Module 9 period 為 hardcode `"normal"`，replay 看結果，**測完還原回動態公式** |

---

## 5. 風險與緩解（更新版）

| 風險 | 機率 | 影響 | 緩解 |
|---|---|---|---|
| ~~API 寫入 IML reference 執行時失敗~~ | ~~中~~ | ~~高~~ | **已踩到並回退**。改用方案 D 完全 UI 拖拉。 |
| UI 拖拉時不小心手鍵 token 名稱 | 🟡 中 | 🔴 高 | 嚴格用 UI 左側面板拖拉，不打字 reference |
| Module 10b 新模組編號不可預期 | 🟢 低 | 🟢 低 | Make 自動分配（記憶中已知是 15）；Module 14 ref 用 UI 拖拉跟著 token，不用記號碼 |
| 操作中途 scenario broken | 🟡 中 | 🔴 高 | 順序：先建 10b、再 build IML、最後才動 Module 10 與 14 |
| 5/5 後正常價分支沒驗證 | 🟡 中 | 🔴 高 | Step 7（5/5 前模擬 normal 期）必做 |

---

## 6. 完成驗收 Checklist

| # | 項目 | 完成 |
|---|---|---|
| 1 | Module 10b 已新增於 Module 10 後 | ⬜ |
| 2 | Module 10b 內 payment_button_html 用 UI 拖拉組合，含 5.value、10.selected_price、10.payment_link 三 token | ⬜ |
| 3 | Module 10 內已移除舊的 payment_button_html 變數 | ⬜ |
| 4 | Module 14 mapper.payment_button_html 已改 ref 至 10b | ⬜ |
| 5 | Run once 早鳥期 email 正確 | ⬜ |
| 6 | （5/5 前）模擬 normal 期 email 正確 | ⬜ |
| 7 | 關閉 Issue #1 並更新 memory | ⬜ |

---

## 7. 維護紀錄

| 日期 | 變更 | 變更者 |
|---|---|---|
| 2026-04-28 | 初版 spec（方案 B Console API） | Jackson + Claude（Cowork） |
| 2026-04-28 | 方案 B 嘗試失敗 + 緊急回退；改為方案 D UI 路線 | Jackson + Claude（Cowork） |
