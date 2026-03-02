import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  SubscriptionItem,
  SubscriptionDetail,
  SubscriptionFilters,
  SubscriptionMeta,
  RecordPaymentData,
} from '@/types/subscriptions.types'
import {
  getSubscriptions,
  getSubscriptionDetail,
  activateSubscription,
  suspendSubscription,
  recordPayment,
} from '@/api/subscriptions.api'

export const useSubscriptionsStore = defineStore('subscriptions', () => {
  // List state
  const subscriptions = ref<SubscriptionItem[]>([])
  const meta = ref<SubscriptionMeta>({ page: 1, total: 0, totalPages: 0, hasMore: false })
  const filters = ref<SubscriptionFilters>({
    status: 'all',
    payment_type: 'all',
    search: '',
    page: 1,
    per_page: 20,
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Detail state
  const currentSubscription = ref<SubscriptionDetail | null>(null)
  const detailLoading = ref(false)
  const detailError = ref<string | null>(null)

  // Action state
  const actionLoading = ref(false)

  async function fetchSubscriptions() {
    loading.value = true
    error.value = null
    try {
      const res = await getSubscriptions(filters.value)
      subscriptions.value = res.data || []
      if (res.meta) meta.value = res.meta
    } catch (e: unknown) {
      const err = e as Error
      error.value = err.message || 'Error al cargar suscripciones'
    } finally {
      loading.value = false
    }
  }

  function updateFilters(newFilters: Partial<SubscriptionFilters>) {
    const resetPage =
      newFilters.status !== undefined ||
      newFilters.payment_type !== undefined ||
      newFilters.search !== undefined
    Object.assign(filters.value, newFilters)
    if (resetPage) {
      filters.value.page = 1
    }
    fetchSubscriptions()
  }

  function goToPage(page: number) {
    filters.value.page = page
    fetchSubscriptions()
  }

  async function fetchDetail(id: number) {
    detailLoading.value = true
    detailError.value = null
    currentSubscription.value = null
    try {
      const res = await getSubscriptionDetail(id)
      currentSubscription.value = res.data
    } catch (e: unknown) {
      const err = e as Error
      detailError.value = err.message || 'Error al cargar detalle de suscripción'
    } finally {
      detailLoading.value = false
    }
  }

  async function activate(id: number): Promise<boolean> {
    actionLoading.value = true
    try {
      await activateSubscription(id)
      await fetchDetail(id)
      return true
    } catch {
      return false
    } finally {
      actionLoading.value = false
    }
  }

  async function suspend(id: number): Promise<boolean> {
    actionLoading.value = true
    try {
      await suspendSubscription(id)
      await fetchDetail(id)
      return true
    } catch {
      return false
    } finally {
      actionLoading.value = false
    }
  }

  async function doRecordPayment(id: number, data: RecordPaymentData): Promise<boolean> {
    actionLoading.value = true
    try {
      await recordPayment(id, data)
      await fetchDetail(id)
      return true
    } catch {
      return false
    } finally {
      actionLoading.value = false
    }
  }

  return {
    // List
    subscriptions,
    meta,
    filters,
    loading,
    error,
    fetchSubscriptions,
    updateFilters,
    goToPage,
    // Detail
    currentSubscription,
    detailLoading,
    detailError,
    fetchDetail,
    // Actions
    actionLoading,
    activate,
    suspend,
    doRecordPayment,
  }
})
