import api from './axios'
import type { StoreSalesReport, StoreSalesFilters } from '@/types/store-sales.types'

export async function getStoreSalesReport(filters: StoreSalesFilters) {
  const params: Record<string, string> = {
    start: filters.start,
    end: filters.end
  }
  if (filters.plan) params.plan = filters.plan
  if (filters.status) params.status = filters.status
  if (filters.flag) params.flag = filters.flag

  const res = await api.get<{ success: boolean; message?: string; data: StoreSalesReport }>(
    '/superadmin/dashboard/sales-summary',
    { params }
  )
  return res.data
}
