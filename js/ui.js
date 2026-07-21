import Importer from './import.js';
import Exporter from './export.js';

let data;
let sortColumn = 'name';
let sortDirection = 'asc';
let searchText = '';
let providerFilter = 'all';
let dedupGroups;

export function init(dataModule) {
  data = dataModule;
  setupDarkMode();
  setupFileInput();
  setupTableSort();
  setupSearchFilter();
  setupProviderFilter();
  setupExportDropdown();
  setupModals();
  setupPasswordToggle();
  setupLockScreen();
  setupPageExitWarning();
  updateDropZoneVisibility();
  refresh();
}

export function showLockScreen() {
  document.getElementById('lockOverlay').style.display = 'flex';
  document.getElementById('lockTitle').textContent = 'Vault Locked';
  document.getElementById('lockMessage').textContent = 'Enter your passphrase to unlock your vault.';
  document.getElementById('lockConfirmGroup').style.display = 'none';
  document.getElementById('lockPassword').value = '';
  document.getElementById('lockSubmitBtn').textContent = 'Unlock';
  document.getElementById('lockDiscardBtn').style.display = '';
  document.getElementById('lockDiscardBtn').textContent = 'Start Fresh';
  document.getElementById('lockCloseBtn').style.display = 'none';
  document.getElementById('lockPassword').focus();
}

export function showToast(message, type) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

export function refresh() {
  renderTable();
  updateStats();
}

export function updateDropZoneVisibility() {
  const entries = data.getEntries();
  const dropZone = document.getElementById('dropZone');
  if (entries.length === 0) {
    dropZone.style.display = 'block';
    document.getElementById('mainTableContainer').style.display = 'none';
    document.getElementById('statsBar').style.display = 'none';
    document.getElementById('toolbarRow').style.display = 'none';
    updateToolbarButtons();
  } else {
    dropZone.style.display = 'none';
    document.getElementById('mainTableContainer').style.display = 'block';
    document.getElementById('statsBar').style.display = 'flex';
    document.getElementById('toolbarRow').style.display = 'flex';
    updateToolbarButtons();
  }
}

function updateToolbarButtons() {
  const entries = data.getEntries();
  const count = entries.length;
  const hasEncrypted = data.hasEncryptedData();
  const badge = document.getElementById('vaultStatusBadge');
  const lockBtn = document.getElementById('lockBtn');
  const encryptBtn = document.getElementById('encryptToggleBtn');

  if (count === 0) {
    badge.style.display = 'none';
    lockBtn.style.display = 'none';
    encryptBtn.style.display = 'none';
    return;
  }

  lockBtn.style.display = hasEncrypted ? '' : 'none';

  if (hasEncrypted) {
    badge.style.display = '';
    badge.className = 'status-badge status-saved';
    badge.textContent = `${count} entries \u00b7 Saved`;
    encryptBtn.style.display = '';
    encryptBtn.className = 'header-action-btn btn-decrypt';
    encryptBtn.textContent = '\uD83D\uDD13 Decrypt';
  } else {
    badge.style.display = '';
    badge.className = 'status-badge status-unsaved';
    badge.textContent = `${count} entries \u00b7 Unsaved`;
    encryptBtn.style.display = '';
    encryptBtn.className = 'header-action-btn btn-encrypt';
    encryptBtn.textContent = '\uD83D\uDD12 Encrypt';
  }
}

function setupPageExitWarning() {
  window.addEventListener('beforeunload', (e) => {
    if (data.getEntries().length > 0 && !data.hasEncryptedData()) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
}

function setupDarkMode() {
  const config = data.getConfig();
  const toggle = document.getElementById('darkToggle');
  if (config.darkMode) {
    document.documentElement.classList.add('dark');
    toggle.textContent = '\u2600';
  } else {
    document.documentElement.classList.remove('dark');
    toggle.textContent = '\u263D';
  }
  toggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    toggle.textContent = isDark ? '\u2600' : '\u263D';
    data.saveConfig({ ...data.getConfig(), darkMode: isDark });
  });
}

