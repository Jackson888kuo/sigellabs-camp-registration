#!/usr/bin/env bash
#
# Issue #6 v2 預檢腳本（4/30 PM Cowork 產出，供 5/1 早上執行）
#
# 用途：在 Jackson Mac 一鍵完成 §5.1 預檢清單項目 #2、#3、#4
#   #2  匯出當前 blueprint 為 v2attempt.json snapshot 備份
#   #3  確認 Module 5 Array IML = v6 production key-based 長公式
#   #4  確認 Module 5 → Module 8 連線無 Filter
#
# 使用：在 ~/Documents/Claude/Projects/太陽實驗室團報流程改進/github-repo/ 下執行：
#   bash scripts/issue-6-precheck.sh
#
# 前置：~/.config/make/token 已存有有效 Make API token（4/30 PM 已產生 claude-cowork-issue6）
#
set -euo pipefail

# === 設定 ===
SCENARIO_ID="4596472"
TEAM_ID="2085532"
API_BASE="https://us2.make.com/api/v2"
TOKEN_FILE="${HOME}/.config/make/token"
SNAPSHOT_PATH="docs/snapshots/blueprint_v6_pre_issue6_v2attempt.json"
EXPECTED_M5_IML='{{map(get(map(1.data.fields; "options"; "key"; "question_bkOj1Z"); 1); "text"; "id"; get(get(map(1.data.fields; "value"; "key"; "question_bkOj1Z"); 1); 1))}}'

# === 檢查前置條件 ===
echo "=== Issue #6 v2 預檢開始 ==="
echo

if [[ ! -f "${TOKEN_FILE}" ]]; then
    echo "❌ Token 檔案不存在：${TOKEN_FILE}"
    echo "   請先執行：echo 'YOUR_TOKEN' > ~/.config/make/token && chmod 600 ~/.config/make/token"
    exit 1
fi
TOKEN=$(cat "${TOKEN_FILE}")
echo "✅ Token 已載入"

if [[ ! -d "docs/snapshots" ]]; then
    echo "❌ 目前不在 repo 根目錄。請 cd 到 github-repo/ 下再執行。"
    exit 1
fi

# === Step 1: 匯出 blueprint snapshot ===
echo
echo "--- §5.1 #2  匯出當前 blueprint snapshot ---"
HTTP_CODE=$(curl -sS -o "${SNAPSHOT_PATH}" -w "%{http_code}" \
    -H "Authorization: Token ${TOKEN}" \
    "${API_BASE}/scenarios/${SCENARIO_ID}/blueprint")
if [[ "${HTTP_CODE}" != "200" ]]; then
    echo "❌ HTTP ${HTTP_CODE} — 匯出失敗"
    cat "${SNAPSHOT_PATH}" | head -20
    exit 1
fi
SIZE=$(wc -c < "${SNAPSHOT_PATH}")
echo "✅ 已存成 ${SNAPSHOT_PATH} (${SIZE} bytes)"

# === Step 2: 解析 Module 5 Array IML ===
echo
echo "--- §5.1 #3  確認 Module 5 Array IML 是 v6 production key-based 長公式 ---"
ACTUAL_M5=$(python3 -c "
import json, sys
with open('${SNAPSHOT_PATH}') as f:
    bp = json.load(f)
# Make API blueprint may be wrapped
flow = bp.get('response', bp).get('blueprint', bp).get('flow', bp.get('flow', []))
m5 = next((m for m in flow if m.get('id') == 5), None)
if m5 is None:
    sys.exit('❌ 找不到 Module 5')
print(m5.get('mapper', {}).get('array', ''))
")

if [[ "${ACTUAL_M5}" == "${EXPECTED_M5_IML}" ]]; then
    echo "✅ Module 5 Array IML 確認 = v6 production key-based 長公式"
    echo "   (4/30 AM Restore 已成功持久化)"
else
    echo "⚠️  Module 5 Array IML 不符預期！"
    echo "   實際："
    echo "   ${ACTUAL_M5}"
    echo
    echo "   預期："
    echo "   ${EXPECTED_M5_IML}"
    echo
    echo "→ 動作建議：開 Make Editor → Versions → Restore 4/28 23:19 → Save，再重跑此腳本"
    exit 2
fi

# === Step 3: 確認 5→8 連線無 Filter ===
echo
echo "--- §5.1 #4  確認 Module 5 → Module 8 連線無 Filter ---"
M8_FILTER=$(python3 -c "
import json
with open('${SNAPSHOT_PATH}') as f:
    bp = json.load(f)
flow = bp.get('response', bp).get('blueprint', bp).get('flow', bp.get('flow', []))
m8 = next((m for m in flow if m.get('id') == 8), None)
print('null' if m8.get('filter') is None else 'has-filter')
")
if [[ "${M8_FILTER}" == "null" ]]; then
    echo "✅ Module 5 → 8 連線無 Filter（乾淨）"
else
    echo "⚠️  Module 5 → 8 連線已有 Filter — 不應出現"
    echo "→ 動作建議：Make Editor 點扳手 → 移除 → Save → 重跑"
    exit 3
fi

# === Step 4: 列出 4 處下游 5.value reference 路徑（供操作卡參考） ===
echo
echo "--- 4 處下游 5.value reference 確認（操作卡用） ---"
python3 << 'PY'
import json
with open('docs/snapshots/blueprint_v6_pre_issue6_v2attempt.json') as f:
    bp = json.load(f)
flow = bp.get('response', bp).get('blueprint', bp).get('flow', bp.get('flow', []))
mods = {m['id']: m for m in flow}

print()
print(f"{'Module':<10} | {'欄位路徑':<35} | 當前值（含 5.value 處）")
print("-" * 100)
# Module 8
m8 = mods[8]
v8 = m8['mapper']['filter'][0][0]['b']
print(f"{'Module 8':<10} | mapper.filter[0][0].b           | {v8}")
# Module 10
m10 = mods[10]
phtml = m10['mapper']['variables'][4]['value']
idx = phtml.find('{{5.value}}')
ctx = phtml[max(0,idx-15):idx+15]
print(f"{'Module 10':<10} | variables[4]=payment_button_html | ...{ctx}...")
# Module 11
m11 = mods[11]
dn = m11['mapper']['properties'][0]['value']
idx = dn.find('{{5.value}}')
ctx = dn[max(0,idx-10):idx+15]
print(f"{'Module 11':<10} | properties[0]=dealname           | ...{ctx}...")
# Module 13
m13 = mods[13]
v13 = m13['mapper']['values'].get('5')
print(f"{'Module 13':<10} | values[\"5\"]                      | {v13}")
print()
print("✅ 4 處下游 ref 路徑與當前值已列印（皆為 v6 production 預期狀態）")
PY

echo
echo "==============================================="
echo "🎯 預檢全部通過 — 可開始 §5.2 主操作"
echo "   下一步：打開 docs/issues/issue-6-v2-morning-operation-card.md 照表執行"
echo "==============================================="
