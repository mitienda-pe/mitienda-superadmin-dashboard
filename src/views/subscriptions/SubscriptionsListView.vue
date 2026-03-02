<template>
  <div class="space-y-6">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Suscripciones</h1>
      <p class="text-sm text-gray-500 mt-1">Monitoreo de suscripciones legacy y del nuevo billing engine</p>
    </div>

    <!-- Tabs -->
    <TabView v-model:activeIndex="activeTab" @tab-change="onTabChange">
      <!-- Tab: Legacy (Culqi) -->
      <TabPanel header="Legacy (Culqi)">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="text-sm text-gray-500">Total</div>
            <div class="text-2xl font-bold text-gray-900 mt-1">{{ legacyStore.meta.total }}</div>
            <div class="text-xs text-gray-400 mt-1">{{ legacyViewMode === 'latest' ? 'tiendas únicas' : 'registros históricos' }}</div>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="text-sm text-gray-500">Activas</div>
            <div class="text-2xl font-bold text-green-600 mt-1">{{ legacyActiveCount }}</div>
            <div class="text-xs text-gray-400 mt-1">en esta página</div>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="text-sm text-gray-500">En Prueba</div>
            <div class="text-2xl font-bold text-blue-600 mt-1">{{ legacyTrialCount }}</div>
            <div class="text-xs text-gray-400 mt-1">en esta página</div>
          </div>
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="text-sm text-gray-500">Vencidas / Expiradas</div>
            <div class="text-2xl font-bold text-red-600 mt-1">{{ legacyExpiredCount }}</div>
            <div class="text-xs text-gray-400 mt-1">en esta página</div>
          </div>
        </div>

        <!-- Legacy Filters -->
        <div class="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex-1 min-w-[200px]">
              <span class="p-input-icon-left w-full">
                <i class="pi pi-search" />
                <InputText
                  v-model="legacySearchQuery"
                  placeholder="Buscar tienda o correo..."
                  class="w-full"
                  @keyup.enter="applyLegacySearch"
                />
              </span>
            </div>
            <Dropdown
              v-model="legacyStatusFilter"
              :options="legacyStatusOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Estado"
              class="w-44"
              @change="applyLegacyFilters"
            />
            <Dropdown
              v-model="legacyPlanFilter"
              :options="legacyPlanOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Plan"
              class="w-40"
              @change="applyLegacyFilters"
            />
            <div class="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                class="px-3 py-2 text-xs font-medium transition-colors"
                :class="legacyViewMode === 'latest' ? 'bg-primary-50 text-primary-700' : 'bg-white text-gray-500 hover:bg-gray-50'"
                @click="toggleLegacyView('latest')"
              >
                Estado actual
              </button>
              <button
                class="px-3 py-2 text-xs font-medium transition-colors border-l border-gray-200"
                :class="legacyViewMode === 'history' ? 'bg-primary-50 text-primary-700' : 'bg-white text-gray-500 hover:bg-gray-50'"
                @click="toggleLegacyView('history')"
              >
                Historial
              </button>
            </div>
            <Button
              v-if="hasLegacyActiveFilters"
              icon="pi pi-filter-slash"
              severity="secondary"
              text
              @click="clearLegacyFilters"
              v-tooltip="'Limpiar filtros'"
            />
          </div>
        </div>

        <!-- Legacy Loading -->
        <div v-if="legacyStore.loading && legacyStore.subscriptions.length === 0" class="space-y-4">
          <div v-for="i in 5" :key="i" class="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div class="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
            <div class="h-3 bg-gray-100 rounded w-1/2"></div>
          </div>
        </div>

        <!-- Legacy Error -->
        <div v-else-if="legacyStore.error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-2"></i>
          <p class="text-red-700 font-medium">{{ legacyStore.error }}</p>
          <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="legacyStore.fetchSubscriptions()" />
        </div>

        <!-- Legacy Empty -->
        <div v-else-if="!legacyStore.loading && legacyStore.subscriptions.length === 0" class="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <i class="pi pi-credit-card text-4xl text-gray-300 mb-3"></i>
          <p class="text-gray-500 font-medium">Sin suscripciones legacy</p>
          <p class="text-sm text-gray-400 mt-1">No se encontraron suscripciones con los filtros seleccionados</p>
        </div>

        <!-- Legacy Data Table -->
        <div v-else class="bg-white rounded-xl border border-gray-200">
          <DataTable
            :value="legacyStore.subscriptions"
            :loading="legacyStore.loading"
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
            <Column header="Plan" style="min-width: 100px">
              <template #body="{ data: row }">
                <span class="text-sm text-gray-700">{{ row.plan_titulo || '-' }}</span>
              </template>
            </Column>
            <Column header="Estado" style="width: 140px">
              <template #body="{ data: row }">
                <LegacyStatusBadge :status="Number(row.status)" :computed-status="row.computed_status" />
              </template>
            </Column>
            <Column header="Precio" style="width: 90px">
              <template #body="{ data: row }">
                <span class="text-sm font-semibold text-gray-800">
                  {{ formatCurrency(Number(row.precio) || 0) }}
                </span>
              </template>
            </Column>
            <Column header="Período" style="width: 90px">
              <template #body="{ data: row }">
                <span class="text-sm text-gray-600">
                  {{ formatPeriod(row.periodo, row.periodo_cantidad) }}
                </span>
              </template>
            </Column>
            <Column header="Vencimiento" style="width: 110px">
              <template #body="{ data: row }">
                <span class="text-sm text-gray-600">{{ formatDate(row.fecha_final) }}</span>
              </template>
            </Column>
            <Column header="MRR" style="width: 80px">
              <template #body="{ data: row }">
                <span class="text-sm font-medium text-gray-700">
                  {{ formatCurrency(Number(row.mrr) || 0) }}
                </span>
              </template>
            </Column>
            <Column header="Renovaciones" style="width: 130px">
              <template #body="{ data: row }">
                <div class="flex items-center gap-1.5">
                  <span class="text-sm text-gray-600">{{ row.total_renovaciones }}</span>
                  <span
                    v-if="row.renovaciones_rechazadas > 0"
                    class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-red-50 text-red-700"
                    v-tooltip="'Rechazadas'"
                  >
                    <i class="pi pi-times-circle text-[10px]"></i>
                    {{ row.renovaciones_rechazadas }}
                  </span>
                  <span
                    v-if="row.renovaciones_vencidas > 0"
                    class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-700"
                    v-tooltip="'Vencidas/Expiradas'"
                  >
                    <i class="pi pi-exclamation-triangle text-[10px]"></i>
                    {{ row.renovaciones_vencidas }}
                  </span>
                </div>
              </template>
            </Column>
          </DataTable>

          <!-- Legacy Pagination -->
          <div v-if="legacyStore.meta.totalPages > 1" class="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span class="text-sm text-gray-500">
              Página {{ legacyStore.meta.page }} de {{ legacyStore.meta.totalPages }}
              ({{ legacyStore.meta.total }} {{ legacyViewMode === 'latest' ? 'tiendas' : 'registros' }})
            </span>
            <div class="flex gap-1">
              <Button
                icon="pi pi-chevron-left"
                text
                rounded
                size="small"
                :disabled="legacyStore.meta.page <= 1"
                @click="legacyStore.goToPage(legacyStore.meta.page - 1)"
              />
              <Button
                v-for="p in legacyVisiblePages"
                :key="p"
                :label="String(p)"
                :text="p !== legacyStore.meta.page"
                :outlined="p === legacyStore.meta.page"
                rounded
                size="small"
                @click="legacyStore.goToPage(p)"
              />
              <Button
                icon="pi pi-chevron-right"
                text
                rounded
                size="small"
                :disabled="legacyStore.meta.page >= legacyStore.meta.totalPages"
                @click="legacyStore.goToPage(legacyStore.meta.page + 1)"
              />
            </div>
          </div>
        </div>
      </TabPanel>

      <!-- Tab: Billing Engine -->
      <TabPanel header="Billing Engine">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-white rounded-xl border border-gray-200 p-5">
            <div class="text-sm text-gray-500">Total</div>
            <div class="text-2xl font-bold text-gray-900 mt-1">{{ billingStore.meta.total }}</div>
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
        <div class="bg-white rounded-xl border border-gray-200 p-4 mb-6">
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
        <div v-if="billingStore.loading && billingStore.subscriptions.length === 0" class="space-y-4">
          <div v-for="i in 5" :key="i" class="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div class="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
            <div class="h-3 bg-gray-100 rounded w-1/2"></div>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="billingStore.error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-2"></i>
          <p class="text-red-700 font-medium">{{ billingStore.error }}</p>
          <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="billingStore.fetchSubscriptions()" />
        </div>

        <!-- Empty State -->
        <div v-else-if="!billingStore.loading && billingStore.subscriptions.length === 0" class="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <i class="pi pi-credit-card text-4xl text-gray-300 mb-3"></i>
          <p class="text-gray-500 font-medium">Sin suscripciones</p>
          <p class="text-sm text-gray-400 mt-1">No se encontraron suscripciones en el nuevo billing engine</p>
        </div>

        <!-- Data Table -->
        <div v-else class="bg-white rounded-xl border border-gray-200">
          <DataTable
            :value="billingStore.subscriptions"
            :loading="billingStore.loading"
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
          <div v-if="billingStore.meta.totalPages > 1" class="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <span class="text-sm text-gray-500">
              Página {{ billingStore.meta.page }} de {{ billingStore.meta.totalPages }}
              ({{ billingStore.meta.total }} registros)
            </span>
            <div class="flex gap-1">
              <Button
                icon="pi pi-chevron-left"
                text
                rounded
                size="small"
                :disabled="billingStore.meta.page <= 1"
                @click="billingStore.goToPage(billingStore.meta.page - 1)"
              />
              <Button
                v-for="p in visiblePages"
                :key="p"
                :label="String(p)"
                :text="p !== billingStore.meta.page"
                :outlined="p === billingStore.meta.page"
                rounded
                size="small"
                @click="billingStore.goToPage(p)"
              />
              <Button
                icon="pi pi-chevron-right"
                text
                rounded
                size="small"
                :disabled="billingStore.meta.page >= billingStore.meta.totalPages"
                @click="billingStore.goToPage(billingStore.meta.page + 1)"
              />
            </div>
          </div>
        </div>
      </TabPanel>
    </TabView>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import SubscriptionStatusBadge from '@/components/subscriptions/SubscriptionStatusBadge.vue'
