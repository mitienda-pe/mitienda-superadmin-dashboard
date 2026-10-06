// Libro de comprobantes de plataforma: dimensiones de etiquetado y lineas.

export interface LedgerTagValue {
  id: number
  dimension_id: number
  slug: string
  name: string
  /** Solo en la dimension `fuente`: recurrente | variable | extraordinario. */
  recurrence: string | null
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
  /** Codigo de producto; cadena vacia = lineas sin codigo. null = no filtrar. */
  code: string | null
  search: string
  page: number
  per_page: number
}

export interface LedgerItemsResponse {
  data: LedgerItem[]
  summary: { pending_total: number }
  meta: { current_page: number; per_page: number; total: number; total_pages: number }
}

export interface LedgerConceptTagUsage {
  value_id: number
  value_name: string
  lines: number
}

/** Lineas agrupadas por codigo de producto. `code` vacio = lineas sin codigo. */
export interface LedgerConcept {
  code: string
  lines: number
  pending_lines: number
  customers: number
  first_date: string
  last_date: string
  /** Sin IGV, en soles, solo vigentes y con las notas de credito restando. */
  net_pen: number
  samples: string[]
  /** dimension_id -> valores en uso, del mas frecuente al menos. */
  tags: Record<number, LedgerConceptTagUsage[]>
}

export interface LedgerReportGroup {
  /** Slug del valor, origen o documento del cliente. `untagged` = sin etiqueta en esa dimension. */
  key: string
  name: string
  total: number
  lines: number
  /** periodo -> importe sin IGV en soles. */
  values: Record<string, number>
}

export interface LedgerReport {
  from: string
  to: string
  granularity: 'month' | 'year'
  group_by: string
  periods: string[]
  groups: LedgerReportGroup[]
  totals: Record<string, number>
  summary: {
    /** Facturado menos notas de credito. */
    net: number
    invoiced: number
    credit_notes: number
    invoices: number
    credit_note_count: number
    customers: number
    untagged: number
  }
}
