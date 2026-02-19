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
  { path: '/alerts', label: 'Alertas', icon: 'pi pi-bell', badge: '' },
  { path: '/investor', label: 'Inversionistas', icon: 'pi pi-briefcase' },
  { path: '/mcp-tokens', label: 'MCP Tokens', icon: 'pi pi-key' }
]

function isActive(path: string): boolean {
  return route.path === path || route.path.startsWith(path + '/')
}
</script>
