export interface SubscriptionMovementKPIs {
  activas_inicio: number
  activas_cierre: number
  ganadas: number
  perdidas: number
  variacion: number
}

export type GainedStoreType = 'nueva' | 'conversion' | 'reactivacion'

export interface GainedStore {
  tienda_id: number
  nombre: string
  url: string
  plan: string
  precio: number
  fecha_inicio: string
  fecha_fin: string
  tipo: GainedStoreType
}

export interface LostStore {
  tienda_id: number
  nombre: string
  url: string
  plan: string
  precio: number
  fecha_fin: string
  antiguedad: number | null
  ltv: number
  pagos: number
}

export interface SubscriptionMovementData {
  month: string
  fecha_inicio: string
  fecha_fin: string
  kpis: SubscriptionMovementKPIs
  ganadas: GainedStore[]
  perdidas: LostStore[]
}
