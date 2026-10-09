<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Ingresos facturados</h1>
        <p class="text-sm text-gray-500 mt-1 max-w-3xl">
          Lo que MiTienda emitió, sin IGV, por fecha de emisión y en soles. Incluye lo facturado desde el sistema y lo
          emitido directo en Nubefact; las notas de crédito restan. No es el MRR.
        </p>
      </div>
      <Button
        label="Exportar CSV"
        icon="pi pi-download"
        severity="secondary"
        outlined
        :disabled="!report || report.groups.length === 0"
        @click="exportCsv"
      />
    </div>

    <!-- Filters: una sola fila, encima de todo lo que gobiernan -->
    <div class="bg-white rounded-xl border border-gray-200 p-4">
      <div class="flex flex-wrap items-end gap-3">
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Desde</label>
          <InputText v-model="from" type="month" class="w-40" @change="load" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
          <InputText v-model="to" type="month" class="w-40" @change="load" />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Periodo</label>
          <SelectButton
            v-model="granularity"
            :options="granularityOptions"
            optionLabel="label"
            optionValue="value"
            :allowEmpty="false"
            @change="load"
          />
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-500 mb-1">Agrupar por</label>
          <Dropdown
            v-model="groupBy"
            :options="groupOptions"
            optionLabel="label"
            optionValue="value"
            class="w-52"
            @change="onGroupChange"
          />
        </div>
        <div v-for="dimension in filterDimensions" :key="dimension.id">
          <label class="block text-xs font-medium text-gray-500 mb-1">{{ dimension.name }}</label>
          <Dropdown
            v-model="valueFilters[dimension.id]"
            :options="orderedValues(dimension).map(v => ({ label: v.name, value: v.id }))"
            optionLabel="label"
            optionValue="value"
            placeholder="Todos"
            showClear
            class="w-48"
            @change="load"
          />
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-2"></i>
      <p class="text-red-700 font-medium">{{ error }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="load" />
    </div>

    <!-- Loading -->
    <div v-else-if="!report" class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div v-for="i in 4" :key="i" class="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div class="h-3 bg-gray-100 rounded w-1/2 mb-3"></div>
        <div class="h-6 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>

    <template v-else>
      <!-- Resumen -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4" :class="{ 'opacity-60': loading }">
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <div class="text-sm text-gray-500">Ingreso neto</div>
          <div class="text-2xl font-bold text-gray-900 mt-1">{{ formatCurrency(report.summary.net) }}</div>
          <div class="text-xs text-gray-400 mt-1">
            Sin IGV · IGV {{ formatCurrency(report.summary.tax) }} · con IGV {{ formatCurrency(report.summary.gross) }}
          </div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <div class="text-sm text-gray-500">Facturado</div>
          <div class="text-2xl font-bold text-gray-900 mt-1">{{ formatCurrency(report.summary.invoiced) }}</div>
          <div class="text-xs text-gray-400 mt-1">
            {{ formatNumber(report.summary.invoices) }} comprobantes · {{ formatNumber(report.summary.customers) }} clientes
          </div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <div class="text-sm text-gray-500">Notas de crédito</div>
          <div class="text-2xl font-bold text-gray-900 mt-1">{{ formatCurrency(report.summary.credit_notes) }}</div>
          <div class="text-xs text-gray-400 mt-1">{{ formatNumber(report.summary.credit_note_count) }} notas</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <div class="text-sm text-gray-500">Sin etiquetar</div>
          <div class="text-2xl font-bold text-gray-900 mt-1">{{ formatCurrency(report.summary.untagged) }}</div>
          <div class="text-xs mt-1" :class="untaggedShare > 0 ? 'text-amber-600' : 'text-gray-400'">
            <template v-if="!hasUntaggedBucket">No aplica a esta agrupación</template>
            <template v-else-if="untaggedShare > 0">
              {{ formatPercent(untaggedShare) }} del ingreso ·
              <router-link :to="{ name: 'BillingConcepts' }" class="underline">etiquetar conceptos</router-link>
            </template>
            <template v-else>Todo clasificado</template>
          </div>
        </div>
      </div>

      <!-- Comparacion contra el periodo anterior y el mismo periodo del ano pasado -->
      <div class="bg-white rounded-xl border border-gray-200 p-5" :class="{ 'opacity-60': loading }">
        <h3 class="text-base font-semibold text-gray-800">Comparación del ingreso neto</h3>
        <p class="text-sm text-gray-500 mt-0.5">
          {{ rangeLabel(from, to) }}, con los mismos filtros.
          <span v-if="includesCurrentMonth" class="text-amber-700">
            Incluye el mes en curso, que está incompleto: la comparación sale a la baja.
          </span>
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-4">
          <div v-for="item in comparisons" :key="item.key">
            <p class="text-sm text-gray-500 font-medium">{{ item.label }}</p>
            <p class="text-xs text-gray-400">{{ rangeLabel(item.from, item.to) }}</p>
            <p class="text-2xl font-bold text-gray-900 mt-1">{{ formatCurrency(item.net) }}</p>
            <p class="text-sm mt-1" :class="deltaClass(report.summary.net, item.net)">
              <i
                v-if="item.net !== 0 && report.summary.net !== item.net"
                class="pi text-[10px]"
                :class="report.summary.net > item.net ? 'pi-arrow-up' : 'pi-arrow-down'"
              ></i>
              {{ deltaLabel(report.summary.net, item.net) }}
              <span class="text-gray-400">· {{ signedCurrency(report.summary.net - item.net) }}</span>
            </p>
          </div>
        </div>
      </div>

      <!-- B2C, B2B y Otros: siempre a la vista, agrupe como agrupe la tabla.
           Va antes del v-if de abajo: en medio le robaria el v-else al grafico y la tabla. -->
      <BusinessLineDonut
        v-if="lineDimension"
        :from="from"
        :to="to"
        :dimension="lineDimension"
        :value-ids="lineValueIds"
      />

      <!-- Empty -->
      <div v-if="report.groups.length === 0" class="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <i class="pi pi-chart-bar text-4xl text-gray-300 mb-3"></i>
        <p class="text-gray-500 font-medium">Sin facturación en este rango</p>
        <p class="text-sm text-gray-400 mt-1">Prueba con otras fechas o quita filtros</p>
      </div>

      <template v-else>
        <!-- Chart -->
        <div class="bg-white rounded-xl border border-gray-200 p-5" :class="{ 'opacity-60': loading }">
          <h3 class="text-base font-semibold text-gray-800 mb-4">
            Ingreso neto por {{ granularity === 'year' ? 'año' : 'mes' }}, según {{ groupLabel.toLowerCase() }}
          </h3>
          <v-chart :option="chartOption" :autoresize="true" class="chart-container" />
        </div>

        <!-- Tabla: los mismos numeros del grafico, exactos -->
        <div class="bg-white rounded-xl border border-gray-200 overflow-x-auto" :class="{ 'opacity-60': loading }">
          <table class="min-w-full text-sm">
            <thead>
              <tr class="border-b border-gray-200 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                <th class="sticky left-0 bg-white px-5 py-3">{{ groupLabel }}</th>
                <th v-for="period in report.periods" :key="period" class="px-3 py-3 text-right whitespace-nowrap">
                  {{ periodLabel(period) }}
                </th>
                <th class="px-3 py-3 text-right">Total</th>
                <th class="px-3 py-3 text-right">%</th>
                <th
                  v-for="item in comparisons"
                  :key="item.key"
                  class="px-3 py-3 text-right whitespace-nowrap last:pr-5"
                  v-tooltip.top="`${item.label}: ${rangeLabel(item.from, item.to)}`"
                >
                  {{ item.short }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="group in tableGroups" :key="group.key" class="border-b border-gray-100">
                <td class="sticky left-0 bg-white px-5 py-2.5 whitespace-nowrap">
                  <span class="inline-flex items-center gap-2" :class="group.key === UNTAGGED ? 'text-amber-700' : 'text-gray-700'">
                    <span class="inline-block h-2.5 w-2.5 rounded-sm" :style="{ backgroundColor: colorOf(group.key) }"></span>
                    {{ group.name || '(sin nombre)' }}
                  </span>
                </td>
                <td v-for="period in report.periods" :key="period" class="px-3 py-2.5 text-right tabular-nums text-gray-600">
                  {{ group.values[period] ? formatAmount(group.values[period]) : '-' }}
                </td>
                <td class="px-3 py-2.5 text-right tabular-nums font-semibold text-gray-800">{{ formatAmount(group.total) }}</td>
                <td class="px-3 py-2.5 text-right tabular-nums text-gray-500">{{ share(group.total) }}</td>
                <td
                  v-for="item in comparisons"
                  :key="item.key"
                  class="px-3 py-2.5 text-right tabular-nums whitespace-nowrap last:pr-5"
                  :class="deltaClass(group.total, item.byKey[group.key] ?? 0)"
                  v-tooltip.top="`Antes: ${formatCurrency(item.byKey[group.key] ?? 0)}`"
                >
                  {{ deltaLabel(group.total, item.byKey[group.key] ?? 0) }}
                </td>
              </tr>
              <tr v-if="hiddenGroups > 0" class="border-b border-gray-100">
                <td class="sticky left-0 bg-white px-5 py-2.5 text-gray-500" :colspan="report.periods.length + 5">
                  y {{ formatNumber(hiddenGroups) }} más.
                  <button class="text-primary-600 hover:underline" @click="showAll = true">Ver todos</button>
                  (el CSV los trae completos)
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="font-semibold text-gray-900">
                <td class="sticky left-0 bg-white px-5 py-3">Total</td>
                <td v-for="period in report.periods" :key="period" class="px-3 py-3 text-right tabular-nums">
                  {{ formatAmount(report.totals[period] ?? 0) }}
                </td>
                <td class="px-3 py-3 text-right tabular-nums">{{ formatAmount(report.summary.net) }}</td>
                <td class="px-3 py-3 text-right">100%</td>
                <td
                  v-for="item in comparisons"
                  :key="item.key"
                  class="px-3 py-3 text-right tabular-nums whitespace-nowrap last:pr-5"
                  :class="deltaClass(report.summary.net, item.net)"
                >
                  {{ deltaLabel(report.summary.net, item.net) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import BusinessLineDonut from '@/components/billing/BusinessLineDonut.vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import SelectButton from 'primevue/selectbutton'
import Button from 'primevue/button'
import { useChartTheme } from '@/composables/useChartTheme'
import { useFormatters } from '@/composables/useFormatters'
import { getLedgerDimensions, getLedgerReport, ledgerErrorMessage } from '@/api/ledger.api'
import { RECURRENCE_ORDER, orderedValues } from '@/config/ledger.config'
import type { LedgerReport, LedgerReportGroup, LedgerTagDimension } from '@/types/ledger.types'

use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const { colors, palette } = useChartTheme()
const { formatCurrency, formatNumber, formatPercent, formatShortMonth, formatMonthYear } = useFormatters()

const UNTAGGED = 'untagged'
const OTHERS = '__others__'
// Mas series que esto y los colores dejan de distinguirse: el resto va a "Otros".
const MAX_SERIES = 6
const TABLE_LIMIT = 25

const ORIGIN_ORDER = ['suscripcion', 'comision', 'importado', 'manual', 'otros']

function monthsAgo(n: number): string {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() - n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const dimensions = ref<LedgerTagDimension[]>([])
const report = ref<LedgerReport | null>(null)
// Mismo reporte, corrido al periodo inmediatamente anterior y un ano atras.
const previousReport = ref<LedgerReport | null>(null)
const yearAgoReport = ref<LedgerReport | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
const showAll = ref(false)

const from = ref(monthsAgo(11))
const to = ref(monthsAgo(0))
const granularity = ref<'month' | 'year'>('month')
const groupBy = ref('fuente')
const valueFilters = reactive<Record<number, number | null>>({})

const granularityOptions = [
  { label: 'Mes', value: 'month' },
  { label: 'Año', value: 'year' }
]

const activeDimensions = computed(() => dimensions.value.filter(d => d.is_active))

const groupOptions = computed(() => [
  { label: 'Tipo de ingreso', value: 'recurrence' },
  ...activeDimensions.value.map(d => ({ label: d.name, value: d.slug })),
  { label: 'Origen del comprobante', value: 'origin' },
  { label: 'Cliente', value: 'customer' }
])

const groupLabel = computed(() => groupOptions.value.find(o => o.value === groupBy.value)?.label ?? '')
const groupDimension = computed(() => activeDimensions.value.find(d => d.slug === groupBy.value))
// Por tipo de ingreso tambien hay lineas sin clasificar (sin fuente).
const hasUntaggedBucket = computed(() => !!groupDimension.value || groupBy.value === 'recurrence')

// Se puede filtrar por cualquier dimension menos la que ya agrupa.
const filterDimensions = computed(() => activeDimensions.value.filter(d => d.slug !== groupBy.value))

// El reparto por línea respeta los filtros de las otras dimensiones, pero no el
// de la propia línea: filtrarla dejaría una sola porción.
const lineDimension = computed(() => activeDimensions.value.find(d => d.slug === 'linea_negocio') ?? null)
const lineValueIds = computed(() =>
  activeDimensions.value
    .filter(d => d.slug !== 'linea_negocio')
    .map(d => valueFilters[d.id])
    .filter((id): id is number => typeof id === 'number')
)

const untaggedShare = computed(() =>
  report.value && report.value.summary.net > 0 ? (report.value.summary.untagged / report.value.summary.net) * 100 : 0
)

function onGroupChange() {
  // El filtro sobre la dimension que pasa a agrupar deja de tener sentido.
  if (groupDimension.value) valueFilters[groupDimension.value.id] = null
  showAll.value = false
  load()
}

// --- Comparacion de periodos ---
function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split('-').map(Number)
  const d = new Date(year, m - 1 + delta, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Meses que abarca el rango, contando ambos extremos. */
const span = computed(() => {
  const [fy, fm] = from.value.split('-').map(Number)
  const [ty, tm] = to.value.split('-').map(Number)
  return Math.max(1, (ty - fy) * 12 + (tm - fm) + 1)
})

const includesCurrentMonth = computed(() => to.value >= monthsAgo(0))

function rangeLabel(start: string, end: string): string {
  return start === end ? formatMonthYear(start) : `${formatMonthYear(start)} a ${formatMonthYear(end)}`
}

const comparisons = computed(() => {
  const single = span.value === 1
  const build = (key: string, label: string, short: string, delta: number, source: LedgerReport | null) => ({
    key,
    label,
    short,
    from: shiftMonth(from.value, delta),
    to: shiftMonth(to.value, delta),
    net: source?.summary.net ?? 0,
    byKey: Object.fromEntries((source?.groups ?? []).map(g => [g.key, g.total])) as Record<string, number>
  })

  return [
    build('previous', single ? 'Mes anterior' : 'Período anterior', single ? 'vs. mes ant.' : 'vs. per. ant.', -span.value, previousReport.value),
    build(
      'year',
      single ? 'Mismo mes del año anterior' : 'Mismo período del año anterior',
      'vs. año ant.',
      -12,
      yearAgoReport.value
    )
  ]
})

function deltaLabel(current: number, base: number): string {
  if (Math.round(base) === 0) return Math.round(current) === 0 ? '-' : 'nuevo'
  const pct = ((current - base) / Math.abs(base)) * 100
  return `${pct > 0 ? '+' : ''}${formatPercent(pct)}`
}

function deltaClass(current: number, base: number): string {
  if (Math.round(base) === 0 || Math.round(current) === Math.round(base)) return 'text-gray-400'
  return current > base ? 'text-green-600' : 'text-red-600'
}

function signedCurrency(value: number): string {
  return `${value > 0 ? '+' : ''}${formatCurrency(value)}`
}

async function load() {
  if (!from.value || !to.value) return

  loading.value = true
  error.value = null
  try {
    const query = {
      group_by: groupBy.value,
      granularity: granularity.value,
      valueIds: filterDimensions.value
        .map(d => valueFilters[d.id])
        .filter((id): id is number => typeof id === 'number')
    }
    const fetchShifted = (delta: number) =>
      getLedgerReport({ ...query, from: shiftMonth(from.value, delta), to: shiftMonth(to.value, delta) })

    const [main, previous, yearAgo] = await Promise.all([fetchShifted(0), fetchShifted(-span.value), fetchShifted(-12)])
    report.value = main
    previousReport.value = previous
    yearAgoReport.value = yearAgo
  } catch (e) {
    error.value = ledgerErrorMessage(e)
  } finally {
    loading.value = false
  }
}

// --- Color: sigue a la entidad, no a su posicion en el ranking ---
// Para una dimension el color sale del orden fijo de sus valores, asi un filtro
// que cambia quien va primero no repinta las series. Por cliente no hay orden
// propio y se usa el ranking del reporte.
const colorIndex = computed<Record<string, number>>(() => {
  const order = groupDimension.value
    ? groupDimension.value.values.map(v => v.slug)
    : groupBy.value === 'origin'
      ? ORIGIN_ORDER
      : groupBy.value === 'recurrence'
        ? RECURRENCE_ORDER
        : (report.value?.groups ?? []).map(g => g.key)

  return Object.fromEntries(order.map((key, i) => [key, i]))
})

function colorOf(key: string): string {
  if (key === UNTAGGED) return colors.gray[300]
  const index = colorIndex.value[key]
  if (key === OTHERS || index === undefined || index >= MAX_SERIES) return colors.gray[500]
  return palette[index]
}

const chartSeries = computed(() => {
  if (!report.value) return []

  const shown: LedgerReportGroup[] = []
  const others: LedgerReportGroup = { key: OTHERS, name: 'Otros', total: 0, lines: 0, values: {} }
  let untagged: LedgerReportGroup | null = null

  for (const group of report.value.groups) {
    if (group.key === UNTAGGED) {
      untagged = group
    } else if ((colorIndex.value[group.key] ?? MAX_SERIES) < MAX_SERIES) {
      shown.push(group)
    } else {
      others.total += group.total
      for (const period of report.value.periods) {
        others.values[period] = (others.values[period] ?? 0) + (group.values[period] ?? 0)
      }
    }
  }

  shown.sort((a, b) => colorIndex.value[a.key] - colorIndex.value[b.key])
  if (others.total !== 0) shown.push(others)
  if (untagged) shown.push({ ...untagged, name: 'Sin etiquetar' })

  return shown
})

const chartOption = computed(() => ({
  grid: { top: 16, right: 16, bottom: 56, left: 64 },
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'shadow' },
    backgroundColor: '#fff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    textStyle: { color: '#374151', fontSize: 13 },
    formatter: (params: any[]) => {
      const rows = params.filter(p => p.value)
      const total = rows.reduce((sum, p) => sum + p.value, 0)
      let html = `<div class="font-medium">${params[0]?.axisValue}</div>`
      rows.forEach(p => {
        html += `<div class="text-sm">${p.marker} ${p.seriesName}: ${formatCurrency(p.value)}</div>`
      })
      return `${html}<div class="text-sm font-medium" style="margin-top:4px">Total: ${formatCurrency(total)}</div>`
    }
  },
  legend: {
    bottom: 0,
    type: 'scroll',
    textStyle: { color: '#6b7280', fontSize: 12 },
    itemWidth: 12,
    itemHeight: 12,
    itemGap: 16
  },
  xAxis: {
    type: 'category',
    data: (report.value?.periods ?? []).map(periodLabel),
    axisLine: { lineStyle: { color: '#e5e7eb' } },
    axisTick: { show: false },
    axisLabel: { color: '#6b7280', fontSize: 11 }
  },
  yAxis: {
    type: 'value',
    axisLabel: { color: '#6b7280', fontSize: 11, formatter: (v: number) => compact(v) },
    splitLine: { lineStyle: { color: '#f3f4f6' } }
  },
  series: chartSeries.value.map(group => ({
    name: group.name || '(sin nombre)',
    type: 'bar',
    stack: 'income',
    barMaxWidth: 36,
    color: colorOf(group.key),
    // Separacion blanca entre segmentos: la identidad no depende solo del color.
    itemStyle: { borderColor: '#fff', borderWidth: 1 },
    emphasis: { focus: 'series' },
    data: (report.value?.periods ?? []).map(period => Math.round(group.values[period] ?? 0))
  }))
}))

// --- Tabla ---
const tableGroups = computed(() => {
  const groups = report.value?.groups ?? []
  return showAll.value ? groups : groups.slice(0, TABLE_LIMIT)
})

const hiddenGroups = computed(() => (report.value?.groups.length ?? 0) - tableGroups.value.length)

function periodLabel(period: string): string {
  return period.length === 4 ? period : formatShortMonth(period)
}

function formatAmount(value: number): string {
  return Math.round(value).toLocaleString('es-PE')
}

function compact(value: number): string {
  const abs = Math.abs(value)
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${Math.round(value / 1_000)}K`
  return String(value)
}

function share(total: number): string {
  const net = report.value?.summary.net ?? 0
  return net !== 0 ? formatPercent((total / net) * 100) : '-'
}

function exportCsv() {
  if (!report.value) return

  const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`
  const rows = [
    [groupLabel.value, ...report.value.periods, 'Total', ...comparisons.value.map(c => `${c.label} (${c.from} a ${c.to})`)],
    ...report.value.groups.map(g => [
      g.name,
      ...report.value!.periods.map(p => g.values[p] ?? 0),
      g.total,
      ...comparisons.value.map(c => c.byKey[g.key] ?? 0)
    ]),
    [
      'Total',
      ...report.value.periods.map(p => report.value!.totals[p] ?? 0),
      report.value.summary.net,
      ...comparisons.value.map(c => c.net)
    ]
  ]

  // BOM para que Excel abra los acentos bien.
  const blob = new Blob(['﻿' + rows.map(r => r.map(cell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `ingresos-${groupBy.value}-${report.value.from}-a-${report.value.to}.csv`
  link.click()
  URL.revokeObjectURL(link.href)
}

onMounted(async () => {
  try {
    dimensions.value = await getLedgerDimensions()
  } catch (e) {
    error.value = ledgerErrorMessage(e)
    return
  }
  load()
})
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 360px;
}
</style>
