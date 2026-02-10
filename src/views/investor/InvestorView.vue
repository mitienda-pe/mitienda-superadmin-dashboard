<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Vista Inversionistas</h1>
        <p class="text-sm text-gray-500 mt-1">KPIs clave, unit economics y tendencias para presentaciones</p>
      </div>
      <div class="flex items-center gap-2">
        <Button
          label="Exportar CSV"
          icon="pi pi-download"
          severity="secondary"
          outlined
          size="small"
          @click="exportCsv"
        />
      </div>
    </div>

    <!-- Loading -->
    <div v-if="store.isInvestorLoading" class="space-y-4">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div v-for="i in 8" :key="i" class="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
          <div class="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div class="h-8 bg-gray-100 rounded w-2/3"></div>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div class="h-5 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div class="h-64 bg-gray-100 rounded"></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="store.investorError" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-2"></i>
      <p class="text-red-700 font-medium">{{ store.investorError }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="store.fetchInvestorKpis()" />
    </div>

    <template v-else-if="store.investorKpis">
      <!-- KPI Cards - 2 rows of 4 -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <!-- MRR -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <p class="text-xs text-gray-400 uppercase tracking-wider">MRR</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ formatCurrency(store.investorKpis.mrr) }}</p>
          <p class="text-xs text-gray-400 mt-1">Monthly Recurring Revenue</p>
        </div>

        <!-- ARR -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <p class="text-xs text-gray-400 uppercase tracking-wider">ARR</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ formatCurrency(store.investorKpis.arr) }}</p>
          <p class="text-xs text-gray-400 mt-1">Annual Run Rate</p>
        </div>

        <!-- Active Paid Stores -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <p class="text-xs text-gray-400 uppercase tracking-wider">Tiendas Activas</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ formatNumber(store.investorKpis.active_paid_stores) }}</p>
          <p class="text-xs text-gray-400 mt-1">Suscripciones pagas</p>
        </div>

        <!-- ARPU -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <p class="text-xs text-gray-400 uppercase tracking-wider">ARPU</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ formatCurrency(store.investorKpis.arpu) }}</p>
          <p class="text-xs text-gray-400 mt-1">Avg Revenue Per User</p>
        </div>

        <!-- NRR -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <p class="text-xs text-gray-400 uppercase tracking-wider">NRR</p>
          <p class="text-2xl font-bold" :class="store.investorKpis.nrr >= 100 ? 'text-green-600' : 'text-yellow-600'">
            {{ formatPercent(store.investorKpis.nrr) }}
          </p>
          <p class="text-xs text-gray-400 mt-1">Net Revenue Retention</p>
        </div>

        <!-- Gross Churn -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <p class="text-xs text-gray-400 uppercase tracking-wider">Churn Bruto</p>
          <p class="text-2xl font-bold" :class="store.investorKpis.gross_churn <= 3 ? 'text-green-600' : store.investorKpis.gross_churn <= 5 ? 'text-yellow-600' : 'text-red-600'">
            {{ formatPercent(store.investorKpis.gross_churn) }}
          </p>
          <p class="text-xs text-gray-400 mt-1">Mensual promedio 3m</p>
        </div>

        <!-- LTV -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <p class="text-xs text-gray-400 uppercase tracking-wider">LTV</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ formatCurrency(store.investorKpis.ltv) }}</p>
          <p class="text-xs text-gray-400 mt-1">Lifetime Value promedio</p>
        </div>

        <!-- GMV Annual -->
        <div class="bg-white rounded-xl border border-gray-200 p-5">
          <p class="text-xs text-gray-400 uppercase tracking-wider">GMV Anual</p>
          <p class="text-2xl font-bold text-gray-900 mt-1">{{ formatCompactNumber(store.investorKpis.gmv_annual) }}</p>
          <p class="text-xs text-gray-400 mt-1">
            <span v-if="store.investorKpis.gmv_growth_yoy >= 0" class="text-green-600">
              +{{ formatPercent(store.investorKpis.gmv_growth_yoy) }} YoY
            </span>
            <span v-else class="text-red-600">
              {{ formatPercent(store.investorKpis.gmv_growth_yoy) }} YoY
            </span>
          </p>
        </div>
      </div>

      <!-- MRR Evolution Chart (24 months) -->
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <h3 class="text-base font-semibold text-gray-800 mb-4">MRR Evolution (24 meses)</h3>
        <v-chart :option="mrrChartOption" :autoresize="true" class="chart-container" />
      </div>

      <!-- Stores Trend Chart (24 months) -->
      <div class="bg-white rounded-xl border border-gray-200 p-5">
        <h3 class="text-base font-semibold text-gray-800 mb-4">Tiendas Activas Pagas (24 meses)</h3>
        <v-chart :option="storesChartOption" :autoresize="true" class="chart-container" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import Button from 'primevue/button'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useRevenueStore } from '@/stores/revenue.store'
import { useFormatters } from '@/composables/useFormatters'
import { useChartTheme } from '@/composables/useChartTheme'
import { getExportUrl } from '@/api/revenue.api'

use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const store = useRevenueStore()
const { formatCurrency, formatPercent, formatNumber, formatCompactNumber, formatMonthYear } = useFormatters()
const { colors } = useChartTheme()

const mrrChartOption = computed(() => {
  const data = store.investorKpis?.mrr_evolution || []
  return {
    grid: { top: 20, right: 20, bottom: 30, left: 70 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#fff',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#374151', fontSize: 13 },
      formatter: (params: any) => {
        const p = params[0]
        return `<div class="font-medium">${p.axisValue}</div>
          <div class="text-sm">${p.marker} MRR: ${formatCurrency(p.value)}</div>`
      }
    },
    xAxis: {
      type: 'category',
      data: data.map(d => formatMonthYear(d.month)),
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280', fontSize: 10, rotate: 45 }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#6b7280',
        fontSize: 11,
        formatter: (v: number) => formatCompactNumber(v)
      },
      splitLine: { lineStyle: { color: '#f3f4f6' } }
    },
    series: [{
      type: 'line',
      data: data.map(d => d.mrr),
      color: colors.primary,
      smooth: true,
      symbol: 'circle',
      symbolSize: 4,
      lineStyle: { width: 2.5 },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(0, 178, 166, 0.15)' },
            { offset: 1, color: 'rgba(0, 178, 166, 0.02)' }
          ]
        }
      }
    }]
  }
})

const storesChartOption = computed(() => {
  const data = store.investorKpis?.stores_trend || []
  return {
    grid: { top: 20, right: 20, bottom: 30, left: 50 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#fff',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#374151', fontSize: 13 },
      formatter: (params: any) => {
        const p = params[0]
        return `<div class="font-medium">${p.axisValue}</div>
          <div class="text-sm">${p.marker} Tiendas: ${p.value}</div>`
      }
    },
    xAxis: {
      type: 'category',
      data: data.map(d => formatMonthYear(d.month)),
      axisLine: { lineStyle: { color: '#e5e7eb' } },
      axisLabel: { color: '#6b7280', fontSize: 10, rotate: 45 }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: '#6b7280', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f3f4f6' } }
    },
    series: [{
      type: 'bar',
      data: data.map(d => d.stores),
      color: colors.info,
      barMaxWidth: 16
    }]
  }
})

function exportCsv() {
  const token = localStorage.getItem('token')
  const url = getExportUrl('kpis')
  window.open(`${url}&token=${token}`, '_blank')
}

onMounted(() => {
  store.fetchInvestorKpis()
})
</script>

<style scoped>
.chart-container { width: 100%; height: 320px; }
</style>
