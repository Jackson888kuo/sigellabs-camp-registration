---
name: Make IML replace() 缺第三引數 silent noop（Issue #12 教訓）
description: replace(string; search; ) 缺第三引數 Make 不會報錯但會 silently 不替換 — 必須寫 replace(string; search; "")
type: feedback
originSessionId: 6c7cda79-b439-450e-bcd5-e6a31bf6b8f4
---
**規則**：Make IML `replace(string; search; replacement)` 第三引數必須**明確寫 `""`**（空字串）才會做替換。寫成 `replace(string; search; )`（缺第三引數）會 **silent noop**：不報錯、不替換、原樣輸出。

**Why（H2 已由 Claude Code 確認）**：2026-04-30 Issue #6 v2 修復批次 PATCH 5 處 IML 時，Module 11 dealname 同批次寫入但缺 `""`，Module 13 row[5] / Module 27 payment_button_html 同批次但有 `""`。Module 13/27 用同一 API 通道寫入正確，**證明不是序列化折疊**（H1 排除）— 是寫入時就缺，純粹是 API 腳本 / spec 撰寫疏忽（H2 確定）。

Production 證據：4/30 16:31 ~ 4/30 16:59 期間建立的 5 筆 Deal（T10 / T11 ×2 / test1259 ×2）dealname 全是 `<姓名> x 孩子要報名哪些營隊？ ([營隊名])`，前綴 `孩子要報名哪些營隊？ (` 與後綴 `)` **完全沒被剝除** — replace() 兩處都 noop。

**對照表**：
```
✅ Module 13: replace(replace(5.label; "孩子要報名哪些營隊？ ("; ""); ")"; "")  ← 正確輸出 [STEAM] Attack...
✅ Module 27: replace(replace(5.label; "孩子要報名哪些營隊？ ("; ""); ")"; "")  ← email 卡片正確
❌ Module 11: replace(replace(5.label; "孩子要報名哪些營隊？ ("; );    ")"; )    ← dealname 含完整前綴
```

**How to apply**：
1. **任何 `replace(s; pattern; )` 形式視為缺陷**，必須補 `""`
2. API PATCH 腳本對 IML 字串組裝時，逐字串 lint：`replace(...;...;)` regex 抓出來檢查
3. 修補通道：API PATCH 補 `""` 安全（無 reference token 結構變動，與 4/28 方案 B 風險不同）
4. 補完後**必看 production 真實輸出**（HubSpot Deal name / Sheets row / email）— 不能只看 ops 數通過
5. 同樣原則套用到其他 IML 函式：缺引數可能 silent fail，要寫成 lint rule 自動檢查

**歷史教訓**：4/30 ~ 5/1 Issue #6 + Issue #1 兩次驗收都通過（ops + email 正確），但 Module 11 broken 沒被發現。原因：T 系列驗收只看 email + Sheets 時間，沒人開 HubSpot 看 dealname。**驗收覆蓋面盲點**詳見 `feedback_acceptance_test_downstream_refs.md`。

**追蹤**：Issue #12（GitHub `Jackson888kuo/sigellabs-camp-registration#12`，2026-05-01 開立，由 Claude Code 修補）。