import LegacyStatusBadge from '@/components/subscriptions/LegacyStatusBadge.vue'
import { useSubscriptionsStore } from '@/stores/subscriptions.store'
import { useLegacySubscriptionsStore } from '@/stores/legacy-subscriptions.store'
import { useFormatters } from '@/composables/useFormatters'

const billingStore = useSubscriptionsStore()
const legacyStore = useLegacySubscriptionsStore()
const { formatCurrency, formatDate } = useFormatters()

const activeTab = ref(0)

// ============ Legacy tab state ============
const legacySearchQuery = ref('')
const legacyStatusFilter = ref('all')
const legacyPlanFilter = ref('all')
const legacyViewMode = ref<'latest' | 'history'>('latest')

const legacyStatusOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Activo', value: 'active' },
  { label: 'Prueba', value: 'trial' },
  { label: 'Vencido / Expirado', value: 'expired' },
  { label: 'Pendiente', value: '2' },
  { label: 'Rechazado', value: '0' },
  { label: 'Obsequiado', value: '5' },
  { label: 'Bloqueado', value: '6' },
]

const legacyPlanOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Micro', value: 'Micro' },
  { label: 'Small', value: 'Small' },
  { label: 'Medium', value: 'Medium' },
  { label: 'Large', value: 'Large' },
  { label: 'Enterprise', value: 'Enterprise' },
]

