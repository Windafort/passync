<script setup lang="ts">
defineProps<{
  summary: { file: string; count: number; provider: string }[]
  total: number
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'dismiss'): void
}>()
</script>

<template>
  <div v-if="visible" class="alert alert-success alert-dismissible mb-0" role="status">
    <h2 class="alert-heading h6 mb-2">Imported {{ total }} {{ total === 1 ? 'entry' : 'entries' }}</h2>
    <ul class="list-unstyled small mb-0">
      <li v-for="s in summary" :key="s.file">
        <span class="fw-medium">{{ s.file }}</span>
        &mdash; {{ s.count }} {{ s.count === 1 ? 'entry' : 'entries' }} ({{ s.provider }})
      </li>
    </ul>
    <button
      type="button"
      class="btn-close"
      aria-label="Dismiss import summary"
      @click="emit('dismiss')"
    ></button>
  </div>
</template>
