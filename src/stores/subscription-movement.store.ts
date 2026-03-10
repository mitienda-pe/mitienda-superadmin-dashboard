import { defineStore } from 'pinia'
import { ref } from 'vue'
import { subscriptionMovementApi } from '@/api/subscription-movement.api'
import type { SubscriptionMovementData } from '@/types/subscription-movement.types'

export const useSubscriptionMovementStore = defineStore('subscriptionMovement', () => {
  const data = ref<SubscriptionMovementData | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  async function fetchMovement(month: string) {
    isLoading.value = true
    error.value = null

    try {
      const res = await subscriptionMovementApi.getMovement(month)
      if (res.success && res.data) {
        data.value = res.data
      } else {
        error.value = res.message || 'Error al cargar datos'
      }
    } catch (e: any) {
      error.value = e.message || 'Error al cargar datos'
    } finally {
      isLoading.value = false
    }
  }

  return {
    data,
    isLoading,
    error,
    fetchMovement
  }
})
