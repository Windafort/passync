import type { Entry, Provider } from '../types/entry'

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    const next = text[i + 1]

    if (inQuotes) {
      if (ch === '"') {
        if (next === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else {
      if (ch === '"') {
        inQuotes = true
      } else if (ch === ',') {
        row.push(field.trim())
        field = ''
      } else if (ch === '\n') {
        row.push(field.trim())
        rows.push(row)
        row = []
        field = ''
      } else if (ch === '\r') {
        if (next === '\n') {
          i++
        }
        row.push(field.trim())
        rows.push(row)
        row = []
        field = ''
      } else {
        field += ch
      }
    }
  }

  row.push(field.trim())
  if (row.length > 1 || row[0] !== '') {
    rows.push(row)
  }

  return rows
}

function getCol(header: string[], row: string[], ...names: string[]): string {
  const lower = header.map((h) => h.toLowerCase())
  for (const name of names) {
    const idx = lower.indexOf(name.toLowerCase())
    if (idx !== -1) {
      return (row[idx] || '').trim()
    }
  }
  return ''
}

function parseCSVWithHeader(
  text: string,
  provider: Provider,
  map: Record<string, string[]>
): Partial<Entry>[] {
  const rows = parseCSV(text)
  if (rows.length < 2) return []

  const header = rows[0]
  return rows.slice(1)
    .map((row) => {
      if (row.length === 0 || (row.length === 1 && row[0] === '')) return null
      const entry: Record<string, string> = {}
      for (const [targetKey, colNames] of Object.entries(map)) {
        entry[targetKey] = getCol(header, row, ...colNames)
      }
      entry.provider = provider
      return entry as unknown as Partial<Entry>
    })
    .filter(Boolean) as Partial<Entry>[]
}

function parseBitwardenJSON(text: string): Partial<Entry>[] {
  try {
    const data = JSON.parse(text)
    if (!data.items || !Array.isArray(data.items)) return []

    const folders: Record<string, string> = {}
    if (data.folders && Array.isArray(data.folders)) {
      data.folders.forEach((f: { id: string; name: string }) => {
        folders[f.id] = f.name
      })
    }

    function resolveFolderPath(folderId: string): string {
      if (!folderId || !folders[folderId]) return ''
      return folders[folderId]
    }

    return data.items
      .filter((item: { type: number }) => item.type === 1)
      .map((item: any) => ({
        provider: 'bitwarden' as Provider,
        folder: resolveFolderPath(item.folderId),
        name: item.name || '',
        url: (item.login && item.login.uris && item.login.uris.length > 0)
          ? (item.login.uris[0].uri || '')
          : '',
        username: (item.login && item.login.username) ? item.login.username : '',
        password: (item.login && item.login.password) ? item.login.password : '',
        notes: item.notes || '',
        totp: (item.login && item.login.totp) ? item.login.totp : '',
      }))
  } catch {
    return []
  }
}

function parseBitwardenCSV(text: string): Partial<Entry>[] {
  return parseCSVWithHeader(text, 'bitwarden', {
    name: ['name'],
    folder: ['folder'],
    url: ['login_uri'],
    username: ['login_username'],
    password: ['login_password'],
    notes: ['notes'],
    totp: ['login_totp'],
  })
}

function parseChromiumCSV(text: string): Partial<Entry>[] {
  return parseCSVWithHeader(text, 'chromium', {
    name: ['name'],
    url: ['url'],
    username: ['username'],
    password: ['password'],
    notes: ['note', 'notes'],
    totp: [],
  })
}

function parseFirefoxCSV(text: string): Partial<Entry>[] {
  const entries = parseCSVWithHeader(text, 'firefox', {
    url: ['url'],
    username: ['username'],
    password: ['password'],
    name: [],
    folder: [],
    notes: [],
    totp: [],
  })
  entries.forEach((entry) => {
    try {
      const u = new URL(entry.url || '')
      entry.name = u.hostname.replace(/^www\./, '')
    } catch {
      entry.name = entry.url
    }
  })
  return entries
}

function parseSafariCSV(text: string): Partial<Entry>[] {
  return parseCSVWithHeader(text, 'safari', {
    name: ['title'],
    url: ['url'],
    username: ['username'],
    password: ['password'],
    notes: ['notes'],
    totp: ['otpauth'],
  })
}

interface Detector {
  test(fileName: string, text: string): Provider | null
}

const DETECTORS: Detector[] = [
  {
    test(fileName: string, text: string) {
      if (fileName.endsWith('.json')) {
        try {
          const data = JSON.parse(text)
          if (data && data.items && Array.isArray(data.items)) return 'bitwarden'
        } catch { /* not JSON */ }
      }
      return null
    },
  },
  {
    test(fileName: string, text: string) {
      if (!/\.csv$/i.test(fileName)) return null
      const firstLine = text.split('\n')[0]!.toLowerCase()
      if (firstLine.includes('login_uri') || firstLine.includes('login_username')) return 'bitwarden'
      if (firstLine.includes('httprealm') || firstLine.includes('timecreated') || firstLine.includes('timepasswordchanged')) return 'firefox'
      if (firstLine.includes('title') && firstLine.includes('url') && firstLine.includes('otpauth')) return 'safari'
      if (firstLine.includes('title') && firstLine.includes('url')) return 'safari'
      if (firstLine.includes('name') && firstLine.includes('url')) return 'chromium'
      return null
    },
  },
]

export function detectProvider(fileName: string, text: string): Provider | null {
  for (const detector of DETECTORS) {
    const result = detector.test(fileName, text)
    if (result) return result
  }
  return null
}

type ParserFn = (text: string, fileName?: string) => Partial<Entry>[]

const PARSERS: Record<string, ParserFn> = {
  bitwarden: (text: string, fileName?: string) => {
    if (fileName && fileName.endsWith('.json')) return parseBitwardenJSON(text)
    return parseBitwardenCSV(text)
  },
  chromium: (text: string) => parseChromiumCSV(text),
  firefox: (text: string) => parseFirefoxCSV(text),
  safari: (text: string) => parseSafariCSV(text),
}

export function parseFile(text: string, fileName: string, provider: Provider): Partial<Entry>[] {
  const parser = PARSERS[provider]
  if (!parser) return []
  return parser(text, fileName)
}

export function promptForProvider(fileName: string): Provider | null {
  const providers: Provider[] = ['chromium', 'firefox', 'safari', 'bitwarden']
  const message =
    `Select source for "${fileName}":\n\n` +
    `1. Chrome / Edge / Opera\n` +
    `2. Firefox\n` +
    `3. Safari\n` +
    `4. Bitwarden`
  const choice = prompt(message, '1')
  if (!choice) return null
  const idx = parseInt(choice, 10) - 1
  if (idx >= 0 && idx < providers.length) return providers[idx]!
  return null
}
