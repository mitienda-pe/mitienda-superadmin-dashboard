import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type { SubscriptionMovementData } from '@/types/subscription-movement.types'

export const subscriptionMovementApi = {
  async getMovement(month: string): Promise<ApiResponse<SubscriptionMovementData>> {
    const response = await apiClient.get('/superadmin/dashboard/subscription-movement', {
      params: { month }
    })
    return response.data
  }
}
