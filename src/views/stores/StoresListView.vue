<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Tiendas</h1>
        <p class="text-sm text-gray-500 mt-1">{{ storesStore.meta.total }} tiendas registradas</p>
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
          v-model="planFilter"
          :options="planOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Plan"
          class="w-40"
          @change="applyFilters"
        />
        <Dropdown
          v-model="classificationFilter"
          :options="classificationOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Salud"
          class="w-40"
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
        <Dropdown
          v-model="flagFilter"
          :options="flagOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Tipo"
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
    <div v-if="storesStore.isLoading && storesStore.stores.length === 0" class="space-y-4">
      <div v-for="i in 5" :key="i" class="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
        <div class="h-3 bg-gray-100 rounded w-1/2"></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="storesStore.error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-2"></i>
      <p class="text-red-700 font-medium">{{ storesStore.error }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="storesStore.fetchStores()" />
    </div>

    <!-- Table -->
    <div v-else class="bg-white rounded-xl border border-gray-200">
      <DataTable
        :value="storesStore.stores"
        :loading="storesStore.isLoading"
        stripedRows
        class="p-datatable-sm"
        @sort="onSort"
        :sortField="storesStore.filters.sort"
        :sortOrder="storesStore.filters.order === 'ASC' ? 1 : -1"
      >
        <Column field="id" header="ID" :sortable="false" style="width: 60px">
          <template #body="{ data: row }">
            <span class="text-xs text-gray-500 font-mono">{{ row.id }}</span>
          </template>
        </Column>

        <Column field="name" header="Tienda" :sortable="true" style="min-width: 220px">
          <template #body="{ data: row }">
            <div class="flex items-center gap-3">
              <router-link :to="`/stores/${row.id}`" class="flex items-center gap-3 hover:text-primary-600 transition-colors flex-1 min-w-0">
                <div class="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  <img v-if="row.logo" :src="`https://api2.mitienda.pe/uploads/logos/${row.logo}`" class="w-full h-full object-cover" :alt="row.name" />
                  <i v-else class="pi pi-shop text-gray-400 text-sm"></i>
                </div>
                <div class="min-w-0">
                  <span class="font-medium text-gray-800 truncate block">{{ row.name }}</span>
                  <div class="text-xs text-gray-400 truncate">{{ row.slug }}.mitienda.pe</div>
                </div>
              </router-link>
              <a
                :href="`https://${row.slug}.mitienda.pe`"
                target="_blank"
                rel="noopener noreferrer"
                class="flex-shrink-0 text-gray-400 hover:text-primary-600 transition-colors"
                v-tooltip="'Ver tienda en web'"
                @click.stop
              >
                <i class="pi pi-external-link text-sm"></i>
              </a>
            </div>
          </template>
        </Column>

        <Column header="Tipo" :sortable="false" style="width: 110px">
          <template #body="{ data: row }">
            <span
              v-if="row.flag === 'internal'"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600"
            >
              Interna
            </span>
            <span
              v-else-if="row.flag === 'corporate'"
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700"
            >
              Corporativa
            </span>
            <span v-else class="text-xs text-gray-400">Orgánica</span>
          </template>
        </Column>

        <Column field="plan" header="Plan" :sortable="false" style="min-width: 120px">
          <template #body="{ data: row }">
            <div>
              <span class="text-sm text-gray-700">{{ row.plan }}</span>
              <div class="text-xs text-gray-400">{{ planCategoryLabel(row.plan_category) }}</div>
            </div>
          </template>
        </Column>

        <Column header="Estado" :sortable="false" style="width: 90px">
          <template #body="{ data: row }">
            <span
              class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
              :class="row.status === 'vigente' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
            >
              {{ row.status === 'vigente' ? 'Vigente' : 'Vencido' }}
            </span>
          </template>
        </Column>

        <Column field="seniority_months" header="Antigüedad" :sortable="true" style="width: 100px">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-600">{{ row.seniority_months }} meses</span>
          </template>
        </Column>

        <Column field="current_month_sales" header="Ventas (mes)" :sortable="true" style="min-width: 130px">
          <template #body="{ data: row }">
            <div class="text-right">
              <span class="text-sm font-semibold text-gray-800">{{ formatCurrency(row.current_month_sales) }}</span>
              <div class="text-xs text-gray-400">{{ formatNumber(row.current_month_orders) }} pedidos</div>
            </div>
          </template>
        </Column>

        <Column field="change_percent" header="Cambio" :sortable="true" style="min-width: 90px">
          <template #body="{ data: row }">
            <div class="text-right">
              <span
                v-if="row.change_percent !== 0"
                class="text-xs font-medium px-2 py-0.5 rounded-full"
                :class="row.change_percent >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'"
              >
                {{ row.change_percent >= 0 ? '+' : '' }}{{ row.change_percent }}%
              </span>
              <span v-else class="text-xs text-gray-400">-</span>
            </div>
          </template>
        </Column>

        <Column field="product_count" header="Productos" :sortable="true" style="min-width: 90px">
          <template #body="{ data: row }">
            <span class="text-sm text-gray-600">{{ formatNumber(row.product_count) }}</span>
          </template>
        </Column>

        <Column field="health_score" header="Salud" :sortable="true" style="min-width: 120px">
          <template #body="{ data: row }">
            <HealthBadge :label="classificationLabel(row.classification)" :score="row.health_score" />
          </template>
        </Column>

        <Column header="" style="width: 80px">
          <template #body="{ data: row }">
            <div class="flex items-center gap-1">
              <Button
                icon="pi pi-tag"
                text
                rounded
                severity="secondary"
                size="small"
                v-tooltip="'Cambiar tipo'"
                @click="openFlagMenu($event, row)"
              />
              <router-link :to="`/stores/${row.id}`">
                <Button icon="pi pi-chevron-right" text rounded severity="secondary" size="small" />
              </router-link>
            </div>
          </template>
        </Column>
      </DataTable>

      <!-- Pagination -->
      <div v-if="storesStore.meta.total_pages > 1" class="flex items-center justify-between px-5 py-3 border-t border-gray-100">
        <span class="text-sm text-gray-500">
          Página {{ storesStore.meta.current_page }} de {{ storesStore.meta.total_pages }}
          ({{ storesStore.meta.total }} tiendas)
        </span>
        <div class="flex gap-1">
          <Button
            icon="pi pi-chevron-left"
            text
            rounded
            size="small"
            :disabled="storesStore.meta.current_page <= 1"
            @click="storesStore.goToPage(storesStore.meta.current_page - 1)"
          />
          <Button
            v-for="p in visiblePages"
            :key="p"
            :label="String(p)"
            :text="p !== storesStore.meta.current_page"
            :outlined="p === storesStore.meta.current_page"
            rounded
            size="small"
            @click="storesStore.goToPage(p)"
          />
          <Button
            icon="pi pi-chevron-right"
            text
            rounded
            size="small"
            :disabled="storesStore.meta.current_page >= storesStore.meta.total_pages"
            @click="storesStore.goToPage(storesStore.meta.current_page + 1)"
          />
        </div>
      </div>
    </div>

    <!-- Flag context menu -->
    <Menu ref="flagMenuRef" :model="flagMenuItems" :popup="true" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import HealthBadge from '@/components/ui/HealthBadge.vue'
import { useStoresStore } from '@/stores/stores.store'
import { useFormatters } from '@/composables/useFormatters'
import type { StoreListItem, StoreFlag } from '@/types/store.types'

const storesStore = useStoresStore()
const { formatCurrency, formatNumber } = useFormatters()

const searchQuery = ref('')
const planFilter = ref('')
const classificationFilter = ref('')
const statusFilter = ref('')
const flagFilter = ref('')

const planOptions = [
  { label: 'Todos los planes', value: '' },
  { label: 'Large (S/1000+)', value: 'large' },
  { label: 'Medium (S/500-999)', value: 'medium' },
  { label: 'Small (S/200-499)', value: 'small' },
  { label: 'Micro (<S/200)', value: 'micro' }
]

const classificationOptions = [
  { label: 'Todas', value: '' },
  { label: 'Saludable', value: 'healthy' },
  { label: 'Estable', value: 'observation' },
  { label: 'En riesgo', value: 'at_risk' },
  { label: 'Crítico', value: 'critical' }
]

const statusOptions = [
  { label: 'Todos', value: '' },
  { label: 'Vigente', value: 'vigente' },
  { label: 'Vencido', value: 'vencido' }
]

const flagOptions = [
  { label: 'Todos los tipos', value: '' },
  { label: 'Orgánica', value: 'organic' },
  { label: 'Interna', value: 'internal' },
  { label: 'Corporativa', value: 'corporate' }
]

const hasActiveFilters = computed(() =>
  searchQuery.value || planFilter.value || classificationFilter.value || statusFilter.value || flagFilter.value
)

const visiblePages = computed(() => {
  const current = storesStore.meta.current_page
  const total = storesStore.meta.total_pages
  const pages: number[] = []
  const start = Math.max(1, current - 2)
  const end = Math.min(total, current + 2)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

// Flag menu
const flagMenuRef = ref()
let selectedStoreForFlag: StoreListItem | null = null

const flagMenuItems = computed(() => [
  {
    label: 'Orgánica',
    icon: 'pi pi-circle',
    command: () => applyFlag(null)
  },
  {
    label: 'Interna',
    icon: 'pi pi-home',
    command: () => applyFlag('internal')
  },
  {
    label: 'Corporativa',
    icon: 'pi pi-building',
    command: () => applyFlag('corporate')
  }
])

function openFlagMenu(event: Event, row: StoreListItem) {
  selectedStoreForFlag = row
  flagMenuRef.value.toggle(event)
}

async function applyFlag(flag: StoreFlag) {
  if (!selectedStoreForFlag) return
  try {
    await storesStore.setStoreFlag(selectedStoreForFlag.id, flag)
  } catch {
    // Silently handle - the store already handles local update on success
  }
}

function applySearch() {
  storesStore.updateFilters({ search: searchQuery.value })
}

function applyFilters() {
  storesStore.updateFilters({
    search: searchQuery.value,
    plan: planFilter.value,
    classification: classificationFilter.value,
    status: statusFilter.value,
    flag: flagFilter.value
  })
}

function clearFilters() {
  searchQuery.value = ''
  planFilter.value = ''
  classificationFilter.value = ''
  statusFilter.value = ''
  flagFilter.value = ''
  storesStore.updateFilters({ search: '', plan: '', classification: '', status: '', flag: '', page: 1 })
}

function onSort(event: any) {
  const field = event.sortField
  const order = event.sortOrder === 1 ? 'ASC' : 'DESC'
  storesStore.updateFilters({ sort: field, order })
}

function planCategoryLabel(cat: string): string {
  const labels: Record<string, string> = {
    large: 'Large', medium: 'Medium', small: 'Small', micro: 'Micro'
  }
  return labels[cat] || cat
}

function classificationLabel(classification: string): string {
  const labels: Record<string, string> = {
    healthy: 'Saludable',
    observation: 'Estable',
    at_risk: 'En riesgo',
    critical: 'Crítico'
  }
  return labels[classification] || classification
}

onMounted(() => {
  storesStore.fetchStores()
})
</script>
