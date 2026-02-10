<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <h3 class="text-base font-semibold text-gray-800 mb-4">MRR Evolution por Plan</h3>
    <v-chart :option="chartOption" :autoresize="true" class="chart-container" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useChartTheme } from '@/composables/useChartTheme'
import { useFormatters } from '@/composables/useFormatters'
import type { MrrEvolutionMonth } from '@/types/dashboard.types'

use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const props = defineProps<{
  data: MrrEvolutionMonth[]
}>()

const { palette, baseChartOptions } = useChartTheme()
const { formatCurrency, formatShortMonth } = useFormatters()

const chartOption = computed(() => ({
  ...baseChartOptions,
  tooltip: {
    ...baseChartOptions.tooltip,
    formatter: (params: any) => {
      let html = `<div class="font-medium mb-1">${params[0].axisValue}</div>`
      let total = 0
      params.forEach((p: any) => {
        total += p.value
        html += `<div class="flex items-center gap-2 text-sm">
          <span style="background:${p.color};width:8px;height:8px;border-radius:50%;display:inline-block"></span>
          ${p.seriesName}: <strong>${formatCurrency(p.value)}</strong>
        </div>`
      })
      html += `<div class="border-t mt-1 pt-1 text-sm font-semibold">Total: ${formatCurrency(total)}</div>`
      return html
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
      name: 'Large',
      type: 'line',
      stack: 'total',
      areaStyle: { opacity: 0.6 },
      data: props.data.map(d => d.large),
      color: palette[0],
      smooth: true,
      symbol: 'none'
    },
    {
      name: 'Medium',
      type: 'line',
      stack: 'total',
      areaStyle: { opacity: 0.6 },
      data: props.data.map(d => d.medium),
      color: palette[1],
      smooth: true,
      symbol: 'none'
    },
    {
      name: 'Small',
      type: 'line',
      stack: 'total',
      areaStyle: { opacity: 0.6 },
      data: props.data.map(d => d.small),
      color: palette[2],
      smooth: true,
      symbol: 'none'
    },
    {
      name: 'Micro',
      type: 'line',
      stack: 'total',
      areaStyle: { opacity: 0.6 },
      data: props.data.map(d => d.micro),
      color: palette[3],
      smooth: true,
      symbol: 'none'
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