function setupFileInput() {
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
  });
  fileInput.addEventListener('change', () => {
    handleFiles(fileInput.files);
    fileInput.value = '';
  });
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;

async function handleFiles(fileList) {
  const files = Array.from(fileList);
  let totalImported = 0;
  const errors = [];
  const summaries = [];

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: File too large (max 5MB)`);
      continue;
    }

    try {
      const text = await readFileAsText(file);
      let provider = Importer.detectProvider(file.name, text);

      if (!provider) {
        if (file.name.endsWith('.json')) {
          provider = 'bitwarden';
        } else if (file.name.endsWith('.csv')) {
          provider = promptProvider(file.name);
          if (!provider) {
            errors.push(`${file.name}: Skipped (cannot determine format)`);
            continue;
          }
        } else {
          errors.push(`${file.name}: Unsupported file type (use .csv or .json)`);
          continue;
        }
      }

      const entries = Importer.parseFile(text, file.name, provider);
      if (entries.length === 0) {
        errors.push(`${file.name}: No entries found`);
        continue;
      }

      data.addEntries(entries);
      totalImported += entries.length;
      summaries.push(`${file.name}: ${entries.length} entries (${provider})`);
    } catch (e) {
      errors.push(`${file.name}: ${e.message}`);
    }
  }

  if (summaries.length > 0) showImportSummary(summaries, totalImported);
  errors.forEach((err) => showToast(err, 'error'));
  refresh();
  updateDropZoneVisibility();
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

function promptProvider(fileName) {
  const providers = ['chromium', 'firefox', 'safari', 'bitwarden'];
  const message =
    `Select source for "${fileName}":\n\n` +
    `1. Chrome / Edge / Opera\n` +
    `2. Firefox\n` +
    `3. Safari\n` +
    `4. Bitwarden`;
  const choice = prompt(message, '1');
  if (!choice) return null;
  const idx = parseInt(choice, 10) - 1;
  if (idx >= 0 && idx < providers.length) return providers[idx];
  return null;
}

function showImportSummary(summaries, total) {
  const container = document.getElementById('importSummary');
  const lines = summaries.map((s) => `<div>${escapeHtml(s)}</div>`);
  container.innerHTML = `<strong>Imported ${total} entries total:</strong>${lines.join('')}`;
  container.style.display = 'block';
}

function setupTableSort() {
  document.querySelector('#mainTable thead').addEventListener('click', (e) => {
    const th = e.target.closest('th');
    if (!th || !th.dataset.sort) return;
    const col = th.dataset.sort;
    if (sortColumn === col) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = col;
      sortDirection = 'asc';
    }
    refresh();
  });
}

function setupSearchFilter() {
  document.getElementById('searchInput').addEventListener('input', (e) => {
    searchText = e.target.value;
    refresh();
  });
}

function setupProviderFilter() {
  document.getElementById('providerFilter').addEventListener('change', (e) => {
    providerFilter = e.target.value;
    refresh();
  });
}

function setupExportDropdown() {
  const btn = document.getElementById('exportBtn');
  const menu = document.getElementById('exportMenu');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('show');
  });
  document.addEventListener('click', () => menu.classList.remove('show'));

  menu.addEventListener('click', (e) => {
    const item = e.target.closest('[data-export-provider]');
    if (!item) return;
    menu.classList.remove('show');
    handleExport(item.dataset.exportProvider, item.dataset.exportFormat);
  });
}

function handleExport(provider, format) {
  const entries = data.getEntries();
  if (entries.length === 0) {
    showToast('No entries to export', 'error');
    return;
  }
  const result = Exporter.exportEntries(entries, provider, format);
  if (result) {
    const label = provider === 'chromium' ? 'chrome' : provider;
    const fileName = `passwords_${label}_export${result.ext}`;
    Exporter.triggerDownload(result.content, fileName, result.mimeType);
    showToast(`Exported ${entries.length} entries as ${label} format`, 'success');
  }
}

function setupPasswordToggle() {
  document.getElementById('passToggleBtn').addEventListener('click', () => {
    const input = document.getElementById('editPassword');
    const btn = document.getElementById('passToggleBtn');
    if (input.type === 'password') {
      input.type = 'text';
      btn.textContent = '\uD83D\uDC41\u200D\uD83D\uDDE8';
    } else {
      input.type = 'password';
      btn.textContent = '\uD83D\uDC41';
    }
  });
}

function setupModals() {
  document.getElementById('saveEditBtn').addEventListener('click', handleSave);
  document.getElementById('cancelEditBtn').addEventListener('click', closeModal);
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('editModalOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeDedupModal();
    }
  });

  document.getElementById('dedupBtn').addEventListener('click', () => {
    if (data.getEntries().length === 0) {
      showToast('No entries to deduplicate', 'info');
      return;
    }
    const groups = data.findDuplicateGroups();
    if (groups.length === 0) {
      showToast('No duplicates found', 'info');
      return;
    }
    openDedupModal(groups);
  });

  document.getElementById('clearBtn').addEventListener('click', () => {
    const entries = data.getEntries();
    if (entries.length === 0) {
      showToast('No entries to clear', 'info');
      return;
    }
    const hasEncrypted = data.hasEncryptedData();
    const msg = hasEncrypted
      ? 'Clear all entries and discard the encrypted vault? This cannot be undone.'
      : 'Clear all entries? This cannot be undone.';
    showConfirm(msg, () => {
      data.clearAll();
      if (hasEncrypted) data.removeEncryptedData();
      refresh();
      updateDropZoneVisibility();
      showToast('All entries cleared', 'info');
    });
  });

  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('fileInput').click();
  });

  document.getElementById('encryptToggleBtn').addEventListener('click', () => {
    if (data.hasEncryptedData()) {
      showConfirm('Remove encryption from this vault? Entries stay in memory but will be lost if you reload the page.', () => {
        data.removeEncryptedData();
        updateToolbarButtons();
        showToast('Vault decrypted. Entries remain in memory only.', 'info');
      });
    } else {
      showSaveModal();
    }
  });

  document.getElementById('lockBtn').addEventListener('click', () => {
    data.clearAll();
    refresh();
    showLockScreen();
  });

  document.getElementById('dedupConfirmBtn').addEventListener('click', confirmDedup);
  document.getElementById('dedupCancelBtn').addEventListener('click', closeDedupModal);
  document.getElementById('dedupCloseBtn').addEventListener('click', closeDedupModal);
  document.getElementById('dedupOverlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeDedupModal();
  });
  document.getElementById('dedupList').addEventListener('click', handleDedupSwap);
}

function setupLockScreen() {
  const overlay = document.getElementById('lockOverlay');
  const submitBtn = document.getElementById('lockSubmitBtn');
  const discardBtn = document.getElementById('lockDiscardBtn');
  const closeBtn = document.getElementById('lockCloseBtn');
  const passwordInput = document.getElementById('lockPassword');
  const confirmInput = document.getElementById('lockConfirm');

  submitBtn.addEventListener('click', handleLockSubmit);
  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLockSubmit();
  });
  confirmInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleLockSubmit();
  });
  discardBtn.addEventListener('click', handleLockDiscard);
  closeBtn.addEventListener('click', () => {
    const isSave = document.getElementById('lockTitle').textContent === 'Encrypt Vault';
    if (isSave) closeLockScreen();
  });
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      const isSave = document.getElementById('lockTitle').textContent === 'Encrypt Vault';
      if (isSave) closeLockScreen();
    }
  });
}

async function handleLockSubmit() {
  const isSave = document.getElementById('lockTitle').textContent === 'Encrypt Vault';
  const password = document.getElementById('lockPassword').value;

  if (!password) {
    showToast('Passphrase is required', 'error');
    return;
  }

  if (isSave) {
    const confirm = document.getElementById('lockConfirm').value;
    if (password !== confirm) {
      showToast('Passphrases do not match', 'error');
      return;
    }
    try {
      await data.saveEncrypted(password);
      closeLockScreen();
      updateToolbarButtons();
      showToast('Vault encrypted and saved', 'success');
    } catch (e) {
      console.error('Encryption failed:', e);
      showToast('Encryption failed: ' + (e.message || 'unknown error'), 'error');
    }
  } else {
    try {
      const ok = await data.loadEncrypted(password);
      if (!ok) {
        showToast('Wrong passphrase', 'error');
        document.getElementById('lockPassword').value = '';
        document.getElementById('lockPassword').focus();
        return;
      }
      closeLockScreen();
      refresh();
      updateDropZoneVisibility();
      showToast('Vault unlocked', 'success');
    } catch (e) {
      console.error('Decryption failed:', e);
      showToast('Decryption failed: ' + (e.message || 'unknown error'), 'error');
    }
  }
}

function handleLockDiscard() {
  const isSave = document.getElementById('lockTitle').textContent === 'Encrypt Vault';
  if (isSave) {
    closeLockScreen();
    return;
  }
  showConfirm('Discard the encrypted vault? All saved data will be permanently lost.', () => {
    data.removeEncryptedData();
    data.clearAll();
    closeLockScreen();
    updateDropZoneVisibility();
    refresh();
    showToast('Encrypted vault discarded', 'info');
  });
}

function closeLockScreen() {
  document.getElementById('lockOverlay').style.display = 'none';
}

function showSaveModal() {
  document.getElementById('lockOverlay').style.display = 'flex';
  document.getElementById('lockTitle').textContent = 'Encrypt Vault';
  document.getElementById('lockMessage').textContent =
    'Set a passphrase to encrypt your vault. You will need it every time you open the app.';
  document.getElementById('lockConfirmGroup').style.display = '';
  document.getElementById('lockPassword').value = '';
  document.getElementById('lockConfirm').value = '';
  document.getElementById('lockSubmitBtn').textContent = 'Save & Encrypt';
  document.getElementById('lockDiscardBtn').style.display = '';
  document.getElementById('lockDiscardBtn').textContent = 'Cancel';
  document.getElementById('lockCloseBtn').style.display = '';
  document.getElementById('lockPassword').focus();
}

function handleSave() {
  const id = document.getElementById('editId').value;
  const changes = {
    provider: document.getElementById('editProvider').value,
    folder: document.getElementById('editFolder').value,
    name: document.getElementById('editName').value,
    url: document.getElementById('editUrl').value,
    username: document.getElementById('editUsername').value,
    password: document.getElementById('editPassword').value,
    notes: document.getElementById('editNotes').value,
    totp: document.getElementById('editTotp').value,
  };
  data.updateEntry(id, changes);
  closeModal();
  showToast('Entry updated', 'success');
  refresh();
}

function closeModal() {
  document.getElementById('editModalOverlay').style.display = 'none';
}

function openEditModal(entryId) {
  const entry = data.getEntry(entryId);
  if (!entry) return;

  document.getElementById('editId').value = entry.id;
  document.getElementById('editProvider').value = entry.provider;
  document.getElementById('editFolder').value = entry.folder || '';
  document.getElementById('editName').value = entry.name || '';
  document.getElementById('editUrl').value = entry.url || '';
  document.getElementById('editUsername').value = entry.username || '';
  document.getElementById('editPassword').value = entry.password || '';
  document.getElementById('editPassword').type = 'password';
  document.getElementById('passToggleBtn').textContent = '\uD83D\uDC41';
  document.getElementById('editNotes').value = entry.notes || '';
  document.getElementById('editTotp').value = entry.totp || '';

  document.getElementById('editModalOverlay').style.display = 'flex';
}

function openDedupModal(groups) {
  dedupGroups = groups;
  const overlay = document.getElementById('dedupOverlay');
  const list = document.getElementById('dedupList');
  const count = document.getElementById('dedupCount');

  count.textContent = groups.length;
  let html = '';
  let totalToRemove = 0;
  groups.forEach((g, gi) => {
    totalToRemove += g.remove.length;
    html += renderDedupCard(g, gi);
  });
  list.innerHTML = html;
  document.getElementById('dedupTotalRemove').textContent = totalToRemove;
  overlay.style.display = 'flex';
}

function renderDedupCard(g, gi) {
  const names = g.remove.map((r, ri) =>
    `<div class="dedup-remove-name" data-group-index="${gi}" data-remove-index="${ri}">${escapeHtml(r.name || '(no name)')}</div>`
  ).join('');
  return `<div class="dedup-group" id="dedupGroup${gi}">
    <div class="dedup-group-header">URL: ${escapeHtml(g.keep.url || g.keep.name)} \u00b7 Username: ${escapeHtml(g.keep.username)}</div>
    <div class="dedup-grid">
      <div class="dedup-keep">
        <span class="dedup-label">Keep</span>
        <div class="dedup-name">${escapeHtml(g.keep.name || '(no name)')}</div>
      </div>
      <div class="dedup-remove">
        <span class="dedup-label">Remove (${g.remove.length})</span>
        ${names}
      </div>
    </div></div>`;
}

function handleDedupSwap(e) {
  const nameEl = e.target.closest('.dedup-remove-name');
  if (!nameEl) return;
  const gi = parseInt(nameEl.dataset.groupIndex, 10);
  const ri = parseInt(nameEl.dataset.removeIndex, 10);
  const group = dedupGroups[gi];

  const swapped = group.keep;
  group.keep = group.remove[ri];
  group.remove[ri] = swapped;

  const card = document.getElementById(`dedupGroup${gi}`);
  card.outerHTML = renderDedupCard(group, gi);

  let totalToRemove = 0;
  dedupGroups.forEach((g) => { totalToRemove += g.remove.length; });
  document.getElementById('dedupTotalRemove').textContent = totalToRemove;
}

function closeDedupModal() {
  dedupGroups = null;
  document.getElementById('dedupOverlay').style.display = 'none';
}

function confirmDedup() {
  if (!dedupGroups) return;
  const idsToRemove = [];
  dedupGroups.forEach((g) => {
    g.remove.forEach((r) => idsToRemove.push(r.id));
  });
  const removed = data.deleteEntries(idsToRemove);
  dedupGroups = null;
  closeDedupModal();
  showToast(`Removed ${removed} duplicate entries`, 'success');
  refresh();
}

function getFilteredEntries() {
  let results = data.getEntries();

  if (providerFilter !== 'all') {
    results = results.filter((e) => e.provider === providerFilter);
  }

  if (searchText) {
    const lower = searchText.toLowerCase();
    results = results.filter(
      (e) =>
        (e.name || '').toLowerCase().includes(lower) ||
        (e.url || '').toLowerCase().includes(lower) ||
        (e.username || '').toLowerCase().includes(lower) ||
        (e.notes || '').toLowerCase().includes(lower) ||
        (e.folder || '').toLowerCase().includes(lower)
    );
  }

  results.sort((a, b) => {
    const aVal = ((a[sortColumn] || '') + '').toLowerCase();
    const bVal = ((b[sortColumn] || '') + '').toLowerCase();
    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  return results;
}

function updateStats() {
  const entries = data.getEntries();
  const filtered = getFilteredEntries();
  document.getElementById('totalCount').textContent = filtered.length;
  document.getElementById('allCount').textContent = entries.length;

  const providers = {};
  entries.forEach((e) => {
    providers[e.provider] = (providers[e.provider] || 0) + 1;
  });
  const provText = Object.entries(providers)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
  document.getElementById('providerBreakdown').textContent = provText || 'none';
}

function renderTable() {
  const tbody = document.querySelector('#mainTable tbody');
  const entries = getFilteredEntries();

  const columns = [
    { key: 'provider', label: 'Provider' },
    { key: 'folder', label: 'Folder' },
    { key: 'name', label: 'Name' },
    { key: 'url', label: 'URL' },
    { key: 'username', label: 'Username' },
    { key: 'password', label: 'Password' },
    { key: 'notes', label: 'Notes' },
  ];

  updateTableHeader(columns);

  if (entries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${columns.length + 1}" class="empty-state">
      <div class="empty-icon">\uD83D\uDD10</div>
      <h3>No passwords yet</h3>
      <p>Drag and drop your exported password files or click to browse.</p>
    </td></tr>`;
    return;
  }

  tbody.innerHTML = entries
    .map(
      (entry) => `
    <tr>
      <td><span class="provider-tag provider-${entry.provider}">${entry.provider}</span></td>
      <td>${escapeHtml(entry.folder || '')}</td>
      <td>${escapeHtml(entry.name)}</td>
      <td>${escapeHtml(entry.url)}</td>
      <td>${escapeHtml(entry.username)}</td>
      <td>
        <div class="password-cell">
          <span class="password-masked">${'\u2022'.repeat(Math.min(12, (entry.password || '').length))}</span>
        </div>
      </td>
      <td>${escapeHtml(entry.notes || '')}</td>
      <td>
        <div class="actions-cell">
          <button class="btn-icon icon-btn copy-btn" data-id="${entry.id}" title="Copy password">\uD83D\uDCCB</button>
          <button class="btn-icon icon-btn edit-btn" data-id="${entry.id}" title="Edit">\u270F\uFE0F</button>
          <button class="btn-icon icon-btn delete-btn" data-id="${entry.id}" title="Delete">\uD83D\uDDD1\uFE0F</button>
        </div>
      </td>
    </tr>`
    )
    .join('');

  tbody.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', handleCopy);
  });
  tbody.querySelectorAll('.edit-btn').forEach((btn) => {
    btn.addEventListener('click', handleEdit);
  });
  tbody.querySelectorAll('.delete-btn').forEach((btn) => {
    btn.addEventListener('click', handleDelete);
  });
}

