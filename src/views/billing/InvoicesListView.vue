<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Comprobantes</h1>
      <p class="text-sm text-gray-500 mt-1">Comprobantes de pago emitidos por MiTienda (suscripciones, comisiones y otros)</p>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="text-sm text-gray-500">Total Facturado</div>
        <div class="text-2xl font-bold text-gray-900 mt-1">{{ formatCurrency(store.invoicesSummary.total_monto) }}</div>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="text-sm text-gray-500">Comprobantes</div>
        <div class="text-2xl font-bold text-gray-900 mt-1">{{ formatNumber(store.invoicesSummary.count) }}</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex-1 min-w-[200px]">
          <span class="p-input-icon-left w-full">
            <i class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              placeholder="Buscar comprobante, RUC, razon social..."
              class="w-full"
              @keyup.enter="applySearch"
            />
          </span>
        </div>
        <InputText
          v-model="periodFilter"
          type="month"
          class="w-44"
          @change="applyFilters"
        />
        <Dropdown
          v-model="origenFilter"
          :options="origenOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Origen"
          class="w-44"
          @change="applyFilters"
        />
        <Button
          v-if="hasActiveFilters"
          icon="pi pi-filter-slash"
          severity="secondary"
          text
          @click="clearFilters"
          v-tooltip="'Limpiar filtros'"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.invoicesLoading && store.invoices.length === 0" class="space-y-4">
      <div v-for="i in 5" :key="i" class="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div class="h-3 bg-gray-100 rounded w-1/2"></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="store.invoicesError" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-2"></i>
      <p class="text-red-700 font-medium">{{ store.invoicesError }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="store.fetchInvoices()" />
    </div>

    <!-- Empty -->
    <div v-else-if="!store.invoicesLoading && store.invoices.length === 0" class="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <i class="pi pi-file text-4xl text-gray-300 mb-3"></i>
      <p class="text-gray-500 font-medium">Sin comprobantes</p>
      <p class="text-sm text-gray-400 mt-1">No se encontraron comprobantes con los filtros seleccionados</p>
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-xl border border-gray-200">
      <DataTable
        :value="store.invoices"
        :loading="store.invoicesLoading"
        stripedRows
        class="p-datatable-sm"
      >
        <Column field="comprobante" header="Comprobante" style="min-width: 160px">
          <template #body="{ data: row }">
            <a
              v-if="row.pdf_url"
              :href="row.pdf_url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-primary-600 hover:underline font-medium inline-flex items-center gap-1"
            >
              {{ row.comprobante }}
              <i class="pi pi-external-link text-xs"></i>
            </a>
            <span v-else class="text-sm text-gray-700 font-medium">{{ row.comprobante }}</span>
          </template>
        </Column>

        <Column field="tipo" header="Tipo" style="width: 90px">
          <template #body="{ data: row }">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              :class="row.tipo === 'Factura' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'"
            >
              {{ row.tipo }}
            </span>
          </template>
        </Column>

        <Column field="origen" header="Origen" style="width: 110px">
          <template #body="{ data: row }">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              :class="origenBadgeClass(row.origen)"
            >
              {{ row.origen }}
            </span>
          </template>
        </Column>

        <Column field="documento" header="Documento" style="min-width: 120px">
          <template #body="{ data: row }">
            <span v-if="row.documento" class="text-sm text-gray-600 font-mono">{{ row.documento }}</span>
            <span v-else class="text-sm text-gray-300">-</span>
          </template>
        </Column>

        <Column field="razon_social" header="Razon Social" style="min-width: 180px">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-700">{{ row.razon_social }}</span>
          </template>
        </Column>

        <Column field="concepto" header="Concepto" style="min-width: 140px">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-600">{{ row.concepto }}</span>
          </template>
        </Column>

        <Column field="fecha_emision" header="Fecha" style="width: 110px">
          <template #body="{ data: row }">
            <span v-if="row.fecha_emision" class="text-sm text-gray-600">{{ formatDate(row.fecha_emision) }}</span>
            <span v-else class="text-sm text-gray-300">-</span>
          </template>
        </Column>

        <Column field="monto" header="Monto" style="min-width: 100px">
          <template #body="{ data: row }">
            <span class="text-sm font-semibold text-gray-800 text-right block">{{ formatCurrency(row.monto) }}</span>
          </template>
        </Column>
      </DataTable>

      <!-- Pagination -->
      <div v-if="store.invoicesMeta.total_pages > 1" class="flex items-center justify-between px-5 py-3 border-t border-gray-100">
        <span class="text-sm text-gray-500">
          Pagina {{ store.invoicesMeta.current_page }} de {{ store.invoicesMeta.total_pages }}
          ({{ store.invoicesMeta.total }} comprobantes)
        </span>
        <div class="flex gap-1">
          <Button
            icon="pi pi-chevron-left"
            text
            rounded
            size="small"
            :disabled="store.invoicesMeta.current_page <= 1"
            @click="store.invoicesGoToPage(store.invoicesMeta.current_page - 1)"
          />
          <Button
            v-for="p in visiblePages"
            :key="p"
            :label="String(p)"
            :text="p !== store.invoicesMeta.current_page"
            :outlined="p === store.invoicesMeta.current_page"
            rounded
            size="small"
            @click="store.invoicesGoToPage(p)"
          />
          <Button
            icon="pi pi-chevron-right"
            text
            rounded
            size="small"
            :disabled="store.invoicesMeta.current_page >= store.invoicesMeta.total_pages"
            @click="store.invoicesGoToPage(store.invoicesMeta.current_page + 1)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import { useBillingStore } from '@/stores/billing.store'
import { useFormatters } from '@/composables/useFormatters'

const store = useBillingStore()
const { formatCurrency, formatDate, formatNumber } = useFormatters()

function getPreviousMonth(): string {
  const now = new Date()
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const y = prev.getFullYear()
  const m = String(prev.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

const searchQuery = ref('')
const periodFilter = ref(getPreviousMonth())
const origenFilter = ref('all')

const origenOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Suscripciones', value: 'suscripciones' },
  { label: 'Comisiones', value: 'comisiones' },
  { label: 'Otros', value: 'otros' }
]

const hasActiveFilters = computed(() =>
  searchQuery.value || periodFilter.value || origenFilter.value !== 'all'
)

const visiblePages = computed(() => {
  const current = store.invoicesMeta.current_page
  const total = store.invoicesMeta.total_pages
  const pages: number[] = []
  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

function origenBadgeClass(origen: string): string {
  const classes: Record<string, string> = {
    Suscripcion: 'bg-purple-50 text-purple-700',
    Comision: 'bg-amber-50 text-amber-700',
    Facturacion: 'bg-gray-100 text-gray-600'
  }
  return classes[origen] || 'bg-gray-100 text-gray-600'
}

function applySearch() {
  store.updateInvoicesFilters({ search: searchQuery.value })
}

function applyFilters() {
  store.updateInvoicesFilters({
    search: searchQuery.value,
    period: periodFilter.value,
    origen: origenFilter.value
  })
}

function clearFilters() {
  searchQuery.value = ''
  periodFilter.value = ''
  origenFilter.value = 'all'
  store.updateInvoicesFilters({ search: '', period: '', origen: 'all', page: 1 })
}

onMounted(() => {
  store.updateInvoicesFilters({ period: periodFilter.value })
})
</script>
