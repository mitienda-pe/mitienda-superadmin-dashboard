<template>
  <div class="space-y-6">
    <PipelineSubNav />

    <!-- Summary cards -->
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
      <div
        v-for="summary in stageSummary"
        :key="summary.stage"
        class="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
        :class="{ 'ring-2 ring-primary-500': store.filters.stage === summary.stage }"
        @click="toggleStageFilter(summary.stage)"
      >
        <div class="flex items-center justify-between mb-2">
          <span
            class="w-8 h-8 rounded-lg flex items-center justify-center"
            :style="{ backgroundColor: summary.bg, color: summary.color }"
          >
            <i :class="summary.icon" class="text-sm"></i>
          </span>
          <span class="text-2xl font-bold text-gray-900">{{ summary.count }}</span>
        </div>
        <p class="text-xs text-gray-500 font-medium">{{ summary.label }}</p>
      </div>
    </div>

    <!-- Filters bar -->
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <div class="flex flex-wrap items-center gap-3">
        <!-- Search -->
        <div class="flex-1 min-w-[200px]">
          <span class="p-input-icon-left w-full">
            <i class="pi pi-search" />
            <InputText
              v-model="searchQuery"
              placeholder="Buscar tienda, email..."
              class="w-full"
              @keyup.enter="applySearch"
            />
          </span>
        </div>

        <!-- Stage filter -->
        <Dropdown
          v-model="store.filters.stage"
          :options="stageOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Etapa"
          class="w-44"
          showClear
          @change="applyFilters"
        />

        <!-- Score range -->
        <Dropdown
          v-model="scoreRange"
          :options="scoreRangeOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Score"
          class="w-36"
          showClear
          @change="applyScoreRange"
        />

        <!-- Sort -->
        <Dropdown
          v-model="store.filters.sort"
          :options="sortOptions"
          optionLabel="label"
          optionValue="value"
          placeholder="Ordenar"
          class="w-44"
          @change="applyFilters"
        />

        <Button
          icon="pi pi-sort-amount-down"
          :class="store.filters.order === 'DESC' ? '' : 'p-button-outlined'"
          severity="secondary"
          size="small"
          @click="toggleOrder"
          v-tooltip="store.filters.order === 'DESC' ? 'Mayor a menor' : 'Menor a mayor'"
        />

        <Button
          icon="pi pi-filter-slash"
          severity="secondary"
          size="small"
          outlined
          @click="store.resetFilters()"
          v-tooltip="'Limpiar filtros'"
        />
      </div>
    </div>

    <!-- Results -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <!-- Loading -->
      <div v-if="store.isLoading" class="p-12 text-center">
        <ProgressSpinner style="width: 40px; height: 40px" />
        <p class="text-sm text-gray-500 mt-3">Cargando leads...</p>
      </div>

      <!-- Error -->
      <div v-else-if="store.error" class="p-12 text-center">
        <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-3"></i>
        <p class="text-sm text-red-600">{{ store.error }}</p>
        <Button label="Reintentar" icon="pi pi-refresh" size="small" class="mt-3" @click="store.fetchLeads()" />
      </div>

      <!-- Empty -->
      <div v-else-if="store.leads.length === 0" class="p-12 text-center">
        <i class="pi pi-inbox text-3xl text-gray-300 mb-3"></i>
        <p class="text-sm text-gray-500">No se encontraron leads con los filtros actuales</p>
      </div>

      <!-- Table -->
      <table v-else class="w-full">
        <thead>
          <tr class="border-b border-gray-200 bg-gray-50">
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-gray-700 select-none" @click="sortBy('readiness_score')">
              Score <i v-if="store.filters.sort === 'readiness_score'" :class="sortIcon" class="text-xs ml-0.5"></i>
            </th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Tienda</th>
            <th class="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Etapa</th>
            <th class="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-gray-700 select-none" @click="sortBy('days_remaining')">
              Días rest. <i v-if="store.filters.sort === 'days_remaining'" :class="sortIcon" class="text-xs ml-0.5"></i>
            </th>
            <th class="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-gray-700 select-none" @click="sortBy('published_product_count')">
              Productos <i v-if="store.filters.sort === 'published_product_count'" :class="sortIcon" class="text-xs ml-0.5"></i>
            </th>
            <th class="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Pasarela</th>
            <th class="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-gray-700 select-none" @click="sortBy('paid_orders')">
              Ventas <i v-if="store.filters.sort === 'paid_orders'" :class="sortIcon" class="text-xs ml-0.5"></i>
            </th>
            <th class="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 cursor-pointer hover:text-gray-700 select-none" @click="sortBy('total_revenue')">
              Revenue <i v-if="store.filters.sort === 'total_revenue'" :class="sortIcon" class="text-xs ml-0.5"></i>
            </th>
            <th class="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3">Setup</th>
            <th class="text-center text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-3 w-12"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-100">
          <tr
            v-for="lead in store.leads"
            :key="lead.id"
            class="hover:bg-gray-50 cursor-pointer transition-colors"
            @click="goToDetail(lead.id)"
          >
            <!-- Score -->
            <td class="px-4 py-3">
              <ReadinessScoreBadge :score="lead.readiness_score" :size="36" />
            </td>

            <!-- Store info -->
            <td class="px-4 py-3">
              <div class="min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ lead.name }}</p>
                <p class="text-xs text-gray-500 truncate">{{ lead.owner_name || lead.email }}</p>
              </div>
            </td>

            <!-- Stage -->
            <td class="px-4 py-3">
              <PipelineStageBadge :stage="lead.pipeline_stage" />
            </td>

            <!-- Days remaining -->
            <td class="px-4 py-3 text-center">
              <span
                class="text-sm font-medium"
                :class="lead.days_remaining < 0 ? 'text-gray-400' : lead.days_remaining <= 3 ? 'text-red-600' : lead.days_remaining <= 7 ? 'text-orange-500' : 'text-gray-700'"
              >
                {{ lead.days_remaining < 0 ? 'Expirado' : lead.days_remaining + 'd' }}
              </span>
            </td>

            <!-- Products -->
            <td class="px-4 py-3 text-center">
              <span class="text-sm" :class="lead.published_product_count > 0 ? 'text-gray-900 font-medium' : 'text-gray-400'">
                {{ lead.published_product_count }}
              </span>
            </td>

            <!-- Gateway -->
            <td class="px-4 py-3 text-center">
              <i
                :class="lead.has_gateway ? 'pi pi-check-circle text-green-500' : 'pi pi-times-circle text-gray-300'"
                class="text-base"
              ></i>
            </td>

            <!-- Orders -->
            <td class="px-4 py-3 text-center">
              <span class="text-sm" :class="lead.paid_orders > 0 ? 'text-green-600 font-medium' : 'text-gray-400'">
                {{ lead.paid_orders }}
              </span>
            </td>

            <!-- Revenue -->
            <td class="px-4 py-3 text-right">
              <span class="text-sm" :class="lead.total_revenue > 0 ? 'text-gray-900 font-medium' : 'text-gray-400'">
                {{ lead.total_revenue > 0 ? formatCurrency(lead.total_revenue) : '-' }}
              </span>
            </td>

            <!-- Setup indicators -->
            <td class="px-4 py-3">
              <div class="flex items-center justify-center gap-1">
                <i
                  class="text-xs"
                  :class="lead.has_logo ? 'pi pi-image text-green-500' : 'pi pi-image text-gray-300'"
                  v-tooltip="'Logo'"
                ></i>
                <i
                  class="text-xs"
                  :class="lead.has_shipping_config ? 'pi pi-truck text-green-500' : 'pi pi-truck text-gray-300'"
                  v-tooltip="'Envío'"
                ></i>
                <i
                  class="text-xs"
                  :class="lead.has_custom_domain ? 'pi pi-globe text-green-500' : 'pi pi-globe text-gray-300'"
                  v-tooltip="'Dominio'"
                ></i>
              </div>
            </td>

            <!-- Actions -->
            <td class="px-4 py-3 text-center" @click.stop>
              <Button
                icon="pi pi-ellipsis-v"
                severity="secondary"
                text
                size="small"
                rounded
                @click="openFlagMenu($event, lead)"
              />
            </td>
          </tr>
        </tbody>
      </table>

      <Menu ref="flagMenuRef" :model="flagMenuItems" :popup="true" />

      <!-- Pagination -->
      <div v-if="store.meta.total_pages > 1" class="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
        <span class="text-sm text-gray-500">
          {{ (store.meta.current_page - 1) * store.meta.per_page + 1 }}–{{ Math.min(store.meta.current_page * store.meta.per_page, store.meta.total) }}
          de {{ store.meta.total }} leads
        </span>
        <div class="flex items-center gap-1">
          <Button
            icon="pi pi-chevron-left"
            severity="secondary"
            size="small"
            text
            :disabled="store.meta.current_page <= 1"
            @click="store.setPage(store.meta.current_page - 1)"
          />
          <span class="text-sm text-gray-700 px-2">
            {{ store.meta.current_page }} / {{ store.meta.total_pages }}
          </span>
          <Button
            icon="pi pi-chevron-right"
            severity="secondary"
            size="small"
            text
            :disabled="store.meta.current_page >= store.meta.total_pages"
            @click="store.setPage(store.meta.current_page + 1)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePipelineStore } from '@/stores/pipeline.store'
