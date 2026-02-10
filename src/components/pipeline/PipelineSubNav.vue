<template>
  <div class="flex gap-1 bg-gray-100 rounded-lg p-1 mb-6 w-fit">
    <router-link
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
      :class="isActive(item.to)
        ? 'bg-white text-gray-900 shadow-sm'
        : 'text-gray-500 hover:text-gray-700'"
    >
      <i :class="item.icon" class="mr-1.5 text-xs"></i>
      {{ item.label }}
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'

const route = useRoute()

const navItems = [
  { to: '/pipeline', label: 'Dashboard', icon: 'pi pi-chart-bar' },
  { to: '/pipeline/leads', label: 'Leads', icon: 'pi pi-list' },
]

function isActive(path: string): boolean {
  if (path === '/pipeline') {
    return route.path === '/pipeline'
  }
  return route.path.startsWith(path)
}
</script>
