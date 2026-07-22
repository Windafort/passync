import type { Entry, ExportFormat, ExportResult, Provider } from '../types/entry'

function escapeCSVField(value: string | undefined | null): string {
  if (!value) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"'
  }
  return str
}

function generateCSVLine(fields: string[]): string {
  return fields.map(escapeCSVField).join(',')
}

function exportBitwardenJSON(entries: Entry[]): string {
  const folderMap: Record<string, string> = {}
  const folders: { id: string; name: string }[] = []
  let folderIdx = 0

  entries.forEach((entry) => {
    if (entry.folder && !folderMap[entry.folder]) {
      const hex = folderIdx.toString(16).padStart(12, '0')
      const id = `00000000-0000-4000-8000-${hex}`
      folderMap[entry.folder] = id
      folders.push({ id, name: entry.folder })
      folderIdx++
    }
  })

  const items = entries.map((entry, i) => {
    const hex = i.toString(16).padStart(12, '0')
    return {
      passwordHistory: null,
      id: `11111111-1111-4111-8111-${hex}`,
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
    }
  })

  return JSON.stringify({
    encrypted: false,
    folders,
    items,
  }, null, 2)
}

function exportBitwardenCSV(entries: Entry[]): string {
  const header = 'folder,favorite,type,name,notes,fields,reprompt,login_uri,login_username,login_password,login_totp'
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
  )
  return [header, ...rows].join('\n')
}

function exportChromiumCSV(entries: Entry[]): string {
  const hasNotes = entries.some((e) => e.notes)
  const header = hasNotes ? 'name,url,username,password,note' : 'name,url,username,password'
  const rows = entries.map((entry) => {
    const fields = [
      entry.name || '',
      entry.url || '',
      entry.username || '',
      entry.password || '',
    ]
    if (hasNotes) fields.push(entry.notes || '')
    return generateCSVLine(fields)
  })
  return [header, ...rows].join('\n')
}

function exportFirefoxCSV(entries: Entry[]): string {
  const header = '"url","username","password"'
  const rows = entries.map((entry) =>
    generateCSVLine([entry.url || '', entry.username || '', entry.password || ''])
  )
  return [header, ...rows].join('\n')
}

function exportSafariCSV(entries: Entry[]): string {
  const header = 'Title,URL,Username,Password,Notes,OTPAuth'
  const rows = entries.map((entry) =>
    generateCSVLine([
      entry.name || '',
      entry.url || '',
      entry.username || '',
      entry.password || '',
      entry.notes || '',
      entry.totp || '',
    ])
  )
  return [header, ...rows].join('\n')
}

type ExporterFn = (entries: Entry[], format?: ExportFormat) => ExportResult

const EXPORTERS: Record<string, ExporterFn> = {
  bitwarden: (entries: Entry[], format?: ExportFormat) => {
    if (format === 'json') return { content: exportBitwardenJSON(entries), mimeType: 'application/json', ext: '.json' }
    return { content: exportBitwardenCSV(entries), mimeType: 'text/csv', ext: '.csv' }
  },
  chromium: (entries: Entry[]) => ({ content: exportChromiumCSV(entries), mimeType: 'text/csv', ext: '.csv' }),
  firefox: (entries: Entry[]) => ({ content: exportFirefoxCSV(entries), mimeType: 'text/csv', ext: '.csv' }),
  safari: (entries: Entry[]) => ({ content: exportSafariCSV(entries), mimeType: 'text/csv', ext: '.csv' }),
}

export function exportEntries(
  entries: Entry[],
  provider: Provider,
  format?: ExportFormat
): ExportResult | null {
  const exporter = EXPORTERS[provider]
  if (!exporter) return null
  return exporter(entries, format)
}

export function triggerDownload(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
