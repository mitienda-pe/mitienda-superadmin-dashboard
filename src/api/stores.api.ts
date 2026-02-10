import api from './axios'
import type {
  StoreListItem, StoreListMeta, StoreListFilters,
  StoreDetail, DailySales, StoreOrder,
  SubscriptionHistory, TopProduct
} from '@/types/store.types'

export async function getStoresList(filters: Partial<StoreListFilters> = {}) {
  const params: Record<string, string | number> = {}
  if (filters.search) params.search = filters.search
  if (filters.plan) params.plan = filters.plan
  if (filters.classification) params.classification = filters.classification
  if (filters.sort) params.sort = filters.sort
  if (filters.order) params.order = filters.order
  if (filters.page) params.page = filters.page
  if (filters.per_page) params.per_page = filters.per_page

  const res = await api.get<{ success: boolean; data: StoreListItem[]; meta: StoreListMeta }>(
    '/superadmin/dashboard/stores',
    { params }
  )
  return res.data
}

export async function getStoreDetail(storeId: number) {
  const res = await api.get<{ success: boolean; data: StoreDetail }>(
    `/superadmin/dashboard/stores/${storeId}`
  )
  return res.data
}

export async function getStoreSales(storeId: number) {
  const res = await api.get<{ success: boolean; data: DailySales[] }>(
    `/superadmin/dashboard/stores/${storeId}/sales`
  )
  return res.data
}

export async function getStoreOrders(storeId: number) {
  const res = await api.get<{ success: boolean; data: StoreOrder[] }>(
    `/superadmin/dashboard/stores/${storeId}/orders`
  )
  return res.data
}

export async function getSubscriptionHistory(storeId: number) {
  const res = await api.get<{ success: boolean; data: SubscriptionHistory[] }>(
    `/superadmin/dashboard/stores/${storeId}/subscription-history`
  )
  return res.data
}

export async function getTopProducts(storeId: number) {
  const res = await api.get<{ success: boolean; data: TopProduct[] }>(
    `/superadmin/dashboard/stores/${storeId}/top-products`
  )
  return res.data
}
