<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Alertas</h1>
      <p class="text-sm text-gray-500 mt-1">Sistema de alertas tempranas para riesgos de churn, caídas de venta y expiración de planes</p>
    </div>

    <!-- Loading -->
    <div v-if="store.isAlertsLoading" class="space-y-4">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div v-for="i in 4" :key="i" class="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div class="h-8 bg-gray-100 rounded w-1/3"></div>
        </div>
      </div>
      <div v-for="i in 5" :key="'s'+i" class="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div class="h-3 bg-gray-100 rounded w-1/2"></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="store.alertsError" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-2"></i>
      <p class="text-red-700 font-medium">{{ store.alertsError }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="loadAlerts()" />
    </div>

    <template v-else-if="store.alertsData">
      <!-- Severity Summary Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          class="rounded-xl border p-4 cursor-pointer transition-all"
          :class="selectedSeverity === 'critical' ? 'bg-red-50 border-red-300 ring-2 ring-red-200' : 'bg-white border-gray-200 hover:border-red-200'"
          @click="toggleSeverity('critical')"
        >
          <p class="text-xs text-gray-400 uppercase tracking-wider">Críticas</p>
          <p class="text-2xl font-bold text-red-600 mt-1">{{ store.alertsData.summary.critical }}</p>
        </div>
        <div
          class="rounded-xl border p-4 cursor-pointer transition-all"
          :class="selectedSeverity === 'high' ? 'bg-orange-50 border-orange-300 ring-2 ring-orange-200' : 'bg-white border-gray-200 hover:border-orange-200'"
          @click="toggleSeverity('high')"
        >
          <p class="text-xs text-gray-400 uppercase tracking-wider">Altas</p>
          <p class="text-2xl font-bold text-orange-600 mt-1">{{ store.alertsData.summary.high }}</p>
        </div>
        <div
          class="rounded-xl border p-4 cursor-pointer transition-all"
          :class="selectedSeverity === 'medium' ? 'bg-yellow-50 border-yellow-300 ring-2 ring-yellow-200' : 'bg-white border-gray-200 hover:border-yellow-200'"
          @click="toggleSeverity('medium')"
        >
          <p class="text-xs text-gray-400 uppercase tracking-wider">Medias</p>
          <p class="text-2xl font-bold text-yellow-600 mt-1">{{ store.alertsData.summary.medium }}</p>
        </div>
        <div
          class="rounded-xl border p-4 cursor-pointer transition-all"
          :class="selectedSeverity === 'low' ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' : 'bg-white border-gray-200 hover:border-blue-200'"
          @click="toggleSeverity('low')"
        >
          <p class="text-xs text-gray-400 uppercase tracking-wider">Bajas</p>
          <p class="text-2xl font-bold text-blue-600 mt-1">{{ store.alertsData.summary.low }}</p>
        </div>
      </div>

      <!-- Filter indicator -->
      <div v-if="selectedSeverity" class="flex items-center gap-2">
        <span class="text-sm text-gray-500">Filtrando por:</span>
        <span
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
          :class="severityBadgeClass(selectedSeverity)"
        >
          {{ severityLabel(selectedSeverity) }}
          <button @click="selectedSeverity = null" class="ml-1 hover:opacity-70">&times;</button>
        </span>
        <span class="text-sm text-gray-400">({{ filteredAlerts.length }} alertas)</span>
      </div>

      <!-- Alert Feed -->
      <div v-if="filteredAlerts.length" class="space-y-3">
        <div
          v-for="(alert, idx) in filteredAlerts"
          :key="idx"
          class="bg-white rounded-xl border border-gray-200 p-4 flex items-start gap-4 hover:shadow-sm transition-shadow"
        >
          <!-- Severity icon -->
          <div class="flex-shrink-0 mt-0.5">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center"
              :class="severityIconBg(alert.severity)"
            >
              <i :class="alertTypeIcon(alert.type)" class="text-sm text-white"></i>
            </div>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span
                class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                :class="severityBadgeClass(alert.severity)"
              >
                {{ severityLabel(alert.severity) }}
              </span>
              <span class="text-xs text-gray-400">{{ alertTypeLabel(alert.type) }}</span>
            </div>
            <p class="text-sm font-medium text-gray-800">{{ alert.message }}</p>
            <p class="text-xs text-gray-500 mt-0.5">{{ alert.detail }}</p>
            <div class="flex items-center gap-3 mt-2">
              <router-link
                :to="`/stores/${alert.store.id}`"
                class="text-xs text-primary-600 hover:text-primary-700 font-medium"
              >
                {{ alert.store.name }}
              </router-link>
              <span class="text-xs text-gray-400">Plan: {{ alert.store.plan }}</span>
            </div>
          </div>

          <!-- Action -->
          <div class="flex-shrink-0">
            <router-link :to="`/stores/${alert.store.id}`">
              <Button icon="pi pi-arrow-right" text rounded size="small" />
            </router-link>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <i class="pi pi-check-circle text-4xl text-green-400 mb-3"></i>
        <p class="text-gray-600 font-medium">Sin alertas {{ selectedSeverity ? 'de este nivel' : '' }}</p>
        <p class="text-sm text-gray-400 mt-1">Todas las tiendas están operando normalmente</p>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import Button from 'primevue/button'
import { useRevenueStore } from '@/stores/revenue.store'
import type { Alert } from '@/types/revenue.types'

const store = useRevenueStore()
const selectedSeverity = ref<string | null>(null)

const filteredAlerts = computed(() => {
  if (!store.alertsData) return []
  if (!selectedSeverity.value) return store.alertsData.alerts
  return store.alertsData.alerts.filter(a => a.severity === selectedSeverity.value)
})

function toggleSeverity(severity: string) {
  selectedSeverity.value = selectedSeverity.value === severity ? null : severity
}

function severityBadgeClass(severity: string): string {
  const map: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-yellow-100 text-yellow-700',
    low: 'bg-blue-100 text-blue-700'
  }
  return map[severity] || 'bg-gray-100 text-gray-700'
}

function severityIconBg(severity: string): string {
  const map: Record<string, string> = {
    critical: 'bg-red-500',
    high: 'bg-orange-500',
    medium: 'bg-yellow-500',
    low: 'bg-blue-500'
  }
  return map[severity] || 'bg-gray-500'
}

function severityLabel(severity: string): string {
  const map: Record<string, string> = {
    critical: 'Crítica',
    high: 'Alta',
    medium: 'Media',
    low: 'Baja'
  }
  return map[severity] || severity
}

function alertTypeIcon(type: Alert['type']): string {
  const map: Record<string, string> = {
    sales_drop: 'pi pi-arrow-down',
    no_orders: 'pi pi-ban',
    expiring_at_risk: 'pi pi-exclamation-triangle',
    expiring_soon: 'pi pi-clock',
    stagnant_sales: 'pi pi-minus-circle',
    low_catalog: 'pi pi-box'
  }
  return map[type] || 'pi pi-info-circle'
}

function alertTypeLabel(type: Alert['type']): string {
  const map: Record<string, string> = {
    sales_drop: 'Caída de ventas',
    no_orders: 'Sin pedidos',
    expiring_at_risk: 'Expiración en riesgo',
    expiring_soon: 'Plan por vencer',
    stagnant_sales: 'Ventas estancadas',
    low_catalog: 'Catálogo bajo'
  }
  return map[type] || type
}

function loadAlerts() {
  store.fetchAlerts()
}

onMounted(() => {
  store.fetchAlerts()
})
</script>
