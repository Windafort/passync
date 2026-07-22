<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Modal } from 'bootstrap'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const modalRef = ref<HTMLElement | null>(null)
let bsModal: Modal | null = null

onMounted(() => {
  if (modalRef.value) {
    bsModal = new Modal(modalRef.value, { backdrop: 'static', keyboard: false })
    modalRef.value.addEventListener('hidden.bs.modal', () => emit('close'))
  }
})

onUnmounted(() => {
  bsModal?.dispose()
})

watch(() => props.visible, (val) => {
  nextTick(() => {
    if (val) {
      bsModal?.show()
    } else {
      bsModal?.hide()
    }
  })
})
</script>

<template>
  <div ref="modalRef" class="modal fade" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content">
        <slot />
      </div>
    </div>
  </div>
</template>
