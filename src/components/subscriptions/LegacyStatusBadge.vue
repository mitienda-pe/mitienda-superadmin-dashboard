<template>
  <span
    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
    :style="{ backgroundColor: config.bg, color: config.color }"
  >
    {{ config.label }}
    <span v-if="showExpired" class="opacity-70">(Vencido)</span>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { LEGACY_STATUS_MAP } from '@/types/legacy-subscriptions.types'

const props = defineProps<{
  status: number
  computedStatus?: string
}>()

const config = computed(() => {
  return LEGACY_STATUS_MAP[props.status] || { label: `Status ${props.status}`, color: '#6b7280', bg: '#f3f4f6' }
})

const showExpired = computed(() => {
  return props.computedStatus === 'expired' && props.status !== 3 && props.status !== 12
})
</script>
