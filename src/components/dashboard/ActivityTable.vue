<template>
  <div class="bg-white rounded-xl border border-gray-200">
    <div class="p-5 border-b border-gray-100">
      <h3 class="text-base font-semibold text-gray-800">Top 20 Tiendas - Actividad Reciente</h3>
    </div>
    <DataTable
      :value="data"
      :rows="20"
      stripedRows
      class="p-datatable-sm"
    >
      <Column field="name" header="Tienda" :sortable="true">
        <template #body="{ data: row }">
          <span class="font-medium text-gray-800">{{ row.name }}</span>
        </template>
      </Column>

      <Column field="plan" header="Plan" :sortable="true">
        <template #body="{ data: row }">
          <span class="text-sm text-gray-600">{{ row.plan }}</span>
        </template>
      </Column>

      <Column field="current_month_sales" header="Ventas (mes)" :sortable="true">
        <template #body="{ data: row }">
          <div class="text-right">
            <span class="text-sm font-semibold text-gray-800">{{ formatCurrency(row.current_month_sales) }}</span>
            <div class="text-xs text-gray-400">{{ formatNumber(row.current_month_orders) }} pedidos</div>
          </div>
        </template>
      </Column>

      <Column field="prev_month_sales" header="Mes anterior" :sortable="true">
        <template #body="{ data: row }">
          <div class="text-right">
            <span class="text-sm text-gray-600">{{ formatCurrency(row.prev_month_sales) }}</span>
            <div v-if="row.change_percent !== 0" class="text-xs" :class="row.change_percent >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ row.change_percent >= 0 ? '+' : '' }}{{ row.change_percent }}%
            </div>
          </div>
        </template>
      </Column>

      <Column field="health_score" header="Salud" :sortable="true">
        <template #body="{ data: row }">
          <HealthBadge :label="classificationLabel(row.classification)" :score="row.health_score" />
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import HealthBadge from '@/components/ui/HealthBadge.vue'
import { useFormatters } from '@/composables/useFormatters'
import type { StoreActivity } from '@/types/dashboard.types'

defineProps<{
  data: StoreActivity[]
}>()

const { formatCurrency, formatNumber } = useFormatters()

function classificationLabel(classification: string): string {
  const labels: Record<string, string> = {
    healthy: 'Saludable',
    observation: 'Estable',
    at_risk: 'En riesgo',
    critical: 'Crítico'
  }
  return labels[classification] || classification
}
</script>
