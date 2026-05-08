#!/usr/bin/env python3
"""
Phase 0 Payload 相容性驗證 — 自建表單 Mock 生成器

用途
----
模擬未來自建報名表單（docs/forms/）會送出的 JSON payload，
讓 Make scenario 4596472（v12）的 Module 1-28 完全不需改動就能正常處理。

對齊 invariant（依 Issue #9 spec §3.4）
----------------------------------------
- 頂層 `createdAt`            （Sheets A 欄需要、5/7 smoke test 漏帶導致空白）
- `data.fields[]` 順序        （M4 SendGrid 用 positional `1.data.fields[2].value` 取 Email）
- label 字串完全一致           （`家長姓名` / `Email` / `電話` / `孩子姓名` — 不加括號後綴）
- CHECKBOXES label 含括號      （`孩子要報名哪些營隊？ (XXX)` — `？` 後有半形空格）
- value 勾選時為非空字串、未勾選為 null

執行
----
    python3 generate_mock_payload.py --camps STEAM_TEST_NORMAL_FUTURE STEAM_TEST_NORMAL_PAST \\
        --parent "Phase0家長" --email jacksonkuo@gmail.com --output dual_camp_clean.json

預設情境（無參數）
------------------
產出 3 個檔：single_camp.json / dual_camp.json / triple_camp.json
分別觸發 13 / 21 / 29 ops，皆使用合法 ISO 日期、無 alert。
"""

from __future__ import annotations

import argparse
import json
import sys
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path


# Tally 表單欄位順序（與真實 production webhook 對齊）
# fields[0] 家長姓名 / fields[1] 電話 / fields[2] Email / fields[3] 孩子姓名 ...
# ⚠️ Email 必須在 index 2 — M4 SendGrid mapper 用 positional `1.data.fields[2].value`
TALLY_BASE_FIELDS_ORDER = [
    ("家長姓名", "INPUT_TEXT", "INPUT_TEXT"),
    ("電話", "INPUT_PHONE_NUMBER", "INPUT_PHONE_NUMBER"),
    ("Email", "INPUT_EMAIL", "INPUT_EMAIL"),
    ("孩子姓名", "INPUT_TEXT", "INPUT_TEXT"),
    ("孩子姓名（英文）", "INPUT_TEXT", "INPUT_TEXT"),
    ("您這次要報名幾個營隊？", "MULTIPLE_CHOICE", "MULTIPLE_CHOICE"),
    ("團報人數", "MULTIPLE_CHOICE", "MULTIPLE_CHOICE"),
]

# ⚠️ CHECKBOXES label 模板：「孩子要報名哪些營隊？ ([XXX])」`？` 後有半形空格
CHECKBOX_LABEL_TEMPLATE = "孩子要報名哪些營隊？ ([{camp}])"


def _new_question_key() -> str:
    """模擬 Tally 的 question_<uuid> key 格式。"""
    return f"question_{uuid.uuid4().hex[:12]}"


def _now_iso() -> str:
    """回傳 ISO 8601 timestamp（含毫秒、Z 結尾），對齊 Tally 格式。"""
    now = datetime.now(timezone.utc)
    return now.strftime("%Y-%m-%dT%H:%M:%S.") + f"{now.microsecond // 1000:03d}Z"


