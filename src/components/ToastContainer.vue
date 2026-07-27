<script setup lang="ts">
import { useToast } from '../stores/toast'

const { toasts, dismiss } = useToast()
</script>

<template>
  <div
    class="toast-container position-fixed bottom-0 end-0 p-3"
    aria-live="polite"
    aria-atomic="true"
  >
    <div
      v-for="t in toasts"
      :key="t.id"
      class="toast show align-items-center border-0"
      :class="{
        'text-bg-success': t.type === 'success',
        'text-bg-danger': t.type === 'error',
        'text-bg-info': t.type === 'info',
      }"
      role="alert"
    >
      <div class="d-flex">
        <div class="toast-body">{{ t.message }}</div>
        <button
          type="button"
          class="btn-close me-2 m-auto"
          :class="{ 'btn-close-white': t.type !== 'info' }"
          aria-label="Close"
          @click="dismiss(t.id)"
        ></button>
      </div>
    </div>
  </div>
</template>
