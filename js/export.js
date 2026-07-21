function escapeCSVField(value) {
  if (!value) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function generateCSVLine(fields) {
  return fields.map(escapeCSVField).join(',');
}

function exportBitwardenJSON(entries) {
  const folderMap = {};
  const folders = [];
  let folderIdx = 0;

  entries.forEach((entry) => {
    if (entry.folder && !folderMap[entry.folder]) {
      folderMap[entry.folder] = generateFolderId(folderIdx++);
      folders.push({
        id: folderMap[entry.folder],
        name: entry.folder,
      });
    }
  });

  const items = entries.map((entry, i) => ({
    passwordHistory: null,
    id: generateItemId(i),
    organizationId: null,
    folderId: entry.folder ? folderMap[entry.folder] : null,
    type: 1,
    reprompt: 0,
    name: entry.name,
    notes: entry.notes || null,
    favorite: false,
    fields: [],
    login: {
      uris: entry.url ? [{ match: null, uri: entry.url }] : [],
      username: entry.username || null,
      password: entry.password || null,
      totp: entry.totp || null,
    },
    collectionIds: null,
  }));

  return JSON.stringify({
    encrypted: false,
    folders,
    items,
  }, null, 2);
}

function exportBitwardenCSV(entries) {
  const header = 'folder,favorite,type,name,notes,fields,reprompt,login_uri,login_username,login_password,login_totp';
  const rows = entries.map((entry) =>
    generateCSVLine([
      entry.folder || '',
      '',
      'login',
      entry.name || '',
      entry.notes || '',
      '',
      '0',
      entry.url || '',
      entry.username || '',
      entry.password || '',
      entry.totp || '',
    ])
  );
  return [header, ...rows].join('\n');
}

function exportChromiumCSV(entries) {
  const hasNotes = entries.some((e) => e.notes);
  const header = hasNotes ? 'name,url,username,password,note' : 'name,url,username,password';
  const rows = entries.map((entry) => {
    const fields = [
      entry.name || '',
      entry.url || '',
      entry.username || '',
      entry.password || '',
    ];
    if (hasNotes) fields.push(entry.notes || '');
    return generateCSVLine(fields);
  });
  return [header, ...rows].join('\n');
}

function exportFirefoxCSV(entries) {
  const header = '"url","username","password"';
  const rows = entries.map((entry) =>
    generateCSVLine([entry.url || '', entry.username || '', entry.password || ''])
  );
  return [header, ...rows].join('\n');
}

function exportSafariCSV(entries) {
  const header = 'Title,URL,Username,Password,Notes,OTPAuth';
  const rows = entries.map((entry) =>
    generateCSVLine([
      entry.name || '',
      entry.url || '',
      entry.username || '',
      entry.password || '',
      entry.notes || '',
      entry.totp || '',
    ])
  );
  return [header, ...rows].join('\n');
}

function generateFolderId(idx) {
  const hex = idx.toString(16).padStart(12, '0');
  return `00000000-0000-4000-8000-${hex}`;
}

function generateItemId(idx) {
  const hex = idx.toString(16).padStart(12, '0');
  return `11111111-1111-4111-8111-${hex}`;
}

const EXPORTERS = {
  bitwarden: (entries, format) => {
    if (format === 'json') return { content: exportBitwardenJSON(entries), mimeType: 'application/json', ext: '.json' };
    return { content: exportBitwardenCSV(entries), mimeType: 'text/csv', ext: '.csv' };
  },
  chromium: (entries) => ({ content: exportChromiumCSV(entries), mimeType: 'text/csv', ext: '.csv' }),
  firefox: (entries) => ({ content: exportFirefoxCSV(entries), mimeType: 'text/csv', ext: '.csv' }),
  safari: (entries) => ({ content: exportSafariCSV(entries), mimeType: 'text/csv', ext: '.csv' }),
};

function exportEntries(entries, provider, format) {
  const exporter = EXPORTERS[provider];
  if (!exporter) return null;
  return exporter(entries, format);
}

function triggerDownload(content, fileName, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default {
  exportEntries,
  triggerDownload,
};
