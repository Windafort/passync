<script setup lang="ts">
import { useConfig } from '../stores/config'
import { useData } from '../stores/data'

const props = defineProps<{
  hasEncryptedData: boolean
  entryCount: number
}>()

const emit = defineEmits<{
  (e: 'encrypt-toggle'): void
  (e: 'lock'): void
}>()

const { darkMode, toggle: toggleDark } = useConfig()
const data = useData()

function handleLock(): void {
  data.clearAll()
  emit('lock')
}
</script>

<template>
  <header class="d-flex justify-content-between align-items-center py-2 px-3 border-bottom">
    <div class="d-flex align-items-center gap-2">
      <h1 class="mb-0 fs-4 fw-bold">Passync</h1>
      <span class="badge bg-secondary">v1.0</span>
    </div>
    <div class="d-flex align-items-center gap-2">
      <span
        v-if="entryCount > 0"
        class="badge"
        :class="hasEncryptedData ? 'bg-success' : 'bg-warning text-dark'"
      >
        {{ entryCount }} entries &middot; {{ hasEncryptedData ? 'Saved' : 'Unsaved' }}
      </span>
      <button
        v-if="entryCount > 0"
        class="btn btn-sm"
        :class="hasEncryptedData ? 'btn-outline-danger' : 'btn-outline-primary'"
        @click="$emit('encrypt-toggle')"
      >
        {{ hasEncryptedData ? '🔓 Decrypt' : '🔒 Encrypt' }}
      </button>
      <button
        v-if="hasEncryptedData"
        class="btn btn-sm btn-outline-secondary"
        title="Lock vault"
        @click="handleLock"
      >
        🔐
      </button>
      <button
        class="btn btn-sm btn-outline-secondary"
        title="Toggle dark mode"
        @click="toggleDark"
      >
        {{ darkMode ? '☀' : '☽' }}
      </button>
    </div>
  </header>
</template>
