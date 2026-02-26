import api from './axios'
import type {
  CommissionItem, CommissionSummary,
  InvoiceItem, InvoiceSummary, InvoiceFilters,
  PlanSaleItem, PlanSaleSummary, PlanSaleFilters,
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

interface PlanSalesResponse {
  success: boolean
  data: PlanSaleItem[]
  summary: PlanSaleSummary
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

export async function getInvoices(filters: Partial<InvoiceFilters> = {}) {
  const params: Record<string, string | number> = {}
  if (filters.origen && filters.origen !== 'all') params.origen = filters.origen
  if (filters.period) params.period = filters.period
  if (filters.search) params.search = filters.search
  if (filters.page) params.page = filters.page
  if (filters.per_page) params.per_page = filters.per_page

  const res = await api.get<InvoicesResponse>(
    '/superadmin/dashboard/invoices',
    { params }
  )
  return res.data
}

export async function getPlanSales(filters: Partial<PlanSaleFilters> = {}) {
  const params: Record<string, string | number> = {}
  if (filters.invoiced && filters.invoiced !== 'all') params.invoiced = filters.invoiced
  if (filters.period) params.period = filters.period
  if (filters.plan) params.plan = filters.plan
  if (filters.search) params.search = filters.search
  if (filters.page) params.page = filters.page
  if (filters.per_page) params.per_page = filters.per_page

  const res = await api.get<PlanSalesResponse>(
    '/superadmin/dashboard/plan-sales',
    { params }
  )
  return res.data
}
