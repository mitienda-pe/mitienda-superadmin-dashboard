<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <h3 class="text-base font-semibold text-gray-800 mb-4">Ingresos: Suscripciones vs Comisiones</h3>
    <v-chart :option="chartOption" :autoresize="true" class="chart-container" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useChartTheme } from '@/composables/useChartTheme'
import { useFormatters } from '@/composables/useFormatters'
import type { CommissionsMonthly } from '@/types/dashboard.types'

use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const props = defineProps<{
  data: CommissionsMonthly[]
}>()

const { colors } = useChartTheme()
const { formatCurrency, formatShortMonth } = useFormatters()

const chartOption = computed(() => ({
  grid: { top: 40, right: 20, bottom: 50, left: 60 },
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    textStyle: { color: '#374151', fontSize: 13 },
    formatter: (params: any) => {
      const subs = params.find((p: any) => p.seriesName === 'Suscripciones')
      const coms = params.find((p: any) => p.seriesName === 'Comisiones')
      const subsVal = subs?.value || 0
      const comsVal = coms?.value || 0
      const total = subsVal + comsVal
      const pct = total > 0 ? ((comsVal / total) * 100).toFixed(1) : '0'
      let html = `<div class="font-medium mb-1">${params[0].axisValue}</div>`
      html += `<div class="text-sm">${subs?.marker || ''} Suscripciones: <strong>${formatCurrency(subsVal)}</strong></div>`
      html += `<div class="text-sm">${coms?.marker || ''} Comisiones: <strong>${formatCurrency(comsVal)}</strong></div>`
      html += `<div class="border-t mt-1 pt-1 text-sm font-semibold">Total: ${formatCurrency(total)}</div>`
      html += `<div class="text-xs text-gray-500">Comisiones: ${pct}% del total</div>`
      return html
    }
  },
  legend: {
    bottom: 0,
    textStyle: { color: '#6b7280', fontSize: 12 },
    itemWidth: 12,
    itemHeight: 12
  },
  xAxis: {
    type: 'category',
    data: props.data.map(d => formatShortMonth(d.month)),
    axisLine: { lineStyle: { color: '#e5e7eb' } },
    axisLabel: { color: '#6b7280', fontSize: 11 }
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      color: '#6b7280',
      fontSize: 11,
      formatter: (v: number) => `S/${(v / 1000).toFixed(0)}K`
    },
    splitLine: { lineStyle: { color: '#f3f4f6' } }
  },
  series: [
    {
      name: 'Suscripciones',
      type: 'bar',
      stack: 'revenue',
      data: props.data.map(d => d.subscriptions),
      color: colors.primary,
      barMaxWidth: 24,
      itemStyle: { borderRadius: [0, 0, 0, 0] }
    },
    {
      name: 'Comisiones',
      type: 'bar',
      stack: 'revenue',
      data: props.data.map(d => d.commissions),
      color: colors.warning,
      barMaxWidth: 24,
      itemStyle: { borderRadius: [4, 4, 0, 0] }
    }
  ]
}))
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 280px;
}
</style>
