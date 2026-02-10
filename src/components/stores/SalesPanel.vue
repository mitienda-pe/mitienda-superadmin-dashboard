<template>
  <div class="space-y-6">
    <!-- Summary cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-400 uppercase tracking-wider">Ventas (mes actual)</p>
        <p class="text-xl font-bold text-gray-900 mt-1">{{ formatCurrency(sales.current_month) }}</p>
        <p class="text-xs mt-1" :class="sales.change_percent >= 0 ? 'text-green-600' : 'text-red-600'">
          {{ sales.change_percent >= 0 ? '+' : '' }}{{ sales.change_percent }}% vs mes anterior
        </p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-400 uppercase tracking-wider">Pedidos (mes actual)</p>
        <p class="text-xl font-bold text-gray-900 mt-1">{{ formatNumber(sales.current_month_orders) }}</p>
        <p class="text-xs text-gray-400 mt-1">{{ formatNumber(sales.prev_month_orders) }} mes anterior</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-400 uppercase tracking-wider">Total histórico</p>
        <p class="text-xl font-bold text-gray-900 mt-1">{{ formatCurrency(sales.lifetime_total) }}</p>
        <p class="text-xs text-gray-400 mt-1">{{ formatNumber(sales.lifetime_orders) }} pedidos</p>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-4">
        <p class="text-xs text-gray-400 uppercase tracking-wider">Ticket promedio</p>
        <p class="text-xl font-bold text-gray-900 mt-1">
          {{ formatCurrency(sales.current_month_orders > 0 ? sales.current_month / sales.current_month_orders : 0) }}
        </p>
        <p class="text-xs text-gray-400 mt-1">Último pedido: {{ sales.last_order ? formatDate(sales.last_order) : 'N/A' }}</p>
      </div>
    </div>

    <!-- Daily sales chart -->
    <DailySalesChart v-if="dailySales.length" :data="dailySales" />

    <!-- Recent orders -->
    <div v-if="orders.length" class="bg-white rounded-xl border border-gray-200">
      <div class="p-5 border-b border-gray-100">
        <h3 class="text-base font-semibold text-gray-800">Últimos 20 Pedidos</h3>
      </div>
      <DataTable :value="orders" :rows="20" stripedRows class="p-datatable-sm">
        <Column field="date" header="Fecha" :sortable="true">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-600">{{ formatDate(row.date) }}</span>
          </template>
        </Column>
        <Column field="reference_code" header="Código">
          <template #body="{ data: row }">
            <span class="text-sm font-mono text-gray-700">{{ row.reference_code || row.order_number || '-' }}</span>
          </template>
        </Column>
        <Column field="customer_name" header="Cliente">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-700">{{ row.customer_name }}</span>
          </template>
        </Column>
        <Column field="total" header="Total" :sortable="true">
          <template #body="{ data: row }">
            <span class="text-sm font-semibold text-gray-800">{{ formatCurrency(row.total) }}</span>
          </template>
        </Column>
        <Column field="item_count" header="Items">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-600">{{ row.item_count }}</span>
          </template>
        </Column>
        <Column field="status" header="Estado">
          <template #body="{ data: row }">
            <span
              class="text-xs px-2 py-0.5 rounded-full font-medium"
              :class="statusClass(row.status)"
            >{{ statusLabel(row.status) }}</span>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import DailySalesChart from '@/components/charts/DailySalesChart.vue'
import { useFormatters } from '@/composables/useFormatters'
import type { StoreSales, DailySales, StoreOrder } from '@/types/store.types'

defineProps<{
  sales: StoreSales
  dailySales: DailySales[]
  orders: StoreOrder[]
}>()

const { formatCurrency, formatNumber, formatDate } = useFormatters()

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendiente', confirmed: 'Confirmado', processing: 'Procesando',
    shipped: 'Enviado', delivered: 'Entregado', cancelled: 'Cancelado', returned: 'Devuelto'
  }
  return labels[status] || status
}

function statusClass(status: string): string {
  const classes: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700',
    confirmed: 'bg-blue-50 text-blue-700',
    processing: 'bg-indigo-50 text-indigo-700',
    shipped: 'bg-purple-50 text-purple-700',
    delivered: 'bg-green-50 text-green-700',
    cancelled: 'bg-red-50 text-red-700',
    returned: 'bg-gray-50 text-gray-700'
  }
  return classes[status] || 'bg-gray-50 text-gray-700'
}
</script>
