<template>
  <div class="min-h-screen bg-gray-50 flex">
    <!-- Sidebar -->
    <aside class="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full">
      <!-- Logo -->
      <div class="h-16 flex items-center px-6 border-b border-gray-200">
        <router-link to="/dashboard" class="flex items-center gap-2">
          <span class="text-xl font-bold text-primary-600">MiTienda</span>
          <span class="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full font-medium">Admin</span>
        </router-link>
      </div>

      <!-- Navigation -->
      <div class="flex-1 overflow-y-auto p-4">
        <SidebarNav />
      </div>

      <!-- User info -->
      <div class="p-4 border-t border-gray-200">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-sm font-semibold">
            {{ userInitials }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-700 truncate">{{ authStore.user?.name }}</p>
            <p class="text-xs text-gray-500 truncate">{{ authStore.superAdminInfo?.superadmin_type_name || 'Super Admin' }}</p>
          </div>
          <button
            @click="handleLogout"
            class="p-1.5 text-gray-400 hover:text-red-500 transition-colors rounded-lg hover:bg-gray-100"
            v-tooltip.left="'Cerrar sesión'"
          >
            <i class="pi pi-sign-out text-sm"></i>
          </button>
        </div>
      </div>
    </aside>

    <!-- Main content -->
    <main class="flex-1 ml-64">
      <!-- Top bar -->
      <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10">
        <div>
          <h1 class="text-lg font-semibold text-gray-800">{{ pageTitle }}</h1>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-sm text-gray-500">{{ currentDate }}</span>
        </div>
      </header>

      <!-- Page content -->
      <div class="p-8">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useAuthStore } from '@/stores/auth.store'
import SidebarNav from '@/components/layout/SidebarNav.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const pageTitle = computed(() => {
  const titles: Record<string, string> = {
    Overview: 'Dashboard Overview',
    Stores: 'Tiendas',
    StoreDetail: 'Detalle de Tienda',
    PipelineDashboard: 'Pipeline de Trials',
    PipelineLeads: 'Pipeline - Leads',
    PipelineDetail: 'Detalle de Lead',
    Revenue: 'Revenue Intelligence',
    Alerts: 'Alertas',
    Investor: 'Vista Inversionistas'
  }
  return titles[route.name as string] || 'Dashboard'
})

const userInitials = computed(() => {
  const name = authStore.user?.name || ''
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
})

const currentDate = computed(() => {
  return format(new Date(), "d 'de' MMMM, yyyy", { locale: es })
})

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}
</script>
