export interface CommissionItem {
  id: number
  tienda_id: number
  tienda_nombre: string
  documento: string
  razon_social: string
  periodo: string
  montoventa: number
  porcentaje: number
  porcentaje_display: string
  comision: number
  sw_pago: number
  fechapago: string | null
  banco: string | null
  comprobante: string
  pdf_url: string | null
}

export interface CommissionSummary {
  total_comisiones: number
  total_pagado: number
  total_pendiente: number
  count: number
}

export interface InvoiceItem {
  uid: string
  origen: string
  serie: string
  comprobante: string
  tipo: string
  documento: string
  razon_social: string
  fecha_emision: string
  monto: number
  concepto: string
  pdf_url: string | null
}

export interface InvoiceSummary {
  total_monto: number
  count: number
}

export interface InvoiceFilters {
  origen: string
  period: string
  search: string
  page: number
  per_page: number
}

export interface PlanSaleItem {
  id: number
  tienda_id: number | null
  tienda_nombre: string
  plan: string
  detalle: string
  precio: number
  fecha_pago: string | null
  fecha_inicio: string | null
  fecha_final: string | null
  referencia: string
  documento: string
  razon_social: string
  tipo_cargo: string
  tipo_documento: string
  sw_facturado: number
  comprobante: string
  pdf_url: string | null
}

export interface PlanSaleSummary {
  total_ventas: number
  total_facturado: number
  total_pendiente: number
  count: number
}

export interface PlanSaleFilters {
  invoiced: string
  period: string
  plan: string
  search: string
  page: number
  per_page: number
}

export interface BillingFilters {
  status: string
  period: string
  search: string
  page: number
  per_page: number
}

export interface BillingMeta {
  current_page: number
  per_page: number
  total: number
  total_pages: number
}

// --- Comprobantes de plataforma (MiTienda emite con su propio RUC) ---
// Distinto de la facturacion que cada tienda emite a sus compradores.

export interface PlatformSerieState {
  serie: string
  correlative: number
  is_active: boolean
  next: number
}

export interface PlatformInvoiceStatus {
  environment: 'demo' | 'production'
  is_production: boolean
  ruc: string
  business_name: string
  /**
   * Cuatro contadores: cada concepto tiene numeracion propia porque
   * contabilidad concilia por serie. Suscripciones y comisiones no comparten
   * correlativos.
   */
  series: {
    suscripcion: {
      factura: PlatformSerieState | null
      boleta: PlatformSerieState | null
    }
    comision: {
      factura: PlatformSerieState | null
      boleta: PlatformSerieState | null
    }
    /** Formulario libre. En produccion comparte serie con el panel de Nubefact. */
    manual?: {
      factura: PlatformSerieState | null
      boleta: PlatformSerieState | null
    }
  }
  /** Lo que el emisor puede hacer hoy. Dolares, fecha y detraccion dependen del proxy de facturacion. */
  features?: {
    usd: boolean
    issue_date: boolean
    detraction: boolean
    detraction_percentage: number
    /** true = viaja el detalle (codigo y monto); false = solo la leyenda. */
    detraction_detailed: boolean
    credit_notes: boolean
  }
}

// --- Notas de credito ---

export interface CreditNotePreview {
  environment: 'demo' | 'production'
  is_production: boolean
  invoice_id: number
  comprobante: string
  document_type: number
  issue_date: string
  customer_name: string | null
  customer_document: string | null
  currency: string
  total_net: number
  total_tax: number
  total: number
  lines: { description: string; quantity: number; total: number }[]
  serie: string | null
  next_number: number | null
  can_emit: boolean
  blocked_reason: string | null
  /** Motivos que acreditan el comprobante completo. */
  types: { id: number; name: string }[]
}

export interface CreditNoteResult {
  success: boolean
  message?: string
  comprobante?: string
  persisted: boolean
  environment: 'demo' | 'production'
  pdf_url?: string | null
}

// --- Emision manual ---

export interface ManualInvoiceClient {
  type: 'store' | 'external'
  id: number
  document_number: string
  name: string
  address: string
  email: string
  /** "Tienda: X" o "Cliente externo". */
  hint: string
  /** Con RUC puede recibir factura; con DNI, solo boleta. */
  can_invoice: boolean
}

export interface ManualInvoiceLineInput {
  code: string
  description: string
  quantity: number
  unit_price: number
  /** dimension_id -> value_id. */
  tags: Record<number, number | null>
}

