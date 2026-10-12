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
  /** `total_net`: suma sin IGV, en soles, de TODAS las lineas del filtro (no solo la pagina). */
  summary: { pending_total: number; total_net: number }
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
  /** IGV por periodo: el total con IGV es `totals + tax_totals`. */
  tax_totals: Record<string, number>
  summary: {
    /** Facturado menos notas de credito, sin IGV. */
    net: number
    tax: number
    /** Neto con IGV. */
    gross: number
    invoiced: number
    credit_notes: number
    invoices: number
    credit_note_count: number
    customers: number
    untagged: number
  }
}

// --- Cobro de comprobantes ---

export type InvoicePaymentStatus = 'pendiente' | 'cobrado' | 'incobrable' | 'sin_cargo' | 'por_confirmar'

/** Filtro de cobro de la lista: los estados, más "open" (sin cobrar) y "vencido". */
export type InvoicePaymentFilter = 'all' | 'open' | 'pendiente' | 'por_confirmar' | 'vencido' | 'cobrado' | 'incobrable'

export interface LedgerInvoice {
  id: number
  /** 1 factura, 2 boleta, 3 nota de crédito. */
  document_type: number
  number: string
  serie: string
  issue_date: string
  due_date: string | null
  currency: 'PEN' | 'USD'
  total: number
  /** Notas de crédito vigentes sobre el comprobante. */
  credited: number
  /** Lo que falta cobrar; 0 si ya se cobró o no se cobra. */
  balance: number
  origin: string
  /** 1 emitido, 2 anulado, 3 no aceptado. */
  status: number
  tienda_id: number | null
  customer_document: string
  customer_name: string
  concept: string
  line_count: number
  pdf_url: string | null
  /** null = no aplica (anulado o nota de crédito). */
  payment_status: InvoicePaymentStatus | null
  /** supuesto = se dio por cobrado sin dato; plan = lo dice la venta del plan. */
  payment_source: 'supuesto' | 'plan' | 'comision' | 'manual' | null
  payment_date: string | null
  payment_method: string | null
  payment_reference: string | null
  paid_amount: number | null
  payment_note: string | null
  is_overdue: boolean
  days_since_issue: number | null
  plan_backed: boolean
}

export interface ReceivablesByCurrency {
  invoices: number
  invoiced: number
  pending_count: number
  pending: number
  unconfirmed_count: number
  unconfirmed: number
  overdue_count: number
  overdue: number
  paid_count: number
  paid: number
}

export interface ReceivablesSummary {
  by_currency: Partial<Record<'PEN' | 'USD', ReceivablesByCurrency>>
  debtors: { customer_document: string; customer_name: string; invoices: number; amount: number; oldest: string }[]
}

export interface LedgerInvoiceFilters {
  payment: InvoicePaymentFilter
  period: string
  origin: string
  search: string
  page: number
}

export interface InvoicePaymentInput {
  invoice_ids: number[]
  status: 'cobrado' | 'pendiente' | 'incobrable' | 'por_confirmar'
  date?: string
  method?: string
  reference?: string
  paid_amount?: number
  due_date?: string
  note?: string
}
