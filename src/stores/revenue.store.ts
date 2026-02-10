import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  MrrBreakdownMonth, CohortData, LtvByPlan,
  ChurnByPlanMonth, GmvAnalysis, AlertsResponse, InvestorKpis
} from '@/types/revenue.types'
import {
  getMrrBreakdown, getCohortAnalysis, getLtvByPlan,
  getChurnByPlan, getGmvAnalysis, getAlerts, getInvestorKpis
} from '@/api/revenue.api'

export const useRevenueStore = defineStore('revenue', () => {
  // Revenue state
  const mrrBreakdown = ref<MrrBreakdownMonth[]>([])
  const cohorts = ref<CohortData[]>([])
  const ltvData = ref<LtvByPlan[]>([])
  const churnByPlan = ref<ChurnByPlanMonth[]>([])
  const gmvAnalysis = ref<GmvAnalysis | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Alerts state
  const alertsData = ref<AlertsResponse | null>(null)
  const isAlertsLoading = ref(false)
  const alertsError = ref<string | null>(null)

  // Investor state
  const investorKpis = ref<InvestorKpis | null>(null)
  const isInvestorLoading = ref(false)
  const investorError = ref<string | null>(null)

  async function fetchRevenue() {
    isLoading.value = true
    error.value = null
    try {
      const [mrrRes, cohortRes, ltvRes, churnRes, gmvRes] = await Promise.all([
        getMrrBreakdown(),
        getCohortAnalysis(),
        getLtvByPlan(),
        getChurnByPlan(),
        getGmvAnalysis()
      ])
      mrrBreakdown.value = mrrRes.data
      cohorts.value = cohortRes.data
      ltvData.value = ltvRes.data
      churnByPlan.value = churnRes.data
      gmvAnalysis.value = gmvRes.data
    } catch (e: any) {
      error.value = e.message || 'Error loading revenue data'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchAlerts(severity?: string) {
    isAlertsLoading.value = true
    alertsError.value = null
    try {
      const res = await getAlerts(severity)
      alertsData.value = res.data
    } catch (e: any) {
      alertsError.value = e.message || 'Error loading alerts'
    } finally {
      isAlertsLoading.value = false
    }
  }

  async function fetchInvestorKpis() {
    isInvestorLoading.value = true
    investorError.value = null
    try {
      const res = await getInvestorKpis()
      investorKpis.value = res.data
    } catch (e: any) {
      investorError.value = e.message || 'Error loading investor data'
    } finally {
      isInvestorLoading.value = false
    }
  }

  return {
    mrrBreakdown, cohorts, ltvData, churnByPlan, gmvAnalysis,
    isLoading, error,
    alertsData, isAlertsLoading, alertsError,
    investorKpis, isInvestorLoading, investorError,
    fetchRevenue, fetchAlerts, fetchInvestorKpis
  }
})
