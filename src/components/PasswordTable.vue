<script setup lang="ts">
import { ref } from 'vue'
import { useData } from '../stores/data'
import { useToast } from '../stores/toast'
import type { Entry } from '../types/entry'

const emit = defineEmits<{
  (e: 'edit', id: string): void
  (e: 'delete', id: string, name: string): void
}>()

const { filteredEntries, entries, searchText, providerFilter, sortColumn, sortDirection, toggleSort } = useData()
const toast = useToast()

interface Column {
  key: keyof Entry | 'actions'
  label: string
  sortable: boolean
}

const columns: Column[] = [
  { key: 'provider', label: 'Provider', sortable: true },
  { key: 'folder', label: 'Folder', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'url', label: 'URL', sortable: true },
  { key: 'username', label: 'Username', sortable: true },
  { key: 'password', label: 'Password', sortable: false },
  { key: 'notes', label: 'Notes', sortable: true },
  { key: 'actions', label: 'Actions', sortable: false },
]

const providerLabels: Record<string, string> = {
  bitwarden: 'Bitwarden',
  chromium: 'Chrome / Edge',
  firefox: 'Firefox',
  safari: 'Safari',
}

const revealed = ref<Set<string>>(new Set())
const copiedId = ref<string | null>(null)
let copiedTimer: ReturnType<typeof setTimeout> | null = null

function isSortable(col: Column): boolean {
  return col.sortable && col.key !== 'actions'
}

function isActiveSort(col: Column): boolean {
  return isSortable(col) && sortColumn.value === col.key
}

function ariaSort(col: Column): 'ascending' | 'descending' | 'none' | undefined {
  if (!isSortable(col)) return undefined
  if (!isActiveSort(col)) return 'none'
  return sortDirection.value === 'asc' ? 'ascending' : 'descending'
}

/* Always render an indicator so activating a sort never changes the header
   width, which is what pushed the arrow onto a second line. */
function sortArrow(col: Column): string {
  if (!isActiveSort(col)) return '⇅'
  return sortDirection.value === 'asc' ? '▲' : '▼'
}

function toggleReveal(id: string): void {
  const next = new Set(revealed.value)
  next.has(id) ? next.delete(id) : next.add(id)
  revealed.value = next
}

function maskPassword(password: string): string {
  return password ? '•'.repeat(Math.min(12, password.length)) : ''
}

async function handleCopy(entry: Entry): Promise<void> {
  if (!entry.password) {
    toast.show('This entry has no password to copy', 'info')
    return
  }
  try {
    await navigator.clipboard.writeText(entry.password)
    copiedId.value = entry.id
    if (copiedTimer) clearTimeout(copiedTimer)
    copiedTimer = setTimeout(() => (copiedId.value = null), 1500)
  } catch {
    toast.show('Could not copy to clipboard', 'error')
  }
}

function clearFilters(): void {
  searchText.value = ''
  providerFilter.value = 'all'
}
</script>

