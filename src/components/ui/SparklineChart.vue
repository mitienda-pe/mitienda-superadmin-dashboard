<template>
  <v-chart :option="chartOption" :autoresize="true" class="sparkline-chart" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { LineChart } from 'echarts/charts'
import { GridComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([LineChart, GridComponent, CanvasRenderer])

const props = defineProps<{
  data: number[]
  color?: string
  height?: number
}>()

const chartOption = computed(() => ({
  grid: { top: 2, right: 2, bottom: 2, left: 2 },
  xAxis: {
    type: 'category',
    show: false,
    data: props.data.map((_, i) => i)
  },
  yAxis: {
    type: 'value',
    show: false
  },
  series: [
    {
      type: 'line',
      data: props.data,
      smooth: true,
      symbol: 'none',
      lineStyle: {
        width: 2,
        color: props.color || '#00b2a6'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: (props.color || '#00b2a6') + '30' },
            { offset: 1, color: (props.color || '#00b2a6') + '05' }
          ]
        }
      }
    }
  ]
}))
</script>

<style scoped>
.sparkline-chart {
  width: 100%;
  height: v-bind('(props.height || 40) + "px"');
}
</style>
