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
  id: number
  comprobante: string
  tipo: string
  documento: string
  razon_social: string
  fecha_emision: string
  monto: number
  sw_pago: number
  fechapago: string | null
  banco: string | null
  pdf_url: string | null
}

export interface InvoiceSummary {
  total_facturado: number
  total_pagado: number
  total_pendiente: number
  count: number
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
