import api from './axios'
import type {
  StoreListItem, StoreListMeta, StoreListFilters,
  StoreDetail, DailySales, StoreOrder,
  SubscriptionHistory, TopProduct, StoreFlag,
  StoreConfigUpdate, StorePlanConfigUpdate,
  AvailablePlan, CreateStorePayload, CreateStoreResult
} from '@/types/store.types'

export async function getStoresList(filters: Partial<StoreListFilters> = {}) {
  const params: Record<string, string | number> = {}
  if (filters.search) params.search = filters.search
  if (filters.plan) params.plan = filters.plan
  if (filters.classification) params.classification = filters.classification
  if (filters.status) params.status = filters.status
  if (filters.flag) params.flag = filters.flag
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

export async function updateStoreFlag(storeId: number, flag: StoreFlag) {
  const res = await api.put<{ success: boolean; message: string }>(
    `/superadmin/dashboard/stores/${storeId}/flag`,
    { flag }
  )
  return res.data
}

export async function updateStoreConfig(storeId: number, data: StoreConfigUpdate) {
  const res = await api.put<{ success: boolean; message: string }>(
    `/superadmin/dashboard/stores/${storeId}/config`,
    data
  )
  return res.data
}

export async function updateStorePlanConfig(storeId: number, data: StorePlanConfigUpdate) {
  const res = await api.put<{ success: boolean; message: string }>(
    `/superadmin/dashboard/stores/${storeId}/plan-config`,
    data
  )
  return res.data
}

export async function getAvailablePlans() {
  const res = await api.get<{ success: boolean; data: AvailablePlan[] }>(
    '/superadmin/dashboard/plans'
  )
  return res.data
}

export interface RenewStorePlanPayload {
  plandetalle_id: number
  price?: number
  payment_note?: string
}

export interface RenewStorePlanResult {
  tiendaplan_id: number
  plan_id: number
  plan_titulo: string
  tiendaplan_fechainicio: string
  tiendaplan_fechafinal: string
  tiendaplan_precio: number
}

/**
 * Renovación manual de plan (legacy): inserta una fila nueva en tiendasplanes
 * extendiendo desde el vencimiento vigente, preservando add-ons/módulos.
 */
export async function renewStorePlan(storeId: number, payload: RenewStorePlanPayload) {
  const res = await api.post<{ success: boolean; message: string; data: RenewStorePlanResult }>(
    `/superadmin/dashboard/stores/${storeId}/renew`,
    payload
  )
  return res.data
}

export async function createStore(payload: CreateStorePayload) {
  const res = await api.post<{ success: boolean; message: string; data: CreateStoreResult }>(
    '/superadmin/dashboard/stores',
    payload
  )
  return res.data
}

export type InvitationEstado = 'activado' | 'pendiente' | 'expirado' | 'sin_invitacion'

export interface InvitationStatus {
  usuario_id: number | null
  email: string | null
  estado: InvitationEstado
  token: { sent_at: string | null; expires_at: string | null; used_at: string | null } | null
  ultimo_ingreso: string | null
  email_delivery: {
    status: string // sent | failed | bounced | complained
    sent_at: number | null
    opened_at: number | null
    open_count: number
    template: string | null
  } | null
}

export async function getInvitationStatus(storeId: number) {
  const res = await api.get<{ success: boolean; data: InvitationStatus }>(
    `/superadmin/dashboard/stores/${storeId}/invitation-status`
  )
  return res.data
}

export async function resendStoreInvitation(storeId: number) {
  const res = await api.post<{ success: boolean; message: string; email_sent: boolean }>(
    `/superadmin/dashboard/stores/${storeId}/resend-invitation`,
    {}
  )
  return res.data
}
