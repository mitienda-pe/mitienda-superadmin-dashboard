<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <h3 class="text-base font-semibold text-gray-800 mb-4">Churn Rate por Plan (12 meses)</h3>
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
import type { ChurnByPlanMonth } from '@/types/revenue.types'

use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const props = defineProps<{ data: ChurnByPlanMonth[] }>()
const { palette } = useChartTheme()
const { formatShortMonth } = useFormatters()

const chartOption = computed(() => ({
  grid: { top: 40, right: 20, bottom: 50, left: 50 },
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#fff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    textStyle: { color: '#374151', fontSize: 13 }
  },
  legend: {
    bottom: 0,
    textStyle: { color: '#6b7280', fontSize: 12 },
    itemWidth: 12, itemHeight: 12
  },
  xAxis: {
    type: 'category',
    data: props.data.map(d => formatShortMonth(d.month)),
    axisLine: { lineStyle: { color: '#e5e7eb' } },
    axisLabel: { color: '#6b7280', fontSize: 11 }
  },
  yAxis: {
    type: 'value',
    name: 'Churn %',
    axisLabel: { color: '#6b7280', fontSize: 11, formatter: '{value}%' },
    splitLine: { lineStyle: { color: '#f3f4f6' } }
  },
  series: [
    {
      name: 'Large',
      type: 'line',
      data: props.data.map(d => d.large_rate),
      color: palette[0],
      smooth: true,
      symbol: 'circle',
      symbolSize: 5
    },
    {
      name: 'Medium',
      type: 'line',
      data: props.data.map(d => d.medium_rate),
      color: palette[1],
      smooth: true,
      symbol: 'circle',
      symbolSize: 5
    },
    {
      name: 'Small',
      type: 'line',
      data: props.data.map(d => d.small_rate),
      color: palette[2],
      smooth: true,
      symbol: 'circle',
      symbolSize: 5
    },
    {
      name: 'Micro',
      type: 'line',
      data: props.data.map(d => d.micro_rate),
      color: palette[3],
      smooth: true,
      symbol: 'circle',
      symbolSize: 5
    }
  ]
}))
</script>

<style scoped>
.chart-container { width: 100%; height: 320px; }
</style>
