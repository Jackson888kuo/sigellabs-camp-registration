/**
 * Issue #5 — 報名追蹤表時區/顯示格式修復 (v4 最終版)
 *
 * 部署位置：Google Sheets「報名追蹤表」→ Extensions → Apps Script
 * Spreadsheet ID: 1FGksYo2ghgeDLuH4VhwyT8wQM7QDBer7ieuQbjcFNqY
 *
 * v4 演進策略：
 * 1) 試算表時區設為 Asia/Taipei
 * 2) A 欄與 H 欄採「整欄」級別 setNumberFormat（A:A、H:H）— 而非僅 row range
 *    這是關鍵差異：整欄級別會作為欄位預設，Make INSERT_ROWS 新插入列會繼承
 * 3) 額外保險：對現有資料範圍再套一次
 *
 * 注意：搭配 Make Module 13 必須改用 formatDate(1.createdAt; "YYYY-MM-DD HH:mm:ss"; "Asia/Taipei")
 *      否則 Make 寫入 ISO 8601 含毫秒+Z 字串會被 Sheets 視為純文字（cell format 無效）
 *
 * 演進紀錄：
 * - v1: setValues 寫入字串 → 被 USER_ENTERED 解析回 Date
 * - v2: 試 apostrophe 前綴 → setValues 不識別
 * - v3.1: 改 setNumberFormat 控制顯示 → Make INSERT_ROWS 後新列遺漏
 * - v4: 整欄 getRange('A:A') / getRange('H:H') → 最終解決
 *
 * 維護：
 * - 2026-04-28 v4 完成（Jackson + Claude）
 */

function applyDateFormat() {
  const SHEET_NAME = '工作表1';
  const FMT = 'yyyy-mm-dd hh:mm:ss';
  const TZ = 'Asia/Taipei';

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('找不到工作表：' + SHEET_NAME);

  // 1) 確認試算表時區
  const oldTz = ss.getSpreadsheetTimeZone();
  if (oldTz !== TZ) {
    ss.setSpreadsheetTimeZone(TZ);
  }

  // 2) 對「整欄」A 與 H 套用日期時間格式
  //    整欄級別才能讓 Make INSERT_ROWS 新插入列繼承格式
  sheet.getRange('A:A').setNumberFormat(FMT);
  sheet.getRange('H:H').setNumberFormat(FMT);

  // 3) 額外保險：對現有資料範圍再套一次
  const lastRow = sheet.getLastRow();
  if (lastRow >= 2) {
    sheet.getRange(2, 1, lastRow - 1, 1).setNumberFormat(FMT);
    sheet.getRange(2, 8, lastRow - 1, 1).setNumberFormat(FMT);
  }

  const msg = '格式套用完成 (v4)\n'
            + '時區: ' + TZ + '\n'
            + '套用範圍: A:A & H:H (整欄)\n'
            + '當前資料列數: ' + (lastRow - 1);

  Logger.log(msg);
  try {
    SpreadsheetApp.getUi().alert(msg);
  } catch (e) {
    // 無 UI 環境忽略
  }
}
