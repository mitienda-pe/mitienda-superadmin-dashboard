<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <h3 class="text-base font-semibold text-gray-800 mb-4">Churn vs Nuevas Tiendas</h3>
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
import type { ChurnVsNewMonth } from '@/types/dashboard.types'

use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const props = defineProps<{
  data: ChurnVsNewMonth[]
}>()

const { colors } = useChartTheme()
const { formatShortMonth } = useFormatters()

const chartOption = computed(() => ({
  grid: { top: 40, right: 20, bottom: 50, left: 50 },
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    textStyle: { color: '#374151', fontSize: 13 }
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
    axisLabel: { color: '#6b7280', fontSize: 11 },
    splitLine: { lineStyle: { color: '#f3f4f6' } }
  },
  series: [
    {
      name: 'Nuevas',
      type: 'bar',
      data: props.data.map(d => d.new),
      color: colors.success,
      barMaxWidth: 20,
      itemStyle: { borderRadius: [4, 4, 0, 0] }
    },
    {
      name: 'Churn',
      type: 'bar',
      data: props.data.map(d => d.churned),
      color: colors.danger,
      barMaxWidth: 20,
      itemStyle: { borderRadius: [4, 4, 0, 0] }
    },
    {
      name: 'Neto',
      type: 'line',
      data: props.data.map(d => d.net),
      color: colors.primary,
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: { width: 2 }
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
