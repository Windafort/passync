<script setup lang="ts">
defineProps<{
  summary: { file: string; count: number; provider: string }[]
  total: number
  visible: boolean
}>()
</script>

<template>
  <div v-if="visible" class="alert alert-success mb-0">
    <strong>Imported {{ total }} entries total:</strong>
    <div v-for="s in summary" :key="s.file">{{ s.file }}: {{ s.count }} entries ({{ s.provider }})</div>
  </div>
</template>
