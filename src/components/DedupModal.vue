<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import BaseModal from './BaseModal.vue'
import { useData } from '../stores/data'
import { useToast } from '../stores/toast'
import type { DuplicateGroup } from '../types/entry'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const data = useData()
const toast = useToast()

const groups = ref<DuplicateGroup[]>([])

const totalToRemove = computed(() =>
  groups.value.reduce((count, g) => count + g.remove.length, 0)
)

watch(() => props.visible, (val) => {
  if (val) {
    groups.value = JSON.parse(JSON.stringify(data.findDuplicateGroups()))
  }
})

/** Kept entry first, then the ones queued for removal. */
function candidates(group: DuplicateGroup) {
  return [group.keep, ...group.remove]
}

/** Promote a candidate to be the one kept; index 0 is already kept. */
function keepCandidate(gi: number, index: number): void {
  if (index === 0) return
  const group = groups.value[gi]
  if (!group) return
  const ri = index - 1
  const previous = group.keep
  group.keep = group.remove[ri]
  group.remove[ri] = previous
}

function confirm(): void {
  const idsToRemove = groups.value.flatMap((g) => g.remove.map((r) => r.id))
  const removed = data.deleteEntries(idsToRemove)
  toast.show(`Removed ${removed} duplicate ${removed === 1 ? 'entry' : 'entries'}`, 'success')
  emit('close')
}
</script>

<template>
  <BaseModal :visible="visible" size="lg" scrollable @close="emit('close')">
    <div class="modal-header">
      <h2 class="modal-title h5">
        Duplicate Entries
        <span class="badge text-bg-secondary align-middle">{{ groups.length }} groups</span>
      </h2>
      <button type="button" class="btn-close" aria-label="Close" @click="emit('close')"></button>
    </div>

    <div class="modal-body">
      <div class="alert alert-info" role="status">
        <strong>{{ totalToRemove }}</strong>
        {{ totalToRemove === 1 ? 'entry' : 'entries' }} will be removed.
        Select an entry in a group to choose which copy to keep.
      </div>

      <div class="d-flex flex-column gap-3">
        <div v-for="(g, gi) in groups" :key="gi" class="card">
          <div class="card-header text-break small">
            <span class="text-body-secondary">URL</span>
            {{ g.keep.url || g.keep.name || '(none)' }}
            <span class="text-body-secondary ms-2">Username</span>
            {{ g.keep.username || '(none)' }}
          </div>
          <div class="list-group list-group-flush">
            <button
              v-for="(entry, index) in candidates(g)"
              :key="entry.id"
              type="button"
              class="list-group-item list-group-item-action d-flex justify-content-between align-items-center gap-2"
              :class="{ active: index === 0 }"
              :aria-pressed="index === 0"
              @click="keepCandidate(gi, index)"
            >
              <span class="text-break">
                {{ entry.name || '(no name)' }}
                <span v-if="entry.folder" class="opacity-75 small">&middot; {{ entry.folder }}</span>
              </span>
              <span class="badge flex-shrink-0" :class="index === 0 ? 'text-bg-light' : 'text-bg-danger'">
                {{ index === 0 ? 'Keep' : 'Remove' }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-footer">
      <button type="button" class="btn btn-outline-secondary" @click="emit('close')">Cancel</button>
      <button type="button" class="btn btn-danger" :disabled="totalToRemove === 0" @click="confirm">
        Remove {{ totalToRemove }} {{ totalToRemove === 1 ? 'duplicate' : 'duplicates' }}
      </button>
    </div>
  </BaseModal>
</template>
