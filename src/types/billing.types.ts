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
