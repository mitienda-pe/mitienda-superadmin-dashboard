<template>
  <div>
    <!-- Loading state -->
    <LoadingState v-if="!dashboardStore.kpis && !dashboardStore.error" />

    <!-- Error state -->
    <div v-else-if="dashboardStore.error && !dashboardStore.kpis" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-2"></i>
      <p class="text-red-700 font-medium">{{ dashboardStore.error }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="loadData" />
    </div>

    <!-- Dashboard content -->
    <div v-else-if="kpis" class="space-y-6">
      <!-- KPI Cards Row -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          title="MRR"
          :value="kpis.mrr.current"
          format="currency"
          :change="kpis.mrr.change"
          :sparkline="kpis.mrr.sparkline"
          subtitle="Monthly Recurring Revenue"
        />
        <KpiCard
          title="Tiendas Activas"
          :value="kpis.active_paid_stores.current"
          format="number"
          :change="kpis.active_paid_stores.change"
          :sparkline="kpis.active_paid_stores.sparkline"
          subtitle="Con plan activo pagado"
        />
        <KpiCard
          title="GMV (mes)"
          :value="kpis.gmv.current"
          format="currency"
          :change="kpis.gmv.change"
          :sparkline="kpis.gmv.sparkline"
          subtitle="Gross Merchandise Value"
        />
        <KpiCard
          title="Churn Rate"
          :value="kpis.churn_rate.current"
          format="percent"
          :change="kpis.churn_rate.change"
          :sparkline="kpis.churn_rate.sparkline"
          :invert-change="true"
          subtitle="Mes actual"
        />
        <KpiCard
          title="ARPU"
          :value="kpis.arpu.current"
          format="currency"
          :change="kpis.arpu.change"
          :sparkline="kpis.arpu.sparkline"
          subtitle="Avg Revenue Per User"
        />
        <KpiCard
          title="NRR"
          :value="kpis.nrr.current"
          format="percent"
          :change="kpis.nrr.change"
          :sparkline="kpis.nrr.sparkline"
          subtitle="Net Revenue Retention"
        />
      </div>

      <!-- Charts Row 1: 3 columns -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <MrrEvolutionChart
          v-if="dashboardStore.mrrEvolution.length"
          :data="dashboardStore.mrrEvolution"
        />
        <ActiveStoresChart
          v-if="dashboardStore.activeStoresMonthly.length"
          :data="dashboardStore.activeStoresMonthly"
        />
        <ChurnVsNewChart
          v-if="dashboardStore.churnVsNew.length"
          :data="dashboardStore.churnVsNew"
        />
      </div>

      <!-- Charts Row 2: 2 columns -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GmvMonthlyChart
          v-if="dashboardStore.gmvMonthly.length"
          :data="dashboardStore.gmvMonthly"
        />
        <PlanDistributionChart
          v-if="dashboardStore.planDistribution.length"
          :data="dashboardStore.planDistribution"
        />
      </div>

      <!-- Charts Row 3: Commissions -->
      <div v-if="dashboardStore.commissionsOverview" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RevenueBreakdownChart
          v-if="dashboardStore.commissionsOverview.monthly?.length"
          :data="dashboardStore.commissionsOverview.monthly"
        />
        <CommissionsByPlanChart
          v-if="dashboardStore.commissionsOverview.by_plan?.length"
          :data="dashboardStore.commissionsOverview.by_plan"
        />
        <CommissionsMonthlyChart
          v-if="dashboardStore.commissionsOverview.monthly?.length"
          :data="dashboardStore.commissionsOverview.monthly"
        />
      </div>

      <!-- Activity Table -->
      <ActivityTable
        v-if="dashboardStore.activityTable.length"
        :data="dashboardStore.activityTable"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue'
import Button from 'primevue/button'
import { useDashboardStore } from '@/stores/dashboard.store'
import KpiCard from '@/components/ui/KpiCard.vue'
import LoadingState from '@/components/ui/LoadingState.vue'
import MrrEvolutionChart from '@/components/charts/MrrEvolutionChart.vue'
import ActiveStoresChart from '@/components/charts/ActiveStoresChart.vue'
import ChurnVsNewChart from '@/components/charts/ChurnVsNewChart.vue'
import GmvMonthlyChart from '@/components/charts/GmvMonthlyChart.vue'
import PlanDistributionChart from '@/components/charts/PlanDistributionChart.vue'
import RevenueBreakdownChart from '@/components/charts/RevenueBreakdownChart.vue'
import CommissionsByPlanChart from '@/components/charts/CommissionsByPlanChart.vue'
import CommissionsMonthlyChart from '@/components/charts/CommissionsMonthlyChart.vue'
import ActivityTable from '@/components/dashboard/ActivityTable.vue'

const dashboardStore = useDashboardStore()
const kpis = computed(() => dashboardStore.kpis)

function loadData() {
  dashboardStore.fetchAll()
}

onMounted(() => {
  loadData()
})
</script>
