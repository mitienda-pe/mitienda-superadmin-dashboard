<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <h3 class="text-base font-semibold text-gray-800 mb-4">GMV Mensual</h3>
    <v-chart :option="chartOption" :autoresize="true" class="chart-container" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useChartTheme } from '@/composables/useChartTheme'
import { useFormatters } from '@/composables/useFormatters'
import type { GmvMonth } from '@/types/dashboard.types'

use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const props = defineProps<{
  data: GmvMonth[]
}>()

const { colors } = useChartTheme()
const { formatCurrency, formatShortMonth } = useFormatters()

const hasPrevYear = computed(() => props.data.some(d => (d.gmv_prev_year ?? 0) > 0))

const chartOption = computed(() => ({
  grid: { top: 40, right: 20, bottom: hasPrevYear.value ? 50 : 20, left: 60 },
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    textStyle: { color: '#374151', fontSize: 13 },
    formatter: (params: any) => {
      const current = params.find((p: any) => p.seriesName === 'Actual')
      const prev = params.find((p: any) => p.seriesName === 'Año anterior')
      let html = `<div class="font-medium mb-1">${current?.axisValue || params[0].axisValue}</div>`
      if (current) {
        html += `<div class="text-sm">${current.marker} Actual: <strong>${formatCurrency(current.value)}</strong></div>`
      }
      if (prev && prev.value > 0) {
        html += `<div class="text-sm">${prev.marker} Año anterior: <strong>${formatCurrency(prev.value)}</strong></div>`
        if (current && prev.value > 0) {
          const change = ((current.value - prev.value) / prev.value * 100).toFixed(1)
          const sign = Number(change) >= 0 ? '+' : ''
          const color = Number(change) >= 0 ? '#22c55e' : '#ef4444'
          html += `<div class="text-sm" style="color:${color}"><strong>${sign}${change}%</strong> vs año anterior</div>`
        }
      }
      return html
    }
  },
  legend: hasPrevYear.value ? {
    bottom: 0,
    textStyle: { color: '#6b7280', fontSize: 12 },
    itemWidth: 12,
    itemHeight: 12
  } : undefined,
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
    ...(hasPrevYear.value ? [{
      name: 'Año anterior',
      type: 'bar',
      data: props.data.map(d => d.gmv_prev_year ?? 0),
      color: colors.gray[300],
      barMaxWidth: 20,
      barGap: '10%',
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        opacity: 0.6
      }
    }] : []),
    {
      name: 'Actual',
      type: 'bar',
      data: props.data.map(d => d.gmv),
      color: colors.primary,
      barMaxWidth: 20,
      itemStyle: {
        borderRadius: [4, 4, 0, 0]
      }
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
