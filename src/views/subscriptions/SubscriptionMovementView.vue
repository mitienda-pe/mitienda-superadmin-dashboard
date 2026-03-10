<template>
  <div class="space-y-6">
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
    <div v-if="store.isLoading" class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <div v-for="n in 5" :key="n" class="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
        <div class="h-8 bg-gray-200 rounded w-1/2"></div>
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
        </div>

        <!-- Perdidas -->
        <div class="bg-white rounded-xl border border-red-200 p-5 bg-red-50/30">
          <p class="text-sm text-red-700 font-medium">Perdidas</p>
          <p class="text-2xl font-bold text-red-700 mt-1">-{{ formatNumber(kpis.perdidas) }}</p>
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

      <!-- Tables -->
      <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <!-- Ganadas table -->
        <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <i class="pi pi-arrow-up-right text-green-600"></i>
            <h2 class="text-lg font-semibold text-gray-900">
              Ganadas
              <span class="text-sm font-normal text-gray-500">({{ store.data.ganadas.length }})</span>
            </h2>
          </div>
          <DataTable
            :value="store.data.ganadas"
            stripedRows
            class="p-datatable-sm"
            :paginator="store.data.ganadas.length > 10"
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
            <Column field="plan" header="Plan" style="min-width: 100px" />
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
            <Column header="Tipo" style="min-width: 120px">
              <template #body="{ data: row }">
                <span
                  class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium"
                  :class="tipoBadgeClass(row.tipo)"
                >
                  {{ tipoLabel(row.tipo) }}
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
                <span class="text-sm font-normal text-gray-500">({{ store.data.perdidas.length }})</span>
              </h2>
            </div>
            <div v-if="totalLtvLost > 0" class="text-sm text-gray-500">
              LTV total perdido: <span class="font-semibold text-red-600">{{ formatCurrency(totalLtvLost) }}</span>
            </div>
          </div>
          <DataTable
            :value="store.data.perdidas"
            stripedRows
            class="p-datatable-sm"
            :paginator="store.data.perdidas.length > 10"
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
            <Column field="plan" header="Plan" style="min-width: 100px" />
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
            <Column header="LTV" style="min-width: 110px">
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
import { ref, computed, onMounted } from 'vue'
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
const selectedMonth = ref(monthOptions[0].value)

const isCurrentOrFutureMonth = computed(() => {
  return selectedMonth.value === monthOptions[0].value
})

const totalLtvLost = computed(() =>
  (store.data?.perdidas ?? []).reduce((sum, s) => sum + (s.ltv || 0), 0)
)

const kpis = computed(() => store.data?.kpis ?? {
  activas_inicio: 0,
  activas_cierre: 0,
  ganadas: 0,
  perdidas: 0,
  variacion: 0
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
    conversion: 'Conversion',
    reactivacion: 'Reactivacion'
  }
  return labels[tipo] || tipo
}

function tipoBadgeClass(tipo: GainedStoreType): string {
  const classes: Record<GainedStoreType, string> = {
    nueva: 'bg-blue-100 text-blue-700',
    conversion: 'bg-amber-100 text-amber-700',
    reactivacion: 'bg-purple-100 text-purple-700'
  }
  return classes[tipo] || 'bg-gray-100 text-gray-700'
}

onMounted(() => {
  loadData()
})
</script>
