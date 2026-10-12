<template>
  <div v-if="visibleTabs.length > 1" class="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
    <router-link
      v-for="tab in visibleTabs"
      :key="tab.to"
      :to="tab.to"
      class="px-4 py-2 rounded-md text-sm font-medium transition-colors"
      :class="route.path === tab.to
        ? 'bg-white text-gray-900 shadow-sm'
        : 'text-gray-500 hover:text-gray-700'"
    >
      <i v-if="tab.icon" :class="tab.icon" class="mr-1.5 text-xs"></i>
      {{ tab.label }}
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import type { SectionTab } from '@/config/sections.config'

// Pestañas entre pantallas hermanas que comparten una sola entrada del menu
// lateral. Cada pestaña es una ruta propia: los enlaces guardados siguen
// funcionando y cada vista conserva su estado.
const props = defineProps<{ tabs: SectionTab[] }>()

const route = useRoute()
const authStore = useAuthStore()

// Un rol acotado no ve las pestañas de pantallas que no puede abrir; si solo
// le queda una, la barra sobra.
const visibleTabs = computed(() => props.tabs.filter(tab => authStore.canPath(tab.to)))
</script>
