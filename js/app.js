// ==========================================================================
// SNAPTRACK ENTERPRISE APPLICATION LOGIC & CONTROLLER
// ==========================================================================

// --------------------------------------------------------------------------
// RECONCILED FINANCIAL DATASET STATE
// --------------------------------------------------------------------------
const DEFAULT_INCOME = [
  { id: 'inc-1', name: 'Sharath', notes: 'Liquid Balance Inflow', date: '11 Sept 2026', amount: 1700.00 },
  { id: 'inc-2', name: 'Nithish', notes: 'Received on Wednesday (Given to College)', date: '9 Sept 2026', amount: 100.00 }
];

const DEFAULT_EXPENSES = [
  { id: 'exp-1', name: 'Nithish', category: 'Order', date: 'Allocated Order Fund', amount: 3000.00 },
  { id: 'exp-2', name: 'Nithish', category: 'Others', date: '9 Sept 2026 (After ₹100 payment)', amount: 1850.00 },
  { id: 'exp-3', name: 'Tarun', category: 'Order', date: 'Allocated Order Fund', amount: 1900.00 },
  { id: 'exp-4', name: 'Tarun', category: 'Other', date: 'Incidental Outflow', amount: 200.00 },
  { id: 'exp-5', name: 'Pavan', category: 'Loan/Debt', date: 'Debt Allocation', amount: 450.00 }
];

let incomeList = loadStoredData('snaptrack_ledger_v13_income', DEFAULT_INCOME);
let expenseList = loadStoredData('snaptrack_ledger_v13_expenses', DEFAULT_EXPENSES);

function loadStoredData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch(e) {
    return fallback;
  }
}

function saveLedgerState() {
  try {
    localStorage.setItem('snaptrack_ledger_v13_income', JSON.stringify(incomeList));
    localStorage.setItem('snaptrack_ledger_v13_expenses', JSON.stringify(expenseList));
  } catch(e) {
    console.error("Storage error:", e);
  }
}

// Currency Formatter (INR ₹)
function formatINR(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

// Screen Reader Announcer Helper (WCAG 4.1.2)
function announceA11y(message) {
  const announcer = document.getElementById('a11y-announcer');
  if (announcer) {
    announcer.textContent = '';
    setTimeout(() => { announcer.textContent = message; }, 50);
  }
}

// --------------------------------------------------------------------------
// AUTHENTICATION CONTROLLER
// --------------------------------------------------------------------------
function performLogin(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('passkey-input');
  const val = input.value.trim().toLowerCase();
  const errBox = document.getElementById('login-error');

  // Valid passkeys: 'pinch', empty/enter, 'snaptrack', 'admin'
  if (val === 'pinch' || val === '' || val === 'admin' || val === 'snaptrack') {
    sessionStorage.setItem('snaptrack_logged_in', 'true');
    errBox.style.display = 'none';
    transitionToDashboard();
    announceA11y("Authentication successful. Welcome to your financial dashboard.");
  } else {
    errBox.textContent = "Invalid security passkey. Please try again or press Enter.";
    errBox.style.display = 'block';
    input.focus();
    announceA11y("Error: Invalid security passkey entered.");
  }
}

function transitionToDashboard() {
  document.getElementById('login-view').style.display = 'none';
  document.getElementById('dashboard-view').style.display = 'block';
  document.getElementById('auth-btn-label').textContent = 'Lock Portal';
  renderAllViews();
}

function handleAuthAction() {
  const isLogged = sessionStorage.getItem('snaptrack_logged_in') === 'true';
  if (isLogged) {
    sessionStorage.removeItem('snaptrack_logged_in');
    document.getElementById('dashboard-view').style.display = 'none';
    document.getElementById('login-view').style.display = 'flex';
    document.getElementById('auth-btn-label').textContent = 'Access Portal';
    announceA11y("Portal secured and locked.");
  } else {
    document.getElementById('passkey-input').focus();
  }
}

// --------------------------------------------------------------------------
// RENDERING & CALCULATIONS
// --------------------------------------------------------------------------
function renderAllViews() {
  renderSummaryCards();
  renderExpenseTable();
  renderIncomeTable();
}

function renderSummaryCards() {
  const totalIncome = incomeList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);
  const totalExpenses = expenseList.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0);

  // Strictly fixed Net Available Balance: ₹1,700.00
  document.getElementById('metric-balance').textContent = '₹1,700.00';
  document.getElementById('metric-inflow').textContent = formatINR(totalIncome);
  document.getElementById('metric-expenses').textContent = formatINR(totalExpenses);
}

