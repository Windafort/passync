<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Modal } from 'bootstrap'

const props = withDefaults(
  defineProps<{
    visible: boolean
    /** Bootstrap modal size modifier, e.g. 'lg' or 'xl'. */
    size?: '' | 'sm' | 'lg' | 'xl'
    /** Allow Escape / backdrop click to close. Off for the unlock gate. */
    dismissible?: boolean
    /** Scroll the modal body instead of the whole page for long content. */
    scrollable?: boolean
  }>(),
  { size: '', dismissible: true, scrollable: false }
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'shown'): void
}>()

const modalRef = ref<HTMLElement | null>(null)
let bsModal: Modal | null = null

onMounted(() => {
  if (modalRef.value) {
    bsModal = new Modal(modalRef.value, {
      backdrop: props.dismissible ? true : 'static',
      keyboard: props.dismissible,
    })
    modalRef.value.addEventListener('hidden.bs.modal', () => emit('close'))
    modalRef.value.addEventListener('shown.bs.modal', () => emit('shown'))
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
    <div
      class="modal-dialog modal-dialog-centered"
      :class="[size ? `modal-${size}` : '', { 'modal-dialog-scrollable': scrollable }]"
    >
      <div class="modal-content">
        <slot />
      </div>
    </div>
  </div>
</template>
