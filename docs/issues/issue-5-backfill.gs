/**
 * Issue #5 — 報名追蹤表「提交時間」/「付款時間」時區與顯示格式修復 (v3.1)
 *
 * 部署位置：Google Sheets「報名追蹤表」→ Extensions → Apps Script
 * Spreadsheet ID: 1FGksYo2ghgeDLuH4VhwyT8wQM7QDBer7ieuQbjcFNqY
 *
 * 設計策略（v3.1 最終版）：
 * 不修改儲存格底層 Date 物件，改用「儲存格數字格式」控制顯示為 yyyy-mm-dd hh:mm:ss
 * - 優點：
 *   1) Date 物件保留可排序、可計算（DATEDIF 等）的特性
 *   2) Apps Script setValues 強制 USER_ENTERED 行為會把日期字串解析回 Date，
 *      與其對抗，不如順勢用 Date + 格式
 *   3) Make 寫入無論為 ISO 字串或 formatDate 字串，都會自動以正確時區/格式顯示
 *   4) 套用一次永久生效（包含未來新進資料列）
 *
 * 演進紀錄：
 * - v1: setValues 寫入 yyyy-MM-dd HH:mm:ss 字串 → 被 Sheets 解析回 Date
 * - v2: 嘗試用 apostrophe (') 前綴強制純文字 → setValues 不識別 apostrophe，仍解析為 Date
 * - v3: 改用 setNumberFormat 控制顯示，不動 Date 物件 → 成功
 * - v3.1: 修正付款時間欄位（H 欄第 8 欄，非 I 欄）
 *
 * 維護：
 * - 2026-04-28 v3.1 完成（Jackson + Claude）
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

  const maxRows = sheet.getMaxRows();

  // 2) A 欄（提交時間）整欄套用日期時間格式
  sheet.getRange(2, 1, maxRows - 1, 1).setNumberFormat(FMT);

  // 3) H 欄（付款時間）整欄套用相同格式
  sheet.getRange(2, 8, maxRows - 1, 1).setNumberFormat(FMT);

  const lastRow = sheet.getLastRow();
  const msg = '格式套用完成 (v3.1)\n'
            + '時區: ' + TZ + '\n'
            + '套用範圍: A2:A' + maxRows + ' & H2:H' + maxRows + '\n'
            + '當前資料列數: ' + (lastRow - 1);

  Logger.log(msg);
  try {
    SpreadsheetApp.getUi().alert(msg);
  } catch (e) {
    // 無 UI 環境忽略
  }
}