import { useFormatters } from '@/composables/useFormatters'
import type { PipelineStage } from '@/types/pipeline.types'
import { PIPELINE_STAGES } from '@/types/pipeline.types'
import PipelineSubNav from '@/components/pipeline/PipelineSubNav.vue'
import ReadinessScoreBadge from '@/components/pipeline/ReadinessScoreBadge.vue'
import PipelineStageBadge from '@/components/pipeline/PipelineStageBadge.vue'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'
import Menu from 'primevue/menu'
import { useToast } from 'primevue/usetoast'
import { updateStoreFlag } from '@/api/stores.api'
import type { PipelineLead } from '@/types/pipeline.types'
import type { StoreFlag } from '@/types/store.types'

const router = useRouter()
const store = usePipelineStore()
const { formatCurrency } = useFormatters()

const searchQuery = ref(store.filters.search)
const scoreRange = ref<string | null>(null)

const stageOptions = computed(() => [
  ...PIPELINE_STAGES.map(s => ({ label: s.label, value: s.value }))
])

const scoreRangeOptions = [
  { label: '70-100 (HOT)', value: '70-100' },
  { label: '40-69 (WARM)', value: '40-69' },
  { label: '15-39 (NURTURE)', value: '15-39' },
  { label: '0-14 (INACTIVE)', value: '0-14' },
]

