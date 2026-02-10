import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type {
  DashboardKPIs,
  MrrEvolutionMonth,
  ChurnVsNewMonth,
  GmvMonth,
  PlanSegment,
  StoreActivity
} from '@/types/dashboard.types'

export const dashboardApi = {
  async getOverview(): Promise<ApiResponse<DashboardKPIs>> {
    const response = await apiClient.get('/superadmin/dashboard/overview')
    return response.data
  },

  async getMrrEvolution(): Promise<ApiResponse<MrrEvolutionMonth[]>> {
    const response = await apiClient.get('/superadmin/dashboard/mrr-evolution')
    return response.data
  },

  async getChurnVsNew(): Promise<ApiResponse<ChurnVsNewMonth[]>> {
    const response = await apiClient.get('/superadmin/dashboard/churn-vs-new')
    return response.data
  },

  async getGmvMonthly(): Promise<ApiResponse<GmvMonth[]>> {
    const response = await apiClient.get('/superadmin/dashboard/gmv-monthly')
    return response.data
  },

  async getPlanDistribution(): Promise<ApiResponse<{ current: PlanSegment[] }>> {
    const response = await apiClient.get('/superadmin/dashboard/plan-distribution')
    return response.data
  },

  async getActivityTable(): Promise<ApiResponse<StoreActivity[]>> {
    const response = await apiClient.get('/superadmin/dashboard/activity-table')
    return response.data
  }
}
