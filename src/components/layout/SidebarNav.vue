<template>
  <nav class="space-y-1">
    <router-link
      v-for="item in navItems"
      :key="item.path"
      :to="item.path"
      class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
      :class="isActive(item.path)
        ? 'bg-primary-50 text-primary-700'
        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
    >
      <i :class="item.icon" class="text-lg w-5 text-center"></i>
      <span>{{ item.label }}</span>
      <span
        v-if="item.badge"
        class="ml-auto text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full"
      >
        {{ item.badge }}
      </span>
    </router-link>
  </nav>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { path: '/dashboard', label: 'Overview', icon: 'pi pi-chart-bar' },
  { path: '/stores', label: 'Tiendas', icon: 'pi pi-shop' },
  { path: '/pipeline', label: 'Pipeline', icon: 'pi pi-filter' },
  { path: '/revenue', label: 'Revenue', icon: 'pi pi-dollar' },
  { path: '/billing/commissions', label: 'Comisiones', icon: 'pi pi-percentage' },
  { path: '/billing/plan-sales', label: 'Ventas Planes', icon: 'pi pi-receipt' },
  { path: '/subscriptions', label: 'Suscripciones', icon: 'pi pi-sync' },
  { path: '/subscriptions/movement', label: 'Mov. Suscripciones', icon: 'pi pi-chart-line' },
  { path: '/billing/invoices', label: 'Comprobantes', icon: 'pi pi-file-edit' },
  { path: '/alerts', label: 'Alertas', icon: 'pi pi-bell', badge: '' },
  { path: '/plans', label: 'Planes', icon: 'pi pi-credit-card' },
  { path: '/investor', label: 'Inversionistas', icon: 'pi pi-briefcase' },
  { path: '/mcp-tokens', label: 'MCP Tokens', icon: 'pi pi-key' },
  { path: '/broadcasts', label: 'Avisos Backoffice', icon: 'pi pi-megaphone' },
  { path: '/plugins', label: 'Plugins', icon: 'pi pi-microchip' },
  { path: '/complaints', label: 'Reclamos', icon: 'pi pi-flag' }
]

function isActive(path: string): boolean {
  if (route.path === path) return true
  // Avoid parent path matching when a more specific nav item exists
  const hasMoreSpecificMatch = navItems.some(
    item => item.path !== path && item.path.startsWith(path + '/') && (route.path === item.path || route.path.startsWith(item.path + '/'))
  )
  if (hasMoreSpecificMatch) return false
  return route.path.startsWith(path + '/')
}
</script>
