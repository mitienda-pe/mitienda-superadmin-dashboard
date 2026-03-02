<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Suscripciones</h1>
      <p class="text-sm text-gray-500 mt-1">Gestión de suscripciones del sistema de billing</p>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="text-sm text-gray-500">Total</div>
        <div class="text-2xl font-bold text-gray-900 mt-1">{{ store.meta.total }}</div>
        <div class="text-xs text-gray-400 mt-1">suscripciones</div>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="text-sm text-gray-500">Activas</div>
        <div class="text-2xl font-bold text-green-600 mt-1">{{ activeCount }}</div>
        <div class="text-xs text-gray-400 mt-1">en esta página</div>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="text-sm text-gray-500">En Prueba</div>
        <div class="text-2xl font-bold text-blue-600 mt-1">{{ trialingCount }}</div>
        <div class="text-xs text-gray-400 mt-1">en esta página</div>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <div class="text-sm text-gray-500">Vencidas / Canceladas</div>
        <div class="text-2xl font-bold text-red-600 mt-1">{{ problemCount }}</div>
        <div class="text-xs text-gray-400 mt-1">en esta página</div>
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
              placeholder="Buscar tienda..."
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
          class="w-48"
          @change="applyFilters"
        />
        <Dropdown
          v-model="paymentTypeFilter"
          :options="paymentTypeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Tipo de pago"
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

    <!-- Loading State -->
    <div v-if="store.loading && store.subscriptions.length === 0" class="space-y-4">
      <div v-for="i in 5" :key="i" class="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div class="h-3 bg-gray-100 rounded w-1/2"></div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="store.error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-2"></i>
      <p class="text-red-700 font-medium">{{ store.error }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="store.fetchSubscriptions()" />
    </div>

    <!-- Empty State -->
    <div v-else-if="!store.loading && store.subscriptions.length === 0" class="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <i class="pi pi-credit-card text-4xl text-gray-300 mb-3"></i>
      <p class="text-gray-500 font-medium">Sin suscripciones</p>
      <p class="text-sm text-gray-400 mt-1">No se encontraron suscripciones con los filtros seleccionados</p>
    </div>

    <!-- Data Table -->
    <div v-else class="bg-white rounded-xl border border-gray-200">
      <DataTable
        :value="store.subscriptions"
        :loading="store.loading"
        stripedRows
        class="p-datatable-sm"
      >
        <Column field="tienda_nombre" header="Tienda" style="min-width: 180px">
          <template #body="{ data: row }">
            <router-link :to="`/stores/${row.tienda_id}`" class="text-primary-600 hover:underline font-medium">
              {{ row.tienda_nombre || `Tienda #${row.tienda_id}` }}
            </router-link>
          </template>
        </Column>
        <Column header="Plan" style="min-width: 120px">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-700">{{ row.plan?.name || '-' }}</span>
          </template>
        </Column>
        <Column header="Estado" style="width: 160px">
          <template #body="{ data: row }">
            <SubscriptionStatusBadge :status="row.status" />
          </template>
        </Column>
        <Column header="Tipo Pago" style="width: 120px">
          <template #body="{ data: row }">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              :class="row.payment_type === 'automatic' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'"
            >
              {{ row.payment_type === 'automatic' ? 'Automático' : 'Manual' }}
            </span>
          </template>
        </Column>
        <Column header="Monto" style="width: 100px">
          <template #body="{ data: row }">
            <span class="text-sm font-semibold text-gray-800">
              {{ formatCurrency((row.amount_centavos || 0) / 100) }}
            </span>
          </template>
        </Column>
        <Column header="Vencimiento" style="width: 130px">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-600">{{ formatDate(row.current_period_end) }}</span>
          </template>
        </Column>
        <Column header="" style="width: 60px">
          <template #body="{ data: row }">
            <router-link :to="`/subscriptions/${row.id}`">
              <Button icon="pi pi-eye" text rounded size="small" v-tooltip="'Ver detalle'" />
            </router-link>
          </template>
        </Column>
      </DataTable>

      <!-- Pagination -->
      <div v-if="store.meta.totalPages > 1" class="flex items-center justify-between px-5 py-3 border-t border-gray-100">
        <span class="text-sm text-gray-500">
          Página {{ store.meta.page }} de {{ store.meta.totalPages }}
          ({{ store.meta.total }} registros)
        </span>
        <div class="flex gap-1">
          <Button
            icon="pi pi-chevron-left"
            text
            rounded
            size="small"
            :disabled="store.meta.page <= 1"
            @click="store.goToPage(store.meta.page - 1)"
          />
          <Button
            v-for="p in visiblePages"
            :key="p"
            :label="String(p)"
            :text="p !== store.meta.page"
            :outlined="p === store.meta.page"
            rounded
            size="small"
            @click="store.goToPage(p)"
          />
          <Button
            icon="pi pi-chevron-right"
            text
            rounded
            size="small"
            :disabled="store.meta.page >= store.meta.totalPages"
            @click="store.goToPage(store.meta.page + 1)"
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
import SubscriptionStatusBadge from '@/components/subscriptions/SubscriptionStatusBadge.vue'
import { useSubscriptionsStore } from '@/stores/subscriptions.store'
import { useFormatters } from '@/composables/useFormatters'

const store = useSubscriptionsStore()
const { formatCurrency, formatDate } = useFormatters()

const searchQuery = ref('')
const statusFilter = ref('all')
const paymentTypeFilter = ref('all')

const statusOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'En Prueba', value: 'trialing' },
  { label: 'Activo', value: 'active' },
  { label: 'Vencido', value: 'past_due' },
  { label: 'Período de Gracia', value: 'grace_period' },
  { label: 'Cancelación Prog.', value: 'scheduled_cancel' },
  { label: 'Cancelado', value: 'canceled' },
]

const paymentTypeOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Automático', value: 'automatic' },
  { label: 'Manual', value: 'manual' },
]

const hasActiveFilters = computed(() =>
  searchQuery.value || statusFilter.value !== 'all' || paymentTypeFilter.value !== 'all'
)

const activeCount = computed(() =>
  store.subscriptions.filter(s => s.status === 'active').length
)

const trialingCount = computed(() =>
  store.subscriptions.filter(s => s.status === 'trialing').length
)

const problemCount = computed(() =>
  store.subscriptions.filter(s =>
    ['past_due', 'grace_period', 'canceled'].includes(s.status)
  ).length
)

const visiblePages = computed(() => {
  const current = store.meta.page
  const total = store.meta.totalPages
  const pages: number[] = []
  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

function applySearch() {
  store.updateFilters({ search: searchQuery.value })
}

function applyFilters() {
  store.updateFilters({
    search: searchQuery.value,
    status: statusFilter.value,
    payment_type: paymentTypeFilter.value,
  })
}

function clearFilters() {
  searchQuery.value = ''
  statusFilter.value = 'all'
  paymentTypeFilter.value = 'all'
  store.updateFilters({ search: '', status: 'all', payment_type: 'all', page: 1 })
}

onMounted(() => {
  store.fetchSubscriptions()
})
</script>
