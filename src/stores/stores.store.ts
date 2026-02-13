import { defineStore } from 'pinia'
import { ref } from 'vue'
import type {
  StoreListItem, StoreListMeta, StoreListFilters,
  StoreDetail, DailySales, StoreOrder,
  SubscriptionHistory, TopProduct
} from '@/types/store.types'
import {
  getStoresList, getStoreDetail, getStoreSales,
  getStoreOrders, getSubscriptionHistory, getTopProducts,
  updateStoreFlag as apiUpdateStoreFlag,
  updateStoreConfig as apiUpdateStoreConfig,
  updateStorePlanConfig as apiUpdateStorePlanConfig
} from '@/api/stores.api'
import type { StoreFlag, StoreConfigUpdate, StorePlanConfigUpdate } from '@/types/store.types'

export const useStoresStore = defineStore('stores', () => {
  // List state
  const stores = ref<StoreListItem[]>([])
  const meta = ref<StoreListMeta>({ current_page: 1, per_page: 20, total: 0, total_pages: 0 })
  const filters = ref<StoreListFilters>({
    search: '',
    plan: '',
    classification: '',
    status: 'vigente',
    flag: '',
    sort: 'current_month_sales',
    order: 'DESC',
    page: 1,
    per_page: 20
  })
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Detail state
  const currentStore = ref<StoreDetail | null>(null)
  const dailySales = ref<DailySales[]>([])
  const orders = ref<StoreOrder[]>([])
  const subscriptionHistory = ref<SubscriptionHistory[]>([])
  const topProducts = ref<TopProduct[]>([])
  const isDetailLoading = ref(false)
  const detailError = ref<string | null>(null)
  const isSavingConfig = ref(false)
  const configError = ref<string | null>(null)

  async function fetchStores() {
    isLoading.value = true
    error.value = null
    try {
      const res = await getStoresList(filters.value)
      stores.value = res.data
      if (res.meta) {
        meta.value = res.meta
      }
    } catch (e: any) {
      error.value = e.message || 'Error loading stores'
    } finally {
      isLoading.value = false
    }
  }

  function updateFilters(newFilters: Partial<StoreListFilters>) {
    Object.assign(filters.value, newFilters)
    if (newFilters.search !== undefined || newFilters.plan !== undefined || newFilters.classification !== undefined || newFilters.status !== undefined || newFilters.flag !== undefined) {
      filters.value.page = 1 // Reset page on filter change
    }
    fetchStores()
  }

  async function setStoreFlag(storeId: number, flag: StoreFlag) {
    await apiUpdateStoreFlag(storeId, flag)
    // Update local state
    const store = stores.value.find(s => s.id === storeId)
    if (store) store.flag = flag
  }

  async function saveStoreConfig(storeId: number, data: StoreConfigUpdate) {
    isSavingConfig.value = true
    configError.value = null
    try {
      await apiUpdateStoreConfig(storeId, data)
      if (currentStore.value?.config) {
        Object.assign(currentStore.value.config, data)
      }
      if (data.flag !== undefined) {
        const store = stores.value.find(s => s.id === storeId)
        if (store) store.flag = data.flag
      }
    } catch (e: any) {
      configError.value = e.message || 'Error updating config'
      throw e
    } finally {
      isSavingConfig.value = false
    }
  }

  async function saveStorePlanConfig(storeId: number, data: StorePlanConfigUpdate) {
    isSavingConfig.value = true
    configError.value = null
    try {
      await apiUpdateStorePlanConfig(storeId, data)
      if (currentStore.value?.plan) {
        if (data.expires_at !== undefined) currentStore.value.plan.expires_at = data.expires_at
        if (data.price !== undefined) currentStore.value.plan.price = data.price
        if (data.max_items !== undefined) currentStore.value.plan.max_items = data.max_items
        if (data.max_pages !== undefined) currentStore.value.plan.max_pages = data.max_pages
        if (data.payment_note !== undefined) currentStore.value.plan.payment_note = data.payment_note
      }
    } catch (e: any) {
      configError.value = e.message || 'Error updating plan config'
      throw e
    } finally {
      isSavingConfig.value = false
    }
  }

  function goToPage(page: number) {
    filters.value.page = page
    fetchStores()
  }

  async function fetchStoreDetail(storeId: number) {
    isDetailLoading.value = true
    detailError.value = null
    currentStore.value = null
    dailySales.value = []
    orders.value = []
    subscriptionHistory.value = []
    topProducts.value = []

    try {
      // Fetch detail + all tabs in parallel
      const [detailRes, salesRes, ordersRes, subsRes, productsRes] = await Promise.all([
        getStoreDetail(storeId),
        getStoreSales(storeId),
        getStoreOrders(storeId),
        getSubscriptionHistory(storeId),
        getTopProducts(storeId)
      ])

      currentStore.value = detailRes.data
      dailySales.value = salesRes.data
      orders.value = ordersRes.data
      subscriptionHistory.value = subsRes.data
      topProducts.value = productsRes.data
    } catch (e: any) {
      detailError.value = e.message || 'Error loading store detail'
    } finally {
      isDetailLoading.value = false
    }
  }

  return {
    stores, meta, filters, isLoading, error,
    currentStore, dailySales, orders, subscriptionHistory, topProducts,
    isDetailLoading, detailError,
    isSavingConfig, configError,
    fetchStores, updateFilters, goToPage, fetchStoreDetail, setStoreFlag,
    saveStoreConfig, saveStorePlanConfig
  }
})
