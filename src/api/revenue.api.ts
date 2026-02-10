import api from './axios'
import type {
  MrrBreakdownMonth, CohortData, LtvByPlan,
  ChurnByPlanMonth, GmvAnalysis, AlertsResponse, InvestorKpis
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

export async function getInvestorKpis() {
  const res = await api.get<{ success: boolean; data: InvestorKpis }>(
    '/superadmin/dashboard/investor/kpis'
  )
  return res.data
}

export function getExportUrl(type: 'kpis' | 'mrr' | 'stores'): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api/v1'
  return `${baseUrl}/superadmin/dashboard/investor/export?type=${type}`
}
