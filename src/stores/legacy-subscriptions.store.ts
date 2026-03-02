import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  LegacySubscriptionItem,
  LegacyFilters,
  LegacyMeta,
} from '@/types/legacy-subscriptions.types'
import { getLegacySubscriptions } from '@/api/legacy-subscriptions.api'

export const useLegacySubscriptionsStore = defineStore('legacySubscriptions', () => {
  const subscriptions = ref<LegacySubscriptionItem[]>([])
  const meta = ref<LegacyMeta>({ page: 1, total: 0, totalPages: 0, hasMore: false, view: 'latest' })
  const filters = ref<LegacyFilters>({
    status: 'all',
    search: '',
    plan: 'all',
    view: 'latest',
    page: 1,
    per_page: 20,
  })
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchSubscriptions() {
    loading.value = true
    error.value = null
    try {
      const res = await getLegacySubscriptions(filters.value)
      subscriptions.value = res.data || []
      if (res.meta) meta.value = res.meta
    } catch (e: unknown) {
      const err = e as Error
      error.value = err.message || 'Error al cargar suscripciones legacy'
    } finally {
      loading.value = false
    }
  }

  function updateFilters(newFilters: Partial<LegacyFilters>) {
    const resetPage =
      newFilters.status !== undefined ||
      newFilters.search !== undefined ||
      newFilters.plan !== undefined ||
      newFilters.view !== undefined
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

  return {
    subscriptions,
    meta,
    filters,
    loading,
    error,
    fetchSubscriptions,
    updateFilters,
    goToPage,
  }
})
