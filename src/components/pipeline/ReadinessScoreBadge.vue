<template>
  <div class="inline-flex items-center justify-center" :title="`Score: ${score}/100`">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`">
      <!-- Background circle -->
      <circle
        :cx="center" :cy="center" :r="radius"
        fill="none" :stroke="trackColor" :stroke-width="strokeWidth"
      />
      <!-- Progress circle -->
      <circle
        :cx="center" :cy="center" :r="radius"
        fill="none" :stroke="scoreColor" :stroke-width="strokeWidth"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        stroke-linecap="round"
        :transform="`rotate(-90 ${center} ${center})`"
      />
      <!-- Score text -->
      <text
        :x="center" :y="center"
        text-anchor="middle" dominant-baseline="central"
        :font-size="fontSize" font-weight="700" :fill="scoreColor"
      >
        {{ score }}
      </text>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  score: number
  size?: number
}>(), {
  size: 44,
})

const strokeWidth = computed(() => props.size >= 44 ? 4 : 3)
const center = computed(() => props.size / 2)
const radius = computed(() => (props.size - strokeWidth.value * 2) / 2)
const circumference = computed(() => 2 * Math.PI * radius.value)
const dashOffset = computed(() => circumference.value * (1 - props.score / 100))
const fontSize = computed(() => props.size >= 44 ? 13 : 10)
const trackColor = '#e5e7eb'

const scoreColor = computed(() => {
  if (props.score >= 70) return '#16a34a'
  if (props.score >= 40) return '#f59e0b'
  if (props.score >= 15) return '#f97316'
  return '#9ca3af'
})
</script>
