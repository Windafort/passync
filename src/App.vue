<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import { useData } from './stores/data'
import { useToast } from './stores/toast'
import { useConfig } from './stores/config'
import { detectProvider, parseFile, promptForProvider } from './composables/useImport'
import { exportEntries, triggerDownload } from './composables/useExport'
import type { Provider } from './types/entry'

import AppHeader from './components/AppHeader.vue'
import DropZone from './components/DropZone.vue'
import ImportSummary from './components/ImportSummary.vue'
import StatsBar from './components/StatsBar.vue'
import ToolBar from './components/ToolBar.vue'
import PasswordTable from './components/PasswordTable.vue'
import ToastContainer from './components/ToastContainer.vue'
import LockModal from './components/LockModal.vue'
import EditModal from './components/EditModal.vue'
import DedupModal from './components/DedupModal.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'

const data = useData()
const toast = useToast()
const config = useConfig()

const showLock = ref(false)
const lockMode = ref<'encrypt' | 'unlock'>('unlock')
const showEdit = ref(false)
const editEntryId = ref<string | null>(null)
const showDedup = ref(false)
const confirmVisible = ref(false)
const confirmMessage = ref('')
const confirmTitle = ref('Are you sure?')
const confirmLabel = ref('Confirm')
const confirmCallback = ref<(() => void) | null>(null)
const importSummary = ref<{ file: string; count: number; provider: string }[]>([])
const importTotal = ref(0)
const showSummary = ref(false)

const MAX_FILE_SIZE = 5 * 1024 * 1024

