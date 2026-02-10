<template>
  <div class="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
    <div class="flex items-start justify-between mb-3">
      <div>
        <p class="text-sm text-gray-500 font-medium">{{ title }}</p>
        <p class="text-2xl font-bold text-gray-900 mt-1">{{ formattedValue }}</p>
      </div>
      <div
        v-if="change !== undefined && change !== 0"
        class="flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg"
        :class="changeClass"
      >
        <i :class="changeIcon" class="text-xs"></i>
        <span>{{ Math.abs(change).toFixed(1) }}%</span>
      </div>
    </div>

    <SparklineChart
      v-if="sparkline && sparkline.length > 0"
      :data="sparkline"
      :color="sparklineColor"
      :height="36"
    />

    <p v-if="subtitle" class="text-xs text-gray-400 mt-2">{{ subtitle }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFormatters } from '@/composables/useFormatters'
import SparklineChart from './SparklineChart.vue'

const props = defineProps<{
  title: string
  value: number
  format: 'currency' | 'percent' | 'number'
  change?: number
  sparkline?: number[]
  subtitle?: string
  invertChange?: boolean
}>()

const { formatCurrency, formatPercent, formatNumber } = useFormatters()

const formattedValue = computed(() => {
  switch (props.format) {
    case 'currency': return formatCurrency(props.value)
    case 'percent': return formatPercent(props.value)
    case 'number': return formatNumber(props.value)
    default: return String(props.value)
  }
})

const isPositive = computed(() => {
  if (props.change === undefined) return true
  return props.invertChange ? props.change <= 0 : props.change >= 0
})

const changeClass = computed(() => {
  return isPositive.value
    ? 'bg-green-50 text-green-700'
    : 'bg-red-50 text-red-700'
})

const changeIcon = computed(() => {
  if (props.change === undefined) return ''
  return props.change >= 0 ? 'pi pi-arrow-up' : 'pi pi-arrow-down'
})

const sparklineColor = computed(() => {
  return isPositive.value ? '#22c55e' : '#ef4444'
})
</script>
