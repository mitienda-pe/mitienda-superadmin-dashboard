<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <SectionTabs :tabs="HOME_TABS" />
      <SelectButton
        v-model="scope"
        :options="INCOME_SCOPE_OPTIONS"
        optionLabel="label"
        optionValue="value"
        :allowEmpty="false"
        aria-label="Línea de negocio"
      />
    </div>

    <!-- Lo realmente facturado, incluido lo que el MRR no ve -->
    <InvoicedIncomePanel :scope="scope" class="mb-6" />

    <!-- B2B no tiene planes en el sistema: no hay MRR, churn ni GMV que mostrar -->
    <div v-if="scope === 'b2b'" class="bg-white rounded-xl border border-gray-200 p-6 text-sm text-gray-600">
      <p class="font-medium text-gray-800">Las métricas de planes no aplican a B2B</p>
      <p class="mt-1">
        MRR, churn, tiendas activas y GMV salen de los planes de mitienda.pe. Lo de mitiendab2b.com se factura por
        fuera del sistema de planes, así que su resumen es el ingreso facturado de arriba.
      </p>
    </div>

    <!-- Loading state -->
    <LoadingState v-else-if="!dashboardStore.kpis && !dashboardStore.error" />

    <!-- Error state -->
    <div v-else-if="dashboardStore.error && !dashboardStore.kpis" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-2"></i>
      <p class="text-red-700 font-medium">{{ dashboardStore.error }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="loadData" />
    </div>

    <!-- Dashboard content -->
    <div v-else-if="kpis" class="space-y-6">
      <div>
        <h3 class="text-base font-semibold text-gray-800">Planes de mitienda.pe (B2C)</h3>
        <p class="text-sm text-gray-500 mt-0.5">
          Proyección desde los planes activos, sin IGV. No incluye B2B ni lo facturado a mano.
        </p>
      </div>

      <!-- KPI Cards Row -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          title="MRR"
          :value="kpis.mrr.current"
          format="currency"
          :change="kpis.mrr.change"
          :sparkline="kpis.mrr.sparkline"
          subtitle="Recurrente mensual, sin IGV"
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
          subtitle="MRR por tienda, sin IGV"
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
import SectionTabs from '@/components/layout/SectionTabs.vue'
import InvoicedIncomePanel from '@/components/dashboard/InvoicedIncomePanel.vue'
import { HOME_TABS } from '@/config/sections.config'
import { onMounted, computed, ref, watch } from 'vue'
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'
import { INCOME_SCOPE_OPTIONS, type IncomeScope } from '@/config/ledger.config'
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

// La linea de negocio elegida se recuerda entre visitas. Es una comodidad: sin
// almacenamiento el resumen abre en "Combinado".
const SCOPE_KEY = 'superadmin.overview.scope'

function readScope(): IncomeScope {
  try {
    const saved = localStorage.getItem(SCOPE_KEY)
    return saved === 'b2c' || saved === 'b2b' ? saved : 'all'
  } catch {
    return 'all'
  }
}

const scope = ref<IncomeScope>(readScope())

watch(scope, value => {
  try {
    localStorage.setItem(SCOPE_KEY, value)
  } catch {
    // Sin almacenamiento la eleccion dura lo que dura la pagina.
  }
})
const kpis = computed(() => dashboardStore.kpis)

function loadData() {
  dashboardStore.fetchAll()
}

onMounted(() => {
  loadData()
})
</script>
