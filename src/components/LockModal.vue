<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from './BaseModal.vue'
import { useData } from '../stores/data'
import { useToast } from '../stores/toast'

const props = defineProps<{
  visible: boolean
  mode: 'encrypt' | 'unlock'
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'discard'): void
}>()

const data = useData()
const toast = useToast()

const password = ref('')
const confirm = ref('')
const error = ref('')

watch(() => props.visible, (val) => {
  if (val) {
    password.value = ''
    confirm.value = ''
    error.value = ''
  }
})

async function handleSubmit(): Promise<void> {
  error.value = ''

  if (!password.value) {
    error.value = 'Passphrase is required'
    return
  }

  if (props.mode === 'encrypt') {
    if (password.value !== confirm.value) {
      error.value = 'Passphrases do not match'
      return
    }
    try {
      await data.saveEncrypted(password.value)
      toast.show('Vault encrypted and saved', 'success')
      emit('close')
    } catch (e: any) {
      error.value = 'Encryption failed: ' + (e?.message || 'unknown error')
    }
  } else {
    try {
      const ok = await data.loadEncrypted(password.value)
      if (!ok) {
        error.value = 'Wrong passphrase'
        password.value = ''
        return
      }
      toast.show('Vault unlocked', 'success')
      emit('close')
    } catch (e: any) {
      error.value = 'Decryption failed: ' + (e?.message || 'unknown error')
    }
  }
}

function handleDiscard(): void {
  if (props.mode === 'encrypt') {
    emit('close')
  } else {
    emit('discard')
  }
}
</script>

<template>
  <BaseModal :visible="visible" @close="$emit('close')">
    <div class="modal-header">
      <h3 class="modal-title fs-5">
        {{ mode === 'encrypt' ? 'Encrypt Vault' : 'Vault Locked' }}
      </h3>
      <button v-if="mode === 'encrypt'" type="button" class="btn-close" aria-label="Close" @click="$emit('close')"></button>
    </div>
    <div class="modal-body">
      <p class="text-muted small mb-3">
        {{ mode === 'encrypt'
          ? 'Set a passphrase to encrypt your vault. You will need it every time you open the app.'
          : 'Enter your passphrase to unlock your vault.'
        }}
      </p>
      <div v-if="error" class="alert alert-danger py-2">{{ error }}</div>
      <div class="mb-3">
        <label for="lockPassword" class="form-label">Passphrase</label>
        <input
          id="lockPassword"
          v-model="password"
          type="password"
          class="form-control"
          @keydown.enter="handleSubmit"
        />
      </div>
      <div v-if="mode === 'encrypt'" class="mb-3">
        <label for="lockConfirm" class="form-label">Confirm Passphrase</label>
        <input
          id="lockConfirm"
          v-model="confirm"
          type="password"
          class="form-control"
          @keydown.enter="handleSubmit"
        />
      </div>
    </div>
    <div class="modal-footer d-flex justify-content-between">
      <button type="button" class="btn btn-outline-secondary" @click="handleDiscard">
        {{ mode === 'encrypt' ? 'Cancel' : 'Start Fresh' }}
      </button>
      <button type="button" class="btn btn-primary" @click="handleSubmit">
        {{ mode === 'encrypt' ? 'Save & Encrypt' : 'Unlock' }}
      </button>
    </div>
  </BaseModal>
</template>
