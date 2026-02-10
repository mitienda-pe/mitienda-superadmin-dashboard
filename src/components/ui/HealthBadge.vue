<template>
  <span
    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
    :class="badgeClass"
  >
    <span class="w-1.5 h-1.5 rounded-full" :class="dotClass"></span>
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  score?: number
}>()

const badgeClass = computed(() => {
  const l = props.label.toLowerCase()
  if (l === 'saludable' || l === 'healthy') return 'bg-green-50 text-green-700'
  if (l === 'estable' || l === 'stable') return 'bg-blue-50 text-blue-700'
  if (l === 'en riesgo' || l === 'at risk') return 'bg-orange-50 text-orange-700'
  if (l === 'critico' || l === 'critical' || l === 'crítico') return 'bg-red-50 text-red-700'
  return 'bg-gray-50 text-gray-700'
})

const dotClass = computed(() => {
  const l = props.label.toLowerCase()
  if (l === 'saludable' || l === 'healthy') return 'bg-green-500'
  if (l === 'estable' || l === 'stable') return 'bg-blue-500'
  if (l === 'en riesgo' || l === 'at risk') return 'bg-orange-500'
  if (l === 'critico' || l === 'critical' || l === 'crítico') return 'bg-red-500'
  return 'bg-gray-500'
})
</script>
