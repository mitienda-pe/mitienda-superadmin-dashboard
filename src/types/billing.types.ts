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
  series: {
    factura: PlatformSerieState | null
    boleta: PlatformSerieState | null
  }
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
