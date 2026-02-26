<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Comprobantes</h1>
      <p class="text-sm text-gray-500 mt-1">Comprobantes de pago emitidos por MiTienda</p>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="text-sm text-gray-500">Total Facturado</div>
        <div class="text-2xl font-bold text-gray-900 mt-1">{{ formatCurrency(store.invoicesSummary.total_facturado) }}</div>
        <div class="text-xs text-gray-400 mt-1">{{ store.invoicesSummary.count }} comprobantes</div>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="text-sm text-gray-500">Pagado</div>
        <div class="text-2xl font-bold text-green-600 mt-1">{{ formatCurrency(store.invoicesSummary.total_pagado) }}</div>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="text-sm text-gray-500">Pendiente</div>
        <div class="text-2xl font-bold text-orange-500 mt-1">{{ formatCurrency(store.invoicesSummary.total_pendiente) }}</div>
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
              placeholder="Buscar comprobante, RUC..."
              class="w-full"
              @keyup.enter="applySearch"
            />
          </span>
        </div>
        <Dropdown
          v-model="statusFilter"
          :options="statusOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Estado"
          class="w-40"
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
        <Column field="comprobante" header="Comprobante" style="min-width: 150px">
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

        <Column field="tipo" header="Tipo" style="width: 100px">
          <template #body="{ data: row }">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              :class="row.tipo === 'Factura' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'"
            >
              {{ row.tipo }}
            </span>
          </template>
        </Column>

        <Column field="documento" header="Documento" style="min-width: 120px">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-600 font-mono">{{ row.documento }}</span>
          </template>
        </Column>

        <Column field="razon_social" header="Razon Social" style="min-width: 200px">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-700">{{ row.razon_social }}</span>
          </template>
        </Column>

        <Column field="fecha_emision" header="Fecha Emision" style="width: 120px">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-600">{{ formatDate(row.fecha_emision) }}</span>
          </template>
        </Column>

        <Column field="monto" header="Monto" style="min-width: 110px">
          <template #body="{ data: row }">
            <span class="text-sm font-semibold text-gray-800 text-right block">{{ formatCurrency(row.monto) }}</span>
          </template>
        </Column>

        <Column field="sw_pago" header="Estado" style="width: 100px">
          <template #body="{ data: row }">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              :class="row.sw_pago === 1 ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'"
            >
              {{ row.sw_pago === 1 ? 'Pagado' : 'Pendiente' }}
            </span>
          </template>
        </Column>

        <Column field="fechapago" header="Fecha Pago" style="width: 110px">
          <template #body="{ data: row }">
            <span v-if="row.fechapago" class="text-sm text-gray-600">{{ formatDate(row.fechapago) }}</span>
            <span v-else class="text-sm text-gray-300">-</span>
          </template>
        </Column>

        <Column field="banco" header="Banco" style="width: 100px">
          <template #body="{ data: row }">
            <span v-if="row.banco" class="text-sm text-gray-600">{{ row.banco }}</span>
            <span v-else class="text-sm text-gray-300">-</span>
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
const { formatCurrency, formatDate } = useFormatters()

const searchQuery = ref('')
const statusFilter = ref('all')

const statusOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Pagado', value: 'paid' },
  { label: 'Pendiente', value: 'pending' }
]

const hasActiveFilters = computed(() =>
  searchQuery.value || statusFilter.value !== 'all'
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

function applySearch() {
  store.updateInvoicesFilters({ search: searchQuery.value })
}

function applyFilters() {
  store.updateInvoicesFilters({
    search: searchQuery.value,
    status: statusFilter.value
  })
}

function clearFilters() {
  searchQuery.value = ''
  statusFilter.value = 'all'
  store.updateInvoicesFilters({ search: '', status: 'all', page: 1 })
}

onMounted(() => {
  store.fetchInvoices()
})
</script>
