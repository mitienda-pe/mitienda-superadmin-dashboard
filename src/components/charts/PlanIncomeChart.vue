<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5">
    <h3 class="text-base font-semibold text-gray-800">Ingresos por Plan</h3>
    <p class="text-xs text-gray-400 mb-4">MRR de los planes activos hoy, sin IGV</p>
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
              :style="{ backgroundColor: palette[index] }"
            ></span>
            <span class="text-sm text-gray-700">{{ segment.plan }}</span>
          </div>
          <div class="text-right">
            <span class="text-sm font-semibold text-gray-900">{{ formatCurrency(segment.mrr) }}</span>
            <span class="text-xs text-gray-400 ml-1">({{ getPercentage(segment.mrr).toFixed(1) }}%)</span>
          </div>
        </div>
        <div class="flex items-center justify-between border-t border-gray-100 pt-2">
          <span class="text-sm font-medium text-gray-700">Total</span>
          <span class="text-sm font-semibold text-gray-900">{{ formatCurrency(totalMrr) }}</span>
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
import type { PlanSegment } from '@/types/dashboard.types'

use([PieChart, TooltipComponent, CanvasRenderer])

// Mismos datos y mismos colores que "Distribución por Plan": aquella cuenta
// tiendas, esta cuánto factura cada plan al mes.
const props = defineProps<{
  data: PlanSegment[]
}>()

const { palette } = useChartTheme()
const { formatCurrency } = useFormatters()

const totalMrr = computed(() => props.data.reduce((sum, s) => sum + s.mrr, 0))

function getPercentage(mrr: number): number {
  return totalMrr.value > 0 ? (mrr / totalMrr.value) * 100 : 0
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
      const average = segment && segment.count > 0 ? segment.mrr / segment.count : 0
      return `<div class="font-medium">${params.name}</div>
        <div class="text-sm">${formatCurrency(params.value)} al mes (${params.percent}%)</div>
        <div class="text-sm text-gray-500">${segment?.count ?? 0} tiendas · ${formatCurrency(average)} por tienda</div>`
    }
  },
  series: [
    {
      type: 'pie',
      radius: ['55%', '85%'],
      center: ['50%', '50%'],
      data: props.data.map((segment, i) => ({
        name: segment.plan,
        value: segment.mrr,
        itemStyle: { color: palette[i] }
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
