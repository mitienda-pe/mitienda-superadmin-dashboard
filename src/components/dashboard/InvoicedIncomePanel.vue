<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <div class="flex flex-wrap items-start justify-between gap-3 mb-5">
      <div>
        <h3 class="text-base font-semibold text-gray-800">Ingreso facturado · {{ scopeLabel }}</h3>
        <p class="text-sm text-gray-500 mt-0.5">
          Lo que se emitió, sin IGV. Incluye lo que el MRR no cuenta: comisiones e ingresos extraordinarios.
        </p>
      </div>
      <router-link :to="{ name: 'BillingIncome' }" class="text-sm font-medium text-primary-600 hover:underline shrink-0">
        Ver reporte completo
      </router-link>
    </div>

    <!-- Error: el resto del resumen no depende de este bloque -->
    <p v-if="error" class="text-sm text-red-600">
      No se pudo cargar el ingreso facturado: {{ error }}
      <button class="underline" @click="load">Reintentar</button>
    </p>

    <!-- Loading -->
    <p v-else-if="scopeMissing" class="text-sm text-gray-600">
      No existe el valor de línea de negocio para este resumen. Revísalo en
      <router-link :to="{ name: 'BillingTags' }" class="underline">Etiquetas</router-link>.
    </p>

    <!-- Loading -->
    <div v-else-if="!report" class="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
      <div v-for="i in 4" :key="i">
        <div class="h-3 bg-gray-100 rounded w-1/2 mb-3"></div>
        <div class="h-6 bg-gray-200 rounded w-2/3"></div>
      </div>
    </div>

    <template v-else>
      <!-- Ultimo mes cerrado -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4" :class="{ 'opacity-60': loading }">
        <div>
          <p class="text-sm text-gray-500 font-medium">Total de {{ monthName }}, sin IGV</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ formatCurrency(monthTotal) }}</p>
          <p class="text-xs text-gray-400 mt-1">
            IGV {{ formatCurrency(monthTax) }} · con IGV {{ formatCurrency(monthTotal + monthTax) }}
          </p>
          <p v-if="change !== null" class="text-xs mt-1" :class="change >= 0 ? 'text-green-600' : 'text-red-600'">
            <i class="pi text-[10px]" :class="change >= 0 ? 'pi-arrow-up' : 'pi-arrow-down'"></i>
            {{ Math.abs(change).toFixed(1) }}% frente al mes anterior
          </p>
        </div>

        <div v-for="type in types" :key="type.value">
          <p class="text-sm text-gray-500 font-medium inline-flex items-center gap-2">
            <span class="inline-block h-2.5 w-2.5 rounded-sm" :style="{ backgroundColor: type.color }"></span>
            {{ type.label }}
          </p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ formatCurrency(type.amount) }}</p>
          <p class="text-xs text-gray-400 mt-1">{{ type.share }} del mes · {{ type.hint }}</p>
        </div>
      </div>

      <!-- Reparto por linea de negocio: solo tiene sentido viendo todo junto -->
      <div
        v-if="scope === 'all' && lineSegments.length > 0"
        class="mt-5 border-t border-gray-100 pt-5"
        :class="{ 'opacity-60': loading }"
      >
        <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
          <p class="text-sm font-medium text-gray-700">Por línea de negocio, sin IGV</p>
          <SelectButton
            v-model="linePeriod"
            :options="linePeriodOptions"
            optionLabel="label"
            optionValue="value"
            :allowEmpty="false"
          />
        </div>
        <div class="flex flex-wrap items-center gap-6">
          <v-chart :option="lineChartOption" :autoresize="true" class="donut-chart" />
          <table class="flex-1 min-w-[16rem] text-sm">
            <tbody>
              <tr v-for="segment in lineSegments" :key="segment.key" class="border-b border-gray-100 last:border-0">
                <td class="py-1.5 pr-3">
                  <span class="inline-flex items-center gap-2" :class="segment.untagged ? 'text-amber-700' : 'text-gray-700'">
                    <span class="inline-block h-2.5 w-2.5 rounded-sm" :style="{ backgroundColor: segment.color }"></span>
                    {{ segment.name }}
                  </span>
                </td>
                <td class="py-1.5 text-right tabular-nums text-gray-800">{{ formatCurrency(segment.amount) }}</td>
                <td class="py-1.5 pl-3 text-right tabular-nums text-gray-400 w-12">{{ segment.share }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p v-if="untaggedMonth > 0" class="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Además hay {{ formatCurrency(untaggedMonth) }} de {{ monthName }} sin clasificar, que no entra en ninguno de los
        tres tipos.
        <router-link :to="{ name: 'BillingConcepts' }" class="underline">Etiquetar conceptos</router-link>
      </p>

      <!-- 12 meses -->
      <div class="mt-5 grid grid-cols-1 xl:grid-cols-3 gap-6" :class="{ 'opacity-60': loading }">
        <v-chart :option="chartOption" :autoresize="true" class="chart-container xl:col-span-2" />

        <!-- Concentracion: de quien viene el ingreso -->
        <div v-if="customers.length > 0">
          <p class="text-sm font-medium text-gray-700 mb-2">Mayores clientes, 12 meses</p>
          <table class="w-full text-sm">
            <tbody>
              <tr v-for="customer in customers" :key="customer.key" class="border-b border-gray-100 last:border-0">
                <td class="py-1.5 pr-3 text-gray-700 truncate max-w-[12rem]">{{ customer.name || '(sin nombre)' }}</td>
                <td class="py-1.5 text-right tabular-nums text-gray-800">{{ formatCurrency(customer.total) }}</td>
                <td class="py-1.5 pl-3 text-right tabular-nums text-gray-400 w-12">{{ customer.share }}</td>
              </tr>
            </tbody>
          </table>
          <p class="text-xs text-gray-400 mt-2">Juntos son el {{ topShare }} del ingreso del periodo.</p>
        </div>
      </div>

      <p class="text-xs text-gray-400 mt-2">
        Meses cerrados, hasta {{ monthName }}. Lo emitido directo en Nubefact aparece cuando se importa su reporte.
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart, PieChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import SelectButton from 'primevue/selectbutton'
import { useChartTheme } from '@/composables/useChartTheme'
import { useFormatters } from '@/composables/useFormatters'
import { getLedgerDimensions, getLedgerReport, ledgerErrorMessage } from '@/api/ledger.api'
import { INCOME_SCOPE_OPTIONS, RECURRENCE_OPTIONS, type IncomeScope } from '@/config/ledger.config'
import type { LedgerReport, LedgerReportGroup, LedgerTagDimension } from '@/types/ledger.types'

use([BarChart, PieChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const { colors } = useChartTheme()
const { formatCurrency, formatShortMonth, formatMonthYear } = useFormatters()

const UNTAGGED = 'untagged'

const props = withDefaults(defineProps<{ scope?: IncomeScope }>(), { scope: 'all' })

const report = ref<LedgerReport | null>(null)
const byLine = ref<LedgerReport | null>(null)
const byCustomer = ref<LedgerReport | null>(null)
const lineDimension = ref<LedgerTagDimension | null>(null)
const error = ref<string | null>(null)
const loading = ref(false)
const scopeMissing = ref(false)

const scopeLabel = computed(() => INCOME_SCOPE_OPTIONS.find(o => o.value === props.scope)?.label ?? '')

function monthsAgo(n: number): string {
  const now = new Date()
  const d = new Date(now.getFullYear(), now.getMonth() - n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// El mes en curso esta a medias y lo de Nubefact todavia no se importo: el
// bloque trabaja siempre sobre meses cerrados.
const lastMonth = monthsAgo(1)
const previousMonth = monthsAgo(2)
const monthName = computed(() => formatMonthYear(lastMonth))

function amountOf(key: string, period: string): number {
  return report.value?.groups.find(g => g.key === key)?.values[period] ?? 0
}

const monthTotal = computed(() => report.value?.totals[lastMonth] ?? 0)
const monthTax = computed(() => report.value?.tax_totals[lastMonth] ?? 0)

// Reparto por linea de negocio (solo en la vista combinada): B2C, B2B y Otros,
// mas lo que quedo sin linea. Colores propios, distintos de los de tipo de
// ingreso que usa el resto del bloque.
const LINE_COLORS: Record<string, string> = { b2c: '#8b5cf6', b2b: '#ec4899', extraordinario: '#64748b' }
const LINE_ORDER = ['b2c', 'b2b', 'extraordinario']

const linePeriod = ref<'month' | 'year'>('month')
const linePeriodOptions = computed(() => [
  { label: monthName.value, value: 'month' as const },
  { label: '12 meses', value: 'year' as const }
])

const lineSegments = computed(() => {
  const groups = byLine.value?.groups ?? []
  const amountFor = (g: LedgerReportGroup) => (linePeriod.value === 'month' ? g.values[lastMonth] ?? 0 : g.total)
  const rank = (key: string) => {
    if (key === UNTAGGED) return LINE_ORDER.length + 1
    const index = LINE_ORDER.indexOf(key)
    return index === -1 ? LINE_ORDER.length : index
  }

  // Las tres lineas se comparan siempre, aunque alguna no haya facturado en
  // el periodo; cualquier otra (o lo sin linea) solo si tiene importe.
  const known = LINE_ORDER.flatMap(slug => {
    const group = groups.find(g => g.key === slug)
    const name = group?.name ?? lineDimension.value?.values.find(v => v.slug === slug)?.name
    return name ? [{ key: slug, name, amount: group ? amountFor(group) : 0 }] : []
  })
  const rest = groups
    .filter(g => !LINE_ORDER.includes(g.key))
    .map(g => ({ key: g.key, name: g.key === UNTAGGED ? 'Sin línea de negocio' : g.name, amount: amountFor(g) }))
    .filter(row => Math.round(row.amount) !== 0)

  const rows = [...known, ...rest].sort((a, b) => rank(a.key) - rank(b.key))

  const total = rows.reduce((sum, row) => sum + row.amount, 0)

  return rows.map(row => ({
    ...row,
    untagged: row.key === UNTAGGED,
    color: row.key === UNTAGGED ? colors.gray[300] : LINE_COLORS[row.key] ?? colors.gray[500],
    share: total > 0 ? `${((row.amount / total) * 100).toFixed(0)}%` : '-'
  }))
})

const lineChartOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    backgroundColor: '#fff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    textStyle: { color: '#374151', fontSize: 13 },
    formatter: (params: any) =>
      `<div class="font-medium">${params.name}</div>
       <div class="text-sm">${formatCurrency(params.value)} (${params.percent}%)</div>`
  },
  series: [
    {
      type: 'pie',
      radius: ['55%', '85%'],
      label: { show: false },
      itemStyle: { borderColor: '#fff', borderWidth: 2 },
      // Una linea con mas notas de credito que facturas no puede dibujarse como porcion.
      data: lineSegments.value.map(segment => ({
        name: segment.name,
        value: Math.max(0, Math.round(segment.amount)),
        itemStyle: { color: segment.color }
      }))
    }
  ]
}))

// Cinco mayores clientes de los 12 meses y cuanto pesan juntos.
const TOP_CUSTOMERS = 5

const customers = computed(() => {
  const net = byCustomer.value?.summary.net ?? 0
  return (byCustomer.value?.groups ?? []).slice(0, TOP_CUSTOMERS).map((g: LedgerReportGroup) => ({
    ...g,
    share: net > 0 ? `${((g.total / net) * 100).toFixed(0)}%` : '-'
  }))
})

const topShare = computed(() => {
  const net = byCustomer.value?.summary.net ?? 0
  const top = customers.value.reduce((sum, c) => sum + c.total, 0)
  return net > 0 ? `${((top / net) * 100).toFixed(0)}%` : '-'
})
const untaggedMonth = computed(() => amountOf(UNTAGGED, lastMonth))

const change = computed(() => {
  const before = report.value?.totals[previousMonth] ?? 0
  return before > 0 ? ((monthTotal.value - before) / before) * 100 : null
})

const types = computed(() =>
  RECURRENCE_OPTIONS.map(option => {
    const amount = amountOf(option.value, lastMonth)
    return {
      ...option,
      amount,
      share: monthTotal.value > 0 ? `${((amount / monthTotal.value) * 100).toFixed(0)}%` : '-'
    }
  })
)

const chartOption = computed(() => {
  const periods = report.value?.periods ?? []
  const series = [
    ...RECURRENCE_OPTIONS.map(o => ({ key: o.value as string, name: o.label, color: o.color })),
    { key: UNTAGGED, name: 'Sin clasificar', color: colors.gray[300] }
  ]

  return {
    grid: { top: 12, right: 12, bottom: 48, left: 56 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#fff',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#374151', fontSize: 13 },
      formatter: (params: any[]) => {
        const total = params.reduce((sum, p) => sum + p.value, 0)
        let html = `<div class="font-medium">${params[0]?.axisValue}</div>`
        params.filter(p => p.value).forEach(p => {
          html += `<div class="text-sm">${p.marker} ${p.seriesName}: ${formatCurrency(p.value)}</div>`
        })
        return `${html}<div class="text-sm font-medium" style="margin-top:4px">Total: ${formatCurrency(total)}</div>`
      }
    },
    legend: {
      bottom: 0,
      textStyle: { color: '#6b7280', fontSize: 12 },
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 16
    },
    xAxis: {
      type: 'category',
      data: periods.map(formatShortMonth),
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisTick: { show: false },
      axisLabel: { color: '#6b7280', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#6b7280',
        fontSize: 11,
        formatter: (v: number) => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}K` : String(v))
      },
      splitLine: { lineStyle: { color: '#f3f4f6' } }
    },
    series: series.map(s => ({
      name: s.name,
      type: 'bar',
      stack: 'income',
      barMaxWidth: 32,
      color: s.color,
      // Separacion blanca entre segmentos: la identidad no depende solo del color.
      itemStyle: { borderColor: '#fff', borderWidth: 1 },
      emphasis: { focus: 'series' },
      data: periods.map(period => Math.round(amountOf(s.key, period)))
    }))
  }
})

async function load() {
  error.value = null
  scopeMissing.value = false
  loading.value = true

  try {
    if (!lineDimension.value) {
      lineDimension.value = (await getLedgerDimensions()).find(d => d.slug === 'linea_negocio') ?? null
    }

    // B2C y B2B son valores de la dimension "linea de negocio": el resumen de
    // una linea es el mismo reporte, filtrado por ese valor.
    let valueIds: number[] = []
    if (props.scope !== 'all') {
      const value = lineDimension.value?.values.find(v => v.slug === props.scope)
      if (!value) {
        scopeMissing.value = true
        report.value = null
        return
      }
      valueIds = [value.id]
    }

    const range = { from: monthsAgo(12), to: lastMonth, granularity: 'month' as const, valueIds }
    const [main, customersReport, lineReport] = await Promise.all([
      getLedgerReport({ ...range, group_by: 'recurrence' }),
      getLedgerReport({ ...range, group_by: 'customer' }),
      props.scope === 'all' ? getLedgerReport({ ...range, group_by: 'linea_negocio' }) : Promise.resolve(null)
    ])

    report.value = main
    byCustomer.value = customersReport
    byLine.value = lineReport
  } catch (e) {
    error.value = ledgerErrorMessage(e)
  } finally {
    loading.value = false
  }
}

watch(() => props.scope, load)
onMounted(load)
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 280px;
}

.donut-chart {
  width: 180px;
  height: 180px;
  flex-shrink: 0;
}
</style>
