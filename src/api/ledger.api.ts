import api from './axios'
import type {
  LedgerTagDimension, LedgerTagValue, LedgerItemFilters, LedgerItemsResponse, LedgerConcept, LedgerReport,
  LedgerInvoice, LedgerInvoiceFilters, ReceivablesSummary, InvoicePaymentInput,
  InvoiceInstallments, InvoiceInstallmentInput
} from '@/types/ledger.types'

const BASE = '/superadmin/platform-ledger'

export async function getLedgerDimensions() {
  const res = await api.get<{ data: LedgerTagDimension[] }>(`${BASE}/dimensions`)
  return res.data.data
}

export async function createLedgerDimension(payload: { name: string; description?: string; is_required?: boolean }) {
  const res = await api.post<{ data: LedgerTagDimension }>(`${BASE}/dimensions`, payload)
  return res.data.data
}

export async function updateLedgerDimension(
  id: number,
  payload: Partial<Pick<LedgerTagDimension, 'name' | 'description' | 'is_required' | 'is_active' | 'sort_order'>>
) {
  const res = await api.put<{ data: LedgerTagDimension }>(`${BASE}/dimensions/${id}`, payload)
  return res.data.data
}

export async function createLedgerValue(dimensionId: number, name: string, recurrence?: string | null) {
  const res = await api.post<{ data: LedgerTagValue }>(`${BASE}/dimensions/${dimensionId}/values`, { name, recurrence })
  return res.data.data
}

export async function updateLedgerValue(
  id: number,
  payload: Partial<Pick<LedgerTagValue, 'name' | 'recurrence' | 'is_active' | 'sort_order'>>
) {
  const res = await api.put<{ data: LedgerTagValue }>(`${BASE}/values/${id}`, payload)
  return res.data.data
}

/** Responde 409 si alguna linea usa el valor: en ese caso se desactiva. */
export async function deleteLedgerValue(id: number) {
  await api.delete(`${BASE}/values/${id}`)
}

export async function getLedgerItems(filters: Partial<LedgerItemFilters> = {}) {
  const params: Record<string, string | number> = {}
  if (filters.pending) params.pending = 1
  if (filters.period) params.period = filters.period
  if (filters.origin && filters.origin !== 'all') params.origin = filters.origin
  if (filters.value_id) params.value_id = filters.value_id
  if (filters.code !== null && filters.code !== undefined) params.code = filters.code
  if (filters.search) params.search = filters.search
  if (filters.page) params.page = filters.page
  if (filters.per_page) params.per_page = filters.per_page

  const res = await api.get<LedgerItemsResponse>(`${BASE}/items`, { params })
  return res.data
}

/**
 * `tags` es `dimension_id -> value_id`. Un `null` quita la etiqueta de esa
 * dimension; las dimensiones que no van en el objeto no se tocan.
 */
export async function assignLedgerTags(itemIds: number[], tags: Record<number, number | null>) {
  const res = await api.put<{ data: { affected: number } }>(`${BASE}/items/tags`, { item_ids: itemIds, tags })
  return res.data.data.affected
}

export async function getLedgerConcepts(filters: { pending?: boolean; search?: string } = {}) {
  const params: Record<string, string | number> = {}
  if (filters.pending) params.pending = 1
  if (filters.search) params.search = filters.search

  const res = await api.get<{ data: LedgerConcept[] }>(`${BASE}/concepts`, { params })
  return res.data.data
}

/**
 * Etiqueta todas las lineas de un codigo. Sin `overwrite` solo completa las que
 * no tienen esa dimension, asi las excepciones puestas a mano se conservan.
 */
export async function assignLedgerConceptTags(
  code: string,
  tags: Record<number, number | null>,
  overwrite = false
) {
  const res = await api.put<{ data: { affected: number } }>(`${BASE}/concepts/tags`, { code, tags, overwrite })
  return res.data.data.affected
}

/**
 * Ingresos facturados sin IGV, en soles, por fecha de emision. `valueIds`
 * filtra: la linea debe tener todos esos valores.
 */
