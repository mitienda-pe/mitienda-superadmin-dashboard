import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth.api'
import type { User, Store, LoginCredentials, SuperAdminInfo } from '@/types/auth.types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const stores = ref<Store[]>([])
  const selectedStore = ref<Store | null>(null)
  const accessToken = ref<string | null>(null)
  const refreshToken = ref<string | null>(null)
  const superAdminInfo = ref<SuperAdminInfo | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)
  const isSuperAdmin = computed(() => superAdminInfo.value?.is_superadmin || false)

  // Actions
  async function login(credentials: LoginCredentials) {
    try {
      isLoading.value = true
      error.value = null

      const response = await authApi.login(credentials)

      if (response.success && response.data) {
        accessToken.value = response.data.access_token
        refreshToken.value = response.data.refresh_token || null
        user.value = response.data.user

        localStorage.setItem('access_token', response.data.access_token)
        if (response.data.refresh_token) {
          localStorage.setItem('refresh_token', response.data.refresh_token)
        }
        localStorage.setItem('user', JSON.stringify(response.data.user))

        // Fetch stores and select the first one automatically
        if (response.data.store_id) {
          await fetchStores()
        }

        // Verify superadmin status — required for this app
        await checkSuperAdmin()

        if (!superAdminInfo.value?.is_superadmin) {
          // Not a superadmin — clear everything
          await logout()
          error.value = 'Acceso denegado: Se requieren permisos de Super Administrador'
          return false
        }

        return true
      } else {
        error.value = response.message || 'Error al iniciar sesión'
        return false
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error de conexión'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function fetchStores() {
    try {
      const response = await authApi.getStores()

      if (response.success && response.data) {
        stores.value = response.data

        if (response.data.length === 1) {
          await selectStore(response.data[0])
        } else {
          const savedStore = localStorage.getItem('selected_store')
          if (savedStore) {
            const store = JSON.parse(savedStore)
            const foundStore = response.data.find(s => s.id === store.id)
            if (foundStore) {
              selectedStore.value = foundStore
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Error al obtener tiendas:', err)
    }
  }

  async function selectStore(store: Store) {
    try {
      isLoading.value = true
      error.value = null

      const response = await authApi.selectStore(store.id)

      if (response.success && response.data) {
        const storeToken = response.data.access_token
        accessToken.value = storeToken
        localStorage.setItem('access_token', storeToken)

        selectedStore.value = store
        localStorage.setItem('selected_store', JSON.stringify(store))
        return true
      } else {
        error.value = response.message || 'Error al seleccionar tienda'
        return false
      }
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Error al seleccionar tienda'
      return false
    } finally {
      isLoading.value = false
    }
  }

  async function checkSuperAdmin() {
    try {
      const response = await authApi.checkSuperAdmin()

      if (response.success && response.data) {
        superAdminInfo.value = response.data
        localStorage.setItem('superadmin_info', JSON.stringify(response.data))
      }
    } catch {
      superAdminInfo.value = { is_superadmin: false }
    }
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      // Ignore logout errors
    } finally {
      user.value = null
      stores.value = []
      selectedStore.value = null
      accessToken.value = null
      refreshToken.value = null
      superAdminInfo.value = null
      error.value = null

      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      localStorage.removeItem('selected_store')
      localStorage.removeItem('superadmin_info')
    }
  }

  function isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (!payload.exp) return false
      return payload.exp * 1000 < Date.now()
    } catch {
      return true
    }
  }

  function restoreSession() {
    const token = localStorage.getItem('access_token')
    const refresh = localStorage.getItem('refresh_token')
    const savedUser = localStorage.getItem('user')
    const savedSuperAdminInfo = localStorage.getItem('superadmin_info')

    if (!token || !savedUser) return

    if (isTokenExpired(token)) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      localStorage.removeItem('selected_store')
      localStorage.removeItem('superadmin_info')
      return
    }

    try {
      accessToken.value = token
      refreshToken.value = refresh
      user.value = JSON.parse(savedUser)

      const savedStore = localStorage.getItem('selected_store')
      if (savedStore) {
        selectedStore.value = JSON.parse(savedStore)
      }

      if (savedSuperAdminInfo) {
        superAdminInfo.value = JSON.parse(savedSuperAdminInfo)
      }
    } catch {
      accessToken.value = null
      refreshToken.value = null
      user.value = null
      selectedStore.value = null
      superAdminInfo.value = null
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      localStorage.removeItem('user')
      localStorage.removeItem('selected_store')
      localStorage.removeItem('superadmin_info')
    }

    fetchStores()
  }

  return {
    user,
    stores,
    selectedStore,
    accessToken,
    refreshToken,
    superAdminInfo,
    isLoading,
    error,
    isAuthenticated,
    isSuperAdmin,
    login,
    fetchStores,
    selectStore,
    checkSuperAdmin,
    logout,
    restoreSession
  }
})
