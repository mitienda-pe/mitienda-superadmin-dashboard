<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Ventas de Planes</h1>
      <p class="text-sm text-gray-500 mt-1">Renovaciones y pagos de suscripciones</p>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="text-sm text-gray-500">Total Ventas</div>
        <div class="text-2xl font-bold text-gray-900 mt-1">{{ formatCurrency(store.planSalesSummary.total_ventas) }}</div>
        <div class="text-xs text-gray-400 mt-1">{{ store.planSalesSummary.count }} transacciones</div>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="text-sm text-gray-500">Facturado</div>
        <div class="text-2xl font-bold text-green-600 mt-1">{{ formatCurrency(store.planSalesSummary.total_facturado) }}</div>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="text-sm text-gray-500">Pendiente Facturar</div>
        <div class="text-2xl font-bold text-orange-500 mt-1">{{ formatCurrency(store.planSalesSummary.total_pendiente) }}</div>
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
              placeholder="Buscar tienda, referencia, RUC..."
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
          v-model="invoicedFilter"
          :options="invoicedOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Facturacion"
          class="w-44"
          @change="applyFilters"
        />
        <Dropdown
          v-model="planFilter"
          :options="planOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Plan"
          class="w-36"
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
    <div v-if="store.planSalesLoading && store.planSales.length === 0" class="space-y-4">
      <div v-for="i in 5" :key="i" class="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div class="h-3 bg-gray-100 rounded w-1/2"></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="store.planSalesError" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-2"></i>
      <p class="text-red-700 font-medium">{{ store.planSalesError }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="store.fetchPlanSales()" />
    </div>

    <!-- Empty -->
    <div v-else-if="!store.planSalesLoading && store.planSales.length === 0" class="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <i class="pi pi-file text-4xl text-gray-300 mb-3"></i>
      <p class="text-gray-500 font-medium">Sin ventas de planes</p>
      <p class="text-sm text-gray-400 mt-1">No se encontraron transacciones con los filtros seleccionados</p>
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-xl border border-gray-200">
      <DataTable
        :value="store.planSales"
        :loading="store.planSalesLoading"
        stripedRows
        class="p-datatable-sm"
      >
        <Column field="tienda_nombre" header="Tienda" style="min-width: 180px">
          <template #body="{ data: row }">
            <router-link
              v-if="row.tienda_id"
              :to="`/stores/${row.tienda_id}`"
              class="text-primary-600 hover:underline font-medium"
            >
              {{ row.tienda_nombre }}
            </router-link>
            <span v-else class="text-sm text-gray-400">{{ row.tienda_nombre }}</span>
          </template>
        </Column>

        <Column field="plan" header="Plan" style="width: 90px">
          <template #body="{ data: row }">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              :class="planBadgeClass(row.plan)"
            >
              {{ row.plan }}
            </span>
          </template>
        </Column>

        <Column field="precio" header="Monto" style="min-width: 100px">
          <template #body="{ data: row }">
            <span class="text-sm font-semibold text-gray-800 text-right block">{{ formatCurrency(row.precio) }}</span>
          </template>
        </Column>

        <Column field="fecha_pago" header="Fecha Pago" style="width: 110px">
          <template #body="{ data: row }">
            <span v-if="row.fecha_pago" class="text-sm text-gray-600">{{ formatDate(row.fecha_pago) }}</span>
            <span v-else class="text-sm text-gray-300">-</span>
          </template>
        </Column>

        <Column field="fecha_final" header="Vigencia" style="width: 110px">
          <template #body="{ data: row }">
            <span v-if="row.fecha_final" class="text-sm text-gray-600">{{ formatDate(row.fecha_final) }}</span>
            <span v-else class="text-sm text-gray-300">-</span>
          </template>
        </Column>

        <Column field="referencia" header="Referencia" style="width: 120px">
          <template #body="{ data: row }">
            <span class="text-xs text-gray-500 font-mono">{{ row.referencia }}</span>
          </template>
        </Column>

        <Column field="documento" header="Documento" style="min-width: 110px">
          <template #body="{ data: row }">
            <span v-if="row.documento" class="text-sm text-gray-600 font-mono">{{ row.documento }}</span>
            <span v-else class="text-sm text-gray-300">-</span>
          </template>
        </Column>

        <Column field="razon_social" header="Razon Social" style="min-width: 160px">
          <template #body="{ data: row }">
            <span v-if="row.razon_social" class="text-sm text-gray-700">{{ row.razon_social }}</span>
            <span v-else class="text-sm text-gray-300">-</span>
          </template>
        </Column>

        <Column field="sw_facturado" header="Facturado" style="width: 110px">
          <template #body="{ data: row }">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              :class="row.sw_facturado === 1 ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'"
            >
              {{ row.sw_facturado === 1 ? 'Facturado' : 'Pendiente' }}
            </span>
          </template>
        </Column>

        <Column field="comprobante" header="Comprobante" style="width: 150px">
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
      <div v-if="store.planSalesMeta.total_pages > 1" class="flex items-center justify-between px-5 py-3 border-t border-gray-100">
        <span class="text-sm text-gray-500">
          Pagina {{ store.planSalesMeta.current_page }} de {{ store.planSalesMeta.total_pages }}
          ({{ store.planSalesMeta.total }} registros)
        </span>
        <div class="flex gap-1">
          <Button
            icon="pi pi-chevron-left"
            text
            rounded
            size="small"
            :disabled="store.planSalesMeta.current_page <= 1"
            @click="store.planSalesGoToPage(store.planSalesMeta.current_page - 1)"
          />
          <Button
            v-for="p in visiblePages"
            :key="p"
            :label="String(p)"
            :text="p !== store.planSalesMeta.current_page"
            :outlined="p === store.planSalesMeta.current_page"
            rounded
            size="small"
            @click="store.planSalesGoToPage(p)"
          />
          <Button
            icon="pi pi-chevron-right"
            text
            rounded
            size="small"
            :disabled="store.planSalesMeta.current_page >= store.planSalesMeta.total_pages"
            @click="store.planSalesGoToPage(store.planSalesMeta.current_page + 1)"
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

function getPreviousMonth(): string {
  const now = new Date()
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const y = prev.getFullYear()
  const m = String(prev.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

const searchQuery = ref('')
const periodFilter = ref(getPreviousMonth())
const invoicedFilter = ref('all')
const planFilter = ref('')

const invoicedOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Facturado', value: 'yes' },
  { label: 'Pendiente', value: 'no' }
]

const planOptions = [
  { label: 'Todos', value: '' },
  { label: 'Micro', value: 'micro' },
  { label: 'Small', value: 'small' },
  { label: 'Medium', value: 'medium' },
  { label: 'Large', value: 'large' }
]

const hasActiveFilters = computed(() =>
  searchQuery.value || periodFilter.value || invoicedFilter.value !== 'all' || planFilter.value
)

const visiblePages = computed(() => {
  const current = store.planSalesMeta.current_page
  const total = store.planSalesMeta.total_pages
  const pages: number[] = []
  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

function planBadgeClass(plan: string): string {
  const classes: Record<string, string> = {
    Micro: 'bg-gray-100 text-gray-600',
    Small: 'bg-blue-50 text-blue-700',
    Medium: 'bg-purple-50 text-purple-700',
    Large: 'bg-amber-50 text-amber-700'
  }
  return classes[plan] || 'bg-gray-100 text-gray-600'
}

function applySearch() {
  store.updatePlanSalesFilters({ search: searchQuery.value })
}

function applyFilters() {
  store.updatePlanSalesFilters({
    search: searchQuery.value,
    period: periodFilter.value,
    invoiced: invoicedFilter.value,
    plan: planFilter.value
  })
}

function clearFilters() {
  searchQuery.value = ''
  periodFilter.value = ''
  invoicedFilter.value = 'all'
  planFilter.value = ''
  store.updatePlanSalesFilters({ search: '', period: '', invoiced: 'all', plan: '', page: 1 })
}

onMounted(() => {
  store.updatePlanSalesFilters({ period: periodFilter.value })
})
</script>