const hasLegacyActiveFilters = computed(() =>
  legacySearchQuery.value || legacyStatusFilter.value !== 'all' || legacyPlanFilter.value !== 'all'
)

const legacyActiveCount = computed(() =>
  legacyStore.subscriptions.filter(s => s.computed_status === 'active').length
)

const legacyTrialCount = computed(() =>
  legacyStore.subscriptions.filter(s => s.computed_status === 'trial').length
)

const legacyExpiredCount = computed(() =>
  legacyStore.subscriptions.filter(s => s.computed_status === 'expired').length
)

const legacyVisiblePages = computed(() => {
  const current = legacyStore.meta.page
  const total = legacyStore.meta.totalPages
  const pages: number[] = []
  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

function applyLegacySearch() {
  legacyStore.updateFilters({ search: legacySearchQuery.value })
}

function applyLegacyFilters() {
  legacyStore.updateFilters({
    search: legacySearchQuery.value,
    status: legacyStatusFilter.value,
    plan: legacyPlanFilter.value,
  })
}

function clearLegacyFilters() {
  legacySearchQuery.value = ''
  legacyStatusFilter.value = 'all'
  legacyPlanFilter.value = 'all'
  legacyStore.updateFilters({ search: '', status: 'all', plan: 'all', page: 1 })
}

function toggleLegacyView(view: 'latest' | 'history') {
  if (legacyViewMode.value === view) return
  legacyViewMode.value = view
  legacyStore.updateFilters({ view })
}

function formatPeriod(period: string | null, qty: number | null): string {
  if (!period) return '-'
  const q = Number(qty) || 1
  const units: Record<string, string> = { days: 'día', months: 'mes', years: 'año' }
  const unit = units[period] || period
  if (q === 1) return `1 ${unit}`
  const plurals: Record<string, string> = { día: 'días', mes: 'meses', año: 'años' }
  return `${q} ${plurals[unit] || unit}`
}

// ============ Billing Engine tab state ============
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
  billingStore.subscriptions.filter(s => s.status === 'active').length
)

const trialingCount = computed(() =>
  billingStore.subscriptions.filter(s => s.status === 'trialing').length
)

const problemCount = computed(() =>
  billingStore.subscriptions.filter(s =>
    ['past_due', 'grace_period', 'canceled'].includes(s.status)
  ).length
)

const visiblePages = computed(() => {
  const current = billingStore.meta.page
  const total = billingStore.meta.totalPages
  const pages: number[] = []
  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

function applySearch() {
  billingStore.updateFilters({ search: searchQuery.value })
}

function applyFilters() {
  billingStore.updateFilters({
    search: searchQuery.value,
    status: statusFilter.value,
    payment_type: paymentTypeFilter.value,
  })
}

function clearFilters() {
  searchQuery.value = ''
  statusFilter.value = 'all'
  paymentTypeFilter.value = 'all'
  billingStore.updateFilters({ search: '', status: 'all', payment_type: 'all', page: 1 })
}

function onTabChange(event: { index: number }) {
  if (event.index === 0 && legacyStore.subscriptions.length === 0 && !legacyStore.loading) {
    legacyStore.fetchSubscriptions()
  }
  if (event.index === 1 && billingStore.subscriptions.length === 0 && !billingStore.loading) {
    billingStore.fetchSubscriptions()
  }
}

onMounted(() => {
  legacyStore.fetchSubscriptions()
})
</script>
