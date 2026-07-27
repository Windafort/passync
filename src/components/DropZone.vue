<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  (e: 'files-selected', files: FileList): void
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)

/* dragenter/dragleave also fire when crossing child elements, so track depth
   instead of toggling a boolean, which would flicker the highlight. */
let dragDepth = 0

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

function handleDragEnter(): void {
  dragDepth += 1
  isDragOver.value = true
}

function handleDragLeave(): void {
  dragDepth = Math.max(0, dragDepth - 1)
  if (dragDepth === 0) isDragOver.value = false
}

function handleDrop(event: DragEvent): void {
  dragDepth = 0
  isDragOver.value = false
  const files = event.dataTransfer?.files
  if (files && files.length > 0) emit('files-selected', files)
}
</script>

<template>
  <div
    class="card border-2 drop-zone text-center cursor-pointer"
    :class="isDragOver ? 'border-primary bg-primary-subtle' : 'border-secondary-subtle'"
    role="button"
    tabindex="0"
    aria-label="Choose or drop exported password files"
    @click="handleClick"
    @keydown.enter.prevent="handleClick"
    @keydown.space.prevent="handleClick"
    @dragenter.prevent="handleDragEnter"
    @dragover.prevent
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <div class="card-body p-5">
      <div class="display-4 mb-3" aria-hidden="true">📂</div>
      <h2 class="h5 card-title">Drop exported password files here</h2>
      <p class="card-text text-body-secondary mb-4">or click to browse your computer</p>
      <button type="button" class="btn btn-primary" tabindex="-1">Choose files</button>
      <p class="card-text text-body-tertiary small mt-4 mb-0">
        Bitwarden, Chrome, Edge, Opera, Firefox and Safari &middot; CSV &amp; JSON &middot; max 5&nbsp;MB per file
      </p>
    </div>
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
/* Bootstrap has no dashed-border utility. */
.drop-zone {
  border-style: dashed;
}
</style>
