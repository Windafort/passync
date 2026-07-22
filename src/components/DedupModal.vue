<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from './BaseModal.vue'
import { useData } from '../stores/data'
import { useToast } from '../stores/toast'
import type { Entry, DuplicateGroup } from '../types/entry'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const data = useData()
const toast = useToast()

const groups = ref<DuplicateGroup[]>([])
const totalToRemove = computed(() => {
  let count = 0
  groups.value.forEach((g) => count += g.remove.length)
  return count
})

watch(() => props.visible, (val) => {
  if (val) {
    groups.value = JSON.parse(JSON.stringify(data.findDuplicateGroups()))
  }
})

function swap(gi: number, ri: number): void {
  const group = groups.value[gi]
  if (!group) return
  const swapped = group.keep
  group.keep = group.remove[ri]
  group.remove[ri] = swapped
}

function confirm(): void {
  const idsToRemove: string[] = []
  groups.value.forEach((g) => {
    g.remove.forEach((r) => idsToRemove.push(r.id))
  })
  const removed = data.deleteEntries(idsToRemove)
  toast.show(`Removed ${removed} duplicate entries`, 'success')
  emit('close')
}
</script>

<template>
  <BaseModal :visible="visible" @close="$emit('close')">
    <div class="modal-header">
      <h3 class="modal-title fs-5">Duplicate Entries Found ({{ groups.length }} groups)</h3>
      <button type="button" class="btn-close" aria-label="Close" @click="$emit('close')"></button>
    </div>
    <div class="modal-body">
      <div class="alert alert-info mb-3">
        <strong>{{ totalToRemove }}</strong> duplicate entries will be removed.
        Click an entry name to swap which one is kept.
      </div>
      <div class="d-flex flex-column gap-3">
        <div v-for="(g, gi) in groups" :key="gi" class="border rounded p-3">
          <div class="fw-semibold mb-2 text-break">
            URL: {{ g.keep.url || g.keep.name }} &middot; Username: {{ g.keep.username }}
          </div>
          <div class="row g-3">
            <div class="col-6">
              <div class="badge bg-success mb-1">Keep</div>
              <div class="fw-semibold">{{ g.keep.name || '(no name)' }}</div>
            </div>
            <div class="col-6">
              <div class="badge bg-danger mb-1">Remove ({{ g.remove.length }})</div>
              <div
                v-for="(r, ri) in g.remove"
                :key="ri"
                class="text-danger text-break cursor-pointer"
                @click="swap(gi, ri)"
              >
                {{ r.name || '(no name)' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button type="button" class="btn btn-secondary" @click="$emit('close')">Cancel</button>
      <button type="button" class="btn btn-primary" @click="confirm">Remove Duplicates</button>
    </div>
  </BaseModal>
</template>

<style scoped>
.cursor-pointer { cursor: pointer; }
</style>
