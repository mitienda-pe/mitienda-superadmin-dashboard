<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <div class="flex flex-wrap items-start justify-between gap-3 mb-5">
      <div>
        <h3 class="text-base font-semibold text-gray-800">Ingreso facturado</h3>
        <p class="text-sm text-gray-500 mt-0.5">
          Lo que se emitió, sin IGV. Incluye lo que el MRR no cuenta: comisiones e ingresos extraordinarios.
        </p>
      </div>
      <router-link :to="{ name: 'BillingIncome' }" class="text-sm font-medium text-primary-600 hover:underline">
        Ver reporte completo
      </router-link>
    </div>

    <!-- Error: el resto del resumen no depende de este bloque -->
    <p v-if="error" class="text-sm text-red-600">
      No se pudo cargar el ingreso facturado: {{ error }}
      <button class="underline" @click="load">Reintentar</button>
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
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-4">
        <div>
          <p class="text-sm text-gray-500 font-medium">Total de {{ monthName }}</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ formatCurrency(monthTotal) }}</p>
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

      <p v-if="untaggedMonth > 0" class="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
        Además hay {{ formatCurrency(untaggedMonth) }} de {{ monthName }} sin clasificar, que no entra en ninguno de los
        tres tipos.
        <router-link :to="{ name: 'BillingConcepts' }" class="underline">Etiquetar conceptos</router-link>
      </p>

      <!-- 12 meses -->
      <v-chart :option="chartOption" :autoresize="true" class="chart-container mt-5" />

      <p class="text-xs text-gray-400 mt-2">
        Meses cerrados, hasta {{ monthName }}. Lo emitido directo en Nubefact aparece cuando se importa su reporte.
      </p>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useChartTheme } from '@/composables/useChartTheme'
import { useFormatters } from '@/composables/useFormatters'
import { getLedgerReport, ledgerErrorMessage } from '@/api/ledger.api'
import { RECURRENCE_OPTIONS } from '@/config/ledger.config'
import type { LedgerReport } from '@/types/ledger.types'

use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const { colors } = useChartTheme()
const { formatCurrency, formatShortMonth, formatMonthYear } = useFormatters()

const UNTAGGED = 'untagged'

const report = ref<LedgerReport | null>(null)
const error = ref<string | null>(null)

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
  try {
    report.value = await getLedgerReport({
      from: monthsAgo(12),
      to: lastMonth,
      group_by: 'recurrence',
      granularity: 'month'
    })
  } catch (e) {
    error.value = ledgerErrorMessage(e)
  }
}

onMounted(load)
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 280px;
}
</style>
