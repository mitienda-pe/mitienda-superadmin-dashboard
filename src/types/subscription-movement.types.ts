export interface SubscriptionMovementKPIs {
  activas_inicio: number
  activas_cierre: number
  ganadas: number
  /** De las ganadas: primer pago de la tienda. Las únicas que son clientes nuevos. */
  nuevas: number
  /** De las ganadas: ya pagaban y renovaron con hasta 30 días de retraso. */
  renovaciones_tardias: number
  /** De las ganadas: ya pagaban y volvieron tras más de 30 días sin plan. */
  reactivadas: number
  perdidas: number
  /** De las perdidas: las que después volvieron a pagar. */
  perdidas_volvieron: number
  perdidas_definitivas: number
  variacion: number
  por_renovar: number
  renovadas: number
}

export type GainedStoreType = 'nueva' | 'conversion' | 'renovacion_tardia' | 'reactivacion'

export interface GainedStore {
  tienda_id: number
  nombre: string
  url: string
  plan: string
  precio: number
  frecuencia: 'mensual' | 'anual'
  fecha_inicio: string
  fecha_fin: string
  tipo: GainedStoreType
  es_nueva: boolean
  /** Vencimiento del plan pagado anterior; null si es su primer pago. */
  vencio_antes: string | null
  dias_inactiva: number | null
}

export interface LostStore {
  tienda_id: number
  nombre: string
  url: string
  plan: string
  precio: number
  fecha_fin: string
  frecuencia: 'mensual' | 'anual'
  antiguedad: number | null
  ltv: number
  pagos: number
  ultima_venta: string | null
  /** Fecha en que volvió a pagar; null si sigue perdida. */
  volvio: string | null
  dias_fuera: number | null
  activa_hoy: boolean
}

export interface SubscriptionMovementData {
  month: string
  fecha_inicio: string
  fecha_fin: string
  kpis: SubscriptionMovementKPIs
  ganadas: GainedStore[]
  perdidas: LostStore[]
}