const sortOptions = [
  { label: 'Score', value: 'readiness_score' },
  { label: 'Días restantes', value: 'days_remaining' },
  { label: 'Productos', value: 'published_product_count' },
  { label: 'Ventas', value: 'paid_orders' },
  { label: 'Revenue', value: 'total_revenue' },
  { label: 'Inicio trial', value: 'trial_start' },
]

// Stage summary computed from loaded leads (full dataset count would need backend)
const stageSummary = computed(() => {
  const counts: Record<string, number> = {}
  store.leads.forEach(l => {
    counts[l.pipeline_stage] = (counts[l.pipeline_stage] || 0) + 1
  })
  return PIPELINE_STAGES
    .map(s => ({
      stage: s.value,
      label: s.label,
      color: s.color,
      bg: s.color + '18',
      icon: s.icon,
      count: counts[s.value] || 0,
    }))
    .filter(s => s.count > 0 || store.filters.stage === s.stage)
})

function toggleStageFilter(stage: PipelineStage) {
  store.filters.stage = store.filters.stage === stage ? '' : stage
  store.filters.page = 1
  store.fetchLeads()
}

function applySearch() {
  store.filters.search = searchQuery.value
  store.filters.page = 1
  store.fetchLeads()
}

function applyFilters() {
  store.filters.page = 1
  store.fetchLeads()
}

function applyScoreRange() {
  if (scoreRange.value) {
    const [min, max] = scoreRange.value.split('-').map(Number)
    store.filters.score_min = min
    store.filters.score_max = max
  } else {
    store.filters.score_min = null
    store.filters.score_max = null
  }
  store.filters.page = 1
  store.fetchLeads()
}

function toggleOrder() {
  store.filters.order = store.filters.order === 'DESC' ? 'ASC' : 'DESC'
  store.fetchLeads()
}

const sortIcon = computed(() =>
  store.filters.order === 'DESC' ? 'pi pi-sort-amount-down' : 'pi pi-sort-amount-up'
)

function sortBy(field: string) {
  if (store.filters.sort === field) {
    store.filters.order = store.filters.order === 'DESC' ? 'ASC' : 'DESC'
  } else {
    store.filters.sort = field
    store.filters.order = 'DESC'
  }
  store.filters.page = 1
  store.fetchLeads()
}

// Flag menu
const toast = useToast()
const flagMenuRef = ref()
let selectedLead: PipelineLead | null = null

const flagMenuItems = computed(() => [
  {
    label: 'Marcar Interna',
    icon: 'pi pi-home',
    command: () => applyFlag('internal')
  },
  {
    label: 'Marcar Corporativa',
    icon: 'pi pi-building',
    command: () => applyFlag('corporate')
  },
  {
    label: 'Quitar flag',
    icon: 'pi pi-circle',
    command: () => applyFlag(null)
  }
])

function openFlagMenu(event: Event, lead: PipelineLead) {
  selectedLead = lead
  flagMenuRef.value.toggle(event)
}

async function applyFlag(flag: StoreFlag) {
  if (!selectedLead) return
  try {
    await updateStoreFlag(selectedLead.id, flag)
    toast.add({ severity: 'success', summary: 'Flag actualizado', detail: `${selectedLead.name} → ${flag || 'orgánica'}`, life: 3000 })
    // If marked internal, remove from list since backend now filters them out
    if (flag === 'internal') {
      store.leads = store.leads.filter(l => l.id !== selectedLead!.id)
    }
  } catch {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el flag', life: 5000 })
  }
}

function goToDetail(id: number) {
  router.push(`/pipeline/${id}`)
}

onMounted(() => {
  store.fetchLeads()
})
</script>
