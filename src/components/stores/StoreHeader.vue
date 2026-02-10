<template>
  <div class="bg-white rounded-xl border border-gray-200 p-6">
    <div class="flex items-start gap-6">
      <!-- Logo -->
      <div class="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
        <img v-if="store.logo" :src="`https://api2.mitienda.pe/uploads/logos/${store.logo}`" class="w-full h-full object-cover" :alt="store.name" />
        <i v-else class="pi pi-shop text-gray-400 text-2xl"></i>
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h1 class="text-xl font-bold text-gray-900">{{ store.name }}</h1>
            <a :href="store.url" target="_blank" class="text-sm text-primary-600 hover:underline">
              {{ store.url }} <i class="pi pi-external-link text-xs"></i>
            </a>
          </div>
          <HealthBadge :label="classificationLabel(store.classification)" :score="store.health_score" />
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div>
            <p class="text-xs text-gray-400 uppercase tracking-wider">Plan</p>
            <p class="text-sm font-medium text-gray-800">{{ store.plan?.name || 'Sin plan' }}</p>
            <p v-if="store.plan" class="text-xs text-gray-400">
              {{ formatCurrency(store.plan.price) }}/{{ periodLabel(store.plan.period) }}
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-400 uppercase tracking-wider">MRR</p>
            <p class="text-sm font-medium text-gray-800">{{ formatCurrency(store.plan?.mrr || 0) }}</p>
            <p v-if="store.plan" class="text-xs" :class="store.plan.days_remaining > 30 ? 'text-green-600' : store.plan.days_remaining > 7 ? 'text-yellow-600' : 'text-red-600'">
              {{ store.plan.days_remaining }} días restantes
            </p>
          </div>
          <div>
            <p class="text-xs text-gray-400 uppercase tracking-wider">Productos</p>
            <p class="text-sm font-medium text-gray-800">{{ formatNumber(store.product_count) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-400 uppercase tracking-wider">Creada</p>
            <p class="text-sm font-medium text-gray-800">{{ formatDate(store.created_at) }}</p>
          </div>
        </div>

        <!-- Owner + contact -->
        <div class="flex flex-wrap gap-4 mt-4 pt-4 border-t border-gray-100 text-sm text-gray-500">
          <span v-if="store.owner_name"><i class="pi pi-user mr-1"></i>{{ store.owner_name }}</span>
          <span v-if="store.owner_email"><i class="pi pi-envelope mr-1"></i>{{ store.owner_email }}</span>
          <span v-if="store.phone"><i class="pi pi-phone mr-1"></i>{{ store.phone }}</span>
          <span v-if="store.ruc"><i class="pi pi-building mr-1"></i>RUC: {{ store.ruc }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import HealthBadge from '@/components/ui/HealthBadge.vue'
import { useFormatters } from '@/composables/useFormatters'
import type { StoreDetail } from '@/types/store.types'

defineProps<{
  store: StoreDetail
}>()

const { formatCurrency, formatNumber, formatDate } = useFormatters()

function classificationLabel(classification: string): string {
  const labels: Record<string, string> = {
    healthy: 'Saludable', observation: 'Estable',
    at_risk: 'En riesgo', critical: 'Crítico'
  }
  return labels[classification] || classification
}

function periodLabel(period: string): string {
  const labels: Record<string, string> = {
    mensual: 'mes', trimestre: 'trim', semestre: 'sem', anual: 'año'
  }
  return labels[period] || period
}
</script>
