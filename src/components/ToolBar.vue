<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
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

const { searchText, providerFilter } = useData()

const showExportMenu = ref(false)

function toggleExportMenu(): void {
  showExportMenu.value = !showExportMenu.value
}

function handleExport(provider: string, format?: string): void {
  showExportMenu.value = false
  emit('export', provider, format)
}

function closeMenuOnClickOutside(event: MouseEvent): void {
  const target = event.target as HTMLElement
  if (!target.closest('.dropdown-wrapper')) {
    showExportMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeMenuOnClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenuOnClickOutside)
})
</script>

<template>
  <div class="d-flex justify-content-between align-items-center py-2 px-3 border-bottom gap-2 flex-wrap">
    <div class="d-flex gap-2 align-items-center flex-grow-1">
      <input
        v-model="searchText"
        type="text"
        class="form-control form-control-sm"
        placeholder="🔍 Search entries..."
        style="max-width: 250px"
      />
      <select v-model="providerFilter" class="form-select form-select-sm" style="max-width: 200px">
        <option value="all">All providers</option>
        <option value="bitwarden">Bitwarden</option>
        <option value="chromium">Chrome / Edge / Opera</option>
        <option value="firefox">Firefox</option>
        <option value="safari">Safari</option>
      </select>
    </div>
    <div class="d-flex gap-2 align-items-center">
      <button class="btn btn-sm btn-outline-primary" @click="$emit('import')">📥 Import</button>
      <button class="btn btn-sm btn-outline-danger" @click="$emit('dedup')">🗑 Remove duplicates</button>
      <button class="btn btn-sm btn-outline-danger" @click="$emit('clear')">💣 Clear all</button>
      <div class="dropdown-wrapper position-relative">
        <button class="btn btn-sm btn-primary" @click="toggleExportMenu">📤 Export</button>
        <div
          v-show="showExportMenu"
          class="dropdown-menu show position-absolute"
          style="right: 0; z-index: 1000"
        >
          <div class="dropdown-header small text-muted">Bitwarden</div>
          <button class="dropdown-item" @click="handleExport('bitwarden', 'json')">As Bitwarden JSON</button>
          <button class="dropdown-item" @click="handleExport('bitwarden', 'csv')">As Bitwarden CSV</button>
          <div class="dropdown-divider"></div>
          <div class="dropdown-header small text-muted">Browsers</div>
          <button class="dropdown-item" @click="handleExport('chromium')">As Chrome / Edge / Opera CSV</button>
          <button class="dropdown-item" @click="handleExport('firefox')">As Firefox CSV</button>
          <button class="dropdown-item" @click="handleExport('safari')">As Safari CSV</button>
        </div>
      </div>
    </div>
  </div>
</template>
