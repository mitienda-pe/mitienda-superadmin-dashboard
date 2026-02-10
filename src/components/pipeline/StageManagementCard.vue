<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <h3 class="text-sm font-semibold text-gray-700 mb-3">Etapa del Pipeline</h3>

    <div class="mb-3">
      <PipelineStageBadge :stage="currentStage" />
      <p v-if="stageChangedAt" class="text-[10px] text-gray-400 mt-1.5">
        Cambió {{ formatDate(stageChangedAt) }}
      </p>
    </div>

    <div class="space-y-2">
      <Dropdown
        v-model="selectedStage"
        :options="stageOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Cambiar etapa"
        class="w-full"
      />
      <Textarea
        v-model="reason"
        placeholder="Razón del cambio (opcional)"
        rows="2"
        class="w-full"
        :autoResize="true"
      />
      <Button
        label="Cambiar Etapa"
        icon="pi pi-check"
        size="small"
        class="w-full"
        :loading="isSaving"
        :disabled="!selectedStage || selectedStage === currentStage"
        @click="handleChangeStage"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import { useToast } from 'primevue/usetoast'
import PipelineStageBadge from './PipelineStageBadge.vue'
import { PIPELINE_STAGES, type PipelineStage } from '@/types/pipeline.types'
import { usePipelineStore } from '@/stores/pipeline.store'
import { useFormatters } from '@/composables/useFormatters'

const props = defineProps<{
  currentStage: PipelineStage
  stageChangedAt: string | null
  tiendaId: number
}>()

const pipelineStore = usePipelineStore()
const toast = useToast()
const { formatDate } = useFormatters()

const selectedStage = ref<PipelineStage>(props.currentStage)
const reason = ref('')
const isSaving = ref(false)

const stageOptions = PIPELINE_STAGES.map(s => ({
  value: s.value,
  label: s.label,
}))

async function handleChangeStage() {
  if (!selectedStage.value || selectedStage.value === props.currentStage) return
  isSaving.value = true
  try {
    await pipelineStore.changeLeadStage(props.tiendaId, selectedStage.value, reason.value || undefined)
    reason.value = ''
    toast.add({ severity: 'success', summary: 'Etapa actualizada', life: 2000 })
  } catch {
    toast.add({ severity: 'error', summary: 'Error al cambiar etapa', life: 3000 })
  } finally {
    isSaving.value = false
  }
}
</script>