function updateTableHeader(columns) {
  const thead = document.querySelector('#mainTable thead');
  const sortArrows = columns.map((col) => {
    let arrow = '';
    if (sortColumn === col.key) {
      arrow = `<span class="sort-arrow active">${sortDirection === 'asc' ? '\u25B2' : '\u25BC'}</span>`;
    } else {
      arrow = '<span class="sort-arrow">\u25B2</span>';
    }
    return `<th data-sort="${col.key}">${col.label}${arrow}</th>`;
  });
  thead.innerHTML = `<tr>${sortArrows.join('')}<th>Actions</th></tr>`;
}

function handleCopy(e) {
  const id = e.target.closest('button').dataset.id;
  const entry = data.getEntry(id);
  if (!entry) return;
  navigator.clipboard.writeText(entry.password).then(
    () => showToast('Password copied to clipboard', 'success'),
    () => showToast('Failed to copy password', 'error')
  );
}

function handleEdit(e) {
  const id = e.target.closest('button').dataset.id;
  openEditModal(id);
}

function handleDelete(e) {
  const id = e.target.closest('button').dataset.id;
  const entry = data.getEntry(id);
  if (!entry) return;
  showConfirm(`Delete "${entry.name}"? This cannot be undone.`, () => {
    data.deleteEntry(id);
    refresh();
    updateDropZoneVisibility();
    showToast('Entry deleted', 'info');
  });
}

function showConfirm(message, onConfirm) {
  const overlay = document.getElementById('confirmOverlay');
  const msgEl = document.getElementById('confirmMessage');
  const confirmBtn = document.getElementById('confirmYes');
  const cancelBtn = document.getElementById('confirmNo');

  msgEl.textContent = message;
  overlay.style.display = 'flex';

  function handleYes() {
    cleanup();
    onConfirm();
  }

  function handleNo() {
    cleanup();
  }

  function cleanup() {
    overlay.style.display = 'none';
    confirmBtn.removeEventListener('click', handleYes);
    cancelBtn.removeEventListener('click', handleNo);
  }

  confirmBtn.addEventListener('click', handleYes);
  cancelBtn.addEventListener('click', handleNo);
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