<template>
  <div class="table-responsive">
    <table class="table table-striped table-hover align-middle mb-0">
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            scope="col"
            class="text-nowrap py-3"
            :class="[
              { 'cursor-pointer user-select-none': isSortable(col) },
              col.key === 'actions' ? 'text-end' : '',
            ]"
            :aria-sort="ariaSort(col)"
            :tabindex="isSortable(col) ? 0 : undefined"
            @click="isSortable(col) && toggleSort(col.key as keyof Entry)"
            @keydown.enter.prevent="isSortable(col) && toggleSort(col.key as keyof Entry)"
            @keydown.space.prevent="isSortable(col) && toggleSort(col.key as keyof Entry)"
          >
            {{ col.label }}
            <span
              v-if="isSortable(col)"
              class="ms-1 small"
              :class="isActiveSort(col) ? 'text-primary' : 'text-body-tertiary'"
              aria-hidden="true"
            >{{ sortArrow(col) }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="filteredEntries.length === 0">
          <td :colspan="columns.length" class="text-center py-5">
            <div class="fs-1 mb-3">{{ entries.length === 0 ? '🔐' : '🔍' }}</div>
            <h3 class="fs-5">
              {{ entries.length === 0 ? 'No passwords yet' : 'No entries match your filters' }}
            </h3>
            <p class="text-body-secondary mb-3">
              {{ entries.length === 0
                ? 'Drag and drop your exported password files, or use Import to browse.'
                : `${entries.length} entries are loaded, but none match the current search or provider filter.` }}
            </p>
            <button
              v-if="entries.length > 0"
              type="button"
              class="btn btn-sm btn-outline-secondary"
              @click="clearFilters"
            >Clear filters</button>
          </td>
        </tr>
        <tr v-for="entry in filteredEntries" :key="entry.id">
          <td>
            <span
              class="badge rounded-pill"
              :class="{
                'text-bg-primary': entry.provider === 'bitwarden',
                'text-bg-secondary': entry.provider === 'chromium',
                'text-bg-info': entry.provider === 'firefox',
                'text-bg-warning': entry.provider === 'safari',
              }"
            >{{ providerLabels[entry.provider] || entry.provider }}</span>
          </td>
          <td>
            <span v-if="entry.folder">{{ entry.folder }}</span>
            <span v-else class="text-body-tertiary">&mdash;</span>
          </td>
          <td>
            <span v-if="entry.name" class="fw-medium">{{ entry.name }}</span>
            <span v-else class="text-body-tertiary">(no name)</span>
          </td>
          <td class="text-break">
            <a
              v-if="entry.url"
              :href="entry.url"
              target="_blank"
              rel="noopener noreferrer nofollow"
              class="link-body-emphasis link-underline-opacity-25 link-underline-opacity-100-hover"
            >{{ entry.url }}</a>
            <span v-else class="text-body-tertiary">&mdash;</span>
          </td>
          <td class="text-break">
            <span v-if="entry.username">{{ entry.username }}</span>
            <span v-else class="text-body-tertiary">&mdash;</span>
          </td>
          <td>
            <div class="d-flex align-items-center gap-2">
              <span class="font-monospace" :class="{ 'user-select-none': !revealed.has(entry.id) }">
                {{ revealed.has(entry.id) ? entry.password : maskPassword(entry.password) }}
              </span>
              <button
                v-if="entry.password"
                type="button"
                class="btn btn-sm btn-link p-0 text-body-secondary"
                :title="revealed.has(entry.id) ? 'Hide password' : 'Show password'"
                :aria-label="revealed.has(entry.id) ? 'Hide password' : 'Show password'"
                @click="toggleReveal(entry.id)"
              >{{ revealed.has(entry.id) ? '🙈' : '👁' }}</button>
            </div>
          </td>
          <td class="text-break">
            <span v-if="entry.notes">{{ entry.notes }}</span>
            <span v-else class="text-body-tertiary">&mdash;</span>
          </td>
          <td class="text-end text-nowrap">
            <div class="btn-group btn-group-sm" role="group" aria-label="Entry actions">
              <button
                type="button"
                class="btn"
                :class="copiedId === entry.id ? 'btn-success' : 'btn-outline-secondary'"
                :title="copiedId === entry.id ? 'Copied!' : 'Copy password'"
                :aria-label="`Copy password for ${entry.name || 'entry'}`"
                @click="handleCopy(entry)"
              >{{ copiedId === entry.id ? '✓' : '📋' }}</button>
              <button
                type="button"
                class="btn btn-outline-secondary"
                title="Edit entry"
                :aria-label="`Edit ${entry.name || 'entry'}`"
                @click="emit('edit', entry.id)"
              >✏️</button>
              <button
                type="button"
                class="btn btn-outline-danger"
                title="Delete entry"
                :aria-label="`Delete ${entry.name || 'entry'}`"
                @click="emit('delete', entry.id, entry.name)"
              >🗑</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
