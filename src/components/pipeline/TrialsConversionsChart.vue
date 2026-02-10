<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <h3 class="text-sm font-semibold text-gray-700 mb-4">Trials vs Conversiones (6 meses)</h3>
    <v-chart :option="chartOption" :style="{ height: '280px' }" autoresize />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { useChartTheme } from '@/composables/useChartTheme'
import { useFormatters } from '@/composables/useFormatters'
import type { MonthlyTrialData } from '@/types/pipeline.types'

const props = defineProps<{
  data: MonthlyTrialData[]
}>()

const { colors, baseChartOptions } = useChartTheme()
const { formatShortMonth } = useFormatters()

const chartOption = computed(() => {
  const months = props.data.map(d => formatShortMonth(d.month))
  const newTrials = props.data.map(d => d.new_trials)
  const conversions = props.data.map(d => d.conversions)

  return {
    ...baseChartOptions,
    grid: { top: 40, right: 20, bottom: 40, left: 50 },
    legend: {
      bottom: 0,
      textStyle: { color: colors.gray[500], fontSize: 12 },
      itemWidth: 12,
      itemHeight: 12,
    },
    xAxis: {
      type: 'category',
      data: months,
      axisLabel: { color: colors.gray[500], fontSize: 11 },
      axisLine: { lineStyle: { color: colors.gray[200] } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: colors.gray[500], fontSize: 11 },
      splitLine: { lineStyle: { color: colors.gray[100] } },
    },
    series: [
      {
        name: 'Nuevos Trials',
        type: 'line',
        data: newTrials,
        smooth: true,
        lineStyle: { width: 2.5 },
        itemStyle: { color: '#3b82f6' },
        areaStyle: { color: 'rgba(59, 130, 246, 0.08)' },
      },
      {
        name: 'Conversiones',
        type: 'line',
        data: conversions,
        smooth: true,
        lineStyle: { width: 2.5 },
        itemStyle: { color: '#16a34a' },
        areaStyle: { color: 'rgba(22, 163, 106, 0.08)' },
      },
    ],
  }
})
</script>
