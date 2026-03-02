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
import { SUBSCRIPTION_STATUS_CONFIG, type SubscriptionStatus } from '@/types/subscriptions.types'

const props = defineProps<{
  status: SubscriptionStatus
}>()

const config = computed(() => SUBSCRIPTION_STATUS_CONFIG[props.status] ?? SUBSCRIPTION_STATUS_CONFIG.active)
</script>
