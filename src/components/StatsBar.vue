<script setup lang="ts">
import { computed } from 'vue'
import { useData } from '../stores/data'

const data = useData()

const providerCounts = computed(() => {
  const counts: Record<string, number> = {}
  data.entries.value.forEach((e) => {
    counts[e.provider] = (counts[e.provider] || 0) + 1
  })
  return Object.entries(counts).map(([k, v]) => `${k}: ${v}`).join(', ') || 'none'
})
</script>

<template>
  <div class="d-flex justify-content-between align-items-center py-2 px-3 bg-body-tertiary border-bottom small">
    <span>Filtered: <strong>{{ data.filteredEntries.value.length }}</strong></span>
    <span>Total: <strong>{{ data.entries.value.length }}</strong></span>
    <span>By source: <strong>{{ providerCounts }}</strong></span>
  </div>
</template>
