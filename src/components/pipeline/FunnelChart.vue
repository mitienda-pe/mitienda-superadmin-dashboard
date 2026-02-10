<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <h3 class="text-sm font-semibold text-gray-700 mb-4">Embudo de Pipeline</h3>
    <v-chart :option="chartOption" :style="{ height: '320px' }" autoresize />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { useChartTheme } from '@/composables/useChartTheme'
import type { FunnelStage } from '@/types/pipeline.types'

const props = defineProps<{
  data: FunnelStage[]
}>()

const { colors, palette } = useChartTheme()

const chartOption = computed(() => {
  const stages = props.data
  const stageColors: Record<string, string> = {
    new_signup: '#6366f1',
    exploring: '#8b5cf6',
    building: '#3b82f6',
    ready_to_sell: '#f59e0b',
    first_sale: '#10b981',
    activated: '#059669',
    stalled: '#ef4444',
    expired: '#6b7280',
    converted: '#16a34a',
  }

  return {
    grid: { top: 10, right: 60, bottom: 10, left: 120, containLabel: false },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#fff',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      textStyle: { color: '#374151', fontSize: 13 },
    },
    xAxis: {
      type: 'value',
      axisLabel: { color: colors.gray[500], fontSize: 11 },
      splitLine: { lineStyle: { color: colors.gray[100] } },
    },
    yAxis: {
      type: 'category',
      data: stages.map(s => s.label).reverse(),
      axisLabel: { color: colors.gray[600], fontSize: 12 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [{
      type: 'bar',
      data: stages.map(s => ({
        value: s.count,
        itemStyle: { color: stageColors[s.stage] || palette[0] },
      })).reverse(),
      barWidth: '60%',
      label: {
        show: true,
        position: 'right',
        formatter: '{c}',
        fontSize: 12,
        color: colors.gray[600],
      },
    }],
  }
})
</script>
