import api from './axios'
import type {
  CommissionItem, CommissionSummary,
  InvoiceItem, InvoiceSummary,
  BillingFilters, BillingMeta
} from '@/types/billing.types'

interface CommissionsResponse {
  success: boolean
  data: CommissionItem[]
  summary: CommissionSummary
  meta: BillingMeta
}

interface InvoicesResponse {
  success: boolean
  data: InvoiceItem[]
  summary: InvoiceSummary
  meta: BillingMeta
}

export async function getCommissions(filters: Partial<BillingFilters> = {}) {
  const params: Record<string, string | number> = {}
  if (filters.status && filters.status !== 'all') params.status = filters.status
  if (filters.period) params.period = filters.period
  if (filters.search) params.search = filters.search
  if (filters.page) params.page = filters.page
  if (filters.per_page) params.per_page = filters.per_page

  const res = await api.get<CommissionsResponse>(
    '/superadmin/dashboard/commissions',
    { params }
  )
  return res.data
}

export async function getInvoices(filters: Partial<BillingFilters> = {}) {
  const params: Record<string, string | number> = {}
  if (filters.status && filters.status !== 'all') params.status = filters.status
  if (filters.search) params.search = filters.search
  if (filters.page) params.page = filters.page
  if (filters.per_page) params.per_page = filters.per_page

  const res = await api.get<InvoicesResponse>(
    '/superadmin/dashboard/invoices',
    { params }
  )
  return res.data
}
