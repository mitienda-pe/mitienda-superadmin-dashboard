<template>
  <span
    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
    :style="{ backgroundColor: config.bg, color: config.color }"
  >
    <i :class="config.icon" class="text-[10px]"></i>
    {{ config.label }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CHARGE_STATUS_CONFIG, type ChargeStatus } from '@/types/subscriptions.types'

const props = defineProps<{
  status: ChargeStatus
}>()

const config = computed(() => CHARGE_STATUS_CONFIG[props.status] ?? CHARGE_STATUS_CONFIG.pending)
</script>
