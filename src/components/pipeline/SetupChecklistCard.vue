<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <h3 class="text-sm font-semibold text-gray-700 mb-3">Progreso de Configuración</h3>

    <div class="space-y-2">
      <div
        v-for="item in checklist"
        :key="item.label"
        class="flex items-center gap-3 p-2 rounded-lg"
        :class="item.done ? 'bg-green-50' : 'bg-gray-50'"
      >
        <i
          :class="item.done ? 'pi pi-check-circle text-green-500' : 'pi pi-circle text-gray-300'"
          class="text-sm"
        ></i>
        <span class="text-sm" :class="item.done ? 'text-green-700 font-medium' : 'text-gray-500'">
          {{ item.label }}
        </span>
        <span v-if="item.detail" class="ml-auto text-xs text-gray-400">{{ item.detail }}</span>
      </div>
    </div>

    <!-- Progress bar -->
    <div class="mt-4">
      <div class="flex justify-between text-xs text-gray-500 mb-1">
        <span>{{ completedCount }}/{{ checklist.length }} completados</span>
        <span>{{ Math.round((completedCount / checklist.length) * 100) }}%</span>
      </div>
      <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          class="h-full rounded-full transition-all duration-300"
          :class="completedCount === checklist.length ? 'bg-green-500' : 'bg-blue-500'"
          :style="{ width: `${(completedCount / checklist.length) * 100}%` }"
        ></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { PipelineLeadDetail } from '@/types/pipeline.types'

const props = defineProps<{
  lead: PipelineLeadDetail
}>()

const checklist = computed(() => [
  {
    label: 'Productos publicados',
    done: props.lead.published_product_count > 0,
    detail: props.lead.published_product_count > 0 ? `${props.lead.published_product_count} productos` : null,
  },
  {
    label: 'Pasarela de pago',
    done: props.lead.has_gateway === 1,
    detail: props.lead.gateway_names.length > 0 ? props.lead.gateway_names.join(', ') : null,
  },
  {
    label: 'Logo configurado',
    done: props.lead.has_logo === 1,
    detail: null,
  },
  {
    label: 'Envios configurados',
    done: props.lead.has_shipping_config === 1,
    detail: null,
  },
  {
    label: 'Primera venta realizada',
    done: props.lead.paid_orders > 0,
    detail: props.lead.paid_orders > 0 ? `${props.lead.paid_orders} ventas` : null,
  },
])

const completedCount = computed(() => checklist.value.filter(i => i.done).length)
</script>
