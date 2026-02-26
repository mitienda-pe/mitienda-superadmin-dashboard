<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Comisiones</h1>
      <p class="text-sm text-gray-500 mt-1">Comisiones cobradas a tiendas por ventas</p>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="text-sm text-gray-500">Total Comisiones</div>
        <div class="text-2xl font-bold text-gray-900 mt-1">{{ formatCurrency(store.commissionsSummary.total_comisiones) }}</div>
        <div class="text-xs text-gray-400 mt-1">{{ store.commissionsSummary.count }} registros</div>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="text-sm text-gray-500">Pagado</div>
        <div class="text-2xl font-bold text-green-600 mt-1">{{ formatCurrency(store.commissionsSummary.total_pagado) }}</div>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="text-sm text-gray-500">Pendiente</div>
        <div class="text-2xl font-bold text-orange-500 mt-1">{{ formatCurrency(store.commissionsSummary.total_pendiente) }}</div>
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
              placeholder="Buscar tienda, RUC..."
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
    <div v-if="store.commissionsLoading && store.commissions.length === 0" class="space-y-4">
      <div v-for="i in 5" :key="i" class="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div class="h-3 bg-gray-100 rounded w-1/2"></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="store.commissionsError" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-2"></i>
      <p class="text-red-700 font-medium">{{ store.commissionsError }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="store.fetchCommissions()" />
    </div>

    <!-- Empty -->
    <div v-else-if="!store.commissionsLoading && store.commissions.length === 0" class="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <i class="pi pi-file text-4xl text-gray-300 mb-3"></i>
      <p class="text-gray-500 font-medium">Sin comisiones</p>
      <p class="text-sm text-gray-400 mt-1">No se encontraron comisiones con los filtros seleccionados</p>
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-xl border border-gray-200">
      <DataTable
        :value="store.commissions"
        :loading="store.commissionsLoading"
        stripedRows
        class="p-datatable-sm"
      >
        <Column field="tienda_nombre" header="Tienda" style="min-width: 180px">
          <template #body="{ data: row }">
            <router-link :to="`/stores/${row.tienda_id}`" class="text-primary-600 hover:underline font-medium">
              {{ row.tienda_nombre }}
            </router-link>
          </template>
        </Column>

        <Column field="documento" header="Documento" style="min-width: 120px">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-600 font-mono">{{ row.documento }}</span>
          </template>
        </Column>

        <Column field="razon_social" header="Razon Social" style="min-width: 180px">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-700">{{ row.razon_social }}</span>
          </template>
        </Column>

        <Column field="periodo" header="Periodo" style="width: 100px">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-600">{{ row.periodo }}</span>
          </template>
        </Column>

        <Column field="montoventa" header="Ventas" style="min-width: 120px">
          <template #body="{ data: row }">
            <span class="text-sm font-semibold text-gray-800 text-right block">{{ formatCurrency(row.montoventa) }}</span>
          </template>
        </Column>

        <Column field="porcentaje_display" header="%" style="width: 70px">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-600">{{ row.porcentaje_display }}</span>
          </template>
        </Column>

        <Column field="comision" header="Comision" style="min-width: 110px">
          <template #body="{ data: row }">
            <span class="text-sm font-semibold text-gray-800 text-right block">{{ formatCurrency(row.comision) }}</span>
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

        <Column field="comprobante" header="Factura" style="width: 140px">
          <template #body="{ data: row }">
            <a
              v-if="row.pdf_url"
              :href="row.pdf_url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-primary-600 hover:underline inline-flex items-center gap-1"
            >
              {{ row.comprobante }}
              <i class="pi pi-external-link text-xs"></i>
            </a>
            <span v-else-if="row.comprobante" class="text-sm text-gray-600">{{ row.comprobante }}</span>
            <span v-else class="text-sm text-gray-300">-</span>
          </template>
        </Column>
      </DataTable>

      <!-- Pagination -->
      <div v-if="store.commissionsMeta.total_pages > 1" class="flex items-center justify-between px-5 py-3 border-t border-gray-100">
        <span class="text-sm text-gray-500">
          Pagina {{ store.commissionsMeta.current_page }} de {{ store.commissionsMeta.total_pages }}
          ({{ store.commissionsMeta.total }} registros)
        </span>
        <div class="flex gap-1">
          <Button
            icon="pi pi-chevron-left"
            text
            rounded
            size="small"
            :disabled="store.commissionsMeta.current_page <= 1"
            @click="store.commissionsGoToPage(store.commissionsMeta.current_page - 1)"
          />
          <Button
            v-for="p in visiblePages"
            :key="p"
            :label="String(p)"
            :text="p !== store.commissionsMeta.current_page"
            :outlined="p === store.commissionsMeta.current_page"
            rounded
            size="small"
            @click="store.commissionsGoToPage(p)"
          />
          <Button
            icon="pi pi-chevron-right"
            text
            rounded
            size="small"
            :disabled="store.commissionsMeta.current_page >= store.commissionsMeta.total_pages"
            @click="store.commissionsGoToPage(store.commissionsMeta.current_page + 1)"
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
const periodFilter = ref('')
const statusFilter = ref('all')

const statusOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Pagado', value: 'paid' },
  { label: 'Pendiente', value: 'pending' }
]

const hasActiveFilters = computed(() =>
  searchQuery.value || periodFilter.value || statusFilter.value !== 'all'
)

const visiblePages = computed(() => {
  const current = store.commissionsMeta.current_page
  const total = store.commissionsMeta.total_pages
  const pages: number[] = []
  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

function applySearch() {
  store.updateCommissionsFilters({ search: searchQuery.value })
}

function applyFilters() {
  store.updateCommissionsFilters({
    search: searchQuery.value,
    period: periodFilter.value,
    status: statusFilter.value
  })
}

function clearFilters() {
  searchQuery.value = ''
  periodFilter.value = ''
  statusFilter.value = 'all'
  store.updateCommissionsFilters({ search: '', period: '', status: 'all', page: 1 })
}

onMounted(() => {
  store.fetchCommissions()
})
</script>
