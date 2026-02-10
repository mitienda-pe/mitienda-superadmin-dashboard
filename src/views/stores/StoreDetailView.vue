<template>
  <div class="space-y-6">
    <!-- Back button -->
    <router-link to="/stores" class="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
      <i class="pi pi-arrow-left text-xs"></i>
      Volver a Tiendas
    </router-link>

    <!-- Loading -->
    <div v-if="storesStore.isDetailLoading" class="space-y-4">
      <div class="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div class="flex gap-6">
          <div class="w-16 h-16 rounded-xl bg-gray-200"></div>
          <div class="flex-1">
            <div class="h-6 bg-gray-200 rounded w-1/3 mb-3"></div>
            <div class="h-4 bg-gray-100 rounded w-1/2 mb-4"></div>
            <div class="grid grid-cols-4 gap-4">
              <div class="h-12 bg-gray-100 rounded"></div>
              <div class="h-12 bg-gray-100 rounded"></div>
              <div class="h-12 bg-gray-100 rounded"></div>
              <div class="h-12 bg-gray-100 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="storesStore.detailError" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-2"></i>
      <p class="text-red-700 font-medium">{{ storesStore.detailError }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="loadStore" />
    </div>

    <!-- Content -->
    <template v-else-if="storesStore.currentStore">
      <StoreHeader :store="storesStore.currentStore" />

      <TabView v-model:activeIndex="activeTab">
        <TabPanel header="Ventas">
          <SalesPanel
            :sales="storesStore.currentStore.sales"
            :daily-sales="storesStore.dailySales"
            :orders="storesStore.orders"
          />
        </TabPanel>
        <TabPanel header="Suscripción">
          <SubscriptionPanel
            :current-plan="storesStore.currentStore.plan"
            :history="storesStore.subscriptionHistory"
          />
        </TabPanel>
        <TabPanel header="Productos">
          <TopProductsPanel :products="storesStore.topProducts" />
        </TabPanel>
      </TabView>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import Button from 'primevue/button'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import StoreHeader from '@/components/stores/StoreHeader.vue'
import SalesPanel from '@/components/stores/SalesPanel.vue'
import SubscriptionPanel from '@/components/stores/SubscriptionPanel.vue'
import TopProductsPanel from '@/components/stores/TopProductsPanel.vue'
import { useStoresStore } from '@/stores/stores.store'

const route = useRoute()
const storesStore = useStoresStore()
const activeTab = ref(0)

function loadStore() {
  const id = Number(route.params.id)
  if (id) {
    storesStore.fetchStoreDetail(id)
  }
}

onMounted(() => {
  loadStore()
})
</script>
