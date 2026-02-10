<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <h3 class="text-base font-semibold text-gray-800 mb-4">MRR Breakdown (12 meses)</h3>
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
import type { MrrBreakdownMonth } from '@/types/revenue.types'

use([BarChart, LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer])

const props = defineProps<{ data: MrrBreakdownMonth[] }>()
const { colors } = useChartTheme()
const { formatCurrency, formatShortMonth } = useFormatters()

const chartOption = computed(() => ({
  grid: { top: 40, right: 20, bottom: 50, left: 60 },
  tooltip: {
    trigger: 'axis',
    backgroundColor: '#fff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    textStyle: { color: '#374151', fontSize: 13 },
    formatter: (params: any) => {
      let html = `<div class="font-medium">${params[0]?.axisValue}</div>`
      params.forEach((p: any) => {
        html += `<div class="text-sm">${p.marker} ${p.seriesName}: ${formatCurrency(p.value)}</div>`
      })
      return html
    }
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
    axisLabel: { color: '#6b7280', fontSize: 11 },
    splitLine: { lineStyle: { color: '#f3f4f6' } }
  },
  series: [
    {
      name: 'New MRR',
      type: 'bar',
      stack: 'mrr',
      data: props.data.map(d => d.new_mrr),
      color: colors.success,
      barMaxWidth: 20
    },
    {
      name: 'Expansion',
      type: 'bar',
      stack: 'mrr',
      data: props.data.map(d => d.expansion_mrr),
      color: colors.info,
      barMaxWidth: 20
    },
    {
      name: 'Churned MRR',
      type: 'bar',
      stack: 'mrr',
      data: props.data.map(d => -d.churned_mrr),
      color: colors.danger,
      barMaxWidth: 20
    },
    {
      name: 'Total MRR',
      type: 'line',
      data: props.data.map(d => d.total_mrr),
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
.chart-container { width: 100%; height: 320px; }
</style>
