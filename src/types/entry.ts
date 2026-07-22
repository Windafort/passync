export interface Entry {
  id: string
  provider: Provider
  folder: string
  name: string
  url: string
  username: string
  password: string
  notes: string
  totp: string
}

export type Provider = 'bitwarden' | 'chromium' | 'firefox' | 'safari'

export interface DuplicateGroup {
  keep: Entry
  remove: Entry[]
}

export type ExportFormat = 'json' | 'csv'

export interface ExportResult {
  content: string
  mimeType: string
  ext: string
}
