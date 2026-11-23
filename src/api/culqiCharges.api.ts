import api from './axios'

/** Una venta de plan reciente de la tienda, para elegir a cuál pertenece el cargo. */
export interface CulqiChargePlanRow {
  id: number
  plan: string
  price: number
  start: string
  end: string
  active: boolean
  invoice: string | null
  /** Cargo de Culqi que ya registra (chr_…), si tiene. */
  culqi_charge: string | null
  paid_via: string | null
}

/** Un cargo de suscripción de Culqi que el webhook no aplicó solo. */
export interface CulqiChargeReviewItem {
  event_id: string
  received_at: string
  charge_id: string | null
  charge_date: string
  amount: number | null
  currency: string
  subscription_id: string | null
  /** unmatched: sin tienda · already_covered: la tienda ya figuraba pagada · error/rejected. */
  status: 'unmatched' | 'already_covered' | 'error' | 'rejected'
  reason: string | null
  payer_email: string | null
  tienda: { id: number; name: string } | null
  plans: CulqiChargePlanRow[]
}

const BASE = '/superadmin/culqi-charges'

export async function getPendingCulqiCharges() {
  const res = await api.get<{ data: { items: CulqiChargeReviewItem[]; count: number } }>(`${BASE}/pending`)
  return res.data.data
}

export async function getCulqiChargeStorePlans(tiendaId: number) {
  const res = await api.get<{ data: { tienda: { id: number; name: string }; plans: CulqiChargePlanRow[] } }>(`${BASE}/stores/${tiendaId}/plans`)
  return res.data.data
}

/** El cargo era el cobro de una venta que ya existe. */
export async function linkCulqiCharge(eventId: string, tiendaplanId: number, tiendaId?: number) {
  const res = await api.post<{ message: string }>(`${BASE}/${eventId}/link`, { tiendaplan_id: tiendaplanId, tienda_id: tiendaId })
  return res.data
}

/** Faltaba la venta: registra la renovación con este cargo. */
export async function renewWithCulqiCharge(eventId: string, tiendaId?: number) {
  const res = await api.post<{ message: string }>(`${BASE}/${eventId}/renew`, { tienda_id: tiendaId })
  return res.data
}

export async function dismissCulqiCharge(eventId: string, note: string) {
  const res = await api.post<{ message: string }>(`${BASE}/${eventId}/dismiss`, { note })
  return res.data
}

export function culqiChargeErrorMessage(e: any): string {
  return e?.response?.data?.messages?.error || e?.response?.data?.message || e?.message || 'Error inesperado'
}
