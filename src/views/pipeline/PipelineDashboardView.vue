<template>
  <div class="space-y-6">
    <PipelineSubNav />

    <!-- Loading -->
    <div v-if="pipelineStore.isDashboardLoading" class="space-y-4">
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div v-for="i in 6" :key="i" class="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
          <div class="h-3 bg-gray-200 rounded w-2/3 mb-3"></div>
          <div class="h-7 bg-gray-100 rounded w-1/2"></div>
        </div>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="pipelineStore.dashboardError" class="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <i class="pi pi-exclamation-triangle text-3xl text-red-400 mb-2"></i>
      <p class="text-red-700 font-medium">{{ pipelineStore.dashboardError }}</p>
      <Button label="Reintentar" icon="pi pi-refresh" class="mt-4" severity="danger" outlined @click="pipelineStore.fetchDashboard()" />
    </div>

    <!-- Content -->
    <template v-else-if="pipelineStore.dashboard">
      <!-- KPIs Row -->
      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard title="Total Trials" :value="kpis.total_trials" format="number" />
        <KpiCard title="Trials Activos" :value="kpis.active_trials" format="number" />
        <KpiCard title="Tasa Conversión" :value="kpis.conversion_rate" format="percent" />
        <KpiCard title="Días Promedio" :value="kpis.avg_conversion_days" format="number" subtitle="para convertir" />
        <KpiCard title="Score Promedio" :value="kpis.avg_score" format="number" subtitle="de 100" />
        <KpiCard title="Este Mes" :value="kpis.trials_this_month" format="number" subtitle="nuevos trials" />
      </div>

      <!-- Charts Row 1: Funnel + Score Distribution -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <FunnelChart :data="pipelineStore.dashboard.funnel" />
        </div>
        <ScoreDistributionChart :data="pipelineStore.dashboard.score_distribution" />
      </div>

      <!-- Charts Row 2: Monthly + Follow-ups -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrialsConversionsChart :data="pipelineStore.dashboard.monthly_trials" />
        <UpcomingFollowUpsTable :data="pipelineStore.dashboard.upcoming_follow_ups" />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import Button from 'primevue/button'
import { usePipelineStore } from '@/stores/pipeline.store'
import KpiCard from '@/components/ui/KpiCard.vue'
import PipelineSubNav from '@/components/pipeline/PipelineSubNav.vue'
import FunnelChart from '@/components/pipeline/FunnelChart.vue'
import TrialsConversionsChart from '@/components/pipeline/TrialsConversionsChart.vue'
import ScoreDistributionChart from '@/components/pipeline/ScoreDistributionChart.vue'
import UpcomingFollowUpsTable from '@/components/pipeline/UpcomingFollowUpsTable.vue'

const pipelineStore = usePipelineStore()

const kpis = computed(() => pipelineStore.dashboard?.kpis ?? {
  total_trials: 0, active_trials: 0, conversion_rate: 0,
  avg_conversion_days: 0, avg_score: 0, trials_this_month: 0,
})

onMounted(() => {
  pipelineStore.fetchDashboard()
})
</script>