onMounted(() => {
  if (data.hasEncryptedData()) {
    lockMode.value = 'unlock'
    showLock.value = true
  }

  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

function handleBeforeUnload(e: BeforeUnloadEvent): void {
  if (data.entries.value.length > 0 && !data.hasEncryptedData()) {
    e.preventDefault()
    e.returnValue = ''
  }
}

const hasEntries = () => data.entries.value.length > 0

async function handleFiles(files: FileList): Promise<void> {
  const fileArray = Array.from(files)
  let totalImported = 0
  const errors: string[] = []
  const summaries: { file: string; count: number; provider: string }[] = []

  for (const file of fileArray) {
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: File too large (max 5MB)`)
      continue
    }

    try {
      const text = await readFileAsText(file)
      let provider = detectProvider(file.name, text)

      if (!provider) {
        if (file.name.endsWith('.json')) {
          provider = 'bitwarden'
        } else if (file.name.endsWith('.csv')) {
          provider = promptForProvider(file.name)
          if (!provider) {
            errors.push(`${file.name}: Skipped (cannot determine format)`)
            continue
          }
        } else {
          errors.push(`${file.name}: Unsupported file type (use .csv or .json)`)
          continue
        }
      }

      const entries = parseFile(text, file.name, provider)
      if (entries.length === 0) {
        errors.push(`${file.name}: No entries found`)
        continue
      }

      data.addEntries(entries)
      totalImported += entries.length
      summaries.push({ file: file.name, count: entries.length, provider })
    } catch (e: any) {
      errors.push(`${file.name}: ${e.message}`)
    }
  }

  if (summaries.length > 0) {
    importSummary.value = summaries
    importTotal.value = totalImported
    showSummary.value = true
  }
  errors.forEach((err) => toast.show(err, 'error'))
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

function handleImport(): void {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.csv,.json'
  input.multiple = true
  input.onchange = () => {
    if (input.files) handleFiles(input.files)
  }
  input.click()
}

function handleDedup(): void {
  if (data.entries.value.length === 0) {
    toast.show('No entries to deduplicate', 'info')
    return
  }
  const groups = data.findDuplicateGroups()
  if (groups.length === 0) {
    toast.show('No duplicates found', 'info')
    return
  }
  showDedup.value = true
}

function handleClear(): void {
  if (data.entries.value.length === 0) {
    toast.show('No entries to clear', 'info')
    return
  }
  const hasEncrypted = data.hasEncryptedData()
  const msg = hasEncrypted
    ? 'Clear all entries and discard the encrypted vault? This cannot be undone.'
    : 'Clear all entries? This cannot be undone.'
  showConfirm(
    msg,
    () => {
      data.clearAll()
      if (hasEncrypted) data.removeEncryptedData()
      toast.show('All entries cleared', 'info')
    },
    { title: 'Clear all entries?', confirmLabel: 'Clear all' }
  )
}

function handleExport(provider: string, format?: string): void {
  const entries = data.entries.value
  if (entries.length === 0) {
    toast.show('No entries to export', 'error')
    return
  }
  const result = exportEntries(entries, provider as Provider, format as any)
  if (result) {
    const label = provider === 'chromium' ? 'chrome' : provider
    const fileName = `passwords_${label}_export${result.ext}`
    triggerDownload(result.content, fileName, result.mimeType)
    toast.show(`Exported ${entries.length} entries as ${label} format`, 'success')
  }
}

function handleEncryptToggle(): void {
  if (data.hasEncryptedData()) {
    showConfirm(
      'Remove encryption from this vault? Entries stay in memory but will be lost if you reload the page.',
      () => {
        data.removeEncryptedData()
        toast.show('Vault decrypted. Entries remain in memory only.', 'info')
      },
      { title: 'Remove encryption?', confirmLabel: 'Remove encryption' }
    )
  } else {
    lockMode.value = 'encrypt'
    showLock.value = true
  }
}

function handleLock(): void {
  lockMode.value = 'unlock'
  showLock.value = true
}

function handleEdit(id: string): void {
  editEntryId.value = id
  showEdit.value = true
}

function handleDelete(id: string, name: string): void {
  showConfirm(
    `Delete "${name || 'this entry'}"? This cannot be undone.`,
    () => {
      data.deleteEntry(id)
      toast.show('Entry deleted', 'info')
    },
    { title: 'Delete entry?', confirmLabel: 'Delete' }
  )
}

function showConfirm(
  message: string,
  onConfirm: () => void,
  options: { title?: string; confirmLabel?: string } = {}
): void {
  confirmMessage.value = message
  confirmTitle.value = options.title ?? 'Are you sure?'
  confirmLabel.value = options.confirmLabel ?? 'Confirm'
  confirmCallback.value = onConfirm
  confirmVisible.value = true
}

function handleConfirm(): void {
  confirmCallback.value?.()
  confirmVisible.value = false
}

function handleConfirmCancel(): void {
  confirmVisible.value = false
}

function handleDiscardVault(): void {
  showConfirm(
    'Discard the encrypted vault? All saved data will be permanently lost.',
    () => {
      data.removeEncryptedData()
      data.clearAll()
      showLock.value = false
      toast.show('Encrypted vault discarded', 'info')
    },
    { title: 'Discard vault?', confirmLabel: 'Discard vault' }
  )
}
</script>

<template>
  <div class="d-flex flex-column vh-100">
    <AppHeader
      :has-encrypted-data="data.hasEncryptedData()"
      :entry-count="data.entries.value.length"
      @encrypt-toggle="handleEncryptToggle"
      @lock="handleLock"
    />

    <main class="flex-grow-1 d-flex flex-column overflow-hidden">
      <div v-if="!hasEntries()" class="container-fluid flex-grow-1 d-flex align-items-center px-4 py-4">
        <div class="row justify-content-center w-100">
          <div class="col-12 col-md-10 col-lg-8 col-xxl-6">
            <DropZone @files-selected="handleFiles" />
          </div>
        </div>
      </div>

      <template v-else>
        <ToolBar
          :has-entries="hasEntries()"
          @import="handleImport"
          @dedup="handleDedup"
          @clear="handleClear"
          @export="handleExport"
        />

        <div class="flex-grow-1 overflow-auto">
          <div class="container-fluid d-flex flex-column gap-3 px-4 py-4">
            <ImportSummary
              :summary="importSummary"
              :total="importTotal"
              :visible="showSummary"
              @dismiss="showSummary = false"
            />

            <StatsBar />

            <div class="card overflow-hidden shadow-sm">
              <PasswordTable
                @edit="handleEdit"
                @delete="handleDelete"
              />
            </div>
          </div>
        </div>
      </template>
    </main>

    <LockModal
      :visible="showLock"
      :mode="lockMode"
      @close="showLock = false"
      @discard="handleDiscardVault"
    />

    <EditModal
      :visible="showEdit"
      :entry-id="editEntryId"
      @close="showEdit = false"
    />

    <DedupModal
      :visible="showDedup"
      @close="showDedup = false"
    />

    <ConfirmDialog
      :visible="confirmVisible"
      :message="confirmMessage"
      :title="confirmTitle"
      :confirm-label="confirmLabel"
      @confirm="handleConfirm"
      @cancel="handleConfirmCancel"
    />

    <ToastContainer />
  </div>
</template>
