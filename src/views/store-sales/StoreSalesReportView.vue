<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between flex-wrap gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Ventas de Tiendas</h1>
        <p class="text-sm text-gray-500 mt-1">
          Resumen de ventas pagadas por tienda en un rango de fechas.
        </p>
      </div>
      <Button
        icon="pi pi-download"
        label="Exportar CSV"
        outlined
        :disabled="!rows.length"
        @click="exportCsv"
      />
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div class="flex flex-wrap items-end gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-500 font-medium">Desde</label>
          <Calendar
            v-model="dateFrom"
            dateFormat="dd/mm/yy"
            showIcon
            :maxDate="dateTo || undefined"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-500 font-medium">Hasta</label>
          <Calendar
            v-model="dateTo"
            dateFormat="dd/mm/yy"
            showIcon
            :minDate="dateFrom || undefined"
            :maxDate="today"
          />
        </div>
        <div class="flex flex-wrap gap-2 ml-auto">
          <Button
            v-for="preset in presets"
            :key="preset.label"
            :label="preset.label"
            size="small"
            text
            @click="applyPreset(preset)"
          />
        </div>
      </div>

      <div class="flex flex-wrap items-end gap-3">
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-500 font-medium">Plan</label>
          <Dropdown
            v-model="planFilter"
            :options="planOptions"
            optionLabel="label"
            optionValue="value"
            class="w-44"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-500 font-medium">Estado</label>
          <Dropdown
            v-model="statusFilter"
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            class="w-40"
          />
        </div>
        <div class="flex flex-col gap-1">
          <label class="text-xs text-gray-500 font-medium">Tipo</label>
          <Dropdown
            v-model="flagFilter"
            :options="flagOptions"
            optionLabel="label"
            optionValue="value"
            class="w-44"
          />
        </div>
        <Button label="Aplicar" icon="pi pi-search" @click="applyRange" />
        <Button label="Limpiar" icon="pi pi-times" text @click="clearFilters" />
      </div>
    </div>

    <!-- Error -->
    <div v-if="store.error" class="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
      {{ store.error }}
    </div>

    <!-- KPI cards -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <template v-if="store.isLoading">
        <div
          v-for="n in 5"
          :key="n"
          class="bg-white rounded-xl border border-gray-200 p-5 animate-pulse"
        >
          <div class="h-4 w-24 bg-gray-200 rounded mb-3"></div>
          <div class="h-7 w-20 bg-gray-200 rounded"></div>
        </div>
      </template>
      <template v-else>
        <KpiCard title="Transacciones" :value="totals.transactions" format="number" />
        <KpiCard title="Monto total" :value="totals.total_amount" format="currency" />
        <KpiCard title="Ticket promedio" :value="totals.avg_ticket" format="currency" />
        <KpiCard title="Ticket más alto" :value="totals.highest_ticket" format="currency" />
        <KpiCard title="Ticket más bajo" :value="totals.lowest_ticket" format="currency" />
      </template>
    </div>

    <!-- Per-store table -->
    <div class="bg-white rounded-xl border border-gray-200">
      <div class="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 class="text-base font-semibold text-gray-900">Desglose por tienda</h2>
        <span v-if="!store.isLoading" class="text-sm text-gray-500">
          {{ rows.length }} {{ rows.length === 1 ? 'tienda' : 'tiendas' }}
        </span>
      </div>

      <div v-if="store.isLoading" class="flex justify-center py-12">
        <ProgressSpinner style="width: 40px; height: 40px" />
      </div>

      <div v-else-if="!rows.length" class="p-12 text-center">
        <i class="pi pi-chart-bar text-gray-300 text-5xl mb-4" />
        <h3 class="text-lg font-medium text-gray-900 mb-2">Sin ventas</h3>
        <p class="text-gray-500">No hay ventas pagadas en el rango seleccionado.</p>
      </div>

      <DataTable
        v-else
        :value="rows"
        stripedRows
        responsiveLayout="scroll"
        sortField="total_amount"
        :sortOrder="-1"
        paginator
        :rows="25"
        :rowsPerPageOptions="[25, 50, 100]"
      >
        <Column field="name" header="Tienda" sortable>
          <template #body="{ data }">
            <div class="font-medium text-gray-900">
              {{ data.name || '#' + data.id }}
              <span
                v-if="data.flag === 'internal'"
                class="ml-1 inline-flex items-center px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 text-[10px] font-semibold uppercase"
              >Interna</span>
              <span
                v-else-if="data.flag === 'corporate'"
                class="ml-1 inline-flex items-center px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 text-[10px] font-semibold uppercase"
              >Corp</span>
            </div>
            <div v-if="data.slug" class="text-xs text-gray-500">{{ data.slug }}</div>
          </template>
        </Column>
        <Column field="plan" header="Plan" sortable style="width: 130px">
          <template #body="{ data }">
            <span class="text-sm text-gray-700">{{ data.plan || '—' }}</span>
          </template>
        </Column>
        <Column field="status" header="Estado" sortable style="width: 110px">
          <template #body="{ data }">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
              :class="data.status === 'vigente' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
            >
              {{ data.status === 'vigente' ? 'Vigente' : 'Vencido' }}
            </span>
          </template>
        </Column>
        <Column field="transactions" header="Transacciones" sortable style="width: 130px">
          <template #body="{ data }">
            <span class="text-gray-900">{{ formatNumber(data.transactions) }}</span>
          </template>
        </Column>
        <Column field="total_amount" header="Monto total" sortable style="width: 140px">
          <template #body="{ data }">
            <span class="font-semibold text-gray-900">{{ formatCurrency(data.total_amount) }}</span>
          </template>
        </Column>
        <Column field="avg_ticket" header="Ticket prom." sortable style="width: 130px">
          <template #body="{ data }">
            <span class="text-gray-700">{{ formatCurrency(data.avg_ticket) }}</span>
          </template>
        </Column>
        <Column field="highest_ticket" header="Ticket más alto" sortable style="width: 140px">
          <template #body="{ data }">
            <span class="text-gray-700">{{ formatCurrency(data.highest_ticket) }}</span>
          </template>
        </Column>
        <Column field="lowest_ticket" header="Ticket más bajo" sortable style="width: 140px">
          <template #body="{ data }">
            <span class="text-gray-700">{{ formatCurrency(data.lowest_ticket) }}</span>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { format, subDays, startOfMonth } from 'date-fns'
