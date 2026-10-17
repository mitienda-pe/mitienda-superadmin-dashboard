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
