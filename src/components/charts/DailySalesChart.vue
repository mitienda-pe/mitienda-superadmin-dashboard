<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <h3 class="text-base font-semibold text-gray-800 mb-4">Ventas Diarias (últimos 90 días)</h3>
    <v-chart :option="chartOption" :autoresize="true" class="chart-container" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { BarChart, LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useChartTheme } from '@/composables/useChartTheme'
import { useFormatters } from '@/composables/useFormatters'
import type { DailySales } from '@/types/store.types'

use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, CanvasRenderer])

const props = defineProps<{
  data: DailySales[]
}>()

const { colors } = useChartTheme()
const { formatCurrency } = useFormatters()

const chartOption = computed(() => ({
  grid: { top: 40, right: 20, bottom: 80, left: 60 },
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    textStyle: { color: '#374151', fontSize: 13 },
    formatter: (params: any) => {
      const date = params[0]?.axisValue || ''
      let html = `<div class="font-medium">${date}</div>`
      params.forEach((p: any) => {
        html += `<div class="text-sm">${p.seriesName}: ${p.seriesName === 'Ventas' ? formatCurrency(p.value) : p.value}</div>`
      })
      return html
    }
  },
  legend: {
    bottom: 30,
    textStyle: { color: '#6b7280', fontSize: 12 },
    itemWidth: 12,
    itemHeight: 12
  },
  dataZoom: [
    {
      type: 'slider',
      start: 66,
      end: 100,
      height: 20,
      bottom: 0
    }
  ],
  xAxis: {
    type: 'category',
    data: props.data.map(d => d.date),
    axisLine: { lineStyle: { color: '#e5e7eb' } },
    axisLabel: {
      color: '#6b7280',
      fontSize: 10,
      formatter: (val: string) => {
        const d = new Date(val + 'T00:00:00')
        return `${d.getDate()}/${d.getMonth() + 1}`
      }
    }
  },
  yAxis: [
    {
      type: 'value',
      name: 'Ventas (S/)',
      axisLabel: { color: '#6b7280', fontSize: 11 },
      splitLine: { lineStyle: { color: '#f3f4f6' } }
    },
    {
      type: 'value',
      name: 'Pedidos',
      axisLabel: { color: '#6b7280', fontSize: 11 },
      splitLine: { show: false }
    }
  ],
  series: [
    {
      name: 'Ventas',
      type: 'bar',
      data: props.data.map(d => d.sales),
      color: colors.primary,
      barMaxWidth: 8,
      itemStyle: { borderRadius: [2, 2, 0, 0] }
    },
    {
      name: 'Pedidos',
      type: 'line',
      yAxisIndex: 1,
      data: props.data.map(d => d.orders),
      color: colors.warning,
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 2 }
    }
  ]
}))
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 320px;
}
</style>
