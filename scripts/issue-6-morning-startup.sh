#!/usr/bin/env bash
#
# Issue #6 v2 — 5/1 早晨一鍵啟動腳本
#
# 用途：依序執行 4/30 PM Cowork 未完事項，5 分鐘完成所有「主操作前置條件」
#   1. 移除 stale .git/index.lock（4/30 AM Cowork session 留下）
#   2. git add + commit 4/30 PM 產出三檔（precheck/operation card/troubleshooting）
#   3. git push origin main
#   4. 執行 issue-6-precheck.sh（snapshot 匯出 + scenario 狀態驗證）
#
# 使用：
#   cd ~/Documents/Claude/Projects/太陽實驗室團報流程改進/github-repo/
#   bash scripts/issue-6-morning-startup.sh
#
set -uo pipefail   # 注意：不用 -e，每步驟都需自決定是否繼續

REPO_DIR="${HOME}/Documents/Claude/Projects/太陽實驗室團報流程改進/github-repo"
cd "${REPO_DIR}" || { echo "❌ 找不到 repo 目錄：${REPO_DIR}"; exit 1; }

echo "========================================================="
echo "  Issue #6 v2 — 5/1 早晨啟動腳本"
echo "  時間：$(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================================="
echo

# ============================================================
# Step 1: 移除 stale locks（涵蓋所有 .git 內常見 lock 檔）
# ============================================================
echo "--- Step 1: 移除 stale .git locks（若存在） ---"

# 收集所有可能的 lock 檔（深度限制 3 層，避開 objects/pack 內部）
LOCK_FILES=$(find .git -maxdepth 3 -name "*.lock" -type f 2>/dev/null)
if [[ -z "${LOCK_FILES}" ]]; then
    echo "  ✅ 無 stale lock"
else
    echo "  發現 lock 檔："
    NOW=$(date +%s)
    SAFE_TO_REMOVE=true
    for lock in ${LOCK_FILES}; do
        LOCK_TIME=$(stat -f "%m" "${lock}" 2>/dev/null || stat -c "%Y" "${lock}" 2>/dev/null)
        AGE=$((NOW - LOCK_TIME))
        echo "    - ${lock} (${AGE}秒前)"
        if (( AGE < 600 )); then
            SAFE_TO_REMOVE=false
            echo "      ⚠️  此 lock 不到 10 分鐘，可能有 git 程序在跑"
        fi
    done

    if [[ "${SAFE_TO_REMOVE}" == "true" ]]; then
        for lock in ${LOCK_FILES}; do
            rm -f "${lock}"
        done
        echo "  ✅ 全部 ${LOCK_FILES//[^ ]/}$(echo "${LOCK_FILES}" | wc -l | tr -d ' ') 個 lock 已移除"
    else
        echo "  → 請確認 ps aux | grep git 後手動處理；或等 10 分鐘後重跑"
        exit 1
    fi
fi
echo

# ============================================================
# Step 2: Git add + commit 三個新檔
# ============================================================
echo "--- Step 2: git add + commit 4/30 PM Cowork 產出 ---"

git add scripts/issue-6-precheck.sh \
        scripts/issue-6-morning-startup.sh \
        docs/issues/issue-6-v2-morning-operation-card.md \
        docs/issues/issue-6-v2-token-drag-troubleshooting.md 2>&1

# 確認有變更要 commit
if git diff --cached --quiet; then
    echo "  ⚠️  無新內容要 commit（可能已 commit 過）"
else
    git commit -m "docs(issue-6): add v2 morning operation card + token drag troubleshooting + precheck script (refs #6)

Generated 2026-04-30 PM Cowork (00:22-01:00) while Jackson rested after 4/29 v1 spec failure recovery.

- scripts/issue-6-precheck.sh: 30-second pre-check (snapshot + Module 5 IML verify + Filter check + 4 ref paths)
- scripts/issue-6-morning-startup.sh: one-shot morning startup (lock removal + commit + push + precheck)
- docs/issues/issue-6-v2-morning-operation-card.md: 8-section step-by-step card with 20+ verification checkboxes
- docs/issues/issue-6-v2-token-drag-troubleshooting.md: 5 failure symptoms + token color recognition + rollback decision tree

Discovered during 4/29 snapshot analysis: Module 11 dealname uses ASCII ' x ' (not '× ' as spec §3.3 stated). Spec needs update."
    if [[ $? -eq 0 ]]; then
        COMMIT_HASH=$(git log -1 --format="%h")
        echo "  ✅ Commit ${COMMIT_HASH} 完成"
    else
        echo "  ❌ Commit 失敗 — 看上方錯誤訊息"
        exit 2
    fi
fi
echo

# ============================================================
# Step 3: Git push
# ============================================================
echo "--- Step 3: git push origin main ---"
if git push origin main 2>&1; then
    echo "  ✅ Push 完成"
else
    echo "  ❌ Push 失敗 — 檢查網路或 GitHub credentials"
    echo "  → 操作卡 + precheck 仍可使用，繼續 Step 4"
fi
echo

# ============================================================
# Step 4: 跑 precheck
# ============================================================
echo "--- Step 4: 執行 issue-6-precheck.sh ---"
if [[ ! -f scripts/issue-6-precheck.sh ]]; then
    echo "  ❌ 找不到 scripts/issue-6-precheck.sh"
    exit 3
fi

if [[ ! -f "${HOME}/.config/make/token" ]]; then
    echo "  ⚠️  找不到 ~/.config/make/token"
    echo "  → 4/30 PM Cowork 已存過。若您換電腦，請重新："
    echo "      echo 'YOUR_TOKEN' > ~/.config/make/token && chmod 600 ~/.config/make/token"
    exit 4
fi

bash scripts/issue-6-precheck.sh
PRECHECK_EXIT=$?
echo

if [[ ${PRECHECK_EXIT} -eq 0 ]]; then
    echo "========================================================="
    echo "  🎯 早晨啟動完成 — 可開始操作"
    echo
    echo "  下一步："
    echo "  1. 開 Make Editor: https://us2.make.com/2085532/scenarios/4596472/edit"
    echo "  2. 開操作卡: docs/issues/issue-6-v2-morning-operation-card.md"
    echo "  3. 從操作卡 §1 Step 1 開始"
    echo
    echo "  預估時間：30 分鐘（Step 1-4）+ 15 分鐘（T1 測試）"
    echo "========================================================="
else
    echo "========================================================="
    echo "  ⚠️  Precheck 未過（exit ${PRECHECK_EXIT}）— 看上方訊息"
    echo "  常見處理："
    echo "    exit 2 (Module 5 IML 不符) → Make Versions Restore 4/28 23:19"
    echo "    exit 3 (Filter 已存在)     → Make Editor 移除 5→8 連線 Filter"
    echo "  排除後重跑：bash scripts/issue-6-precheck.sh"
    echo "========================================================="
fi
