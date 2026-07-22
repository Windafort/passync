<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'files-selected', files: FileList): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)

function handleClick(): void {
  fileInput.value?.click()
}

function handleChange(event: Event): void {
  const input = event.target as HTMLInputElement
  if (input.files && input.files.length > 0) {
    emit('files-selected', input.files)
    input.value = ''
  }
}
</script>

<template>
  <div
    class="border rounded-3 p-5 text-center cursor-pointer"
    :class="{ 'bg-primary bg-opacity-10 border-primary': isDragOver }"
    style="border-style: dashed !important; border-width: 2px !important"
    @click="handleClick"
    @dragover.prevent="isDragOver = true"
    @dragleave="isDragOver = false"
    @drop.prevent="isDragOver = false; emit('files-selected', $event.dataTransfer!.files)"
  >
    <div class="fs-1 mb-2">📂</div>
    <p class="mb-1">Drop exported password files here</p>
    <p class="text-muted small mb-0">Supports: Bitwarden, Chrome, Edge, Opera, Firefox, Safari (CSV &amp; JSON, max 5MB)</p>
    <input
      ref="fileInput"
      type="file"
      accept=".csv,.json"
      multiple
      class="d-none"
      @change="handleChange"
    />
  </div>
</template>

<style scoped>
.cursor-pointer { cursor: pointer; }
</style>
