import { encrypt, decrypt } from './crypto.js';

let entries = [];
const STORAGE_KEY = 'vault_encrypted';
const CONFIG_KEY = 'vault_config';

function generateId() {
  return crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function normalizeKey(entry) {
  const url = (entry.url || '').replace(/\/+$/, '').trim().toLowerCase();
  const username = (entry.username || '').trim();
  const password = (entry.password || '').trim();
  return `${url}::${username}::${password}`;
}

function getEntries() {
  return entries;
}

function getEntry(id) {
  return entries.find((e) => e.id === id);
}

function setEntries(newEntries) {
  entries = newEntries;
}

function addEntries(newEntries) {
  newEntries.forEach((entry) => {
    entries.push({
      id: generateId(),
      provider: entry.provider || 'chromium',
      folder: entry.folder || '',
      name: entry.name || '',
      url: entry.url || '',
      username: entry.username || '',
      password: entry.password || '',
      notes: entry.notes || '',
      totp: entry.totp || '',
    });
  });
}

function updateEntry(id, changes) {
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  const allowed = ['provider', 'folder', 'name', 'url', 'username', 'password', 'notes', 'totp'];
  allowed.forEach((key) => {
    if (changes[key] !== undefined) {
      entries[idx][key] = changes[key];
    }
  });
  return true;
}

function deleteEntry(id) {
  const len = entries.length;
  entries = entries.filter((e) => e.id !== id);
  return entries.length !== len;
}

function deleteEntries(ids) {
  const idSet = new Set(ids);
  const before = entries.length;
  entries = entries.filter((e) => !idSet.has(e.id));
  return before - entries.length;
}

function clearAll() {
  entries = [];
}

function removeDuplicates() {
  const seen = new Set();
  const unique = [];
  let removed = 0;
  entries.forEach((e) => {
    const key = normalizeKey(e);
    if (seen.has(key)) {
      removed++;
    } else {
      seen.add(key);
      unique.push(e);
    }
  });
  entries = unique;
  return removed;
}

function findDuplicateGroups() {
  const groups = new Map();
  entries.forEach((e) => {
    const key = normalizeKey(e);
    if (!groups.has(key)) {
      groups.set(key, { keep: e, remove: [] });
    } else {
      groups.get(key).remove.push(e);
    }
  });
  const result = [];
  for (const [, group] of groups) {
    if (group.remove.length > 0) result.push(group);
  }
  return result;
}

function hasEncryptedData() {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

function removeEncryptedData() {
  localStorage.removeItem(STORAGE_KEY);
}

async function saveEncrypted(passphrase) {
  const json = JSON.stringify(entries);
  const blob = await encrypt(json, passphrase);
  localStorage.setItem(STORAGE_KEY, blob);
}

async function loadEncrypted(passphrase) {
  const blob = localStorage.getItem(STORAGE_KEY);
  if (!blob) return false;
  const json = await decrypt(blob, passphrase);
  if (json === null) return false;
  entries = JSON.parse(json);
  return true;
}

function getConfig() {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    return raw ? JSON.parse(raw) : { darkMode: false };
  } catch {
    return { darkMode: false };
  }
}

function saveConfig(config) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {
    /* ignore */
  }
}

export default {
  getEntries,
  getEntry,
  setEntries,
  addEntries,
  updateEntry,
  deleteEntry,
  deleteEntries,
  clearAll,
  removeDuplicates,
  findDuplicateGroups,
  hasEncryptedData,
  removeEncryptedData,
  saveEncrypted,
  loadEncrypted,
  getConfig,
  saveConfig,
};
