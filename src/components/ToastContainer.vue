<script setup lang="ts">
import { useToast } from '../stores/toast'

const { toasts } = useToast()
</script>

<template>
  <div class="toast-container position-fixed bottom-0 end-0 p-3">
    <div
      v-for="t in toasts"
      :key="t.id"
      class="toast show"
      :class="{
        'text-bg-success': t.type === 'success',
        'text-bg-danger': t.type === 'error',
        'text-bg-info': t.type === 'info',
      }"
      role="alert"
    >
      <div class="d-flex">
        <div class="toast-body">{{ t.message }}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>
  </div>
</template>
