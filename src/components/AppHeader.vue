<script setup lang="ts">
import { useConfig } from '../stores/config'
import { useData } from '../stores/data'

defineProps<{
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
  <nav class="navbar bg-body-tertiary border-bottom">
    <div class="container-fluid px-4">
      <span class="navbar-brand d-flex align-items-center gap-2 mb-0">
        <span aria-hidden="true">🔐</span>
        <span class="fw-bold">Passync</span>
        <span class="badge text-bg-secondary align-self-center">v1.0</span>
      </span>

      <div class="d-flex align-items-center gap-2">
        <span
          v-if="entryCount > 0"
          class="badge rounded-pill"
          :class="hasEncryptedData ? 'text-bg-success' : 'text-bg-warning'"
          :title="hasEncryptedData
            ? 'Your vault is encrypted in local storage'
            : 'Entries live in memory only and are lost on reload'"
        >
          {{ entryCount }} {{ entryCount === 1 ? 'entry' : 'entries' }} &middot;
          {{ hasEncryptedData ? 'Saved' : 'Unsaved' }}
        </span>

        <button
          v-if="entryCount > 0"
          type="button"
          class="btn btn-sm"
          :class="hasEncryptedData ? 'btn-outline-danger' : 'btn-outline-primary'"
          :title="hasEncryptedData ? 'Remove encryption from this vault' : 'Encrypt and save this vault'"
          @click="emit('encrypt-toggle')"
        >
          {{ hasEncryptedData ? '🔓 Decrypt' : '🔒 Encrypt' }}
        </button>

        <button
          v-if="hasEncryptedData"
          type="button"
          class="btn btn-sm btn-outline-secondary"
          title="Lock vault"
          aria-label="Lock vault"
          @click="handleLock"
        >
          🔐
        </button>

        <button
          type="button"
          class="btn btn-sm btn-outline-secondary"
          :title="darkMode ? 'Switch to light mode' : 'Switch to dark mode'"
          :aria-label="darkMode ? 'Switch to light mode' : 'Switch to dark mode'"
          :aria-pressed="darkMode"
          @click="toggleDark"
        >
          {{ darkMode ? '☀' : '☽' }}
        </button>
      </div>
    </div>
  </nav>
</template>