import Calendar from 'primevue/calendar'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import ProgressSpinner from 'primevue/progressspinner'
import KpiCard from '@/components/ui/KpiCard.vue'
import { useStoreSalesStore } from '@/stores/store-sales.store'
import { useFormatters } from '@/composables/useFormatters'
import type { StoreSalesTotals } from '@/types/store-sales.types'

const store = useStoreSalesStore()
const { formatCurrency, formatNumber } = useFormatters()

const today = new Date()
const dateFrom = ref<Date | null>(subDays(today, 29))
const dateTo = ref<Date | null>(today)

const planFilter = ref('')
const statusFilter = ref('')
const flagFilter = ref('')

const planOptions = [
  { label: 'Todos los planes', value: '' },
  { label: 'Prueba gratis', value: 'trial' },
  { label: 'Micro', value: 'micro' },
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' },
  { label: 'POS', value: 'pos' },
  { label: 'Otros', value: 'otros' }
]

const statusOptions = [
  { label: 'Todos', value: '' },
  { label: 'Vigente', value: 'vigente' },
  { label: 'Vencido', value: 'vencido' }
]

const flagOptions = [
  { label: 'Excluir internas', value: '' },
  { label: 'Todos los tipos', value: 'all' },
  { label: 'Interna', value: 'internal' },
  { label: 'Corporativa', value: 'corporate' }
]

const emptyTotals: StoreSalesTotals = {
  transactions: 0,
  total_amount: 0,
  avg_ticket: 0,
  highest_ticket: 0,
  lowest_ticket: 0
}

const totals = computed<StoreSalesTotals>(() => store.data?.totals ?? emptyTotals)
const rows = computed(() => store.data?.stores ?? [])

interface Preset {
  label: string
  from: () => Date
  to: () => Date
}

const presets: Preset[] = [
  { label: 'Hoy', from: () => new Date(), to: () => new Date() },
  { label: '7 días', from: () => subDays(new Date(), 6), to: () => new Date() },
  { label: '30 días', from: () => subDays(new Date(), 29), to: () => new Date() },
  { label: 'Este mes', from: () => startOfMonth(new Date()), to: () => new Date() }
]

function toISODate(d: Date): string {
  return format(d, 'yyyy-MM-dd')
}

function applyRange() {
  if (!dateFrom.value || !dateTo.value) return
  store.fetchReport({
    start: toISODate(dateFrom.value),
    end: toISODate(dateTo.value),
    plan: planFilter.value,
    status: statusFilter.value,
    flag: flagFilter.value
  })
}

function applyPreset(preset: Preset) {
  dateFrom.value = preset.from()
  dateTo.value = preset.to()
  applyRange()
}

function clearFilters() {
  planFilter.value = ''
  statusFilter.value = ''
  flagFilter.value = ''
  applyRange()
}

function exportCsv() {
  const headers = ['Tienda', 'Slug', 'Plan', 'Estado', 'Transacciones', 'Monto total', 'Ticket promedio', 'Ticket más alto', 'Ticket más bajo']
  const escape = (v: string | number) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const lines = rows.value.map(r =>
    [r.name, r.slug, r.plan ?? '', r.status, r.transactions, r.total_amount, r.avg_ticket, r.highest_ticket, r.lowest_ticket]
      .map(escape)
      .join(',')
  )
  const csv = [headers.map(escape).join(','), ...lines].join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ventas-tiendas_${store.data?.start ?? ''}_${store.data?.end ?? ''}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  applyRange()
})
</script>
