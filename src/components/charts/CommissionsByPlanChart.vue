<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <h3 class="text-base font-semibold text-gray-800 mb-4">Comisiones por Plan</h3>
    <div class="flex items-center gap-6">
      <v-chart :option="chartOption" :autoresize="true" class="donut-chart" />
      <div class="flex-1 space-y-3">
        <div
          v-for="(segment, index) in data"
          :key="segment.plan"
          class="flex items-center justify-between"
        >
          <div class="flex items-center gap-2">
            <span
              class="w-3 h-3 rounded-full"
              :style="{ backgroundColor: planColor(segment.plan, index) }"
            ></span>
            <span class="text-sm text-gray-700">{{ segment.plan }}</span>
          </div>
          <div class="text-right">
            <span class="text-sm font-semibold text-gray-900">{{ formatCurrency(segment.total) }}</span>
            <span class="text-xs text-gray-400 ml-1">({{ getPercentage(segment.total).toFixed(1) }}%)</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { PieChart } from 'echarts/charts'
import { TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useChartTheme } from '@/composables/useChartTheme'
import { useFormatters } from '@/composables/useFormatters'
import type { CommissionsByPlan } from '@/types/dashboard.types'

use([PieChart, TooltipComponent, CanvasRenderer])

const props = defineProps<{
  data: CommissionsByPlan[]
}>()

const { palette } = useChartTheme()
const { formatCurrency } = useFormatters()

const planColors: Record<string, string> = {
  Large: '#00b2a6',
  Medium: '#3b82f6',
  Small: '#f59e0b',
  Micro: '#8b5cf6'
}

function planColor(plan: string, index: number): string {
  return planColors[plan] || palette[index]
}

const totalAmount = computed(() => props.data.reduce((sum, s) => sum + s.total, 0))

function getPercentage(total: number): number {
  return totalAmount.value > 0 ? (total / totalAmount.value) * 100 : 0
}

const chartOption = computed(() => ({
  tooltip: {
    trigger: 'item',
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    textStyle: { color: '#374151', fontSize: 13 },
    formatter: (params: any) => {
      const segment = props.data[params.dataIndex]
      return `<div class="font-medium">${params.name}</div>
        <div class="text-sm">${formatCurrency(segment?.total || 0)} (${params.percent}%)</div>
        <div class="text-sm text-gray-500">${segment?.count || 0} comisiones</div>`
    }
  },
  series: [
    {
      type: 'pie',
      radius: ['55%', '85%'],
      center: ['50%', '50%'],
      data: props.data.map((segment, i) => ({
        name: segment.plan,
        value: segment.total,
        itemStyle: { color: planColor(segment.plan, i) }
      })),
      label: { show: false },
      emphasis: {
        scale: true,
        scaleSize: 4
      }
    }
  ]
}))
</script>

<style scoped>
.donut-chart {
  width: 180px;
  height: 180px;
  flex-shrink: 0;
}
</style>
