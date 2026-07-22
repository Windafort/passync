<script setup lang="ts">
import { useData } from '../stores/data'
import type { Entry } from '../types/entry'

const emit = defineEmits<{
  (e: 'edit', id: string): void
  (e: 'delete', id: string, name: string): void
}>()

const { filteredEntries, sortColumn, sortDirection, toggleSort } = useData()

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

function sortArrow(col: Column): string {
  if (!col.sortable || col.key === 'actions') return ''
  if (sortColumn.value === col.key) {
    return sortDirection.value === 'asc' ? ' ▲' : ' ▼'
  }
  return ''
}

function maskPassword(password: string): string {
  return '•'.repeat(Math.min(12, password.length))
}

async function handleCopy(entry: Entry): Promise<void> {
  try {
    await navigator.clipboard.writeText(entry.password)
  } catch { /* failed */ }
}
</script>

<template>
  <div class="table-responsive">
    <table class="table table-striped table-hover mb-0">
      <thead class="table-light">
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :class="{ 'cursor-pointer user-select-none': col.sortable }"
            @click="col.sortable && col.key !== 'actions' && toggleSort(col.key)"
          >
            {{ col.label }}
            <span v-if="col.sortable && col.key !== 'actions'" class="text-muted small">{{ sortArrow(col) }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="filteredEntries.length === 0">
          <td :colspan="columns.length" class="text-center py-5">
            <div class="fs-1 mb-2">🔐</div>
            <h3>No passwords yet</h3>
            <p class="text-muted">Drag and drop your exported password files or click to browse.</p>
          </td>
        </tr>
        <tr v-for="entry in filteredEntries" :key="entry.id">
          <td>
            <span
              class="badge"
              :class="{
                'bg-primary': entry.provider === 'bitwarden',
                'bg-secondary': entry.provider === 'chromium',
                'bg-info': entry.provider === 'firefox',
                'bg-light text-dark': entry.provider === 'safari',
              }"
            >{{ entry.provider }}</span>
          </td>
          <td>{{ entry.folder }}</td>
          <td>{{ entry.name }}</td>
          <td class="text-break">{{ entry.url }}</td>
          <td>{{ entry.username }}</td>
          <td>
            <span class="password-masked" :title="entry.password">{{ maskPassword(entry.password) }}</span>
          </td>
          <td>{{ entry.notes }}</td>
          <td>
            <div class="d-flex gap-1">
              <button
                class="btn btn-sm btn-outline-secondary"
                title="Copy password"
                @click="handleCopy(entry)"
              >📋</button>
              <button
                class="btn btn-sm btn-outline-secondary"
                title="Edit"
                @click="$emit('edit', entry.id)"
              >✏️</button>
              <button
                class="btn btn-sm btn-outline-danger"
                title="Delete"
                @click="$emit('delete', entry.id, entry.name)"
              >🗑</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.cursor-pointer { cursor: pointer; }
.password-masked {
  user-select: none;
  letter-spacing: 2px;
}
</style>
