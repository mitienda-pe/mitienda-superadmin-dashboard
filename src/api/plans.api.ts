import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type { PlanListItem, PlanDetail, ModuleDefinition, StoreModulesData, MatrixData, MatrixPlanUpdate } from '@/types/plans.types'

export const plansApi = {
  async getPlans(): Promise<ApiResponse<PlanListItem[]>> {
    const response = await apiClient.get('/superadmin/dashboard/plans')
    return response.data
  },

  async getPlanDetail(id: number): Promise<ApiResponse<PlanDetail>> {
    const response = await apiClient.get(`/superadmin/dashboard/plans/${id}`)
    return response.data
  },

  async updatePlan(id: number, data: { name?: string; max_items?: number; max_pages?: number }): Promise<ApiResponse> {
    const response = await apiClient.put(`/superadmin/dashboard/plans/${id}`, data)
    return response.data
  },

  async updatePlanModules(id: number, moduleIds: number[]): Promise<ApiResponse> {
    const response = await apiClient.put(`/superadmin/dashboard/plans/${id}/modules`, { module_ids: moduleIds })
    return response.data
  },

  async getModules(): Promise<ApiResponse<ModuleDefinition[]>> {
    const response = await apiClient.get('/superadmin/dashboard/modules')
    return response.data
  },

  async getStoreModules(storeId: number): Promise<ApiResponse<StoreModulesData>> {
    const response = await apiClient.get(`/superadmin/dashboard/stores/${storeId}/modules`)
    return response.data
  },

  async updateStoreModules(storeId: number, moduleIds: number[]): Promise<ApiResponse> {
    const response = await apiClient.put(`/superadmin/dashboard/stores/${storeId}/modules`, { module_ids: moduleIds })
    return response.data
  },

  async getMatrix(): Promise<ApiResponse<MatrixData>> {
    const response = await apiClient.get('/superadmin/dashboard/plans/matrix')
    return response.data
  },

  async updateMatrix(plans: MatrixPlanUpdate[]): Promise<ApiResponse> {
    const response = await apiClient.put('/superadmin/dashboard/plans/matrix', { plans })
    return response.data
  }
}
