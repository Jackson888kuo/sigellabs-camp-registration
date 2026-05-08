'use strict';

// ── Config ───────────────────────────────────────────────────────────────────
// Fill these in after Phase 3 (Apps Script deploy) and Phase 4 (webhook switch)
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzZUagiiaOJFDdESWNqR7E6b_BuZ0kFR5BE5nLy74RUDz67jQzA5gH874pcg8RTYD-7pA/exec'; // Apps Script Web App URL
const WEBHOOK_URL     = 'https://hook.us2.make.com/pr7f73pkg7rm2dmwrw7eff3n4w6wqrvl'; // Make webhook URL

// ── Payload helpers ──────────────────────────────────────────────────────────
function randomHex(len) {
  const bytes = new Uint8Array(Math.ceil(len / 2));
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, len);
}

function newKey() {
  return `question_${randomHex(12)}`;
}

function nowIso() {
  return new Date().toISOString().replace(/(\.\d{3})\d*Z$/, '$1Z');
}

// Build Tally-compatible JSON payload.
// Field order in fields[] MUST match generate_mock_payload.py TALLY_BASE_FIELDS_ORDER:
//   [0] 家長姓名  [1] 電話  [2] Email ← M4 SendGrid positional access  [3] 孩子姓名
//   [4] 孩子姓名（英文）  [5] 您這次要報名幾個營隊？  [6] 團報人數
//   [7+] CHECKBOXES (one per selected camp, value "true")
function buildPayload({ parentName, phone, email, childName, childNameEn, groupSize, selectedCamps }) {
  const timestamp = nowIso();

  const baseFields = [
    { key: newKey(), label: '家長姓名',                type: 'INPUT_TEXT',         value: parentName },
    { key: newKey(), label: '電話',                    type: 'INPUT_PHONE_NUMBER', value: phone },
    { key: newKey(), label: 'Email',                   type: 'INPUT_EMAIL',        value: email },
    { key: newKey(), label: '孩子姓名',                type: 'INPUT_TEXT',         value: childName },
    { key: newKey(), label: '孩子姓名（英文）',        type: 'INPUT_TEXT',         value: childNameEn },
    { key: newKey(), label: '您這次要報名幾個營隊？',  type: 'MULTIPLE_CHOICE',    value: String(selectedCamps.length) },
    { key: newKey(), label: '團報人數',                type: 'MULTIPLE_CHOICE',    value: groupSize },
  ];

  // One CHECKBOXES field per selected camp.
  // label format: "孩子要報名哪些營隊？ (CAMP_NAME)" — the "？ (" prefix with a half-width space
  // after ？ is required; Make M8 strips this prefix with replace() to get the camp name.
  const campFields = selectedCamps.map(campName => ({
    key: newKey(),
    label: `孩子要報名哪些營隊？ (${campName})`,
    type: 'CHECKBOXES',
    value: 'true',
  }));

  return {
    eventId:   `evt_${randomHex(16)}`,
    eventType: 'FORM_RESPONSE',
    createdAt: timestamp,
    data: {
      responseId:   `resp_${randomHex(8)}`,
      submissionId: `resp_${randomHex(8)}`,
      respondentId: `respondent_${randomHex(8)}`,
      formId:   'self-hosted-form-v1',
      formName: '太陽實驗室團報報名',
      createdAt: timestamp,
      fields: [...baseFields, ...campFields],
    },
  };
}

