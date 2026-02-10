import { defineStore } from 'pinia'
import { ref } from 'vue'
import { dashboardApi } from '@/api/dashboard.api'
import type {
  DashboardKPIs,
  MrrEvolutionMonth,
  ChurnVsNewMonth,
  GmvMonth,
  PlanSegment,
  StoreActivity
} from '@/types/dashboard.types'

export const useDashboardStore = defineStore('dashboard', () => {
  const kpis = ref<DashboardKPIs | null>(null)
  const mrrEvolution = ref<MrrEvolutionMonth[]>([])
  const churnVsNew = ref<ChurnVsNewMonth[]>([])
  const gmvMonthly = ref<GmvMonth[]>([])
  const planDistribution = ref<PlanSegment[]>([])
  const activityTable = ref<StoreActivity[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchAll() {
    isLoading.value = true
    error.value = null

    try {
      const [
        overviewRes,
        mrrRes,
        churnRes,
        gmvRes,
        planRes,
        activityRes
      ] = await Promise.all([
        dashboardApi.getOverview(),
        dashboardApi.getMrrEvolution(),
        dashboardApi.getChurnVsNew(),
        dashboardApi.getGmvMonthly(),
        dashboardApi.getPlanDistribution(),
        dashboardApi.getActivityTable()
      ])

      if (overviewRes.success && overviewRes.data) {
        kpis.value = overviewRes.data
      }
      if (mrrRes.success && mrrRes.data) {
        mrrEvolution.value = mrrRes.data as MrrEvolutionMonth[]
      }
      if (churnRes.success && churnRes.data) {
        churnVsNew.value = churnRes.data as ChurnVsNewMonth[]
      }
      if (gmvRes.success && gmvRes.data) {
        gmvMonthly.value = gmvRes.data as GmvMonth[]
      }
      if (planRes.success && planRes.data) {
        const d = planRes.data as { current: PlanSegment[] }
        planDistribution.value = d.current || []
      }
      if (activityRes.success && activityRes.data) {
        activityTable.value = activityRes.data as StoreActivity[]
      }
    } catch (err: any) {
      error.value = err.message || 'Error al cargar datos del dashboard'
      console.error('Dashboard fetch error:', err)
    } finally {
      isLoading.value = false
    }
  }

  return {
    kpis,
    mrrEvolution,
    churnVsNew,
    gmvMonthly,
    planDistribution,
    activityTable,
    isLoading,
    error,
    fetchAll
  }
})
