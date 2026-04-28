/**
 * Issue #5 — 報名追蹤表 A 欄「提交時間」一次性 backfill
 *
 * 用途：將既有 ISO 8601 UTC 字串（例 "2026-04-28T01:45:30.375Z"）
 *      轉為 Asia/Taipei 時區、格式 "YYYY-MM-DD HH:mm:ss"
 *
 * 部署位置：Google Sheets「報名追蹤表」→ Extensions → Apps Script
 * Spreadsheet ID: 1FGksYo2ghgeDLuH4VhwyT8wQM7QDBer7ieuQbjcFNqY
 *
 * 注意：
 * 1) 執行前請先將 A 欄全選 → 格式 → 數字 → 純文字（避免自動解析回 Date）
 * 2) 建議先暫停 Make scenario，避免執行期間新列寫入造成資料混淆
 * 3) 程式具備冪等性：已是新格式的列會跳過，重複執行安全
 *
 * 維護：
 * - 2026-04-28 初版（Jackson + Claude）
 */

function backfillTimezone() {
  const SHEET_NAME = '工作表1';
  const COL = 1;          // A 欄
  const TZ = 'Asia/Taipei';
  const FMT = 'yyyy-MM-dd HH:mm:ss';

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('找不到工作表：' + SHEET_NAME);

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) {
    Logger.log('沒有資料列可處理');
    return;
  }

  const range = sheet.getRange(2, COL, lastRow - 1, 1);
  const values = range.getValues();

  let converted = 0, skipped = 0, errors = 0;
  const errorRows = [];

  for (let i = 0; i < values.length; i++) {
    const raw = values[i][0];
    if (raw === '' || raw === null || raw === undefined) {
      skipped++;
      continue;
    }
    const s = String(raw).trim();

    // 已是目標格式 → 跳過（冪等檢查）
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) {
      skipped++;
      continue;
    }

    // 嘗試解析 ISO 8601（含 Z 或無）
    const d = new Date(s);
    if (isNaN(d.getTime())) {
      errors++;
      errorRows.push(i + 2);  // 1-based sheet row
      continue;
    }

    values[i][0] = Utilities.formatDate(d, TZ, FMT);
    converted++;
  }

  range.setValues(values);

  const msg = 'Backfill 完成\n'
            + '轉換: ' + converted + ' 列\n'
            + '已是新格式（跳過）: ' + skipped + ' 列\n'
            + '解析失敗: ' + errors + ' 列'
            + (errors ? '（列號：' + errorRows.join(',') + '）' : '');

  Logger.log(msg);
  try {
    SpreadsheetApp.getUi().alert(msg);
  } catch (e) {
    // 無 UI 環境（trigger 執行）忽略
  }
}