export interface ManualInvoiceInput {
  document_type: 1 | 2
  client: { type: 'store' | 'external'; id: number }
  prices_include_tax: boolean
  lines: ManualInvoiceLineInput[]
  observations: string
  credit_due_date: string | null
  currency: 'PEN' | 'USD'
  /** Obligatorio en dolares. */
  exchange_rate: number | null
  /** null = hoy. */
  issue_date: string | null
  detraction: { enabled: boolean; percentage: number }
}

export interface ManualInvoicePreview {
  environment: 'demo' | 'production'
  is_production: boolean
  document_type: number
  serie: string | null
  /** Orientativo: el definitivo sale al emitir. */
  next_number: number | null
  can_emit: boolean
  blocked_reason: string | null
  client: ManualInvoiceClient
  currency: string
  exchange_rate: number | null
  issue_date: string
  total_net: number
  total_tax: number
  total: number
  credit_due_date: string | null
  /** `amount` siempre en soles. No cambia el total del comprobante. */
  detraction: { percentage: number; amount: number; detailed: boolean } | null
}

export interface ManualInvoiceResult {
  success: boolean
  message?: string
  comprobante?: string
  /** false en modo pruebas: el comprobante no queda en el libro. */
  persisted: boolean
  environment: 'demo' | 'production'
  pdf_url?: string | null
}

export interface PlatformInvoicePreview {
  tiendaplan_id: number
  can_emit: boolean
  blocking_reason: string | null
  environment: 'demo' | 'production'
  document_type: 1 | 2
  document_type_name: string
  serie: string | null
  serie_active: boolean
  next_correlative: number | null
  client: {
    business_name: string
    document_number: string
    address: string
    email: string
  }
  currency: string
  total_with_tax: number
  /** 'Crédito' si el cobro está pendiente: una cuota que vence en credit_due_date */
  payment_condition: 'Contado' | 'Crédito'
  credit_due_date: string | null
}

export interface PlatformInvoiceResult {
  success: boolean
  message?: string
  serie?: string
  correlative?: number
  comprobante?: string
  /** false en entorno demo: se emitio pero la suscripcion NO quedo marcada. */
  persisted: boolean
  environment: 'demo' | 'production'
}

export interface PlatformBatchItemResult {
  tiendaplan_id: number
  status: 'emitted' | 'failed' | 'skipped'
  message?: string
  comprobante?: string
  persisted?: boolean
  email_sent?: boolean
  email_error?: string | null
}

export interface PlatformBatchResult {
  results: PlatformBatchItemResult[]
  emitted: number
  failed: number
  skipped: number
  /** Quedaron sin procesar porque se agoto el presupuesto de tiempo del request. */
  pending: number
}

// --- Cierre de comisiones ---
// A diferencia de las suscripciones, la fila de `tiendascomisiones` NO existe
// hasta que se emite: el periodo se calcula al vuelo. Por eso una comision se
// identifica por tienda + periodo, y solo despues de emitida tiene un id.

export interface CommissionPeriodRow {
  tienda_id: number
  tienda: string
  plan: string | null
  /** Monto de ventas del periodo: la base sobre la que se calcula la comision. */
  base: number
  ventas: number
  rate: number
  commission: number
  commission_with_tax: number
  can_emit: boolean
  blocking_reason: string | null
  /** No se le factura comision, cualquiera sea su plan. */
  exonerated: boolean
  exoneration_reason: string | null
  /** La tasa viene de un acuerdo propio, no del plan. */
  rate_is_custom: boolean
  /** Serie-numero, si ya se emitio (por este panel o por el legacy). */
  comprobante: string | null
  tiendacomision_id: number | null
}

export interface CommissionPeriodResponse {
  period: string
  environment: 'demo' | 'production'
  rows: CommissionPeriodRow[]
  pendientes: number
  total_a_facturar: number
}

export interface CommissionInvoicePreview {
  tienda_id: number
  tienda?: string
  period: string
  can_emit: boolean
  blocking_reason: string | null
  environment?: 'demo' | 'production'
  document_type?: 1 | 2
  document_type_name?: string
  serie?: string | null
  serie_active?: boolean
  next_correlative?: number | null
  client?: {
    business_name: string
    document_number: string
    address: string
    email: string
  }
  base?: number
  rate?: number
  currency?: string
  total_with_tax?: number
}

export interface CommissionBatchItemResult {
  tienda_id: number
  status: 'emitted' | 'failed' | 'skipped'
  message?: string
  comprobante?: string
  persisted?: boolean
  email_sent?: boolean
  email_error?: string | null
}

export interface CommissionBatchResult {
  results: CommissionBatchItemResult[]
  emitted: number
  failed: number
  skipped: number
  pending: number
}
