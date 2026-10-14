import api from './axios'

export interface Program {
  id: number
  code: string
  name: string
  parner_id: number | null
  enroll_until: string | null
  annual_discount_pct: number
  is_active: number
}

export interface ProgramStore {
  tienda_id: number
  name: string
  subdomain: string
  domain: string | null
  contact: string
  phone: string | null
  enrolled_at: string
  source: 'registro' | 'backoffice' | 'superadmin'
  /** Mes del programa en que está hoy; 0 si ya terminó. */
  month: number
  months_earned: number
  covered_until: string
  status: 'prueba' | 'vencida' | 'pagado'
  products: number
  signals: { products: boolean; payment: boolean; shipping: boolean; configured: boolean; domain: boolean }
  discount_used: boolean
}

export async function getPrograms() {
  const res = await api.get<{ success: boolean; data: Program[] }>('/superadmin/programs')
  return res.data
}

export async function getProgramStores(programId: number) {
  const res = await api.get<{ success: boolean; data: { program: Program; stores: ProgramStore[] } }>(
    `/superadmin/programs/${programId}/stores`
  )
  return res.data
}
