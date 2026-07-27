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
const busy = ref(false)
const showPassword = ref(false)
const passwordInput = ref<HTMLInputElement | null>(null)

watch(() => props.visible, (val) => {
  if (val) {
    password.value = ''
    confirm.value = ''
    error.value = ''
    busy.value = false
    showPassword.value = false
  }
})

function focusPassword(): void {
  passwordInput.value?.focus()
}

async function handleSubmit(): Promise<void> {
  if (busy.value) return
  error.value = ''

  if (!password.value) {
    error.value = 'Passphrase is required'
    focusPassword()
    return
  }

  busy.value = true
  try {
    if (props.mode === 'encrypt') {
      if (password.value !== confirm.value) {
        error.value = 'Passphrases do not match'
        return
      }
      await data.saveEncrypted(password.value)
      toast.show('Vault encrypted and saved', 'success')
      emit('close')
    } else {
      const ok = await data.loadEncrypted(password.value)
      if (!ok) {
        error.value = 'Wrong passphrase'
        password.value = ''
        focusPassword()
        return
      }
      toast.show('Vault unlocked', 'success')
      emit('close')
    }
  } catch (e: any) {
    const action = props.mode === 'encrypt' ? 'Encryption' : 'Decryption'
    error.value = `${action} failed: ${e?.message || 'unknown error'}`
  } finally {
    busy.value = false
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
  <BaseModal
    :visible="visible"
    :dismissible="mode === 'encrypt'"
    @close="emit('close')"
    @shown="focusPassword"
  >
    <form @submit.prevent="handleSubmit">
      <div class="modal-header">
        <h2 class="modal-title h5">
          {{ mode === 'encrypt' ? '🔒 Encrypt Vault' : '🔐 Vault Locked' }}
        </h2>
        <button
          v-if="mode === 'encrypt'"
          type="button"
          class="btn-close"
          aria-label="Close"
          @click="emit('close')"
        ></button>
      </div>

      <div class="modal-body">
        <p class="text-body-secondary">
          {{ mode === 'encrypt'
            ? 'Set a passphrase to encrypt your vault in this browser. You will need it every time you open the app — it cannot be recovered.'
            : 'Enter your passphrase to unlock your vault.'
          }}
        </p>

        <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>

        <div class="mb-3">
          <label for="lockPassword" class="form-label">Passphrase</label>
          <div class="input-group">
            <input
              id="lockPassword"
              ref="passwordInput"
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              class="form-control"
              :class="{ 'is-invalid': error }"
              autocomplete="current-password"
            />
            <button
              type="button"
              class="btn btn-outline-secondary"
              :aria-label="showPassword ? 'Hide passphrase' : 'Show passphrase'"
              @click="showPassword = !showPassword"
            >{{ showPassword ? '🙈' : '👁' }}</button>
          </div>
        </div>

        <div v-if="mode === 'encrypt'" class="mb-3">
          <label for="lockConfirm" class="form-label">Confirm passphrase</label>
          <input
            id="lockConfirm"
            v-model="confirm"
            :type="showPassword ? 'text' : 'password'"
            class="form-control"
            autocomplete="new-password"
          />
        </div>

        <div v-if="mode === 'unlock'" class="form-text">
          Starting fresh permanently deletes the encrypted vault stored in this browser.
        </div>
      </div>

      <div class="modal-footer justify-content-between">
        <button type="button" class="btn btn-outline-secondary" @click="handleDiscard">
          {{ mode === 'encrypt' ? 'Cancel' : 'Start Fresh' }}
        </button>
        <button type="submit" class="btn btn-primary" :disabled="busy">
          <span v-if="busy" class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
          {{ mode === 'encrypt' ? 'Save & Encrypt' : 'Unlock' }}
        </button>
      </div>
    </form>
  </BaseModal>
</template>
