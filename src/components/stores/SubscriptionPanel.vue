<template>
  <div class="space-y-6">
    <!-- Current plan summary -->
    <div v-if="currentPlan" class="bg-white rounded-xl border border-gray-200 p-6">
      <h3 class="text-base font-semibold text-gray-800 mb-4">Plan Actual</h3>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p class="text-xs text-gray-400 uppercase tracking-wider">Plan</p>
          <p class="text-lg font-bold text-gray-900">{{ currentPlan.name }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-400 uppercase tracking-wider">Precio</p>
          <p class="text-lg font-bold text-gray-900">{{ formatCurrency(currentPlan.price) }}</p>
          <p class="text-xs text-gray-400">{{ periodLabel(currentPlan.period) }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-400 uppercase tracking-wider">MRR</p>
          <p class="text-lg font-bold text-primary-600">{{ formatCurrency(currentPlan.mrr) }}</p>
        </div>
        <div>
          <p class="text-xs text-gray-400 uppercase tracking-wider">Vencimiento</p>
          <p class="text-lg font-bold" :class="currentPlan.days_remaining > 30 ? 'text-green-600' : currentPlan.days_remaining > 7 ? 'text-yellow-600' : 'text-red-600'">
            {{ currentPlan.days_remaining }} días
          </p>
          <p class="text-xs text-gray-400">{{ formatDate(currentPlan.expires_at) }}</p>
        </div>
      </div>
    </div>

    <!-- Timeline -->
    <div class="bg-white rounded-xl border border-gray-200">
      <div class="p-5 border-b border-gray-100">
        <h3 class="text-base font-semibold text-gray-800">Historial de Suscripciones</h3>
      </div>
      <div class="p-5">
        <div v-if="history.length === 0" class="text-center text-gray-400 py-8">
          Sin historial de suscripciones
        </div>
        <div v-else class="space-y-4">
          <div
            v-for="sub in history"
            :key="sub.id"
            class="flex items-start gap-4 p-4 rounded-lg border"
            :class="sub.status === 'active' ? 'border-primary-200 bg-primary-50/30' : 'border-gray-100'"
          >
            <div class="flex-shrink-0 mt-1">
              <div
                class="w-3 h-3 rounded-full"
                :class="sub.status === 'active' ? 'bg-green-500' : sub.status === 'expired' ? 'bg-gray-400' : 'bg-yellow-500'"
              ></div>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <div>
                  <span class="font-medium text-gray-800">{{ sub.plan_name }}</span>
                  <span
                    class="ml-2 text-xs px-2 py-0.5 rounded-full font-medium"
                    :class="sub.status === 'active' ? 'bg-green-100 text-green-700' : sub.status === 'expired' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'"
                  >{{ statusLabel(sub.status) }}</span>
                </div>
                <span class="text-sm font-semibold text-gray-800">{{ formatCurrency(sub.price) }}</span>
              </div>
              <div class="flex gap-4 mt-1 text-xs text-gray-400">
                <span>MRR: {{ formatCurrency(sub.mrr) }}</span>
                <span>{{ periodLabel(sub.period) }}</span>
                <span>{{ formatDate(sub.started_at) }} → {{ formatDate(sub.expires_at) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useFormatters } from '@/composables/useFormatters'
import type { StorePlan, SubscriptionHistory } from '@/types/store.types'

defineProps<{
  currentPlan: StorePlan | null
  history: SubscriptionHistory[]
}>()

const { formatCurrency, formatDate } = useFormatters()

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    active: 'Activo', expired: 'Vencido', inactive: 'Inactivo'
  }
  return labels[status] || status
}

function periodLabel(period: string): string {
  const labels: Record<string, string> = {
    mensual: 'Mensual', trimestre: 'Trimestral', semestre: 'Semestral', anual: 'Anual'
  }
  return labels[period] || period
}
</script>
