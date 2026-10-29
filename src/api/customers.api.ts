import api from './axios'

/** Una tienda del cliente, con su plan vigente. */
export interface CustomerStore {
  tienda_id: number
  name: string
  slug: string
  domain: string | null
  contact: string | null
  contact_email: string | null
  contact_phone: string | null
  plan: string | null
  price: number | null
  trial: boolean
  expires_at: string | null
  active: boolean
  /** Se le factura con este documento en su última renovación. */
  is_current?: boolean
  /** Vínculo puesto a mano (el armado automático lo respeta). */
  manual?: boolean
  first_seen?: string | null
  last_seen?: string | null
}

/** Quien paga: el documento al que se le factura. */
export interface PlatformCustomer {
  id: number
  document: string
  document_type: 'RUC' | 'DNI' | 'OTRO'
  name: string
  email: string | null
  phone: string | null
  first_seen: string | null
  last_seen: string | null
  invoice_count: number
  billed: number
  store_count: number
  address: string | null
  notes: string | null
  /** Última consulta a SUNAT (RUC) o RENIEC (DNI). */
  sunat: { status: string | null; condition: string | null; name: string | null; checked_at: string } | null
  /** Editado a mano: el armado automático ya no pisa nombre, correo ni teléfono. */
  edited_at: string | null
  stores: CustomerStore[]
}

export interface CustomerInvoice {
  id: number
  number: string
  document_type: number
  issue_date: string
  currency: string
  total: number
  voided: boolean
  payment_status: number | null
  tienda_id: number | null
  concept: string | null
}

export interface CustomerDetail extends PlatformCustomer {
  invoices: CustomerInvoice[]
  totals: { billed: number; open: number; pending_count: number; voided: number }
}

export async function searchCustomers(q: string) {
  const res = await api.get<{ data: { customers: PlatformCustomer[]; stores_without_customer: CustomerStore[] } }>('/superadmin/customers', { params: { q } })
  return res.data.data
}

export async function getCustomer(id: number) {
  const res = await api.get<{ data: CustomerDetail }>(`/superadmin/customers/${id}`)
  return res.data.data
}

export interface CustomerInput {
  name: string
  address: string
  email: string
  phone: string
  notes: string
}

export interface DocumentLookup {
  status: 'found' | 'not_found' | 'unavailable' | 'invalid'
  name: string
  address: string
  estado: string
  condicion: string
  message: string | null
}

export async function createCustomer(document: string) {
  const res = await api.post<{ data: CustomerDetail }>('/superadmin/customers', { document })
  return res.data.data
}

export async function updateCustomer(id: number, input: CustomerInput) {
  const res = await api.put<{ data: CustomerDetail }>(`/superadmin/customers/${id}`, input)
  return res.data.data
}

export async function verifyCustomer(id: number, apply: boolean) {
  const res = await api.post<{ data: { customer: CustomerDetail; lookup: DocumentLookup } }>(`/superadmin/customers/${id}/verify`, { apply })
  return res.data.data
}

export async function assignCustomerStore(id: number, tiendaId: number, current: boolean) {
  const res = await api.post<{ data: CustomerDetail }>(`/superadmin/customers/${id}/stores`, { tienda_id: tiendaId, current })
  return res.data.data
}

export async function unassignCustomerStore(id: number, tiendaId: number) {
  const res = await api.delete<{ data: CustomerDetail }>(`/superadmin/customers/${id}/stores/${tiendaId}`)
  return res.data.data
}

export function customerErrorMessage(e: any, fallback: string): string {
  const data = e?.response?.data
  const messages = data?.messages
  if (messages && typeof messages === 'object') {
    const first = Object.values(messages)[0]
    if (typeof first === 'string') return first
  }
  return data?.message || fallback
}

/** Una línea del estado de cuenta: un cargo (comprobante) o un abono (cobro, nota de crédito, ajuste). */
export interface StatementRow {
  date: string
  document: string
  kind: 'factura' | 'boleta' | 'nota_credito' | 'cobro' | 'ajuste'
  description: string
  debit: number
  credit: number
  balance: number
}

/** Lo que el cliente tiene por cobrar al cierre, con su antigüedad. */
export interface StatementOpenItem {
  document: string
  issue_date: string
  due_date: string
  concept: string
  total: number
  balance: number
  days_overdue: number
}

export interface StatementCurrency {
  currency: 'PEN' | 'USD'
  opening: number
  debit: number
  credit: number
  closing: number
  rows: StatementRow[]
  open: StatementOpenItem[]
}

export interface CustomerStatement {
  customer: { id: number; name: string; document: string; document_type: string | null; address: string | null; email: string | null }
  from: string
  to: string
  currencies: StatementCurrency[]
}

/** Estado de cuenta del cliente entre dos fechas (AAAA-MM-DD), por moneda. */
export async function getCustomerStatement(id: number, from: string, to: string) {
  const res = await api.get<{ data: CustomerStatement }>(`/superadmin/customers/${id}/statement`, { params: { from, to } })
  return res.data.data
}
