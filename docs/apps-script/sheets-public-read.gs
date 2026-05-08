/**
 * docs/apps-script/sheets-public-read.gs
 *
 * 提供自建報名表單讀取活動設定表的公開端點。
 * 部署為 Web App，執行身分：我（Jackson）；存取權限：任何人。
 *
 * GET /exec → JSON 含當期營隊清單（過濾過期梯次）
 *
 * 回傳格式：
 * {
 *   "success": true,
 *   "data": [{ "camp_name": "...", "batch": "...", "early_bird_end": "..." }, ...],
 *   "count": N,
 *   "timestamp": "ISO 8601"
 * }
 *
 * 部署後，把 Web App URL 填入 docs/forms/form.js 的 APPS_SCRIPT_URL 常數。
 */

const SHEETS_ID   = '1dZUNmS28HAuXLBPJchaB84xLlRAXuHeMIFxnIm__738';
const SHEET_NAME  = '活動設定表';

// 過濾規則：早鳥截止日距今超過 N 天 → 該梯次已結束、不顯示
const PAST_GRACE_PERIOD_DAYS = 30;

// 必要欄位關鍵字（以 includes() 做部分比對，容忍欄位名稱含括弧說明）
const REQUIRED_KEYWORDS = ['營隊名稱', '早鳥截止日'];

// 找出 headers 中第一個包含 keyword 的欄位 index（-1 表示找不到）
function _findCol(headers, keyword) {
  return headers.findIndex(function(h) { return h.includes(keyword); });
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.openById(SHEETS_ID);
    const sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      return _jsonResponse({ success: false, error: 'Sheet "' + SHEET_NAME + '" not found' });
    }

    const data    = sheet.getDataRange().getValues();
    if (data.length < 2) {
      return _jsonResponse({ success: true, data: [], count: 0, timestamp: new Date().toISOString() });
    }

    const headers = data[0].map(String);

    // Schema 驗證：確認必要欄位存在（部分比對）
    const missing = REQUIRED_KEYWORDS.filter(function(kw) { return _findCol(headers, kw) === -1; });
    if (missing.length > 0) {
      return _jsonResponse({ success: false, error: 'Missing headers containing: ' + missing.join(', ') });
    }

    // 找出各欄位的 index
    const campNameIdx  = _findCol(headers, '營隊名稱');
    const batchIdx     = _findCol(headers, '梯次');
    const earlyBirdIdx = _findCol(headers, '早鳥截止日');

    // 過濾過期梯次
    const today  = new Date();
    today.setHours(0, 0, 0, 0);
    const cutoff = new Date(today);
    cutoff.setDate(cutoff.getDate() - PAST_GRACE_PERIOD_DAYS);

    const filtered = data.slice(1).filter(function(row) {
      const val = row[earlyBirdIdx];
      if (!val) return true;               // 無截止日 → 永遠顯示
      const d = new Date(val);
      if (isNaN(d.getTime())) return true; // 格式異常 → 顯示（讓 Issue #3 fail-safe 處理）
      return d >= cutoff;
    });

    // 只回前端需要的欄位，不外洩單價 / 付款連結等敏感資訊
    const publicData = filtered.map(function(row) {
      return {
        camp_name:      String(row[campNameIdx]  ?? '').trim(),
        batch:          batchIdx >= 0 ? String(row[batchIdx] ?? '').trim() : '',
        early_bird_end: String(row[earlyBirdIdx] ?? '').trim(),
      };
    }).filter(function(r) { return r.camp_name !== ''; }); // 跳過空行

    return _jsonResponse({
      success:   true,
      data:      publicData,
      count:     publicData.length,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    return _jsonResponse({ success: false, error: err.toString() });
  }
}

function _jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
