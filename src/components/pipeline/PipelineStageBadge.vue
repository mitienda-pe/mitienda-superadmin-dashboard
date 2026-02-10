<template>
  <span
    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
    :style="{ backgroundColor: stageInfo.bg, color: stageInfo.color }"
  >
    <i :class="stageInfo.icon" class="text-[10px]"></i>
    {{ stageInfo.label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PipelineStage } from '@/types/pipeline.types'

const props = defineProps<{
  stage: PipelineStage
}>()

const STAGE_MAP: Record<PipelineStage, { label: string; color: string; bg: string; icon: string }> = {
  new_signup:     { label: 'Nuevo',           color: '#4f46e5', bg: '#eef2ff', icon: 'pi pi-star' },
  exploring:      { label: 'Explorando',      color: '#7c3aed', bg: '#f5f3ff', icon: 'pi pi-search' },
  building:       { label: 'Construyendo',    color: '#2563eb', bg: '#eff6ff', icon: 'pi pi-wrench' },
  ready_to_sell:  { label: 'Listo p/ vender', color: '#d97706', bg: '#fffbeb', icon: 'pi pi-check-circle' },
  first_sale:     { label: 'Primera venta',   color: '#059669', bg: '#ecfdf5', icon: 'pi pi-shopping-cart' },
  activated:      { label: 'Activado',        color: '#047857', bg: '#d1fae5', icon: 'pi pi-bolt' },
  stalled:        { label: 'Estancado',       color: '#dc2626', bg: '#fef2f2', icon: 'pi pi-pause' },
  expired:        { label: 'Expirado',        color: '#6b7280', bg: '#f3f4f6', icon: 'pi pi-times-circle' },
  converted:      { label: 'Convertido',      color: '#16a34a', bg: '#dcfce7', icon: 'pi pi-trophy' },
}

const stageInfo = computed(() => STAGE_MAP[props.stage] || STAGE_MAP.new_signup)
</script>