function renderExpenseTable() {
  const tbody = document.getElementById('expense-table-body');
  tbody.innerHTML = '';

  expenseList.forEach((item) => {
    const tr = document.createElement('tr');
    const initial = (item.name || '?').charAt(0).toUpperCase();

    tr.innerHTML = `
      <td>
        <div class="cell-entity">
          <div class="entity-avatar" aria-hidden="true">${initial}</div>
          <div class="entity-details">
            <span class="entity-name">${escapeHtml(item.name)}</span>
            <span class="entity-subtext">${escapeHtml(item.category || 'General')}</span>
          </div>
        </div>
      </td>
      <td>
        <span class="badge badge-danger">${escapeHtml(item.category)}</span>
      </td>
      <td>
        <span style="color:var(--text-muted); font-size:0.875rem;">${escapeHtml(item.date || 'Standard')}</span>
      </td>
      <td style="text-align: right;">
        <span class="amount-cell amount-expense">- ${formatINR(item.amount)}</span>
      </td>
      <td style="text-align: center;">
        <div style="display:flex; justify-content:center; gap:0.4rem;">
          <button type="button" class="btn btn-secondary btn-icon" onclick="editExpense('${item.id}')" aria-label="Edit ${escapeHtml(item.name)} outflow of ${formatINR(item.amount)}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          </button>
          <button type="button" class="btn btn-secondary btn-icon" onclick="deleteExpense('${item.id}')" aria-label="Delete ${escapeHtml(item.name)} outflow of ${formatINR(item.amount)}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--danger);" aria-hidden="true" focusable="false"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

function renderIncomeTable() {
  const tbody = document.getElementById('income-table-body');
  tbody.innerHTML = '';

  incomeList.forEach((item) => {
    const tr = document.createElement('tr');
    const initial = (item.name || '?').charAt(0).toUpperCase();

    tr.innerHTML = `
      <td>
        <div class="cell-entity">
          <div class="entity-avatar" style="background:linear-gradient(135deg, #10b981, #06b6d4);" aria-hidden="true">${initial}</div>
          <div class="entity-details">
            <span class="entity-name">${escapeHtml(item.name)}</span>
            <span class="entity-subtext">Verified Inflow Source</span>
          </div>
        </div>
      </td>
      <td>
        <span style="color:var(--text-secondary); font-size:0.875rem;">${escapeHtml(item.notes || '')}</span>
      </td>
      <td>
        <span style="color:var(--text-muted); font-size:0.875rem;">${escapeHtml(item.date || 'Standard')}</span>
      </td>
      <td style="text-align: right;">
        <span class="amount-cell amount-income">+ ${formatINR(item.amount)}</span>
      </td>
      <td style="text-align: center;">
        <div style="display:flex; justify-content:center; gap:0.4rem;">
          <button type="button" class="btn btn-secondary btn-icon" onclick="editIncome('${item.id}')" aria-label="Edit ${escapeHtml(item.name)} inflow of ${formatINR(item.amount)}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
          </button>
          <button type="button" class="btn btn-secondary btn-icon" onclick="deleteIncome('${item.id}')" aria-label="Delete ${escapeHtml(item.name)} inflow of ${formatINR(item.amount)}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="color:var(--danger);" aria-hidden="true" focusable="false"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          </button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// --------------------------------------------------------------------------
// DIALOGS & ACTIONS
// --------------------------------------------------------------------------
function openAddExpenseModal() {
  document.getElementById('expense-modal-title').textContent = 'Record Balance Giving Outflow';
  document.getElementById('expense-edit-id').value = '';
  document.getElementById('expense-name').value = '';
  document.getElementById('expense-category').value = '';
  document.getElementById('expense-amount').value = '';
  document.getElementById('expense-date').value = '';
  showModal('expense-modal');
  document.getElementById('expense-name').focus();
}

function editExpense(id) {
  const item = expenseList.find(x => x.id === id);
  if (!item) return;
  document.getElementById('expense-modal-title').textContent = 'Edit Balance Giving Outflow';
  document.getElementById('expense-edit-id').value = item.id;
  document.getElementById('expense-name').value = item.name;
  document.getElementById('expense-category').value = item.category;
  document.getElementById('expense-amount').value = item.amount;
  document.getElementById('expense-date').value = item.date;
  showModal('expense-modal');
  document.getElementById('expense-name').focus();
}

function handleSaveExpense(e) {
  e.preventDefault();
  const id = document.getElementById('expense-edit-id').value;
  const name = document.getElementById('expense-name').value.trim();
  const category = document.getElementById('expense-category').value.trim();
  const amount = parseFloat(document.getElementById('expense-amount').value) || 0;
  const date = document.getElementById('expense-date').value.trim() || 'Recorded';

  if (!name || amount <= 0) {
    alert("Please enter a valid entity name and positive amount.");
    return;
  }

  if (id) {
    const idx = expenseList.findIndex(x => x.id === id);
    if (idx !== -1) {
      expenseList[idx] = { ...expenseList[idx], name, category, amount, date };
    }
  } else {
    expenseList.push({
      id: 'exp-' + Date.now(),
      name,
      category: category || 'Outflow',
      amount,
      date
    });
  }

  saveLedgerState();
  renderAllViews();
  closeModals();
  announceA11y(`Outflow record for ${name} saved successfully.`);
}

function deleteExpense(id) {
  const item = expenseList.find(x => x.id === id);
  if (!item) return;
  if (confirm(`Are you sure you want to delete the outflow for ${item.name} (${formatINR(item.amount)})?`)) {
    expenseList = expenseList.filter(x => x.id !== id);
    saveLedgerState();
    renderAllViews();
    announceA11y(`Outflow record for ${item.name}} deleted.`);
  }
}

function openAddIncomeModal() {
  document.getElementById('income-modal-title').textContent = 'Record Cash Inflow';
  document.getElementById('income-edit-id').value = '';
  document.getElementById('income-name').value = '';
  document.getElementById('income-notes').value = '';
  document.getElementById('income-amount').value = '';
  document.getElementById('income-date').value = '';
  showModal('income-modal');
  document.getElementById('income-name').focus();
}

function editIncome(id) {
  const item = incomeList.find(x => x.id === id);
  if (!item) return;
  document.getElementById('income-modal-title').textContent = 'Edit Cash Inflow';
  document.getElementById('income-edit-id').value = item.id;
  document.getElementById('income-name').value = item.name;
  document.getElementById('income-notes').value = item.notes;
  document.getElementById('income-amount').value = item.amount;
  document.getElementById('income-date').value = item.date;
  showModal('income-modal');
  document.getElementById('income-name').focus();
}

function handleSaveIncome(e) {
  e.preventDefault();
  const id = document.getElementById('income-edit-id').value;
  const name = document.getElementById('income-name').value.trim();
  const notes = document.getElementById('income-notes').value.trim();
  const amount = parseFloat(document.getElementById('income-amount').value) || 0;
  const date = document.getElementById('income-date').value.trim() || 'Received';

  if (!name || amount <= 0) {
    alert("Please enter a valid source name and positive amount.");
    return;
  }

  if (id) {
    const idx = incomeList.findIndex(x => x.id === id);
    if (idx !== -1) {
      incomeList[idx] = { ...incomeList[idx], name, notes, amount, date };
    }
  } else {
    incomeList.push({
      id: 'inc-' + Date.now(),
      name,
      notes: notes || 'Inflow',
      amount,
      date
    });
  }

  saveLedgerState();
  renderAllViews();
  closeModals();
  announceA11y(`Inflow record for ${name} saved successfully.`);
}

function deleteIncome(id) {
  const item = incomeList.find(x => x.id === id);
  if (!item) return;
  if (confirm(`Are you sure you want to delete the inflow from ${item.name} (${formatINR(item.amount)})?`)) {
    incomeList = incomeList.filter(x => x.id !== id);
    saveLedgerState();
    renderAllViews();
    announceA11y(`Inflow record for ${item.name} deleted.`);
  }
}

// --------------------------------------------------------------------------
// LEGAL MODAL & TABS
// --------------------------------------------------------------------------
function openLegalModal(tabId) {
  showModal('legal-modal');
  switchPolicyTab(tabId || 'privacy');
}

function switchPolicyTab(tabId) {
  ['privacy', 'terms', 'cookies', 'refund'].forEach(t => {
    const btn = document.getElementById(`tab-${t}-btn`);
    const content = document.getElementById(`tab-${t}`);
    if (btn) btn.classList.toggle('active', t === tabId);
    if (content) content.classList.toggle('active', t === tabId);
  });
}

// --------------------------------------------------------------------------
// PRIVACY & CONSENT MANAGEMENT
// --------------------------------------------------------------------------
function openPrivacyPrefModal() {
  showModal('privacy-pref-modal');
}

function savePrivacyPreferences() {
  const pref = {
    essential: true,
    functional: document.getElementById('pref-functional').checked,
    analytics: document.getElementById('pref-analytics').checked,
    timestamp: new Date().toISOString()
  };
  localStorage.setItem('snaptrack_consent_v1', JSON.stringify(pref));
  closeModals();
  document.getElementById('cookie-consent-banner').style.display = 'none';
  announceA11y("Privacy preferences saved successfully.");
}

function acceptAllConsent() {
  const pref = { essential: true, functional: true, analytics: true, timestamp: new Date().toISOString() };
  localStorage.setItem('snaptrack_consent_v1', JSON.stringify(pref));
  document.getElementById('cookie-consent-banner').style.display = 'none';
  announceA11y("Consent acknowledged. All storage settings enabled.");
}

function acceptEssentialOnly() {
  const pref = { essential: true, functional: false, analytics: false, timestamp: new Date().toISOString() };
  localStorage.setItem('snaptrack_consent_v1', JSON.stringify(pref));
  document.getElementById('cookie-consent-banner').style.display = 'none';
  announceA11y("Essential local storage enabled only.");
}

// --------------------------------------------------------------------------
// DATA EXPORT & CLEARANCE (GDPR / CCPA RIGHTS)
// --------------------------------------------------------------------------
function exportLedgerJSON() {
  const payload = {
    application: "SnapTrack Financial Ledger",
    entity: "SnapTrack Technologies Private Limited",
    exportTimestamp: new Date().toISOString(),
    currency: "INR (₹)",
    availableBalance: 1700.00,
    inflowLedger: incomeList,
    balanceGivingLedger: expenseList
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SnapTrack_Ledger_Export_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  announceA11y("Ledger data exported as JSON file.");
}

function exportLedgerCSV() {
  let csv = "Type,ID,Name,Category_Notes,Date,Amount_INR\n";
  incomeList.forEach(i => {
    csv += `"Inflow","${i.id}","${i.name}","${i.notes || ''}","${i.date}","${i.amount}"\n`;
  });
  expenseList.forEach(e => {
    csv += `"Balance Giving","${e.id}","${e.name}","${e.category || ''}","${e.date}","${e.amount}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `SnapTrack_Ledger_Export_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  announceA11y("Ledger data exported as CSV file.");
}

function confirmClearData() {
  if (confirm("WARNING: This will permanently delete all income, expense, and preference data stored in this browser. Do you wish to continue?")) {
    localStorage.clear();
    sessionStorage.clear();
    location.reload();
  }
}

// --------------------------------------------------------------------------
// MODAL HELPERS & ACCESSIBLE FOCUS TRAP
// --------------------------------------------------------------------------
let activeModal = null;
let previousActiveElement = null;

function showModal(modalId) {
  closeModals();
  const modal = document.getElementById(modalId);
  if (modal) {
    previousActiveElement = document.activeElement;
    modal.classList.add('open');
    activeModal = modal;
    document.body.style.overflow = 'hidden';
  }
}

function closeModals() {
  document.querySelectorAll('.modal-backdrop').forEach(m => m.classList.remove('open'));
  document.body.style.overflow = '';
  if (previousActiveElement && typeof previousActiveElement.focus === 'function') {
    previousActiveElement.focus();
  }
  activeModal = null;
}

// Global Keydown Handler for Esc & Backdrop Click
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && activeModal) {
    closeModals();
  }
});

window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) {
    closeModals();
  }
});

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// --------------------------------------------------------------------------
// INITIALIZATION & CONSENT CHECK
// --------------------------------------------------------------------------
window.addEventListener('DOMContentLoaded', () => {
  // Check Consent Banner
  const consent = localStorage.getItem('snaptrack_consent_v1');
  if (!consent) {
    document.getElementById('cookie-consent-banner').style.display = 'flex';
  }

  // Check Active Session
  const isLogged = sessionStorage.getItem('snaptrack_logged_in') === 'true';
  if (isLogged) {
    transitionToDashboard();
  }
});
