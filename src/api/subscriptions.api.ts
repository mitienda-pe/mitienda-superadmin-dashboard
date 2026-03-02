import api from './axios'
import type {
  SubscriptionItem,
  SubscriptionDetail,
  SubscriptionFilters,
  SubscriptionMeta,
  ChargeItem,
  RecordPaymentData,
} from '@/types/subscriptions.types'

interface SubscriptionsListResponse {
  success: boolean
  data: SubscriptionItem[]
  meta: SubscriptionMeta
}

interface SubscriptionDetailResponse {
  success: boolean
  data: SubscriptionDetail
}

interface ChargesResponse {
  success: boolean
  data: ChargeItem[]
}

interface ActionResponse {
  success: boolean
  message: string
  data?: Record<string, unknown>
}

export async function getSubscriptions(
  filters: Partial<SubscriptionFilters> = {}
) {
  const params: Record<string, string | number> = {}
  if (filters.page) params.page = filters.page
  if (filters.per_page) params.limit = filters.per_page
  if (filters.status && filters.status !== 'all') params.status = filters.status
  if (filters.payment_type && filters.payment_type !== 'all')
    params.payment_type = filters.payment_type
  if (filters.search) params.search = filters.search

  const res = await api.get<SubscriptionsListResponse>(
    '/superadmin/billing/subscriptions',
    { params }
  )
  return res.data
}

export async function getSubscriptionDetail(id: number) {
  const res = await api.get<SubscriptionDetailResponse>(
    `/superadmin/billing/subscriptions/${id}`
  )
  return res.data
}

export async function getFailedCharges(days = 7, limit = 50) {
  const res = await api.get<ChargesResponse>('/superadmin/billing/charges/failed', {
    params: { days, limit },
  })
  return res.data
}

export async function getManualPending(limit = 50) {
  const res = await api.get<SubscriptionsListResponse>(
    '/superadmin/billing/subscriptions/manual-pending',
    { params: { limit } }
  )
  return res.data
}

export async function activateSubscription(id: number) {
  const res = await api.post<ActionResponse>(
    `/superadmin/billing/subscriptions/${id}/activate`
  )
  return res.data
}

export async function suspendSubscription(id: number) {
  const res = await api.post<ActionResponse>(
    `/superadmin/billing/subscriptions/${id}/suspend`
  )
  return res.data
}

export async function recordPayment(id: number, data: RecordPaymentData) {
  const res = await api.post<ActionResponse>(
    `/superadmin/billing/subscriptions/${id}/record-payment`,
    data
  )
  return res.data
}
