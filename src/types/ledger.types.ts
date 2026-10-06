// Libro de comprobantes de plataforma: dimensiones de etiquetado y lineas.

export interface LedgerTagValue {
  id: number
  dimension_id: number
  slug: string
  name: string
  is_active: boolean
  sort_order: number
  /** Lineas que usan el valor. Con mas de cero no se puede borrar, solo desactivar. */
  items_count: number
}

export interface LedgerTagDimension {
  id: number
  slug: string
  name: string
  description: string | null
  /** Una linea sin esta dimension cuenta como "por etiquetar". */
  is_required: boolean
  is_active: boolean
  sort_order: number
  values: LedgerTagValue[]
}

export interface LedgerItemTag {
  dimension_id: number
  dimension_slug: string
  value_id: number
  value_slug: string
  value_name: string
  /** regla = la puso la sincronizacion; manual = la puso una persona. */
  source: 'regla' | 'manual'
}

export type LedgerOrigin = 'suscripcion' | 'comision' | 'otros' | 'manual' | 'importado'

export interface LedgerItem {
  id: number
  invoice_id: number
  position: number
  tienda_id: number | null
  description: string
  quantity: number
  unit_price: number
  net_amount: number
  tax_amount: number
  total: number
  document_type: number
  comprobante: string
  issue_date: string
  currency: string
  origin: LedgerOrigin
  customer_document: string | null
  customer_name: string | null
  pdf_url: string | null
  tags: LedgerItemTag[]
}

export interface LedgerItemFilters {
  pending: boolean
  period: string
  origin: LedgerOrigin | 'all'
  value_id: number | null
  search: string
  page: number
  per_page: number
}

export interface LedgerItemsResponse {
  data: LedgerItem[]
  summary: { pending_total: number }
  meta: { current_page: number; per_page: number; total: number; total_pages: number }
}
