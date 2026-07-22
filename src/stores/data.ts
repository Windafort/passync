import { ref, computed } from 'vue'
import type { Entry, Provider } from '../types/entry'
import { encrypt, decrypt } from '../composables/useCrypto'

const STORAGE_KEY = 'vault_encrypted'
const CONFIG_KEY = 'vault_config'

const entries = ref<Entry[]>([])

const searchText = ref('')
const providerFilter = ref<Provider | 'all'>('all')
const sortColumn = ref<keyof Entry>('name')
const sortDirection = ref<'asc' | 'desc'>('asc')

function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

function normalizeKey(entry: Entry): string {
  const url = (entry.url || '').replace(/\/+$/, '').trim().toLowerCase()
  const username = (entry.username || '').trim()
  const password = (entry.password || '').trim()
  return `${url}::${username}::${password}`
}

const filteredEntries = computed<Entry[]>(() => {
  let results = entries.value

  if (providerFilter.value !== 'all') {
    results = results.filter((e) => e.provider === providerFilter.value)
  }

  if (searchText.value) {
    const lower = searchText.value.toLowerCase()
    results = results.filter(
      (e) =>
        (e.name || '').toLowerCase().includes(lower) ||
        (e.url || '').toLowerCase().includes(lower) ||
        (e.username || '').toLowerCase().includes(lower) ||
        (e.notes || '').toLowerCase().includes(lower) ||
        (e.folder || '').toLowerCase().includes(lower)
    )
  }

  results = [...results].sort((a, b) => {
    const aVal = ((a[sortColumn.value] || '') + '').toLowerCase()
    const bVal = ((b[sortColumn.value] || '') + '').toLowerCase()
    if (aVal < bVal) return sortDirection.value === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection.value === 'asc' ? 1 : -1
    return 0
  })

  return results
})

export function useData() {
  function getEntry(id: string): Entry | undefined {
    return entries.value.find((e) => e.id === id)
  }

  function addEntries(newEntries: Partial<Entry>[]): void {
    newEntries.forEach((entry) => {
      entries.value.push({
        id: generateId(),
        provider: entry.provider || 'chromium',
        folder: entry.folder || '',
        name: entry.name || '',
        url: entry.url || '',
        username: entry.username || '',
        password: entry.password || '',
        notes: entry.notes || '',
        totp: entry.totp || '',
      })
    })
  }

  function updateEntry(id: string, changes: Partial<Entry>): boolean {
    const idx = entries.value.findIndex((e) => e.id === id)
    if (idx === -1) return false
    const allowed: (keyof Entry)[] = ['provider', 'folder', 'name', 'url', 'username', 'password', 'notes', 'totp']
    allowed.forEach((key) => {
      if (changes[key] !== undefined) {
        ;(entries.value[idx] as any)[key] = changes[key]
      }
    })
    return true
  }

  function deleteEntry(id: string): boolean {
    const len = entries.value.length
    entries.value = entries.value.filter((e) => e.id !== id)
    return entries.value.length !== len
  }

  function deleteEntries(ids: string[]): number {
    const idSet = new Set(ids)
    const before = entries.value.length
    entries.value = entries.value.filter((e) => !idSet.has(e.id))
    return before - entries.value.length
  }

  function clearAll(): void {
    entries.value = []
  }

  function findDuplicateGroups() {
    const groups = new Map<string, { keep: Entry; remove: Entry[] }>()
    entries.value.forEach((e) => {
      const key = normalizeKey(e)
      if (!groups.has(key)) {
        groups.set(key, { keep: e, remove: [] })
      } else {
        groups.get(key)!.remove.push(e)
      }
    })
    const result: { keep: Entry; remove: Entry[] }[] = []
    for (const [, group] of groups) {
      if (group.remove.length > 0) result.push(group)
    }
    return result
  }

  function hasEncryptedData(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null
  }

  function removeEncryptedData(): void {
    localStorage.removeItem(STORAGE_KEY)
  }

  async function saveEncrypted(passphrase: string): Promise<void> {
    const json = JSON.stringify(entries.value)
    const blob = await encrypt(json, passphrase)
    localStorage.setItem(STORAGE_KEY, blob)
  }

  async function loadEncrypted(passphrase: string): Promise<boolean> {
    const blob = localStorage.getItem(STORAGE_KEY)
    if (!blob) return false
    const json = await decrypt(blob, passphrase)
    if (json === null) return false
    entries.value = JSON.parse(json)
    return true
  }

  function toggleSort(column: keyof Entry): void {
    if (sortColumn.value === column) {
      sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortColumn.value = column
      sortDirection.value = 'asc'
    }
  }

  return {
    entries,
    searchText,
    providerFilter,
    sortColumn,
    sortDirection,
    filteredEntries,
    getEntry,
    addEntries,
    updateEntry,
    deleteEntry,
    deleteEntries,
    clearAll,
    findDuplicateGroups,
    hasEncryptedData,
    removeEncryptedData,
    saveEncrypted,
    loadEncrypted,
    toggleSort,
  }
}
