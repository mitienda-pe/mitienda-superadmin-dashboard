import api from './axios'
import type {
  CommissionItem, CommissionSummary,
  InvoiceItem, InvoiceSummary, InvoiceFilters,
  PlanSaleItem, PlanSaleSummary, PlanSaleFilters,
  BillingFilters, BillingMeta,
  PlatformInvoiceStatus, PlatformInvoicePreview, PlatformInvoiceResult,
  PlatformBatchResult,
  CommissionPeriodResponse, CommissionInvoicePreview, CommissionBatchResult,
  ManualInvoiceClient, ManualInvoiceInput, ManualInvoicePreview, ManualInvoiceResult,
  CreditNotePreview, CreditNoteResult
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

// --- Comprobantes de plataforma ---

export async function getPlatformInvoiceStatus() {
  const res = await api.get<{ data: PlatformInvoiceStatus }>(
    '/superadmin/platform-invoices/status'
  )
  return res.data.data
}

export async function previewPlanSaleInvoice(tiendaPlanId: number) {
  const res = await api.get<{ data: PlatformInvoicePreview }>(
    `/superadmin/platform-invoices/plan-sales/${tiendaPlanId}/preview`
  )
  return res.data.data
}

export async function emitPlanSaleInvoice(tiendaPlanId: number) {
  const res = await api.post<{ message: string; data: PlatformInvoiceResult }>(
    `/superadmin/platform-invoices/plan-sales/${tiendaPlanId}/emit`
  )
  return res.data
}

export async function emitPlanSalesBatch(ids: number[], sendEmail = false) {
  const res = await api.post<{ message: string; data: PlatformBatchResult }>(
    '/superadmin/platform-invoices/plan-sales/emit-batch',
    { ids, send_email: sendEmail }
  )
  return res.data
}

export async function sendPlanSaleInvoiceEmail(tiendaPlanId: number, email?: string) {
  const res = await api.post<{ message: string }>(
    `/superadmin/platform-invoices/plan-sales/${tiendaPlanId}/send-email`,
    email ? { email } : {}
  )
  return res.data
}

// --- Comprobantes de comisiones ---

export async function getCommissionPeriod(period: string) {
  const res = await api.get<{ data: CommissionPeriodResponse }>(
    '/superadmin/platform-invoices/commissions',
    { params: { period } }
  )
  return res.data.data
}

export async function previewCommissionInvoice(tiendaId: number, period: string) {
  const res = await api.get<{ data: CommissionInvoicePreview }>(
    `/superadmin/platform-invoices/commissions/${tiendaId}/preview`,
    { params: { period } }
  )
  return res.data.data
}

export async function emitCommissionInvoice(tiendaId: number, period: string) {
  const res = await api.post<{ message: string; data: PlatformInvoiceResult }>(
    `/superadmin/platform-invoices/commissions/${tiendaId}/emit`,
    { period }
  )
  return res.data
}

export async function emitCommissionsBatch(
  tiendaIds: number[],
  period: string,
  sendEmail = false
) {
  const res = await api.post<{ message: string; data: CommissionBatchResult }>(
    '/superadmin/platform-invoices/commissions/emit-batch',
    { tienda_ids: tiendaIds, period, send_email: sendEmail }
  )
  return res.data
}

export async function sendCommissionInvoiceEmail(tiendacomisionId: number, email?: string) {
  const res = await api.post<{ message: string }>(
    `/superadmin/platform-invoices/commissions/${tiendacomisionId}/send-email`,
    email ? { email } : {}
  )
  return res.data
}

/**
 * Excepciones a la comision del plan. `exonerada` corta la emision; `tasa` es
 * una tasa propia en fraccion (0.015 = 1.5%). Ambas en falso/null borran la
 * excepcion y la tienda vuelve a la regla de su plan.
 */
export async function updateCommissionSettings(
  tiendaId: number,
  payload: { exonerada: boolean; tasa?: number | null; motivo?: string }
) {
  const res = await api.put<{ message: string }>(
    `/superadmin/platform-invoices/commissions/${tiendaId}/settings`,
    payload
  )
  return res.data
}

// --- Emision manual (formulario libre) ---

export async function searchManualInvoiceClients(search: string) {
  const res = await api.get<{ data: ManualInvoiceClient[] }>(
    '/superadmin/platform-invoices/manual/clients',
    { params: { search } }
  )
  return res.data.data
}

export async function createManualInvoiceClient(payload: {
  document_number: string
  name: string
  address?: string
  email?: string
}) {
  const res = await api.post<{ data: ManualInvoiceClient }>(
    '/superadmin/platform-invoices/manual/clients',
    payload
  )
  return res.data.data
}

/** Consulta un DNI o RUC para autocompletar el alta de un cliente. */
export async function lookupManualInvoiceDocument(number: string) {
  const res = await api.get<{ data: { status: string; data: Record<string, any> | null; message: string | null } }>(
    '/superadmin/platform-invoices/manual/lookup',
    { params: { number } }
  )
  return res.data.data
}

export async function previewManualInvoice(payload: ManualInvoiceInput) {
  const res = await api.post<{ data: ManualInvoicePreview }>(
    '/superadmin/platform-invoices/manual/preview',
    payload
  )
  return res.data.data
}

/** Irreversible: consume correlativo y llega a SUNAT. */
export async function emitManualInvoice(payload: ManualInvoiceInput) {
  const res = await api.post<{ message: string; data: ManualInvoiceResult }>(
    '/superadmin/platform-invoices/manual/emit',
    payload
  )
  return res.data
}

// --- Notas de credito ---

/** Que se acreditaria de un comprobante del libro, sin reservar numero. */
export async function previewCreditNote(invoiceId: number) {
  const res = await api.get<{ data: CreditNotePreview }>(
    `/superadmin/platform-invoices/credit-notes/${invoiceId}/preview`
  )
  return res.data.data
}

/** Acredita el comprobante por su total. Irreversible: llega a SUNAT. */
export async function emitCreditNote(invoiceId: number, type: number, reason: string) {
  const res = await api.post<{ message: string; data: CreditNoteResult }>(
    `/superadmin/platform-invoices/credit-notes/${invoiceId}/emit`,
    { type, reason }
  )
  return res.data
}
