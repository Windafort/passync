<script setup lang="ts">
import { computed } from 'vue'
import { useData } from '../stores/data'

const data = useData()

const providerLabels: Record<string, string> = {
  bitwarden: 'Bitwarden',
  chromium: 'Chrome / Edge',
  firefox: 'Firefox',
  safari: 'Safari',
}

const providerCounts = computed(() => {
  const counts: Record<string, number> = {}
  data.entries.value.forEach((e) => {
    counts[e.provider] = (counts[e.provider] || 0) + 1
  })
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([provider, count]) => ({
      provider,
      count,
      label: providerLabels[provider] || provider,
    }))
})
</script>

<template>
  <div class="card">
    <div class="card-body d-flex flex-wrap align-items-center gap-4 py-2 px-3">
      <div class="d-flex align-items-center gap-2">
        <span class="text-body-secondary small">Showing</span>
        <span class="fs-5 fw-semibold lh-1">{{ data.filteredEntries.value.length }}</span>
        <span class="text-body-secondary small">of {{ data.entries.value.length }}</span>
      </div>

      <div class="vr d-none d-sm-block"></div>

      <div class="d-flex flex-wrap align-items-center gap-2">
        <span class="text-body-secondary small">By source</span>
        <span
          v-for="p in providerCounts"
          :key="p.provider"
          class="badge rounded-pill"
          :class="{
            'text-bg-primary': p.provider === 'bitwarden',
            'text-bg-secondary': p.provider === 'chromium',
            'text-bg-info': p.provider === 'firefox',
            'text-bg-warning': p.provider === 'safari',
          }"
        >{{ p.label }} {{ p.count }}</span>
        <span v-if="providerCounts.length === 0" class="text-body-tertiary small">none</span>
      </div>
    </div>
  </div>
</template>
