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
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useChartTheme } from '@/composables/useChartTheme'
import { useFormatters } from '@/composables/useFormatters'
import type { GmvMonth } from '@/types/dashboard.types'

use([BarChart, LineChart, GridComponent, TooltipComponent, CanvasRenderer])

const props = defineProps<{
  data: GmvMonth[]
}>()

const { colors } = useChartTheme()
const { formatCurrency, formatShortMonth } = useFormatters()

const chartOption = computed(() => ({
  grid: { top: 40, right: 20, bottom: 20, left: 60 },
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    textStyle: { color: '#374151', fontSize: 13 },
    formatter: (params: any) => {
      const bar = params[0]
      return `<div class="font-medium mb-1">${bar.axisValue}</div>
        <div class="text-sm">GMV: <strong>${formatCurrency(bar.value)}</strong></div>`
    }
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
      name: 'GMV',
      type: 'bar',
      data: props.data.map(d => d.gmv),
      color: colors.primary,
      barMaxWidth: 30,
      itemStyle: {
        borderRadius: [4, 4, 0, 0]
      }
    },
    {
      name: 'Tendencia',
      type: 'line',
      data: props.data.map(d => d.gmv),
      color: colors.primaryDark,
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 2, type: 'dashed' }
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
