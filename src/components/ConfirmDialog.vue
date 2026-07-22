<script setup lang="ts">
import { ref, watch } from 'vue'
import BaseModal from './BaseModal.vue'

const props = defineProps<{
  visible: boolean
  message: string
}>()

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <BaseModal :visible="visible" @close="$emit('cancel')">
    <div class="modal-body text-center py-4">
      <p class="mb-3">{{ message }}</p>
      <div class="d-flex justify-content-center gap-2">
        <button type="button" class="btn btn-secondary" @click="$emit('cancel')">Cancel</button>
        <button type="button" class="btn btn-danger" @click="$emit('confirm')">Confirm</button>
      </div>
    </div>
  </BaseModal>
</template>
