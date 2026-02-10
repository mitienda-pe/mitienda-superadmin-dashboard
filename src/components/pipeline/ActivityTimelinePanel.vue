<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <h3 class="text-sm font-semibold text-gray-700 mb-4">Actividad</h3>

    <!-- Add note form -->
    <div class="mb-4 p-3 bg-gray-50 rounded-lg">
      <Textarea
        v-model="newNote"
        placeholder="Agregar nota..."
        rows="2"
        class="w-full mb-2"
        :autoResize="true"
      />
      <div class="flex items-center gap-2">
        <Dropdown
          v-model="noteType"
          :options="noteTypes"
          optionLabel="label"
          optionValue="value"
          class="w-40"
          placeholder="Tipo"
        />
        <Button
          label="Agregar"
          icon="pi pi-plus"
          size="small"
          :loading="isSaving"
          :disabled="!newNote.trim()"
          @click="handleAddNote"
        />
      </div>
    </div>

    <!-- Timeline -->
    <div v-if="timeline.length === 0" class="text-center py-6 text-gray-400 text-sm">
      Sin actividad registrada
    </div>

    <div v-else class="space-y-3 max-h-[500px] overflow-y-auto">
      <div
        v-for="item in timeline"
        :key="item.id + item.type"
        class="flex gap-3 p-3 rounded-lg"
        :class="item.type === 'note' ? 'bg-blue-50/50' : 'bg-purple-50/50'"
      >
        <div class="shrink-0 mt-0.5">
          <i
            :class="item.type === 'note' ? getNoteIcon(item.note_type) : 'pi pi-arrow-right'"
            class="text-sm"
            :style="{ color: item.type === 'note' ? '#3b82f6' : '#8b5cf6' }"
          ></i>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="text-xs font-medium text-gray-700">{{ item.user_name }}</span>
            <span class="text-[10px] text-gray-400">{{ formatTimeAgo(item.created_at) }}</span>
          </div>

          <!-- Note content -->
          <template v-if="item.type === 'note'">
            <p class="text-sm text-gray-700 whitespace-pre-line">{{ item.content }}</p>
            <span class="inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">
              {{ getNoteTypeLabel(item.note_type) }}
            </span>
          </template>

          <!-- Stage change -->
          <template v-else>
            <p class="text-sm text-gray-700">
              <PipelineStageBadge v-if="item.from_stage" :stage="item.from_stage" />
              <span class="mx-1.5 text-gray-400">→</span>
              <PipelineStageBadge :stage="item.to_stage" />
            </p>
            <p v-if="item.reason" class="text-xs text-gray-500 mt-1 italic">{{ item.reason }}</p>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import PipelineStageBadge from './PipelineStageBadge.vue'
import type { PipelineNote, PipelineStageHistory, PipelineStage } from '@/types/pipeline.types'
import { usePipelineStore } from '@/stores/pipeline.store'

const props = defineProps<{
  notes: PipelineNote[]
  stageHistory: PipelineStageHistory[]
  tiendaId: number
}>()

const pipelineStore = usePipelineStore()
const toast = useToast()
const newNote = ref('')
const noteType = ref('nota')
const isSaving = ref(false)

const noteTypes = [
  { label: 'Nota', value: 'nota' },
  { label: 'Llamada', value: 'llamada' },
  { label: 'WhatsApp', value: 'whatsapp' },
  { label: 'Email', value: 'email' },
  { label: 'Reunión', value: 'reunion' },
  { label: 'Otro', value: 'otro' },
]

interface TimelineItem {
  id: number
  type: 'note' | 'stage_change'
  created_at: string
  user_name: string
  // Note fields
  content?: string
  note_type?: string
  // Stage change fields
  from_stage?: PipelineStage
  to_stage: PipelineStage
  reason?: string | null
}

const timeline = computed<TimelineItem[]>(() => {
  const items: TimelineItem[] = []

  for (const note of props.notes) {
    items.push({
      id: note.id,
      type: 'note',
      created_at: note.created_at,
      user_name: note.user_name,
      content: note.content,
      note_type: note.note_type,
      to_stage: 'new_signup', // unused for notes
    })
  }

  for (const change of props.stageHistory) {
    items.push({
      id: change.id,
      type: 'stage_change',
      created_at: change.created_at,
      user_name: change.changed_by === 'system' ? 'Sistema' : 'Admin',
      from_stage: change.from_stage as PipelineStage,
      to_stage: change.to_stage as PipelineStage,
      reason: change.reason,
    })
  }

  items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return items
})

function getNoteIcon(type?: string): string {
  const icons: Record<string, string> = {
    nota: 'pi pi-file-edit',
    llamada: 'pi pi-phone',
    whatsapp: 'pi pi-whatsapp',
    email: 'pi pi-envelope',
    reunion: 'pi pi-users',
    otro: 'pi pi-comment',
  }
  return icons[type || 'nota'] || 'pi pi-file-edit'
}

function getNoteTypeLabel(type?: string): string {
  const labels: Record<string, string> = {
    nota: 'Nota',
    llamada: 'Llamada',
    whatsapp: 'WhatsApp',
    email: 'Email',
    reunion: 'Reunión',
    otro: 'Otro',
  }
  return labels[type || 'nota'] || 'Nota'
}

function formatTimeAgo(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Ahora'
  if (diffMin < 60) return `Hace ${diffMin}m`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `Hace ${diffHr}h`
  const diffDays = Math.floor(diffHr / 24)
  if (diffDays < 30) return `Hace ${diffDays}d`
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
}

async function handleAddNote() {
  if (!newNote.value.trim()) return
  isSaving.value = true
  try {
    await pipelineStore.addNote(props.tiendaId, newNote.value.trim(), noteType.value)
    newNote.value = ''
    toast.add({ severity: 'success', summary: 'Nota agregada', life: 2000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Error al agregar nota', life: 3000 })
  } finally {
    isSaving.value = false
  }
}
</script>
