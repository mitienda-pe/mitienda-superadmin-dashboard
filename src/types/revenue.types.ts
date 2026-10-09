// Phase 3: Revenue Intelligence types

export interface MrrBreakdownMonth {
  month: string
  /** MRR de tiendas que pagan por primera vez. */
  new_mrr: number
  /** MRR de tiendas que ya habían pagado y volvieron. */
  reactivation_mrr?: number
  churned_mrr: number
  /** Tiendas activas en ambos cierres que ahora pagan más. */
  expansion_mrr: number
  /** Tiendas activas en ambos cierres que ahora pagan menos. */
  contraction_mrr?: number
  net_new_mrr: number
  total_mrr: number
}

export interface CohortData {
  month: string
  size: number
  retention: number[] // percentage retained at each month offset
}

export interface LtvByPlan {
  plan: string
  /** Tiendas activas hoy en el plan. */
  stores: number
  /** Clientes que alguna vez pagaron y terminaron en este plan. */
  customers?: number
  arpu: number
  avg_lifetime_months: number
  /** Proyección: ARPU de hoy por la vida promedio. */
  ltv: number
  /** Lo que pagó de verdad cada cliente en promedio, sin IGV. */
  avg_paid?: number
  mrr: number
}

export interface ChurnByPlanMonth {
  month: string
  large_start: number
  large_churned: number
  large_rate: number
  medium_start: number
  medium_churned: number
  medium_rate: number
  small_start: number
  small_churned: number
  small_rate: number
  micro_start: number
  micro_churned: number
  micro_rate: number
  other_start?: number
  other_churned?: number
  other_rate?: number
}

export interface GmvTopStore {
  id: number
  name: string
  gmv: number
  orders: number
  percentage: number
}

export interface GmvAnalysis {
  total_gmv: number
  total_orders: number
  top_stores: GmvTopStore[]
  top10_concentration: number
}

// Phase 3: Alerts types

export interface AlertStore {
  id: number
  name: string
  slug: string
  plan: string
}

export interface Alert {
  store: AlertStore
  type: 'sales_drop' | 'no_orders' | 'expiring_at_risk' | 'expiring_soon' | 'stagnant_sales' | 'low_catalog'
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  detail: string
}

export interface AlertsSummary {
  critical: number
  high: number
  medium: number
  low: number
}

export interface AlertsResponse {
  summary: AlertsSummary
  total: number
  alerts: Alert[]
}
