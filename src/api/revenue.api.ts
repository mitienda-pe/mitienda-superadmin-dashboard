import api from './axios'
import type {
  MrrBreakdownMonth, CohortData, LtvByPlan,
  ChurnByPlanMonth, GmvAnalysis, AlertsResponse
} from '@/types/revenue.types'

export async function getMrrBreakdown() {
  const res = await api.get<{ success: boolean; data: MrrBreakdownMonth[] }>(
    '/superadmin/dashboard/revenue/mrr-breakdown'
  )
  return res.data
}

export async function getCohortAnalysis() {
  const res = await api.get<{ success: boolean; data: CohortData[] }>(
    '/superadmin/dashboard/revenue/cohort'
  )
  return res.data
}

export async function getLtvByPlan() {
  const res = await api.get<{ success: boolean; data: LtvByPlan[] }>(
    '/superadmin/dashboard/revenue/ltv'
  )
  return res.data
}

export async function getChurnByPlan() {
  const res = await api.get<{ success: boolean; data: ChurnByPlanMonth[] }>(
    '/superadmin/dashboard/revenue/churn-by-plan'
  )
  return res.data
}

export async function getGmvAnalysis() {
  const res = await api.get<{ success: boolean; data: GmvAnalysis }>(
    '/superadmin/dashboard/revenue/gmv-analysis'
  )
  return res.data
}

export async function getAlerts(severity?: string) {
  const params: Record<string, string> = {}
  if (severity) params.severity = severity
  const res = await api.get<{ success: boolean; data: AlertsResponse }>(
    '/superadmin/dashboard/alerts',
    { params }
  )
  return res.data
}
