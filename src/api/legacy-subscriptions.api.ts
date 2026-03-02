import api from './axios'
import type {
  LegacySubscriptionItem,
  LegacyFilters,
  LegacyMeta,
} from '@/types/legacy-subscriptions.types'

interface LegacySubscriptionsResponse {
  error: number
  data: LegacySubscriptionItem[]
  meta: LegacyMeta
}

export async function getLegacySubscriptions(
  filters: Partial<LegacyFilters> = {}
) {
  const params: Record<string, string | number> = {}
  if (filters.page) params.page = filters.page
  if (filters.per_page) params.limit = filters.per_page
  if (filters.status && filters.status !== 'all') params.status = filters.status
  if (filters.search) params.search = filters.search
  if (filters.plan && filters.plan !== 'all') params.plan = filters.plan

  const res = await api.get<LegacySubscriptionsResponse>(
    '/superadmin/billing/legacy-subscriptions',
    { params }
  )
  return res.data
}
