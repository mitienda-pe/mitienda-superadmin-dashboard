import api from './axios'
import type { StoreSalesReport } from '@/types/store-sales.types'

export async function getStoreSalesReport(start: string, end: string) {
  const res = await api.get<{ success: boolean; message?: string; data: StoreSalesReport }>(
    '/superadmin/dashboard/sales-summary',
    { params: { start, end } }
  )
  return res.data
}
