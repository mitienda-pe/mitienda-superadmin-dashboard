<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <h3 class="text-sm font-semibold text-gray-700 mb-3">Seguimientos</h3>

    <!-- Add form -->
    <div class="mb-3 p-3 bg-gray-50 rounded-lg space-y-2">
      <Calendar
        v-model="newDate"
        dateFormat="yy-mm-dd"
        placeholder="Fecha"
        class="w-full"
        :minDate="new Date()"
      />
      <InputText
        v-model="newDescription"
        placeholder="Descripción"
        class="w-full"
      />
      <Button
        label="Programar"
        icon="pi pi-calendar-plus"
        size="small"
        class="w-full"
        :loading="isSaving"
        :disabled="!newDate || !newDescription.trim()"
        @click="handleAdd"
      />
    </div>

    <!-- List -->
    <div v-if="followUps.length === 0" class="text-center py-4 text-gray-400 text-sm">
      Sin seguimientos
    </div>

    <div v-else class="space-y-2 max-h-[300px] overflow-y-auto">
      <div
        v-for="fu in sortedFollowUps"
        :key="fu.id"
        class="flex items-start gap-2 p-2 rounded-lg border"
        :class="fu.completed ? 'border-green-100 bg-green-50/50' : isOverdue(fu.due_date) ? 'border-red-100 bg-red-50/50' : 'border-gray-100'"
      >
        <button
          v-if="!fu.completed"
          class="mt-0.5 shrink-0 w-5 h-5 rounded border-2 border-gray-300 hover:border-green-500 transition-colors flex items-center justify-center"
          @click="handleComplete(fu.id)"
        >
        </button>
        <i v-else class="pi pi-check-circle text-green-500 text-sm mt-0.5 shrink-0"></i>

        <div class="flex-1 min-w-0">
          <p class="text-sm" :class="fu.completed ? 'text-gray-400 line-through' : 'text-gray-700'">
            {{ fu.description }}
          </p>
          <div class="flex items-center gap-2 mt-1">
            <span
              class="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              :class="fu.completed ? 'bg-green-100 text-green-600' : isOverdue(fu.due_date) ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'"
            >
              {{ fu.completed ? 'Completado' : isOverdue(fu.due_date) ? 'Vencido' : formatDueDate(fu.due_date) }}
            </span>
            <span class="text-[10px] text-gray-400">{{ fu.user_name }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Calendar from 'primevue/calendar'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import type { PipelineFollowUp } from '@/types/pipeline.types'
import { usePipelineStore } from '@/stores/pipeline.store'

const props = defineProps<{
  followUps: PipelineFollowUp[]
  tiendaId: number
}>()

const pipelineStore = usePipelineStore()
const toast = useToast()
const newDate = ref<Date | null>(null)
const newDescription = ref('')
const isSaving = ref(false)

const sortedFollowUps = computed(() =>
  [...props.followUps].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  })
)

function isOverdue(dateStr: string): boolean {
  return new Date(dateStr) < new Date(new Date().toISOString().split('T')[0])
}

function formatDueDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
}

async function handleAdd() {
  if (!newDate.value || !newDescription.value.trim()) return
  isSaving.value = true
  try {
    const dateStr = newDate.value.toISOString().split('T')[0]
    await pipelineStore.addLeadFollowUp(props.tiendaId, dateStr, newDescription.value.trim())
    newDate.value = null
    newDescription.value = ''
    toast.add({ severity: 'success', summary: 'Seguimiento programado', life: 2000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Error', life: 3000 })
  } finally {
    isSaving.value = false
  }
}

async function handleComplete(id: number) {
  try {
    await pipelineStore.markFollowUpComplete(id)
    toast.add({ severity: 'success', summary: 'Completado', life: 2000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Error', life: 3000 })
  }
}
</script>
