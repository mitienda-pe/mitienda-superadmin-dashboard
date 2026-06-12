import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getAdminUsers, resendActivation as apiResendActivation,
  type AdminUserItem, type AdminUsersMeta, type AdminUsersFilters
} from '@/api/users.api'

export const useUsersStore = defineStore('users', () => {
  const users = ref<AdminUserItem[]>([])
  const meta = ref<AdminUsersMeta>({ current_page: 1, per_page: 20, total: 0, total_pages: 0 })
  const filters = ref<AdminUsersFilters>({ search: '', status: 'all', store_status: 'vigente', rol: 'all', page: 1, per_page: 20 })
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const resendingId = ref<number | null>(null)

  async function fetchUsers() {
    isLoading.value = true
    error.value = null
    try {
      const res = await getAdminUsers(filters.value)
      users.value = res.data
      if (res.meta) meta.value = res.meta
    } catch (e: any) {
      error.value = e.message || 'Error cargando usuarios'
    } finally {
      isLoading.value = false
    }
  }

  function updateFilters(newFilters: Partial<AdminUsersFilters>) {
    Object.assign(filters.value, newFilters)
    if (newFilters.search !== undefined || newFilters.status !== undefined || newFilters.store_status !== undefined || newFilters.rol !== undefined) {
      filters.value.page = 1
    }
    fetchUsers()
  }

  function goToPage(page: number) {
    filters.value.page = page
    fetchUsers()
  }

  async function resendActivation(userId: number, tiendaId: number): Promise<boolean> {
    resendingId.value = userId
    try {
      const res = await apiResendActivation(userId, tiendaId)
      return res.email_sent
    } finally {
      resendingId.value = null
    }
  }

  return {
    users, meta, filters, isLoading, error, resendingId,
    fetchUsers, updateFilters, goToPage, resendActivation
  }
})
