import apiClient from './axios'
import type { ApiResponse } from '@/types/api.types'
import type { LoginCredentials, LoginResponse, Store, SuperAdminInfo } from '@/types/auth.types'

export const authApi = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    const response = await apiClient.post('/auth/login', credentials)
    return response.data
  },

  async refresh(refreshToken: string): Promise<ApiResponse<{ access_token: string; refresh_token: string }>> {
    const response = await apiClient.post('/auth/refresh', { refresh_token: refreshToken })
    return response.data
  },

  async logout(): Promise<ApiResponse> {
    const response = await apiClient.post('/auth/logout')
    return response.data
  },

  async getStores(): Promise<ApiResponse<Store[]>> {
    const response = await apiClient.get('/user/stores')

    if (response.data.success && response.data.data?.stores) {
      const stores = response.data.data.stores.map((store: any) => ({
        id: parseInt(store.tienda_id),
        name: store.tienda_nombre_display || store.tienda_nombre_comercial,
        slug: store.tienda_nombreurl,
        logo: null,
        url: store.tienda_url,
        plan: store.plan_titulo,
        status: store.tienda_plan_status_text === 'Activo' ? 'active' : 'inactive'
      }))

      return {
        success: true,
        data: stores
      }
    }

    return response.data
  },

  async selectStore(storeId: number): Promise<ApiResponse<{ access_token: string; expires_in: number; store_id: number }>> {
    const response = await apiClient.post('/user/store/select', { store_id: storeId })
    return response.data
  },

  async checkSuperAdmin(): Promise<ApiResponse<SuperAdminInfo>> {
    const response = await apiClient.get('/superadmin/check')
    return response.data
  }
}
