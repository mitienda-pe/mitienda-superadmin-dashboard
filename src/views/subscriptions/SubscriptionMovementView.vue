<template>
  <div class="space-y-6">
    <SectionTabs :tabs="MRR_TABS" />

    <!-- Header with month picker -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Movimiento de Suscripciones</h1>
        <p class="text-sm text-gray-500 mt-1">Resumen mensual de suscripciones pagadas</p>
      </div>
      <div class="flex items-center gap-2">
        <button
          class="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          @click="prevMonth"
        >
          <i class="pi pi-chevron-left text-gray-600"></i>
        </button>
        <Dropdown
          v-model="selectedMonth"
          :options="monthOptions"
          optionLabel="label"
          optionValue="value"
          class="w-48"
          @change="onMonthChange"
        />
        <button
          class="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          :disabled="isCurrentOrFutureMonth"
          :class="{ 'opacity-40 cursor-not-allowed': isCurrentOrFutureMonth }"
          @click="nextMonth"
        >
          <i class="pi pi-chevron-right text-gray-600"></i>
        </button>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="store.isLoading" class="space-y-4">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div v-for="n in 5" :key="n" class="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
          <div class="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div v-for="n in 3" :key="'r'+n" class="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
          <div class="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else-if="store.error" class="bg-white rounded-xl border border-red-200 p-8 text-center">
      <i class="pi pi-exclamation-circle text-4xl text-red-400 mb-3"></i>
      <p class="text-red-600 font-medium">{{ store.error }}</p>
      <button
        class="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        @click="loadData"
      >
        Reintentar
      </button>
    </div>

    <!-- KPI Cards -->
    <div v-else-if="store.data" class="space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <!-- Activas inicio -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <p class="text-sm text-gray-500 font-medium">Activas inicio de mes</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ formatNumber(kpis.activas_inicio) }}</p>
        </div>

        <!-- Activas cierre -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <p class="text-sm text-gray-500 font-medium">Activas cierre de mes</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ formatNumber(kpis.activas_cierre) }}</p>
        </div>

        <!-- Ganadas -->
        <div class="bg-white rounded-xl border border-green-200 p-5 bg-green-50/30">
          <p class="text-sm text-green-700 font-medium">Ganadas</p>
          <p class="text-2xl font-bold text-green-700 mt-1">+{{ formatNumber(kpis.ganadas) }}</p>
          <p class="text-xs text-green-800 mt-1">
            <strong>{{ formatNumber(kpis.nuevas) }} clientes nuevos</strong>
            <template v-if="kpis.ganadas - kpis.nuevas > 0">
              · {{ formatNumber(kpis.ganadas - kpis.nuevas) }} ya eran clientes
            </template>
          </p>
        </div>

        <!-- Perdidas -->
        <div class="bg-white rounded-xl border border-red-200 p-5 bg-red-50/30">
          <p class="text-sm text-red-700 font-medium">Perdidas</p>
          <p class="text-2xl font-bold text-red-700 mt-1">-{{ formatNumber(kpis.perdidas) }}</p>
          <p class="text-xs text-red-800 mt-1">
            <strong>{{ formatNumber(kpis.perdidas_definitivas) }} siguen fuera</strong>
            <template v-if="kpis.perdidas_volvieron > 0">
              · {{ formatNumber(kpis.perdidas_volvieron) }} volvieron
            </template>
          </p>
        </div>

        <!-- Variación neta -->
        <div
          class="rounded-xl border p-5"
          :class="kpis.variacion >= 0
            ? 'border-green-200 bg-green-50/30'
            : 'border-red-200 bg-red-50/30'"
        >
          <p class="text-sm font-medium" :class="kpis.variacion >= 0 ? 'text-green-700' : 'text-red-700'">
            Variacion neta
          </p>
          <div class="flex items-center gap-2 mt-1">
            <i
              class="text-lg"
              :class="kpis.variacion >= 0
                ? 'pi pi-arrow-up text-green-700'
                : 'pi pi-arrow-down text-red-700'"
            ></i>
            <p class="text-2xl font-bold" :class="kpis.variacion >= 0 ? 'text-green-700' : 'text-red-700'">
              {{ kpis.variacion >= 0 ? '+' : '' }}{{ formatNumber(kpis.variacion) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Renewal KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Por renovar -->
        <div class="bg-white rounded-xl border border-amber-200 p-5 bg-amber-50/30">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-amber-700 font-medium">Suscripciones a renovar</p>
              <p class="text-2xl font-bold text-amber-700 mt-1">{{ formatNumber(kpis.por_renovar) }}</p>
            </div>
            <i class="pi pi-calendar-clock text-2xl text-amber-400"></i>
          </div>
          <p class="text-xs text-amber-600 mt-2">Planes que vencen en el mes</p>
        </div>

        <!-- Renovadas -->
        <div class="bg-white rounded-xl border border-teal-200 p-5 bg-teal-50/30">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-teal-700 font-medium">Suscripciones renovadas</p>
              <p class="text-2xl font-bold text-teal-700 mt-1">{{ formatNumber(kpis.renovadas) }}</p>
            </div>
            <i class="pi pi-check-circle text-2xl text-teal-400"></i>
          </div>
          <p class="text-xs text-teal-600 mt-2">
            {{ kpis.por_renovar > 0
              ? Math.round((kpis.renovadas / kpis.por_renovar) * 100) + '% tasa de renovacion'
              : 'Sin planes por renovar' }}
          </p>
        </div>

        <!-- Total ventas del mes -->
        <div class="bg-white rounded-xl border border-blue-200 p-5 bg-blue-50/30">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-blue-700 font-medium">Total ventas del mes</p>
              <p class="text-2xl font-bold text-blue-700 mt-1">{{ formatNumber(kpis.renovadas + kpis.ganadas) }}</p>
            </div>
            <i class="pi pi-shopping-cart text-2xl text-blue-400"></i>
          </div>
          <p class="text-xs text-blue-600 mt-2">
            {{ formatNumber(kpis.renovadas) }} renovadas + {{ formatNumber(kpis.ganadas) }} ganadas
          </p>
        </div>
      </div>

      <!-- Tables -->
      <div class="space-y-6">
        <!-- Ganadas table -->
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div class="flex items-center gap-2">
                <i class="pi pi-arrow-up-right text-green-600"></i>
                <h2 class="text-lg font-semibold text-gray-900">
                  Ganadas
                  <span class="text-sm font-normal text-gray-500">({{ gainedRows.length }})</span>
                </h2>
              </div>
              <p class="text-xs text-gray-500 mt-1">
                Activas al cierre que no lo estaban al inicio. Solo el primer pago de una tienda es un cliente nuevo;
                las demás ya pagaban y volvieron: con hasta 30 días de retraso (renovación tardía) o después (reactivación).
              </p>
            </div>
            <SelectButton
              v-model="gainedFilter"
              :options="gainedFilterOptions"
              optionLabel="label"
              optionValue="value"
              :allowEmpty="false"
            />
          </div>
          <DataTable
            :value="gainedRows"
            stripedRows
            class="p-datatable-sm"
            :paginator="gainedRows.length > 10"
            :rows="10"
          >
            <Column header="Tienda" style="min-width: 180px">
              <template #body="{ data: row }">
                <router-link
                  :to="`/stores/${row.tienda_id}`"
                  class="text-primary-600 hover:text-primary-700 font-medium"
                >
                  {{ row.nombre }}
                </router-link>
              </template>
            </Column>
            <Column field="url" header="URL" style="min-width: 120px">
              <template #body="{ data: row }">
                <span class="text-gray-500 text-sm">{{ row.url }}</span>
              </template>
            </Column>
            <Column header="Plan" style="min-width: 120px">
              <template #body="{ data: row }">
                {{ row.plan }} <span class="text-xs text-gray-400">{{ row.frecuencia }}</span>
              </template>
            </Column>
            <Column header="Precio" style="min-width: 80px">
              <template #body="{ data: row }">
                {{ formatCurrency(row.precio) }}
              </template>
            </Column>
            <Column header="Vigencia" style="min-width: 160px">
              <template #body="{ data: row }">
                <span class="text-sm text-gray-600">
                  {{ formatDate(row.fecha_inicio) }} - {{ formatDate(row.fecha_fin) }}
                </span>
              </template>
            </Column>
            <Column header="Tipo" style="min-width: 150px">
              <template #body="{ data: row }">
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                  :class="tipoBadgeClass(row.tipo)"
                >
                  {{ tipoLabel(row.tipo) }}
                </span>
              </template>
            </Column>
            <Column header="Sin plan" style="min-width: 150px">
              <template #body="{ data: row }">
                <span v-if="row.dias_inactiva === null" class="text-sm text-gray-300">-</span>
                <span v-else class="text-sm text-gray-600">
                  {{ row.dias_inactiva }} {{ row.dias_inactiva === 1 ? 'día' : 'días' }}
                  <span class="text-xs text-gray-400">· venció {{ formatDate(row.vencio_antes) }}</span>
                </span>
              </template>
            </Column>
            <template #empty>
              <div class="text-center py-6 text-gray-400">
                No se ganaron suscripciones en este mes
              </div>
            </template>
          </DataTable>
        </div>

        <!-- Perdidas table -->
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <i class="pi pi-arrow-down-right text-red-600"></i>
              <h2 class="text-lg font-semibold text-gray-900">
                Perdidas
                <span class="text-sm font-normal text-gray-500">({{ lostRows.length }})</span>
              </h2>
            </div>
            <div class="flex flex-wrap items-center gap-4">
              <div v-if="totalLtvLost > 0" class="text-sm text-gray-500">
                LTV de la lista: <span class="font-semibold text-red-600">{{ formatCurrency(totalLtvLost) }}</span>
              </div>
              <SelectButton
                v-model="lostFilter"
                :options="lostFilterOptions"
                optionLabel="label"
                optionValue="value"
                :allowEmpty="false"
              />
            </div>
          </div>
          <p class="px-5 py-3 text-xs text-gray-500 border-b border-gray-100">
            Activas al inicio que no lo estaban al cierre.
            <template v-if="singlePaymentLost > 0">
              <strong class="text-gray-700">{{ singlePaymentLost }} de {{ store.data.perdidas.length }}</strong>
              se fueron tras un solo pago: no pasaron del primer período.
            </template>
            <template v-if="noRecentSalesLost > 0">
              <strong class="text-gray-700">{{ noRecentSalesLost }}</strong> llevaban más de 90 días sin vender (o nunca vendieron).
            </template>
          </p>
          <DataTable
            :value="lostRows"
            stripedRows
            class="p-datatable-sm"
            :paginator="lostRows.length > 10"
            :rows="10"
            sortField="ltv"
            :sortOrder="-1"
          >
            <Column header="Tienda" style="min-width: 180px">
              <template #body="{ data: row }">
                <router-link
                  :to="`/stores/${row.tienda_id}`"
                  class="text-primary-600 hover:text-primary-700 font-medium"
                >
                  {{ row.nombre }}
                </router-link>
              </template>
            </Column>
            <Column field="url" header="URL" style="min-width: 120px">
              <template #body="{ data: row }">
                <span class="text-gray-500 text-sm">{{ row.url }}</span>
              </template>
            </Column>
            <Column header="Plan" style="min-width: 120px">
              <template #body="{ data: row }">
                {{ row.plan }} <span class="text-xs text-gray-400">{{ row.frecuencia }}</span>
              </template>
            </Column>
            <Column header="Precio" style="min-width: 80px">
              <template #body="{ data: row }">
                {{ formatCurrency(row.precio) }}
              </template>
            </Column>
            <Column header="Vencio" style="min-width: 100px">
              <template #body="{ data: row }">
                <span class="text-sm text-gray-600">{{ formatDate(row.fecha_fin) }}</span>
              </template>
            </Column>
            <Column header="Antiguedad" style="min-width: 100px">
              <template #body="{ data: row }">
                <span class="text-sm text-gray-600">
                  {{ row.antiguedad != null ? row.antiguedad + ' a.' : '-' }}
                </span>
              </template>
            </Column>
            <Column header="Ultima venta" style="min-width: 110px">
              <template #body="{ data: row }">
                <span v-if="row.ultima_venta" class="text-sm text-gray-600">{{ formatDate(row.ultima_venta) }}</span>
                <span v-else class="text-sm text-gray-400">Nunca vendió</span>
              </template>
            </Column>
            <Column header="Después" style="min-width: 170px">
              <template #body="{ data: row }">
                <span v-if="row.volvio" class="text-sm text-green-700">
                  Volvió el {{ formatDate(row.volvio) }}
                  <span class="text-xs text-gray-400">· {{ row.dias_fuera }} días fuera</span>
                </span>
                <span v-else class="text-sm text-red-600">Sigue fuera</span>
              </template>
            </Column>
            <Column field="ltv" header="LTV" :sortable="true" style="min-width: 110px">
              <template #body="{ data: row }">
                <div>
                  <span class="font-medium text-gray-900">{{ formatCurrency(row.ltv) }}</span>
                  <span class="text-xs text-gray-400 ml-1">({{ row.pagos }} pagos)</span>
                </div>
              </template>
            </Column>
            <template #empty>
              <div class="text-center py-6 text-gray-400">
                No se perdieron suscripciones en este mes
              </div>
            </template>
          </DataTable>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import SectionTabs from '@/components/layout/SectionTabs.vue'
import { MRR_TABS } from '@/config/sections.config'
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import SelectButton from 'primevue/selectbutton'
import { useSubscriptionMovementStore } from '@/stores/subscription-movement.store'
import { useFormatters } from '@/composables/useFormatters'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dropdown from 'primevue/dropdown'
import type { GainedStoreType } from '@/types/subscription-movement.types'

const store = useSubscriptionMovementStore()
const { formatCurrency, formatNumber, formatDate } = useFormatters()

// Build month options (last 24 months)
function buildMonthOptions() {
  const options: { label: string; value: string }[] = []
  const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const now = new Date()

  for (let i = 1; i <= 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = `${months[d.getMonth()]} ${d.getFullYear()}`
    options.push({ label, value })
  }
  return options
}

const monthOptions = buildMonthOptions()

// El gráfico de churn del resumen enlaza acá con ?month=. El mes en curso no
// está en la lista (no ha cerrado): cae al último mes cerrado.
const route = useRoute()
const requestedMonth = typeof route.query.month === 'string' ? route.query.month : ''
const selectedMonth = ref(
  monthOptions.some(o => o.value === requestedMonth) ? requestedMonth : monthOptions[0].value
)

// --- Filtros de las listas ---
const gainedFilter = ref<'all' | 'new' | 'returning'>('all')
const gainedFilterOptions = [
  { label: 'Todas', value: 'all' },
  { label: 'Clientes nuevos', value: 'new' },
  { label: 'Ya eran clientes', value: 'returning' }
]
const gainedRows = computed(() => {
  const rows = store.data?.ganadas ?? []
  if (gainedFilter.value === 'new') return rows.filter(r => r.es_nueva)
  if (gainedFilter.value === 'returning') return rows.filter(r => !r.es_nueva)
  return rows
})

const lostFilter = ref<'all' | 'gone' | 'returned'>('all')
const lostFilterOptions = [
  { label: 'Todas', value: 'all' },
  { label: 'Siguen fuera', value: 'gone' },
  { label: 'Volvieron', value: 'returned' }
]
const lostRows = computed(() => {
  const rows = store.data?.perdidas ?? []
  if (lostFilter.value === 'gone') return rows.filter(r => !r.volvio)
  if (lostFilter.value === 'returned') return rows.filter(r => !!r.volvio)
  return rows
})

// Dos lecturas rápidas del churn del mes: cuántas no pasaron del primer pago y
// cuántas ya no vendían cuando se fueron.
const singlePaymentLost = computed(() => (store.data?.perdidas ?? []).filter(r => r.pagos <= 1).length)
const noRecentSalesLost = computed(() =>
  (store.data?.perdidas ?? []).filter(r => {
    if (!r.ultima_venta) return true
    const days = (new Date(r.fecha_fin).getTime() - new Date(r.ultima_venta.replace(' ', 'T')).getTime()) / 86_400_000
    return days > 90
  }).length
)

const isCurrentOrFutureMonth = computed(() => {
  return selectedMonth.value === monthOptions[0].value
})

const totalLtvLost = computed(() => lostRows.value.reduce((sum, s) => sum + (s.ltv || 0), 0))

const kpis = computed(() => store.data?.kpis ?? {
  activas_inicio: 0,
  activas_cierre: 0,
  ganadas: 0,
  nuevas: 0,
  renovaciones_tardias: 0,
  reactivadas: 0,
  perdidas: 0,
  perdidas_volvieron: 0,
  perdidas_definitivas: 0,
  variacion: 0,
  por_renovar: 0,
  renovadas: 0
})

function prevMonth() {
  const idx = monthOptions.findIndex(o => o.value === selectedMonth.value)
  if (idx < monthOptions.length - 1) {
    selectedMonth.value = monthOptions[idx + 1].value
    loadData()
  }
}

function nextMonth() {
  const idx = monthOptions.findIndex(o => o.value === selectedMonth.value)
  if (idx > 0) {
    selectedMonth.value = monthOptions[idx - 1].value
    loadData()
  }
}

function onMonthChange() {
  loadData()
}

function loadData() {
  store.fetchMovement(selectedMonth.value)
}

function tipoLabel(tipo: GainedStoreType): string {
  const labels: Record<GainedStoreType, string> = {
    nueva: 'Nueva',
    conversion: 'Nueva (venía de prueba)',
    renovacion_tardia: 'Renovación tardía',
    reactivacion: 'Reactivación'
  }
  return labels[tipo] || tipo
}

function tipoBadgeClass(tipo: GainedStoreType): string {
  const classes: Record<GainedStoreType, string> = {
    nueva: 'bg-green-100 text-green-700',
    conversion: 'bg-green-100 text-green-700',
    renovacion_tardia: 'bg-gray-100 text-gray-700',
    reactivacion: 'bg-purple-100 text-purple-700'
  }
  return classes[tipo] || 'bg-gray-100 text-gray-700'
}

onMounted(() => {
  loadData()
})
</script>
