<template>
  <div class="bg-white rounded-xl border border-gray-200 p-6">
    <div class="flex items-start justify-between mb-4">
      <div>
        <h2 class="text-xl font-bold text-gray-900">{{ lead.name }}</h2>
        <p class="text-sm text-gray-500 mt-0.5">{{ lead.slug }}.mitienda.pe</p>
      </div>
      <div class="flex items-center gap-3">
        <ReadinessScoreBadge :score="lead.readiness_score" :size="52" />
        <PipelineStageBadge :stage="lead.pipeline_stage" />
      </div>
    </div>

    <!-- Owner info -->
    <div v-if="lead.owner_name" class="flex items-center gap-4 text-sm text-gray-600 mb-4">
      <span class="flex items-center gap-1.5">
        <i class="pi pi-user text-xs text-gray-400"></i>
        {{ lead.owner_name }}
      </span>
      <span v-if="lead.email" class="flex items-center gap-1.5">
        <i class="pi pi-envelope text-xs text-gray-400"></i>
        {{ lead.email }}
      </span>
      <span v-if="lead.whatsapp" class="flex items-center gap-1.5">
        <i class="pi pi-whatsapp text-xs text-gray-400"></i>
        {{ lead.whatsapp }}
      </span>
    </div>

    <!-- Key metrics -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
      <div class="text-center p-3 bg-gray-50 rounded-lg">
        <p class="text-lg font-bold text-gray-900">{{ lead.published_product_count }}</p>
        <p class="text-xs text-gray-500">Productos</p>
      </div>
      <div class="text-center p-3 bg-gray-50 rounded-lg">
        <p class="text-lg font-bold text-gray-900">{{ lead.paid_orders }}</p>
        <p class="text-xs text-gray-500">Ventas</p>
      </div>
      <div class="text-center p-3 bg-gray-50 rounded-lg">
        <p class="text-lg font-bold text-gray-900">{{ formatCurrency(lead.total_revenue) }}</p>
        <p class="text-xs text-gray-500">Revenue</p>
      </div>
      <div class="text-center p-3 rounded-lg" :class="lead.days_remaining > 7 ? 'bg-green-50' : lead.days_remaining > 0 ? 'bg-amber-50' : 'bg-red-50'">
        <p class="text-lg font-bold" :class="lead.days_remaining > 7 ? 'text-green-700' : lead.days_remaining > 0 ? 'text-amber-700' : 'text-red-700'">
          {{ lead.days_remaining }}
        </p>
        <p class="text-xs text-gray-500">Dias rest.</p>
      </div>
      <div class="text-center p-3 bg-gray-50 rounded-lg">
        <p class="text-lg font-bold text-gray-900">{{ lead.gateway_names.length > 0 ? lead.gateway_names.join(', ') : 'Ninguna' }}</p>
        <p class="text-xs text-gray-500">Pasarela</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PipelineLeadDetail } from '@/types/pipeline.types'
import ReadinessScoreBadge from './ReadinessScoreBadge.vue'
import PipelineStageBadge from './PipelineStageBadge.vue'
import { useFormatters } from '@/composables/useFormatters'

defineProps<{
  lead: PipelineLeadDetail
}>()

const { formatCurrency } = useFormatters()
</script>
