import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getStoreSalesReport } from '@/api/store-sales.api'
import type { StoreSalesReport, StoreSalesFilters } from '@/types/store-sales.types'

export const useStoreSalesStore = defineStore('storeSales', () => {
  const data = ref<StoreSalesReport | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchReport(filters: StoreSalesFilters) {
    isLoading.value = true
    error.value = null

    try {
      const res = await getStoreSalesReport(filters)
      if (res.success && res.data) {
        data.value = res.data
      } else {
        error.value = res.message || 'Error al cargar las ventas'
      }
    } catch (e: any) {
      error.value = e.message || 'Error al cargar las ventas'
    } finally {
      isLoading.value = false
    }
  }

  return {
    data,
    isLoading,
    error,
    fetchReport
  }
})
