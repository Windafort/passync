<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from './BaseModal.vue'
import { useData } from '../stores/data'
import { useToast } from '../stores/toast'
import type { Entry, Provider } from '../types/entry'

const props = defineProps<{
  visible: boolean
  entryId: string | null
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const data = useData()
const toast = useToast()

const provider = ref<Provider>('bitwarden')
const folder = ref('')
const name = ref('')
const url = ref('')
const username = ref('')
const passwordVal = ref('')
const notes = ref('')
const totp = ref('')
const showPassword = ref(false)

watch(() => props.visible, (val) => {
  if (val && props.entryId) {
    const entry = data.getEntry(props.entryId)
    if (entry) {
      provider.value = entry.provider
      folder.value = entry.folder
      name.value = entry.name
      url.value = entry.url
      username.value = entry.username
      passwordVal.value = entry.password
      notes.value = entry.notes
      totp.value = entry.totp
      showPassword.value = false
    }
  }
})

function handleSave(): void {
  if (!props.entryId) return
  data.updateEntry(props.entryId, {
    provider: provider.value,
    folder: folder.value,
    name: name.value,
    url: url.value,
    username: username.value,
    password: passwordVal.value,
    notes: notes.value,
    totp: totp.value,
  } as Entry)
  toast.show('Entry updated', 'success')
  emit('close')
}
</script>

<template>
  <BaseModal :visible="visible" @close="$emit('close')">
    <div class="modal-header">
      <h3 class="modal-title fs-5">Edit Entry</h3>
      <button type="button" class="btn-close" aria-label="Close" @click="$emit('close')"></button>
    </div>
    <div class="modal-body">
      <div class="mb-3">
        <label class="form-label">Provider</label>
        <select v-model="provider" class="form-select">
          <option value="bitwarden">Bitwarden</option>
          <option value="chromium">Chrome / Edge / Opera</option>
          <option value="firefox">Firefox</option>
          <option value="safari">Safari</option>
        </select>
      </div>
      <div class="mb-3">
        <label class="form-label">Folder</label>
        <input v-model="folder" type="text" class="form-control" />
      </div>
      <div class="mb-3">
        <label class="form-label">Name</label>
        <input v-model="name" type="text" class="form-control" />
      </div>
      <div class="mb-3">
        <label class="form-label">URL</label>
        <input v-model="url" type="text" class="form-control" />
      </div>
      <div class="mb-3">
        <label class="form-label">Username</label>
        <input v-model="username" type="text" class="form-control" />
      </div>
      <div class="mb-3">
        <label class="form-label">Password</label>
        <div class="input-group">
          <input v-model="passwordVal" :type="showPassword ? 'text' : 'password'" class="form-control" />
          <button class="btn btn-outline-secondary" type="button" @click="showPassword = !showPassword">
            {{ showPassword ? '🙈' : '👁' }}
          </button>
        </div>
      </div>
      <div class="mb-3">
        <label class="form-label">Notes</label>
        <textarea v-model="notes" class="form-control" rows="2"></textarea>
      </div>
      <div class="mb-3">
        <label class="form-label">TOTP</label>
        <input v-model="totp" type="text" class="form-control" />
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" @click="$emit('close')">Cancel</button>
      <button type="button" class="btn btn-primary" @click="handleSave">Save</button>
    </div>
  </BaseModal>
</template>
