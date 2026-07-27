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
  <BaseModal :visible="visible" size="lg" scrollable @close="emit('close')">
    <form @submit.prevent="handleSave">
      <div class="modal-header">
        <h2 class="modal-title h5">Edit Entry</h2>
        <button type="button" class="btn-close" aria-label="Close" @click="emit('close')"></button>
      </div>

      <div class="modal-body">
        <div class="row g-3">
          <div class="col-md-6">
            <label for="editProvider" class="form-label">Provider</label>
            <select id="editProvider" v-model="provider" class="form-select">
              <option value="bitwarden">Bitwarden</option>
              <option value="chromium">Chrome / Edge / Opera</option>
              <option value="firefox">Firefox</option>
              <option value="safari">Safari</option>
            </select>
          </div>

          <div class="col-md-6">
            <label for="editFolder" class="form-label">Folder</label>
            <input id="editFolder" v-model="folder" type="text" class="form-control" />
          </div>

          <div class="col-md-6">
            <label for="editName" class="form-label">Name</label>
            <input id="editName" v-model="name" type="text" class="form-control" />
          </div>

          <div class="col-md-6">
            <label for="editUrl" class="form-label">URL</label>
            <input id="editUrl" v-model="url" type="text" class="form-control" />
          </div>

          <div class="col-md-6">
            <label for="editUsername" class="form-label">Username</label>
            <input id="editUsername" v-model="username" type="text" class="form-control" autocomplete="off" />
          </div>

          <div class="col-md-6">
            <label for="editPassword" class="form-label">Password</label>
            <div class="input-group">
              <input
                id="editPassword"
                v-model="passwordVal"
                :type="showPassword ? 'text' : 'password'"
                class="form-control"
                autocomplete="off"
              />
              <button
                type="button"
                class="btn btn-outline-secondary"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              >{{ showPassword ? '🙈' : '👁' }}</button>
            </div>
          </div>

          <div class="col-12">
            <label for="editNotes" class="form-label">Notes</label>
            <textarea id="editNotes" v-model="notes" class="form-control" rows="3"></textarea>
          </div>

          <div class="col-md-6">
            <label for="editTotp" class="form-label">TOTP</label>
            <input id="editTotp" v-model="totp" type="text" class="form-control" autocomplete="off" />
            <div class="form-text">One-time password secret or otpauth:// URI.</div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-outline-secondary" @click="emit('close')">Cancel</button>
        <button type="submit" class="btn btn-primary">Save changes</button>
      </div>
    </form>
  </BaseModal>
</template>
