<template>
  <div class="bg-white rounded-xl border border-gray-200">
    <div class="p-5 border-b border-gray-100">
      <h3 class="text-base font-semibold text-gray-800">Top 10 Productos (últimos 90 días)</h3>
    </div>
    <div v-if="products.length === 0" class="p-8 text-center text-gray-400">
      Sin datos de productos
    </div>
    <DataTable v-else :value="products" stripedRows class="p-datatable-sm">
      <Column field="name" header="Producto" style="min-width: 200px">
        <template #body="{ data: row }">
          <span class="text-sm font-medium text-gray-800">{{ row.name }}</span>
        </template>
      </Column>
      <Column field="revenue" header="Ingresos" :sortable="true">
        <template #body="{ data: row }">
          <span class="text-sm font-semibold text-gray-800">{{ formatCurrency(row.revenue) }}</span>
        </template>
      </Column>
      <Column field="quantity_sold" header="Cantidad" :sortable="true">
        <template #body="{ data: row }">
          <span class="text-sm text-gray-600">{{ formatNumber(row.quantity_sold) }}</span>
        </template>
      </Column>
      <Column field="order_count" header="Pedidos" :sortable="true">
        <template #body="{ data: row }">
          <span class="text-sm text-gray-600">{{ formatNumber(row.order_count) }}</span>
        </template>
      </Column>
      <Column header="% Ingresos">
        <template #body="{ data: row }">
          <div class="flex items-center gap-2">
            <div class="flex-1 bg-gray-100 rounded-full h-2 max-w-[80px]">
              <div
                class="bg-primary-500 rounded-full h-2"
                :style="{ width: `${getRevenuePercent(row.revenue)}%` }"
              ></div>
            </div>
            <span class="text-xs text-gray-400">{{ getRevenuePercent(row.revenue).toFixed(1) }}%</span>
          </div>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { useFormatters } from '@/composables/useFormatters'
import type { TopProduct } from '@/types/store.types'

const props = defineProps<{
  products: TopProduct[]
}>()

const { formatCurrency, formatNumber } = useFormatters()

const totalRevenue = computed(() => props.products.reduce((sum, p) => sum + p.revenue, 0))

function getRevenuePercent(revenue: number): number {
  return totalRevenue.value > 0 ? (revenue / totalRevenue.value) * 100 : 0
}
</script>
