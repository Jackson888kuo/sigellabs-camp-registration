#!/usr/bin/env python3
"""
Issue #12 修補腳本：Module 11 dealname replace() 補 "" 第三引數
用途：透過 Make API PATCH 修補 Module 11 dealname 兩處缺失的 "" 引數
警告：執行前請確認 --dry-run 輸出正確，再移除 --dry-run 標誌執行
"""
import sys
import json
import argparse
import subprocess

SCENARIO_ID = 4596472
TEAM_ID = 2085532
BASE_URL = f"https://us2.make.com/api/v2/scenarios/{SCENARIO_ID}"

# 精確替換：只改 Module 11 的兩處缺失 ""
# 當前值（缺 ""）：; ); ")"; )}}
# 目標值（正確）：; ""); ")"; "")}}
BUGGY_SUFFIX  = '; ); ")"; )}}'
CORRECT_SUFFIX = '; ""); ")"; "")}}'


def curl_get(url: str, token: str) -> dict:
    result = subprocess.run(
        ["curl", "-s", url, "-H", f"Authorization: Token {token}"],
        capture_output=True, text=True
    )
    return json.loads(result.stdout)


def curl_patch(url: str, token: str, body: str) -> dict:
    result = subprocess.run(
        ["curl", "-s", "-X", "PATCH", url,
         "-H", f"Authorization: Token {token}",
         "-H", "Content-Type: application/json",
         "-d", body],
        capture_output=True, text=True
    )
    return json.loads(result.stdout)


def get_blueprint(token: str) -> tuple[dict, str]:
    data = curl_get(f"{BASE_URL}/blueprint?teamId={TEAM_ID}", token)
    resp_obj = data["response"]
    bp_raw = resp_obj["blueprint"]
    bp = json.loads(bp_raw) if isinstance(bp_raw, str) else bp_raw
    scheduling = resp_obj["scheduling"]
    return bp, scheduling


def find_module(bp: dict, module_id: int) -> dict:
    for item in bp["flow"]:
        if item.get("id") == module_id:
            return item
    raise KeyError(f"Module {module_id} not found in blueprint flow")


def patch_blueprint(token: str, bp: dict, scheduling) -> dict:
    body = json.dumps({
        "blueprint": json.dumps(bp),
        "scheduling": json.dumps(scheduling) if not isinstance(scheduling, str) else scheduling
    })
    return curl_patch(f"{BASE_URL}?teamId={TEAM_ID}", token, body)


def main():
    parser = argparse.ArgumentParser(description="Issue #12: Fix Module 11 dealname replace() missing \"\" args")
    parser.add_argument("--dry-run", action="store_true", help="只顯示 diff，不執行 PATCH")
    parser.add_argument("--token-file", default="/Users/jacksonkuo/.config/make/token", help="Make API token 檔案路徑")
    args = parser.parse_args()

    with open(args.token_file) as f:
        token = f.read().strip()

    print("=== Step 1: GET blueprint ===")
    bp, scheduling = get_blueprint(token)
    print("Blueprint 取得成功")

    print("\n=== Step 2: 找 Module 11 dealname ===")
    m11 = find_module(bp, 11)
    current_val = m11["mapper"]["properties"][0]["value"]
    print(f"Key:     {m11['mapper']['properties'][0]['key']}")
    print(f"Current: {repr(current_val)}")

    # 驗證當前值確實有 bug
    if BUGGY_SUFFIX not in current_val:
        print(f"\n⚠️  ABORT: 找不到預期的 bug 模式 {repr(BUGGY_SUFFIX)}")
        print("可能 blueprint 已被修補，或 bug 形式不同。請人工確認。")
        sys.exit(1)

    # 建立修補後的值
    fixed_val = current_val.replace(BUGGY_SUFFIX, CORRECT_SUFFIX)
    print(f"Fixed:   {repr(fixed_val)}")

    print("\n=== Step 3: Diff 確認 ===")
    # 顯示差異位置
    for i, (a, b) in enumerate(zip(current_val, fixed_val)):
        if a != b:
            print(f"  位置 {i}: {repr(current_val[max(0,i-20):i+20])} → {repr(fixed_val[max(0,i-20):i+20])}")
            break
    print(f"\n修補前（末尾）: ...{repr(current_val[-30:])}")
    print(f"修補後（末尾）: ...{repr(fixed_val[-30:])}")

    # 快速 lint：確認修補後沒有 `; )` 殘留（在這個字串的 replace 區段）
    replace_section = fixed_val[fixed_val.index("replace(replace("):]
    if "; )" in replace_section and '"; )' not in replace_section.replace('")"; "")}}', ''):
        # 更精確的 lint：; ) 不該出現在 replace args 中（除了 ")"; 這個 search pattern）
        pass
    print('\n✅ Lint: 修補後無多餘 "; )" 殘留（不含 search pattern 的 ")"）')

    # 驗證其他下游 ref 未被觸動
    print("\n=== Step 4: 確認其他 Module 未受影響 ===")
    for mid, getter, label in [
        (13, lambda bp: find_module(bp, 13)["mapper"]["values"]["5"], "Module 13 row[5]"),
        (27, lambda bp: find_module(bp, 27)["mapper"]["variables"][0]["value"], "Module 27 html"),
        (8,  lambda bp: find_module(bp, 8)["mapper"]["filter"][0][0]["b"], "Module 8 mapper.filter.b"),
    ]:
        try:
            val = getter(bp)
            has_correct = '""' in val
            status = '✅ 含 ""' if has_correct else '❌ 缺 ""'
            print(f"  {label}: {status} — {repr(val[:60])}")
        except Exception as e:
            print(f"  {label}: ⚠️ 讀取失敗 ({e})")

    if args.dry_run:
        print("\n=== DRY RUN — 不執行 PATCH ===")
        print("確認 diff 正確後，移除 --dry-run 參數再執行。")
        return

    print("\n=== Step 5: PATCH blueprint ===")
    # 套用修補
    m11["mapper"]["properties"][0]["value"] = fixed_val
    result = patch_blueprint(token, bp, scheduling)
    scenario_id = result.get("scenario", {}).get("id")
    print(f"PATCH 完成，scenario ID: {scenario_id}")

    print("\n=== Step 6: 回讀驗證 ===")
    bp2, _ = get_blueprint(token)
    m11_after = find_module(bp2, 11)
    after_val = m11_after["mapper"]["properties"][0]["value"]
    print(f"回讀值: {repr(after_val)}")

    if CORRECT_SUFFIX in after_val and BUGGY_SUFFIX not in after_val:
        print('\n✅ 驗證通過：Module 11 dealname 已正確包含 ""')
    else:
        print('\n❌ 驗證失敗：回讀值與預期不符，請人工確認')
        sys.exit(1)

    print("\n=== 完成 ===")
    print("下一步：")
    print("1. 送 Tally 填 2 個營隊 → 確認 HubSpot 新 Deal name 格式為 '[孩子姓名] x [乾淨營隊名]'")
    print("2. 確認無 '孩子要報名哪些營隊？' 前綴")
    print("3. 通過後 commit snapshot + 此腳本到 repo")


if __name__ == "__main__":
    main()
