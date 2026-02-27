import { defineStore } from 'pinia'
import { ref } from 'vue'
import { plansApi } from '@/api/plans.api'
import type { PlanListItem, PlanDetail, ModuleDefinition, StoreModulesData, MatrixData, MatrixPlanUpdate } from '@/types/plans.types'

export const usePlansStore = defineStore('plans', () => {
  const plans = ref<PlanListItem[]>([])
  const currentPlan = ref<PlanDetail | null>(null)
  const allModules = ref<ModuleDefinition[]>([])
  const storeModulesData = ref<StoreModulesData | null>(null)
  const matrixData = ref<MatrixData | null>(null)
  const isLoading = ref(false)
  const isMatrixLoading = ref(false)
  const isSavingMatrix = ref(false)
  const error = ref<string | null>(null)
  const matrixError = ref<string | null>(null)

  async function fetchPlans() {
    isLoading.value = true
    error.value = null
    try {
      const response = await plansApi.getPlans()
      if (response.success && response.data) {
        plans.value = response.data
      }
    } catch (e: any) {
      error.value = e.message || 'Error al cargar planes'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchPlanDetail(id: number) {
    isLoading.value = true
    error.value = null
    try {
      const response = await plansApi.getPlanDetail(id)
      if (response.success && response.data) {
        currentPlan.value = response.data
      }
    } catch (e: any) {
      error.value = e.message || 'Error al cargar detalle del plan'
    } finally {
      isLoading.value = false
    }
  }

  async function savePlan(id: number, data: { name?: string; max_items?: number; max_pages?: number }) {
    const response = await plansApi.updatePlan(id, data)
    if (response.success) {
      await fetchPlanDetail(id)
    }
    return response
  }

  async function savePlanModules(id: number, moduleIds: number[]) {
    const response = await plansApi.updatePlanModules(id, moduleIds)
    if (response.success) {
      await fetchPlanDetail(id)
    }
    return response
  }

  async function fetchModules() {
    try {
      const response = await plansApi.getModules()
      if (response.success && response.data) {
        allModules.value = response.data
      }
    } catch (e: any) {
      console.error('Error fetching modules:', e)
    }
  }

  async function fetchStoreModules(storeId: number) {
    try {
      const response = await plansApi.getStoreModules(storeId)
      if (response.success && response.data) {
        storeModulesData.value = response.data
      } else {
        throw new Error(response.message || 'Error fetching store modules')
      }
    } catch (e: any) {
      console.error('Error fetching store modules:', e)
      throw e
    }
  }

  async function saveStoreModules(storeId: number, moduleIds: number[]) {
    const response = await plansApi.updateStoreModules(storeId, moduleIds)
    if (response.success) {
      await fetchStoreModules(storeId)
    }
    return response
  }

  async function resetStoreModules(storeId: number) {
    const response = await plansApi.resetStoreModules(storeId)
    if (response.success) {
      await fetchStoreModules(storeId)
    }
    return response
  }

  async function fetchMatrix() {
    isMatrixLoading.value = true
    matrixError.value = null
    try {
      const response = await plansApi.getMatrix()
      if (response.success && response.data) {
        matrixData.value = response.data
      }
    } catch (e: any) {
      matrixError.value = e.message || 'Error al cargar la matriz de planes'
    } finally {
      isMatrixLoading.value = false
    }
  }

  async function saveMatrix(plans: MatrixPlanUpdate[]) {
    isSavingMatrix.value = true
    try {
      const response = await plansApi.updateMatrix(plans)
      if (response.success) {
        await fetchMatrix()
      }
      return response
    } finally {
      isSavingMatrix.value = false
    }
  }

  return {
    plans,
    currentPlan,
    allModules,
    storeModulesData,
    isLoading,
    error,
    fetchPlans,
    fetchPlanDetail,
    savePlan,
    savePlanModules,
    fetchModules,
    fetchStoreModules,
    saveStoreModules,
    resetStoreModules,
    matrixData,
    isMatrixLoading,
    isSavingMatrix,
    matrixError,
    fetchMatrix,
    saveMatrix
  }
})