// ── Load camps from Apps Script ──────────────────────────────────────────────
async function loadCamps() {
  const list    = document.getElementById('camp-list');
  const loading = document.getElementById('camp-loading');

  try {
    const res  = await fetch(APPS_SCRIPT_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Apps Script 回應異常');

    loading.style.display = 'none';

    if (!json.data || json.data.length === 0) {
      list.innerHTML = '<p class="camp-message">目前沒有開放報名的營隊，請稍後再查看。</p>';
      return;
    }

    json.data.forEach(camp => {
      const item  = document.createElement('label');
      item.className = 'camp-item';

      const cb    = document.createElement('input');
      cb.type     = 'checkbox';
      cb.name     = 'camp';
      cb.value    = camp.camp_name;

      const mark  = document.createElement('span');
      mark.className = 'checkmark';

      const text  = document.createElement('span');
      text.className = 'camp-label';
      text.textContent = camp.camp_name;

      item.append(cb, mark, text);

      if (camp.batch) {
        const batch = document.createElement('span');
        batch.className  = 'camp-batch';
        batch.textContent = camp.batch;
        item.appendChild(batch);
      }

      list.appendChild(item);
    });
  } catch (err) {
    loading.style.display = 'none';
    list.innerHTML = '<p class="camp-message camp-message--error">無法載入營隊資料，請重新整理頁面或聯繫 hello@sigellabs.com。</p>';
    console.error('loadCamps:', err);
  }
}

// ── Validation ───────────────────────────────────────────────────────────────
function getSelectedCamps() {
  return [...document.querySelectorAll('input[name="camp"]:checked')].map(cb => cb.value);
}

function getGroupSize(form) {
  return form.querySelector('input[name="groupSize"]:checked')?.value ?? '';
}

function validate(form) {
  const errors = [];

  // honeypot：人類填表不會碰到這個欄位；有值 → 機器人送出
  if (form.website?.value)
    return [{ field: 'submit', msg: '系統偵測到異常提交，請重新整理頁面再試。' }];

  if (!form.parentName.value.trim())
    errors.push({ field: 'parentName', msg: '請填寫家長姓名' });

  const email = form.email.value.trim();
  if (!email)
    errors.push({ field: 'email', msg: '請填寫 Email' });
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    errors.push({ field: 'email', msg: 'Email 格式不正確' });

  const phone = form.phone.value.trim();
  if (!phone)
    errors.push({ field: 'phone', msg: '請填寫電話' });
  else if (!/^[+\d\s\-()]{7,20}$/.test(phone))
    errors.push({ field: 'phone', msg: '電話格式不正確（例：0912-345-678 或 +886-912-345-678）' });

  if (!form.childName.value.trim())
    errors.push({ field: 'childName', msg: '請填寫孩子姓名' });

  if (getSelectedCamps().length === 0)
    errors.push({ field: 'camps', msg: '請至少勾選一個營隊' });

  if (!getGroupSize(form))
    errors.push({ field: 'groupSize', msg: '請選擇團報人數' });

  return errors;
}

// ── Submit ───────────────────────────────────────────────────────────────────
async function handleSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const btn  = document.getElementById('submit-btn');

  document.querySelectorAll('.field-error').forEach(el => (el.textContent = ''));
  document.querySelectorAll('.field-group').forEach(el => el.classList.remove('has-error'));

  const errors = validate(form);
  if (errors.length > 0) {
    errors.forEach(({ field, msg }) => {
      const errEl = document.getElementById(`err-${field}`);
      if (errEl) {
        errEl.textContent = msg;
        errEl.closest?.('.field-group')?.classList.add('has-error');
      }
    });
    // 找到第一個錯誤欄位 → focus + scrollIntoView（手機鍵盤遮住時仍能看到）
    const firstError = form.querySelector('.has-error');
    if (firstError) {
      const input = firstError.querySelector('input, textarea');
      if (input) {
        input.focus();
      } else {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    return;
  }

  btn.disabled    = true;
  btn.textContent = '送出中…';
  btn.classList.add('submit-btn--loading');
  form.setAttribute('aria-busy', 'true');

  const payload = buildPayload({
    parentName:  form.parentName.value.trim(),
    phone:       form.phone.value.trim(),
    email:       form.email.value.trim(),
    childName:   form.childName.value.trim(),
    childNameEn: (form.childNameEn?.value ?? '').trim(),
    groupSize:   getGroupSize(form),
    selectedCamps: getSelectedCamps(),
  });

  try {
    const res = await fetch(WEBHOOK_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    document.getElementById('form-view').style.display    = 'none';
    document.getElementById('success-view').style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    const errEl = document.getElementById('err-submit');
    if (errEl) errEl.textContent = '系統暫時忙碌，請稍後再試或聯繫 hello@sigellabs.com';
    btn.disabled    = false;
    btn.textContent = '送出報名';
    btn.classList.remove('submit-btn--loading');
    form.setAttribute('aria-busy', 'false');
    console.error('handleSubmit:', err);
  }
}

// ── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadCamps();
  document.getElementById('registration-form').addEventListener('submit', handleSubmit);
});
