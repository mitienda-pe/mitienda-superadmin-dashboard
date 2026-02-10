<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <h3 class="text-sm font-semibold text-gray-700 mb-4">Distribución de Score</h3>
    <v-chart :option="chartOption" :style="{ height: '320px' }" autoresize />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { useChartTheme } from '@/composables/useChartTheme'
import type { ScoreBucket } from '@/types/pipeline.types'

const props = defineProps<{
  data: ScoreBucket[]
}>()

const { colors } = useChartTheme()

const bucketColors = ['#9ca3af', '#f97316', '#f59e0b', '#3b82f6', '#16a34a']

const chartOption = computed(() => {
  return {
    grid: { top: 20, right: 20, bottom: 30, left: 50 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#fff',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#374151', fontSize: 13 },
    },
    xAxis: {
      type: 'category',
      data: props.data.map(d => d.range),
      axisLabel: { color: colors.gray[500], fontSize: 11 },
      axisLine: { lineStyle: { color: colors.gray[200] } },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: colors.gray[500], fontSize: 11 },
      splitLine: { lineStyle: { color: colors.gray[100] } },
    },
    series: [{
      type: 'bar',
      data: props.data.map((d, i) => ({
        value: d.count,
        itemStyle: { color: bucketColors[i] || colors.gray[400] },
      })),
      barWidth: '55%',
      label: {
        show: true,
        position: 'top',
        formatter: '{c}',
        fontSize: 12,
        color: colors.gray[600],
      },
    }],
  }
})
</script>
