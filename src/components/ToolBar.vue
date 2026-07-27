<script setup lang="ts">
import { useData } from '../stores/data'

defineProps<{
  hasEntries: boolean
}>()

const emit = defineEmits<{
  (e: 'import'): void
  (e: 'dedup'): void
  (e: 'clear'): void
  (e: 'export', provider: string, format?: string): void
}>()

const { searchText, providerFilter, filteredEntries } = useData()
</script>

<template>
  <div class="border-bottom bg-body-tertiary">
    <div class="container-fluid d-flex flex-wrap align-items-center gap-3 px-4 py-3">
      <div class="d-flex flex-wrap align-items-center gap-2 flex-grow-1">
        <div class="input-group input-group-sm flex-grow-1" style="max-width: 20rem">
          <span class="input-group-text" id="searchIcon">🔍</span>
          <input
            v-model="searchText"
            type="text"
            class="form-control"
            placeholder="Search entries..."
            aria-label="Search entries"
            aria-describedby="searchIcon"
          />
          <button
            v-if="searchText"
            class="btn btn-outline-secondary"
            type="button"
            aria-label="Clear search"
            @click="searchText = ''"
          >&times;</button>
        </div>

        <select
          v-model="providerFilter"
          class="form-select form-select-sm w-auto"
          aria-label="Filter by provider"
        >
          <option value="all">All providers</option>
          <option value="bitwarden">Bitwarden</option>
          <option value="chromium">Chrome / Edge / Opera</option>
          <option value="firefox">Firefox</option>
          <option value="safari">Safari</option>
        </select>

        <span class="text-body-secondary small">{{ filteredEntries.length }} shown</span>
      </div>

      <div class="d-flex flex-wrap align-items-center gap-2">
        <button type="button" class="btn btn-sm btn-outline-primary" @click="emit('import')">
          📥 Import
        </button>
        <button type="button" class="btn btn-sm btn-outline-secondary" @click="emit('dedup')">
          🧹 Remove duplicates
        </button>
        <button type="button" class="btn btn-sm btn-outline-danger" @click="emit('clear')">
          💣 Clear all
        </button>

        <div class="dropdown">
          <button
            type="button"
            class="btn btn-sm btn-primary dropdown-toggle"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            📤 Export
          </button>
          <ul class="dropdown-menu dropdown-menu-end shadow">
            <li><h6 class="dropdown-header">Bitwarden</h6></li>
            <li>
              <button class="dropdown-item" type="button" @click="emit('export', 'bitwarden', 'json')">
                As Bitwarden JSON
              </button>
            </li>
            <li>
              <button class="dropdown-item" type="button" @click="emit('export', 'bitwarden', 'csv')">
                As Bitwarden CSV
              </button>
            </li>
            <li><hr class="dropdown-divider" /></li>
            <li><h6 class="dropdown-header">Browsers</h6></li>
            <li>
              <button class="dropdown-item" type="button" @click="emit('export', 'chromium')">
                As Chrome / Edge / Opera CSV
              </button>
            </li>
            <li>
              <button class="dropdown-item" type="button" @click="emit('export', 'firefox')">
                As Firefox CSV
              </button>
            </li>
            <li>
              <button class="dropdown-item" type="button" @click="emit('export', 'safari')">
                As Safari CSV
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>