export async function getLedgerReport(query: {
  from: string
  to: string
  group_by: string
  granularity: 'month' | 'year'
  valueIds?: number[]
}) {
  const params: Record<string, string> = {
    from: query.from,
    to: query.to,
    group_by: query.group_by,
    granularity: query.granularity
  }
  if (query.valueIds?.length) params.value_ids = query.valueIds.join(',')

  const res = await api.get<{ data: LedgerReport }>(`${BASE}/report`, { params })
  return res.data.data
}

/**
 * Etiqueta TODAS las lineas de un filtro, no solo una pagina. `expectedTotal` es
 * el total que mostraba el listado: si ya no coincide, el API responde 409 y no
 * toca nada. Sin `overwrite` solo completa las que no tienen esa dimension.
 */
export async function assignLedgerTagsByFilter(
  filters: Partial<LedgerItemFilters>,
  tags: Record<number, number | null>,
  overwrite: boolean,
  expectedTotal: number
) {
  const res = await api.put<{ data: { matched: number; affected: number } }>(`${BASE}/items/tags-by-filter`, {
    filters: {
      pending: !!filters.pending,
      period: filters.period || null,
      origin: filters.origin && filters.origin !== 'all' ? filters.origin : null,
      value_id: filters.value_id || null,
      code: filters.code ?? null,
      search: filters.search || null
    },
    tags,
    overwrite,
    expected_total: expectedTotal
  })
  return res.data.data
}

/** Los errores de validacion de CI4 llegan en `messages.error`, no en `message`. */
// --- Cobro de comprobantes ---

interface LedgerInvoicesResponse {
  data: LedgerInvoice[]
  summary: ReceivablesSummary
  meta: { current_page: number; per_page: number; total: number; total_pages: number }
}

export async function getLedgerInvoices(filters: LedgerInvoiceFilters) {
  const params: Record<string, string | number> = { payment: filters.payment, page: filters.page }
  if (filters.period) params.period = filters.period
  if (filters.origin) params.origin = filters.origin
  if (filters.search) params.search = filters.search

  const res = await api.get<LedgerInvoicesResponse>(`${BASE}/invoices`, { params })
  return res.data
}

/** Si el comprobante es de un plan, el API escribe el cobro también en el plan. */
export async function registerInvoicePayment(payload: InvoicePaymentInput) {
  const res = await api.put<{
    message: string
    data: { updated: number; skipped: { id: number; reason: string }[] }
  }>(`${BASE}/invoices/payment`, payload)
  return res.data
}

// --- Abonos: cobro por partes ---

export async function getInvoiceInstallments(invoiceId: number) {
  const res = await api.get<{ data: InvoiceInstallments }>(`${BASE}/invoices/${invoiceId}/payments`)
  return res.data.data
}

export async function addInvoiceInstallment(invoiceId: number, payload: InvoiceInstallmentInput) {
  const res = await api.post<{ message: string; data: InvoiceInstallments }>(
    `${BASE}/invoices/${invoiceId}/payments`,
    payload
  )
  return res.data
}

export async function deleteInvoiceInstallment(paymentId: number) {
  const res = await api.delete<{ message: string; data: InvoiceInstallments }>(`${BASE}/invoice-payments/${paymentId}`)
  return res.data
}

export function ledgerErrorMessage(e: any): string {
  return e?.response?.data?.messages?.error || e?.response?.data?.message || e?.message || 'Error inesperado'
}

/** Una fila del resultado de comparar con SUNAT. */
export interface SunatAuditRow {
  number: string
  type: number
  issue_date: string
  customer_name: string
  currency: string
  sunat_total?: number
  ledger_total?: number
  ledger_status?: number
  sunat_status?: number
}

export interface SunatImportResult {
  executed: boolean
  period: { from: string; to: string }
  total: number
  matched: number
  /** En SUNAT y no en el libro: se importan. */
  missing: SunatAuditRow[]
  amount_diff: SunatAuditRow[]
  status_diff: SunatAuditRow[]
  /** En el libro y no en SUNAT. */
  extra: SunatAuditRow[]
  imported: number
}

/** El CSV del registro de ventas del SIRE o el XML de un comprobante emitido en la web de SUNAT. */
export async function importFromSunat(file: File, execute: boolean) {
  const form = new FormData()
  form.append('file', file)
  form.append('execute', execute ? '1' : '0')
  const res = await api.post<{ message: string; data: SunatImportResult }>('/superadmin/platform-ledger/import-sunat', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}
