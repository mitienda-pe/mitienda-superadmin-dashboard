<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-bold text-gray-900">Revenue Intelligence</h1>
      <p class="text-sm text-gray-500 mt-1">Análisis profundo de ingresos, retención y unit economics</p>
    </div>

    <!-- Loading -->
    <div v-if="store.isLoading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div class="h-5 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div class="h-64 bg-gray-100 rounded"></div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="store.error" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-2"></i>
      <p class="text-red-700 font-medium">{{ store.error }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="store.fetchRevenue()" />
    </div>

    <template v-else>
      <TabView>
        <!-- Subscriptions Tab -->
        <TabPanel header="Suscripciones">
          <div class="space-y-6">
            <!-- MRR Breakdown chart -->
            <MrrBreakdownChart v-if="store.mrrBreakdown.length" :data="store.mrrBreakdown" />

            <!-- LTV by Plan -->
            <div v-if="store.ltvData.length" class="bg-white rounded-xl border border-gray-200">
              <div class="p-5 border-b border-gray-100">
                <h3 class="text-base font-semibold text-gray-800">LTV por Plan</h3>
              </div>
              <DataTable :value="store.ltvData" stripedRows class="p-datatable-sm">
                <Column field="plan" header="Plan">
                  <template #body="{ data: row }">
                    <span class="font-medium text-gray-800">{{ row.plan }}</span>
                  </template>
                </Column>
                <Column field="stores" header="Tiendas">
                  <template #body="{ data: row }">
                    <span class="text-sm text-gray-600">{{ row.stores }}</span>
                  </template>
                </Column>
                <Column field="arpu" header="ARPU">
                  <template #body="{ data: row }">
                    <span class="text-sm font-semibold text-gray-800">{{ formatCurrency(row.arpu) }}</span>
                  </template>
                </Column>
                <Column field="avg_lifetime_months" header="Vida Promedio">
                  <template #body="{ data: row }">
                    <span class="text-sm text-gray-600">{{ row.avg_lifetime_months }} meses</span>
                  </template>
                </Column>
                <Column field="ltv" header="LTV">
                  <template #body="{ data: row }">
                    <span class="text-sm font-bold text-primary-600">{{ formatCurrency(row.ltv) }}</span>
                  </template>
                </Column>
                <Column field="mrr" header="MRR">
                  <template #body="{ data: row }">
                    <span class="text-sm text-gray-600">{{ formatCurrency(row.mrr) }}</span>
                  </template>
                </Column>
              </DataTable>
            </div>

            <!-- Cohort Retention -->
            <CohortHeatmap v-if="store.cohorts.length" :data="store.cohorts" />
          </div>
        </TabPanel>

        <!-- GMV Tab -->
        <TabPanel header="GMV">
          <div class="space-y-6" v-if="store.gmvAnalysis">
            <!-- GMV Summary -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="bg-white rounded-xl border border-gray-200 p-5">
                <p class="text-xs text-gray-400 uppercase tracking-wider">GMV Mes Actual</p>
                <p class="text-2xl font-bold text-gray-900 mt-1">{{ formatCurrency(store.gmvAnalysis.total_gmv) }}</p>
                <p class="text-xs text-gray-400 mt-1">{{ formatNumber(store.gmvAnalysis.total_orders) }} pedidos</p>
              </div>
              <div class="bg-white rounded-xl border border-gray-200 p-5">
                <p class="text-xs text-gray-400 uppercase tracking-wider">Ticket Promedio</p>
                <p class="text-2xl font-bold text-gray-900 mt-1">
                  {{ formatCurrency(store.gmvAnalysis.total_orders > 0 ? store.gmvAnalysis.total_gmv / store.gmvAnalysis.total_orders : 0) }}
                </p>
              </div>
              <div class="bg-white rounded-xl border border-gray-200 p-5">
                <p class="text-xs text-gray-400 uppercase tracking-wider">Concentración Top 10</p>
                <p class="text-2xl font-bold" :class="store.gmvAnalysis.top10_concentration > 50 ? 'text-yellow-600' : 'text-green-600'">
                  {{ store.gmvAnalysis.top10_concentration }}%
                </p>
                <p class="text-xs text-gray-400 mt-1">del GMV total</p>
              </div>
            </div>

            <!-- Top stores table -->
            <div class="bg-white rounded-xl border border-gray-200">
              <div class="p-5 border-b border-gray-100">
                <h3 class="text-base font-semibold text-gray-800">Top 10 Tiendas por GMV (mes actual)</h3>
              </div>
              <DataTable :value="store.gmvAnalysis.top_stores" stripedRows class="p-datatable-sm">
                <Column field="name" header="Tienda">
                  <template #body="{ data: row }">
                    <router-link :to="`/stores/${row.id}`" class="font-medium text-gray-800 hover:text-primary-600">
                      {{ row.name }}
                    </router-link>
                  </template>
                </Column>
                <Column field="gmv" header="GMV" :sortable="true">
                  <template #body="{ data: row }">
                    <span class="text-sm font-semibold text-gray-800">{{ formatCurrency(row.gmv) }}</span>
                  </template>
                </Column>
                <Column field="orders" header="Pedidos">
                  <template #body="{ data: row }">
                    <span class="text-sm text-gray-600">{{ row.orders }}</span>
                  </template>
                </Column>
                <Column field="percentage" header="% GMV">
                  <template #body="{ data: row }">
                    <div class="flex items-center gap-2">
                      <div class="flex-1 bg-gray-100 rounded-full h-2 max-w-[80px]">
                        <div class="bg-primary-500 rounded-full h-2" :style="{ width: `${row.percentage}%` }"></div>
                      </div>
                      <span class="text-xs text-gray-500">{{ row.percentage }}%</span>
                    </div>
                  </template>
                </Column>
              </DataTable>
            </div>
          </div>
        </TabPanel>

        <!-- Churn Tab -->
        <TabPanel header="Churn">
          <ChurnByPlanChart v-if="store.churnByPlan.length" :data="store.churnByPlan" />
        </TabPanel>
      </TabView>
    </template>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import Button from 'primevue/button'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import MrrBreakdownChart from '@/components/charts/MrrBreakdownChart.vue'
import CohortHeatmap from '@/components/charts/CohortHeatmap.vue'
import ChurnByPlanChart from '@/components/charts/ChurnByPlanChart.vue'
import { useRevenueStore } from '@/stores/revenue.store'
import { useFormatters } from '@/composables/useFormatters'

const store = useRevenueStore()
const { formatCurrency, formatNumber } = useFormatters()

onMounted(() => {
  store.fetchRevenue()
})
</script>
