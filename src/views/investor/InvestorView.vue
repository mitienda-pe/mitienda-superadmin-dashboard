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
        <KpiCard title="MRR" :value="kpis.mrr" format="currency" :change="kpis.mrr_change" subtitle="Monthly Recurring Revenue" />
        <KpiCard title="ARR" :value="kpis.arr" format="currency" :change="kpis.arr_change" subtitle="Annual Run Rate" />
        <KpiCard title="Tiendas Activas" :value="kpis.active_paid_stores" format="number" :change="kpis.active_paid_stores_change" subtitle="Suscripciones pagas" />
        <KpiCard title="ARPU" :value="kpis.arpu" format="currency" :change="kpis.arpu_change" subtitle="Avg Revenue Per User" />
        <KpiCard title="NRR" :value="kpis.nrr" format="percent" :change="kpis.nrr_change" subtitle="Net Revenue Retention" />
        <KpiCard title="Churn Bruto" :value="kpis.gross_churn" format="percent" :change="kpis.gross_churn_change" :invertChange="true" subtitle="Mensual" />
        <KpiCard title="LTV" :value="kpis.ltv" format="currency" :change="kpis.ltv_change" subtitle="Lifetime Value promedio" />
        <KpiCard title="GMV Mensual" :value="kpis.gmv_monthly_current" format="currency" :change="kpis.gmv_monthly_change" subtitle="Gross Merchandise Value" />
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
import KpiCard from '@/components/ui/KpiCard.vue'
import { useRevenueStore } from '@/stores/revenue.store'
import { useFormatters } from '@/composables/useFormatters'
import { useChartTheme } from '@/composables/useChartTheme'
import { getExportUrl } from '@/api/revenue.api'

use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const store = useRevenueStore()
const { formatCurrency, formatCompactNumber, formatMonthYear } = useFormatters()
const { colors } = useChartTheme()

const kpis = computed(() => store.investorKpis!)

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
