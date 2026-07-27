<script setup lang="ts">
import BaseModal from './BaseModal.vue'

withDefaults(
  defineProps<{
    visible: boolean
    message: string
    title?: string
    confirmLabel?: string
  }>(),
  { title: 'Are you sure?', confirmLabel: 'Confirm' }
)

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()
</script>

<template>
  <BaseModal :visible="visible" size="sm" @close="emit('cancel')">
    <div class="modal-header">
      <h2 class="modal-title h6">{{ title }}</h2>
      <button type="button" class="btn-close" aria-label="Close" @click="emit('cancel')"></button>
    </div>
    <div class="modal-body">
      <p class="mb-0">{{ message }}</p>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-outline-secondary" @click="emit('cancel')">Cancel</button>
      <button type="button" class="btn btn-danger" @click="emit('confirm')">{{ confirmLabel }}</button>
    </div>
  </BaseModal>
</template>