def build_payload(
    *,
    parent_name: str,
    parent_phone: str,
    parent_email: str,
    child_name: str,
    child_name_en: str,
    group_size: str,
    camps: list[str],
    response_id: str | None = None,
    form_id: str = "self-hosted-form-v1",
    form_name: str = "[STAGING] 太陽實驗室團報報名（自建表單）",
) -> dict:
    """
    產出符合 Tally schema 的 mock JSON payload。

    Parameters
    ----------
    camps : list[str]
        要勾選的營隊名稱列表（如 ["STEAM_TEST_NORMAL_FUTURE", "STEAM_TEST_NORMAL_PAST"]）。
        會自動產生對應的 CHECKBOXES fields。

    Returns
    -------
    dict
        完整 mock payload。可用 json.dumps(...) 寫檔或當 curl body。
    """
    if not camps:
        raise ValueError("至少要勾選 1 個營隊（不然 Make Iterator 會跑空）")

    timestamp = _now_iso()
    response_id = response_id or f"phase0-resp-{uuid.uuid4().hex[:8]}"

    # 基本欄位（依 TALLY_BASE_FIELDS_ORDER 順序）
    base_values = {
        "家長姓名": parent_name,
        "電話": parent_phone,
        "Email": parent_email,
        "孩子姓名": child_name,
        "孩子姓名（英文）": child_name_en,
        "您這次要報名幾個營隊？": str(len(camps)),
        "團報人數": group_size,
    }
    fields = [
        {
            "key": _new_question_key(),
            "label": label,
            "type": ftype,
            "value": base_values[label],
        }
        for label, ftype, _ in TALLY_BASE_FIELDS_ORDER
    ]

    # 每個勾選的營隊各別一個 CHECKBOXES field
    for camp in camps:
        fields.append({
            "key": _new_question_key(),
            "label": CHECKBOX_LABEL_TEMPLATE.format(camp=camp),
            "type": "CHECKBOXES",
            "value": "true",  # 真值（Make 5→8 edge filter 用 `if(5.value; ...)` 做 truthy 檢查）
        })

    payload = {
        "eventId": f"evt_{uuid.uuid4().hex[:16]}",
        "eventType": "FORM_RESPONSE",
        "createdAt": timestamp,  # ⚠️ 頂層必須有 — Sheets A 欄依此 (5/7 smoke test 漏帶)
        "data": {
            "responseId": response_id,
            "submissionId": response_id,
            "respondentId": f"phase0-respondent-{uuid.uuid4().hex[:8]}",
            "formId": form_id,
            "formName": form_name,
            "createdAt": timestamp,  # data 內也保留一份（與真實 Tally 一致）
            "fields": fields,
        },
    }
    return payload


def expected_ops(num_camps: int) -> int:
    """ops 公式：`5 + N × 8`（v12 post-Issue-3，無 alert）"""
    return 5 + num_camps * 8


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--camps", nargs="+", help="要勾選的營隊名稱列表（與 Sheets A 欄一致）")
    parser.add_argument("--parent", default="Phase0家長", help="家長姓名")
    parser.add_argument("--phone", default="+886912000099", help="電話")
    parser.add_argument("--email", default="jacksonkuo@gmail.com", help="Email（M4 SendGrid 收件人）")
    parser.add_argument("--child", default="Phase0Child", help="孩子姓名")
    parser.add_argument("--child-en", default="Phase0Child", help="孩子姓名（英文）")
    parser.add_argument("--group-size", default="3", choices=["3", "8"], help="團報人數")
    parser.add_argument("--output", default="-", help="輸出檔案（- 為 stdout）")
    parser.add_argument("--all-presets", action="store_true", help="產出 single/dual/triple 三個預設情境檔")
    args = parser.parse_args()

    if args.all_presets:
        outdir = Path(__file__).parent
        presets = [
            ("phase0_single_camp.json", ["STEAM_TEST_NORMAL_FUTURE"], 13),
            ("phase0_dual_camp.json",   ["STEAM_TEST_NORMAL_FUTURE", "STEAM_TEST_NORMAL_PAST"], 21),
            ("phase0_triple_camp.json", ["STEAM_TEST_NORMAL_FUTURE", "STEAM_TEST_NORMAL_PAST", "STEAM_TEST_NORMAL_FUTURE"], 29),
        ]
        for filename, camps, expected in presets:
            payload = build_payload(
                parent_name=f"Phase0_{len(camps)}camp_家長",
                parent_phone=args.phone,
                parent_email=args.email,
                child_name=f"Phase0_{len(camps)}camp_Child",
                child_name_en=f"Phase0_{len(camps)}camp_Child",
                group_size=args.group_size,
                camps=camps,
            )
            outpath = outdir / filename
            outpath.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
            print(f"✅ {filename} — {len(camps)} 營隊、預期 {expected} ops", file=sys.stderr)
        return

    if not args.camps:
        parser.error("--camps 必填（或使用 --all-presets 一次產出三個預設情境）")

    payload = build_payload(
        parent_name=args.parent,
        parent_phone=args.phone,
        parent_email=args.email,
        child_name=args.child,
        child_name_en=args.child_en,
        group_size=args.group_size,
        camps=args.camps,
    )
    body = json.dumps(payload, ensure_ascii=False, indent=2)

    if args.output == "-":
        print(body)
    else:
        Path(args.output).write_text(body, encoding="utf-8")
        print(f"✅ 寫入 {args.output} — {len(args.camps)} 營隊、預期 {expected_ops(len(args.camps))} ops", file=sys.stderr)


if __name__ == "__main__":
    main()
